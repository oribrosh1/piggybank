const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const eventRepository = require("../repositories/eventRepository");
const storageRepository = require("../repositories/storageRepository");
const {
  getPartySettingLabel,
  CATERING_PARTNER_LABELS,
  formatVegetarianType,
} = require("../constants/partyTypeLabels");
const { getPartyDerivedStyleInstructions } = require("../constants/partyTypePosterStyles");

const PROMPT_MODELS = [
  "gemini-3.1-pro-preview",
  "gemini-3.1-flash-preview",
];

/** Stage B defaults: Gemini image modality only (Together poster path disabled below). */
const IMAGE_MODELS = [
  "gemini-3.1-pro-preview",
  "gemini-3.1-flash-preview",
];

/** Max Stage-B model entries per request (caller-supplied or env). */
const MAX_IMAGE_MODEL_IDS = 12;
/** Per-model id length cap (Gemini model ids are short strings). */
const MAX_IMAGE_MODEL_ID_LEN = 120;

/**
 * Stage B model list: options.imageModelIds wins, then POSTER_IMAGE_MODEL_IDS (comma-separated), else IMAGE_MODELS.
 * Optionally include Vertex Imagen ids (`imagen-...`) when using env overrides.
 * @param {{ imageModelIds?: string[] }} options
 * @returns {string[]}
 */
function resolvePosterImageModelIds(options = {}) {
  const fromOptions = options.imageModelIds;
  if (Array.isArray(fromOptions) && fromOptions.length > 0) {
    const seen = new Set();
    const out = [];
    for (const raw of fromOptions) {
      if (typeof raw !== "string") continue;
      const id = raw.trim();
      if (!id || id.length > MAX_IMAGE_MODEL_ID_LEN) continue;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(id);
      if (out.length >= MAX_IMAGE_MODEL_IDS) break;
    }
    if (out.length > 0) return out;
  }

  const fromEnv = process.env.POSTER_IMAGE_MODEL_IDS;
  if (typeof fromEnv === "string" && fromEnv.trim()) {
    const parts = fromEnv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const seen = new Set();
    const out = [];
    for (const id of parts) {
      if (id.length > MAX_IMAGE_MODEL_ID_LEN) continue;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(id);
      if (out.length >= MAX_IMAGE_MODEL_IDS) break;
    }
    if (out.length > 0) return out;
  }

  return [...IMAGE_MODELS];
}

/** Stage A: caps brief length so generation returns sooner and uses fewer output tokens. */
const STAGE_A_MAX_CHARS = 1200;

/** Minimum length for accepted poster brief — avoids persisting truncated JSON like `{"posterBrief`. */
const MIN_STAGE_A_BRIEF_CHARS = 80;

/** Extra headroom when Stage A returns JSON wrapping a string field. */
const STAGE_A_JSON_MAX_OUTPUT_TOKENS = 400;

/**
 * @see https://ai.google.dev/gemini-api/docs/system-instructions
 * Kept separate from the user turn (event facts) so the model follows output shape reliably.
 */
const STAGE_A_SYSTEM_INSTRUCTION = `You help create invitation poster image prompts.
You must follow the user message and the response format requested in the same turn.
The poster text must be plain English only: no markdown, no # headings, no **bold**, no code fences, no title like "The Prompt", and no intros (e.g. "Here is", "designed for Midjourney", tool names). Start the brief with the actual scene (often the word "A").
Open posterBrief with vivid atmosphere and setting driven by CREATIVE VISUAL DIRECTION (occasion type, mitzvah tone if applicable, party setting, theme, vibe, honoree color story, age- and gender-appropriate hero character) plus the party-derived Visual style paragraph — then lay out logistics text (dates, address, etc.) as instructed.
When the user message includes REQUIRED — on-poster typography rules, obey them for factual logistics lines (exact date, time, address where applicable). Theme, vibe, and party setting must still read strongly through imagery and color — optional short taglines only if they stay readable.`;

/** Rough ceiling paired with STAGE_A_MAX_CHARS (~4 chars/token for typical English). */
const STAGE_A_MAX_OUTPUT_TOKENS = 280;

/** Client-supplied poster brief (Stage B only); generous cap to avoid abuse. */
const PROVIDED_PROMPT_MAX_CHARS = 12_000;

// Helper to handle the "Please retry in X seconds" issue
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

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

/** Extract posterBrief from Stage A JSON (handles optional ``` fences). */
function parseStageAJsonPayload(raw) {
  if (!raw || typeof raw !== "string") return null;
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  }
  try {
    const o = JSON.parse(s);
    if (o && typeof o.posterBrief === "string" && o.posterBrief.trim()) {
      return o.posterBrief.trim();
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Stage A occasionally returns truncated `"application/json"` bodies; never persist fragments.
 */
function isUsablePosterBrief(s) {
  if (!s || typeof s !== "string") return false;
  const t = s.trim();
  if (t.length < MIN_STAGE_A_BRIEF_CHARS) return false;
  if (/^\{\\s*"posterBrief"\s*:\s*"?\s*$/i.test(t)) return false;
  if (t.startsWith("{") && parseStageAJsonPayload(t) === null) {
    return false;
  }
  return true;
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

  return `Write the invitation poster image brief for this event.

Event facts (comma-separated): ${promptDetails.join(", ")}.

CREATIVE VISUAL DIRECTION (make the generated image striking and specific — lead posterBrief with this atmosphere; express through scene, lighting, props, palette, and composition):
${buildCreativeVisualDirectives(event, hasHonoreeReferencePhoto)}

${mustRenderDetails ? `${mustRenderDetails}\n\n` : ""}Visual style to reflect in the brief: ${styleBlock}.

Use the JSON response format from this request (single object with posterBrief). Put the full plain-text image prompt only in posterBrief — see system instructions for formatting.${portraitNote}

Keep posterBrief at most ${STAGE_A_MAX_CHARS} characters.`;
}

function isGeminiImageModel(modelId) {
  if (typeof modelId !== "string") return false;
  const lower = modelId.toLowerCase();
  if (!lower.startsWith("gemini")) return false;
  if (lower.includes("image")) return true;
  return (
    lower === "gemini-3.1-pro-preview" || lower === "gemini-3.1-flash-preview"
  );
}

/** Vertex Imagen publisher model id from Stage B list (not Gemini API). */
function isVertexImagenModelId(modelId) {
  return (
    typeof modelId === "string" &&
    modelId.length > 0 &&
    modelId.toLowerCase().startsWith("imagen")
  );
}

/**
 * Together.ai disabled for poster Stage B. Re-enable detector + uncomment block below to use together-flux-*.
 */
function isTogetherFluxModelId() {
  return false;
}

function hasExplicitStageBModelOverride(options = {}) {
  if (Array.isArray(options.imageModelIds) && options.imageModelIds.length > 0) {
    return true;
  }
  const env = process.env.POSTER_IMAGE_MODEL_IDS;
  return typeof env === "string" && env.trim() !== "";
}

/** Default parallel Vertex Imagen skeleton + final poster. Set POSTER_DUAL_VERTEX_IMAGEN=0 to disable. */
function useDualVertexImagenStageB() {
  return process.env.POSTER_DUAL_VERTEX_IMAGEN !== "0";
}

/**
 * Parallel Vertex Imagen predicts (fast draft + HQ final), same prompt.
 * @returns {Promise<{ posterUrl?: string, skeletonPosterUrl?: string, timingPatch: Record<string, number> }>}
 */
async function runPosterStageDualVertexImagen(eventId, imagePrompt, honoreeRef) {
  const vertexImagen = require("./vertexImagenService");
  const imagenPrompt =
    imagePrompt +
    (honoreeRef
      ? "\n\nInclude a prominent, warm portrait of the honoree child consistent with the name and age given."
      : "");

  const skModel = vertexImagen.resolveVertexImagenSkeletonModelId();
  const finModel = vertexImagen.resolveVertexImagenFinalModelId();
  const skeletonEnabled =
    process.env.POSTER_SKELETON_PREVIEW !== "0" &&
    process.env.POSTER_SKELETON_PREVIEW !== "false";

  async function skeletonBranch() {
    if (!skeletonEnabled) {
      return { skipped: true };
    }
    const t0 = performance.now();
    try {
      console.log(`[AIService] Stage B skeleton Vertex (${skModel})`);
      const buf = await vertexImagen.generatePosterBufferWithVertexImagen(
        imagenPrompt,
        { vertexModelId: skModel },
      );
      const skeletonStageMs = Math.round(performance.now() - t0);
      if (!buf || buf.length === 0) {
        console.warn("[AIService] Skeleton Vertex Imagen returned no image");
        return { ok: false, skeletonStageMs };
      }
      const u0 = performance.now();
      const url = await storageRepository.saveSkeletonPoster(
        eventId,
        buf,
        "image/png",
      );
      const skeletonUploadMs = Math.round(performance.now() - u0);
      await eventRepository.updateSkeletonPoster(eventId, url);
      console.log("[AIService] Skeleton poster URL saved");
      return {
        ok: true,
        skeletonPosterUrl: url,
        skeletonStageMs,
        skeletonUploadMs,
      };
    } catch (e) {
      console.warn(`[AIService] Skeleton Vertex Imagen failed: ${e.message}`);
      return { ok: false };
    }
  }

  async function finalBranch() {
    const t0 = performance.now();
    try {
      console.log(`[AIService] Stage B final Vertex (${finModel})`);
      const buf = await vertexImagen.generatePosterBufferWithVertexImagen(
        imagenPrompt,
        { vertexModelId: finModel },
      );
      const finalImagenStageMs = Math.round(performance.now() - t0);
      if (!buf || buf.length === 0) {
        console.warn("[AIService] Final Vertex Imagen returned no image");
        return { ok: false, finalImagenStageMs };
      }
      const u0 = performance.now();
      const url = await storageRepository.savePoster(
        eventId,
        buf,
        "image/png",
      );
      const posterUploadMs = Math.round(performance.now() - u0);
      await eventRepository.updatePoster(eventId, imagePrompt, url);
      console.log("[AIService] Final poster Vertex OK");
      return {
        ok: true,
        posterUrl: url,
        finalImagenStageMs,
        posterUploadMs,
      };
    } catch (e) {
      console.warn(`[AIService] Final Vertex Imagen failed: ${e.message}`);
      return { ok: false };
    }
  }

  const [sk, fin] = await Promise.allSettled([
    skeletonBranch(),
    finalBranch(),
  ]);

  const skVal = sk.status === "fulfilled" ? sk.value : {};
  const finVal = fin.status === "fulfilled" ? fin.value : {};

  /** @type {Record<string, number>} */
  const timingPatch = {};
  if (typeof skVal.skeletonStageMs === "number") {
    timingPatch.skeletonStageMs = skVal.skeletonStageMs;
  }
  if (typeof skVal.skeletonUploadMs === "number") {
    timingPatch.skeletonUploadMs = skVal.skeletonUploadMs;
  }
  if (typeof finVal.finalImagenStageMs === "number") {
    timingPatch.finalImagenStageMs = finVal.finalImagenStageMs;
  }
  if (typeof finVal.posterUploadMs === "number") {
    timingPatch.posterUploadMs = finVal.posterUploadMs;
  }

  return {
    posterUrl: finVal.posterUrl,
    skeletonPosterUrl: skVal.skeletonPosterUrl,
    timingPatch,
  };
}

/**
 * @param {object} [options]
 * @param {string} [options.posterPrompt] When set (non-empty after trim), Stage A is skipped and this text is used as the image brief.
 * @param {string[]} [options.imageModelIds] Stage B image models to try in order; overrides default IMAGE_MODELS and POSTER_IMAGE_MODEL_IDS.
 */
async function generatePoster(eventId, event, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const runStarted = performance.now();
  /** @type {{ honoreeFetchMs?: number, stageAMs?: number, stageBMs?: number, posterUploadMs?: number, skeletonStageMs?: number, skeletonUploadMs?: number, finalImagenStageMs?: number, stageASkipped?: boolean, totalMs: number }} */
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

    if (provided.length > 0) {
      if (provided.length < 10) {
        throw new Error("posterPrompt must be at least 10 characters.");
      }
      imagePrompt = provided.slice(0, PROVIDED_PROMPT_MAX_CHARS);
      timing.stageASkipped = true;
    } else {
      const promptForPrompt = buildPromptForPrompt(event, Boolean(honoreeRef));
      const stageAStart = performance.now();

      for (const modelId of PROMPT_MODELS) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelId,
            systemInstruction: STAGE_A_SYSTEM_INSTRUCTION,
          });

          let jsonPathFailed = false;
          let result;
          try {
            result = await model.generateContent({
              contents: [{ role: "user", parts: [{ text: promptForPrompt }] }],
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
              },
            });
          } catch (jsonErr) {
            jsonPathFailed = true;
            console.warn(
              `[AIService] Stage A JSON (${modelId}): ${jsonErr.message} — retry plain text.`,
            );
            result = await model.generateContent({
              contents: [{ role: "user", parts: [{ text: promptForPrompt }] }],
              generationConfig: {
                maxOutputTokens: STAGE_A_MAX_OUTPUT_TOKENS,
              },
            });
          }

          let rawText = result.response?.text?.()?.trim();
          /* JSON MIME can succeed HTTP-wise but yield truncated/unparseable text — fallback. */
          if (
            !jsonPathFailed &&
            rawText &&
            parseStageAJsonPayload(rawText) == null
          ) {
            console.warn(
              `[AIService] Stage A (${modelId}): JSON mode returned unparsable body — retry plain text.`,
            );
            result = await model.generateContent({
              contents: [{ role: "user", parts: [{ text: promptForPrompt }] }],
              generationConfig: {
                maxOutputTokens: STAGE_A_MAX_OUTPUT_TOKENS,
              },
            });
            rawText = result.response?.text?.()?.trim();
          }

          if (!rawText) {
            console.warn(`[AIService] Stage A (${modelId}): empty response`);
            continue;
          }

          const fromJson = parseStageAJsonPayload(rawText);
          let cleaned = fromJson
            ? sanitizeStageATextOutput(fromJson) || fromJson.trim()
            : sanitizeStageATextOutput(rawText);
          if (!fromJson && (!cleaned || cleaned.trim().length < MIN_STAGE_A_BRIEF_CHARS)) {
            cleaned = rawText.replace(/\s+/g, " ").trim();
          }

          if (!isUsablePosterBrief(cleaned)) {
            console.warn(
              `[AIService] Stage A (${modelId}): posterBrief rejected (too short or invalid JSON fragment)`,
            );
            continue;
          }

          imagePrompt = cleaned;
          if (imagePrompt.length > STAGE_A_MAX_CHARS) {
            imagePrompt = imagePrompt.slice(0, STAGE_A_MAX_CHARS).trimEnd();
          }
          if (!isUsablePosterBrief(imagePrompt)) {
            imagePrompt = null;
            continue;
          }
          break;
        } catch (err) {
          console.warn(`[AIService] Stage A (${modelId}) failed: ${err.message}`);
        }
      }

      timing.stageAMs = Math.round(performance.now() - stageAStart);
    }

    if (!imagePrompt) throw new Error("Prompt generation failed.");
    await eventRepository.updatePoster(eventId, imagePrompt, null);

    let posterUrl = null;
    let skeletonPosterUrl;
    const stageBStart = performance.now();

    const vertexSvc = require("./vertexImagenService");
    const vertexReady =
      vertexSvc.isImagenFallbackEnabled() &&
      Boolean(vertexSvc.resolveGcpProjectId());

    if (
      useDualVertexImagenStageB() &&
      !hasExplicitStageBModelOverride(options) &&
      vertexReady
    ) {
      const dual = await runPosterStageDualVertexImagen(
        eventId,
        imagePrompt,
        honoreeRef,
      );
      posterUrl = dual.posterUrl;
      skeletonPosterUrl = dual.skeletonPosterUrl;
      Object.assign(timing, dual.timingPatch);
      timing.stageBMs = Math.round(performance.now() - stageBStart);
    } else {
      const imageModelIds = resolvePosterImageModelIds(options);
      console.log(
        `[AIService] Stage B trying ${imageModelIds.length} model(s): ${imageModelIds.join(", ")}`,
      );

      for (const modelId of imageModelIds) {
        try {
          if (isVertexImagenModelId(modelId)) {
            const imagenPrompt =
              imagePrompt +
              (honoreeRef
                ? "\n\nInclude a prominent, warm portrait of the honoree child consistent with the name and age given."
                : "");
            const imagenBuffer = await require("./vertexImagenService")
              .generatePosterBufferWithVertexImagen(imagenPrompt, {
                vertexModelId: modelId,
              });
            if (imagenBuffer && imagenBuffer.length > 0) {
              const uploadStart = performance.now();
              posterUrl = await storageRepository.savePoster(
                eventId,
                imagenBuffer,
                "image/png",
              );
              timing.posterUploadMs = Math.round(
                performance.now() - uploadStart,
              );
              await eventRepository.updatePoster(
                eventId,
                imagePrompt,
                posterUrl,
              );
              console.log(`[AIService] Stage B (${modelId}) Vertex Imagen OK`);
              break;
            }
            console.warn(
              `[AIService] Stage B (${modelId}) Imagen returned no image — trying next...`,
            );
            await sleep(500);
            continue;
          }

          // Together.ai poster path (disabled).
          const imageModel = genAI.getGenerativeModel({ model: modelId });
          const parts = [];
          if (honoreeRef && isGeminiImageModel(modelId)) {
            parts.push({
              text:
                "Create one invitation poster image from the brief below. The next part is a REFERENCE PHOTO of the honoree — match this child's face, hair, skin tone, and general appearance closely in the artwork (celebratory, age-appropriate portrait integrated into the scene).\n\n--- BRIEF ---\n\n" +
                imagePrompt,
            });
            parts.push({
              inlineData: {
                mimeType: honoreeRef.mimeType,
                data: honoreeRef.buffer.toString("base64"),
              },
            });
          } else {
            parts.push({
              text:
                imagePrompt +
                (honoreeRef && !isGeminiImageModel(modelId)
                  ? "\n\nInclude a prominent, warm portrait of the honoree child consistent with the name and age given."
                  : ""),
            });
          }

          const imageResult = await imageModel.generateContent({
            contents: [{ role: "user", parts }],
            generationConfig: { responseModalities: ["IMAGE"] },
          });

          const inlineData =
            imageResult?.response?.candidates?.[0]?.content?.parts?.[0]
              ?.inlineData;
          if (inlineData?.data) {
            const buffer = Buffer.from(inlineData.data, "base64");
            const uploadStart = performance.now();
            posterUrl = await storageRepository.savePoster(
              eventId,
              buffer,
              inlineData.mimeType || "image/png",
            );
            timing.posterUploadMs = Math.round(
              performance.now() - uploadStart,
            );
            await eventRepository.updatePoster(eventId, imagePrompt, posterUrl);
            break;
          }
        } catch (err) {
          console.warn(
            `[AIService] Stage B (${modelId}) quota/error. Trying next...`,
          );
          console.warn(err);
          await sleep(500);
        }
      }

      timing.stageBMs = Math.round(performance.now() - stageBStart);
    }

    await persistTiming();
    return {
      posterPrompt: imagePrompt,
      posterUrl: posterUrl || undefined,
      ...(skeletonPosterUrl ? { skeletonPosterUrl } : {}),
      /** Wall-clock breakdown (CLI / debugging); same fields as Firestore `posterGenerationTiming`. */
      timing: { ...timing },
    };
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
  parseStageAJsonPayload,
  getEventTypeLabel,
  buildCreativeVisualDirectives,
  resolveHonoreeGenderForPrompt,
  describeHonoreeAgeForCharacter,
};
