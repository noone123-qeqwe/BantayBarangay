/**
 * test-ai-system.ts
 * Comprehensive test suite verifying all 7 capabilities of the BantayBarangay AI-Powered System:
 * 1. PII Stripping
 * 2. Severe Safety Hazard Detection
 * 3. AI Category Suggestion
 * 4. Smart Report Assistant ("Help Me Write My Report")
 * 5. Pre-Submission Quality Checklist
 * 6. Conversational Civic Chatbot
 * 7. AI Report Moderation & Risk Assessment
 */

import {
  stripPII,
  detectSevereSafetyHazard,
  suggestCategoryWithAI,
  assistWriteReportWithAI,
  checkReportQuality,
  civicChatWithAI,
  moderateReportWithAI,
} from "./src/lib/aiService";

async function runTests() {
  console.log("==================================================");
  console.log("🚀 STARTING BANTAYBARANGAY AI SYSTEM VERIFICATION");
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

  // ─── 1. PII Stripping ────────────────────────────────────────────────────────
  console.log("--- 1. PII Stripping Tests ---");
  const piiInput = "Contact Juan Dela Cruz at 0917-123-4567 or +639181112222 or juan.cruz@gmail.com about the street light.";
  const stripped = stripPII(piiInput);
  assert(!stripped.includes("0917-123-4567") && !stripped.includes("+639181112222"), "Mobile numbers stripped", stripped);
  assert(!stripped.includes("juan.cruz@gmail.com"), "Email addresses stripped", stripped);
  assert(stripped.includes("[PHONE_REDACTED]") && stripped.includes("[EMAIL_REDACTED]"), "Placeholder tokens inserted", stripped);

  // ─── 2. Severe Safety Hazard Detection ───────────────────────────────────────
  console.log("\n--- 2. Safety Hazard Detection Tests ---");
  const hazard1 = detectSevereSafetyHazard("May exposed live wire na lumalaylay sa tapat ng school, nag-spark!");
  assert(hazard1.isHazard === true, "Exposed live wire detected as hazard", JSON.stringify(hazard1));
  assert(Boolean(hazard1.matchedHazard?.includes("live wire") || hazard1.matchedHazard?.includes("spark")), "Hazard detail identified", hazard1.matchedHazard);

  const hazard2 = detectSevereSafetyHazard("Gas leak smell strong near market bakery, risk of explosion");
  assert(hazard2.isHazard === true, "Gas leak & explosion risk detected as hazard", JSON.stringify(hazard2));

  const nonHazard = detectSevereSafetyHazard("Malalim na lubak sa kalsada tabi ng tindahan.");
  assert(nonHazard.isHazard === false, "Routine pothole not flagged as emergency hazard");

  // ─── 3. AI Category Suggestion ───────────────────────────────────────────────
  console.log("\n--- 3. Category Suggestion Tests ---");
  const catMockList = [
    { id: "cat-road", name: "Roads & Potholes" },
    { id: "cat-light", name: "Street Lighting & Electrical" },
    { id: "cat-drain", name: "Drainage & Flooding" },
    { id: "cat-waste", name: "Waste Management" },
  ];

  const catSug1 = await suggestCategoryWithAI(
    "Pundi ang ilaw sa poste sa tapat ng kanto, madilim tuwing gabi",
    catMockList
  );
  assert(catSug1?.suggestedCategoryId === "cat-light", "Street lighting suggested for busted lamp post", JSON.stringify(catSug1));

  const catSug2 = await suggestCategoryWithAI(
    "Barado ang kanal at nag-uumapaw ang maruming tubig sa kalsada",
    catMockList
  );
  assert(catSug2?.suggestedCategoryId === "cat-drain", "Drainage suggested for clogged canal", JSON.stringify(catSug2));

  // ─── 4. Smart Report Assistant ──────────────────────────────────────────────
  console.log("\n--- 4. Smart Report Assistant Tests ---");
  const draft = await assistWriteReportWithAI({
    problem: "Malaking lubak na may tumatalsik na aspalto",
    location: "Sa harap ng Pasig Elementary School, Caruncho Ave",
    dangerOrDifficulty: "Muntik nang sumemplang ang mga motorista kaninang umaga",
    duration: "3 araw na",
  });
  assert(typeof draft === "string" && draft.length > 30, "Generated draft has detailed description", draft);
  assert(draft.includes("Pasig Elementary School") || draft.includes("Caruncho"), "Draft contains landmark", draft);
  console.log(`   Generated Draft Preview:\n   ${draft.replace(/\n/g, "\n   ")}`);

  // ─── 5. Pre-Submission Quality Check ────────────────────────────────────────
  console.log("\n--- 5. Pre-Submission Quality Check Tests ---");
  const poorQuality = checkReportQuality({
    categorySelected: false,
    description: "pothole",
    hasPhoto: false,
    hasLocation: false,
  });
  assert(poorQuality.overallQuality === "needs_improvement", "Incomplete report flagged as needs_improvement", poorQuality.overallQuality);
  assert(poorQuality.score < 50, "Low quality score for incomplete draft", `Score: ${poorQuality.score}`);
  assert(poorQuality.items.some((c) => !c.passed), "Checklist has failing items");

  const goodQuality = checkReportQuality({
    categorySelected: true,
    description: "Deep pothole measuring approximately 1 meter across near Mercury Drug Caruncho Ave. Vehicles swerve to avoid it.",
    hasPhoto: true,
    hasLocation: true,
  });
  assert(goodQuality.overallQuality === "excellent" || goodQuality.overallQuality === "good", "Complete report flagged as good or excellent", goodQuality.overallQuality);
  assert(goodQuality.score >= 80, "High score for complete report", `Score: ${goodQuality.score}`);

  // ─── 6. Conversational Civic Chatbot ────────────────────────────────────────
  console.log("\n--- 6. Civic Assistant Chatbot Tests ---");
  const chatReply1 = await civicChatWithAI([
    { role: "user", content: "How to report an issue like a pothole or streetlight?" },
  ]);
  assert(typeof chatReply1 === "string" && chatReply1.length > 20, "Chatbot provided helpful civic reply", chatReply1);
  assert(chatReply1.toLowerCase().includes("report") || chatReply1.toLowerCase().includes("category"), "Chatbot reply explains reporting process", chatReply1);

  const chatReply2 = await civicChatWithAI([
    { role: "user", content: "Emergency hotline for fire or live wire" },
  ]);
  assert(
    chatReply2.includes("8643-1111") || chatReply2.includes("911"),
    "Emergency hotline provided for emergency hazards",
    chatReply2
  );

  // ─── 7. AI Report Moderation & Risk Assessment ──────────────────────────────
  console.log("\n--- 7. AI Moderation & Risk Assessment Tests ---");
  // Test A: Normal Report
  const cleanMod = await moderateReportWithAI({
    description: "The LED fixture is flickering violently and cuts off after 8 PM, leaving the pedestrian crosswalk completely dark.",
    categoryName: "Street Lighting & Electrical",
    categorySlug: "street-lights",
    photoUrls: ["https://example.com/photo1.jpg"],
  });
  assert(cleanMod.suspicion_level === "low", "Clean report has low suspicion level", cleanMod.suspicion_level);
  assert(cleanMod.safety_hazard === false, "Routine streetlight is not emergency hazard", String(cleanMod.safety_hazard));

  // Test B: Nonsense / Prank Report
  const spamMod = await moderateReportWithAI({
    description: "asdfghjkl qwertyuiop prank prank prank alien landed here lol",
    categoryName: "Waste Management",
    categorySlug: "waste",
    photoUrls: [],
  });
  assert(spamMod.suspicion_level === "high" || spamMod.description_quality !== "good", "Nonsense/prank report flagged for review", `Suspicion: ${spamMod.suspicion_level}`);
  assert(spamMod.requires_human_review === true, "Prank routed to human review (Zero Auto-Rejection)", String(spamMod.requires_human_review));

  // Test C: Emergency Hazard Report
  const hazardMod = await moderateReportWithAI({
    description: "An electrical wire snapped from the pole and is on fire with sparks dropping onto cars.",
    categoryName: "Street Lighting & Electrical",
    categorySlug: "street-lights",
    photoUrls: ["https://example.com/photo2.jpg"],
  });
  assert(hazardMod.safety_hazard === true, "AI identified severe safety hazard in report", JSON.stringify(hazardMod.safety_hazard));
  assert(hazardMod.recommendation === "Human Review" || hazardMod.requires_human_review === true, "Hazard flagged for immediate human review", hazardMod.recommendation);

  // ─── Summary ────────────────────────────────────────────────────────────────
  console.log("\n==================================================");
  console.log(`TEST RESULTS: ${passed}/${total} PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log("==================================================");

  if (passed === total) {
    console.log("🎉 ALL AI SYSTEM TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
  } else {
    console.error("⚠️ Some tests failed. Please review the output above.");
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Test execution error:", e);
  process.exit(1);
});
