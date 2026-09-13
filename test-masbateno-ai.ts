/**
 * Automated Verification Test Suite for BantayBarangay Masbateño AI Assistant
 * Tests:
 * 1. Language Detection & Resolution
 * 2. Masbateño Glossary & Standard Terminology Preservation
 * 3. Smart Report Assistant with Fact Restraint
 * 4. Municipal Category Suggestions from Minasbate Descriptions
 * 5. Grounded Civic Chatbot in Masbateño, Filipino, English
 * 6. Local Masbate Civic Hotlines & Status Definitions
 * 7. Uncertainty Fallback Phrase
 * 8. Abuse Moderation: Fair to Dialect, Vigilant against True Pranks
 */

import {
  resolveLanguage,
  isMasbatenoText,
  MASBATENO_CIVIC_RESPONSES,
  MASBATENO_UNCERTAINTY_PROMPT,
} from "./src/lib/languages/masbatenoGlossary";

import {
  civicChatWithAI,
  assistWriteReportWithAI,
  suggestCategoryWithAI,
  moderateReportWithAI,
} from "./src/lib/aiService";

async function runTests() {
  console.log("===============================================================================");
  console.log("🚀 STARTING MASBATEÑO AI SYSTEM TEST SUITE (BANTAYBARANGAY MASBATE)");
  console.log("===============================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✅ [PASS] ${testName}`);
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      if (detail) console.error(`     Details: ${detail}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. LANGUAGE DETECTION & RESOLUTION
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("--- TEST GROUP 1: Language Detection & Resolution ---");
  {
    const msb1 = "May daku nga lubak sa kalsada harani sa barangay hall";
    assert(isMasbatenoText(msb1), "Detects authentic Masbateño infrastructure text");

    const msb2 = "Pundi an suga sa poste kag madulom an dalan";
    assert(isMasbatenoText(msb2), "Detects Masbateño lighting text with 'pundi' and 'suga'");

    const msb3 = "Diin dapit makit-an an akon report?";
    assert(isMasbatenoText(msb3), "Detects Masbateño query markers 'makit-an' and 'akon'");

    const tag1 = "May malaking lubak malapit sa barangay hall";
    assert(!isMasbatenoText(tag1), "Tagalog text is correctly distinguished from Masbateño");

    const eng1 = "There is a deep pothole near the barangay hall";
    assert(!isMasbatenoText(eng1), "English text is correctly distinguished");

    assert(resolveLanguage("msb", "any random words") === "msb", "Explicit preference 'msb' is honored");
    assert(resolveLanguage("fil", "any random words") === "fil", "Explicit preference 'fil' is honored");
    assert(resolveLanguage("en", "any random words") === "en", "Explicit preference 'en' is honored");
    assert(resolveLanguage(undefined, msb1) === "msb", "Auto-resolves to 'msb' when no explicit preference");
    assert(resolveLanguage(undefined, "paano mag sumite ng report") === "fil", "Auto-resolves to 'fil' for Tagalog input");
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. GLOSSARY & PRESERVED TERMS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- TEST GROUP 2: Standard Terms & Preserved Terminology ---");
  {
    const underReviewItem = MASBATENO_CIVIC_RESPONSES.find((r) => r.queryKeywords.includes("under review"));
    const underReviewExplanation = underReviewItem?.response || "";
    assert(underReviewExplanation.includes("Under Review"), "Preserves standardized term 'Under Review'");
    assert(underReviewExplanation.includes("Submitted"), "Preserves standardized term 'Submitted'");
    assert(underReviewExplanation.includes("Resolved"), "Preserves standardized term 'Resolved'");
    assert(underReviewExplanation.includes("barangay staff"), "Maintains local civic governance context");
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. SMART REPORT ASSISTANT (HELP ME WRITE MY REPORT)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- TEST GROUP 3: Smart Report Assistant with Masbateño Phrasing & Fact Restraint ---");
  {
    // Exact user input example from prompt
    const report1 = await assistWriteReportWithAI(
      {
        problem: "May daku nga lubak sa kalsada harani sa barangay hall",
        location: "Barangay Nursery, Masbate City",
        dangerOrDifficulty: "delikado sa mga motor kag traysikel",
        duration: "duha ka semana na",
      },
      "msb"
    );

    assert(report1.includes("lubak"), "Includes original problem 'lubak'");
    assert(report1.includes("Barangay Nursery"), "Includes user-provided location");
    assert(report1.includes("motor") || report1.includes("delikado"), "Includes danger/difficulty note");
    assert(report1.includes("semana") || report1.includes("duha"), "Includes duration note");
    // Ensure it didn't fabricate non-provided details
    assert(!report1.toLowerCase().includes("alkalde"), "Does not invent unprovided political/external details");
    assert(!report1.toLowerCase().includes("truck"), "Does not fabricate unmentioned vehicles like trucks");

    // Single sentence minimal input
    const minimalReport = await assistWriteReportWithAI(
      {
        problem: "Pundi an suga sa poste",
        location: "Masbate City",
      },
      "msb"
    );
    assert(minimalReport.includes("Pundi an suga sa poste"), "Retains user description accurately");
    assert(minimalReport.includes("Palihog"), "Adds polite civic request in Masbateño without inventing facts");
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. MUNICIPAL CATEGORY SUGGESTION FROM MASBATEÑO INPUTS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- TEST GROUP 4: Category Suggestions from Masbateño Descriptions ---");
  {
    const categories = [
      { id: "cat-road", name: "Road / Pothole", slug: "road-damage" },
      { id: "cat-light", name: "Busted Streetlight", slug: "street-lighting" },
      { id: "cat-drain", name: "Clogged Drainage / Flooding", slug: "drainage-flooding" },
      { id: "cat-waste", name: "Garbage / Waste Disposal", slug: "waste-management" },
      { id: "cat-tree", name: "Fallen Tree / Vegetation", slug: "fallen-trees" },
      { id: "cat-pipe", name: "Water / Pipe Leak", slug: "water-pipe-leak" },
      { id: "cat-facility", name: "Damaged Public Facility", slug: "public-facilities" },
    ];

    // Case A: Pothole in Masbateño
    const sugRoad = await suggestCategoryWithAI(
      "May daku nga lubak sa kalsada harani sa barangay hall",
      categories
    );
    assert(sugRoad?.suggestedCategoryId === "cat-road", "Correctly suggests 'Road / Pothole' for 'daku nga lubak sa kalsada'");
    assert(sugRoad?.reason.includes("kalsada") || sugRoad?.reason.includes("Road"), "Includes localized reason");

    // Case B: Busted Streetlight
    const sugLight = await suggestCategoryWithAI(
      "Madulom kaayo didi kag pundi an suga sa poste san kanto",
      categories
    );
    assert(sugLight?.suggestedCategoryId === "cat-light", "Correctly suggests 'Busted Streetlight' for 'pundi an suga sa poste'");

    // Case C: Clogged Drainage / Baha
    const sugDrain = await suggestCategoryWithAI(
      "Nag-awas an kanal sa purok 2 kag nagabaha pag mag-ulan",
      categories
    );
    assert(sugDrain?.suggestedCategoryId === "cat-drain", "Correctly suggests 'Clogged Drainage / Flooding' for 'nag-awas an kanal'");

    // Case D: Waste / Ramit
    const sugWaste = await suggestCategoryWithAI(
      "Damo nga ramit kag basura an gintambak sa bakanteng lote, mabahoon na",
      categories
    );
    assert(sugWaste?.suggestedCategoryId === "cat-waste", "Correctly suggests 'Garbage / Waste Disposal' for 'ramit kag basura'");

    // Case E: Water pipe leak
    const sugPipe = await suggestCategoryWithAI(
      "Nagasaribo an tubig humalin sa guba nga tubo harani sa gripo",
      categories
    );
    assert(sugPipe?.suggestedCategoryId === "cat-pipe", "Correctly suggests 'Water / Pipe Leak' for 'guba nga tubo harani sa gripo'");

    // Case F: Fallen Tree
    const sugTree = await suggestCategoryWithAI(
      "May tumba nga daku nga sanga san kahoy nga nakabalabag sa dalan",
      categories
    );
    assert(sugTree?.suggestedCategoryId === "cat-tree", "Correctly suggests 'Fallen Tree' for 'tumba nga kahoy'");
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. CIVIC ASSISTANT CHATBOT (MASBATEÑO Q&A)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- TEST GROUP 5: Civic Assistant Chatbot (Minasbate Q&A) ---");
  {
    // Question 1: How to report
    const ansHowTo = await civicChatWithAI(
      [{ role: "user", content: "Paano ako maka-report hin problema?" }],
      "msb"
    );
    assert(ansHowTo.includes("Report an Issue"), "How-to-report mentions 'Report an Issue' button");
    assert(ansHowTo.includes("GPS") || ansHowTo.includes("mapa"), "Mentions GPS pin or interactive map");
    assert(ansHowTo.includes("Reference Number"), "Mentions tracking Reference Number");

    // Question 2: Where to see report
    const ansWhere = await civicChatWithAI(
      [{ role: "user", content: "Diin ako makikita han akon report?" }],
      "msb"
    );
    assert(ansWhere.includes("Reports"), "Where-to-see points user to 'Reports' navigation tab");

    // Question 3: Under Review definition
    const ansStatus = await civicChatWithAI(
      [{ role: "user", content: "Ano ibig sabihin nga Under Review?" }],
      "msb"
    );
    assert(ansStatus.includes("Under Review"), "Explains 'Under Review'");
    assert(ansStatus.includes("barangay staff"), "Explains staff inspection");
    assert(ansStatus.includes("Resolved"), "Includes system status progression");

    // Question 4: Change location on map
    const ansLocation = await civicChatWithAI(
      [{ role: "user", content: "Paano ko bag-uhon an location han report?" }],
      "msb"
    );
    assert(ansLocation.includes("Locate Me") || ansLocation.includes("mapa"), "Explains location adjustment on map");

    // Question 5: Emergency hotlines
    const ansHotline = await civicChatWithAI(
      [{ role: "user", content: "Ano an emergency hotline kon may delikado nga sunog o kuryente?" }],
      "msb"
    );
    assert(ansHotline.includes("Masbate CDRRMO") || ansHotline.includes("(056) 333-2244"), "Provides Masbate CDRRMO hotline");
    assert(ansHotline.includes("911"), "Provides 911 National Emergency hotline");
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. MIXED LANGUAGE COMPREHENSION
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- TEST GROUP 6: Mixed-Language Comprehension ---");
  {
    // Mixed Masbateño + English
    const mixed1 = await civicChatWithAI(
      [{ role: "user", content: "I want to track akon report gamit an reference number, diin makit-an?" }],
      "msb"
    );
    assert(mixed1.includes("Reports"), "Understands mixed Masbateño + English query about tracking");

    // Mixed Masbateño + Filipino
    const mixed2 = await civicChatWithAI(
      [{ role: "user", content: "Pano mag report ng lubak didi sa kalsada harani sa amon?" }],
      "msb"
    );
    assert(mixed2.includes("Report an Issue"), "Understands mixed Masbateño + Filipino report query");
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. UNCERTAINTY & RESPECTFUL CLARIFICATION
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- TEST GROUP 7: Uncertainty Fallback ---");
  {
    const uncertainAns = await civicChatWithAI(
      [{ role: "user", content: "xkcd123 blurp zorp" }],
      "msb"
    );
    assert(
      uncertainAns.includes("Pasensya na, pwede mo pa ba klaruhon") || uncertainAns.includes(MASBATENO_UNCERTAINTY_PROMPT),
      "Offers polite, respectful uncertainty prompt without making false claims"
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. FAIR MODERATION (DIALECT NON-DISCRIMINATION VS TRUE PRANKS)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- TEST GROUP 8: AI Moderation (Dialect Tolerance & Prank Detection) ---");
  {
    // Normal legitimate Masbateño report: Must NOT be flagged as prank or gibberish
    const legitMasbateno = await moderateReportWithAI({
      description: "May daku nga lubak sa kalsada harani sa barangay hall, delikado sa mga motorista.",
      categorySlug: "road-damage",
      categoryName: "Road / Pothole",
      photoUrls: ["https://example.com/pothole.jpg"],
    });
    assert(legitMasbateno.suspicion_level === "low", "Legitimate Masbateño description has LOW suspicion");
    assert(legitMasbateno.recommendation === "Approve", "Recommends 'Approve' for legitimate Masbateño report");
    assert(!legitMasbateno.requires_human_review, "Does not needlessly demand human review for normal dialect");

    // Actual prank report with dialect prank keywords (binuang, haha)
    const prankReport = await moderateReportWithAI({
      description: "Hahaha binuang la ini testing superhero dimension 😂🤣",
      categorySlug: "road-damage",
      categoryName: "Road / Pothole",
    });
    assert(prankReport.suspicion_level === "high", "Flags obvious prank with 'binuang' and laughing emojis as HIGH suspicion");
    assert(prankReport.requires_human_review, "Demands human review for obvious prank report");
  }

  console.log("\n===============================================================================");
  console.log(`🏁 TEST RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log("===============================================================================");

  if (passed === total) {
    console.log("✨ ALL MASBATEÑO AI REQUIREMENTS ARE 100% VERIFIED AND WORKING.");
  } else {
    console.error("⚠️ SOME TESTS FAILED. PLEASE INVESTIGATE.");
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Test execution fatal error:", e);
  process.exit(1);
});
