// ==========================================================
// BANTAYBARANGAY HTTP & REST API SERVER
// Built with native Node.js (zero external dependencies)
// ==========================================================

const http = require('node:http');
const https = require('node:https');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');

const db = require('./database/db.js');

// ── .env loader (zero dependencies) ─────────────────────────
(function loadEnv() {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return;
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (key && !(key in process.env)) {
            process.env[key] = val;
        }
    }
})();

const PORT = process.env.PORT || 3000;
const ADMIN_PORT = process.env.ADMIN_PORT || 3001;
const ADMIN_URL = process.env.ADMIN_URL || `http://localhost:${ADMIN_PORT}`;
const RESIDENT_URL = process.env.RESIDENT_URL || `http://localhost:${PORT}`;
const PUBLIC_DIR = __dirname;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const sessions = new Map();

// ── TextBee.dev SMS Gateway ─────────────────────────────────
const TEXTBEE_API_KEY = process.env.TEXTBEE_API_KEY || '';
const TEXTBEE_DEVICE_ID = process.env.TEXTBEE_DEVICE_ID || '';
const SMS_ENABLED = (process.env.SMS_ENABLED || 'false').toLowerCase() === 'true';

/**
 * Send an SMS via TextBee.dev REST API
 * @param {string} recipient - E.164 formatted number (e.g. "+639171234567")
 * @param {string} message   - The SMS body text
 * @returns {Promise<{success: boolean, error?: string}>}
 */
function sendSmsViaTextBee(recipient, message) {
    return new Promise((resolve) => {
        if (!TEXTBEE_API_KEY || TEXTBEE_API_KEY === 'your_api_key_here') {
            console.warn('[SMS] TextBee API key not configured. SMS not sent.');
            return resolve({ success: false, error: 'SMS gateway not configured.' });
        }

        const payload = JSON.stringify({
            recipients: [recipient],
            message: message,
            ...(TEXTBEE_DEVICE_ID ? { deviceId: TEXTBEE_DEVICE_ID } : {})
        });

        const options = {
            hostname: 'api.textbee.dev',
            port: 443,
            path: '/api/v1/gateway/send-sms',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': TEXTBEE_API_KEY,
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        console.log(`[SMS] ✅ Sent to ${recipient}`);
                        resolve({ success: true, data });
                    } else {
                        console.error(`[SMS] ❌ TextBee error ${res.statusCode}:`, body);
                        resolve({ success: false, error: data.message || `TextBee returned ${res.statusCode}` });
                    }
                } catch {
                    console.error('[SMS] ❌ Failed to parse TextBee response:', body);
                    resolve({ success: false, error: 'Invalid response from SMS gateway.' });
                }
            });
        });

        req.on('error', (err) => {
            console.error('[SMS] ❌ Network error:', err.message);
            resolve({ success: false, error: `SMS network error: ${err.message}` });
        });

        req.setTimeout(10000, () => {
            req.destroy();
            resolve({ success: false, error: 'SMS gateway request timed out.' });
        });

        req.write(payload);
        req.end();
    });
}

/**
 * Convert a Philippine mobile number to E.164 format for TextBee
 * Input: "09171234567" → Output: "+639171234567"
 */
function toE164(mobile) {
    const digits = String(mobile || '').replace(/\D/g, '');
    if (digits.startsWith('0')) return '+63' + digits.slice(1);
    if (digits.startsWith('63')) return '+' + digits;
    if (digits.startsWith('9') && digits.length === 10) return '+63' + digits;
    return '+63' + digits;
}

// MIME types for static asset serving
const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
    '.apk': 'application/vnd.android.package-archive'
};

/**
 * Helper to send JSON responses
 */
function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=UTF-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(JSON.stringify(data));
}

function createSession(user) {
    const token = crypto.randomBytes(32).toString('base64url');
    const expiresAt = Date.now() + SESSION_TTL_MS;
    sessions.set(token, { userId: user.id, role: user.role, expiresAt });
    return { token, expires_at: new Date(expiresAt).toISOString() };
}

function requireAdmin(req) {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    const session = sessions.get(token);
    if (!session || session.expiresAt <= Date.now()) {
        if (token) sessions.delete(token);
        return null;
    }
    return session.role === 'admin' ? session : null;
}

/**
 * Helper to parse request body as JSON
 */
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
            // 5MB limit
            if (body.length > 5 * 1024 * 1024) {
                reject(new Error('Request body too large.'));
            }
        });
        req.on('end', () => {
            if (!body) return resolve({});
            try {
                resolve(JSON.parse(body));
            } catch (err) {
                reject(new Error('Invalid JSON body.'));
            }
        });
        req.on('error', reject);
    });
}

/**
 * Handle static file serving
 */
function serveStatic(req, res, pathname, isDedicatedAdmin = false) {
    // Default routes
    let safePath = pathname;
    if (isDedicatedAdmin) {
        if (safePath === '/' || safePath === '' || safePath === '/index.html') {
            safePath = '/admin/index.html';
        } else if (safePath === '/login' || safePath === '/login.html') {
            safePath = '/admin/login.html';
        } else if (safePath === '/admin' || safePath === '/admin/') {
            safePath = '/admin/index.html';
        } else if (safePath === '/admin/login' || safePath === '/admin/login.html') {
            safePath = '/admin/login.html';
        } else if (safePath.startsWith('/css/') || safePath.startsWith('/js/') || safePath.startsWith('/images/')) {
            safePath = '/admin' + safePath;
        }
    } else {
        if (safePath === '/' || safePath === '') {
            safePath = '/index.html';
        } else if (safePath === '/resident' || safePath === '/resident/') {
            safePath = '/resident/index.html';
        } else if (safePath === '/admin' || safePath === '/admin/' || safePath.startsWith('/admin/')) {
            const hostOnly = (req.headers.host || 'localhost').split(':')[0];
            const targetBase = process.env.ADMIN_URL || `http://${hostOnly}:${ADMIN_PORT}`;
            const targetUrl = targetBase.replace(/\/$/, '') + (safePath === '/admin' || safePath === '/admin/' ? '/' : safePath.replace(/^\/admin/, ''));
            res.writeHead(302, { Location: targetUrl });
            return res.end();
        }
    }

    let decodedPath;
    try {
        decodedPath = decodeURIComponent(safePath);
    } catch {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=UTF-8' });
        return res.end('Invalid path');
    }

    // Restrict static files to the public root and never expose database files.
    const filePath = path.resolve(PUBLIC_DIR, `.${decodedPath}`);
    const relativePath = path.relative(PUBLIC_DIR, filePath);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath) || /\.db(?:-|$)/i.test(decodedPath)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        return res.end('Access Denied');
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('404 Not Found');
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        const headers = {
            'Content-Type': contentType,
            'Cache-Control': (ext === '.html' || filePath.endsWith('sw.js'))
                ? 'no-cache, no-store, must-revalidate'
                : 'no-cache'
        };
        if (ext === '.apk') {
            headers['Content-Disposition'] = 'attachment; filename="BantayBarangay.apk"';
        }

        res.writeHead(200, headers);
        fs.createReadStream(filePath).pipe(res);
    });
}

/**
 * Factory for creating HTTP Request Handlers
 */
function createRequestHandler(isDedicatedAdmin = false) {
    return async (req, res) => {
        // Handle CORS preflight
        if (req.method === 'OPTIONS') {
            res.writeHead(204, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            });
            return res.end();
        }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;
    const query = Object.fromEntries(parsedUrl.searchParams);

    try {
        // ==========================================
        // REST API ROUTES (/api/*)
        // ==========================================
        if (pathname.startsWith('/api/')) {
            // Portal configuration endpoint (exposes cross-portal URLs for deployment)
            if (pathname === '/api/config' && req.method === 'GET') {
                const hostOnly = (req.headers.host || 'localhost').split(':')[0];
                return sendJson(res, 200, {
                    success: true,
                    data: {
                        adminUrl: process.env.ADMIN_URL || `http://${hostOnly}:${ADMIN_PORT}`,
                        residentUrl: process.env.RESIDENT_URL || `http://${hostOnly}:${PORT}`,
                        isDedicatedAdmin
                    }
                });
            }

            // App version check endpoint for auto-update detection
            if (pathname === '/api/version' && req.method === 'GET') {
                return sendJson(res, 200, {
                    success: true,
                    version: '2.0.0',
                    displayVersion: 'v2.0',
                    releaseName: 'Version 2.0 (Mobile Fullscreen & SMS Gateway)',
                    releaseDate: '2026-09-20',
                    timestamp: new Date().toISOString()
                });
            }

            // Health check
            if (pathname === '/api/health' && req.method === 'GET') {
                return sendJson(res, 200, {
                    status: 'online',
                    app: 'BantayBarangay API',
                    version: '2.0.0',
                    timestamp: new Date().toISOString()
                });
            }

            // Dashboard stats
            if (pathname === '/api/stats' && req.method === 'GET') {
                const stats = db.getStats();
                return sendJson(res, 200, { success: true, data: stats });
            }

            // Categories, Puroks, Agencies lookups
            if (pathname === '/api/lookups' && req.method === 'GET') {
                const lookups = db.getLookups();
                return sendJson(res, 200, { success: true, data: lookups });
            }

            // Reports collection (GET list / POST create)
            if (pathname === '/api/reports') {
                if (req.method === 'GET') {
                    const reports = db.getAllReports({
                        status: query.status,
                        category: query.category,
                        purok: query.purok,
                        search: query.search
                    });
                    return sendJson(res, 200, { success: true, count: reports.length, data: reports });
                }

                if (req.method === 'POST') {
                    const body = await parseBody(req);
                    try {
                        const newReport = db.createReport(body);
                        return sendJson(res, 201, { success: true, message: 'Report created successfully.', data: newReport });
                    } catch (err) {
                        // A device may retry an offline report after the server accepted it but
                        // before the client received the response. Treat that retry as delivered.
                        if (body.id && /UNIQUE constraint failed: reports\.id/i.test(err.message || '')) {
                            const existing = db.getReportById(body.id);
                            if (existing) {
                                return sendJson(res, 200, { success: true, message: 'Report was already received.', data: existing });
                            }
                        }
                        return sendJson(res, 400, { success: false, error: err.message });
                    }
                }
            }

            // Single report & status updates (/api/reports/:id)
            const reportMatch = pathname.match(/^\/api\/reports\/([A-Za-z0-9\-]+)$/);
            if (reportMatch) {
                const reportId = reportMatch[1];
                if (req.method === 'GET') {
                    const report = db.getReportById(reportId);
                    if (!report) {
                        return sendJson(res, 404, { success: false, error: `Report ${reportId} not found.` });
                    }
                    return sendJson(res, 200, { success: true, data: report });
                }

                if (req.method === 'PATCH') {
                    if (!requireAdmin(req)) {
                        return sendJson(res, 401, { success: false, error: 'Administrator authentication is required to update report status.' });
                    }
                    const body = await parseBody(req);
                    try {
                        const updated = db.updateReportStatus(reportId, body);
                        return sendJson(res, 200, { success: true, message: 'Report status updated.', data: updated });
                    } catch (err) {
                        return sendJson(res, 400, { success: false, error: err.message });
                    }
                }
            }

            // Send OTP
            if (pathname === '/api/auth/send-otp' && req.method === 'POST') {
                const body = await parseBody(req);
                try {
                    const otp = db.createOtp(body.mobile, body.purpose || 'registration');
                    const response = {
                        success: true,
                        message: `Verification code sent to ${otp.mobile}`,
                        mobile: otp.mobile,
                        expires_at: otp.expires_at
                    };

                    if (SMS_ENABLED && toE164(otp.mobile)) {
                        // Send real SMS via TextBee.dev
                        const smsBody = `[BantayBarangay] Your verification code is: ${otp.otp_code}. Valid for 5 minutes. Do not share this code.`;
                        const smsResult = await sendSmsViaTextBee(toE164(otp.mobile), smsBody);
                        if (!smsResult.success) {
                            response.sms_warning = 'Code generated but SMS delivery may be delayed.';
                            console.warn(`[SMS] Failed for ${otp.mobile}: ${smsResult.error}`);
                        }
                        response.sms_sent = smsResult.success;
                        if (!IS_PRODUCTION) {
                            response.demo_otp = otp.otp_code;
                        }
                    } else {
                        // Demo / development fallback — log to console
                        console.log(`[SMS-DEMO] OTP for ${otp.mobile}: ${otp.otp_code}`);
                        response.demo_otp = otp.otp_code;
                    }

                    return sendJson(res, 200, response);
                } catch (err) {
                    return sendJson(res, 400, { success: false, error: err.message });
                }
            }

            // Verify OTP
            if (pathname === '/api/auth/verify-otp' && req.method === 'POST') {
                const body = await parseBody(req);
                if (!body.mobile || !body.otp_code) {
                    return sendJson(res, 400, { success: false, error: 'Mobile and OTP code are required.' });
                }
                const result = db.verifyOtp(body.mobile, body.otp_code, body.purpose || 'registration');
                if (!result.valid) {
                    return sendJson(res, 400, { success: false, error: result.error });
                }
                return sendJson(res, 200, { success: true, message: result.message });
            }

            // Register Account
            if (pathname === '/api/auth/register' && req.method === 'POST') {
                const body = await parseBody(req);
                if (!body.name || !body.mobile || !body.password) {
                    return sendJson(res, 400, { success: false, error: 'Name, phone number, and password are required.' });
                }
                try {
                    const user = db.createUser({
                        name: body.name,
                        mobile: body.mobile,
                        email: body.email,
                        purok: body.purok,
                        password_hash: body.password
                    });
                    return sendJson(res, 201, {
                        success: true,
                        message: 'Account created successfully.',
                        user: {
                            id: user.id,
                            name: user.name,
                            mobile: user.mobile,
                            role: user.role,
                            purok: user.purok
                        }
                    });
                } catch (err) {
                    return sendJson(res, 400, { success: false, error: err.message });
                }
            }

            // Login with Philippine Mobile or Gmail / Email
            if (pathname === '/api/auth/login' && req.method === 'POST') {
                const body = await parseBody(req);
                const identifier = (body.email || body.mobile || '').trim();
                if (!identifier) {
                    return sendJson(res, 400, { success: false, error: 'Mobile number or Gmail address is required.' });
                }
                let user;
                if (identifier.includes('@')) {
                    user = db.getUserByEmail(identifier);
                    if (!user && (identifier.toLowerCase() === 'admin@gmail.com' || identifier.toLowerCase() === 'renato.admin@gmail.com')) {
                        user = db.getUserByMobile('09205550199') || db.getUserByMobile('09989876543');
                    }
                } else {
                    user = db.getUserByMobile(identifier);
                }
                if (!user) {
                    return sendJson(res, 404, { success: false, error: 'Account not found with this mobile or Gmail address.' });
                }
                if (!body.password || !db.verifyPassword(body.password, user.password_hash)) {
                    return sendJson(res, 401, { success: false, error: 'Incorrect password.' });
                }
                const session = createSession(user);
                return sendJson(res, 200, {
                    success: true,
                    message: `Welcome back, ${user.name}!`,
                    token: session.token,
                    expires_at: session.expires_at,
                    user: {
                        id: user.id,
                        name: user.name,
                        mobile: user.mobile,
                        email: user.email,
                        role: user.role,
                        purok: user.purok
                    }
                });
            }

            // Unmatched API endpoint
            return sendJson(res, 404, { success: false, error: 'API endpoint not found.' });
        }

        // ==========================================
        // STATIC FILE SERVING
        // ==========================================
        serveStatic(req, res, pathname, isDedicatedAdmin);

    } catch (err) {
        console.error('Server error:', err);
        sendJson(res, 500, { success: false, error: 'Internal Server Error' });
    }
    };
}

// Resident Portal & API Server (Port 3000)
const server = http.createServer(createRequestHandler(false));

// Dedicated Admin Command Portal Server (Port 3001)
const adminServer = http.createServer(createRequestHandler(true));
server.adminServer = adminServer;

// Ensure DB is initialized before starting
db.initDb(false);

const isStandalone = process.env.STANDALONE === 'true' || process.argv.includes('--standalone');

if (require.main === module) {
    server.listen(PORT, () => {
        console.log('==========================================================');
        console.log(`🚀 BantayBarangay Resident Server:  http://localhost:${PORT}`);
        console.log(`   • Citizen Portal:    http://localhost:${PORT}/resident`);
        console.log(`   • Citizen Login:     http://localhost:${PORT}/resident/auth.html`);
        console.log(`   • REST API:          http://localhost:${PORT}/api/reports`);
        if (isStandalone) {
            console.log(`   • Standalone Mode:   Citizen Service Only`);
            if (process.env.ADMIN_URL) {
                console.log(`   • Linked Admin URL:  ${process.env.ADMIN_URL}`);
            }
            console.log('==========================================================');
        }
    });

    if (!isStandalone) {
        adminServer.listen(ADMIN_PORT, () => {
            console.log(`🛡️  BantayBarangay Admin Server:     http://localhost:${ADMIN_PORT}`);
            console.log(`   • Admin Login:       http://localhost:${ADMIN_PORT}/login.html`);
            console.log(`   • Command Center:    http://localhost:${ADMIN_PORT}/`);
            console.log('==========================================================');
        });
    }
}

module.exports = server;
module.exports.createRequestHandler = createRequestHandler;
module.exports.serveStatic = serveStatic;
module.exports.adminServer = adminServer;
