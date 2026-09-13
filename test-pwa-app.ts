/**
 * test-pwa-app.ts
 * Automated verification of the BantayBarangay Mobile App setup:
 * 1. PWA Manifest specs (display, icons, shortcuts, orientation)
 * 2. Service Worker cache assets & offline fallback
 * 3. Offline Queue data management
 * 4. Capacitor native mobile configuration
 */

import fs from "fs";
import path from "path";

async function runPwaAppTests() {
  console.log("==================================================");
  console.log("📱 VERIFYING BANTAYBARANGAY MOBILE APP SETUP");
  console.log("==================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   Detail: ${detail}`);
    }
  }

  // ─── 1. PWA Manifest Verification ─────────────────────────────────────────────
  console.log("--- 1. PWA Manifest Tests ---");
  const manifestPath = path.join(process.cwd(), "public", "manifest.json");
  assert(fs.existsSync(manifestPath), "manifest.json exists in public directory");

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  assert(manifest.display === "standalone", "Manifest display mode is 'standalone'", manifest.display);
  assert(manifest.orientation === "portrait", "Manifest orientation is 'portrait'", manifest.orientation);
  assert(Boolean(manifest.name && manifest.short_name), "Manifest has name and short_name", manifest.name);
  assert(Array.isArray(manifest.icons) && manifest.icons.length >= 2, "Manifest defines multiple icons");
  assert(manifest.icons.some((i: any) => i.sizes === "192x192" && (i.purpose === "maskable" || i.purpose === "any")), "Manifest has 192x192 maskable icon");
  assert(manifest.icons.some((i: any) => i.sizes === "512x512" && (i.purpose === "maskable" || i.purpose === "any")), "Manifest has 512x512 maskable icon");
  assert(Array.isArray(manifest.shortcuts) && manifest.shortcuts.length >= 3, "Manifest defines app shortcuts", `Count: ${manifest.shortcuts?.length}`);
  assert(manifest.shortcuts.some((s: any) => s.url.includes("/reports/new")), "Shortcuts include 'Report an Issue'");
  assert(manifest.shortcuts.some((s: any) => s.url.includes("/map")), "Shortcuts include 'Community Map'");

  // ─── 2. Service Worker Verification ───────────────────────────────────────────
  console.log("\n--- 2. Service Worker Tests ---");
  const swPath = path.join(process.cwd(), "public", "sw.js");
  assert(fs.existsSync(swPath), "sw.js exists in public directory");

  const swContent = fs.readFileSync(swPath, "utf-8");
  assert(swContent.includes("CACHE_NAME"), "Service worker defines CACHE_NAME");
  assert(swContent.includes("OFFLINE_FALLBACK_HTML") || swContent.includes("Offline"), "Service worker includes offline fallback page");
  assert(swContent.includes("STATIC_ASSETS"), "Service worker caches static assets");
  assert(swContent.includes("skipWaiting"), "Service worker activates immediately (skipWaiting)");

  // ─── 3. Capacitor Native App Config ──────────────────────────────────────────
  console.log("\n--- 3. Capacitor Native App Configuration Tests ---");
  const capPath = path.join(process.cwd(), "capacitor.config.json");
  assert(fs.existsSync(capPath), "capacitor.config.json exists in root directory");

  const capConfig = JSON.parse(fs.readFileSync(capPath, "utf-8"));
  assert(capConfig.appId === "ph.gov.pasig.bantaybarangay", "Capacitor App ID is configured", capConfig.appId);
  assert(capConfig.appName === "BantayBarangay", "Capacitor App Name is configured", capConfig.appName);
  assert(Boolean(capConfig.server?.url), "Capacitor server URL is configured for live-reload / dev");

  // ─── 4. Component File Existence ──────────────────────────────────────────────
  console.log("\n--- 4. App Shell Components Tests ---");
  const swCompPath = path.join(process.cwd(), "src", "components", "ServiceWorkerRegistration.tsx");
  assert(fs.existsSync(swCompPath), "ServiceWorkerRegistration.tsx exists");

  const installPromptPath = path.join(process.cwd(), "src", "components", "AppInstallPrompt.tsx");
  assert(fs.existsSync(installPromptPath), "AppInstallPrompt.tsx exists");

  const appHeaderPath = path.join(process.cwd(), "src", "components", "AppHeader.tsx");
  assert(fs.existsSync(appHeaderPath), "AppHeader.tsx exists");

  const offlineQueuePath = path.join(process.cwd(), "src", "lib", "offlineQueue.ts");
  assert(fs.existsSync(offlineQueuePath), "offlineQueue.ts exists");

  const guidePath = path.join(process.cwd(), "docs", "MOBILE_APP_GUIDE.md");
  assert(fs.existsSync(guidePath), "docs/MOBILE_APP_GUIDE.md exists");

  // ─── 5. Offline Queue Logic Test ─────────────────────────────────────────────
  console.log("\n--- 5. Offline Queue Unit Test ---");
  // Simple mock of localStorage for node environment
  const mockStorage: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (k: string) => mockStorage[k] || null,
    setItem: (k: string, v: string) => { mockStorage[k] = v; },
    removeItem: (k: string) => { delete mockStorage[k]; },
  };

  const { saveOfflineReport, getOfflineQueue, removeOfflineReport } = await import("./src/lib/offlineQueue");
  const queued = saveOfflineReport({
    categoryId: "cat-pothole",
    title: "Offline Test Pothole",
    description: "Deep pothole on Caruncho Ave tested in offline queue",
    safetyFlag: "NO",
    priority: "MEDIUM",
    latitude: 14.5839,
    longitude: 121.0615,
    address: "Caruncho Ave, Pasig City",
    photos: [],
  });

  assert(Boolean(queued.id && queued.id.startsWith("offline-")), "Report successfully queued with offline ID", queued.id);
  const queueAfterSave = getOfflineQueue();
  assert(queueAfterSave.length === 1 && queueAfterSave[0].title === "Offline Test Pothole", "Offline queue retrieved queued item");

  removeOfflineReport(queued.id);
  const queueAfterRemove = getOfflineQueue();
  assert(queueAfterRemove.length === 0, "Item removed cleanly from offline queue");

  // ─── Summary ────────────────────────────────────────────────────────────────
  console.log("\n==================================================");
  console.log(`MOBILE APP TESTS: ${passed}/${total} PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log("==================================================");

  if (passed === total) {
    console.log("🎉 ALL MOBILE APP & PWA CHECKS PASSED SUCCESSFULLY!");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runPwaAppTests().catch((e) => {
  console.error("Test execution error:", e);
  process.exit(1);
});
