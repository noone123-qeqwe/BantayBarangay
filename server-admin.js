// ==========================================================
// BANTAYBARANGAY DEDICATED ADMIN HTTP & REST API SERVER
// Built with native Node.js (zero external dependencies)
// ==========================================================

const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const db = require('./database/db.js');
const { createRequestHandler } = require('./server.js');

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

// On cloud hosting (Render, Railway, Heroku, etc.), process.env.PORT is provided.
// For local testing or standalone dev, falls back to ADMIN_PORT or 3001.
const PORT = process.env.PORT || process.env.ADMIN_PORT || 3001;

// Dedicated Admin Server instance (isDedicatedAdmin = true)
const adminApp = http.createServer(createRequestHandler(true));

// Ensure DB is initialized before starting
db.initDb(false);

if (require.main === module) {
    adminApp.listen(PORT, () => {
        console.log('==========================================================');
        console.log(`🛡️  BantayBarangay Admin Command Server running on port ${PORT}`);
        console.log(`   • Command Center:  http://localhost:${PORT}/`);
        console.log(`   • Admin Login:     http://localhost:${PORT}/login.html`);
        console.log(`   • REST API:        http://localhost:${PORT}/api/reports`);
        if (process.env.RESIDENT_URL) {
            console.log(`   • Resident Portal: ${process.env.RESIDENT_URL}`);
        }
        console.log('==========================================================');
    });
}

module.exports = adminApp;
