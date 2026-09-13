/**
 * Centralized Masbateño (Minasbate) Verified Language Resource & Civic Glossary
 * BantayBarangay — Masbate City & Masbate Province
 * 
 * Linguistic Grounding:
 * - Language variety: Minasbate (Central Visayan with Bikol/Tagalog contact characteristics)
 * - Distinctive Case Markers: Nominative `an`, Genitive Definite `san`, Genitive Indefinite `sin`
 *   (Strictly NOT Waray `han`/`hin`, NOT Tagalog `ng`/`ang`, NOT Cebuano `og`/`sa`)
 * - Negatives: Non-existence/Past `wara` (NOT `wala`, NOT `waray`), Identity/Action `diri` (NOT `dili`, NOT `hindi`), Imperative `ayaw`
 * - Interrogatives: `nano` (what), `sin-o` (who), `diin` (where), `san-o` (when), `kay nano`/`ngaa` (why), `paano` (how), `pira` (how many)
 * - Conjunction: `kag` (and - NOT Tagalog `at`, NOT Cebuano `ug`)
 * - Preserved Technical Terms: "Reference Number", "OTP", "GPS", "QR Code", "Mobile Number", "AI", "Barangay Hall"
 */

import prisma from "../db";

export type SupportedLanguage = "en" | "fil" | "msb";
export type DetectedLanguage = "en" | "fil" | "msb" | "mixed";

export type GlossaryCategory =
  | "common_words"
  | "greetings"
  | "questions"
  | "report_terms"
  | "location_terms"
  | "infrastructure_terms"
  | "status_messages"
  | "notifications"
  | "error_messages"
  | "help_instructions"
  | "ui_labels"
  | "common_local_expressions";

export type HumanReviewStatus = "VERIFIED" | "NEEDS_REVIEW" | "INCORRECT" | "UNNATURAL" | "UNCERTAIN";

export interface GlossaryEntry {
  term: string;
  category: GlossaryCategory;
  masbateno: string;
  filipino: string;
  english: string;
  contextOrNotes?: string;
  status: HumanReviewStatus;
  isActive: boolean;
}

export interface StandardizedTerm {
  term: string;
  preserveAsIs: boolean;
  localExplanationInMasbateno: string;
}

// ─── 1. PRESERVED STANDARDIZED SYSTEM TERMS ──────────────────────────────────
export const STANDARDIZED_SYSTEM_TERMS: Record<string, StandardizedTerm> = {
  reference_number: {
    term: "Reference Number",
    preserveAsIs: true,
    localExplanationInMasbateno: "Numero san report para sa pagsunod kag pag-track (halimbawa: BB-2026-000101)",
  },
  otp: {
    term: "OTP (One-Time Password)",
    preserveAsIs: true,
    localExplanationInMasbateno: "Pansamantalang 6-digit verification code nga ginapadara sa cellphone",
  },
  gps: {
    term: "GPS",
    preserveAsIs: true,
    localExplanationInMasbateno: "Eksaktong koordinata san lokasyon sa mapa gamit an device",
  },
  qr_code: {
    term: "QR Code",
    preserveAsIs: true,
    localExplanationInMasbateno: "Mababasa nga barcode gamit an camera para madali mabuksan an report",
  },
  mobile_number: {
    term: "Mobile Number",
    preserveAsIs: true,
    localExplanationInMasbateno: "Numero san cellphone para sa SMS updates",
  },
  ai: {
    term: "AI (Artificial Intelligence)",
    preserveAsIs: true,
    localExplanationInMasbateno: "Matalino nga katabang sa pagsulat kag pagsusi san mga report",
  },
  barangay_hall: {
    term: "Barangay Hall",
    preserveAsIs: true,
    localExplanationInMasbateno: "Opisina san lokal nga pamahalaan sa barangay",
  },
  report_status: {
    term: "Report Status",
    preserveAsIs: true,
    localExplanationInMasbateno: "Kamutangan o estado san imo gin-sumite nga report",
  },
  submitted: {
    term: "Submitted",
    preserveAsIs: true,
    localExplanationInMasbateno: "Naresibe na san sistema an imo report",
  },
  under_review: {
    term: "Under Review",
    preserveAsIs: true,
    localExplanationInMasbateno: "Ginasusi na san barangay staff kag gina-preparar an inspection kag dispatch",
  },
  assigned: {
    term: "Assigned",
    preserveAsIs: true,
    localExplanationInMasbateno: "Ginpasa na sa natungdan nga ahensya o repair crew para trabahuon",
  },
  in_progress: {
    term: "In Progress",
    preserveAsIs: true,
    localExplanationInMasbateno: "Ginatrabaho na san mga trabahador sa mismong lugar",
  },
  resolved: {
    term: "Resolved",
    preserveAsIs: true,
    localExplanationInMasbateno: "Nahuman na an pag-ayo o pagsulbad sa problema",
  },
  closed: {
    term: "Closed",
    preserveAsIs: true,
    localExplanationInMasbateno: "Opisyal na nga nasirad-an kag na-archive an kaso",
  },
};

// ─── 2. COMPREHENSIVE VERIFIED MINASBATE CIVIC GLOSSARY (12 CATEGORIES) ──────
export const VERIFIED_MASBATENO_GLOSSARY: GlossaryEntry[] = [
  // ────────────────────────────
  // CATEGORY 1: COMMON WORDS
  // ────────────────────────────
  {
    term: "day",
    category: "common_words",
    masbateno: "adlaw",
    filipino: "araw",
    english: "day",
    contextOrNotes: "Adlaw-adlaw nga gamit",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "night",
    category: "common_words",
    masbateno: "gab-i",
    filipino: "gabi",
    english: "night",
    contextOrNotes: "Sa oras san gab-i",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "road_street",
    category: "common_words",
    masbateno: "kalsada / dalan",
    filipino: "kalsada / daan",
    english: "road / street",
    contextOrNotes: "Agihan san mga tawo kag salakyan",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "big",
    category: "common_words",
    masbateno: "daku / dakula",
    filipino: "malaki",
    english: "big / large",
    contextOrNotes: "Daku nga lubak o buho",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "small",
    category: "common_words",
    masbateno: "saday / intok",
    filipino: "maliit",
    english: "small",
    contextOrNotes: "Saday nga butas o intok nga tulo",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "broken_damaged",
    category: "common_words",
    masbateno: "guba / sira",
    filipino: "sira",
    english: "broken / damaged",
    contextOrNotes: "Guba nga gamit o imprastraktura",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "fix_repair",
    category: "common_words",
    masbateno: "ayuhon / kumpunihon",
    filipino: "ayusin / kumpunihin",
    english: "fix / repair",
    contextOrNotes: "Pag-ayo sa guba",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "finished_done",
    category: "common_words",
    masbateno: "nahuman / tapos na",
    filipino: "tapos na / nagawa na",
    english: "finished / completed",
    contextOrNotes: "Nahuman na an trabaho",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "people_residents",
    category: "common_words",
    masbateno: "mga tawo / mga residente",
    filipino: "mga tao / mga residente",
    english: "people / residents",
    contextOrNotes: "Mga molupyo sa komunidad",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "danger_hazard",
    category: "common_words",
    masbateno: "peligro / delikado",
    filipino: "panganib / delikado",
    english: "danger / hazard",
    contextOrNotes: "Peligro sa mga nagalabay",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "now_currently",
    category: "common_words",
    masbateno: "niyan",
    filipino: "ngayon",
    english: "now / currently",
    contextOrNotes: "Sa niyan nga tion",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "none_no",
    category: "common_words",
    masbateno: "wara",
    filipino: "wala",
    english: "none / nothing / no",
    contextOrNotes: "Wara agas, wara tubig (authentic Minasbate, NOT wala or waray)",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "not_cannot",
    category: "common_words",
    masbateno: "diri",
    filipino: "hindi",
    english: "not / cannot",
    contextOrNotes: "Diri nagasiga, diri pwede (authentic Minasbate, NOT dili or hindi)",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "and",
    category: "common_words",
    masbateno: "kag",
    filipino: "at",
    english: "and",
    contextOrNotes: "Kalsada kag tulay (authentic Minasbate, NOT at or ug)",
    status: "VERIFIED",
    isActive: true,
  },

  // ────────────────────────────
  // CATEGORY 2: GREETINGS
  // ────────────────────────────
  {
    term: "good_day",
    category: "greetings",
    masbateno: "Maayong adlaw!",
    filipino: "Magandang araw!",
    english: "Good day!",
    contextOrNotes: "Pangkalahatan nga pormal kag magalang nga pagbati",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "good_day_traditional",
    category: "greetings",
    masbateno: "Dios marhay nga adlaw!",
    filipino: "Magandang araw sa iyo!",
    english: "God-blessed good day!",
    contextOrNotes: "Tradisyon nga pagbati sa Masbate",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "good_morning",
    category: "greetings",
    masbateno: "Maayong aga!",
    filipino: "Magandang umaga!",
    english: "Good morning!",
    contextOrNotes: "Pagbati sa kaagahon",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "good_afternoon",
    category: "greetings",
    masbateno: "Maayong hapon!",
    filipino: "Magandang hapon!",
    english: "Good afternoon!",
    contextOrNotes: "Pagbati sa kahaponon",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "good_evening",
    category: "greetings",
    masbateno: "Maayong gab-i!",
    filipino: "Magandang gabi!",
    english: "Good evening!",
    contextOrNotes: "Pagbati sa kagabhion",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "thank_you_very_much",
    category: "greetings",
    masbateno: "Daku nga salamat!",
    filipino: "Maraming salamat!",
    english: "Thank you very much!",
    contextOrNotes: "Taos-puso nga pagpasalamat",
    status: "VERIFIED",
    isActive: true,
  },

  // ────────────────────────────
  // CATEGORY 3: QUESTIONS
  // ────────────────────────────
  {
    term: "what",
    category: "questions",
    masbateno: "nano",
    filipino: "ano",
    english: "what",
    contextOrNotes: "Nano an problema? (NOT ano, NOT unsa)",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "who",
    category: "questions",
    masbateno: "sin-o",
    filipino: "sino",
    english: "who",
    contextOrNotes: "Sin-o an nag-report? (NOT sino, NOT kinsa)",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "where",
    category: "questions",
    masbateno: "diin",
    filipino: "saan",
    english: "where",
    contextOrNotes: "Diin dapit? Diin nahimutang? (NOT saan, NOT asa)",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "when",
    category: "questions",
    masbateno: "san-o",
    filipino: "kailan",
    english: "when",
    contextOrNotes: "San-o ini nangyari? (NOT kailan, NOT kanus-a)",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "why",
    category: "questions",
    masbateno: "kay nano / ngaa",
    filipino: "bakit",
    english: "why",
    contextOrNotes: "Kay nano kay naguba? (NOT bakit, NOT ngano)",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "how",
    category: "questions",
    masbateno: "paano",
    filipino: "paano",
    english: "how",
    contextOrNotes: "Paano mag-report? (NOT unsaon)",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "how_many_much",
    category: "questions",
    masbateno: "pira",
    filipino: "ilan / magkano",
    english: "how many / how much",
    contextOrNotes: "Pira ka adlaw na? (NOT ilan, NOT pila)",
    status: "VERIFIED",
    isActive: true,
  },

  // ────────────────────────────
  // CATEGORY 4: REPORT-RELATED TERMS
  // ────────────────────────────
  {
    term: "submit_report",
    category: "report_terms",
    masbateno: "magsumite sin report / mag-report",
    filipino: "magpasa ng report / mag-ulat",
    english: "submit a report",
    contextOrNotes: "Paghimo kag pagpasa sin reklamo o report sa barangay",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "description",
    category: "report_terms",
    masbateno: "deskripsyon / saysay san problema",
    filipino: "paglalarawan / detalye ng problema",
    english: "description",
    contextOrNotes: "Pagpahayag kon nano an nangyari",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "photo_evidence",
    category: "report_terms",
    masbateno: "litrato san problema / ebidensya",
    filipino: "larawan / patunay",
    english: "photo / proof / evidence",
    contextOrNotes: "Kinuha nga litrato sa lugar",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "track_report",
    category: "report_terms",
    masbateno: "subaybayan an report / sundan an progreso",
    filipino: "subaybayan ang report",
    english: "track report progress",
    contextOrNotes: "Pagtsekyar san kamutangan san naisumite nga report",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "category_selection",
    category: "report_terms",
    masbateno: "pagpili sin kategorya",
    filipino: "pagpili ng kategorya",
    english: "category selection",
    contextOrNotes: "Hal. Kalsada, Suga, Drainage, Basura",
    status: "VERIFIED",
    isActive: true,
  },

  // ────────────────────────────
  // CATEGORY 5: LOCATION TERMS
  // ────────────────────────────
  {
    term: "near",
    category: "location_terms",
    masbateno: "harani sa",
    filipino: "malapit sa",
    english: "near / close to",
    contextOrNotes: "Harani sa barangay hall",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "far",
    category: "location_terms",
    masbateno: "harayo sa",
    filipino: "malayo sa",
    english: "far from",
    contextOrNotes: "Harayo sa sentro",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "in_front_of",
    category: "location_terms",
    masbateno: "sa atubang san",
    filipino: "sa harap ng / sa tapat ng",
    english: "in front of / across",
    contextOrNotes: "Sa atubang san eskwelahan",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "behind",
    category: "location_terms",
    masbateno: "sa likod san",
    filipino: "sa likod ng",
    english: "behind",
    contextOrNotes: "Sa likod san health center",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "beside",
    category: "location_terms",
    masbateno: "sa tupad san",
    filipino: "sa tabi ng",
    english: "beside / next to",
    contextOrNotes: "Sa tupad san tindahan",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "corner_of",
    category: "location_terms",
    masbateno: "sa kanto san",
    filipino: "sa kanto ng",
    english: "at the corner of",
    contextOrNotes: "Sa kanto san Nursery kag Ibingay",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "middle_of_road",
    category: "location_terms",
    masbateno: "sa tunga san kalsada",
    filipino: "sa gitna ng kalsada",
    english: "in the middle of the road",
    contextOrNotes: "May lubak sa tunga san kalsada",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "roadside",
    category: "location_terms",
    masbateno: "sa ligid san dalan / sa ligid san kalsada",
    filipino: "sa gilid ng kalsada",
    english: "on the side of the road",
    contextOrNotes: "Nakaharang sa ligid san dalan",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "here_there",
    category: "location_terms",
    masbateno: "didi (here) / dida (there near you) / didto (there far)",
    filipino: "dito / diyan / doon",
    english: "here / there / over there",
    contextOrNotes: "Didi sa Masbate City",
    status: "VERIFIED",
    isActive: true,
  },

  // ────────────────────────────
  // CATEGORY 6: INFRASTRUCTURE TERMS (10 DOMAINS)
  // ────────────────────────────
  // 1. Pothole / Road
  {
    term: "pothole",
    category: "infrastructure_terms",
    masbateno: "lubak / buho sa kalsada",
    filipino: "lubak sa kalsada",
    english: "pothole",
    contextOrNotes: "Buho sa aspalto o semento sa dalan",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "deep_pothole",
    category: "infrastructure_terms",
    masbateno: "daku nga lubak / malalom nga buho",
    filipino: "malaking lubak / malalim na butas",
    english: "large pothole / deep road hole",
    contextOrNotes: "Delikado sa mga motorsiklo",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "cracked_road",
    category: "infrastructure_terms",
    masbateno: "sira nga kalsada / bitak nga semento",
    filipino: "sirang kalsada / may bitak na semento",
    english: "cracked / damaged road pavement",
    contextOrNotes: "Nagkakarabali nga semento",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "uneven_road",
    category: "infrastructure_terms",
    masbateno: "bako-bako nga kalsada / bako-bako nga agihan",
    filipino: "lubak-lubak na daan",
    english: "uneven / bumpy road",
    contextOrNotes: "Malisod agihan san mga traysikel",
    status: "VERIFIED",
    isActive: true,
  },

  // 2. Streetlight
  {
    term: "streetlight",
    category: "infrastructure_terms",
    masbateno: "suga sa poste",
    filipino: "ilaw sa poste",
    english: "streetlight",
    contextOrNotes: "Ilaw sa dalan kon gab-i",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "busted_streetlight",
    category: "infrastructure_terms",
    masbateno: "pundi nga suga / padong nga bombilya / diri nagasiga",
    filipino: "pundidong ilaw / patay na ilaw",
    english: "busted streetlight / unlit bulb",
    contextOrNotes: "Madulom an kalsada kay pundi an suga",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "dark_street",
    category: "infrastructure_terms",
    masbateno: "madulom nga kalsada / madulom nga agihan",
    filipino: "madilim na kalsada",
    english: "dark road / unlit street",
    contextOrNotes: "Delikado sa mga nagalakat kon gab-i",
    status: "VERIFIED",
    isActive: true,
  },

  // 3. Electrical / Power
  {
    term: "leaning_pole",
    category: "infrastructure_terms",
    masbateno: "nagatabingi nga poste / tabingi nga poste",
    filipino: "nakatagilid na poste",
    english: "leaning utility pole",
    contextOrNotes: "Delikado matumba sa kalsada",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "fallen_electrical_wire",
    category: "infrastructure_terms",
    masbateno: "naputol nga alambre / nahulog nga wire san kuryente",
    filipino: "naputol na kawad ng kuryente",
    english: "downed / snapped electrical wire",
    contextOrNotes: "Mataas nga peligro sa kuryente",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "sparking_wire",
    category: "infrastructure_terms",
    masbateno: "naga-spark nga alambre / naga-igpat an kuryente",
    filipino: "kumikislap na kawad",
    english: "sparking electrical wire",
    contextOrNotes: "May kalayo o kislap sa poste",
    status: "VERIFIED",
    isActive: true,
  },

  // 4. Garbage / Waste
  {
    term: "uncollected_garbage",
    category: "infrastructure_terms",
    masbateno: "tambak nga basura / wara mahakot nga ramit",
    filipino: "tambak na basura / hindi nakolektang basura",
    english: "uncollected garbage / piled trash",
    contextOrNotes: "Ramit = authentic Masbateño for trash/waste",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "foul_odor",
    category: "infrastructure_terms",
    masbateno: "mabahoon / mabaho nga basura",
    filipino: "mabahong amoy",
    english: "foul odor / stench",
    contextOrNotes: "Nagahatag sin perhuwisyo sa komunidad",
    status: "VERIFIED",
    isActive: true,
  },

  // 5. Drainage & Canals
  {
    term: "clogged_canal",
    category: "infrastructure_terms",
    masbateno: "barado nga kanal / napuno sin ramit nga drainage",
    filipino: "baradong kanal",
    english: "clogged canal / blocked drainage",
    contextOrNotes: "Diri makadagayday an tubig",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "overflowing_water",
    category: "infrastructure_terms",
    masbateno: "naga-awas nga tubig / lapaw an mahugaw nga tubig",
    filipino: "umaapaw na tubig / maruming tubig",
    english: "overflowing dirty water",
    contextOrNotes: "Naga-awas pakadto sa kalsada",
    status: "VERIFIED",
    isActive: true,
  },

  // 6. Flooding
  {
    term: "flooding_street",
    category: "infrastructure_terms",
    masbateno: "nagabaha sa kalsada / nagatanaw an tubig sa dalan",
    filipino: "baha sa kalsada",
    english: "street flooding / stagnant water",
    contextOrNotes: "Tungod sa ulan kag barado nga kanal",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "open_manhole",
    category: "infrastructure_terms",
    masbateno: "wara taklob nga buho / buka nga manhole",
    filipino: "bukas na manhole / walang takip na butas",
    english: "open uncovered manhole",
    contextOrNotes: "Peligro mahulog an mga nagalakat kag salakyan",
    status: "VERIFIED",
    isActive: true,
  },

  // 7. Fallen Trees
  {
    term: "fallen_tree",
    category: "infrastructure_terms",
    masbateno: "tumbang kahoy / natumba nga kahoy / naputol nga sanga",
    filipino: "tumbang puno / naputol na sanga",
    english: "fallen tree / broken branch",
    contextOrNotes: "Nahulog sa dalan o sa kable",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "blocking_road",
    category: "infrastructure_terms",
    masbateno: "nakasulang sa kalsada / nakabalabag sa dalan",
    filipino: "nakaharang sa kalsada",
    english: "blocking the roadway",
    contextOrNotes: "Diri makaagi an mga salakyan",
    status: "VERIFIED",
    isActive: true,
  },

  // 8. Water Supply
  {
    term: "water_pipe_leak",
    category: "infrastructure_terms",
    masbateno: "tulo san tubo san tubig / nagasaribo nga tubig sa tubo",
    filipino: "tagas ng tubo ng tubig",
    english: "water pipe leak / burst pipe",
    contextOrNotes: "Nagasaribo = spraying/gushing water in Masbate",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "no_water_supply",
    category: "infrastructure_terms",
    masbateno: "wara agas / wara tubig sa gripo",
    filipino: "walang tubig / walang tulo ang gripo",
    english: "no water flow / water interruption",
    contextOrNotes: "Pira na ka adlaw nga wara agas",
    status: "VERIFIED",
    isActive: true,
  },

  // 9. Public Facilities
  {
    term: "damaged_court",
    category: "infrastructure_terms",
    masbateno: "guba nga covered court / sira nga atop san basketball court",
    filipino: "sirang covered court",
    english: "damaged covered court / community gym",
    contextOrNotes: "Pasilidad san barangay",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "damaged_bridge",
    category: "infrastructure_terms",
    masbateno: "guba nga tulay / sira nga alambre san tulay",
    filipino: "sirang tulay",
    english: "damaged bridge / footbridge",
    contextOrNotes: "Delikado agihan san mga motorista",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "damaged_waiting_shed",
    category: "infrastructure_terms",
    masbateno: "sira nga waiting shed / guba nga hulatan",
    filipino: "sirang waiting shed",
    english: "damaged waiting shed",
    contextOrNotes: "Kailangan ayuhon an atop kag tukod",
    status: "VERIFIED",
    isActive: true,
  },

  // ────────────────────────────
  // CATEGORY 7: STATUS MESSAGES
  // ────────────────────────────
  {
    term: "status_submitted",
    category: "status_messages",
    masbateno: "Submitted: Naresibe na san sistema an imo report kag gina-preparar para sa barangay staff.",
    filipino: "Submitted: Natanggap na ng sistema ang iyong report.",
    english: "Submitted: Your report has been received by the system.",
    contextOrNotes: "Unang estado pagkatapos mag-submit",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "status_under_review",
    category: "status_messages",
    masbateno: "Under Review: Ginasusi na san barangay staff kag gina-preparar an inspection kag dispatch sa lugar.",
    filipino: "Under Review: Sinusuri na ng barangay staff.",
    english: "Under Review: Barangay staff is currently verifying details.",
    contextOrNotes: "Inspeksyon kag ebalwasyon",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "status_assigned",
    category: "status_messages",
    masbateno: "Assigned: Ginpasa na sa natungdan nga ahensya o repair crew para sa pag-inspeksyon kag pag-ayo.",
    filipino: "Assigned: Naitalaga na sa kaukulang ahensya.",
    english: "Assigned: Dispatched to the appropriate municipal agency or crew.",
    contextOrNotes: "Na-assign sa Engineering, CDRRMO, o Utility",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "status_in_progress",
    category: "status_messages",
    masbateno: "In Progress: Ginatrabaho na san mga personahe kag repair crew sa mismong lokasyon.",
    filipino: "In Progress: Kasalukuyang inaayos sa lugar.",
    english: "In Progress: Repair crew is actively working on site.",
    contextOrNotes: "Kasalukuyang ginakaayo",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "status_resolved",
    category: "status_messages",
    masbateno: "Resolved: Nahuman na an pag-ayo! Gina-imbitar an residente nga mag-kumpirma kon maayo na.",
    filipino: "Resolved: Tapos na ang pagkukumpuni!",
    english: "Resolved: Work is completed! Resident is invited to confirm.",
    contextOrNotes: "Natapos na an kumpuni",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "status_closed",
    category: "status_messages",
    masbateno: "Closed: Opisyal na nga nasirad-an kag na-archive an kaso.",
    filipino: "Closed: Opisyal nang naisara at na-archive ang report.",
    english: "Closed: The case is officially closed and archived.",
    contextOrNotes: "Panghuling estado",
    status: "VERIFIED",
    isActive: true,
  },

  // ────────────────────────────
  // CATEGORY 8: NOTIFICATIONS
  // ────────────────────────────
  {
    term: "notif_status_update",
    category: "notifications",
    masbateno: "May bag-ong update sa kamutangan san imo report.",
    filipino: "May bagong update sa katayuan ng iyong report.",
    english: "There is a new update on your report status.",
    contextOrNotes: "Push notification o SMS",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "notif_assigned",
    category: "notifications",
    masbateno: "Na-assign na an imo report sa lokal nga repair crew.",
    filipino: "Naitalaga na ang iyong report sa repair crew.",
    english: "Your report has been assigned to the repair crew.",
    contextOrNotes: "Pahibalo sa dispatch",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "notif_resolved",
    category: "notifications",
    masbateno: "Na-resolbar kag naayos na an problema nga imo gin-report.",
    filipino: "Naayos na ang problemang iyong iniulat.",
    english: "The reported issue has been resolved.",
    contextOrNotes: "Pahibalo sa pagkakatapos",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "notif_need_info",
    category: "notifications",
    masbateno: "Kinahanglan san barangay staff sin dugang nga detalye o litrato.",
    filipino: "Nangangailangan ang barangay staff ng karagdagang detalye o larawan.",
    english: "Barangay staff requires additional details or photo.",
    contextOrNotes: "Verification request notification",
    status: "VERIFIED",
    isActive: true,
  },

  // ────────────────────────────
  // CATEGORY 9: ERROR MESSAGES
  // ────────────────────────────
  {
    term: "err_missing_photo",
    category: "error_messages",
    masbateno: "Palihog mag-upload o magkuha sin litrato san problema.",
    filipino: "Pakiusap mag-upload o kumuha ng larawan ng problema.",
    english: "Please upload or take a photo of the problem.",
    contextOrNotes: "Pagkulang sa litrato",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "err_missing_category",
    category: "error_messages",
    masbateno: "Palihog pilia an kategorya nga pinaka-angay sa imo report.",
    filipino: "Pakiusap pumili ng kategorya para sa iyong report.",
    english: "Please choose a category that best matches your report.",
    contextOrNotes: "Kulang sa pagpili sin kategorya",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "err_missing_location",
    category: "error_messages",
    masbateno: "Palihog kumpirmaha an lokasyon san problema sa mapa.",
    filipino: "Pakiusap kumpirmahin ang lokasyon sa mapa.",
    english: "Please confirm the issue location on the map.",
    contextOrNotes: "Kulang sa GPS coordinates",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "err_network_issue",
    category: "error_messages",
    masbateno: "Wara koneksyon sa internet. Palihog sulayi liwat niyan.",
    filipino: "Walang koneksyon sa internet. Pakisubukang muli mamaya.",
    english: "No internet connection. Please try again shortly.",
    contextOrNotes: "Offline o mahinang signal",
    status: "VERIFIED",
    isActive: true,
  },

  // ────────────────────────────
  // CATEGORY 10: HELP INSTRUCTIONS
  // ────────────────────────────
  {
    term: "help_how_to_report",
    category: "help_instructions",
    masbateno: "Madali lang magsumite sin report didi sa Masbate: 1) Pinduta an '📍 Report an Issue'; 2) Pilia an kategorya; 3) Isaysay an problema; 4) Magbutang sin litrato; 5) I-kumpirma an lokasyon sa mapa; 6) Pinduta an Submit para makakuha sin Reference Number.",
    filipino: "Madali lang mag-report: 1) Pindutin ang 'Report an Issue'; 2) Pumili ng kategorya; 3) Ilarawan ang problema; 4) Maglagay ng larawan; 5) Kumpirmahin ang lokasyon sa mapa; 6) Pindutin ang Submit.",
    english: "Easily submit a report in Masbate: 1) Tap 'Report an Issue'; 2) Choose category; 3) Describe problem; 4) Attach photo; 5) Confirm map pin; 6) Submit to get Reference Number.",
    contextOrNotes: "Pangunahing giya sa pag-report",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "help_how_to_track",
    category: "help_instructions",
    masbateno: "Makit-an mo an imo mga report pinaagi sa pagpindot san 'Reports' tab sa ubos. Dida makit-an mo an real-time status kag mga nota san repair crew.",
    filipino: "Makikita ang iyong reports sa 'Reports' tab sa ibaba upang makita ang status at mga tala.",
    english: "View your reports by tapping the 'Reports' tab at the bottom to see real-time status and work notes.",
    contextOrNotes: "Giya sa pag-track",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "help_emergency_hotlines",
    category: "help_instructions",
    masbateno: "Para sa mga dinalian nga peligro sa kinabuhi (emergency), tawag dayon sa mga opisyal nga hotlines: Masbate CDRRMO: (056) 333-2244 | Emergency: 911 | PNP Masbate: (056) 333-2222 | Fire Station (BFP): (056) 333-2424.",
    filipino: "Para sa agarang emergency, tumawag sa: Masbate CDRRMO: (056) 333-2244 | 911 | PNP Masbate: (056) 333-2222 | BFP: (056) 333-2424.",
    english: "For life-safety emergencies, call directly: Masbate CDRRMO: (056) 333-2244 | 911 | PNP Masbate: (056) 333-2222 | BFP: (056) 333-2424.",
    contextOrNotes: "Mga opisyal nga hotline sa Masbate",
    status: "VERIFIED",
    isActive: true,
  },

  // ────────────────────────────
  // CATEGORY 11: UI LABELS
  // ────────────────────────────
  {
    term: "ui_report_issue_btn",
    category: "ui_labels",
    masbateno: "Mag-report sin Problema",
    filipino: "Mag-ulat ng Problema",
    english: "Report an Issue",
    contextOrNotes: "Pangunahing button",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "ui_my_reports",
    category: "ui_labels",
    masbateno: "Akon mga Report",
    filipino: "Aking mga Report",
    english: "My Reports",
    contextOrNotes: "Tab sa navigation",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "ui_community_map",
    category: "ui_labels",
    masbateno: "Mapa san Komunidad",
    filipino: "Mapa ng Komunidad",
    english: "Community Map",
    contextOrNotes: "Interactive map view",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "ui_profile",
    category: "ui_labels",
    masbateno: "Akon Profile",
    filipino: "Aking Profile",
    english: "My Profile",
    contextOrNotes: "User account tab",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "ui_confirm",
    category: "ui_labels",
    masbateno: "Kumpirmahon",
    filipino: "Kumpirmahin",
    english: "Confirm",
    contextOrNotes: "Aksyon button",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "ui_cancel",
    category: "ui_labels",
    masbateno: "Kanselahon",
    filipino: "Kanselahin",
    english: "Cancel",
    contextOrNotes: "Aksyon button",
    status: "VERIFIED",
    isActive: true,
  },

  // ────────────────────────────
  // CATEGORY 12: COMMON LOCAL EXPRESSIONS
  // ────────────────────────────
  {
    term: "expr_easy",
    category: "common_local_expressions",
    masbateno: "Madali lang ini.",
    filipino: "Madali lang ito.",
    english: "This is easy.",
    contextOrNotes: "Ekspresyon sa pagpapalubag-loob",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "expr_no_worry",
    category: "common_local_expressions",
    masbateno: "Ayaw pagkabalaka.",
    filipino: "Huwag kang mag-alala.",
    english: "Don't worry.",
    contextOrNotes: "Ekspresyon sa pagpapanatag",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "expr_no_problem",
    category: "common_local_expressions",
    masbateno: "Wara kaso.",
    filipino: "Walang problema.",
    english: "No problem at all.",
    contextOrNotes: "Karaniwang sagot sa pasasalamat",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "expr_let_us_ensure",
    category: "common_local_expressions",
    masbateno: "Siguradohon ta.",
    filipino: "Tiyakin natin.",
    english: "Let's make sure.",
    contextOrNotes: "Ginasiguro an impormasyon",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "expr_meaning",
    category: "common_local_expressions",
    masbateno: "buot sabihon",
    filipino: "ibig sabihin",
    english: "meaning / that is to say",
    contextOrNotes: "Nano an buot sabihon? (NOT ano ibig sabihin)",
    status: "VERIFIED",
    isActive: true,
  },
  {
    term: "expr_please",
    category: "common_local_expressions",
    masbateno: "Palihog",
    filipino: "Pakiusap",
    english: "Please",
    contextOrNotes: "Magalang nga paghangyo",
    status: "VERIFIED",
    isActive: true,
  },
];

// ─── 3. DISTINCTIVE MARKERS FOR LANGUAGE DETECTION & CLASSIFICATION ──────────

export const MINASBATE_CASE_MARKERS = [
  /\b(an|san|sin)\b/i,
  /\b(akon|imo|iya|aton|amon|inda|ninda|nindo)\b/i,
  /\b(didi|dida|didto)\b/i,
  /\b(ini|ina|adto)\b/i,
  /\b(nano|sin-o|diin|san-o|ngaa|kay\s*nano|pira)\b/i,
  /\b(wara|diri|ayaw)\b/i,
  /\b(kag|kondi|agod|ugaling)\b/i,
  /\b(buot\s*sabihon|bag-uhon|makit-an|suga\s*sa\s*poste|pundi|padong|ramit|awas|nagasaribo|lubak|kalsada)\b/i,
  /\b(maayong\s*adlaw|dios\s*marhay|daku\s*nga\s*salamat)\b/i,
];

export const TAGALOG_DISTINCTIVE_MARKERS = [
  /\b(ang|ng|mga|po|opo)\b/i,
  /\b(ano|sino|saan|kailan|bakit|paano)\b/i,
  /\b(namin|natin|ninyo|nila|kanila|atin|aking|aming)\b/i,
  /\b(hindi|wala|huwag)\b/i,
  /\b(malaki|malaking|malalim|malapit|harap|tabi)\b/i,
  /\b(ibig\s*sabihin|makikita|kumusta|salamat\s*po)\b/i,
];

export const WARAY_CONTAMINATION_PATTERNS = [
  /\bhin\b/i,
  /\bhan\b/i,
  /\bmaupay\b/i,
  /\bwaray\b/i,
  /\bhini\b/i,
  /\bhira\b/i,
];

export const CEBUANO_CONTAMINATION_PATTERNS = [
  /\bunsa\b/i,
  /\bngano\b/i,
  /\bkanus-a\b/i,
  /\bkinsa\b/i,
  /\bunsaon\b/i,
  /\bdili\b/i,
  /\bog\b/i,
];

/**
 * Detects the language of a given text and returns classification + confidence.
 */
export function detectLanguageWithConfidence(text: string): {
  language: DetectedLanguage;
  confidence: number;
  isMixed: boolean;
  needsClarification: boolean;
  markers: string[];
} {
  if (!text || text.trim().length < 3) {
    return {
      language: "msb",
      confidence: 0.5,
      isMixed: false,
      needsClarification: false,
      markers: [],
    };
  }

  const clean = text.toLowerCase();
  let msbScore = 0;
  let filScore = 0;
  let engScore = 0;
  const matchedMarkers: string[] = [];

  // Check Minasbate markers
  for (const pattern of MINASBATE_CASE_MARKERS) {
    const match = clean.match(pattern);
    if (match) {
      msbScore += 2;
      matchedMarkers.push(`msb:${match[0]}`);
    }
  }

  // Check Tagalog markers
  for (const pattern of TAGALOG_DISTINCTIVE_MARKERS) {
    const match = clean.match(pattern);
    if (match) {
      filScore += 2;
      matchedMarkers.push(`fil:${match[0]}`);
    }
  }

  // English words check
  const engWords = clean.match(/\b(the|is|are|was|were|pothole|streetlight|road|water|garbage|report|status|please|help|check|view|location|where|what|how)\b/gi);
  if (engWords) {
    engScore = engWords.length * 1.5;
  }

  const totalScore = msbScore + filScore + engScore;
  const isMixed = (msbScore >= 2 && (filScore >= 2 || engScore >= 2)) || (filScore >= 2 && engScore >= 2);

  // Confidence calculation
  const maxScore = Math.max(msbScore, filScore, engScore);
  const confidence = totalScore > 0 ? Math.min(1.0, Number((maxScore / totalScore).toFixed(2))) : 0.4;

  let chosenLanguage: DetectedLanguage = "msb";
  if (isMixed) {
    // If filipino markers dominate over masbateno, classify as fil
    if (filScore > msbScore) {
      chosenLanguage = "fil";
    } else {
      chosenLanguage = "mixed";
    }
  } else if (engScore > msbScore && engScore > filScore) {
    chosenLanguage = "en";
  } else if (filScore > msbScore) {
    chosenLanguage = "fil";
  } else {
    chosenLanguage = "msb";
  }

  // If text is short, ambiguous, or gibberish without recognized grammatical words
  const needsClarification = totalScore === 0 && clean.split(/\s+/).length > 3;

  return {
    language: chosenLanguage,
    confidence,
    isMixed,
    needsClarification,
    markers: matchedMarkers,
  };
}

/**
 * Checks if a text has Minasbate language patterns
 */
export function isMasbatenoText(text: string): boolean {
  if (!text || text.trim().length < 3) return false;
  const result = detectLanguageWithConfidence(text);
  if (result.language === "fil" || result.language === "en") return false;
  return result.language === "msb" || (result.isMixed && (text.toLowerCase().includes("san") || text.toLowerCase().includes("sin")));
}

/**
 * Low-confidence user prompt when the AI is uncertain about the resident's meaning.
 * As explicitly specified in the prompt requirement #8:
 */
export const MASBATENO_UNCERTAINTY_PROMPT =
  "Pwede mo ini isulat sa Filipino o English para masiguro ko an imo pasabot?";

/**
 * Resolves language: prefers user choice, else auto-detects Masbateño, Filipino, or English.
 */
export function resolveLanguage(
  preferredLang?: string | null,
  textSample?: string
): SupportedLanguage {
  if (preferredLang === "msb" || preferredLang === "fil" || preferredLang === "en") {
    return preferredLang;
  }
  if (!textSample) return "msb";

  const detected = detectLanguageWithConfidence(textSample);
  if (detected.language === "en") return "en";
  if (detected.language === "fil") return "fil";
  return "msb"; // Default to authentic Masbateño
}

// ─── 4. CONTAMINATION SANITIZER & POST-PROCESSOR ─────────────────────────────

/**
 * Scans generated Masbateño text and cleans accidental dialect leaks
 * (Waray 'hin/han/maupay', Cebuano 'dili/unsa/og', Tagalog 'ano ibig sabihin/makikita/ng').
 */
export function sanitizeMasbatenoOutput(text: string): string {
  if (!text) return "";
  let clean = text;

  // 1. Remove Waray 'hin' -> 'sin' and 'han' -> 'san'
  clean = clean.replace(/\bhin\b/gi, "sin");
  clean = clean.replace(/\bhan\b/gi, "san");
  clean = clean.replace(/\bmaupay\b/gi, "maayo");
  clean = clean.replace(/\bwaray\b/gi, "wara");

  // 2. Remove Cebuano 'dili' -> 'diri', 'unsa' -> 'nano', 'ngano' -> 'kay nano'
  clean = clean.replace(/\bdili\b/gi, "diri");
  clean = clean.replace(/\bunsa\b/gi, "nano");
  clean = clean.replace(/\bngano\b/gi, "kay nano");
  clean = clean.replace(/\bkanus-a\b/gi, "san-o");
  clean = clean.replace(/\bkinsa\b/gi, "sin-o");
  clean = clean.replace(/\bunsaon\b/gi, "paano");

  // 3. Clean common Tagalog literalisms when in Masbateño mode
  clean = clean.replace(/\bano\s*ibig\s*sabihin\b/gi, "nano an buot sabihon");
  clean = clean.replace(/\bibig\s*sabihin\b/gi, "buot sabihon");
  clean = clean.replace(/\bmakikita\b/gi, "makit-an");

  // Preserve technical terms that must remain capitalized/standard
  clean = clean.replace(/\breference\s*number\b/gi, "Reference Number");
  clean = clean.replace(/\bunder\s*review\b/gi, "Under Review");
  clean = clean.replace(/\bin\s*progress\b/gi, "In Progress");
  clean = clean.replace(/\bbarangay\s*hall\b/gi, "Barangay Hall");

  return clean;
}

// ─── 5. VERIFIED MASBATENO CIVIC RESPONSES FOR 12 CIVIC DOMAINS ──────────────

export interface MasbatenoCivicResponse {
  domain: string;
  queryKeywords: string[];
  response: string;
}

export const MASBATENO_CIVIC_RESPONSES: MasbatenoCivicResponse[] = [
  // 1. Pothole / Lubak
  {
    domain: "pothole",
    queryKeywords: ["lubak", "pothole", "kalsada", "buho", "sira nga kalsada", "aspalto", "bako-bako"],
    response: `Maayong adlaw! Kon may naobserbahan ka nga lubak o guba nga kalsada didi sa Masbate, madali lang ini i-report:
1. Pinduta an '📍 Report an Issue' button sa Dashboard o sa ubos nga navigation bar.
2. Pilia an Kategorya nga 'Road Damage / Pothole'.
3. Isaysay an problema kag landmark (halimbawa: "May daku nga lubak sa kalsada harani sa covered court").
4. Magkuha o mag-upload sin malinaw nga litrato.
5. Kumpirmaha an GPS pin sa mapa kon diin nahimutang an lubak.
6. Pinduta an Submit para makakuha sin opisyal nga Reference Number (halimbawa: BB-2026-...) para ma-track an pag-ayo san Engineering crew.`,
  },

  // 2. Streetlight / Suga sa poste
  {
    domain: "streetlight",
    queryKeywords: ["suga", "poste", "pundi", "padong", "madulom", "bombilya", "ilaw", "streetlight"],
    response: `Para sa pundi o padong nga suga sa poste:
1. Sa '📍 Report an Issue', pilia an Kategorya nga 'Streetlight / Ilaw sa Poste'.
2. Isaysay kon diin nga poste an pundi kag kon pira na ka adlaw nga madulom an kalsada.
3. Kunan sin litrato an poste kag itapat an pin sa mapa sa eksaktong lugar.
4. Pagka-submit, ipadara ini sa natungdan nga barangay o utility crew para masalidhan an bombilya.`,
  },

  // 3. Electrical / Naputol nga alambre
  {
    domain: "electrical",
    queryKeywords: ["kuryente", "alambre", "wire", "spark", "naga-spark", "nagalaylay", "tabingi nga poste", "peligro"],
    response: `Pahibalo sa Seguridad: Kon may naputol nga alambre, nahulog nga wire san kuryente, o naga-spark sa poste:
• Ayaw pag-paranihe o pag-tandoga an alambre para makalikay sa disgrasya.
• Sa dinalian nga peligro, tawag dayon sa Masbate CDRRMO: (056) 333-2244 o 911.
• Pwede mo man ini i-report sa BantayBarangay sa idalom san 'Power Line / Electrical Hazard' agod maatiman dayon san barangay kag power utility.`,
  },

  // 4. Garbage / Basura kag Ramit
  {
    domain: "garbage",
    queryKeywords: ["basura", "ramit", "tambak", "mabahoon", "hakot", "wara mahakot", "ati"],
    response: `Para sa tambak nga basura o wara mahakot nga ramit:
1. Pinduta an '📍 Report an Issue' kag pilia an 'Garbage / Waste Collection'.
2. Isaysay kon diin natambak an basura kag kon mabahoon na ini.
3. Mag-upload sin litrato san tambak kag itapat an lokasyon sa mapa.
4. Awtomatiko ini nga ipasa sa barangay sanitation committee para mahakot.`,
  },

  // 5. Drainage / Barado nga kanal
  {
    domain: "drainage",
    queryKeywords: ["kanal", "drainage", "barado", "clog", "imburnal"],
    response: `Para sa barado nga kanal o napuno sin ramit nga drainage:
1. Pilia an Kategorya nga 'Drainage / Canal Issue' sa 'Report an Issue'.
2. Isaysay kon barado an agihan san tubig kag nagatuga sin peligro kon mag-uran.
3. Kunan sin litrato an kanal kag i-kumpirma an GPS pin sa dalan.`,
  },

  // 6. Flooding / Nagabaha
  {
    domain: "flooding",
    queryKeywords: ["baha", "nagabaha", "awas", "naga-awas", "lapaw", "tubig sa kalsada", "nagatanaw"],
    response: `Kon nagabaha an kalsada o naga-awas an tubig halin sa kanal:
1. Mag-submit sin report sa 'Flooding / Baha' nga kategorya.
2. Isaysay kon unod-tuhod o abot-kalsada an baha kag kon may naapektuhan nga kabalayan.
3. Kon may dinalian nga pagbaha nga nagakinahanglan sin evacuation o rescue, tawag dayon sa CDRRMO Rescue: (056) 333-2244 o 911.`,
  },

  // 7. Fallen Tree / Tumbang kahoy
  {
    domain: "fallen_tree",
    queryKeywords: ["kahoy", "tumba", "tumbang", "sanga", "nakasulang", "nakabalabag", "puno"],
    response: `Para sa natumba nga kahoy o naputol nga sanga nga nakasulang sa kalsada:
1. Pilia an 'Fallen Tree / Vegetation Hazard' sa report form.
2. Isaysay kon nakabalabag sa dalan o kon may naigo nga wire san kuryente.
3. Mag-upload sin litrato para makita san barangay crew kon kinahanglan an chainsaw para sa clearing operations.`,
  },

  // 8. Water Supply / Tubo san tubig
  {
    domain: "water_supply",
    queryKeywords: ["tubo", "tubig", "tulo", "gripo", "wara agas", "nagasaribo", "leak"],
    response: `Para sa tulo san tubo o wara agas nga tubig:
1. Pilia an 'Water Supply / Pipe Leak' kategorya.
2. Isaysay kon nagasaribo an tubig o kon pira na ka adlaw nga wara agas sa inyo purok.
3. I-kumpirma an eksaktong kanto o purok sa mapa agod mapadara sa water district inspection.`,
  },

  // 9. Damaged Public Facility
  {
    domain: "public_facility",
    queryKeywords: ["covered court", "court", "gym", "tulay", "waiting shed", "kudal", "plaza", "eskwelahan"],
    response: `Para sa guba nga pasilidad san komunidad (covered court, tulay, waiting shed, kudal):
1. Pilia an 'Public Facilities / Infrastructure Damage' kategorya.
2. Isaysay an bahin nga naguba (halimbawa: "Guba an atop san covered court sa Purok 2").
3. Mag-upload sin litrato para sa opisyal nga structural inspection san barangay.`,
  },

  // 10. Checking Report Status / Diin makit-an / Under Review
  {
    domain: "check_status",
    queryKeywords: ["under review", "status", "kamutangan", "diin", "makit-an", "makita", "track", "akon report", "mga report", "subaybayan", "buot sabihon"],
    response: `Sa BantayBarangay, ini an buot sabihon san mga Report Status:
• Submitted: Naresibe na san sistema an imo report.
• Under Review: Ginasusi na san barangay staff kag gina-preparar an inspection kag dispatch sa mga trabahador.
• Assigned: Ginpasa na sa natungdan nga ahensya o repair crew (hal. Engineering o Utility).
• In Progress: Ginatrabaho kag gina-repair na an problema sa lugar.
• Resolved: Nahuman na an pag-ayo! Gina-imbitar an residente nga mag-kumpirma.
• Closed: Opisyal na nga nasirad-an kag na-archive an kaso.
Makit-an kag ma-track mo an imo mga gin-sumite nga report pinaagi sa pagpindot san 'Reports' icon sa ubos nga navigation bar gamit an imo Reference Number.`,
  },

  // 11. Changing Report Location / Bag-uhon an pin
  {
    domain: "change_location",
    queryKeywords: ["bag-uhon", "baguhin", "lokasyon", "location", "pin", "mapa", "ilipat", "itama"],
    response: `Para bag-uhon o itama an lokasyon san imo report:
1. Sa 'Report an Issue' nga form, pinduta an 'Locate Me' para awtomatiko nga makuha an GPS san imo cellphone.
2. Pwede mo man i-drag an pin o mag-tupik sa bisan diin nga parte sa mapa para itapat sa eksaktong lugar.
3. Awtomatiko nga mag-uupdate an address kag landmark base sa pin nga imo ginbutang.`,
  },

  // 12. Asking for Help / Paano mag-report
  {
    domain: "help_general",
    queryKeywords: ["paano", "maka-report", "mag-report", "bulig", "tabang", "tuyo", "help", "guide"],
    response: `Maayong adlaw! Madali lang mag-report didi sa BantayBarangay Masbate:
1. Pinduta an '📍 Report an Issue' button sa Dashboard o navigation bar.
2. Pilia an Kategorya san problema (hal. Kalsada/Lubak, Suga sa Poste, Drainage, o Basura).
3. Isaysay an problema (pwede mo gamiton an '✨ Help Me Write My Report' para buligan ka mag-compose).
4. Mag-upload sin litrato kag i-kumpirma an GPS pin sa mapa.
5. Pinduta an Submit para makakuha sin Reference Number (hal. BB-2026-000101) para sa pag-track.`,
  },
];

// ─── 6. DATABASE SYNC & DYNAMIC GLOSSARY RESOLUTION ──────────────────────────

/**
 * Ensures the default verified glossary is populated in the SQLite database.
 */
export async function seedDefaultGlossaryIfEmpty(): Promise<number> {
  try {
    const count = await (prisma as any).masbatenoGlossary.count();
    if (count > 0) return count;

    for (const entry of VERIFIED_MASBATENO_GLOSSARY) {
      await (prisma as any).masbatenoGlossary.create({
        data: {
          term: entry.term,
          category: entry.category,
          masbateno: entry.masbateno,
          filipino: entry.filipino,
          english: entry.english,
          contextOrNotes: entry.contextOrNotes || null,
          status: entry.status,
          isActive: entry.isActive,
        },
      });
    }
    return VERIFIED_MASBATENO_GLOSSARY.length;
  } catch (err) {
    console.warn("Could not seed glossary to database, using memory fallback:", err);
    return VERIFIED_MASBATENO_GLOSSARY.length;
  }
}

/**
 * Retrieves all approved terms, preferentially from DB, with guaranteed in-memory fallback.
 */
export async function getAllApprovedGlossaryEntries(): Promise<GlossaryEntry[]> {
  try {
    const rows = await (prisma as any).masbatenoGlossary.findMany({
      where: { isActive: true },
      orderBy: { category: "asc" },
    });
    if (rows && rows.length > 0) {
      return rows.map((r: any) => ({
        term: r.term,
        category: r.category as GlossaryCategory,
        masbateno: r.masbateno,
        filipino: r.filipino,
        english: r.english,
        contextOrNotes: r.contextOrNotes || undefined,
        status: r.status as HumanReviewStatus,
        isActive: r.isActive,
      }));
    }
  } catch (err) {
    // Database query fallback
  }
  return VERIFIED_MASBATENO_GLOSSARY.filter((e) => e.isActive && e.status === "VERIFIED");
}

/**
 * Searches the glossary by any English, Filipino, or Masbateño keyword.
 */
export function findMasbatenoTranslation(searchQuery: string): GlossaryEntry | undefined {
  const clean = searchQuery.trim().toLowerCase();
  return VERIFIED_MASBATENO_GLOSSARY.find(
    (e) =>
      e.term.toLowerCase() === clean ||
      e.masbateno.toLowerCase().includes(clean) ||
      e.english.toLowerCase().includes(clean) ||
      e.filipino.toLowerCase().includes(clean)
  );
}

export function getAllMasbatenoTerms(): GlossaryEntry[] {
  return [...VERIFIED_MASBATENO_GLOSSARY];
}
