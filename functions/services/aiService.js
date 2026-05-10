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

/** visualTeaser: same order of magnitude as posterBrief but omits logistics (see system instruction). */
const STAGE_A_VISUAL_TEASER_MAX_CHARS = 2000;

/** Extra headroom when Stage A returns JSON with two long string fields. */
const STAGE_A_JSON_MAX_OUTPUT_TOKENS = 4000;

/**
 * @see https://ai.google.dev/gemini-api/docs/system-instructions
 * Kept separate from the user turn (event facts) so the model follows output shape reliably.
 */
const STAGE_A_SYSTEM_INSTRUCTION = `You help create invitation poster image prompts.
You must follow the user message and the response format requested in the same turn.
The poster text must be plain English only: no markdown, no # headings, no **bold**, no code fences, no title like "The Prompt", and no intros (e.g. "Here is", "designed for Midjourney", tool names). Start the brief with the actual scene (often the word "A").
Open posterBrief with vivid atmosphere and setting driven by CREATIVE VISUAL DIRECTION (occasion type, mitzvah tone if applicable, party setting, theme, vibe, honoree color story, age- and gender-appropriate hero character) plus the party-derived Visual style paragraph — then lay out logistics text (dates, address, etc.) as instructed.
When the user message includes REQUIRED — on-poster typography rules, obey them for factual logistics lines (exact date, time, address where applicable). Theme, vibe, and party setting must still read strongly through imagery and color — optional short taglines only if they stay readable.
visualTeaser is a second full plain-text invitation poster image brief, as long and vivid as posterBrief (similar depth: scene, lighting, palette, composition, style, layout regions). It must NOT ask for or reserve on-poster text for: calendar date, clock time, street address, city, venue as a directions block, venue arrival or gate notes, parking, kosher/catering/meal/vegetarian/chalav lines, or guest dress-code footers. It MUST require large readable hero title typography that includes the honoree first name when provided, a clear turning-age line when age is known, and a hero character whose look matches honoree gender and age. When the user turn says a parent reference photo will be used in the image step, describe the hero portrait so likeness (face, hair, skin tone) can match that photo. Start visualTeaser with the actual scene the same way as posterBrief (often the word "A").`;

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
      `On-poster hero title typography must prominently feature the honoree first name ${name}.`,
    );
  }
  if (event.age != null && String(event.age).trim() !== "") {
    chunks.push(
      `Include a clear readable turning-age line on the poster (turning ${String(event.age).trim()}).`,
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

function buildPromptForPrompt(event, hasHonoreeReferencePhoto) {
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

  const visualTeaserRules = `VISUAL_TEASER (second JSON field — plain English image brief):
- Match posterBrief in richness: vivid scene, lighting, props, palette, composition, and layout — same voice, often starting with "A".
- REQUIRED on-poster content: large readable hero title that includes the honoree first name when provided; a clear turning-age line when age is provided; illustrated hero whose look matches Honoree gender from Event facts and the age line.${hasHonoreeReferencePhoto ? " A parent reference photo will be used in the image step — describe the focal honoree portrait so face, hair, and skin tone can match that photo." : ""}
- DO NOT include (no copy, no reserved footer bands, no directions): calendar date, clock time, street address, city, venue name as wayfinding, venue arrival or gate notes, parking, kosher/catering/meal/vegetarian/Chalav Yisrael text, guest dress-code fine print.
- posterBrief must still satisfy every REQUIRED logistics typography rule below when applicable; visualTeaser is the logistics-free parallel used for fast preview imagery.`;

  return `Write the invitation poster image brief for this event.

Event facts (comma-separated): ${promptDetails.join(", ")}.

CREATIVE VISUAL DIRECTION (make the generated image striking and specific — lead posterBrief with this atmosphere; express through scene, lighting, props, palette, and composition):
${buildCreativeVisualDirectives(event, hasHonoreeReferencePhoto)}

${mustRenderDetails ? `${mustRenderDetails}\n\n` : ""}Visual style to reflect in the brief: ${styleBlock}.

${visualTeaserRules}

Use the JSON response format from this request (single object with posterBrief and visualTeaser). Put the full plain-text image prompt only in posterBrief — see system instructions for formatting. Put the logistics-free parallel brief in visualTeaser.${portraitNote}

Keep posterBrief at most ${STAGE_A_MAX_CHARS} characters. Keep visualTeaser at most ${STAGE_A_VISUAL_TEASER_MAX_CHARS} characters.`;
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

function envTruthyRaw(v, defaultTrue = true) {
  if (v === undefined || v === null || String(v).trim() === "")
    return defaultTrue;
  const s = String(v).trim().toLowerCase();
  return s !== "0" && s !== "false" && s !== "no" && s !== "off";
}

/**
 * Ascending FLUX step counts for skeleton ladder passes (default: six frames,
 * steps 2 → 12 evens). Override with `TOGETHER_SKELETON_STEPS_LADDER` (comma-separated).
 * @param {number} _baseSteps unused for default ladder; kept for API compatibility
 * @returns {number[]}
 */
function resolveTogetherSkeletonStepsLadder(_baseSteps) {
  const raw = process.env.TOGETHER_SKELETON_STEPS_LADDER?.trim();
  if (raw) {
    const parts = raw
      .split(/[,;\s]+/)
      .map((x) => parseInt(String(x).trim(), 10))
      .filter((n) => Number.isFinite(n) && n >= 1);
    const uniq = [...new Set(parts)].sort((a, b) => a - b);
    if (uniq.length >= 1) {
      return uniq;
    }
  }
  /** Default: 2, 4, 6, 8, 10, 12 — six progressive skeleton images */
  return [2, 4, 6, 8, 10, 12];
}

/**
 * @param {object} [options]
 * @param {string} [options.posterPrompt] When set (non-empty after trim), Stage A is skipped and this text is used as the image brief.
 */
async function generatePoster(eventId, event, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const runStarted = performance.now();
  /** @type {{ honoreeFetchMs?: number, stageAMs?: number, stageBMs?: number, posterUploadMs?: number, skeletonStageMs?: number, finalStageMs?: number, stageASkipped?: boolean, openAIPartialArrivalMs?: Record<string, number>, openAIPartialDeltaMs?: Record<string, number>, totalMs: number }} */
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

    const genAI = new GoogleGenerativeAI(apiKey);

    const provided =
      typeof options.posterPrompt === "string"
        ? options.posterPrompt.trim()
        : "";

    let imagePrompt = null;
    /** @type {string|undefined} When set, written on first `updatePoster`; omit when Stage A skipped. */
    let visualTeaserPatch = undefined;

    if (provided.length > 0) {
      if (provided.length < 10) {
        throw new Error("posterPrompt must be at least 10 characters.");
      }
      imagePrompt = provided.slice(0, PROVIDED_PROMPT_MAX_CHARS);
      timing.stageASkipped = true;
    } else {
      const promptForPrompt = buildPromptForPrompt(event, Boolean(honoreeRef));
      const stageAStart = performance.now();
      const stageAContents = [
        { role: "user", parts: [{ text: promptForPrompt }] },
        { role: "model", parts: [{ text: "{" }] },
      ];

      try {
        const model = genAI.getGenerativeModel({
          model: STAGE_A_MODEL,
          systemInstruction: STAGE_A_SYSTEM_INSTRUCTION,
        });

        let result;
        try {
          result = await model.generateContent({
            contents: stageAContents,
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
                  visualTeaser: {
                    type: SchemaType.STRING,
                    description:
                      "Long plain-text poster image brief like posterBrief but omit date, time, address, venue notes, parking, catering, dress footers. Require hero title with honoree first name, turning-age line, gender-matched hero; likeness to reference photo when applicable.",
                  },
                },
                required: ["posterBrief", "visualTeaser"],
              },
              stopSequences: STAGE_A_STOP_SEQUENCES.slice(
                0,
                GEMINI_MAX_STOP_SEQUENCES,
              ),
            },
          });
        } catch (jsonErr) {
          console.warn(
            `[AIService] Stage A JSON: ${jsonErr.message} — retry plain text (no prefill).`,
          );
          result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: promptForPrompt }] }],
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
        if (rawText) {
          const stitched = stitchStageAJsonText(rawText);
          const fromJson = parseStageAJsonPayload(stitched);
          const briefSource = fromJson?.posterBrief ?? null;
          let cleaned = briefSource
            ? sanitizeStageATextOutput(briefSource) || briefSource.trim()
            : sanitizeStageATextOutput(stitched);
          if (!cleaned || cleaned.length < 15) {
            cleaned = stitched.replace(/\s+/g, " ");
          }
          imagePrompt = cleaned;
          if (imagePrompt.length > STAGE_A_MAX_CHARS) {
            imagePrompt = imagePrompt.slice(0, STAGE_A_MAX_CHARS).trimEnd();
          }
          visualTeaserPatch =
            fromJson?.visualTeaser && fromJson.visualTeaser.length >= 40
              ? fromJson.visualTeaser
              : fallbackVisualTeaserFromEvent(event, Boolean(honoreeRef));
        }
      } catch (err) {
        console.warn(`[AIService] Stage A (${STAGE_A_MODEL}) failed: ${err.message}`);
      }

      timing.stageAMs = Math.round(performance.now() - stageAStart);
    }

    if (!imagePrompt) throw new Error("Prompt generation failed.");
    await eventRepository.updatePoster(eventId, imagePrompt, null, visualTeaserPatch);

    let posterUrl = null;
    let skeletonPosterUrl;
    const stageBStart = performance.now();
    const vertexImagen = require("./vertexImagenService");
    const togetherFlux = require("./togetherFluxService");
    const skModel = vertexImagen.resolveVertexImagenSkeletonModelId();
    const skeletonTogetherModelId = togetherFlux.DEFAULT_SKELETON_TOGETHER_MODEL;
    const finModel = vertexImagen.resolveVertexImagenFinalModelId();

    /** Ensures Vertex Imagen’s 4k trim keeps typography guidance at the start of the prompt. */
    const FINAL_POSTER_TYPOGRAPHY_PREFIX =
      "[Poster typography] Spell names and titles exactly as in the brief; large legible letterforms, strong contrast, generous margins. Avoid tiny blocks, warped or mirrored letters, nonsense glyphs, overlapping characters, or misspelled words.\n\n";

    const buildImagenPrompt = () => {
      let p = FINAL_POSTER_TYPOGRAPHY_PREFIX + imagePrompt;
      if (honoreeRef) {
        p +=
          "\n\nREFERENCE PHOTO (IMAGE INPUT): The image API receives the uploaded honoree reference photo. Preserve likeness—face shape, hair, skin tone, and age-appropriate appearance—for the focal illustrated portrait. Integrate into the full invitation poster layout, typography, lighting, and scene described above (do not output the raw snapshot as the entire poster).";
      }
      return p;
    };

    /** Fast skeleton preview: full logistics-free brief (visualTeaser). */
    const buildSkeletonImagenPrompt = () => {
      const teaser =
        typeof visualTeaserPatch === "string" &&
        visualTeaserPatch.trim().length >= 40
          ? visualTeaserPatch.trim()
          : fallbackVisualTeaserFromEvent(event, Boolean(honoreeRef));
      let body = teaser;
      if (
        honoreeRef &&
        !/\breference photo\b/i.test(body) &&
        !/\blikeness\b/i.test(body)
      ) {
        body +=
          "\n\nInclude a prominent, warm portrait of the honoree child consistent with the name and age given.";
      }
      return body.length > 4000 ? body.slice(0, 4000) : body;
    };

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

    /** @returns {Promise<{ url?: string, ok: boolean, ms: number, skipped?: boolean }>} */
    const runSkeleton = async () => {
      if (skipSkeleton) {
        return { ok: true, ms: 0, skipped: true };
      }
      const t0 = performance.now();
      let buf = null;
      let skeletonSource = "none";
      const skeletonPrompt = buildSkeletonImagenPrompt();

      const honoreeReferenceUrls = [];
      if (honoreeRef) {
        try {
          const signed = await storageRepository.getHonoreePhotoSignedReadUrl(
            eventId,
          );
          if (signed) honoreeReferenceUrls.push(signed);
        } catch (e) {
          console.warn(
            `[AIService] skeleton honoree signed URL failed: ${e.message}`,
          );
        }
      }

      const skTogetherModel = togetherFlux.DEFAULT_SKELETON_TOGETHER_MODEL;
      const baseSteps = togetherFlux.resolveTogetherFluxSteps(skTogetherModel);

      const ladderEnabled =
        envTruthyRaw(process.env.TOGETHER_SKELETON_LADDER_ENABLED, true) &&
        togetherFlux.isTogetherFluxEnabled() &&
        Boolean(togetherFlux.getTogetherApiKey());

      if (ladderEnabled) {
        const ladder = resolveTogetherSkeletonStepsLadder(baseSteps);
        const ladderParallel = envTruthyRaw(
          process.env.TOGETHER_SKELETON_LADDER_PARALLEL,
          false,
        );
        console.log(
          `[AIService] Together skeleton ladder (${ladderParallel ? "parallel" : "sequential"}): steps=[${ladder.join(", ")}]`,
        );

        /** @type {{ steps: number, buf: Buffer, durationMs: number }[]} */
        let winners = [];

        if (ladderParallel) {
          const settled = await Promise.allSettled(
            ladder.map((steps) => {
              const genStart = performance.now();
              return togetherFlux
                .generatePosterBufferWithTogetherFlux(skeletonPrompt, {
                  skeletonStage: true,
                  honoreeReferenceUrls,
                  steps,
                })
                .then((b) => ({
                  steps,
                  buf: b,
                  durationMs: Math.round(performance.now() - genStart),
                }));
            }),
          );

          for (let i = 0; i < settled.length; i++) {
            const s = settled[i];
            if (s.status === "fulfilled" && s.value?.buf?.length) {
              winners.push({
                steps: s.value.steps,
                buf: s.value.buf,
                durationMs: s.value.durationMs,
              });
            } else if (s.status === "rejected") {
              console.warn(
                `[AIService] skeleton ladder steps=${ladder[i]} rejected: ${s.reason?.message || s.reason}`,
              );
            }
          }
          const byStep = new Map(winners.map((w) => [w.steps, w]));
          winners = ladder
            .filter((st) => byStep.has(st))
            .map((st) => byStep.get(st));
        } else {
          for (const steps of ladder) {
            const genStart = performance.now();
            try {
              const b = await togetherFlux.generatePosterBufferWithTogetherFlux(
                skeletonPrompt,
                {
                  skeletonStage: true,
                  honoreeReferenceUrls,
                  steps,
                },
              );
              const durationMs = Math.round(performance.now() - genStart);
              if (b?.length) {
                winners.push({ steps, buf: b, durationMs });
              } else {
                console.warn(
                  `[AIService] skeleton ladder steps=${steps} empty buffer`,
                );
              }
            } catch (e) {
              console.warn(
                `[AIService] skeleton ladder steps=${steps} failed: ${e?.message || e}`,
              );
            }
          }
        }

        if (winners.length > 0) {
          skeletonSource = "together";
          /** @type {{ steps: number, url: string, durationMs: number }[]} */
          const skeletonProgress = [];
          let lastUrl = "";
          for (const w of winners) {
            const url = await storageRepository.saveSkeletonPoster(
              eventId,
              w.buf,
              "image/png",
            );
            skeletonProgress.push({
              steps: w.steps,
              url,
              durationMs: w.durationMs,
            });
            lastUrl = url;
            await eventRepository.updateSkeletonPoster(eventId, lastUrl, {
              skeletonProgress,
            });
            console.log(
              `[AIService] skeleton frame steps=${w.steps} uploaded (${skeletonProgress.length}/${winners.length})`,
            );
          }
          const lastWin = winners[winners.length - 1];
          buf = lastWin?.buf ?? null;
          console.log(
            `[AIService] Stage B skeleton OK source=${skeletonSource} together=${skeletonTogetherModelId} vertexFallback=${skModel} ladderFrames=${skeletonProgress.length}`,
          );
          const ms = Math.round(performance.now() - t0);
          return { ok: true, url: lastUrl, ms };
        }
      }

      const tSingleGen = performance.now();
      buf = await togetherFlux.generatePosterBufferWithTogetherFlux(
        skeletonPrompt,
        {
          skeletonStage: true,
          honoreeReferenceUrls,
        },
      );
      let singleGenMs = Math.round(performance.now() - tSingleGen);
      if (buf && buf.length > 0) {
        skeletonSource = "together";
      }
      if (!buf || buf.length === 0) {
        const vStart = performance.now();
        buf = await vertexImagen.generatePosterBufferWithVertexImagen(
          skeletonPrompt,
          { vertexModelId: skModel },
        );
        singleGenMs = Math.round(performance.now() - vStart);
        if (buf && buf.length > 0) skeletonSource = "vertex";
      }

      const ms = Math.round(performance.now() - t0);
      if (!buf || buf.length === 0) {
        console.warn(
          `[AIService] Stage B skeleton no image (Together ${skeletonTogetherModelId} → Vertex ${skModel})`,
        );
        return { ok: false, ms };
      }
      const url = await storageRepository.saveSkeletonPoster(
        eventId,
        buf,
        "image/png",
      );
      const singleSteps =
        skeletonSource === "together"
          ? baseSteps
          : 0;
      await eventRepository.updateSkeletonPoster(eventId, url, {
        skeletonProgress: [{ steps: singleSteps, url, durationMs: singleGenMs }],
      });
      console.log(
        `[AIService] Stage B skeleton OK source=${skeletonSource} together=${skeletonTogetherModelId} vertexFallback=${skModel}`,
      );
      return { ok: true, url, ms };
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
            const signed = await storageRepository.getHonoreePhotoSignedReadUrl(
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

    console.log(
      `[AIService] Stage B parallel: skeleton=together:${skeletonTogetherModelId}|vertex:${skModel} final=${finalProvider === "vertex" ? finModel : `openai:${process.env.OPENAI_IMAGE_MODEL || "gpt-image-2"}`} skipSkeleton=${skipSkeleton}`,
    );

    const [skSettled, finSettled] = await Promise.allSettled([
      runSkeleton(),
      runFinal(),
    ]);

    if (skSettled.status === "fulfilled") {
      const v = skSettled.value;
      if (v && v.url) skeletonPosterUrl = v.url;
      if (v && v.ms != null && !v.skipped) timing.skeletonStageMs = v.ms;
    } else {
      console.warn(
        `[AIService] skeleton pipeline error: ${skSettled.reason?.message || skSettled.reason}`,
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
};
