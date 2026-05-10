/**
 * Together.ai image generation via official `together-ai` SDK.
 * @see https://docs.together.ai/reference/post-images-generations
 */

const { Together } = require("together-ai");

/** Default Stage-B model on Together’s image API (Imagen 4 fast). */
const DEFAULT_TOGETHER_IMAGE_MODEL = "google/imagen-4.0-fast";

/** Together FLUX Pro id (use when `TOGETHER_FLUX_MODEL` is set or for legacy `black-forest-labs/FLUX.1-pro` normalization). */
const FLUX_MODEL_PRO_TOGETHER = "black-forest-labs/FLUX.1.1-pro";

/** Stage-B skeleton preview default (Together only). */
const DEFAULT_SKELETON_TOGETHER_MODEL = "black-forest-labs/FLUX.2-dev";

/** Map Stage-B pseudonyms (from IMAGE_MODELS) → Together `model` ids. */
const TOGETHER_FLUX_LOOP_IDS = {
  "together-flux-pro": DEFAULT_TOGETHER_IMAGE_MODEL,
  "together-flux-pro2": "black-forest-labs/FLUX.2-pro",
  "together-flux-schnell": "black-forest-labs/FLUX.1-schnell",
};

function getTogetherApiKey() {
  return (
    process.env.TOGETHER_AI_API_KEY ||
    process.env.TOGETHER_API_KEY ||
    ""
  ).trim();
}

function isTogetherFluxEnabled() {
  const v = process.env.TOGETHER_FLUX_ENABLED;
  if (v === "0" || v === "false" || v === "off") return false;
  return true;
}

function resolveTogetherFluxModel(stageModelId) {
  const fromEnv = process.env.TOGETHER_FLUX_MODEL?.trim();
  if (fromEnv) {
    return normalizeLegacyFluxProModelId(fromEnv);
  }

  const raw =
    typeof stageModelId === "string" ? stageModelId.trim().toLowerCase() : "";
  if (raw && TOGETHER_FLUX_LOOP_IDS[raw]) {
    return normalizeLegacyFluxProModelId(TOGETHER_FLUX_LOOP_IDS[raw]);
  }
  if (
    typeof stageModelId === "string" &&
    stageModelId.trim().startsWith("black-forest-labs/")
  ) {
    return normalizeLegacyFluxProModelId(stageModelId.trim());
  }

  return DEFAULT_TOGETHER_IMAGE_MODEL;
}

/** `FLUX.1-pro` is not a valid Together id; their serverless Pro model is `FLUX.1.1-pro`. */
function normalizeLegacyFluxProModelId(model) {
  if (model === "black-forest-labs/FLUX.1-pro") {
    return FLUX_MODEL_PRO_TOGETHER;
  }
  return model;
}

function resolveTogetherFluxSteps(model) {
  const fromEnv = process.env.TOGETHER_FLUX_STEPS;
  if (fromEnv != null && String(fromEnv).trim() !== "") {
    const parsed = parseInt(String(fromEnv).trim(), 10);
    if (!Number.isNaN(parsed)) {
      return clampTogetherFluxSteps(parsed, model);
    }
  }

  const schnell = model.toLowerCase().includes("schnell");
  return schnell
    ? 4
    : Math.min(50, Math.max(1, 28));
}

/**
 * @param {number} steps
 * @param {string} model
 * @returns {number}
 */
function clampTogetherFluxSteps(steps, model) {
  const cap = String(model).toLowerCase().includes("schnell") ? 4 : 50;
  const n = Math.round(Number(steps));
  if (!Number.isFinite(n)) return resolveTogetherFluxSteps(model);
  return Math.min(cap, Math.max(1, n));
}

function shouldSendStepsForModel(model) {
  const m = String(model).toLowerCase();
  if (m.includes("imagen")) return false;
  return true;
}

/** Together `google/imagen-*` only allows these exact WxH pairs (API error otherwise). */
const TOGETHER_IMAGEN_SIZE_PRESETS = [
  [1024, 1024],
  [768, 1408],
  [1408, 768],
  [896, 1280],
  [1280, 896],
];

/**
 * Maps requested dimensions to the closest allowed Imagen preset (by aspect ratio).
 * @returns {{ width: number, height: number }}
 */
function snapDimensionsForTogetherImagen(width, height) {
  const w = Math.max(1, Number(width) || 1);
  const h = Math.max(1, Number(height) || 1);
  const desiredLogRatio = Math.log(w / h);
  let bestW = TOGETHER_IMAGEN_SIZE_PRESETS[0][0];
  let bestH = TOGETHER_IMAGEN_SIZE_PRESETS[0][1];
  let bestScore = Infinity;
  for (const [cw, ch] of TOGETHER_IMAGEN_SIZE_PRESETS) {
    const score = Math.abs(Math.log(cw / ch) - desiredLogRatio);
    if (score < bestScore) {
      bestScore = score;
      bestW = cw;
      bestH = ch;
    }
  }
  return { width: bestW, height: bestH };
}

function resolveImageDimensions(model, rawWidth, rawHeight) {
  const w = Number.parseInt(String(rawWidth), 10);
  const h = Number.parseInt(String(rawHeight), 10);
  const width = Number.isFinite(w) && w > 0 ? w : 896;
  const height = Number.isFinite(h) && h > 0 ? h : 1152;

  if (String(model).toLowerCase().includes("imagen")) {
    const snapped = snapDimensionsForTogetherImagen(width, height);
    if (snapped.width !== width || snapped.height !== height) {
      console.log(
        `[TogetherFlux] imagen size ${width}x${height} → ${snapped.width}x${snapped.height} (API presets)`,
      );
    }
    return snapped;
  }
  return { width, height };
}

/** @see https://docs.together.ai/docs/images-overview — only some models accept reference_images. */
function modelSupportsTogetherReferenceImagesArray(modelId) {
  const s = String(modelId).toLowerCase();
  return (
    s.includes("flux.2") ||
    s.includes("/flash-image") ||
    s.includes("/gemini-3-pro-image")
  );
}

/**
 * When the logical model cannot take honoree URLs, switch to a model that accepts `image_url`.
 * Override with `TOGETHER_HONOREE_REFERENCE_MODEL`.
 */
const DEFAULT_HONOREE_CONDITIONING_MODEL = "black-forest-labs/FLUX.1-kontext-pro";

function resolveTogetherApiModelForHonoree(logicalModel, honoreeUrls) {
  const urls = Array.isArray(honoreeUrls)
    ? honoreeUrls.filter((u) => typeof u === "string" && u.trim())
    : [];
  if (urls.length === 0) {
    return logicalModel;
  }
  if (modelSupportsTogetherReferenceImagesArray(logicalModel)) {
    return logicalModel;
  }
  const s = String(logicalModel).toLowerCase();
  if (s.includes("kontext")) {
    return logicalModel;
  }
  const fromEnv = process.env.TOGETHER_HONOREE_REFERENCE_MODEL?.trim();
  const fallback = fromEnv || DEFAULT_HONOREE_CONDITIONING_MODEL;
  if (fallback !== logicalModel) {
    console.log(
      `[TogetherFlux] honoree conditioning reroute ${logicalModel} → ${fallback} (Imagen/basic FLUX have no usable ref param here; see Together images-overview)`,
    );
  }
  return fallback;
}

/**
 * @param {object} body Passed to together.images.generate (mutated).
 * @param {string[]} honoreeUrls
 */
function attachHonoreeUrlsToTogetherBody(body, honoreeUrls) {
  const urls = Array.isArray(honoreeUrls)
    ? honoreeUrls.filter((u) => typeof u === "string" && u.trim())
    : [];
  if (urls.length === 0) return;

  if (modelSupportsTogetherReferenceImagesArray(body.model)) {
    body.reference_images = urls;
    console.log(`[TogetherFlux] reference_images=${urls.length}`);
    return;
  }
  body.image_url = urls[0];
  console.log("[TogetherFlux] image_url=1 (single reference)");
}

/**
 * @param {string} promptText
 * @param {{
 *   stageModelId?: string;
 *   honoreeReferenceUrls?: string[];
 *   skeletonStage?: boolean;
 *   steps?: number;
 * }} [options] Stage-B loop id (`together-flux-pro` → Imagen 4 fast; `together-flux-pro2` → FLUX.2-pro; `together-flux-schnell`; or any Together `model` string). `honoreeReferenceUrls`: HTTPS URLs (signed GCS). Routed to Kontext (`image_url`) or kept on FLUX.2-style models (`reference_images`) per Together’s supported parameters — Imagen rejects both in practice. `skeletonStage`: always uses `black-forest-labs/FLUX.2-dev` for the API request (not `TOGETHER_FLUX_MODEL` / not honoree reroute). `steps`: optional explicit step count (clamped per model).
 * @returns {Promise<Buffer|null>}
 */
async function generatePosterBufferWithTogetherFlux(promptText, options = {}) {
  if (!isTogetherFluxEnabled()) {
    return null;
  }

  const apiKey = getTogetherApiKey();
  if (!apiKey) {
    console.warn(
      "[TogetherFlux] Skipped: set TOGETHER_AI_API_KEY (or TOGETHER_API_KEY)",
    );
    return null;
  }

  const logicalModel = options.skeletonStage
    ? DEFAULT_SKELETON_TOGETHER_MODEL
    : resolveTogetherFluxModel(options.stageModelId);
  const apiModel = options.skeletonStage
    ? DEFAULT_SKELETON_TOGETHER_MODEL
    : resolveTogetherApiModelForHonoree(
        logicalModel,
        options.honoreeReferenceUrls,
      );

  const { width, height } = resolveImageDimensions(
    apiModel,
    process.env.TOGETHER_FLUX_WIDTH || "896",
    process.env.TOGETHER_FLUX_HEIGHT || "1152",
  );
  const steps =
    options.steps != null && Number.isFinite(Number(options.steps))
      ? clampTogetherFluxSteps(Number(options.steps), apiModel)
      : resolveTogetherFluxSteps(apiModel);

  console.log(
    `[TogetherFlux] model=${apiModel}${apiModel !== logicalModel ? ` (from ${logicalModel})` : ""} steps=${shouldSendStepsForModel(apiModel) ? steps : "(n/a)"}`,
  );

  const prompt = typeof promptText === "string" ? promptText.trim() : "";
  if (!prompt) return null;

  const together = new Together({ apiKey });

  const body = {
    model: apiModel,
    prompt,
    width,
    height,
    n: 1,
    response_format: "base64",
  };

  attachHonoreeUrlsToTogetherBody(body, options.honoreeReferenceUrls);

  if (shouldSendStepsForModel(apiModel)) {
    body.steps = steps;
  }

  try {
    const response = await together.images.generate(body);
    const piece = response?.data?.[0];
    const b64 = piece?.b64_json ?? null;
    if (!b64) {
      console.warn("[TogetherFlux] Missing data[0].b64_json from SDK response");
      return null;
    }
    return Buffer.from(b64, "base64");
  } catch (err) {
    const msg = err?.message ?? String(err);
    console.warn(`[TogetherFlux] together.images.generate failed: ${msg}`);
    return null;
  }
}

module.exports = {
  generatePosterBufferWithTogetherFlux,
  getTogetherApiKey,
  isTogetherFluxEnabled,
  DEFAULT_TOGETHER_IMAGE_MODEL,
  DEFAULT_SKELETON_TOGETHER_MODEL,
  resolveTogetherFluxSteps,
  clampTogetherFluxSteps,
};
