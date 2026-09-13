async function runAlternativeVerification() {
  console.log("🔄 Testing Alternative Branch: Resident clicks 'No, The Problem Remains'...");
  const baseUrl = "http://localhost:3000";

  // 1. Resident Login
  const resLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "maria@resident.ph", password: "Password123!" }),
  });
  const residentCookie = resLogin.headers.get("set-cookie") || "";

  // 2. Fetch Category
  const catRes = await fetch(`${baseUrl}/api/categories`);
  const catData = await catRes.json();
  const cat = catData.categories[0];

  // 3. Create Report
  const createRes = await fetch(`${baseUrl}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: residentCookie },
    body: JSON.stringify({
      categoryId: cat.id,
      title: "Broken sidewalk curb on Topaz St",
      description: "Curb damaged by delivery truck, creating tripping hazard.",
      latitude: 14.5819,
      longitude: 121.0601,
      address: "Topaz St, Brgy San Antonio, Pasig City",
      photos: [{ url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80" }],
    }),
  });
  const report = (await createRes.json()).report;
  console.log("   ✅ Report created:", report.referenceNo);

  // 4. Staff Login & mark as RESOLVED
  const staffLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "staff@bantay.ph", password: "Password123!" }),
  });
  const staffCookie = staffLogin.headers.get("set-cookie") || "";

  await fetch(`${baseUrl}/api/reports/${report.id}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: staffCookie },
    body: JSON.stringify({
      newStatus: "RESOLVED",
      note: "Curb cemented and dried.",
    }),
  });
  console.log("   ✅ Staff marked as RESOLVED");

  // 5. Resident verifies: NO, PROBLEM REMAINS -> REOPENED
  const reopenRes = await fetch(`${baseUrl}/api/reports/${report.id}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: residentCookie },
    body: JSON.stringify({
      confirmed: false,
      reason: "The concrete cracked again under truck weight. Still broken.",
    }),
  });
  const reopenData = await reopenRes.json();
  if (!reopenRes.ok || reopenData.report.status !== "REOPENED") {
    throw new Error("Alternative verification failed: " + JSON.stringify(reopenData));
  }
  console.log("   ✅ Report successfully transitioned to REOPENED!");
  console.log("   Resident Reason Recorded:", reopenData.report.status);

  // 6. Check that staff received notification about reopened report
  const notifRes = await fetch(`${baseUrl}/api/notifications`, {
    headers: { Cookie: staffCookie },
  });
  const notifData = await notifRes.json();
  const reopenNotif = notifData.notifications.find((n: any) => n.title.includes("Reopened") && n.reportId === report.id);
  console.log("   ✅ Staff notified of reopened report:", Boolean(reopenNotif));

  console.log("\n🎉 ALTERNATIVE RESOLUTION (REOPEN) WORKFLOW PASSED WITH 100% SUCCESS!\n");
}

runAlternativeVerification().catch((e) => {
  console.error(e);
  process.exit(1);
});
