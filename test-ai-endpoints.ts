/**
 * test-ai-endpoints.ts
 * Verifies live HTTP endpoints for the AI subsystem.
 */

async function runEndpointTests() {
  console.log("==================================================");
  console.log("🌐 VERIFYING AI HTTP ENDPOINTS (PORT 3000)");
  console.log("==================================================\n");

  const baseUrl = "http://localhost:3000";
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

  // 1. Health check
  try {
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert(healthRes.ok, "API health check responded 200 OK");
  } catch (e: any) {
    console.error("Dev server unreachable on port 3000:", e.message);
    process.exit(1);
  }

  // 2. /api/ai/chat (Civic Chatbot Assistant)
  try {
    const chatRes = await fetch(`${baseUrl}/api/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "How to report an issue like a pothole?" }],
      }),
    });
    const chatData = await chatRes.json();
    assert(chatRes.ok && chatData.success && typeof chatData.reply === "string", "/api/ai/chat returns helpful reply", JSON.stringify(chatData));
  } catch (e: any) {
    assert(false, "/api/ai/chat endpoint failed", e.message);
  }

  // 3. /api/ai/suggest-category
  try {
    const catRes = await fetch(`${baseUrl}/api/ai/suggest-category`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: "Malalim na lubak sa kalsada na delikado sa mga motor",
      }),
    });
    const catData = await catRes.json();
    assert(catRes.ok && catData.suggestion, "/api/ai/suggest-category returns suggested category", JSON.stringify(catData));
  } catch (e: any) {
    assert(false, "/api/ai/suggest-category endpoint failed", e.message);
  }

  // 4. /api/ai/quality-check
  try {
    const qualRes = await fetch(`${baseUrl}/api/ai/quality-check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categorySelected: true,
        description: "Busted lamp post near barangay plaza",
        hasPhoto: true,
        hasLocation: true,
      }),
    });
    const qualData = await qualRes.json();
    assert(qualRes.ok && qualData.quality?.score !== undefined, "/api/ai/quality-check returns scored checklist", JSON.stringify(qualData));
  } catch (e: any) {
    assert(false, "/api/ai/quality-check endpoint failed", e.message);
  }

  // 5. /api/reports/duplicate-check
  try {
    const dupRes = await fetch(`${baseUrl}/api/reports/duplicate-check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latitude: 14.5839,
        longitude: 121.0615,
        categoryId: "dummy",
        description: "pothole on road",
      }),
    });
    const dupData = await dupRes.json();
    assert(dupRes.ok && Array.isArray(dupData.duplicates), "/api/reports/duplicate-check returns array", JSON.stringify(dupData));
  } catch (e: any) {
    assert(false, "/api/reports/duplicate-check endpoint failed", e.message);
  }

  // 6. Login as Staff and test Moderation API on an existing report
  try {
    // Login as staff
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "09193332222",
        password: "Password123!",
      }),
    });
    const loginData = await loginRes.json();
    const cookieHeader = loginRes.headers.get("set-cookie");
    assert(loginRes.ok && cookieHeader !== null, "Staff login succeeded with auth cookie");

    // Fetch reports to find a candidate report
    const reportsRes = await fetch(`${baseUrl}/api/reports?page=1&limit=1`, {
      headers: { Cookie: cookieHeader || "" },
    });
    const reportsData = await reportsRes.json();
    if (reportsData.reports && reportsData.reports.length > 0) {
      const targetReport = reportsData.reports[0];
      assert(true, `Found target report ${targetReport.referenceNo} for moderation test`);

      // Test moderation action: APPROVE
      const modRes = await fetch(`${baseUrl}/api/reports/${targetReport.id}/moderation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader || "",
        },
        body: JSON.stringify({
          actionType: "APPROVE",
          reason: "Verified via automated test runner.",
        }),
      });
      const modData = await modRes.json();
      assert(modRes.ok && modData.success, "/api/reports/[id]/moderation APPROVE succeeded", JSON.stringify(modData));

      // Test moderation action: REQUEST_INFO
      const reqInfoRes = await fetch(`${baseUrl}/api/reports/${targetReport.id}/moderation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader || "",
        },
        body: JSON.stringify({
          actionType: "REQUEST_INFO",
          message: "Could you provide photo confirmation of the landmark?",
        }),
      });
      const reqInfoData = await reqInfoRes.json();
      assert(reqInfoRes.ok && reqInfoData.success, "/api/reports/[id]/moderation REQUEST_INFO succeeded", JSON.stringify(reqInfoData));
    } else {
      console.log("ℹ️ No reports found in database to execute moderation test against. Skipping moderation execution.");
    }
  } catch (e: any) {
    assert(false, "Staff moderation workflow failed", e.message);
  }

  console.log("\n==================================================");
  console.log(`ENDPOINT TESTS: ${passed}/${total} PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log("==================================================");

  if (passed === total) {
    console.log("🎉 ALL AI HTTP ENDPOINTS VERIFIED SUCCESSFULLY!");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runEndpointTests().catch((e) => {
  console.error("Endpoint test error:", e);
  process.exit(1);
});
