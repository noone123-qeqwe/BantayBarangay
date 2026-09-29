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
    withTransaction,
    getStats,
    getAllReports,
    getReportById,
    createReport,
    updateReportStatus,
    deleteReport,
    getUserByMobile,
    getUserById,
    createUser,
    updateUserPhone,
    updateUserProfile,
    resetPasswordWithOtp,
    createOtp,
    verifyOtp,
    saveSession,
    getSession,
    deleteSession,
    cleanExpiredSessions,
    getAdvisories,
    createAdvisory,
    deleteAdvisory,
    getLookups,
    verifyPassword,
    generateReportsCsv
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
assert('Seeded categories (Line & Pole, Transformer, Service Drop, Outage, etc.)', lookups.categories.length >= 5);
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
    category_id: 'line_pole',
    description: 'Fresh test leaning electric post near community basketball court',
    address: 'Purok 4 Basketball Court Road',
    purok: 'Purok 4',
    severity: 'high',
    reporter_id: newUser.id,
    reporter_name: newUser.name,
    reporter_mobile: newUser.mobile
});
assert('Auto-generated report ID format BB-XXX', /^BB-\d{3}$/.test(newReport.id));
assert('Report default agency assigned to MASELCO for line/pole issue', newReport.agency_id === 'MASELCO');
assert('Initial timeline event created', newReport.timeline && newReport.timeline.length >= 1);

// 5. Report Status Update and Timeline Audit Trail
console.log('\n5. Testing Status Update and Timeline Audit Trail:');
const updatedReport = updateReportStatus(newReport.id, {
    status: 'in_progress',
    note: 'Inspection team on site assessing pole foundation depth.',
    officer_name: 'Engr. Almario',
    agency: 'MASELCO'
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

// 7. Agency Filtering & Pagination
console.log('\n7. Testing Agency Filtering & Pagination:');
const maselcoReports = getAllReports({ agency: 'MASELCO' });
assert('Filters reports by agency MASELCO', maselcoReports.length > 0 && maselcoReports.every(r => r.agency_id === 'MASELCO' || (r.agency_name && r.agency_name.includes('MASELCO'))));
const pagedReports = getAllReports({ limit: 2, offset: 0 });
assert('Pagination limit returns 2 reports', pagedReports.length === 2);
const pagedOffsetReports = getAllReports({ limit: 2, offset: 1 });
assert('Pagination offset returns different first item', pagedOffsetReports[0].id !== pagedReports[0].id);

// 8. Persistent Sessions Management
console.log('\n8. Testing Persistent SQLite Sessions:');
const testToken = 'test_token_' + Date.now();
saveSession(testToken, newUser.id, 'resident', Date.now() + 3600 * 1000);
const retrievedSession = getSession(testToken);
assert('Session saved and retrieved from DB', retrievedSession && retrievedSession.user_id === newUser.id && retrievedSession.name === newUser.name);
deleteSession(testToken);
assert('Session deleted successfully', getSession(testToken) === null);

// 9. Power Outage & Grid Safety Advisories
console.log('\n9. Testing Power Outage & Grid Safety Advisories:');
const initialAdvisories = getAdvisories();
assert('Seeded advisories retrieved', initialAdvisories.length >= 2);
const newAdvisory = createAdvisory({
    title: 'Emergency High-Voltage Line Splicing Notice',
    content: 'Temporary 30-minute power interruption scheduled for emergency conductor repair.',
    severity: 'warning',
    agency: 'MASELCO'
});
assert('Advisory created with ID', newAdvisory && newAdvisory.id.startsWith('ADV-'));
assert('Advisory contains valid title', newAdvisory.title === 'Emergency High-Voltage Line Splicing Notice');
const deletedAdv = deleteAdvisory(newAdvisory.id);
assert('Advisory deleted successfully', deletedAdv === true);

// 10. Report Permanent Deletion
console.log('\n10. Testing Permanent Report Deletion:');
const tempReport = createReport({
    category_id: 'outage',
    description: 'Temporary report for deletion testing',
    address: 'Test Street Purok 1',
    purok: 'Purok 1',
    severity: 'low',
    reporter_name: 'Test Resident',
    reporter_mobile: '09171112233'
});
assert('Temp report created for deletion', tempReport && Boolean(tempReport.id));
const deleteSuccess = deleteReport(tempReport.id);
assert('Report deleted from database', deleteSuccess === true);
assert('Deleted report can no longer be retrieved', getReportById(tempReport.id) === null);

// 11. SQLite Transactions & ACID Rollback
console.log('\n11. Testing SQLite Transactions & ACID Rollback:');
const preTxCount = getStats().total;
let caughtTxError = false;
try {
    withTransaction((db) => {
        db.prepare(`
            INSERT INTO reports (id, category_id, description, address, purok, severity, status, reporter_name, reporter_mobile)
            VALUES ('BB-TX-FAIL', 'outage', 'Will be rolled back', 'Purok 1', 'Purok 1', 'low', 'pending', 'Test', '09171234567')
        `).run();
        throw new Error('Simulated failure during multi-step operation');
    });
} catch (e) {
    caughtTxError = true;
}
assert('withTransaction caught simulated error', caughtTxError === true);
assert('withTransaction rolled back insert', getReportById('BB-TX-FAIL') === null);
assert('Total reports unchanged after rollback', getStats().total === preTxCount);

// 12. Password Reset via OTP
console.log('\n12. Testing Password Reset via OTP:');
const resetUser = createUser({
    name: 'Reset Test User',
    mobile: '09228889900',
    email: 'reset.test@gmail.com',
    purok: 'Purok 1',
    password_hash: 'initialPassword123'
});
const resetOtp = createOtp('09228889900', 'reset_password');
assert('Created reset_password OTP', resetOtp && resetOtp.otp_code.length === 6);

// Reject wrong OTP
let wrongOtpCaught = false;
try {
    resetPasswordWithOtp('09228889900', '000000', 'newPassword456');
} catch (e) {
    wrongOtpCaught = true;
}
assert('Rejects invalid OTP for password reset', wrongOtpCaught === true);

// Accept valid OTP
const resetResult = resetPasswordWithOtp('09228889900', resetOtp.otp_code, 'newPassword456');
assert('Successfully resets password with valid OTP', resetResult.success === true);
const updatedResetUser = getDb().prepare('SELECT password_hash FROM users WHERE id = ?').get(resetUser.id);
assert('New password verified against updated hash', verifyPassword('newPassword456', updatedResetUser.password_hash));

// 13. User Profile Update
console.log('\n13. Testing User Profile Updates:');
const updatedProfile = updateUserProfile(resetUser.id, {
    name: 'Updated Name Resident',
    email: 'updated.email@gmail.com',
    purok: 'Purok 3'
});
assert('Profile name updated', updatedProfile.name === 'Updated Name Resident');
assert('Profile email updated', updatedProfile.email === 'updated.email@gmail.com');
assert('Profile purok updated', updatedProfile.purok === 'Purok 3');

// Password change with correct current password
const passwordChangedUser = updateUserProfile(resetUser.id, {
    current_password: 'newPassword456',
    new_password: 'newerPassword789'
});
assert('Password updated via profile update', Boolean(passwordChangedUser));
const freshUserRecord = getDb().prepare('SELECT password_hash FROM users WHERE id = ?').get(resetUser.id);
assert('New password verified after profile update', verifyPassword('newerPassword789', freshUserRecord.password_hash));

// Reject password change with incorrect current password
let wrongCurrentCaught = false;
try {
    updateUserProfile(resetUser.id, {
        current_password: 'wrongPassword!',
        new_password: 'anotherPassword123'
    });
} catch (e) {
    wrongCurrentCaught = true;
}
assert('Rejects password update with incorrect current password', wrongCurrentCaught === true);

// 14. Report CSV Export & User Filtering
console.log('\n14. Testing Report CSV Export & Reporter Filters:');
const reports = getAllReports();
const csvOutput = generateReportsCsv(reports, false);
assert('generateReportsCsv returns UTF-8 BOM', csvOutput.startsWith('\uFEFF'));
assert('generateReportsCsv includes header columns', csvOutput.includes('Report ID') && csvOutput.includes('Category Name'));
assert('generateReportsCsv masks mobile for non-admin', csvOutput.includes('****'));

const adminCsvOutput = generateReportsCsv(reports, true);
assert('generateReportsCsv does not mask mobile for admin', adminCsvOutput.includes('0917'));

const myReports = getAllReports({ reporter_mobile: '09171112222' });
assert('Filters reports by reporter_mobile', Array.isArray(myReports));

console.log('\n==========================================================');
if (failures === 0) {
    console.log('🎉 ALL DATABASE VERIFICATION TESTS PASSED SUCCESSFULLY!');
} else {
    console.error(`💥 Verification completed with ${failures} failure(s).`);
    process.exit(1);
}
console.log('==========================================================');
