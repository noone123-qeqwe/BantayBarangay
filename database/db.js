// ==========================================================
// BANTAYBARANGAY DATABASE ACCESS LAYER (node:sqlite)
// ==========================================================

const { DatabaseSync } = require('node:sqlite');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const DB_PATH = process.env.BANTAYBARANGAY_DB_PATH
    ? path.resolve(process.env.BANTAYBARANGAY_DB_PATH)
    : path.join(__dirname, 'bantaybarangay.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const SEED_PATH = path.join(__dirname, 'seed.sql');

let dbInstance = null;

const REPORT_STATUSES = new Set(['pending', 'under_review', 'in_progress', 'resolved', 'dismissed']);
const REPORT_SEVERITIES = new Set(['low', 'medium', 'high', 'urgent']);
const OTP_PURPOSES = new Set(['registration', 'login', 'reset_password']);

function normalizeMobile(mobile) {
    const digits = String(mobile || '').replace(/\D/g, '');
    const normalized = digits.startsWith('63') ? `0${digits.slice(2)}` : digits;
    if (!/^09\d{9}$/.test(normalized)) {
        throw new Error('Enter a valid Philippine mobile number in 09XXXXXXXXX or +63 9XXXXXXXXX format.');
    }
    return normalized;
}

function requireText(value, field, maxLength) {
    const text = String(value || '').trim();
    if (!text) throw new Error(`${field} is required.`);
    if (text.length > maxLength) throw new Error(`${field} must not exceed ${maxLength} characters.`);
    return text;
}

function optionalText(value, field, maxLength) {
    if (value === undefined || value === null || value === '') return null;
    return requireText(value, field, maxLength);
}

function assertLookupExists(table, id, field) {
    if (!id) return;
    const validTables = new Set(['categories', 'puroks', 'agencies']);
    if (!validTables.has(table)) throw new Error('Invalid lookup table.');
    const exists = getDb().prepare(`SELECT 1 FROM ${table} WHERE id = ?`).get(id);
    if (!exists) throw new Error(`Unknown ${field}.`);
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, storedHash) {
    if (!password || !storedHash || !storedHash.startsWith('scrypt$')) return false;
    const [, salt, expectedHash] = storedHash.split('$');
    if (!salt || !expectedHash) return false;
    const actualHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return actualHash.length === expectedHash.length
        && crypto.timingSafeEqual(Buffer.from(actualHash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

/**
 * Get or initialize the active SQLite database connection
 */
function getDb() {
    if (!dbInstance) {
        dbInstance = new DatabaseSync(DB_PATH);
        // Enable foreign key constraints and WAL mode for better concurrency
        dbInstance.exec('PRAGMA foreign_keys = ON;');
        dbInstance.exec('PRAGMA journal_mode = WAL;');
    }
    return dbInstance;
}

/**
 * Initialize the database tables from schema.sql and seed data from seed.sql
 */
function initDb(forceFresh = false) {
    const db = getDb();
    
    if (forceFresh) {
        // Drop existing tables in correct dependency order
        db.exec(`
            DROP TABLE IF EXISTS report_timeline;
            DROP TABLE IF EXISTS reports;
            DROP TABLE IF EXISTS verification_otps;
            DROP TABLE IF EXISTS users;
            DROP TABLE IF EXISTS puroks;
            DROP TABLE IF EXISTS categories;
            DROP TABLE IF EXISTS agencies;
        `);
    }

    // Read and execute schema.sql
    if (fs.existsSync(SCHEMA_PATH)) {
        const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
        db.exec(schemaSql);
    }

    // Read and execute seed.sql
    if (fs.existsSync(SEED_PATH)) {
        const seedSql = fs.readFileSync(SEED_PATH, 'utf-8');
        db.exec(seedSql);
    }

    // Earlier demo databases used placeholder hashes. Upgrade only those known
    // seed records so normal logins remain possible without retaining plaintext.
    const legacyUsers = db.prepare("SELECT id, role FROM users WHERE password_hash LIKE 'pbkdf2_%_hash_demo'").all();
    const updatePassword = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');
    for (const user of legacyUsers) {
        updatePassword.run(hashPassword(user.role === 'admin' ? 'admin123' : 'resident123'), user.id);
    }
    // Keep the seeded admin record aligned with the browser demo account after
    // upgrading an existing prototype database.
    db.prepare(`
        UPDATE users SET mobile = '09205550199'
        WHERE id = 1 AND name = 'Officer Renato Bautista' AND mobile = '09989876543'
    `).run();

    return {
        success: true,
        dbPath: DB_PATH,
        message: 'BantayBarangay database initialized successfully.'
    };
}

/**
 * Get system summary metrics and counts
 */
function getStats() {
    const db = getDb();
    const total = db.prepare('SELECT COUNT(*) as count FROM reports').get().count;
    const pending = db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'").get().count;
    const underReview = db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'under_review'").get().count;
    const inProgress = db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'in_progress'").get().count;
    const resolved = db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'resolved'").get().count;
    const dismissed = db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'dismissed'").get().count;

    const byCategory = db.prepare(`
        SELECT c.id, c.name, c.icon, COUNT(r.id) as count
        FROM categories c
        LEFT JOIN reports r ON c.id = r.category_id
        GROUP BY c.id, c.name, c.icon
        ORDER BY count DESC
    `).all();

    const byPurok = db.prepare(`
        SELECT purok, COUNT(*) as count
        FROM reports
        GROUP BY purok
        ORDER BY count DESC
    `).all();

    return {
        total,
        pending,
        under_review: underReview,
        in_progress: inProgress,
        resolved,
        dismissed,
        active: pending + underReview + inProgress,
        by_category: byCategory,
        by_purok: byPurok
    };
}

/**
 * Retrieve all reports with filtering options
 */
function getAllReports(filters = {}) {
    const db = getDb();
    let query = `
        SELECT 
            r.*, 
            c.name AS category_name, 
            c.icon AS category_icon,
            a.name AS agency_name,
            a.hotline AS agency_hotline
        FROM reports r
        LEFT JOIN categories c ON r.category_id = c.id
        LEFT JOIN agencies a ON r.agency_id = a.id
        WHERE 1=1
    `;
    const params = [];

    if (filters.status && filters.status !== 'all') {
        query += ' AND r.status = ?';
        params.push(filters.status);
    }
    if (filters.category && filters.category !== 'all') {
        query += ' AND r.category_id = ?';
        params.push(filters.category);
    }
    if (filters.purok && filters.purok !== 'all') {
        query += ' AND r.purok = ?';
        params.push(filters.purok);
    }
    if (filters.search) {
        query += ' AND (r.id LIKE ? OR r.description LIKE ? OR r.address LIKE ? OR r.reporter_name LIKE ?)';
        const term = `%${filters.search}%`;
        params.push(term, term, term, term);
    }

    query += ' ORDER BY r.created_at DESC';

    const stmt = db.prepare(query);
    const reports = stmt.all(...params);

    // Attach latest timeline event to each report
    const timelineStmt = db.prepare(`
        SELECT * FROM report_timeline WHERE report_id = ? ORDER BY created_at DESC
    `);

    return reports.map(report => ({
        ...report,
        timeline: timelineStmt.all(report.id)
    }));
}

/**
 * Retrieve single report by ID with full timeline
 */
function getReportById(id) {
    const db = getDb();
    const stmt = db.prepare(`
        SELECT 
            r.*, 
            c.name AS category_name, 
            c.icon AS category_icon,
            a.name AS agency_name,
            a.hotline AS agency_hotline,
            a.email AS agency_email,
            a.jurisdiction AS agency_jurisdiction
        FROM reports r
        LEFT JOIN categories c ON r.category_id = c.id
        LEFT JOIN agencies a ON r.agency_id = a.id
        WHERE r.id = ?
    `);
    const report = stmt.get(id);
    if (!report) return null;

    const timelineStmt = db.prepare(`
        SELECT * FROM report_timeline WHERE report_id = ? ORDER BY created_at ASC
    `);
    report.timeline = timelineStmt.all(id);

    return report;
}

/**
 * Generate next report tracking ID (e.g. 'BB-005')
 */
function generateReportId() {
    const db = getDb();
    const rows = db.prepare("SELECT id FROM reports WHERE id GLOB 'BB-[0-9]*'").all();
    const highest = rows.reduce((max, row) => {
        const match = row.id.match(/^BB-(\d+)$/);
        return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
    const nextNum = highest + 1;
    return `BB-${String(nextNum).padStart(3, '0')}`;
}

/**
 * Create a new infrastructure report
 */
function createReport(data) {
    const db = getDb();
    const categoryId = requireText(data.category_id, 'Category', 64);
    const description = requireText(data.description, 'Description', 2000);
    const address = requireText(data.address, 'Location address', 500);
    const purok = data.purok || 'Purok 1';
    const severity = data.severity || 'medium';
    const reporterName = optionalText(data.reporter_name, 'Reporter name', 120) || 'Resident';
    const reporterMobile = data.reporter_mobile ? normalizeMobile(data.reporter_mobile) : '09171234567';
    const latitude = data.latitude === undefined || data.latitude === null ? 14.5995 : Number(data.latitude);
    const longitude = data.longitude === undefined || data.longitude === null ? 120.9842 : Number(data.longitude);
    if (!REPORT_SEVERITIES.has(severity)) throw new Error('Invalid report severity.');
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        throw new Error('Location coordinates are invalid.');
    }
    assertLookupExists('categories', categoryId, 'category');
    assertLookupExists('puroks', purok, 'purok');
    if (data.agency_id) assertLookupExists('agencies', data.agency_id, 'agency');

    const id = data.id ? requireText(data.id, 'Report ID', 64) : generateReportId();
    
    // Auto-assign default agency based on category if not explicitly provided
    let agencyId = data.agency_id;
    if (!agencyId) {
        const cat = db.prepare('SELECT default_agency FROM categories WHERE id = ?').get(categoryId);
        if (cat) agencyId = cat.default_agency;
    }

    const insertStmt = db.prepare(`
        INSERT INTO reports (
            id, category_id, description, photo_url, latitude, longitude,
            address, purok, severity, status, agency_id, reporter_id,
            reporter_name, reporter_mobile, created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
    `);

    insertStmt.run(
        id,
        categoryId,
        description,
        optionalText(data.photo_url, 'Photo URL', 2048),
        latitude,
        longitude,
        address,
        purok,
        severity,
        data.status || 'pending',
        agencyId || 'BARANGAY',
        data.reporter_id || null,
        reporterName,
        reporterMobile
    );

    // Insert initial timeline entry
    const timelineStmt = db.prepare(`
        INSERT INTO report_timeline (report_id, status, note, officer_name, agency, created_at)
        VALUES (?, 'pending', 'Report filed via BantayBarangay system.', ?, ?, CURRENT_TIMESTAMP)
    `);
    timelineStmt.run(
        id,
        reporterName,
        'Barangay Resident Portal'
    );

    return getReportById(id);
}

/**
 * Update report status and append timeline note
 */
function updateReportStatus(id, updateData) {
    const db = getDb();
    const report = getReportById(id);
    if (!report) throw new Error(`Report ${id} not found.`);

    const newStatus = updateData.status || report.status;
    const newAgency = updateData.agency_id || report.agency_id;
    if (!REPORT_STATUSES.has(newStatus)) throw new Error('Invalid report status.');
    if (updateData.agency_id) assertLookupExists('agencies', updateData.agency_id, 'agency');
    const note = optionalText(updateData.note, 'Timeline note', 1000) || `Status updated to ${newStatus}`;
    const officerName = optionalText(updateData.officer_name, 'Officer name', 120) || 'Barangay Officer';
    const agencyName = optionalText(updateData.agency, 'Agency name', 160) || 'Barangay Maintenance';

    const updateStmt = db.prepare(`
        UPDATE reports 
        SET status = ?, agency_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);
    updateStmt.run(newStatus, newAgency, id);

    const timelineStmt = db.prepare(`
        INSERT INTO report_timeline (report_id, status, note, officer_name, agency, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    timelineStmt.run(id, newStatus, note, officerName, agencyName);

    return getReportById(id);
}

/**
 * Lookup user by Philippine mobile number (e.g. '09171234567')
 */
function getUserByMobile(mobile) {
    const db = getDb();
    const cleanMobile = normalizeMobile(mobile);
    const stmt = db.prepare('SELECT * FROM users WHERE mobile = ?');
    return stmt.get(cleanMobile);
}

/**
 * Register a new user
 */
function createUser(userData) {
    const db = getDb();
    const cleanMobile = normalizeMobile(userData.mobile);
    const name = requireText(userData.name, 'Name', 120);
    if (userData.role && userData.role !== 'resident') throw new Error('Public registration can only create resident accounts.');
    if (userData.password_hash && String(userData.password_hash).length < 8) throw new Error('Password must be at least 8 characters.');
    const purok = userData.purok || 'Purok 1';
    assertLookupExists('puroks', purok, 'purok');

    const existing = getUserByMobile(cleanMobile);
    if (existing) {
        throw new Error(`Mobile number ${cleanMobile} is already registered.`);
    }

    const stmt = db.prepare(`
        INSERT INTO users (name, mobile, email, purok, role, password_hash, phone_verified, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const result = stmt.run(
        name,
        cleanMobile,
        userData.email || null,
        purok,
        'resident',
        hashPassword(userData.password_hash || crypto.randomBytes(24).toString('hex')),
        userData.phone_verified ? 1 : 1 // default verified after OTP
    );

    return db.prepare('SELECT id, name, mobile, email, purok, role, phone_verified, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
}

/**
 * Update user phone/mobile number
 */
function updateUserPhone(userId, newMobile) {
    const db = getDb();
    const cleanMobile = normalizeMobile(newMobile);
    const existing = db.prepare('SELECT id FROM users WHERE mobile = ? AND id != ?').get(cleanMobile, userId);
    if (existing) {
        throw new Error(`Mobile number ${cleanMobile} is already registered to another user.`);
    }
    db.prepare('UPDATE users SET mobile = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cleanMobile, userId);
    return db.prepare('SELECT id, name, mobile, email, purok, role, phone_verified FROM users WHERE id = ?').get(userId);
}

/**
 * Generate and stage an SMS OTP for phone verification
 */
function createOtp(mobile, purpose = 'registration') {
    const db = getDb();
    const cleanMobile = normalizeMobile(mobile);
    if (!OTP_PURPOSES.has(purpose)) throw new Error('Invalid OTP purpose.');

    // Generate 6-digit random code
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    // 5 minutes expiry as ISO string
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const stmt = db.prepare(`
        INSERT INTO verification_otps (mobile, otp_code, purpose, expires_at, is_verified, created_at)
        VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
    `);
    const result = stmt.run(cleanMobile, otpCode, purpose, expiresAt);

    return {
        id: result.lastInsertRowid,
        mobile: cleanMobile,
        otp_code: otpCode, // In production this would be sent via SMS gateway like Semaphore/Twilio
        purpose,
        expires_at: expiresAt
    };
}

/**
 * Verify submitted OTP code
 */
function verifyOtp(mobile, otpCode, purpose = 'registration') {
    const db = getDb();
    const cleanMobile = normalizeMobile(mobile);
    if (!OTP_PURPOSES.has(purpose)) return { valid: false, error: 'Invalid OTP purpose.' };

    const stmt = db.prepare(`
        SELECT * FROM verification_otps
        WHERE mobile = ? AND purpose = ? AND is_verified = 0
        ORDER BY created_at DESC LIMIT 1
    `);
    const record = stmt.get(cleanMobile, purpose);

    if (!record) {
        return { valid: false, error: 'No pending OTP verification found for this phone number.' };
    }

    // Check expiry
    const expiryTime = new Date(record.expires_at).getTime();
    if (Date.now() > expiryTime) {
        return { valid: false, error: 'The verification code has expired. Please request a new one.' };
    }

    if (record.otp_code !== otpCode.trim()) {
        return { valid: false, error: 'Incorrect verification code. Please check SMS and try again.' };
    }

    // Mark as verified
    db.prepare('UPDATE verification_otps SET is_verified = 1 WHERE id = ?').run(record.id);

    return { valid: true, message: 'Phone number verified successfully.' };
}

/**
 * Get lookup data for forms (categories, puroks, agencies)
 */
function getLookups() {
    const db = getDb();
    return {
        categories: db.prepare('SELECT * FROM categories ORDER BY name ASC').all(),
        puroks: db.prepare('SELECT * FROM puroks ORDER BY id ASC').all(),
        agencies: db.prepare('SELECT * FROM agencies ORDER BY name ASC').all()
    };
}

module.exports = {
    getDb,
    initDb,
    getStats,
    getAllReports,
    getReportById,
    createReport,
    updateReportStatus,
    getUserByMobile,
    createUser,
    updateUserPhone,
    createOtp,
    verifyOtp,
    getLookups
    ,normalizeMobile
    ,verifyPassword
};
