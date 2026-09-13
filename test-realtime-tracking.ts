// Automated verification of real-time tracking jitter filtering, accuracy thresholds, and Community Map integration

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * 111320;
  const dLng = (lon2 - lon1) * (111320 * Math.cos((lat1 * Math.PI) / 180));
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

function shouldUpdateUserLocation(
  prev: { lat: number; lng: number; accuracy: number } | null,
  next: { lat: number; lng: number; accuracy: number }
): boolean {
  if (!prev) return true;
  const dist = calculateDistanceMeters(prev.lat, prev.lng, next.lat, next.lng);

  // Ignore micro-shifts (< 1.2m) if accuracy did not noticeably improve
  if (dist < 1.2 && next.accuracy >= prev.accuracy - 2) {
    return false;
  }

  // Filter out erratic poor accuracy spikes (> 150m) if we already have reliable GPS lock (< 40m)
  if (next.accuracy > 150 && prev.accuracy <= 40) {
    return false;
  }

  return true;
}

async function runRealtimeTrackingVerification() {
  console.log("🧭 Running Real-time Tracking & Jitter Filter Unit Verification...\n");

  // Test 1: Initial position should always be accepted
  const initial = { lat: 14.583900, lng: 121.061500, accuracy: 12 };
  if (!shouldUpdateUserLocation(null, initial)) {
    throw new Error("Initial position was rejected!");
  }
  console.log("✅ Test 1 Passed: Initial GPS lock accepted.");

  // Test 2: Stationary micro-jitter (< 1m) should be filtered out
  const microJitter = { lat: 14.583905, lng: 121.061503, accuracy: 12 }; // ~0.6m shift
  const distJitter = calculateDistanceMeters(initial.lat, initial.lng, microJitter.lat, microJitter.lng);
  console.log(`   Calculated micro-jitter distance: ${distJitter.toFixed(2)}m`);
  if (shouldUpdateUserLocation(initial, microJitter)) {
    throw new Error("Stationary micro-jitter should have been filtered out!");
  }
  console.log("✅ Test 2 Passed: Stationary micro-jitter filtered out without unnecessary marker jumps.");

  // Test 3: Meaningful movement (> 3m) should be accepted
  const walkingStep = { lat: 14.583940, lng: 121.061520, accuracy: 10 }; // ~4.9m shift
  const distWalking = calculateDistanceMeters(initial.lat, initial.lng, walkingStep.lat, walkingStep.lng);
  console.log(`   Calculated walking distance: ${distWalking.toFixed(2)}m`);
  if (!shouldUpdateUserLocation(initial, walkingStep)) {
    throw new Error("Real walking movement was incorrectly rejected!");
  }
  console.log("✅ Test 3 Passed: Real user movement accepted and smoothly tracked.");

  // Test 4: Wild inaccurate reading (> 150m accuracy) should be rejected if reliable lock exists
  const wildCellTowerReading = { lat: 14.590000, lng: 121.070000, accuracy: 250 };
  if (shouldUpdateUserLocation(walkingStep, wildCellTowerReading)) {
    throw new Error("Wildly inaccurate reading (> 150m) was not filtered out!");
  }
  console.log("✅ Test 4 Passed: Coarse/wild accuracy reading filtered out.");

  // Test 5: Verify Community Map route renders properly on Next.js dev server
  console.log("\n🌐 Verifying Community Map route HTTP status...");
  const res = await fetch("http://localhost:3000/map");
  if (res.status !== 200) {
    throw new Error(`Expected HTTP 200 on /map, got ${res.status}`);
  }
  const html = await res.text();
  if (!html.includes("Community Infrastructure Map")) {
    throw new Error("Community Map title missing from HTML response!");
  }
  if (!html.includes("You are here")) {
    throw new Error("'You are here' legend entry missing from HTML response!");
  }
  console.log("✅ Test 5 Passed: Community Map endpoint live and rendering 'You are here' real-time indicator!");

  console.log("\n🎉 ALL REAL-TIME TRACKING TESTS PASSED SUCCESSFULLY!");
}

runRealtimeTrackingVerification().catch((err) => {
  console.error("❌ Realtime Tracking Test Failed:", err);
  process.exit(1);
});
