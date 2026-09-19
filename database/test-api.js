// Automated API Server Endpoint Tests
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const testDbPath = path.join(__dirname, '.test-api-bantaybarangay.db');
process.env.BANTAYBARANGAY_DB_PATH = testDbPath;
for (const suffix of ['', '-wal', '-shm']) {
    fs.rmSync(`${testDbPath}${suffix}`, { force: true });
}
const server = require('../server.js');

const PORT = 3001; // use separate port for test
server.listen(PORT, async () => {
    let failures = 0;
    function assert(desc, condition) {
        if (condition) {
            console.log(`  ✅ PASS: ${desc}`);
        } else {
            console.error(`  ❌ FAIL: ${desc}`);
            failures++;
        }
    }

    function request(path, options = {}, body = null) {
        return new Promise((resolve, reject) => {
            const req = http.request({
                hostname: 'localhost',
                port: PORT,
                path,
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(options.headers || {})
                }
            }, res => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve({ status: res.statusCode, data: JSON.parse(data) });
                    } catch (e) {
                        resolve({ status: res.statusCode, raw: data });
                    }
                });
            });
            req.on('error', reject);
            if (body) req.write(JSON.stringify(body));
            req.end();
        });
    }

    console.log('🌐 Testing BantayBarangay REST API...\n');

    try {
        // 1. Health check
        const health = await request('/api/health');
        assert('GET /api/health returns status online', health.status === 200 && health.data.status === 'online');

        // 1b. Version check (v2.0)
        const versionRes = await request('/api/version');
        assert('GET /api/version returns version 2.0.0 and displayVersion v2.0', versionRes.status === 200 && versionRes.data.version === '2.0.0' && versionRes.data.displayVersion === 'v2.0');

        // 2. Stats endpoint
        const stats = await request('/api/stats');
        assert('GET /api/stats returns statistics', stats.status === 200 && stats.data.data.total >= 4);

        // 3. Reports list
        const reportsRes = await request('/api/reports');
        assert('GET /api/reports returns array of reports', reportsRes.status === 200 && Array.isArray(reportsRes.data.data));

        // 4. Create new report via API
        const createRes = await request('/api/reports', { method: 'POST' }, {
            category_id: 'drainage',
            description: 'Canal overflow on 5th street corner',
            address: '5th Street corner Narra',
            purok: 'Purok 2',
            severity: 'medium',
            reporter_name: 'Resident Pedro',
            reporter_mobile: '09181112222'
        });
        assert('POST /api/reports creates new report', createRes.status === 201 && createRes.data.data.id.startsWith('BB-'));
        const newReportId = createRes.data.data.id;

        const unauthenticatedPatch = await request(`/api/reports/${newReportId}`, { method: 'PATCH' }, { status: 'in_progress' });
        assert('PATCH /api/reports/:id rejects unauthenticated updates', unauthenticatedPatch.status === 401);

        const adminLogin = await request('/api/auth/login', { method: 'POST' }, {
            mobile: '09205550199', password: 'admin123'
        });
        assert('POST /api/auth/login issues an admin session token', adminLogin.status === 200 && Boolean(adminLogin.data.token));

        // 5. Update report status via API
        const patchRes = await request(`/api/reports/${newReportId}`, {
            method: 'PATCH', headers: { Authorization: `Bearer ${adminLogin.data.token}` }
        }, {
            status: 'in_progress',
            note: 'Maintenance team deployed with equipment.',
            officer_name: 'Officer Renato',
            agency: 'Barangay Maintenance & Quick Response'
        });
        assert('PATCH /api/reports/:id updates status', patchRes.status === 200 && patchRes.data.data.status === 'in_progress');

        const invalidReport = await request('/api/reports', { method: 'POST' }, {
            category_id: 'not-a-category', description: 'Invalid category test', address: 'Test address'
        });
        assert('POST /api/reports rejects invalid lookup values', invalidReport.status === 400);

        // 6. Send OTP
        const otpRes = await request('/api/auth/send-otp', { method: 'POST' }, {
            mobile: '09198887766',
            purpose: 'registration'
        });
        assert('POST /api/auth/send-otp returns demo code', otpRes.status === 200 && otpRes.data.demo_otp.length === 6);

        // 7. Verify OTP
        const verifyRes = await request('/api/auth/verify-otp', { method: 'POST' }, {
            mobile: '09198887766',
            otp_code: otpRes.data.demo_otp,
            purpose: 'registration'
        });
        assert('POST /api/auth/verify-otp succeeds with valid code', verifyRes.status === 200 && verifyRes.data.success === true);

        // 8. Login with Philippine Mobile
        const loginRes = await request('/api/auth/login', { method: 'POST' }, {
            mobile: '09171234567', password: 'resident123'
        });
        assert('POST /api/auth/login authenticates seeded resident Juan dela Cruz', loginRes.status === 200 && loginRes.data.user.name === 'Juan dela Cruz');

        const rejectedLogin = await request('/api/auth/login', { method: 'POST' }, {
            mobile: '09171234567'
        });
        assert('POST /api/auth/login rejects missing password', rejectedLogin.status === 401);

        console.log('\n==========================================================');
        if (failures === 0) {
            console.log('🎉 ALL REST API ENDPOINT TESTS PASSED SUCCESSFULLY!');
        } else {
            console.error(`💥 Completed with ${failures} failure(s).`);
        }
        console.log('==========================================================');
    } catch (err) {
        console.error('API Test Error:', err);
    } finally {
        server.close(() => process.exit(failures === 0 ? 0 : 1));
    }
});
