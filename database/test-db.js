// Automated verification of BantayBarangay SQLite Database
const fs = require('node:fs');
const path = require('node:path');
const testDbPath = path.join(__dirname, '.test-bantaybarangay.db');
process.env.BANTAYBARANGAY_DB_PATH = testDbPath;
for (const suffix of ['', '-wal', '-shm']) {
    fs.rmSync(`${testDbPath}${suffix}`, { force: true });
}

const {
    initDb,
    getDb,
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
} = require('./db.js');

initDb(false);

let failures = 0;
function assert(desc, condition) {
    if (condition) {
        console.log(`  ✅ PASS: ${desc}`);
    } else {
        console.error(`  ❌ FAIL: ${desc}`);
        failures++;
    }
}

console.log('🧪 Starting BantayBarangay Database Automated Verification...\n');

// 1. Stats and Lookup Check
console.log('1. Testing Stats and Lookups:');
const stats = getStats();
assert('Total reports count is >= 4', stats.total >= 4);
assert('Active reports equals pending + under_review + in_progress', stats.active === (stats.pending + stats.under_review + stats.in_progress));
const lookups = getLookups();
assert('Seeded agencies (DPWH, LGU, MASELCO, PNP, BARANGAY)', lookups.agencies.length >= 4);
assert('Seeded categories (Pothole, Electric, Drainage, Streetlight, Crime, etc.)', lookups.categories.length >= 6);
assert('Seeded puroks', lookups.puroks.length >= 5);

// 2. User & Philippine Mobile Operations
console.log('\n2. Testing User & Philippine Mobile Authentication:');
const adminUser = getUserByMobile('09205550199');
assert('Found admin Officer Renato Bautista', adminUser && adminUser.name === 'Officer Renato Bautista' && adminUser.role === 'admin');

const juan = getUserByMobile('+63 917 123 4567');
assert('Normalizes mobile from +63 to 09 format and finds Juan', juan && juan.name === 'Juan dela Cruz');
assert('Rejects malformed mobile numbers', (() => {
    try { getUserByMobile('12345'); return false; } catch { return true; }
})());

// Create a new resident user
const testMobile = '0955' + Math.floor(1000000 + Math.random() * 9000000);
const newUser = createUser({
    name: 'Test Resident Aling Nena',
    mobile: testMobile,
    email: 'aling.nena@example.com',
    purok: 'Purok 4',
    role: 'resident',
    password_hash: 'hash_test_123'
});
assert('Created new resident user with ID', newUser && newUser.id > 0);
assert('User mobile is normalized ' + testMobile, newUser.mobile === testMobile);
assert('New user passwords are stored as scrypt hashes', getDb().prepare('SELECT password_hash FROM users WHERE id = ?').get(newUser.id).password_hash.startsWith('scrypt$'));

// Duplicate mobile prevention
try {
    createUser({
        name: 'Impostor',
        mobile: testMobile,
        role: 'resident'
    });
    assert('Prevent duplicate mobile registration', false);
} catch (err) {
    assert('Prevent duplicate mobile registration (caught error)', err.message.includes('already registered'));
}

// Test updating user phone number
const updatedMobile = '0955' + Math.floor(1000000 + Math.random() * 9000000);
const changedUser = updateUserPhone(newUser.id, updatedMobile);
assert('Updated user phone number', changedUser && changedUser.mobile === updatedMobile);

// 3. OTP Staging and Verification
console.log('\n3. Testing SMS OTP Staging and Expiry:');
const otpRecord = createOtp(testMobile, 'registration');
assert('Generated 6-digit OTP', otpRecord && otpRecord.otp_code.length === 6);

const failVerify = verifyOtp(testMobile, '000000', 'registration');
assert('Rejects invalid OTP code', failVerify.valid === false);

const passVerify = verifyOtp(testMobile, otpRecord.otp_code, 'registration');
assert('Accepts correct OTP code', passVerify.valid === true);

const reusedVerify = verifyOtp(testMobile, otpRecord.otp_code, 'registration');
assert('Cannot reuse already verified OTP', reusedVerify.valid === false);

// 4. Report Creation and Auto-ID
console.log('\n4. Testing Report Filing & Auto-ID:');
const newReport = createReport({
    category_id: 'pothole',
    description: 'Fresh test pothole near community basketball court',
    address: 'Purok 4 Basketball Court Road',
    purok: 'Purok 4',
    severity: 'high',
    reporter_id: newUser.id,
    reporter_name: newUser.name,
    reporter_mobile: newUser.mobile
});
assert('Auto-generated report ID format BB-XXX', /^BB-\d{3}$/.test(newReport.id));
assert('Report default agency assigned to DPWH for pothole', newReport.agency_id === 'DPWH');
assert('Initial timeline event created', newReport.timeline && newReport.timeline.length >= 1);

// 5. Report Status Update and Timeline Audit Trail
console.log('\n5. Testing Status Update and Timeline Audit Trail:');
const updatedReport = updateReportStatus(newReport.id, {
    status: 'in_progress',
    note: 'Inspection team on site assessing road foundation depth.',
    officer_name: 'Engr. Tolentino',
    agency: 'DPWH'
});
assert('Status updated to in_progress', updatedReport.status === 'in_progress');
assert('Timeline contains 2 audit records', updatedReport.timeline.length === 2);
assert('Latest timeline entry has correct note', updatedReport.timeline[1].note.includes('Inspection team on site'));
try {
    updateReportStatus(newReport.id, { status: 'not-a-status' });
    assert('Reject invalid report status', false);
} catch (err) {
    assert('Reject invalid report status', err.message.includes('Invalid report status'));
}

// 6. Query Filtering
console.log('\n6. Testing Report Filtering:');
const inProgressReports = getAllReports({ status: 'in_progress' });
assert('Filters reports by status', inProgressReports.every(r => r.status === 'in_progress'));
const purok4Reports = getAllReports({ purok: 'Purok 4' });
assert('Filters reports by purok', purok4Reports.some(r => r.id === newReport.id));

console.log('\n==========================================================');
if (failures === 0) {
    console.log('🎉 ALL DATABASE VERIFICATION TESTS PASSED SUCCESSFULLY!');
} else {
    console.error(`💥 Verification completed with ${failures} failure(s).`);
    process.exit(1);
}
console.log('==========================================================');
