async function runLocationTests() {
  console.log("🧭 Starting BantayBarangay Location System End-to-End Verification...\n");
  const baseUrl = "http://localhost:3000";

  // 1. Resident Login
  console.log("1️⃣ Authenticating test resident (juan@resident.ph)...");
  const resLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "juan@resident.ph", password: "Password123!" }),
  });
  const resLoginData = await resLogin.json();
  if (!resLogin.ok || resLoginData.user?.role !== "RESIDENT") {
    throw new Error("Resident login failed: " + JSON.stringify(resLoginData));
  }
  const residentCookie = resLogin.headers.get("set-cookie") || "";
  console.log("   ✅ Authenticated as:", resLoginData.user.name);

  // 2. Fetch Categories
  const catRes = await fetch(`${baseUrl}/api/categories`);
  const catData = await catRes.json();
  const cat = catData.categories[0];
  if (!cat) throw new Error("No category found");
  console.log("   ✅ Using Category:", cat.name, `(${cat.id})`);

  // 3. Test High-Accuracy Device GPS Report Submission
  console.log("\n2️⃣ Testing High-Accuracy Device GPS Report Creation...");
  const gpsLat = 14.582345;
  const gpsLng = 121.063456;
  const gpsAccuracy = 8.5; // ±8.5 meters
  const gpsCapturedAt = new Date().toISOString();

  const gpsPayload = {
    categoryId: cat.id,
    title: "Live GPS Test: Pavement crack",
    description: "Verified physical ground location with device GPS satellites locked.",
    safetyFlag: "NO",
    latitude: gpsLat,
    longitude: gpsLng,
    accuracy: gpsAccuracy,
    locationSource: "DEVICE_GPS",
    locationCapturedAt: gpsCapturedAt,
    address: "Shaw Blvd near Pearl Drive, Brgy San Antonio, Pasig City",
    photos: [
      {
        url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
        type: "BEFORE",
      },
    ],
  };

  const gpsCreateRes = await fetch(`${baseUrl}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: residentCookie },
    body: JSON.stringify(gpsPayload),
  });
  const gpsCreateData = await gpsCreateRes.json();
  if (!gpsCreateRes.ok || !gpsCreateData.report) {
    throw new Error("GPS Report creation failed: " + JSON.stringify(gpsCreateData));
  }
  const gpsReport = gpsCreateData.report;
  console.log("   ✅ GPS Report created! Reference:", gpsReport.referenceNo);

  // Verify coordinates and metadata in response
  if (Math.abs(gpsReport.latitude - gpsLat) > 0.000001 || Math.abs(gpsReport.longitude - gpsLng) > 0.000001) {
    throw new Error(`GPS Coordinates mismatched! Expected ${gpsLat}, ${gpsLng} but got ${gpsReport.latitude}, ${gpsReport.longitude}`);
  }
  if (gpsReport.accuracy !== gpsAccuracy) {
    throw new Error(`GPS Accuracy mismatched! Expected ${gpsAccuracy} but got ${gpsReport.accuracy}`);
  }
  if (gpsReport.locationSource !== "DEVICE_GPS") {
    throw new Error(`Location source mismatched! Expected DEVICE_GPS but got ${gpsReport.locationSource}`);
  }
  console.log(`   ✅ Coordinate Fidelity Verified: Lat=${gpsReport.latitude}, Lng=${gpsReport.longitude}`);
  console.log(`   ✅ Accuracy Verified: ±${gpsReport.accuracy}m`);
  console.log(`   ✅ Location Source Verified: ${gpsReport.locationSource}`);

  // 4. Test Manual Pin Report Submission
  console.log("\n3️⃣ Testing Manual Pin Map Selection Report Creation...");
  const manualLat = 14.587890;
  const manualLng = 121.065432;
  const manualCapturedAt = new Date().toISOString();

  const manualPayload = {
    categoryId: cat.id,
    title: "Manual Pin Test: Dangling cable overhead",
    description: "Pin manually placed on map directly under low-hanging cable crossway.",
    safetyFlag: "POSSIBLY",
    latitude: manualLat,
    longitude: manualLng,
    accuracy: null,
    locationSource: "MANUAL_PIN",
    locationCapturedAt: manualCapturedAt,
    address: "Emerald Ave corner Garnet Rd, Ortigas Center",
    photos: [
      {
        url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
        type: "BEFORE",
      },
    ],
  };

  const manualCreateRes = await fetch(`${baseUrl}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: residentCookie },
    body: JSON.stringify(manualPayload),
  });
  const manualCreateData = await manualCreateRes.json();
  if (!manualCreateRes.ok || !manualCreateData.report) {
    throw new Error("Manual Report creation failed: " + JSON.stringify(manualCreateData));
  }
  const manualReport = manualCreateData.report;
  console.log("   ✅ Manual Pin Report created! Reference:", manualReport.referenceNo);

  if (Math.abs(manualReport.latitude - manualLat) > 0.000001 || Math.abs(manualReport.longitude - manualLng) > 0.000001) {
    throw new Error(`Manual Coordinates mismatched! Expected ${manualLat}, ${manualLng} but got ${manualReport.latitude}, ${manualReport.longitude}`);
  }
  if (manualReport.locationSource !== "MANUAL_PIN") {
    throw new Error(`Location source mismatched! Expected MANUAL_PIN but got ${manualReport.locationSource}`);
  }
  console.log(`   ✅ Manual Pin Coordinate Fidelity Verified: Lat=${manualReport.latitude}, Lng=${manualReport.longitude}`);

  // 5. Test Fetching Report Detail (GET /api/reports/:id)
  console.log("\n4️⃣ Verifying Stored Coordinates on Report Detail API...");
  const detailRes = await fetch(`${baseUrl}/api/reports/${gpsReport.referenceNo}`);
  const detailData = await detailRes.json();
  if (!detailRes.ok || !detailData.report) {
    throw new Error("Fetching report detail failed: " + JSON.stringify(detailData));
  }
  const fetched = detailData.report;
  if (fetched.latitude !== gpsLat || fetched.longitude !== gpsLng) {
    throw new Error(`Detail API coordinates mismatched! Expected ${gpsLat}, ${gpsLng} but got ${fetched.latitude}, ${fetched.longitude}`);
  }
  if (fetched.accuracy !== gpsAccuracy) {
    throw new Error(`Detail API accuracy mismatched! Expected ${gpsAccuracy} but got ${fetched.accuracy}`);
  }
  if (fetched.locationSource !== "DEVICE_GPS") {
    throw new Error(`Detail API location source mismatched! Expected DEVICE_GPS but got ${fetched.locationSource}`);
  }
  console.log("   ✅ Report Detail API verified: Exact coordinates, accuracy, and source preserved!");

  // 6. Test Nearby Reports Map API (GET /api/reports/nearby)
  console.log("\n5️⃣ Verifying Nearby Reports Map API...");
  const nearbyRes = await fetch(`${baseUrl}/api/reports/nearby`);
  const nearbyData = await nearbyRes.json();
  if (!nearbyRes.ok || !Array.isArray(nearbyData.reports)) {
    throw new Error("Nearby API failed: " + JSON.stringify(nearbyData));
  }
  const foundGpsReport = nearbyData.reports.find((r: any) => r.referenceNo === gpsReport.referenceNo);
  if (!foundGpsReport) {
    throw new Error("Created GPS report not found in nearby map reports list!");
  }
  if (foundGpsReport.latitude !== gpsLat || foundGpsReport.longitude !== gpsLng) {
    throw new Error(`Nearby map report coordinates mismatched! Expected ${gpsLat}, ${gpsLng} but got ${foundGpsReport.latitude}, ${foundGpsReport.longitude}`);
  }
  console.log("   ✅ Nearby Map API verified: Report rendered with exact geospatial coordinates!");

  // 7. Test Validation Rejection on Invalid Coordinates
  console.log("\n6️⃣ Testing Backend Validation for Malformed/OutOfBounds Coordinates...");
  const invalidRes = await fetch(`${baseUrl}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: residentCookie },
    body: JSON.stringify({
      categoryId: cat.id,
      title: "Bad Coords Test",
      description: "Testing out of bounds coordinates.",
      latitude: 999.0, // Invalid latitude
      longitude: 121.0,
      address: "Nowhere",
    }),
  });
  if (invalidRes.status !== 400) {
    throw new Error(`Expected status 400 for out-of-bounds latitude, got ${invalidRes.status}`);
  }
  console.log("   ✅ Invalid coordinates correctly rejected with HTTP 400 Bad Request!");

  console.log("\n🎉 ALL LOCATION SYSTEM VERIFICATION TESTS PASSED WITH 100% SUCCESS!\n");
}

runLocationTests().catch((err) => {
  console.error("❌ Location Test Error:", err);
  process.exit(1);
});
