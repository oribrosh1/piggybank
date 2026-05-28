const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const eventRepository = require("../repositories/eventRepository");
const storageRepository = require("../repositories/storageRepository");
const {
  getPartySettingLabel,
  CATERING_PARTNER_LABELS,
  formatVegetarianType,
} = require("../constants/partyTypeLabels");
const { getPartyDerivedStyleInstructions } = require("../constants/partyTypePosterStyles");

/** Google AI (API key) model id; `gemini-3.1-flash-preview` returns 404 on many projects. */
const STAGE_A_MODEL = process.env.GEMINI_STAGE_A_MODEL || "gemini-2.5-flash";

/** Gemini `generateContent` allows at most 5 stop_sequences (400 otherwise). */
const GEMINI_MAX_STOP_SEQUENCES = 5;

/**
 * End after valid JSON; block common post-JSON chatter.
 * Only the first {@link GEMINI_MAX_STOP_SEQUENCES} entries are sent to the API.
 * @type {string[]}
 */
const STAGE_A_STOP_SEQUENCES = [
  "\n\n###",
  "\n\n##",
  "\n\n---",
  "\n\nHere is",
  "\n\nHere are",
  "\n\nI hope",
  "\n\nThe image",
  "\n\nThis prompt",
  "\n\nNote:",
];

/** Stage A: caps brief length so generation returns sooner and uses fewer output tokens. */
const STAGE_A_MAX_CHARS = 1200;

/** Hard cap for the Gemini-generated invitation headline (`aiPosterTitle`). */
const COOL_TITLE_MAX_CHARS = 80;

/** Tight token budget for the headline call (returns a short JSON object). */
const COOL_TITLE_JSON_MAX_OUTPUT_TOKENS = 200;

/** visualTeaser: shorter cap than posterBrief — skeleton preview only (see system instruction). */
const STAGE_A_VISUAL_TEASER_MAX_CHARS = 900;

/** Gemini maxOutputTokens for visualTeaser only (shorter string than posterBrief JSON). */
const STAGE_A_VISUAL_TEASER_JSON_MAX_OUTPUT_TOKENS = 1280;

/** Extra headroom when Stage A returns JSON with two long string fields. */
const STAGE_A_JSON_MAX_OUTPUT_TOKENS = 4000;

/**
 * Stage A call 1 (parallel): full poster brief — JSON `{ posterBrief }` only.
 * @see https://ai.google.dev/gemini-api/docs/system-instructions
 */
const STAGE_A_SYSTEM_POSTER_BRIEF = `You help create invitation poster image prompts.
You must follow the user message and return a JSON object with a single string field posterBrief.
The poster text must be plain English only: no markdown, no # headings, no **bold**, no code fences, no title like "The Prompt", and no intros (e.g. "Here is", "designed for Midjourney", tool names). Start the brief with the actual scene (often the word "A").
Open posterBrief with vivid atmosphere and setting driven by CREATIVE VISUAL DIRECTION (occasion type, mitzvah tone if applicable, party setting, theme, vibe, honoree color story, age- and gender-appropriate hero character) plus the party-derived Visual style paragraph — then lay out logistics text (dates, address, etc.) as instructed.
When the user message includes REQUIRED — on-poster typography rules, obey them for factual logistics lines (exact date, time, address where applicable). Theme, vibe, and party setting must still read strongly through imagery and color — optional short taglines only if they stay readable.`;

/**
 * Stage B parallel: short catchy invitation headline (`aiPosterTitle`) — JSON `{ posterTitle }` only.
 * Separate from `posterPrompt` (poster image brief) and from `visualTeaser` (skeleton image brief).
 */
const STAGE_B_SYSTEM_COOL_TITLE = `You write short catchy invitation headlines for kids' birthday and bar/bat mitzvah party posters.
You must follow the user message and return a JSON object with a single string field posterTitle.
posterTitle must be plain text — no markdown, no quotes, no emojis, no preamble. One short phrase only (ideally 2–6 words). Do not include the calendar date, the clock time, the venue address, or the word "Invitation". Honoree first name is welcome but optional. Keep within the character limit in the user message.
Never output meta text about JSON, schemas, requests, or assistants — only the actual headline string inside posterTitle.`;

/**
 * Stage A call 2 (parallel): logistics-free brief for skeleton — JSON `{ visualTeaser }` only.
 * @see https://ai.google.dev/gemini-api/docs/system-instructions
 */
const STAGE_A_SYSTEM_VISUAL_TEASER = `You help create invitation poster IMAGE briefs for fast preview generation (no on-poster logistics text).
You must follow the user message and return a JSON object with a single string field visualTeaser.
The visualTeaser text must be plain English only: no markdown, no # headings, no **bold**, no code fences, no preamble. Start with the actual scene (often the word "A").
visualTeaser must stay concise within the character limit in the user message: prioritize scene, lighting, palette, hero portrait/character, composition, and style — tight prose, no filler. Describe the honoree hero's look, energy, outfit, and age-appropriate proportions from Event facts (gender, age) without asking for readable name lettering, title treatments, turning-age lines, plaques, cake inscriptions, or any legible words or numbers in the artwork — a later pipeline step adds invitation typography. It must NOT ask for or reserve on-poster text for: calendar date, clock time, street address, city, venue as a directions block, venue arrival or gate notes, parking, kosher/catering/meal/vegetarian/chalav lines, or guest dress-code footers. When the user message says a parent reference photo will be used in the image step, describe the hero portrait so likeness (face, hair, skin tone) can match that photo. Start visualTeaser with the actual scene (often the word "A").`;

/** Rough ceiling paired with STAGE_A_MAX_CHARS (~4 chars/token for typical English). */
const STAGE_A_MAX_OUTPUT_TOKENS = 280;

/** Client-supplied poster brief (Stage B only); generous cap to avoid abuse. */
const PROVIDED_PROMPT_MAX_CHARS = 12_000;

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Stage A often adds intros ("Here is…"), headings ("### The Prompt"), and **quotes**.
 * Reduce to a single plain brief string for Stage B and Firestore.
 * @param {string} raw
 * @returns {string}
 */
function sanitizeStageATextOutput(raw) {
  if (!raw || typeof raw !== "string") return "";
  let s = raw.trim();

  if (s.startsWith("```")) {
    s = s.replace(/^```[a-z]*\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  }

  const tightBoldQuote = s.match(/\*\*"\s*([^"]{25,})"\s*\*\*/);
  if (tightBoldQuote) {
    return tightBoldQuote[1].trim().replace(/\s+/g, " ").trim();
  }

  const openBoldQuote = s.match(/\*\*"\s*([^"]{25,})/);
  if (openBoldQuote) {
    return openBoldQuote[1].trim().replace(/\s+/g, " ").trim();
  }

  const headerStrip = s.split(/\n/).filter((line) => {
    const t = line.trim();
    if (!t) return false;
    if (/^#{1,6}\s*(the\s*)?prompt\b/i.test(t)) return false;
    if (/^(here|below|this)\s+(is|are)\b/i.test(t)) return false;
    return true;
  });
  s = headerStrip.join("\n").trim();

  const opener =
    /\bA\s+high-quality\b|\bA\s+professional\s+invitation\b|\bA\s+vibrant\b|\bAn\s+invitation\s+poster\b|\bPortrait-oriented\b|\bInvitation\s+poster\b/i;
  const m = s.match(opener);
  if (m && m.index != null && m.index > 0 && m.index < 520) {
    s = s.slice(m.index).trim();
  }

  s = s
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*/g, "")
    .replace(/^[*\-]\s+/gm, "");

  return s.replace(/\s+/g, " ").trim();
}

/**
 * Strip markdown / preamble from visualTeaser the same way as posterBrief; cap length.
 * @param {string} raw
 * @returns {string}
 */
function sanitizeVisualTeaserBrief(raw) {
  if (!raw || typeof raw !== "string") return "";
  let s = sanitizeStageATextOutput(raw);
  if (!s || s.length < 10) {
    s = raw
      .trim()
      .replace(/^```[a-z]*\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim()
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/\*\*/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  if (s.length > STAGE_A_VISUAL_TEASER_MAX_CHARS) {
    s = s.slice(0, STAGE_A_VISUAL_TEASER_MAX_CHARS).trimEnd();
  }
  return s.trim();
}

/**
 * When Stage A JSON is missing or truncates visualTeaser — logistics-free brief for skeleton.
 * @param {object} event
 * @param {boolean} hasHonoreeReferencePhoto
 * @returns {string}
 */
function fallbackVisualTeaserFromEvent(event, hasHonoreeReferencePhoto) {
  const chunks = [
    "A vibrant portrait-oriented invitation poster illustration.",
    buildCreativeVisualDirectives(event, hasHonoreeReferencePhoto),
    `Party visual style: ${getPartyDerivedStyleInstructions(event)}.`,
  ];
  const name = event.childName?.trim();
  if (name) {
    chunks.push(
      `Feature the honoree as the focal child hero; emotional energy and styling can reflect the celebration for ${name} without rendering their name as readable text in the image.`,
    );
  }
  if (event.age != null && String(event.age).trim() !== "") {
    chunks.push(
      `Hero proportions and apparent age should match a child turning ${String(event.age).trim()} (do not paint digits or words stating the age on the artwork).`,
    );
  }
  chunks.push(
    `Illustrated hero must match honoree gender from facts (${honoreeGenderLabelForFacts(event)}) and celebration type.`,
  );
  chunks.push(
    "Omit from the image: calendar date, event clock time, street address, venue arrival or parking text, catering or kosher footers, and guest dress-code fine print.",
  );
  if (hasHonoreeReferencePhoto) {
    chunks.push(
      "A parent-supplied reference photo will be used in the image step — preserve likeness (face, hair, skin tone) in the focal honoree portrait.",
    );
  }
  let s = chunks.join(" ");
  s = sanitizeStageATextOutput(s) || s.replace(/\s+/g, " ").trim();
  if (s.length > STAGE_A_VISUAL_TEASER_MAX_CHARS) {
    s = s.slice(0, STAGE_A_VISUAL_TEASER_MAX_CHARS).trimEnd();
  }
  return s;
}

/**
 * Strip typography / lettering instructions from a visual teaser before the FLUX **no-text** branch.
 * Gemini or legacy fallbacks often still mention titles or age lines; those strongly bias the image model.
 * @param {string} raw
 * @returns {string}
 */
function sanitizeVisualTeaserForFluxNoText(raw) {
  if (!raw || typeof raw !== "string") return "";
  let s = raw.replace(/\s+/g, " ").trim();
  /** @param {string} sent */
  const isTypographySentence = (sent) => {
    const t = sent.toLowerCase();
    if (/\b(typography|letterform|letterforms|type treatment|headline|subhead|caption|inscription|watermark|logo)\b/.test(t))
      return true;
    if (/\b(hero|on-poster|poster)\b.*\b(title|type|text|letter|word|line)\b/.test(t)) return true;
    if (/\b(title|type|text)\b.*\b(hero|poster|readable|legible|large)\b/.test(t)) return true;
    if (/\b(readable|legible)\b.*\b(name|age|title|line|type|text)\b/.test(t)) return true;
    if (/\bturning-?age\b/.test(t)) return true;
    if (/\bturning\b.*\b(line|text|type|poster|title)\b/.test(t)) return true;
    if (/\b(first )?name\b.*\b(title|type|text|letter|poster)\b/.test(t)) return true;
    if (/\b(bar|bat)\s+mitzvah\b.*\b(text|type|title)\b/.test(t) && /\b(large|readable|legible|poster)\b/.test(t))
      return true;
    return false;
  };
  const parts = s
    .split(/(?<=[.!?])\s+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .filter((x) => !isTypographySentence(x));
  s = parts.join(" ").replace(/\s+/g, " ").trim();
  return s;
}

/** Same prefix as final poster + with-text skeleton (Vertex / OpenAI). */
const FINAL_POSTER_TYPOGRAPHY_PREFIX =
  "[Poster typography] Spell names and titles exactly as in the brief; large legible letterforms, strong contrast, generous margins. Avoid tiny blocks, warped or mirrored letters, nonsense glyphs, overlapping characters, or misspelled words.\n\n";

/**
 * No-text skeleton prompt (FLUX / Vertex) — shared with {@link generatePoster} and local tests.
 * @param {object} event
 * @param {boolean} hasHonoreeRef
 * @param {string|undefined} visualTeaserPatch
 */
function buildSkeletonNoTextImagenPromptBody(
  event,
  hasHonoreeRef,
  visualTeaserPatch,
) {
  const raw =
    typeof visualTeaserPatch === "string" &&
    visualTeaserPatch.trim().length >= 40
      ? visualTeaserPatch.trim()
      : fallbackVisualTeaserFromEvent(event, hasHonoreeRef);
  let scene = sanitizeVisualTeaserForFluxNoText(raw);
  if (scene.length < 80) {
    scene = sanitizeVisualTeaserForFluxNoText(
      fallbackVisualTeaserFromEvent(event, hasHonoreeRef),
    );
  }
  const prefix =
    "[ZERO_GLYPHS] Output must contain no readable text: no letters, digits, punctuation shapes used as lettering, logos, watermarks, cake writing, balloon letters, street signs with words, framed certificates with text, or empty boxes meant for type. " +
    "If a real-world object would normally show writing, show it blank, cropped out, or illegible abstract texture only.\n\n" +
    "Illustrated scene (pure visuals — do not paint any of the following description as literal text on the canvas):\n";
  let body = prefix + scene;
  if (
    hasHonoreeRef &&
    !/\breference photo\b/i.test(body) &&
    !/\blikeness\b/i.test(body)
  ) {
    body +=
      "\n\nInclude a prominent, warm portrait of the honoree child consistent with the name and age given in the pipeline metadata (still no visible name or age text in the image).";
  }
  body +=
    "\n\nReinforce: illustration-only celebration artwork — composition, lighting, character, palette, depth of field — absolutely zero typography.";
  return body.length > 4000 ? body.slice(0, 4000) : body;
}

/**
 * With-text skeleton prompt — shared with {@link generatePoster} and local tests.
 * @param {boolean} hasHonoreeRef
 * @param {string|null|undefined} imagePrompt
 */
function buildSkeletonWithTextImagenPromptBody(hasHonoreeRef, imagePrompt) {
  let body = imagePrompt || "";
  body = FINAL_POSTER_TYPOGRAPHY_PREFIX + body;
  if (hasHonoreeRef) {
    body +=
      "\n\nFACE-ONLY REFERENCE (IMAGE INPUT): The image API receives a **cropped face** from the uploaded honoree photo. Preserve likeness—face shape, hair, skin tone, and age-appropriate appearance—for the focal illustrated portrait. Integrate into the full invitation poster layout, typography, lighting, and scene described above (do not output the raw snapshot as the entire poster).";
  }
  return body.length > 4000 ? body.slice(0, 4000) : body;
}

/**
 * Extract posterBrief (+ optional visualTeaser) from Stage A JSON (handles optional ``` fences).
 * @returns {{ posterBrief: string, visualTeaser: string|null }|null}
 */
function parseStageAJsonPayload(raw) {
  if (!raw || typeof raw !== "string") return null;
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  }
  try {
    const o = JSON.parse(s);
    if (!o || typeof o.posterBrief !== "string" || !o.posterBrief.trim()) return null;
    const posterBrief = o.posterBrief.trim();
    let visualTeaser = null;
    if (typeof o.visualTeaser === "string" && o.visualTeaser.trim()) {
      const t = sanitizeVisualTeaserBrief(o.visualTeaser);
      if (t.length >= 40) visualTeaser = t;
    }
    return { posterBrief, visualTeaser };
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Parse `{ posterBrief }` from Stage A call 1 (parallel poster brief).
 * @param {string} raw
 * @returns {string|null}
 */
function parsePosterBriefJsonPayload(raw) {
  if (!raw || typeof raw !== "string") return null;
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  }
  s = stitchStageAJsonText(s);
  try {
    const o = JSON.parse(s);
    if (!o || typeof o.posterBrief !== "string" || !o.posterBrief.trim())
      return null;
    return o.posterBrief.trim();
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Parse `{ visualTeaser }` from Stage A call 2 (parallel skeleton brief).
 * @param {string} raw
 * @returns {string|null}
 */
function parseVisualTeaserOnlyJsonPayload(raw) {
  if (!raw || typeof raw !== "string") return null;
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  }
  s = stitchStageAJsonText(s);
  try {
    const o = JSON.parse(s);
    if (!o || typeof o.visualTeaser !== "string" || !o.visualTeaser.trim())
      return null;
    const t = sanitizeVisualTeaserBrief(o.visualTeaser);
    return t.length >= 40 ? t : null;
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * When Stage A uses an assistant prefill of `{`, the model may return only the continuation.
 * @param {string} raw
 * @returns {string}
 */
function stitchStageAJsonText(raw) {
  if (!raw || typeof raw !== "string") return "";
  const t = raw.trim();
  if (t.startsWith("{")) return t;
  return `{${t}`;
}

/** Calendar-facing label for event.eventType (birthday / mitzvah / fallback). */
function getEventTypeLabel(event) {
  return (
    {
      birthday: "Birthday Party",
      barMitzvah: "Bar Mitzvah",
      batMitzvah: "Bat Mitzvah",
    }[event.eventType] || "Celebration"
  );
}

/**
 * Firestore may omit honoreeGender until the form ships; poster prompts default to boy.
 * @param {object} event
 * @returns {'boy'|'girl'|'other'}
 */
function resolveHonoreeGenderForPrompt(event) {
  const g =
    typeof event.honoreeGender === "string"
      ? event.honoreeGender.trim().toLowerCase()
      : "";
  if (g === "girl" || g === "other") return g;
  return "boy";
}

/** @param {object} event @returns {string} */
function honoreeGenderLabelForFacts(event) {
  const g = resolveHonoreeGenderForPrompt(event);
  if (g === "girl") return "Girl";
  if (g === "other") return "Other / open presentation";
  return "Boy";
}

/**
 * @param {object} event
 * @returns {string} One line for Event facts + creative block
 */
function describeHonoreeAgeForCharacter(event) {
  const raw = event.age;
  if (raw == null || String(raw).trim() === "") {
    return "Use age from Event facts for the hero character when present; otherwise child proportions.";
  }
  const n = parseInt(String(raw).replace(/\D/g, ""), 10);
  if (Number.isFinite(n) && n >= 1 && n <= 19) {
    return `Turning ${n} — illustrated hero must match ~${n}-year-old proportions, face maturity, and energy.`;
  }
  return `Age "${String(raw).trim()}" — match apparent age in the hero character design.`;
}

/**
 * Stage-A-only art direction: pushes cool, on-theme imagery from type / mitzvah / category / setting / theme / vibe / color.
 * @param {object} event
 * @param {boolean} hasHonoreeReferencePhoto
 * @returns {string}
 */
function buildCreativeVisualDirectives(event, hasHonoreeReferencePhoto) {
  const lines = [];

  const eventTypeLabel = getEventTypeLabel(event);
  lines.push(
    `Occasion (${eventTypeLabel}): Match poster mood, typography era, and staging to this occasion — birthdays feel playful/youthful; bar/bat mitzvah feels milestone-celebratory and respectful (not generic clip-art unless the vibe supports it).`,
  );

  if (
    (event.eventType === "barMitzvah" || event.eventType === "batMitzvah") &&
    (event.mitzvahCelebrationFocus === "party" ||
      event.mitzvahCelebrationFocus === "ceremony")
  ) {
    lines.push(
      event.mitzvahCelebrationFocus === "ceremony"
        ? "Mitzvah celebration focus — ceremony: elegant meaningful light, formal hall or sanctuary-adjacent sophistication where consistent with venue facts; avoid nightclub clichés."
        : "Mitzvah celebration focus — party/reception: festive lighting, dancefloor energy, pride-of-celebration staging.",
    );
  }

  if (event.eventCategory === "formal") {
    lines.push(
      "Event category — formal: editorial polish, refined metallics or deep tones, restrained sparkle.",
    );
  } else if (event.eventCategory === "party") {
    lines.push(
      "Event category — party: bold graphics, motion, playful illustration and upbeat staging encouraged.",
    );
  }

  const settingLabel =
    event.partyType?.trim() || event.otherPartyType?.trim()
      ? getPartySettingLabel(
          event.partyType,
          event.otherPartyType,
          "",
        ) || event.otherPartyType?.trim()
      : null;
  if (settingLabel) {
    lines.push(
      `Party setting (${settingLabel}): Anchor the illustrated environment — recognizable venue cues (architecture, equipment, props) so the image feels specific and cool, not generic.`,
    );
  }

  if (event.theme?.trim()) {
    lines.push(
      `Parent theme: "${event.theme.trim()}" — drive motifs, era, patterns, and hero styling (world-building, not one throwaway line).`,
    );
  }
  if (event.partyVibe?.trim()) {
    lines.push(
      `Party vibe: "${event.partyVibe.trim()}" — express through lighting, motion, crowd energy hints, food/activity staging in the scene.`,
    );
  }
  if (event.honoreeFavoriteColor?.trim()) {
    lines.push(
      `Honoree favorite color (${event.honoreeFavoriteColor.trim()}): Build the palette and key light around this accent — neon rims, gradients, frames, title glow; intentional color story.`,
    );
  }

  const gender = resolveHonoreeGenderForPrompt(event);
  const genderWord =
    gender === "girl" ? "girl" : gender === "other" ? "child" : "boy";
  const ageDesc = describeHonoreeAgeForCharacter(event);

  if (hasHonoreeReferencePhoto) {
    lines.push(
      `Hero character: A parent reference photo will be supplied in the image step — preserve likeness (face, hair, skin tone). The brief should still describe dynamic celebratory pose, outfit or gear that matches this party theme (${genderWord}), and ${ageDesc} Stage B will align the face to the photo.`,
    );
  } else {
    lines.push(
      `Hero character(s): Feature one focal illustrated honoree (${genderWord}) as the star — ${ageDesc} Aim for premium animated feature-film poster energy: dimensional, appealing, expressive eyes, dynamic action pose with props matching the party setting (skates, jump socks, sports gear, etc. as fits). Optional: one smaller secondary friend or sibling figure in soft focus for depth — honoree stays dominant and centered in hierarchy.`,
    );
  }

  return lines.join("\n");
}

/**
 * Shared event facts and style blocks for Stage A (split into two parallel Gemini calls).
 * @returns {{
 *  promptDetailsJoined: string;
 *  creativeDirectives: string;
 *  mustRenderDetails: string | null;
 *  styleBlock: string;
 *  portraitNote: string;
 * }}
 */
function collectStageAPromptParts(event, hasHonoreeReferencePhoto) {
  const eventTypeLabel = getEventTypeLabel(event);

  const mitzvahFocusLine =
    (event.eventType === "barMitzvah" || event.eventType === "batMitzvah") &&
    (event.mitzvahCelebrationFocus === "party" ||
      event.mitzvahCelebrationFocus === "ceremony")
      ? event.mitzvahCelebrationFocus === "ceremony"
        ? "Celebration focus: religious ceremony (formal / synagogue tone may apply)."
        : "Celebration focus: party / reception (festive social tone)."
      : null;

  const eventCategoryLine =
    event.eventCategory === "formal"
      ? "Event style: formal."
      : event.eventCategory === "party"
        ? "Event style: party."
        : null;

  const partySettingLine =
    event.partyType?.trim() || event.otherPartyType?.trim()
      ? (() => {
          const label = getPartySettingLabel(
            event.partyType,
            event.otherPartyType,
            "",
          );
          return label ? `Party setting: ${label}` : null;
        })()
      : null;

  const foodBits = [];
  if (event.kosherType?.trim()) {
    foodBits.push(`kosher: ${event.kosherType.trim()}`);
  }
  if (event.mealType?.trim()) {
    foodBits.push(`meal: ${event.mealType.trim()}`);
  }
  if (event.chalavYisrael === true) {
    foodBits.push("Chalav Yisrael (dairy)");
  }
  const veg = formatVegetarianType(event.vegetarianType);
  if (veg) {
    foodBits.push(veg);
  }
  const partnerId = event.kosherCateringPartnerId;
  if (partnerId && CATERING_PARTNER_LABELS[partnerId]) {
    foodBits.push(CATERING_PARTNER_LABELS[partnerId]);
  } else if (partnerId?.trim()) {
    foodBits.push(`catering preset: ${partnerId.trim()}`);
  }
  const foodLine =
    foodBits.length > 0
      ? `Food & catering context (subtle background only — do not dominate the visual): ${foodBits.join("; ")}`
      : null;

  const mustRenderDetails =
    !event.optionalDetailsLater
      ? `REQUIRED — on-poster typography for logistics (exact strings from Event facts when not TBD):
• Hero title using the event name; honoree first name in the title treatment when provided.
• Age line when provided.
• Date and Time exactly as under Date / Time.
• Location: venue + street address as under Location.
• Venue arrival notes and Parking as smaller footer lines when present.
• Food & catering / dress code: small discrete footer text when present.
Express Event type, mitzvah focus, event category, party setting, visual theme, and party vibe primarily through CREATIVE VISUAL DIRECTION above (imagery, palette, set design) — do not paste long theme/vibe paragraphs as tiny illegible text. Optional one short subtitle for theme or vibe is OK if highly readable.
Honoree favorite color: show in the art (see CREATIVE VISUAL DIRECTION); printing a hex string is optional.
Describe layout regions. Do not end with only "ample space for event details" for lines that are already provided in facts.`
      : null;

  const promptDetails = [
    `Event Type: ${eventTypeLabel}`,
    event.childName?.trim()
      ? `Honoree first name (for title typography): ${event.childName.trim()}`
      : null,
    `Honoree gender (poster hero character): ${honoreeGenderLabelForFacts(event)}`,
    `Event Name: ${event.eventName || "Celebration"}`,
    event.age ? `Age: Turning ${event.age}` : null,
    mitzvahFocusLine,
    eventCategoryLine,
    event.dressCode?.trim()
      ? `Guest dress code / attire (tone for artwork): ${event.dressCode.trim()}`
      : null,
    `Date: ${formatDate(event.date)}`,
    event.time ? `Time: ${event.time}` : null,
    `Location: ${`${event.address1 || ""}${event.address2 ? ", " + event.address2 : ""}`.trim() || "TBD"}`,
    event.locationNotes?.trim()
      ? `Venue arrival notes: ${event.locationNotes.trim()}`
      : null,
    event.parking?.trim() ? `Parking: ${event.parking.trim()}` : null,
    event.theme?.trim() ? `Visual theme / style: ${event.theme.trim()}` : null,
    partySettingLine,
    event.partyVibe?.trim()
      ? `Party vibe (from parent): ${event.partyVibe.trim()}`
      : null,
    event.honoreeFavoriteColor?.trim()
      ? `Honoree favorite color accent: ${event.honoreeFavoriteColor.trim()}`
      : null,
    foodLine,
    event.optionalDetailsLater === true
      ? "Note: parent opted to finalize some details later — keep the poster clean and factual using the lines above."
      : null,
  ].filter(Boolean);

  const portraitNote = hasHonoreeReferencePhoto
    ? " A parent-supplied reference photo of the honoree will be used in the image step — describe layout and style so a clear, celebratory portrait of this same child can be integrated (face and hair should read recognizably)."
    : "";

  const styleBlock = getPartyDerivedStyleInstructions(event);

  return {
    promptDetailsJoined: promptDetails.join(", "),
    creativeDirectives: buildCreativeVisualDirectives(
      event,
      hasHonoreeReferencePhoto,
    ),
    mustRenderDetails,
    styleBlock,
    portraitNote,
  };
}

/** User prompt for Stage A call 1 — final poster brief (`posterBrief`). */
function buildPromptForPosterBrief(event, hasHonoreeReferencePhoto) {
  const p = collectStageAPromptParts(event, hasHonoreeReferencePhoto);
  return `Write the invitation poster image brief for this event.

Event facts (comma-separated): ${p.promptDetailsJoined}.

CREATIVE VISUAL DIRECTION (make the generated image striking and specific — lead posterBrief with this atmosphere; express through scene, lighting, props, palette, and composition):
${p.creativeDirectives}

${p.mustRenderDetails ? `${p.mustRenderDetails}\n\n` : ""}Visual style to reflect in the brief: ${p.styleBlock}.

Respond with JSON containing only the field posterBrief (plain-text image prompt). See system instructions for formatting.${p.portraitNote}

Keep posterBrief at most ${STAGE_A_MAX_CHARS} characters.`;
}

/** User prompt for Stage A call 2 — logistics-free skeleton brief (`visualTeaser`). */
function buildPromptForVisualTeaser(event, hasHonoreeReferencePhoto) {
  const p = collectStageAPromptParts(event, hasHonoreeReferencePhoto);
  const visualOnlyRules = `OUTPUT — visualTeaser (plain English; compact brief for fast art-first preview — **no invitation lettering in the artwork**):
- Be concise and high-signal: vivid scene, lighting, palette, hero, key composition and style in tight prose (no long lists or filler), often starting with "A".
- REQUIRED: illustrated hero whose look matches Honoree gender from Event facts and age-appropriate proportions; celebratory pose and wardrobe that fit the party setting.${hasHonoreeReferencePhoto ? " A parent reference photo will be used in the image step — describe the focal honoree portrait so face, hair, and skin tone can match that photo." : ""}
- Do NOT instruct readable title text, name lettering, turning-age lines, or any legible words or numbers in the image (typography is added in a separate pipeline step).
- DO NOT include (no copy, no reserved footer bands, no directions): calendar date, clock time, street address, city, venue name as wayfinding, venue arrival or gate notes, parking, kosher/catering/meal/vegetarian/Chalav Yisrael text, guest dress-code fine print.
- The final printed poster (separate pipeline step) adds exact logistics and headline type; this brief is imagery-only.`;

  return `Write the logistics-free invitation poster IMAGE brief for fast preview generation.

Event facts (comma-separated): ${p.promptDetailsJoined}.

CREATIVE VISUAL DIRECTION (match atmosphere, scene, lighting, palette — express through imagery; do not paste logistics as artwork copy):
${p.creativeDirectives}

Visual style to reflect in the brief: ${p.styleBlock}.

${visualOnlyRules}

Respond with JSON containing only the field visualTeaser.${p.portraitNote}

Keep visualTeaser at most ${STAGE_A_VISUAL_TEASER_MAX_CHARS} characters.`;
}

/**
 * Combined Stage-A user text (dry-run / debugging): both parallel Gemini prompts.
 */
function buildPromptForPrompt(event, hasHonoreeReferencePhoto) {
  return `=== STAGE A — posterBrief (Gemini parallel call 1) ===

${buildPromptForPosterBrief(event, hasHonoreeReferencePhoto)}

=== STAGE A — visualTeaser (Gemini parallel call 2) ===

${buildPromptForVisualTeaser(event, hasHonoreeReferencePhoto)}`;
}

/**
 * Duck-type OpenAI image stream partials — tolerates SDK/API event naming drift.
 * @param {object} event
 */
function isOpenAiImageStreamPartialEvent(event) {
  if (!event || typeof event !== "object") return false;
  if (typeof event.b64_json !== "string" || event.b64_json.length === 0)
    return false;
  if (typeof event.partial_image_index !== "number") return false;
  const t = event.type;
  if (typeof t === "string" && t.toLowerCase().includes("completed"))
    return false;
  return true;
}

/**
 * Final image from OpenAI image stream (`*.completed`).
 * @param {object} event
 */
function isOpenAiImageStreamCompletedEvent(event) {
  if (!event || typeof event !== "object") return false;
  if (typeof event.b64_json !== "string" || event.b64_json.length === 0)
    return false;
  if (isOpenAiImageStreamPartialEvent(event)) return false;
  const t = event.type;
  if (typeof t !== "string") return false;
  return (
    t === "image_generation.completed" ||
    t === "image_edit.completed" ||
    /\.completed$/i.test(t)
  );
}

/**
 * Stage A — Gemini call 1: `posterBrief` for the final image pipeline.
 * @param {import("@google/generative-ai").GoogleGenerativeAI} genAI
 * @param {string} userPrompt
 * @returns {Promise<string|null>}
 */
async function runGeminiStageAPosterBrief(genAI, userPrompt) {
  const model = genAI.getGenerativeModel({
    model: STAGE_A_MODEL,
    systemInstruction: STAGE_A_SYSTEM_POSTER_BRIEF,
  });
  try {
    let result;
    try {
      result = await model.generateContent({
        contents: [
          { role: "user", parts: [{ text: userPrompt }] },
          { role: "model", parts: [{ text: "{" }] },
        ],
        generationConfig: {
          maxOutputTokens: STAGE_A_JSON_MAX_OUTPUT_TOKENS,
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              posterBrief: {
                type: SchemaType.STRING,
                description:
                  "Plain-text invitation poster image prompt only; no markdown or preamble.",
              },
            },
            required: ["posterBrief"],
          },
          stopSequences: STAGE_A_STOP_SEQUENCES.slice(
            0,
            GEMINI_MAX_STOP_SEQUENCES,
          ),
        },
      });
    } catch (jsonErr) {
      console.warn(
        `[AIService] Stage A posterBrief JSON: ${jsonErr.message} — retry plain text.`,
      );
      result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          maxOutputTokens: STAGE_A_MAX_OUTPUT_TOKENS,
          stopSequences: STAGE_A_STOP_SEQUENCES.slice(
            0,
            GEMINI_MAX_STOP_SEQUENCES,
          ),
        },
      });
    }

    const rawText = result.response?.text?.()?.trim();
    if (!rawText) return null;
    const stitched = stitchStageAJsonText(rawText);
    const fromJson = parsePosterBriefJsonPayload(stitched);
    let cleaned = fromJson
      ? sanitizeStageATextOutput(fromJson) || fromJson.trim()
      : sanitizeStageATextOutput(stitched);
    if (!cleaned || cleaned.length < 15) {
      cleaned = stitched.replace(/\s+/g, " ");
    }
    if (!cleaned || cleaned.length < 15) return null;
    let out = cleaned;
    if (out.length > STAGE_A_MAX_CHARS) {
      out = out.slice(0, STAGE_A_MAX_CHARS).trimEnd();
    }
    return out;
  } catch (err) {
    console.warn(
      `[AIService] Stage A posterBrief (${STAGE_A_MODEL}) failed: ${err.message}`,
    );
    return null;
  }
}

/**
 * Stage A — Gemini call 2: `visualTeaser` for skeleton / preview (parallel with posterBrief).
 * @param {import("@google/generative-ai").GoogleGenerativeAI} genAI
 * @param {string} userPrompt
 * @returns {Promise<string|null>}
 */
async function runGeminiStageAVisualTeaser(genAI, userPrompt) {
  const model = genAI.getGenerativeModel({
    model: STAGE_A_MODEL,
    systemInstruction: STAGE_A_SYSTEM_VISUAL_TEASER,
  });
  try {
    let result;
    try {
      result = await model.generateContent({
        contents: [
          { role: "user", parts: [{ text: userPrompt }] },
          { role: "model", parts: [{ text: "{" }] },
        ],
        generationConfig: {
          maxOutputTokens: STAGE_A_VISUAL_TEASER_JSON_MAX_OUTPUT_TOKENS,
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              visualTeaser: {
                type: SchemaType.STRING,
                description:
                  "Concise plain-text poster image brief without logistics; hero title, age, gender-matched hero; stay within user character limit.",
              },
            },
            required: ["visualTeaser"],
          },
          stopSequences: STAGE_A_STOP_SEQUENCES.slice(
            0,
            GEMINI_MAX_STOP_SEQUENCES,
          ),
        },
      });
    } catch (jsonErr) {
      console.warn(
        `[AIService] Stage A visualTeaser JSON: ${jsonErr.message} — retry plain text.`,
      );
      result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          maxOutputTokens: STAGE_A_VISUAL_TEASER_JSON_MAX_OUTPUT_TOKENS,
          stopSequences: STAGE_A_STOP_SEQUENCES.slice(
            0,
            GEMINI_MAX_STOP_SEQUENCES,
          ),
        },
      });
    }

    const rawText = result.response?.text?.()?.trim();
    if (!rawText) return null;
    const stitched = stitchStageAJsonText(rawText);
    const fromJson = parseVisualTeaserOnlyJsonPayload(stitched);
    if (fromJson) return fromJson;
    const sanitized = sanitizeVisualTeaserBrief(stitched);
    return sanitized.length >= 40 ? sanitized : null;
  } catch (err) {
    console.warn(
      `[AIService] Stage A visualTeaser (${STAGE_A_MODEL}) failed: ${err.message}`,
    );
    return null;
  }
}

/**
 * Run Stage A Gemini pair (poster brief + visual teaser) without touching Firestore.
 * For integration tests / Vertex-only image probes.
 *
 * @param {import("@google/generative-ai").GoogleGenerativeAI} genAI
 * @param {object} event
 * @param {boolean} hasHonoreeRef
 * @returns {Promise<{ imagePrompt: string, visualTeaserPatch: string }>}
 */
async function runPosterStageAParallelForTest(genAI, event, hasHonoreeRef) {
  const posterBriefPrompt = buildPromptForPosterBrief(event, hasHonoreeRef);
  const visualTeaserPrompt = buildPromptForVisualTeaser(event, hasHonoreeRef);
  const [briefResult, teaserResult] = await Promise.all([
    runGeminiStageAPosterBrief(genAI, posterBriefPrompt),
    runGeminiStageAVisualTeaser(genAI, visualTeaserPrompt),
  ]);
  const imagePrompt = briefResult;
  if (!imagePrompt || typeof imagePrompt !== "string" || imagePrompt.trim().length < 15) {
    throw new Error("Stage A posterBrief failed or too short");
  }
  const visualTeaserPatch =
    teaserResult && teaserResult.length >= 40
      ? teaserResult
      : fallbackVisualTeaserFromEvent(event, hasHonoreeRef);
  return { imagePrompt: imagePrompt.trim(), visualTeaserPatch };
}

/** User prompt for the Stage B cool-title call (short invitation headline). */
function buildPromptForCoolTitle(event, imagePrompt) {
  const eventTypeLabel = getEventTypeLabel(event);
  const name = event.childName?.trim() || "";
  const age = event.age != null ? String(event.age).trim() : "";
  const theme = event.theme?.trim() || "";
  const vibe = event.partyVibe?.trim() || "";
  const settingLabel =
    event.partyType?.trim() || event.otherPartyType?.trim()
      ? getPartySettingLabel(event.partyType, event.otherPartyType, "") ||
        event.otherPartyType?.trim() ||
        ""
      : "";

  /** Seed the headline with the vibe from the existing poster brief so it stays on-theme. */
  const briefSeed =
    typeof imagePrompt === "string" && imagePrompt.trim().length > 0
      ? imagePrompt.trim().slice(0, 400)
      : "";

  const facts = [
    `Occasion: ${eventTypeLabel}`,
    name ? `Honoree first name: ${name}` : null,
    age ? `Turning age: ${age}` : null,
    settingLabel ? `Party setting: ${settingLabel}` : null,
    theme ? `Theme: ${theme}` : null,
    vibe ? `Vibe: ${vibe}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `Write one short, catchy invitation headline (the hero title that goes ON the poster).

Event facts:
${facts}

${briefSeed ? `Poster brief vibe (for tone reference, do not echo verbatim):\n${briefSeed}\n\n` : ""}Rules:
- Plain text only, no quotes, no emojis, no markdown.
- One phrase, ideally 2–6 words; never include the date, time, or address.
- Capture the celebration energy — playful for birthdays, milestone-celebratory for mitzvahs.
- Stay within ${COOL_TITLE_MAX_CHARS} characters.

Respond with JSON containing only the field posterTitle.`;
}

/**
 * Reject Gemini meta-chatter mistaken for a headline (common when JSON mode misfires).
 * @param {string} s
 * @returns {boolean}
 */
function isPlausiblePosterTitle(s) {
  if (!s || typeof s !== "string") return false;
  const t = s.trim();
  if (t.length < 3 || t.length > COOL_TITLE_MAX_CHARS + 5) return false;
  const lower = t.toLowerCase();
  if (/\bhere is\b|\bhere are\b/.test(lower)) return false;
  if (/\bjson\b/.test(lower) && /\b(request|response|format|object)\b/.test(lower))
    return false;
  if (/^[`'"]?\{/.test(t)) return false;
  return true;
}

/**
 * Stage B — Gemini call: short catchy invitation headline (`aiPosterTitle`).
 * @param {import("@google/generative-ai").GoogleGenerativeAI} genAI
 * @param {string} userPrompt
 * @returns {Promise<string|null>}
 */
async function runGeminiPosterCoolTitle(genAI, userPrompt) {
  const model = genAI.getGenerativeModel({
    model: STAGE_A_MODEL,
    systemInstruction: STAGE_B_SYSTEM_COOL_TITLE,
  });
  try {
    let result;
    try {
      result = await model.generateContent({
        contents: [
          { role: "user", parts: [{ text: userPrompt }] },
          { role: "model", parts: [{ text: "{" }] },
        ],
        generationConfig: {
          maxOutputTokens: COOL_TITLE_JSON_MAX_OUTPUT_TOKENS,
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              posterTitle: {
                type: SchemaType.STRING,
                description:
                  "Short catchy invitation headline; plain text; within character limit.",
              },
            },
            required: ["posterTitle"],
          },
          stopSequences: STAGE_A_STOP_SEQUENCES.slice(
            0,
            GEMINI_MAX_STOP_SEQUENCES,
          ),
        },
      });
    } catch (jsonErr) {
      console.warn(
        `[AIService] Stage B coolTitle JSON: ${jsonErr.message} — retry structured JSON without prefill.`,
      );
      result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          maxOutputTokens: COOL_TITLE_JSON_MAX_OUTPUT_TOKENS,
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              posterTitle: {
                type: SchemaType.STRING,
                description:
                  "Short catchy invitation headline; plain text; within character limit.",
              },
            },
            required: ["posterTitle"],
          },
          stopSequences: STAGE_A_STOP_SEQUENCES.slice(
            0,
            GEMINI_MAX_STOP_SEQUENCES,
          ),
        },
      });
    }

    const rawText = result.response?.text?.()?.trim();
    if (!rawText) return null;
    const stitched = stitchStageAJsonText(rawText);
    let title = null;
    try {
      const o = JSON.parse(stitched);
      if (o && typeof o.posterTitle === "string" && o.posterTitle.trim()) {
        title = o.posterTitle.trim();
      }
    } catch {
      title = stitched
        .replace(/^[{}\s"]+|[{}\s"]+$/g, "")
        .replace(/^posterTitle\s*:\s*/i, "")
        .replace(/^"|"$/g, "")
        .trim();
    }
    if (!title) return null;
    title = title.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
    if (title.length > COOL_TITLE_MAX_CHARS) {
      title = title.slice(0, COOL_TITLE_MAX_CHARS).trimEnd();
    }
    if (!isPlausiblePosterTitle(title)) {
      console.warn(
        `[AIService] Stage B coolTitle rejected implausible title: ${JSON.stringify(title)}`,
      );
      return null;
    }
    return title.length > 0 ? title : null;
  } catch (err) {
    console.warn(
      `[AIService] Stage B coolTitle (${STAGE_A_MODEL}) failed: ${err.message}`,
    );
    return null;
  }
}

/**
 * @param {object} [options]
 * @param {string} [options.posterPrompt] When set (non-empty after trim), Stage A is skipped and this text is used as the image brief.
 */
async function generatePoster(eventId, event, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const runStarted = performance.now();
  /** @type {{ honoreeFetchMs?: number, stageAMs?: number, stageAPosterBriefMs?: number, stageAVisualTeaserMs?: number, stageBMs?: number, posterUploadMs?: number, skeletonStageMs?: number, skeletonWithTextStageMs?: number, coolTitleMs?: number, finalStageMs?: number, stageASkipped?: boolean, openAIPartialArrivalMs?: Record<string, number>, openAIPartialDeltaMs?: Record<string, number>, totalMs: number }} */
  const timing = { totalMs: 0 };

  const persistTiming = async () => {
    timing.totalMs = Math.round(performance.now() - runStarted);
    try {
      await eventRepository.setPosterGenerationTiming(eventId, timing);
    } catch (e) {
      console.warn(`[AIService] setPosterGenerationTiming failed: ${e.message}`);
    }
  };

  let honoreeRef = null;
  try {
    const hfStart = performance.now();
    try {
      honoreeRef = await storageRepository.readHonoreePhotoIfExists(eventId);
    } catch (err) {
      console.warn(`[AIService] honoree reference read skipped: ${err.message}`);
    }
    timing.honoreeFetchMs = Math.round(performance.now() - hfStart);

    try {
      await storageRepository.deleteHonoreeFaceReferenceIfExists(eventId);
    } catch (e) {
      console.warn(`[AIService] deleteHonoreeFaceReferenceIfExists: ${e.message}`);
    }

    if (honoreeRef?.buffer?.length) {
      try {
        const honoreeFaceCropService = require("./honoreeFaceCropService");
        if (honoreeFaceCropService.isHonoreeFaceCropEnabled()) {
          const tCrop = performance.now();
          const faceBuf = await honoreeFaceCropService.extractFaceReferencePng(
            honoreeRef.buffer,
            honoreeRef.mimeType,
          );
          if (faceBuf && faceBuf.length) {
            honoreeRef = { buffer: faceBuf, mimeType: "image/png" };
            const honoreeFaceCropUrl = await storageRepository.saveHonoreeFaceReference(
              eventId,
              faceBuf,
            );
            try {
              await eventRepository.updateHonoreeFaceCropUrl(
                eventId,
                honoreeFaceCropUrl,
              );
            } catch (e) {
              console.warn(`[AIService] updateHonoreeFaceCropUrl failed: ${e.message}`);
            }
            console.log(
              `[AIService] honoree face reference OK bytes=${faceBuf.length} cropMs=${Math.round(performance.now() - tCrop)} url=${honoreeFaceCropUrl}`,
            );
          }
        }
      } catch (e) {
        console.warn(`[AIService] honoree face crop skipped: ${e.message}`);
      }
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const provided =
      typeof options.posterPrompt === "string"
        ? options.posterPrompt.trim()
        : "";

    let imagePrompt = null;
    /** @type {string|undefined} When set, written on first `updatePoster`; omit when Stage A skipped. */
    let visualTeaserPatch = undefined;

    const vertexImagen = require("./vertexImagenService");
    const togetherFlux = require("./togetherFluxService");
    const skModel = vertexImagen.resolveVertexImagenSkeletonModelId();
    const skeletonTogetherModelId = togetherFlux.DEFAULT_SKELETON_TOGETHER_MODEL;
    const finModel = vertexImagen.resolveVertexImagenFinalModelId();

    const buildImagenPrompt = () => {
      let p = FINAL_POSTER_TYPOGRAPHY_PREFIX + imagePrompt;
      if (honoreeRef) {
        p +=
          "\n\nFACE-ONLY REFERENCE (IMAGE INPUT): The API receives a **cropped face** derived from the uploaded honoree photo (Vision/heuristic crop). Preserve likeness—face shape, hair, skin tone, and age-appropriate appearance—for the focal illustrated portrait. Integrate into the full invitation poster layout, typography, lighting, and scene described above (do not output the raw snapshot as the entire poster).";
      }
      return p;
    };

    const buildSkeletonNoTextImagenPrompt = () =>
      buildSkeletonNoTextImagenPromptBody(
        event,
        Boolean(honoreeRef),
        visualTeaserPatch,
      );

    const buildSkeletonWithTextImagenPrompt = () =>
      buildSkeletonWithTextImagenPromptBody(Boolean(honoreeRef), imagePrompt);

    try {
      await eventRepository.clearSkeletonPoster(eventId);
    } catch (e) {
      console.warn(`[AIService] clearSkeletonPoster: ${e.message}`);
    }
    try {
      await eventRepository.clearPosterStreamingPreview(eventId);
    } catch (e) {
      console.warn(`[AIService] clearPosterStreamingPreview: ${e.message}`);
    }

    const skipSkeleton = process.env.POSTER_SKELETON_PREVIEW === "0";
    const finalProvider = (
      process.env.POSTER_FINAL_PROVIDER || "openai"
    )
      .trim()
      .toLowerCase();
    const previewUpdateMode = (
      process.env.POSTER_STREAM_PREVIEW_UPDATES || "minimal"
    )
      .trim()
      .toLowerCase();

    /**
     * Generate one FLUX preview (Together FLUX.2-dev, Vertex Imagen fallback) for the given prompt
     * and persist it via `persistUrl`. Used by both Stage B preview branches (`no-text` / `with-text`).
     *
     * @param {object} args
     * @param {"noText"|"withText"} args.mode tagging only — affects log label and which prompt builder runs
     * @param {() => string} args.buildPrompt returns the FLUX prompt text
     * @param {(url: string, opts: { durationMs: number, steps: number }) => Promise<void>} args.persistUrl
     * @returns {Promise<{ url?: string, ok: boolean, ms: number, skipped?: boolean }>}
     */
    const runFluxPreview = async ({ mode, buildPrompt, persistUrl }) => {
      if (skipSkeleton) {
        return { ok: true, ms: 0, skipped: true };
      }
      const t0 = performance.now();
      const skeletonPrompt = buildPrompt();

      const honoreeReferenceUrls = [];
      if (honoreeRef) {
        try {
          const signed = await storageRepository.getHonoreeReferenceSignedReadUrl(
            eventId,
          );
          if (signed) honoreeReferenceUrls.push(signed);
        } catch (e) {
          console.warn(
            `[AIService] ${mode} preview honoree signed URL failed: ${e.message}`,
          );
        }
      }

      const skeletonSteps = togetherFlux.resolveTogetherSkeletonFluxSteps();

      const tSingleGen = performance.now();
      let source = "none";
      let buf = null;
      try {
        buf = await togetherFlux.generatePosterBufferWithTogetherFlux(
          skeletonPrompt,
          {
            skeletonStage: true,
            honoreeReferenceUrls,
            steps: skeletonSteps,
          },
        );
      } catch (e) {
        console.warn(
          `[AIService] ${mode} Together FLUX failed: ${e?.message || e}`,
        );
      }
      let singleGenMs = Math.round(performance.now() - tSingleGen);
      if (buf && buf.length > 0) {
        source = "together";
      }
      if (!buf || buf.length === 0) {
        const vStart = performance.now();
        try {
          buf = await vertexImagen.generatePosterBufferWithVertexImagen(
            skeletonPrompt,
            { vertexModelId: skModel },
          );
        } catch (e) {
          console.warn(
            `[AIService] ${mode} Vertex Imagen fallback failed: ${e?.message || e}`,
          );
        }
        singleGenMs = Math.round(performance.now() - vStart);
        if (buf && buf.length > 0) source = "vertex";
      }

      const ms = Math.round(performance.now() - t0);
      if (!buf || buf.length === 0) {
        console.warn(
          `[AIService] Stage B ${mode} preview no image (Together ${skeletonTogetherModelId} → Vertex ${skModel})`,
        );
        return { ok: false, ms };
      }
      const url = await storageRepository.saveSkeletonPoster(
        eventId,
        buf,
        "image/png",
      );
      const usedSteps = source === "together" ? skeletonSteps : 0;
      try {
        await persistUrl(url, { durationMs: singleGenMs, steps: usedSteps });
      } catch (e) {
        console.warn(
          `[AIService] ${mode} persist preview URL failed: ${e?.message || e}`,
        );
      }
      console.log(
        `[AIService] Stage B ${mode} preview OK wallMs=${ms} genMs=${singleGenMs} source=${source} together=${skeletonTogetherModelId} vertexFallback=${skModel}`,
      );
      return { ok: true, url, ms };
    };

    /** @returns {Promise<{ url?: string, ok: boolean, ms: number, skipped?: boolean }>} */
    const runFluxNoText = () =>
      runFluxPreview({
        mode: "noText",
        buildPrompt: buildSkeletonNoTextImagenPrompt,
        persistUrl: async (url, { durationMs, steps }) => {
          await eventRepository.updateSkeletonPoster(eventId, url, {
            skeletonProgress: [{ steps, url, durationMs }],
          });
        },
      });

    /** @returns {Promise<{ url?: string, ok: boolean, ms: number, skipped?: boolean }>} */
    const runFluxWithText = () =>
      runFluxPreview({
        mode: "withText",
        buildPrompt: buildSkeletonWithTextImagenPrompt,
        persistUrl: async (url) => {
          await eventRepository.updateSkeletonPosterWithText(eventId, url);
        },
      });

    /** @returns {Promise<{ title?: string, ok: boolean, ms: number }>} */
    const runCoolTitle = async () => {
      const t0 = performance.now();
      try {
        const title = await runGeminiPosterCoolTitle(
          genAI,
          buildPromptForCoolTitle(event, imagePrompt),
        );
        const ms = Math.round(performance.now() - t0);
        if (!title) return { ok: false, ms };
        try {
          await eventRepository.updateAiPosterTitle(eventId, title);
        } catch (e) {
          console.warn(
            `[AIService] updateAiPosterTitle failed: ${e?.message || e}`,
          );
        }
        console.log(
          `[AIService] Stage B coolTitle OK (${ms}ms): "${title}"`,
        );
        return { ok: true, title, ms };
      } catch (e) {
        console.warn(`[AIService] Stage B coolTitle error: ${e?.message || e}`);
        return { ok: false, ms: Math.round(performance.now() - t0) };
      }
    };

    /** @returns {Promise<{ url?: string, ok: boolean, ms: number }>} */
    const runFinal = async () => {
      const t0 = performance.now();
      const openAIImageService = require("./openAIImageService");
      const partialCap = openAIImageService.resolvePartialImagesCount();

      if (finalProvider === "vertex") {
        let buf = null;
        if (honoreeRef) {
          try {
            const signed = await storageRepository.getHonoreeReferenceSignedReadUrl(
              eventId,
            );
            if (signed) {
              buf = await togetherFlux.generatePosterBufferWithTogetherFlux(
                buildImagenPrompt(),
                { honoreeReferenceUrls: [signed] },
              );
            }
          } catch (te) {
            console.warn(
              `[AIService] final Together (honoree) skipped: ${te.message}`,
            );
          }
        }
        if (!buf || buf.length === 0) {
          buf = await vertexImagen.generatePosterBufferWithVertexImagen(
            buildImagenPrompt(),
            { vertexModelId: finModel },
          );
        }
        const ms = Math.round(performance.now() - t0);
        if (!buf || buf.length === 0) {
          console.warn(`[AIService] Stage B final (${finModel}) no image`);
          return { ok: false, ms };
        }
        const uploadStart = performance.now();
        const url = await storageRepository.savePoster(
          eventId,
          buf,
          "image/png",
        );
        timing.posterUploadMs = Math.round(performance.now() - uploadStart);
        await eventRepository.updatePoster(eventId, imagePrompt, url);
        console.log(`[AIService] Stage B final (Vertex ${finModel}) OK`);
        return { ok: true, url, ms };
      }

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey || !String(apiKey).trim()) {
        console.warn("[AIService] Stage B final: OPENAI_API_KEY missing");
        return { ok: false, ms: Math.round(performance.now() - t0) };
      }

      let finalBuffer = null;
      /** @type {Record<string, number>} ms from OpenAI stream start when each partial_image arrived */
      const openAIPartialArrivalMs = {};
      /** @type {Record<string, number>} ms since previous partial (or stream start for first) */
      const openAIPartialDeltaMs = {};
      try {
        const streamStart = performance.now();
        const stream = await openAIImageService.createFinalPosterStream(
          buildImagenPrompt(),
          honoreeRef
            ? {
                honoreeReference: {
                  buffer: honoreeRef.buffer,
                  mimeType: honoreeRef.mimeType,
                },
              }
            : {},
        );
        let lastPartialClock = streamStart;
        let unhandledStreamLogged = 0;
        for await (const event of stream) {
          const isPartial = isOpenAiImageStreamPartialEvent(event);
          const isCompleted = isOpenAiImageStreamCompletedEvent(event);
          if (isPartial) {
            const idx = event.partial_image_index;
            const now = performance.now();
            const elapsed = Math.round(now - streamStart);
            const delta = Math.round(now - lastPartialClock);
            lastPartialClock = now;
            openAIPartialArrivalMs[String(idx)] = elapsed;
            openAIPartialDeltaMs[String(idx)] = delta;
            console.log(
              `[AIService] OpenAI Partial${idx + 1}: elapsedSinceStreamStart=${elapsed}ms intervalSincePrev=${delta}ms (partial_image_index=${idx})`,
            );

            const publishPartial =
              previewUpdateMode === "all" ||
              (partialCap > 0 && idx === partialCap - 1);
            if (!publishPartial) continue;
            try {
              const pbuf = Buffer.from(event.b64_json, "base64");
              const previewUrl =
                await storageRepository.savePosterStreamingPreview(
                  eventId,
                  pbuf,
                  idx,
                  "image/png",
                );
              await eventRepository.updatePosterStreamingPreview(
                eventId,
                previewUrl,
              );
            } catch (pe) {
              console.warn(
                `[AIService] streaming preview upload skipped: ${pe.message}`,
              );
            }
          } else if (isCompleted) {
            finalBuffer = Buffer.from(event.b64_json, "base64");
          } else if (
            unhandledStreamLogged < 2 &&
            process.env.POSTER_DEBUG_OPENAI_STREAM === "1"
          ) {
            unhandledStreamLogged += 1;
            console.log(
              `[AIService] OpenAI stream sample unhandled: type=${JSON.stringify(event?.type)} keys=${Object.keys(event || {}).slice(0, 12).join(",")}`,
            );
          }
        }
        if (Object.keys(openAIPartialArrivalMs).length > 0) {
          timing.openAIPartialArrivalMs = openAIPartialArrivalMs;
          timing.openAIPartialDeltaMs = openAIPartialDeltaMs;
        }
        const nPartials = Object.keys(openAIPartialArrivalMs).length;
        if (partialCap > 0 && nPartials < partialCap) {
          console.log(
            `[AIService] OpenAI partial_image events: ${nPartials} received, up to ${partialCap} requested (partial_images=3). Fewer is normal when the API completes the final image before emitting more partials.`,
          );
        }
      } catch (err) {
        console.warn(`[AIService] OpenAI final stream failed: ${err.message}`);
        return { ok: false, ms: Math.round(performance.now() - t0) };
      }

      const msGen = Math.round(performance.now() - t0);
      if (!finalBuffer || finalBuffer.length === 0) {
        console.warn("[AIService] Stage B final (OpenAI): no completed image");
        return { ok: false, ms: msGen };
      }

      const uploadStart = performance.now();
      let url;
      try {
        url = await storageRepository.savePoster(
          eventId,
          finalBuffer,
          "image/png",
        );
        timing.posterUploadMs = Math.round(performance.now() - uploadStart);
        await eventRepository.updatePoster(eventId, imagePrompt, url);
      } catch (upErr) {
        console.warn(`[AIService] final poster upload/update: ${upErr.message}`);
        return { ok: false, ms: msGen };
      }

      try {
        await eventRepository.clearPosterStreamingPreview(eventId);
      } catch (ce) {
        console.warn(`[AIService] clearPosterStreamingPreview: ${ce.message}`);
      }

      console.log(
        `[AIService] Stage B final (OpenAI ${openAIImageService.resolveImageModel()}${honoreeRef ? ", honoree images.edit" : ""}) OK`,
      );
      return { ok: true, url, ms: msGen };
    };



    if (provided.length > 0) {
      if (provided.length < 10) {
        throw new Error("posterPrompt must be at least 10 characters.");
      }
      imagePrompt = provided.slice(0, PROVIDED_PROMPT_MAX_CHARS);
      timing.stageASkipped = true;
    } else {
      const posterBriefPrompt = buildPromptForPosterBrief(
        event,
        Boolean(honoreeRef),
      );
      const visualTeaserPrompt = buildPromptForVisualTeaser(
        event,
        Boolean(honoreeRef),
      );

      const stageAStart = performance.now();
      const [briefResult, teaserResult] = await Promise.all([
        runGeminiStageAPosterBrief(genAI, posterBriefPrompt).then((t) => {
          timing.stageAPosterBriefMs = Math.round(
            performance.now() - stageAStart,
          );
          return t;
        }),
        runGeminiStageAVisualTeaser(genAI, visualTeaserPrompt).then((t) => {
          timing.stageAVisualTeaserMs = Math.round(
            performance.now() - stageAStart,
          );
          return t;
        }),
      ]);

      imagePrompt = briefResult;
      visualTeaserPatch =
        teaserResult && teaserResult.length >= 40
          ? teaserResult
          : fallbackVisualTeaserFromEvent(event, Boolean(honoreeRef));
      timing.stageAMs = Math.round(performance.now() - stageAStart);

      console.log(
        `[AIService] Stage A parallel ready: posterBrief=${timing.stageAPosterBriefMs}ms visualTeaser=${timing.stageAVisualTeaserMs}ms wall≈${timing.stageAMs}ms`,
      );
    }

    if (!imagePrompt) throw new Error("Prompt generation failed.");
    await eventRepository.updatePoster(eventId, imagePrompt, null, visualTeaserPatch);

    let posterUrl = null;
    let skeletonPosterUrl;
    let skeletonPosterWithTextUrl;
    let aiPosterTitle;
    const stageBStart = performance.now();

    console.log(
      `[AIService] Stage B 4-way parallel: coolTitle=gemini:${STAGE_A_MODEL} fluxNoText/fluxWithText=together:${skeletonTogetherModelId}|vertex:${skModel} final=${finalProvider === "vertex" ? finModel : `openai:${process.env.OPENAI_IMAGE_MODEL || "gpt-image-2"}`} skipSkeleton=${skipSkeleton}`,
    );

    const [titleSettled, fluxNoTextSettled, fluxWithTextSettled, finSettled] =
      await Promise.allSettled([
        runCoolTitle(),
        runFluxNoText(),
        runFluxWithText(),
        runFinal(),
      ]);

    if (titleSettled.status === "fulfilled") {
      const v = titleSettled.value;
      if (v && v.title) aiPosterTitle = v.title;
      if (v && v.ms != null) timing.coolTitleMs = v.ms;
    } else {
      console.warn(
        `[AIService] coolTitle pipeline error: ${titleSettled.reason?.message || titleSettled.reason}`,
      );
    }

    if (fluxNoTextSettled.status === "fulfilled") {
      const v = fluxNoTextSettled.value;
      if (v && v.url) skeletonPosterUrl = v.url;
      if (v && v.ms != null && !v.skipped) timing.skeletonStageMs = v.ms;
    } else {
      console.warn(
        `[AIService] flux no-text pipeline error: ${fluxNoTextSettled.reason?.message || fluxNoTextSettled.reason}`,
      );
    }

    if (fluxWithTextSettled.status === "fulfilled") {
      const v = fluxWithTextSettled.value;
      if (v && v.url) skeletonPosterWithTextUrl = v.url;
      if (v && v.ms != null && !v.skipped) timing.skeletonWithTextStageMs = v.ms;
    } else {
      console.warn(
        `[AIService] flux with-text pipeline error: ${fluxWithTextSettled.reason?.message || fluxWithTextSettled.reason}`,
      );
    }

    if (finSettled.status === "fulfilled") {
      const v = finSettled.value;
      if (v && v.ok && v.url) posterUrl = v.url;
      if (v && v.ms != null) timing.finalStageMs = v.ms;
    } else {
      console.warn(
        `[AIService] final pipeline error: ${finSettled.reason?.message || finSettled.reason}`,
      );
    }

    timing.stageBMs = Math.round(performance.now() - stageBStart);

    const out = {
      posterPrompt: imagePrompt,
      posterUrl: posterUrl || undefined,
      skeletonPosterUrl: skeletonPosterUrl || undefined,
      skeletonPosterWithTextUrl: skeletonPosterWithTextUrl || undefined,
      aiPosterTitle: aiPosterTitle || undefined,
    };
    if (typeof visualTeaserPatch === "string" && visualTeaserPatch.length > 0) {
      out.visualTeaser = visualTeaserPatch;
    }
    await persistTiming();
    return out;
  } catch (err) {
    await persistTiming();
    throw err;
  }
}

module.exports = {
  generatePoster,
  buildPromptForPrompt,
  formatDate,
  sanitizeStageATextOutput,
  sanitizeVisualTeaserBrief,
  sanitizeVisualTeaser: sanitizeVisualTeaserBrief,
  parseStageAJsonPayload,
  getEventTypeLabel,
  buildCreativeVisualDirectives,
  resolveHonoreeGenderForPrompt,
  describeHonoreeAgeForCharacter,
  buildSkeletonNoTextImagenPromptBody,
  buildSkeletonWithTextImagenPromptBody,
  runPosterStageAParallelForTest,
};
