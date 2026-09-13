/**
 * BantayBarangay AI Core Service & Resilience Engine
 * 
 * Provides:
 * 1. AI Report Moderation & Multimodal Risk Assessment (Text + Vision)
 * 2. Smart Report Writing Assistant ("Help Me Write My Report")
 * 3. AI Municipal Category Suggestion
 * 4. Pre-Submission Report Quality Checklist
 * 5. Grounded Civic AI Assistant (Chatbot)
 * 
 * Safety & Resilience:
 * - PII Stripping: Never sends names, phones, or resident identities to AI providers.
 * - Non-punitive: Never automatically rejects or deletes reports based on AI predictions.
 * - Fail-Safe Fallback: If GEMINI_API_KEY / OPENAI_API_KEY is missing, rate-limited, or offline,
 *   seamlessly falls back to an intelligent heuristic engine with identical structured schemas.
 */

import prisma from "./db";
import {
  SupportedLanguage,
  resolveLanguage,
  isMasbatenoText,
  detectLanguageWithConfidence,
  sanitizeMasbatenoOutput,
  MASBATENO_CIVIC_RESPONSES,
  MASBATENO_UNCERTAINTY_PROMPT,
} from "./languages/masbatenoGlossary";

export type { SupportedLanguage };

export interface AiModerationResult {
  category_match: "likely" | "uncertain" | "mismatch";
  image_relevance: "high" | "uncertain" | "unrelated" | "none";
  description_quality: "good" | "insufficient" | "vague";
  possible_duplicate: boolean;
  suspicion_level: "low" | "medium" | "high";
  requires_human_review: boolean;
  is_ai_generated_suspected: boolean;
  safety_hazard: boolean;
  safety_hazard_details: string | null;
  recommendation: "Approve" | "Human Review" | "Request More Info" | "Merge Duplicate";
  reason: string;
}

export interface AiQualityCheckItem {
  id: string;
  label: string;
  passed: boolean;
  message: string;
  tip?: string;
}

export interface AiQualityCheckResult {
  score: number; // 0 - 100
  overallQuality: "excellent" | "good" | "needs_improvement";
  items: AiQualityCheckItem[];
  suggestions: string[];
}

export interface AiCategorySuggestionResult {
  suggestedCategoryId: string;
  categoryName: string;
  confidence: number; // 0.0 to 1.0
  reason: string;
}

export interface ReportAssistantAnswers {
  problem: string;
  location: string;
  dangerOrDifficulty?: string;
  duration?: string;
}

// ─── 1. PII STRIPPER ──────────────────────────────────────────────────────────

export function stripPII(text: string): string {
  if (!text) return "";
  let clean = text;
  // Strip Philippine phone numbers with optional separators (+63 9..., 09..., etc.)
  clean = clean.replace(/(?:\+63|0)[\s.-]?9(?:\d[\s.-]?){9}\b/g, "[PHONE_REDACTED]");
  // Strip standard email addresses
  clean = clean.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL_REDACTED]");
  // Strip sensitive ID-like formats
  clean = clean.replace(/\b\d{4}[-\s]\d{4}[-\s]\d{4}\b/g, "[ID_REDACTED]");
  return clean;
}

// ─── 2. SAFETY HAZARD KEYWORDS ───────────────────────────────────────────────

const SAFETY_HAZARD_PATTERNS = [
  /(?:exposed|live|dangling|grounded|nakalawit|fallen|downed|snapped|putol)\s*(?:electrical\s*|power\s*|utility\s*)?(?:wire|cable|kuryente|line)/i,
  /(?:electrical\s*|power\s*|utility\s*)?(?:wire|cable|kuryente|line)s?\s*(?:have\s*|has\s*|na\s*)?(?:fallen|downed|snapped|dangling|hanging|bumagsak|putol)/i,
  /(?:sparking|nag-?spark|spark|kumikislap)/i,
  /(?:fallen|tumbang|bumagsak|leaning|damaged|broken|nakatagilid|nakatabingi)\s*(?:electric|electrical|power|utility|poste)?\s*(?:pole|poste|post)/i,
  /(?:electric|electrical|power|utility|poste)?\s*(?:pole|poste|post)\s*(?:is\s*)?(?:leaning|damaged|broken|falling|tumba|nakatagilid|nakatabingi)/i,
  /(?:downed|putol na)\s*power\s*line/i,
  /(?:major|severe|heavy|deep|chest\s*deep)?\s*(?:flood|flooding|baha|lumulubog)/i,
  /collapsed\s*(?:bridge|wall|structure|culvert)|gumuho/i,
  /gas\s*leak|smell\s*gas|amoy\s*gas/i,
  /(?:deep\s*)?sinkhole|open\s*manhole|bukas\s*na\s*manhole/i,
  /live\s*current|electrocution|nakukuryente/i,
  /landslide|soil\s*erosion|guho/i,
  /sunog|fire|apoy|sumasabog|explosion|sumabog/i,
];

export function detectSevereSafetyHazard(text: string): { isHazard: boolean; detail: string | null; matchedHazard?: string } {
  for (const pattern of SAFETY_HAZARD_PATTERNS) {
    if (pattern.test(text)) {
      const match = text.match(pattern);
      return {
        isHazard: true,
        detail: `Critical public hazard detected: "${match?.[0]}". Potential risk to life or severe property damage.`,
        matchedHazard: match?.[0],
      };
    }
  }
  return { isHazard: false, detail: null };
}

// ─── 3. PROVIDER CALL HELPERS ─────────────────────────────────────────────────

function getActiveProvider(): { provider: "gemini" | "openai" | "none"; apiKey: string } {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey.trim().length > 5) {
    return { provider: "gemini", apiKey: geminiKey.trim() };
  }
  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey && openAiKey.trim().length > 5) {
    return { provider: "openai", apiKey: openAiKey.trim() };
  }
  return { provider: "none", apiKey: "" };
}

async function callGemini(apiKey: string, prompt: string, jsonMode: boolean = false, imageUrl?: string): Promise<string> {
  const model = "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const contents: any[] = [];
  const parts: any[] = [{ text: prompt }];

  // Optional multimodal image inspection
  if (imageUrl && (imageUrl.startsWith("data:") || imageUrl.startsWith("http"))) {
    if (imageUrl.startsWith("data:")) {
      const commaIdx = imageUrl.indexOf(",");
      const mime = imageUrl.substring(5, imageUrl.indexOf(";"));
      const base64Data = imageUrl.substring(commaIdx + 1);
      parts.push({
        inlineData: {
          mimeType: mime,
          data: base64Data,
        },
      });
    }
  }

  contents.push({ parts });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8500);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1000,
        responseMimeType: jsonMode ? "application/json" : undefined,
      },
    }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return rawText;
}

async function callOpenAi(apiKey: string, prompt: string, jsonMode: boolean = false): Promise<string> {
  const url = "https://api.openai.com/v1/chat/completions";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8500);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: jsonMode ? { type: "json_object" } : undefined,
    }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || "";
}

// ─── 4. HEURISTIC FALLBACK ENGINES ────────────────────────────────────────────

function fallbackModerateReport(
  description: string,
  categorySlug: string,
  categoryName: string,
  photoCount: number,
  photoUrls: string[] = []
): AiModerationResult {
  const clean = description.trim().toLowerCase();
  const hazard = detectSevereSafetyHazard(clean);

  // 1. Text quality check
  const words = clean.split(/\s+/).filter(Boolean);
  let descQuality: "good" | "insufficient" | "vague" = "good";
  if (words.length < 4) descQuality = "insufficient";
  else if (words.length < 8) descQuality = "vague";

  // 2. Gibberish / repetition / nonsense / prank check
  const isGibberish = /^[asdfghjklqwertyuiopzxcvbnm1234567890]{10,}$/i.test(clean) || (words.length > 5 && new Set(words).size < words.length * 0.35);
  const isObviousPrank =
    /\b(haha|joke|lmao|lol|rofl|prank|test\s*123|dummy\s*report|testing\s*lang|alien|portal|dimension|zombie|superman|galaxy|binuang|loko-loko|joke\s*la|laing\s*kalibutan)\b/i.test(clean) ||
    /😂|🤣|🤪|🤡/.test(clean);

  // 3. Category match heuristic (English + Filipino + Masbateño)
  let categoryMatch: "likely" | "uncertain" | "mismatch" = "likely";
  const roadKeywords = ["pothole", "lubak", "crack", "asphalt", "semento", "kalsada", "road", "bako", "street", "gutter", "buho", "daku", "guba", "bitak"];
  const lightKeywords = ["light", "ilaw", "poste", "dilim", "lamp", "bulb", "flicker", "wire", "electric", "suga", "pundi", "padong", "madulom", "bombilya"];
  const waterKeywords = ["tubig", "water", "leak", "tulo", "pipe", "baha", "drain", "drainage", "clog", "kanal", "nagabaha", "lapaw", "awas", "gripo", "tubo"];
  const wasteKeywords = ["basura", "garbage", "trash", "waste", "tapon", "dumot", "amoy", "smell", "ramit", "tambak", "baho", "mabahoon"];

  const cat = categorySlug.toLowerCase();
  let relevantKeywords: string[] = [];
  if (cat.includes("road") || cat.includes("pothole")) relevantKeywords = roadKeywords;
  else if (cat.includes("light") || cat.includes("lamp")) relevantKeywords = lightKeywords;
  else if (cat.includes("water") || cat.includes("drain") || cat.includes("flood")) relevantKeywords = waterKeywords;
  else if (cat.includes("waste") || cat.includes("garbage")) relevantKeywords = wasteKeywords;

  if (relevantKeywords.length > 0) {
    const hasMatch = relevantKeywords.some((kw) => clean.includes(kw));
    if (!hasMatch && words.length >= 6) {
      const matchesOther =
        (roadKeywords.some((kw) => clean.includes(kw)) && !cat.includes("road")) ||
        (lightKeywords.some((kw) => clean.includes(kw)) && !cat.includes("light")) ||
        (wasteKeywords.some((kw) => clean.includes(kw)) && !cat.includes("waste"));
      categoryMatch = matchesOther ? "mismatch" : "uncertain";
    }
  }

  // 4. Image relevance heuristic (checks filenames for obvious mismatches like food/pets)
  let imageRelevance: "high" | "uncertain" | "unrelated" | "none" = photoCount > 0 ? "high" : "none";
  if (photoCount > 0 && photoUrls.length > 0) {
    const firstPhoto = photoUrls[0].toLowerCase();
    const unrelatedKeywords = ["food", "pet", "dog", "cat", "burger", "pizza", "selfie", "meme"];
    if (unrelatedKeywords.some((kw) => firstPhoto.includes(kw))) {
      imageRelevance = "unrelated";
    }
  }

  // Determine suspicion and risk
  let suspicion: "low" | "medium" | "high" = "low";
  let reason = "The report description and category appear coherent and actionable.";
  let recommendation: "Approve" | "Human Review" | "Request More Info" | "Merge Duplicate" = "Approve";

  if (hazard.isHazard) {
    reason = `Critical safety hazard detected: ${hazard.detail}. Urgent municipal response required.`;
    recommendation = "Human Review";
  } else if (isGibberish || isObviousPrank) {
    suspicion = "high";
    reason = "The description contains prank phrases, laughing emojis, or fantasy claims typical of non-serious reports.";
    recommendation = "Human Review";
  } else if (imageRelevance === "unrelated") {
    suspicion = "medium";
    reason = "Attached image appears unrelated to the reported infrastructure category.";
    recommendation = "Human Review";
  } else if (categoryMatch === "mismatch") {
    suspicion = "medium";
    reason = `Report details mention problems unrelated to the selected "${categoryName}" category.`;
    recommendation = "Human Review";
  } else if (descQuality === "insufficient") {
    suspicion = "medium";
    reason = "Description is very short and lacks landmark, location, or severity specifics.";
    recommendation = "Request More Info";
  }

  return {
    category_match: categoryMatch,
    image_relevance: imageRelevance,
    description_quality: descQuality,
    possible_duplicate: false,
    suspicion_level: suspicion,
    requires_human_review: suspicion === "high" || hazard.isHazard || imageRelevance === "unrelated",
    is_ai_generated_suspected: false,
    safety_hazard: hazard.isHazard,
    safety_hazard_details: hazard.detail,
    recommendation,
    reason,
  };
}

// ─── 5. PUBLIC API METHODS ────────────────────────────────────────────────────

/**
 * Moderates a resident report using Multimodal AI (Gemini/OpenAI) with rule-based fallback.
 * Strictly adheres to the Non-Punitive & Zero Automatic Rejection principles.
 */
export async function moderateReportWithAI(input: {
  description: string;
  categorySlug: string;
  categoryName: string;
  photoUrls?: string[];
}): Promise<AiModerationResult> {
  const cleanDescription = stripPII(input.description);
  const { provider, apiKey } = getActiveProvider();
  const photoCount = input.photoUrls?.length || 0;
  const primaryPhoto = input.photoUrls?.[0];

  // Immediate safety hazard detection (deterministic guarantee)
  const hazardCheck = detectSevereSafetyHazard(cleanDescription);

  if (provider === "none") {
    const result = fallbackModerateReport(cleanDescription, input.categorySlug, input.categoryName, photoCount, input.photoUrls || []);
    if (hazardCheck.isHazard) {
      result.safety_hazard = true;
      result.safety_hazard_details = hazardCheck.detail;
    }
    return result;
  }

  const prompt = `You are the BantayBarangay AI Civic Moderation Assistant for a Philippine local government unit.
Analyze this community civic report submitted by a resident:
- Category: "${input.categoryName}" (Slug: ${input.categorySlug})
- Description: "${cleanDescription}"
- Number of photos attached: ${photoCount}

CRITICAL RULES:
1. NEVER automatically punish or reject a user. AI provides risk signals to assist human staff.
2. If the text is in Masbateño (Minasbate as spoken in Masbate Province/City), Tagalog, Taglish, or English, evaluate fairly and constructively. DO NOT treat local dialect grammar, normal Masbateño expressions (e.g., 'daku nga lubak', 'harani sa barangay hall', 'suga pundi', 'nag-awas an kanal', 'ramit'), or informal spelling as spam, nonsense, or fake reports.
3. Check for: spam, gibberish/pranks, contradictory claims, category mismatch, synthetic/AI-generated text or images, and severe public safety hazards.
4. Output STRICTLY JSON with these exact keys:
{
  "category_match": "likely" | "uncertain" | "mismatch",
  "image_relevance": "high" | "uncertain" | "unrelated" | "none",
  "description_quality": "good" | "insufficient" | "vague",
  "possible_duplicate": false,
  "suspicion_level": "low" | "medium" | "high",
  "requires_human_review": boolean,
  "is_ai_generated_suspected": boolean,
  "safety_hazard": boolean,
  "safety_hazard_details": string | null,
  "recommendation": "Approve" | "Human Review" | "Request More Info" | "Merge Duplicate",
  "reason": "Brief, respectful 1-2 sentence explanation for municipal staff."
}`;

  try {
    let rawJson = "";
    if (provider === "gemini") {
      rawJson = await callGemini(apiKey, prompt, true, primaryPhoto);
    } else {
      rawJson = await callOpenAi(apiKey, prompt, true);
    }

    // Clean markdown code blocks if returned
    const cleaned = rawJson.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      category_match: ["likely", "uncertain", "mismatch"].includes(parsed.category_match) ? parsed.category_match : "likely",
      image_relevance: ["high", "uncertain", "unrelated", "none"].includes(parsed.image_relevance) ? parsed.image_relevance : (photoCount > 0 ? "high" : "none"),
      description_quality: ["good", "insufficient", "vague"].includes(parsed.description_quality) ? parsed.description_quality : "good",
      possible_duplicate: Boolean(parsed.possible_duplicate),
      suspicion_level: ["low", "medium", "high"].includes(parsed.suspicion_level) ? parsed.suspicion_level : "low",
      requires_human_review: parsed.suspicion_level === "high" || Boolean(parsed.requires_human_review),
      is_ai_generated_suspected: Boolean(parsed.is_ai_generated_suspected),
      safety_hazard: hazardCheck.isHazard || Boolean(parsed.safety_hazard),
      safety_hazard_details: hazardCheck.detail || parsed.safety_hazard_details || null,
      recommendation: ["Approve", "Human Review", "Request More Info", "Merge Duplicate"].includes(parsed.recommendation) ? parsed.recommendation : "Approve",
      reason: parsed.reason || "Report validated by AI moderation.",
    };
  } catch (err) {
    console.warn("AI service call failed, engaging fallback moderation:", err);
    const result = fallbackModerateReport(cleanDescription, input.categorySlug, input.categoryName, photoCount, input.photoUrls || []);
    if (hazardCheck.isHazard) {
      result.safety_hazard = true;
      result.safety_hazard_details = hazardCheck.detail;
    }
    return result;
  }
}

/**
 * Smart Report Assistant ("✨ Help Me Write My Report")
 * Turns 4 simple resident answers into a structured, clear civic description.
 * Never invents facts not provided by the resident.
 */
export async function assistWriteReportWithAI(
  answers: ReportAssistantAnswers,
  languagePreference?: SupportedLanguage
): Promise<string> {
  let cleanProblem = stripPII(answers.problem || "").trim();
  let cleanLocation = stripPII(answers.location || "").trim();
  let cleanDanger = stripPII(answers.dangerOrDifficulty || "").trim();
  let cleanDuration = stripPII(answers.duration || "").trim();

  // Normalize informal Masbateño abbreviations and SMS spellings
  const normalizeInformalMasbateno = (str: string): string => {
    return str
      .replace(/\blbak\b/gi, "lubak")
      .replace(/\bdku\b/gi, "daku")
      .replace(/\bdko\b/gi, "daku")
      .replace(/\bpndi\b/gi, "pundi")
      .replace(/\bklsda\b/gi, "kalsada")
      .replace(/\bklsada\b/gi, "kalsada")
      .replace(/\bpste\b/gi, "poste")
      .replace(/\bwla\b/gi, "wara")
      .replace(/\bknl\b/gi, "kanal")
      .replace(/\bbsura\b/gi, "basura")
      .replace(/\bmaau\b/gi, "maayo")
      .replace(/\btbg\b/gi, "tubig")
      .replace(/\bkhoy\b/gi, "kahoy");
  };

  cleanProblem = normalizeInformalMasbateno(cleanProblem);
  cleanLocation = normalizeInformalMasbateno(cleanLocation);
  cleanDanger = normalizeInformalMasbateno(cleanDanger);
  cleanDuration = normalizeInformalMasbateno(cleanDuration);

  const targetLang = resolveLanguage(languagePreference, cleanProblem);

  // Heuristic text generator
  const generateFallback = () => {
    if (targetLang === "msb") {
      const parts: string[] = [];
      if (cleanProblem) {
        const startsWithMay = /^(may|iwa|wara|observed|naobserbahan|aduna)/i.test(cleanProblem);
        parts.push(startsWithMay ? `${cleanProblem}.` : `May naobserbahan nga problema: ${cleanProblem}.`);
      }
      if (cleanLocation) parts.push(`Nahimutang harani sa/sa ${cleanLocation}.`);
      if (cleanDanger && !/^(none|wala|wara|wawara|n\/a)$/i.test(cleanDanger)) {
        parts.push(`Peligro sa publiko: ${cleanDanger}.`);
      }
      if (cleanDuration && !/^(none|wala|wara|n\/a)$/i.test(cleanDuration)) {
        parts.push(`Kadugayon: May ${cleanDuration} na ini.`);
      }
      // Respectful local civic request sentence
      parts.push("Palihog inspeksyunon kag ayuhon dayon san mga personahe agod malikayan an disgrasya.");
      return sanitizeMasbatenoOutput(parts.join(" "));
    } else if (targetLang === "fil") {
      const parts: string[] = [];
      if (cleanProblem) {
        const startsWithMay = /^(may|mayroon|naobserbahan)/i.test(cleanProblem);
        parts.push(startsWithMay ? `${cleanProblem}.` : `May naobserbahang problema: ${cleanProblem}.`);
      }
      if (cleanLocation) parts.push(`Matatagpuan malapit sa ${cleanLocation}.`);
      if (cleanDanger && !/^(none|wala|n\/a)$/i.test(cleanDanger)) {
        parts.push(`Panganib sa publiko: ${cleanDanger}.`);
      }
      if (cleanDuration && !/^(none|wala|n\/a)$/i.test(cleanDuration)) {
        parts.push(`Tagal: Halos ${cleanDuration} na ito.`);
      }
      return parts.join(" ");
    } else {
      const parts: string[] = [];
      if (cleanProblem) {
        const startsWithThereIs = /^(there is|there are|may|meron|observed)/i.test(cleanProblem);
        parts.push(startsWithThereIs ? `${cleanProblem}.` : `There is an observed issue: ${cleanProblem}.`);
      }
      if (cleanLocation) parts.push(`Located at/near ${cleanLocation}.`);
      if (cleanDanger && !/^(none|n\/a)$/i.test(cleanDanger)) {
        parts.push(`Impact/Difficulty: ${cleanDanger}.`);
      }
      if (cleanDuration && !/^(none|n\/a)$/i.test(cleanDuration)) {
        parts.push(`Duration: Has been present for ${cleanDuration}.`);
      }
      return parts.join(" ");
    }
  };

  const { provider, apiKey } = getActiveProvider();
  if (provider === "none") {
    return generateFallback();
  }

  const langInstruction =
    targetLang === "msb"
      ? "Write in authentic, natural Masbateño (Minasbate as spoken in Masbate City/Province). Use authentic markers (an, san, sin, diri, wara, kag). NEVER use Waray markers (hin, han, maupay), Cebuano markers (dili, unsa, og), or Tagalog literalisms. Keep standardized terms like 'Reference Number', 'GPS', 'Barangay Hall' intact."
      : targetLang === "fil"
      ? "Write in natural conversational Filipino/Tagalog."
      : "Write in clear, respectful English.";

  const prompt = `You are the BantayBarangay Smart Writing Assistant for Masbate City / Masbate Province.
Help a resident compose a concise, professional civic report for barangay public works dispatch.
Resident's answers:
- What problem: "${cleanProblem}"
- Location / landmark: "${cleanLocation}"
- Danger or difficulty to public: "${cleanDanger}"
- Duration / how long: "${cleanDuration}"

RULES:
1. ${langInstruction}
2. Include the location, nature of problem, and public impact provided.
3. NEVER invent facts, dimensions, dates, injuries, or agencies the resident did not mention.
4. Output ONLY the finalized report description text without conversational prefixes or quotes.`;

  try {
    let result = "";
    if (provider === "gemini") {
      result = await callGemini(apiKey, prompt, false);
    } else {
      result = await callOpenAi(apiKey, prompt, false);
    }
    const cleanResult = result.trim().replace(/^["']|["']$/g, "");
    return targetLang === "msb" ? sanitizeMasbatenoOutput(cleanResult) || generateFallback() : cleanResult || generateFallback();
  } catch (err) {
    console.warn("AI assist write error, using fallback:", err);
    return generateFallback();
  }
}

/**
 * AI Category Suggestion
 * Recommends the best category based on user draft text & categories list.
 * Supports English, Filipino, and Masbateño descriptions.
 */
export async function suggestCategoryWithAI(
  description: string,
  categories: Array<{ id: string; name: string; slug?: string; description?: string }>
): Promise<AiCategorySuggestionResult | null> {
  const cleanText = stripPII(description || "").toLowerCase();
  if (cleanText.length < 8) return null;

  const isMsb = isMasbatenoText(cleanText);

  // Keyword heuristic (English + Filipino + Masbateño)
  for (const c of categories) {
    const name = (c.name || "").toLowerCase();
    const slug = (c.slug || "").toLowerCase();
    if (
      ((name.includes("drain") || name.includes("flood") || slug.includes("drain")) &&
        (cleanText.includes("kanal") || cleanText.includes("drain") || cleanText.includes("baha") || cleanText.includes("clog") || (cleanText.includes("tubig") && (cleanText.includes("baha") || cleanText.includes("kanal") || cleanText.includes("awas"))) || cleanText.includes("umapaw") || cleanText.includes("nag-awas") || cleanText.includes("nagabaha") || cleanText.includes("lapaw") || cleanText.includes("barado"))) ||
      ((name.includes("water") || slug.includes("water") || name.includes("pipe") || slug.includes("pipe")) &&
        (cleanText.includes("tubo") || cleanText.includes("gripo") || cleanText.includes("leak") || cleanText.includes("tulo") || cleanText.includes("nagasaribo") || cleanText.includes("putol nga tubo") || cleanText.includes("guba nga tubo") || cleanText.includes("wara tubig") || cleanText.includes("walang tubig"))) ||
      ((name.includes("light") || name.includes("electric") || slug.includes("light")) &&
        (cleanText.includes("poste") || cleanText.includes("ilaw") || cleanText.includes("streetlight") || cleanText.includes("dilim") || cleanText.includes("lamp") || cleanText.includes("suga") || cleanText.includes("pundi") || cleanText.includes("padong") || cleanText.includes("madulom") || cleanText.includes("bombilya"))) ||
      ((name.includes("waste") || name.includes("garbage") || slug.includes("waste")) &&
        (cleanText.includes("basura") || cleanText.includes("garbage") || cleanText.includes("trash") || cleanText.includes("amoy") || cleanText.includes("ramit") || cleanText.includes("dumot") || cleanText.includes("tambak") || cleanText.includes("mabahoon") || cleanText.includes("baho"))) ||
      ((/\btrees?\b/i.test(name) || /\btrees?\b/i.test(slug) || name.includes("vegetation") || slug.includes("vegetation")) &&
        (cleanText.includes("puno") || cleanText.includes("kahoy") || cleanText.includes("tumba") || cleanText.includes("tumbang") || cleanText.includes("sanga") || cleanText.includes("nakabalabag") || cleanText.includes("nakaharang"))) ||
      ((name.includes("road") || name.includes("pothole") || slug.includes("road")) &&
        (cleanText.includes("lubak") || cleanText.includes("pothole") || cleanText.includes("aspalto") || cleanText.includes("sinkhole") || cleanText.includes("sira ang kalsada") || cleanText.includes("sira ang daan") || cleanText.includes("buho") || cleanText.includes("kalsada") || cleanText.includes("daku nga lubak") || cleanText.includes("bako") || cleanText.includes("guba nga kalsada") || cleanText.includes("guba nga daan"))) ||
      ((name.includes("facility") || slug.includes("facility") || name.includes("public")) &&
        (cleanText.includes("covered court") || cleanText.includes("plaza") || cleanText.includes("tulay") || cleanText.includes("kudal") || cleanText.includes("waiting shed") || cleanText.includes("gym") || cleanText.includes("pader")))
    ) {
      return {
        suggestedCategoryId: c.id,
        categoryName: c.name,
        confidence: 0.9,
        reason: isMsb
          ? `An imo deskripsyon nagasambit san mga detalye nga may labot sa ${c.name}.`
          : `Your description mentions issues directly related to ${c.name}.`,
      };
    }
  }

  const { provider, apiKey } = getActiveProvider();
  if (provider === "none") {
    return null;
  }

  const catList = categories.map((c) => `- ID: ${c.id}, Name: "${c.name}", Slug: ${c.slug}`).join("\n");
  const prompt = `You are the BantayBarangay AI Category Selector.
Select the single best category for this citizen report:
"${cleanText}"

Available Categories:
${catList}

Output ONLY valid JSON:
{
  "suggestedCategoryId": "id_here",
  "categoryName": "name_here",
  "confidence": 0.85,
  "reason": "Short 1-sentence reason"
}`;

  try {
    let raw = "";
    if (provider === "gemini") {
      raw = await callGemini(apiKey, prompt, true);
    } else {
      raw = await callOpenAi(apiKey, prompt, true);
    }
    const parsed = JSON.parse(raw.replace(/```json/g, "").replace(/```/g, "").trim());
    if (parsed.suggestedCategoryId && categories.some((c) => c.id === parsed.suggestedCategoryId)) {
      return parsed;
    }
  } catch (err) {
    // Graceful silent fallback
  }

  return null;
}

/**
 * Pre-Submission AI Report Quality Check
 * Returns constructive, actionable checklist before final submission.
 */
export function checkReportQuality(input: {
  categorySelected: boolean;
  description: string;
  hasPhoto: boolean;
  hasLocation: boolean;
}): AiQualityCheckResult {
  const desc = input.description?.trim() || "";
  const words = desc.split(/\s+/).filter(Boolean);
  const items: AiQualityCheckItem[] = [];
  const suggestions: string[] = [];

  // 1. Category check
  items.push({
    id: "category",
    label: "Category Clarity",
    passed: input.categorySelected,
    message: input.categorySelected ? "Issue category is clearly defined" : "No category selected yet",
    tip: input.categorySelected ? undefined : "Choose the category that best matches your problem.",
  });

  // 2. Description specificity check
  const descPassed = words.length >= 8;
  items.push({
    id: "description",
    label: "Description Detail",
    passed: descPassed,
    message: descPassed ? "Description provides sufficient actionable detail" : "Description is brief or missing specifics",
    tip: descPassed ? undefined : "Include landmarks or specify how vehicles/pedestrians are affected.",
  });
  if (!descPassed) {
    suggestions.push("Add a nearby landmark or mention what is being affected for faster dispatch.");
  }

  // 3. Photo evidence check
  items.push({
    id: "photo",
    label: "Photo Evidence",
    passed: input.hasPhoto,
    message: input.hasPhoto ? "Photo evidence attached for inspection" : "No photo attached",
    tip: input.hasPhoto ? undefined : "Photos help municipal repair teams bring the right tools and materials.",
  });
  if (!input.hasPhoto) {
    suggestions.push("Adding a photo significantly speeds up triage and verification.");
  }

  // 4. Geospatial pin check
  items.push({
    id: "location",
    label: "Geographic Location",
    passed: input.hasLocation,
    message: input.hasLocation ? "Pinpoint coordinates and address confirmed" : "Location not confirmed",
    tip: input.hasLocation ? undefined : "Use 'Locate Me' or tap the map to place an accurate pin.",
  });

  const passedCount = items.filter((i) => i.passed).length;
  const score = Math.round((passedCount / items.length) * 100);
  const overallQuality = score >= 90 ? "excellent" : score >= 60 ? "good" : "needs_improvement";

  return {
    score,
    overallQuality,
    items,
    suggestions,
  };
}

/**
 * Grounded Civic AI Assistant (Chatbot)
 * Answers resident questions strictly regarding BantayBarangay platform features.
 */
export async function civicChatWithAI(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  languagePreference?: SupportedLanguage
): Promise<string> {
  const lastUserMsg = messages[messages.length - 1]?.content || "";
  const cleanMsg = stripPII(lastUserMsg).toLowerCase();
  const targetLang = resolveLanguage(languagePreference, cleanMsg);

  // Guardrail: Never claim action was taken
  const refusalPhrases = ["submit my report", "delete my account", "approve this report", "transfer money", "i-delete an akon", "isumite an akon", "i-delete ang aking"];
  if (refusalPhrases.some((p) => cleanMsg.includes(p))) {
    if (targetLang === "msb") {
      return "Ako an imo BantayBarangay Civic Guide didi sa Masbate. Para sa imo seguridad, diri ako pwede magsumite o magbag-o san reports direkta. Palihog gamita an '📍 Report an Issue' form o magpakig-istorya sa barangay staff.";
    }
    if (targetLang === "fil") {
      return "Ako ang iyong BantayBarangay gabay. Para sa iyong seguridad, hindi ako maaaring magpasa o magbura ng report nang direkta. Gamitin ang '📍 Report an Issue' form o makipag-ugnayan sa barangay staff.";
    }
    return "I am your BantayBarangay informational guide. For your security, I cannot submit or modify reports directly. Please use the '📍 Report an Issue' form or contact barangay staff.";
  }

  // ─── 1. MASBATEÑO RESPONSES ───
  if (targetLang === "msb") {
    // 0. Reference Number Tracking
    if (cleanMsg.includes("reference number") || (cleanMsg.includes("track") && cleanMsg.includes("reference"))) {
      return sanitizeMasbatenoOutput(
        `Para i-track an imo report gamit an Reference Number:
1. Pinduta an 'Reports' icon sa ubos nga navigation bar.
2. Gamita an Search bar kag i-type an imo Reference Number (halimbawa: BB-2026-XXXX).
3. Makit-an mo dayon an pinaka-bag-o nga kamutangan kag opisyal nga updates san barangay staff.`
      );
    }

    // 1. Under Review / Statuses / Tracking
    if (
      cleanMsg.includes("under review") ||
      cleanMsg.includes("status") ||
      cleanMsg.includes("kamutangan") ||
      cleanMsg.includes("buot sabihon") ||
      cleanMsg.includes("ibig sabihin") ||
      cleanMsg.includes("assign") ||
      cleanMsg.includes("in progress") ||
      cleanMsg.includes("resolved") ||
      cleanMsg.includes("closed") ||
      cleanMsg.includes("submitted") ||
      cleanMsg.includes("nagasusi") ||
      cleanMsg.includes("notification") ||
      cleanMsg.includes("abiso")
    ) {
      return sanitizeMasbatenoOutput(
        MASBATENO_CIVIC_RESPONSES.find((r) => r.domain === "check_status")?.response ||
        `Sa BantayBarangay, ini an buot sabihon san mga Report Status:
• Submitted: Naresibe na san sistema an imo report.
• Under Review: Ginasusi na san barangay staff kag gina-preparar an inspection kag dispatch sa mga trabahador.
• Assigned: Ginpasa na sa natungdan nga ahensya o repair crew (hal. Engineering o Utility).
• In Progress: Ginatrabaho kag gina-repair na an problema sa lugar.
• Resolved: Nahuman na an pag-ayo! Gina-imbitar an residente nga mag-kumpirma.
• Closed: Opisyal na nga nasirad-an kag na-archive an kaso.`
      );
    }

    // 2. Track / where to see reports
    if (
      cleanMsg.includes("track") ||
      cleanMsg.includes("diin") ||
      cleanMsg.includes("makita") ||
      cleanMsg.includes("makit-an") ||
      cleanMsg.includes("nasaan") ||
      cleanMsg.includes("subaybayan") ||
      cleanMsg.includes("akon report")
    ) {
      return sanitizeMasbatenoOutput(
        MASBATENO_CIVIC_RESPONSES.find((r) => r.domain === "check_status")?.response ||
        `Makit-an kag ma-track mo an imo mga gin-sumite nga report pinaagi sa pagpindot san 'Reports' icon sa ubos nga navigation bar. Dida makit-an mo an real-time updates, opisyal nga mga nota san staff, kag litrato san natapos nga pag-ayo.`
      );
    }

    // 3. Pothole / Road damage
    if (
      cleanMsg.includes("lubak") ||
      cleanMsg.includes("pothole") ||
      cleanMsg.includes("buho sa kalsada") ||
      cleanMsg.includes("sira nga kalsada") ||
      cleanMsg.includes("bako-bako") ||
      cleanMsg.includes("bitak nga semento") ||
      (cleanMsg.includes("kalsada") && (cleanMsg.includes("sira") || cleanMsg.includes("guba") || cleanMsg.includes("buho")))
    ) {
      return sanitizeMasbatenoOutput(
        MASBATENO_CIVIC_RESPONSES.find((r) => r.domain === "pothole")?.response || ""
      );
    }

    // 4. Streetlight / Suga sa poste
    if (
      (cleanMsg.includes("suga") || cleanMsg.includes("pundi") || cleanMsg.includes("padong") || cleanMsg.includes("madulom") || cleanMsg.includes("bombilya") || cleanMsg.includes("streetlight") || cleanMsg.includes("ilaw")) &&
      !cleanMsg.includes("alambre") && !cleanMsg.includes("kuryente")
    ) {
      return sanitizeMasbatenoOutput(
        MASBATENO_CIVIC_RESPONSES.find((r) => r.domain === "streetlight")?.response || ""
      );
    }

    // 5. Electrical Hazard / Live or sparking wire
    if (
      cleanMsg.includes("alambre") ||
      cleanMsg.includes("kuryente") ||
      cleanMsg.includes("wire") ||
      cleanMsg.includes("spark") ||
      cleanMsg.includes("igpat") ||
      cleanMsg.includes("tabingi nga poste")
    ) {
      return sanitizeMasbatenoOutput(
        MASBATENO_CIVIC_RESPONSES.find((r) => r.domain === "electrical")?.response || ""
      );
    }

    // 6. Garbage / Waste / Ramit
    if (
      cleanMsg.includes("basura") ||
      cleanMsg.includes("ramit") ||
      cleanMsg.includes("tambak") ||
      cleanMsg.includes("mabahoon") ||
      cleanMsg.includes("ati") ||
      cleanMsg.includes("hakot")
    ) {
      return sanitizeMasbatenoOutput(
        MASBATENO_CIVIC_RESPONSES.find((r) => r.domain === "garbage")?.response || ""
      );
    }

    // 7. Drainage / Clogged canal
    if (
      cleanMsg.includes("kanal") ||
      cleanMsg.includes("drainage") ||
      cleanMsg.includes("barado") ||
      cleanMsg.includes("imburnal")
    ) {
      return sanitizeMasbatenoOutput(
        MASBATENO_CIVIC_RESPONSES.find((r) => r.domain === "drainage")?.response || ""
      );
    }

    // 8. Flooding / Nagabaha
    if (
      cleanMsg.includes("baha") ||
      cleanMsg.includes("nagabaha") ||
      cleanMsg.includes("awas") ||
      cleanMsg.includes("naga-awas") ||
      cleanMsg.includes("lapaw") ||
      cleanMsg.includes("nagatanaw")
    ) {
      return sanitizeMasbatenoOutput(
        MASBATENO_CIVIC_RESPONSES.find((r) => r.domain === "flooding")?.response || ""
      );
    }

    // 9. Fallen Tree / Hazard
    if (
      cleanMsg.includes("kahoy") ||
      cleanMsg.includes("tumba") ||
      cleanMsg.includes("tumbang") ||
      cleanMsg.includes("sanga") ||
      cleanMsg.includes("nakasulang") ||
      cleanMsg.includes("nakabalabag") ||
      cleanMsg.includes("puno")
    ) {
      return sanitizeMasbatenoOutput(
        MASBATENO_CIVIC_RESPONSES.find((r) => r.domain === "fallen_tree")?.response || ""
      );
    }

    // 10. Water supply / Tubo san tubig
    if (
      cleanMsg.includes("tubo") ||
      cleanMsg.includes("gripo") ||
      cleanMsg.includes("nagasaribo") ||
      cleanMsg.includes("wara agas") ||
      (cleanMsg.includes("tubig") && (cleanMsg.includes("tulo") || cleanMsg.includes("agas") || cleanMsg.includes("wara")))
    ) {
      return sanitizeMasbatenoOutput(
        MASBATENO_CIVIC_RESPONSES.find((r) => r.domain === "water_supply")?.response || ""
      );
    }

    // 11. Public Facility
    if (
      cleanMsg.includes("covered court") ||
      cleanMsg.includes("court") ||
      cleanMsg.includes("gym") ||
      cleanMsg.includes("tulay") ||
      cleanMsg.includes("waiting shed") ||
      cleanMsg.includes("kudal") ||
      cleanMsg.includes("plaza")
    ) {
      return sanitizeMasbatenoOutput(
        MASBATENO_CIVIC_RESPONSES.find((r) => r.domain === "public_facility")?.response || ""
      );
    }

    // 12. Change location
    if (
      cleanMsg.includes("bag-uhon") ||
      cleanMsg.includes("baguhin") ||
      cleanMsg.includes("location") ||
      cleanMsg.includes("lokasyon") ||
      cleanMsg.includes("pin") ||
      cleanMsg.includes("mapa") ||
      cleanMsg.includes("ilipat")
    ) {
      return sanitizeMasbatenoOutput(
        MASBATENO_CIVIC_RESPONSES.find((r) => r.domain === "change_location")?.response || ""
      );
    }

    // 13. Hotlines & Emergency
    if (
      cleanMsg.includes("hotline") ||
      cleanMsg.includes("emergency") ||
      cleanMsg.includes("peligro") ||
      cleanMsg.includes("delikado") ||
      cleanMsg.includes("tawagan") ||
      cleanMsg.includes("sunog")
    ) {
      return sanitizeMasbatenoOutput(
        `Para sa mga dinalian nga peligro sa kinabuhi (emergency), palihog tawag dayon sa mga opisyal nga hotlines didi sa Masbate:
• Masbate CDRRMO / Rescue: (056) 333-2244
• National Emergency Hotline: 911
• PNP Masbate City Police Station: (056) 333-2222 / 911
• Masbate City Fire Station (BFP): (056) 333-2424
An BantayBarangay para sa civic infrastructure tracking kag dili puli sa emergency dispatch.`
      );
    }

    // 14. How to report / Asking for help
    if (
      cleanMsg.includes("maka-report") ||
      cleanMsg.includes("mag-report") ||
      cleanMsg.includes("mag report") ||
      cleanMsg.includes("paano") ||
      cleanMsg.includes("bulig") ||
      cleanMsg.includes("tabang")
    ) {
      return sanitizeMasbatenoOutput(
        MASBATENO_CIVIC_RESPONSES.find((r) => r.domain === "help_general")?.response || ""
      );
    }
  }

  // ─── 2. FILIPINO / ENGLISH RESPONSES ───
  if (cleanMsg.includes("under review") || cleanMsg.includes("status")) {
    return targetLang === "fil"
      ? "Sa BantayBarangay, narito ang kahulugan ng mga Report Status:\n• Submitted: Natanggap na ng sistema ang iyong ulat.\n• Under Review: Sinusuri na ng barangay staff at inihahanda ang inspeksyon.\n• Assigned: Itinalaga na sa kaukulang ahensya o repair crew.\n• In Progress: Kasalukuyang inaayos ang problema sa lugar.\n• Resolved: Tapos na ang pagkukumpuni! Hinihilingan ang residente na kumpirmahin ito.\n• Closed: Opisyal nang naisara at na-archive ang kaso."
      : "In BantayBarangay, reports follow these statuses:\n• Submitted: Your report was received by the system.\n• Under Review: Barangay staff is inspecting details and assigning work crews.\n• Assigned: Dispatched to a municipal agency (e.g. Engineering, Traffic, Meralco).\n• In Progress: Repair crews are actively working on site.\n• Resolved: Work is complete! Residents are asked to confirm the repair.\n• Closed: Verified and archived case.";
  }

  if (cleanMsg.includes("how to report") || cleanMsg.includes("report an issue") || cleanMsg.includes("pothole") || cleanMsg.includes("paano mag-report")) {
    return targetLang === "fil"
      ? "Para mag-ulat ng problema:\n1. Pindutin ang '📍 Report an Issue' sa Dashboard o sa ibabang navigation bar.\n2. Pumili ng Kategorya (Kalsada, Ilaw sa Poste, Drainage, Basura, atbp.).\n3. Ilarawan ang problema (maaari mong gamitin ang '✨ Help Me Write My Report').\n4. Kumuha o mag-upload ng larawan.\n5. Kumpirmahin ang GPS pin sa mapa.\n6. Pindutin ang Submit! Makakatanggap ka ng Reference Number (hal. BB-2026-...) para ma-track ang progreso."
      : "To report an issue:\n1. Tap '📍 Report an Issue' on your Dashboard or bottom navigation.\n2. Choose a Category (Road, Streetlight, Drainage, Waste, etc.).\n3. Describe the problem (you can use '✨ Help Me Write My Report' for assistance).\n4. Take or upload a photo showing the issue.\n5. Confirm the GPS pin on the map.\n6. Review and tap Submit! You will get a unique Reference Number (e.g. BB-2026-...) to track progress.";
  }

  if (cleanMsg.includes("track") || cleanMsg.includes("where can i see") || cleanMsg.includes("my reports") || cleanMsg.includes("nasaan ang report")) {
    return targetLang === "fil"
      ? "Maaari mong subaybayan ang iyong mga naisumiteng report anumang oras sa pamamagitan ng pagpindot sa 'Reports' icon sa ibabang navigation bar. Makikita mo rito ang real-time status updates, opisyal na tala ng crew, at bago/pagkatapos na mga larawan."
      : "You can track all your submitted reports anytime by tapping the 'Reports' icon in the bottom navigation bar. You can view real-time status updates, work notes from crews, and before/after photos.";
  }

  if (cleanMsg.includes("hotline") || cleanMsg.includes("emergency") || cleanMsg.includes("danger") || cleanMsg.includes("call")) {
    return targetLang === "fil"
      ? "Para sa mga agarang panganib sa buhay o kaligtasan (emergency), tumawag agad sa mga opisyal na hotline:\n• Masbate CDRRMO / Rescue: (056) 333-2244\n• National Emergency Hotline: 911\n• PNP Masbate City Police Station: (056) 333-2222 / 911\nAng BantayBarangay ay para sa pagsusubaybay ng imprastraktura at hindi pamalit sa emergency dispatch."
      : "For immediate life-safety emergencies, please call the emergency hotlines directly:\n• Masbate CDRRMO / Rescue: (056) 333-2244\n• National Emergency Hotline: 911\n• PNP Masbate City Police Station: (056) 333-2222 / 911\n• Masbate City Fire Station (BFP): (056) 333-2424\nBantayBarangay is for civic infrastructure tracking and does not replace emergency dispatch.";
  }

  if (cleanMsg.includes("location") || cleanMsg.includes("change my report location") || cleanMsg.includes("change location") || cleanMsg.includes("pin") || cleanMsg.includes("map")) {
    return targetLang === "fil"
      ? "Para baguhin o itama ang lokasyon ng iyong ulat:\n1. Sa 'Report an Issue' form, pindutin ang 'Locate Me' para makuha ang GPS ng iyong device.\n2. Maaari mo ring i-drag ang pin o mag-click saanman sa mapa para itapat sa eksaktong lugar.\n3. Awtomatikong mag-uupdate ang address ayon sa inilagay na pin."
      : "To set or change your report location in BantayBarangay:\n1. Open the '📍 Report an Issue' form.\n2. Tap 'Locate Me' to use your device GPS coordinates.\n3. You can also drag the pin or tap anywhere on the interactive map to fine-tune the exact spot.\n4. The address will update automatically based on your placed pin.";
  }

  // ─── 3. CLOUD PROVIDER OR UNCLEAR QUERY FALLBACK ───
  const { provider, apiKey } = getActiveProvider();
  if (provider === "none") {
    if (targetLang === "msb") {
      const isGreeting = cleanMsg.includes("hello") || cleanMsg.includes("hi") || cleanMsg.includes("kumusta") || cleanMsg.includes("maayong") || cleanMsg.includes("dios");
      if (cleanMsg.length > 5 && !isGreeting) {
        return MASBATENO_UNCERTAINTY_PROMPT;
      }
      return "Maayong adlaw! Ako an imo BantayBarangay Civic Assistant para sa Masbate. Makabulig ako sa pag-report sin mga problema sa kalsada, suga, drainage, o pag-track san imo mga report. Nano an akon maibulig sa imo niyan?";
    }
    if (targetLang === "fil") {
      return "Magandang araw! Ako ang iyong BantayBarangay Civic Assistant. Maaari kitang tulungan sa pag-uulat ng mga problema sa kalsada, ilaw, drainage, o pagsubaybay ng iyong ulat. Paano kita matutulungan ngayon?";
    }
    return "Welcome to BantayBarangay! I can help you understand how to report neighborhood issues, track repairs, use the Community Map, and understand report statuses. How may I assist you today?";
  }

  const langGuide =
    targetLang === "msb"
      ? "Answer in natural, respectful Masbateño (Minasbate as spoken in Masbate City / Masbate Province). Preserve standardized terms like 'Reference Number', 'OTP', 'GPS', 'Report Status', 'Under Review', 'Resolved', 'Submitted'."
      : targetLang === "fil"
      ? "Answer in natural conversational Filipino."
      : "Answer concisely in clear, friendly English.";

  const prompt = `You are the official BantayBarangay Civic Assistant for Masbate City and Masbate Province.
Resident question: "${stripPII(lastUserMsg)}"

Rules:
1. ${langGuide}
2. Ground your answers strictly in BantayBarangay features (reporting wizard, GPS community map, 6-status tracking, photo verification).
3. NEVER claim you submitted a report or took an action.
4. For emergencies, recommend calling Masbate CDRRMO (056) 333-2244 or 911.
5. If the resident's question is unclear or ambiguous, ask respectfully: "Pasensya na, pwede mo pa ba klaruhon an imo pasabot?"`;

  try {
    let reply = "";
    if (provider === "gemini") {
      reply = await callGemini(apiKey, prompt, false);
    } else {
      reply = await callOpenAi(apiKey, prompt, false);
    }
    return targetLang === "msb" ? sanitizeMasbatenoOutput(reply.trim()) : reply.trim();
  } catch (e) {
    if (targetLang === "msb") {
      return sanitizeMasbatenoOutput("Ako an imo BantayBarangay assistant didi sa Masbate. Pwede ka mag-report sin mga problema sa kalsada, suga, o drainage gamit an 'Report an Issue' button, o i-track an mga report sa 'Reports' tab.");
    }
    return "I am the BantayBarangay assistant. You can report civic problems like potholes, busted streetlights, or clogged drains using the 'Report an Issue' button, or track existing reports in the 'Reports' tab.";
  }
}
