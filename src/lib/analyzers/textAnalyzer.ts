/**
 * Text Analyzer — Evaluates report description quality and detects suspicious text patterns.
 * Returns a risk sub-score from 0 (no risk) to 100 (maximum suspicion).
 */

interface TextAnalysisResult {
  score: number;
  signals: string[];
}

// Common spam/nonsensical patterns
const SPAM_PATTERNS = [
  /(.)\1{5,}/i, // Same character repeated 6+ times
  /\b(test|testing|asdf|qwerty|lorem ipsum|hello world|aaa|bbb|xxx)\b/i,
  /\b(lol|lmao|rofl|portal\s*to\s*(?:another\s*)?dimension|alien|zombie)\b/i,
  /(?:😂|🤣|🤪|🤡){2,}/, // Excessive prank emojis
  /(https?:\/\/|www\.)\S+/i, // URLs
  /\b\d{10,}\b/, // Very long numbers
  /[!?]{4,}/, // Excessive punctuation
];

const ABUSIVE_KEYWORDS = [
  "fuck", "shit", "putangina", "gago", "bobo", "tanga", "ulol",
  "pakyu", "tangina", "leche", "tarantado", "gunggong",
];

const GENERIC_DESCRIPTIONS = [
  "broken", "busted", "need fix", "please fix", "fix this",
  "help", "problem", "issue", "bad", "not working",
];

// Category-related keywords for coherence checking (English + Filipino + Masbateño)
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "streetlight": ["light", "lamp", "dark", "bulb", "pole", "ilaw", "poste", "madilim", "street light", "suga", "pundi", "padong", "madulom", "bombilya"],
  "pothole": ["hole", "road", "crack", "pavement", "butas", "kalsada", "asphalt", "dent", "lubak", "buho", "daku", "bako", "guba", "sira", "semento"],
  "flooding": ["flood", "water", "rain", "drain", "baha", "tubig", "ulan", "drainage", "clogged", "nagabaha", "lapaw", "awas", "marom-ot"],
  "garbage": ["trash", "waste", "garbage", "dump", "basura", "kalat", "stink", "smell", "dumi", "ramit", "dumot", "tambak", "mabahoon", "baho"],
  "water-supply": ["water", "pipe", "faucet", "supply", "tubig", "gripo", "tubo", "leak", "tulo", "wara agas", "wara tubig"],
  "power-line": ["wire", "electric", "power", "cable", "kuryente", "kawad", "voltage", "spark", "alambre", "kuryente", "poste"],
  "road-damage": ["road", "crack", "asphalt", "surface", "kalsada", "damage", "broken", "lubak", "guba", "bitak", "buho", "semento"],
  "drainage": ["drain", "canal", "sewer", "clog", "kanal", "imburnal", "flow", "barado", "drainage", "awas"],
  "sidewalk": ["sidewalk", "walkway", "pedestrian", "bangketa", "walk", "path", "tile", "agihan", "lakawan"],
  "traffic-sign": ["sign", "signal", "traffic", "senyas", "signage", "post", "senyal"],
  "fallen-tree": ["tree", "branch", "puno", "sanga", "fallen", "block", "kahoy", "tumba", "tumbang", "nakabalabag", "nakaharang"],
  "graffiti": ["graffiti", "vandal", "paint", "spray", "mark", "grafiti", "pintura"],
};

/**
 * Calculate Shannon entropy of a string — lower entropy = more repetitive/suspicious
 */
function calculateEntropy(text: string): number {
  const freq: Record<string, number> = {};
  for (const char of text.toLowerCase()) {
    freq[char] = (freq[char] || 0) + 1;
  }
  const len = text.length;
  let entropy = 0;
  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/**
 * Calculate what proportion of words appear to be real English/Filipino words
 * (simple heuristic: words with vowels and reasonable length)
 */
function realWordRatio(text: string): number {
  const words = text.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
  if (words.length === 0) return 0;

  const realWords = words.filter((w) => {
    // Must contain at least one vowel and be mostly letters
    const hasVowel = /[aeiouy]/.test(w);
    const mostlyLetters = /^[a-z'-]+$/.test(w);
    const reasonableLength = w.length >= 2 && w.length <= 25;
    return hasVowel && mostlyLetters && reasonableLength;
  });

  return realWords.length / words.length;
}

/**
 * Check if the description appears to match the selected category
 */
function checkCategoryCoherence(description: string, categorySlug: string): number {
  const descLower = description.toLowerCase();

  // Find matching keyword sets
  let matchedKeywords = 0;
  let totalKeywords = 0;

  for (const [catKey, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (categorySlug.includes(catKey) || catKey.includes(categorySlug.split("-")[0])) {
      totalKeywords = keywords.length;
      matchedKeywords = keywords.filter((kw) => descLower.includes(kw)).length;
      break;
    }
  }

  if (totalKeywords === 0) return 0; // Unknown category, no penalty
  if (matchedKeywords > 0) return 0; // At least one relevant keyword found
  return 25; // No relevant keywords at all — mild flag
}

export function analyzeText(
  description: string,
  categorySlug: string
): TextAnalysisResult {
  const signals: string[] = [];
  let score = 0;

  const trimmed = description.trim();

  // 1. Very short description
  if (trimmed.length < 15) {
    score += 20;
    signals.push("Very short description (less than 15 characters)");
  } else if (trimmed.length < 30) {
    score += 10;
    signals.push("Brief description (less than 30 characters)");
  }

  // 2. Spam pattern matching
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(trimmed)) {
      score += 15;
      signals.push(`Spam pattern detected: ${pattern.source.slice(0, 30)}`);
      break; // Only count once
    }
  }

  // 3. Abusive content
  const lowerDesc = trimmed.toLowerCase();
  const foundAbusive = ABUSIVE_KEYWORDS.filter((kw) => lowerDesc.includes(kw));
  if (foundAbusive.length > 0) {
    score += Math.min(foundAbusive.length * 10, 30);
    signals.push(`Potentially abusive language detected`);
  }

  // 4. Low entropy (repetitive text)
  if (trimmed.length > 10) {
    const entropy = calculateEntropy(trimmed);
    if (entropy < 2.0) {
      score += 25;
      signals.push(`Very low text entropy (${entropy.toFixed(2)}) — repetitive content`);
    } else if (entropy < 3.0) {
      score += 10;
      signals.push(`Low text entropy (${entropy.toFixed(2)})`);
    }
  }

  // 5. Low real-word ratio (nonsensical content)
  const wordRatio = realWordRatio(trimmed);
  if (trimmed.length > 15 && wordRatio < 0.3) {
    score += 25;
    signals.push(`Low real-word ratio (${(wordRatio * 100).toFixed(0)}%) — possibly nonsensical`);
  } else if (trimmed.length > 15 && wordRatio < 0.5) {
    score += 10;
    signals.push(`Below-average real-word ratio (${(wordRatio * 100).toFixed(0)}%)`);
  }

  // 6. Generic description check (only if very short)
  if (trimmed.split(/\s+/).length <= 5) {
    const isGeneric = GENERIC_DESCRIPTIONS.some((g) => lowerDesc.includes(g));
    if (isGeneric) {
      score += 15;
      signals.push("Extremely generic description with no useful details");
    }
  }

  // 7. Category coherence check
  const coherenceScore = checkCategoryCoherence(trimmed, categorySlug);
  if (coherenceScore > 0) {
    score += coherenceScore;
    signals.push("Description does not mention terms related to the selected category");
  }

  // 8. ALL CAPS check
  const upperRatio = trimmed.replace(/[^a-zA-Z]/g, "").length > 0
    ? (trimmed.replace(/[^A-Z]/g, "").length / trimmed.replace(/[^a-zA-Z]/g, "").length)
    : 0;
  if (upperRatio > 0.7 && trimmed.length > 20) {
    score += 10;
    signals.push("Excessive use of capital letters");
  }

  return {
    score: Math.min(score, 100),
    signals,
  };
}
