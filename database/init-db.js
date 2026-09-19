// ==========================================================
// BANTAYBARANGAY DATABASE INITIALIZER
// Run: node database/init-db.js [--force]
// ==========================================================

const { initDb, getStats, getAllReports } = require('./db.js');

const force = process.argv.includes('--force');

console.log('----------------------------------------------------------');
console.log('🏛️  BantayBarangay - Initializing SQLite Database');
console.log('----------------------------------------------------------');

try {
    const result = initDb(force);
    console.log(`✅ Success: ${result.message}`);
    console.log(`📁 Database location: ${result.dbPath}`);

    // Print summary stats
    const stats = getStats();
    console.log('\n📊 Database Summary Metrics:');
    console.log(`   • Total Reports:     ${stats.total}`);
    console.log(`   • Active Issues:     ${stats.active}`);
    console.log(`   • Pending:           ${stats.pending}`);
    console.log(`   • Under Review:      ${stats.under_review}`);
    console.log(`   • In Progress:       ${stats.in_progress}`);
    console.log(`   • Resolved:          ${stats.resolved}`);

    console.log('\n📋 Seeded Infrastructure Reports:');
    const reports = getAllReports();
    reports.forEach(r => {
        console.log(`   [${r.id}] ${r.category_icon || '📌'} ${r.category_name} (${r.status.toUpperCase()})`);
        console.log(`         Location: ${r.address} (${r.purok})`);
        console.log(`         Agency:   ${r.agency_name || r.agency_id}`);
        console.log(`         Reporter: ${r.reporter_name} (${r.reporter_mobile})`);
        console.log(`         Timeline: ${r.timeline.length} status milestone(s)\n`);
    });

    console.log('✨ BantayBarangay database is ready to use!');
    console.log('----------------------------------------------------------');
} catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
}
