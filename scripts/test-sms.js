#!/usr/bin/env node
// ==========================================================
// BantayBarangay — SMS Gateway Connectivity Tester
// Usage: node scripts/test-sms.js [phoneNumber] [message]
// Example: node scripts/test-sms.js 09171234567 "Hello from BantayBarangay"
// ==========================================================

const fs = require('node:fs');
const path = require('node:path');

// 1. Load .env file
(function loadEnv() {
    const envPath = path.join(__dirname, '..', '.env');
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

// Import server SMS helpers
const { sendSms, toE164 } = require('../server.js');

const targetNumber = process.argv[2] || process.env.MASELCO_NOTIFY_NUMBER || '';
const testMessage = process.argv[3] || `[BantayBarangay Test] SMS gateway verification at ${new Date().toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila' })}.`;

console.log('==========================================================');
console.log('📱 BantayBarangay SMS Gateway Diagnostic Tool');
console.log('==========================================================');

const isSmsEnabled = (process.env.SMS_ENABLED || 'false').toLowerCase() === 'true';
const gatewayUrl = process.env.SMS_GATEWAY_URL || 'https://api.sms-gate.app/3rdparty/v1/messages';
const login = process.env.SMS_GATEWAY_LOGIN || '';
const password = process.env.SMS_GATEWAY_PASSWORD || '';
const token = process.env.SMS_GATEWAY_TOKEN || '';
const deviceId = process.env.SMS_GATEWAY_DEVICE_ID || '';
const simNumber = process.env.SMS_GATEWAY_SIM_NUMBER || 'auto (default SMS SIM)';
const textbeeKey = process.env.TEXTBEE_API_KEY || '';

console.log(`• SMS_ENABLED:            ${isSmsEnabled}`);
console.log(`• SMS_GATEWAY_URL:        ${gatewayUrl}`);
console.log(`• SMS_GATEWAY_LOGIN:      ${login ? login : '(not set)'}`);
console.log(`• SMS_GATEWAY_PASSWORD:   ${password ? '********' : '(not set)'}`);
console.log(`• SMS_GATEWAY_TOKEN:      ${token ? '********' : '(not set)'}`);
console.log(`• SMS_GATEWAY_DEVICE_ID:  ${deviceId ? deviceId : '(auto/default)'}`);
console.log(`• SMS_GATEWAY_SIM_NUMBER: ${simNumber}`);
if (textbeeKey && textbeeKey !== 'your_api_key_here') {
    console.log(`• TEXTBEE_API_KEY (back): ${textbeeKey.slice(0, 7)}...`);
}
console.log('----------------------------------------------------------');

if (!targetNumber) {
    console.log('ℹ️  No phone number specified.');
    console.log('Usage:');
    console.log('  node scripts/test-sms.js <mobileNumber> [customMessage]');
    console.log('Example:');
    console.log('  node scripts/test-sms.js 09171234567 "Hello from BantayBarangay"');
    process.exit(0);
}

const formattedRecipient = toE164(targetNumber);

console.log(`📤 Recipient: ${targetNumber} → E.164: ${formattedRecipient}`);
console.log(`💬 Message:   "${testMessage}"`);
console.log('⏳ Dispatching request to SMS gateway...');

(async () => {
    try {
        const result = await sendSms(formattedRecipient, testMessage);
        console.log('----------------------------------------------------------');
        if (result.success) {
            console.log('✅ SUCCESS: SMS successfully submitted to gateway!');
            console.log('Response Details:', JSON.stringify(result.data || {}, null, 2));
            process.exitCode = 0;
        } else {
            console.error('❌ FAILED: Gateway rejected message.');
            console.error('Error Message:', result.error);
            process.exitCode = 1;
        }
    } catch (err) {
        console.error('💥 UNEXPECTED EXCEPTION:', err.message);
        process.exitCode = 1;
    }
})();
