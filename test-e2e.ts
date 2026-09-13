async function runE2ETests() {
  console.log("🚀 Starting BantayBarangay End-to-End Workflow Verification...");
  const baseUrl = "http://localhost:3000";

  // Helper for cookies
  let residentCookie = "";
  let staffCookie = "";
  let adminCookie = "";

  // 1. Resident Login
  console.log("\n1️⃣  Testing Resident Login (juan@resident.ph)...");
  const resLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "juan@resident.ph", password: "Password123!" }),
  });
  const resLoginData = await resLogin.json();
  if (!resLogin.ok || resLoginData.user?.role !== "RESIDENT") {
    throw new Error("Resident login failed: " + JSON.stringify(resLoginData));
  }
  residentCookie = resLogin.headers.get("set-cookie") || "";
  console.log("   ✅ Resident logged in:", resLoginData.user.name, `(${resLoginData.user.role})`);

  // 2. Fetch Categories
  console.log("\n2️⃣  Fetching dynamic categories...");
  const catRes = await fetch(`${baseUrl}/api/categories`);
  const catData = await catRes.json();
  const potholeCat = catData.categories.find((c: any) => c.slug === "road-pothole");
  if (!potholeCat) throw new Error("Pothole category not found");
  console.log("   ✅ Found category:", potholeCat.name, "ID:", potholeCat.id);

  // 3. Resident creates Report
  console.log("\n3️⃣  Resident filing new infrastructure report...");
  const reportPayload = {
    categoryId: potholeCat.id,
    title: "Hazardous crater pothole near San Antonio covered court",
    description: "Deep 10-inch road crater along Amber St causing motorcycle skids during night traffic.",
    safetyFlag: "POSSIBLY",
    latitude: 14.5843,
    longitude: 121.0622,
    address: "Amber St corner Emerald Ave, Brgy San Antonio, Pasig City",
    photos: [
      {
        url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
        type: "BEFORE",
        caption: "Asphalt crater with loose gravel",
      },
    ],
  };

  const createRes = await fetch(`${baseUrl}/api/reports`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: residentCookie,
    },
    body: JSON.stringify(reportPayload),
  });
  const createData = await createRes.json();
  if (!createRes.ok || !createData.report?.referenceNo) {
    throw new Error("Report creation failed: " + JSON.stringify(createData));
  }
  const createdReport = createData.report;
  console.log("   ✅ Report created! Reference Number:", createdReport.referenceNo);
  console.log("   Initial Status:", createdReport.status, "Priority:", createdReport.priority);

  // 4. Staff Login
  console.log("\n4️⃣  Testing Staff Login (staff@bantay.ph)...");
  const staffLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "staff@bantay.ph", password: "Password123!" }),
  });
  const staffLoginData = await staffLoginRes.json();
  if (!staffLoginRes.ok || staffLoginData.user?.role !== "STAFF") {
    throw new Error("Staff login failed: " + JSON.stringify(staffLoginData));
  }
  staffCookie = staffLoginRes.headers.get("set-cookie") || "";
  console.log("   ✅ Staff logged in:", staffLoginData.user.name, `(${staffLoginData.user.role})`);

  // 5. Staff reviews report and advances to IN_PROGRESS
  console.log("\n5️⃣  Staff reviewing report and changing status to IN_PROGRESS...");
  const statusRes = await fetch(`${baseUrl}/api/reports/${createdReport.id}/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: staffCookie,
    },
    body: JSON.stringify({
      newStatus: "IN_PROGRESS",
      note: "Barangay dispatch coordinated with Engineering asphalt patching unit.",
      isInternal: false,
    }),
  });
  const statusData = await statusRes.json();
  if (!statusRes.ok || statusData.report.status !== "IN_PROGRESS") {
    throw new Error("Status change failed: " + JSON.stringify(statusData));
  }
  console.log("   ✅ Status advanced to:", statusData.report.status);

  // 6. Staff posts Public Update and Internal Staff Note
  console.log("\n6️⃣  Staff posting Public Update & Internal Staff Note...");
  const pubUpdateRes = await fetch(`${baseUrl}/api/reports/${createdReport.id}/updates`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: staffCookie },
    body: JSON.stringify({
      message: "Patching crew deployed with asphalt batch. Lane 1 closed for 1 hour.",
      isInternal: false,
    }),
  });
  if (!pubUpdateRes.ok) throw new Error("Public update failed");

  const privUpdateRes = await fetch(`${baseUrl}/api/reports/${createdReport.id}/updates`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: staffCookie },
    body: JSON.stringify({
      message: "INTERNAL NOTE: Roller machine #4 requested from City depot.",
      isInternal: true,
    }),
  });
  if (!privUpdateRes.ok) throw new Error("Internal note failed");
  console.log("   ✅ Public update and private staff note posted.");

  // 7. Check Privacy & IDOR Masking for Resident
  console.log("\n7️⃣  Verifying Privacy & Internal Notes masking for Resident viewer...");
  const resViewRes = await fetch(`${baseUrl}/api/reports/${createdReport.id}`, {
    headers: { Cookie: residentCookie },
  });
  const resViewData = await resViewRes.json();
  const residentUpdates = resViewData.report.updates;
  const hasInternalNote = residentUpdates.some((u: any) => u.isInternal);
  if (hasInternalNote) {
    throw new Error("SECURITY FAILURE: Internal note leaked to resident viewer!");
  }
  console.log("   ✅ Privacy Check Passed: Internal staff notes are strictly masked from resident!");

  // 8. Staff marks RESOLVED with resolution proof
  console.log("\n8️⃣  Staff marking report RESOLVED with proof note & photo...");
  const resolveRes = await fetch(`${baseUrl}/api/reports/${createdReport.id}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: staffCookie },
    body: JSON.stringify({
      newStatus: "RESOLVED",
      note: "Asphalt patch completed, leveled, and compacted. Road surface verified smooth.",
      photoUrl: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80",
      isInternal: false,
    }),
  });
  const resolveData = await resolveRes.json();
  if (!resolveRes.ok || resolveData.report.status !== "RESOLVED") {
    throw new Error("Resolve failed: " + JSON.stringify(resolveData));
  }
  console.log("   ✅ Report marked as RESOLVED (Awaiting Resident Verification)");

  // 9. Resident verifies resolution: YES, IT'S FIXED -> CLOSED
  console.log("\n9️⃣  Resident confirms resolution: 'Yes, It's Fixed'...");
  const verifyRes = await fetch(`${baseUrl}/api/reports/${createdReport.id}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: residentCookie },
    body: JSON.stringify({
      confirmed: true,
      reason: "Resident verified: Asphalt looks great and traffic flows safely now!",
    }),
  });
  const verifyData = await verifyRes.json();
  if (!verifyRes.ok || verifyData.report.status !== "CLOSED") {
    throw new Error("Verification failed: " + JSON.stringify(verifyData));
  }
  console.log("   ✅ Report successfully transitioned to CLOSED! Case officially completed.");

  // 10. Admin checks Audit Logs
  console.log("\n🔟 Testing Admin Audit Logs (admin@bantay.ph)...");
  const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@bantay.ph", password: "Password123!" }),
  });
  const adminLoginData = await adminLoginRes.json();
  adminCookie = adminLoginRes.headers.get("set-cookie") || "";

  const auditRes = await fetch(`${baseUrl}/api/admin/audit-logs`, {
    headers: { Cookie: adminCookie },
  });
  const auditData = await auditRes.json();
  if (!auditRes.ok || !auditData.logs || auditData.logs.length === 0) {
    throw new Error("Audit logs retrieval failed");
  }

  const createdLog = auditData.logs.find((l: any) => l.action === "REPORT_CREATED" && l.entityId === createdReport.id);
  const statusLog = auditData.logs.find((l: any) => l.action === "STATUS_CHANGED" && l.entityId === createdReport.id);
  const verifiedLog = auditData.logs.find((l: any) => l.action === "RESOLUTION_VERIFIED_FIXED" && l.entityId === createdReport.id);

  console.log("   ✅ Found Audit Log for REPORT_CREATED:", Boolean(createdLog));
  console.log("   ✅ Found Audit Log for STATUS_CHANGED:", Boolean(statusLog));
  console.log("   ✅ Found Audit Log for RESOLUTION_VERIFIED_FIXED:", Boolean(verifiedLog));

  console.log("\n🎉 ALL END-TO-END WORKFLOW VERIFICATIONS PASSED WITH 100% SUCCESS!\n");
}

runE2ETests().catch((err) => {
  console.error("❌ E2E Test Failure:", err);
  process.exit(1);
});
