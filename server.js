// ==========================================================
// BANTAYBARANGAY HTTP & REST API SERVER
// Built with native Node.js (zero external dependencies)
// ==========================================================

const http = require('node:http');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');

const db = require('./database/db.js');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const sessions = new Map();

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
    '.ttf': 'font/ttf'
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
function serveStatic(req, res, pathname) {
    // Default routes
    let safePath = pathname;
    if (safePath === '/' || safePath === '') {
        safePath = '/index.html';
    } else if (safePath === '/resident' || safePath === '/resident/') {
        safePath = '/resident/index.html';
    } else if (safePath === '/admin' || safePath === '/admin/') {
        safePath = '/admin/index.html';
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

        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache'
        });
        fs.createReadStream(filePath).pipe(res);
    });
}

/**
 * Main HTTP Request Handler
 */
const server = http.createServer(async (req, res) => {
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
            // Health check
            if (pathname === '/api/health' && req.method === 'GET') {
                return sendJson(res, 200, {
                    status: 'online',
                    app: 'BantayBarangay API',
                    version: '1.0.0',
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
                    // Demo codes are intentionally available only outside production.
                    if (!IS_PRODUCTION) response.demo_otp = otp.otp_code;
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

            // Login with Philippine Mobile
            if (pathname === '/api/auth/login' && req.method === 'POST') {
                const body = await parseBody(req);
                if (!body.mobile) {
                    return sendJson(res, 400, { success: false, error: 'Mobile number is required.' });
                }
                const user = db.getUserByMobile(body.mobile);
                if (!user) {
                    return sendJson(res, 404, { success: false, error: 'Account not found with this mobile number.' });
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
        serveStatic(req, res, pathname);

    } catch (err) {
        console.error('Server error:', err);
        sendJson(res, 500, { success: false, error: 'Internal Server Error' });
    }
});

// Ensure DB is initialized before starting
db.initDb(false);

if (require.main === module) {
    server.listen(PORT, () => {
        console.log('==========================================================');
        console.log(`🚀 BantayBarangay Server running at http://localhost:${PORT}`);
        console.log(`   • Resident Portal:   http://localhost:${PORT}/resident`);
        console.log(`   • Admin Dashboard:   http://localhost:${PORT}/admin`);
        console.log(`   • REST API:          http://localhost:${PORT}/api/reports`);
        console.log(`   • Stats:             http://localhost:${PORT}/api/stats`);
        console.log('==========================================================');
    });
}

module.exports = server;
