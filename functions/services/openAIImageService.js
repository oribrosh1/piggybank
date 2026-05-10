const { OpenAI, toFile } = require("openai");

/**
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

// =============================================================================
// LATENCY OPTIMIZATION NOTE
// =============================================================================
// OpenAI image streaming returns large Base64 payloads per partial/final event.
// RTT and bandwidth dominate wall-clock time (see posterGenTiming.finalStageMs).
//
// **Region / deployment**
// For the fastest streaming, run this workload in a **US** Google Cloud /
// Firebase region close to OpenAI’s ingress—**`us-east1` (North Virginia)** is
// a common choice to minimize round-trip time to OpenAI’s US-facing endpoints.
// Deploying in EMEA/APAC increases latency for every partial chunk over TLS.
//
// **Native square resolution (`1024x1024`)**
// GPT image models are tuned for standard square tiles. Requesting **landscape /
// portrait** sizes (`1536x1024`, `1024x1536`, `auto`, etc.) can force extra
// internal composition, padding, or scaling paths versus the native **1024×1024**
// grid—often adding **roughly tens of percent** to end-to-end generation time
// and payload size. We default to **`1024x1024`** so the API takes the most direct
// path and returns smaller PNGs → faster decode, upload, and Firestore preview
// patches → lower observed **finalStageMs**.
//
// **`partial_images` (request)**
// We **always** send **`partial_images: 3`** (the API maximum) so the model is asked
// for as many progressive frames as allowed. OpenAI may still emit **fewer**
// `image_generation.partial_image` events if it finishes the final sooner — that
// cannot be forced client-side. (`OPENAI_PARTIAL_IMAGES` env is not read; change
// {@link resolvePartialImagesCount} in code if you ever need a lower bound.)
//
// **`quality` (GPT image models only)**
// Valid values are **`low`**, **`medium`**, **`high`**, and **`auto`** — not DALL·E’s
// `standard` / `hd`. Default **`low`** for fastest generation; override with
// **`OPENAI_IMAGE_QUALITY`** (`low` | `medium` | `high` | `auto`).
// =============================================================================

/** Allowed `quality` for GPT image streaming (`images.generate`). */
const ALLOWED_IMAGE_QUALITY = new Set(["low", "medium", "high", "auto"]);

/** GPT-image streaming default square size; override with OPENAI_IMAGE_SIZE. */
const NATIVE_POSTER_IMAGE_SIZE = "1024x1024";

/**
 * GPT-image `quality` — API rejects `standard` / `hd` (those are DALL·E-only).
 * Default **`low`** for latency; set `OPENAI_IMAGE_QUALITY` to override.
 * @param {object} [options]
 * @param {'low'|'medium'|'high'|'auto'} [options.quality]
 * @returns {'low'|'medium'|'high'|'auto'}
 */
function resolveImageQuality(options = {}) {
  if (options.quality && ALLOWED_IMAGE_QUALITY.has(options.quality)) {
    return options.quality;
  }
  const raw = process.env.OPENAI_IMAGE_QUALITY?.trim().toLowerCase();
  if (raw && ALLOWED_IMAGE_QUALITY.has(raw)) {
    return /** @type {'low'|'medium'|'high'|'auto'} */ (raw);
  }
  if (raw && !ALLOWED_IMAGE_QUALITY.has(raw)) {
    console.warn(
      `[OpenAIImage] OPENAI_IMAGE_QUALITY="${raw}" is invalid; using "low". Allowed: low, medium, high, auto.`,
    );
  }
  return "low";
}

function isTruthyEnv(v) {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}

/**
 * Best-effort runtime region for Cloud Functions / Cloud Run / generic hosts.
 * @returns {string}
 */
function resolveRuntimeRegion() {
  return (
    process.env.FUNCTION_REGION ||
    process.env.GOOGLE_CLOUD_REGION ||
    process.env.AWS_REGION ||
    process.env.REGION ||
    ""
  ).trim();
}

/**
 * If STRICT_LATENCY_MODE is on, warn when not deployed in a US `*-` GCP region.
 */
function maybeWarnStrictLatencyRegion() {
  if (!isTruthyEnv(process.env.STRICT_LATENCY_MODE)) return;
  const region = resolveRuntimeRegion();
  if (!region) {
    console.warn(
      "[OpenAIImage][STRICT_LATENCY_MODE] Could not detect runtime region " +
        "(FUNCTION_REGION / GOOGLE_CLOUD_REGION / AWS_REGION / REGION). " +
        "Deploy to a US region (e.g. us-east1) for lower RTT to OpenAI.",
    );
    return;
  }
  const r = region.toLowerCase();
  const isUsGcp = /^us-/.test(r);
  if (!isUsGcp) {
    console.warn(
      `[OpenAIImage][STRICT_LATENCY_MODE] Runtime region="${region}" is not a US GCP region ` +
        "(expected prefix `us-`, e.g. us-east1 North Virginia). Large image stream packets pay full RTT per hop.",
    );
  }
}

/**
 * OpenAI `partial_images` for streaming (0–3). We always request **3** (the maximum)
 * so the server may emit up to three progressive frames; it may still emit fewer
 * before `image_generation.completed` (API behavior — not configurable).
 * @returns {3}
 */
function resolvePartialImagesCount() {
  return 3;
}

/**
 * Image model id for streaming generation.
 * If `options.size` is set to a non-native value without an explicit override,
 * logs once so callers keep latency predictable (actual size enforced in {@link resolvePosterImageSize}).
 * @param {object} [options]
 * @param {string} [options.size]
 * @param {boolean} [options.allowNonNativeImageSize]
 */
function resolveImageModel(options = {}) {
  const model = (process.env.OPENAI_IMAGE_MODEL || "gpt-image-2").trim() || "gpt-image-2";
  const optSize = options.size;
  if (
    typeof optSize === "string" &&
    optSize.trim() &&
    optSize.trim() !== NATIVE_POSTER_IMAGE_SIZE
  ) {
    const envOverride = Boolean(process.env.OPENAI_IMAGE_SIZE?.trim());
    if (options.allowNonNativeImageSize !== true && !envOverride) {
      console.warn(
        `[OpenAIImage] options.size="${optSize}" will be normalized to ${NATIVE_POSTER_IMAGE_SIZE} for latency ` +
          "(set OPENAI_IMAGE_SIZE or options.allowNonNativeImageSize to force a different size).",
      );
    }
  }
  return model;
}

/**
 * Prefer native **1024x1024** for minimum generation latency and stream payload size.
 * Override: `OPENAI_IMAGE_SIZE` env, or `options.allowNonNativeImageSize` + `options.size`.
 * @param {object} [options]
 * @param {string} [options.size]
 * @param {boolean} [options.allowNonNativeImageSize]
 * @returns {string}
 */
function resolvePosterImageSize(options = {}) {
  const envSize = process.env.OPENAI_IMAGE_SIZE?.trim();
  if (envSize) return envSize;

  const optSize = typeof options.size === "string" ? options.size.trim() : "";
  if (optSize && options.allowNonNativeImageSize === true) {
    return optSize;
  }
  if (optSize && optSize !== NATIVE_POSTER_IMAGE_SIZE) {
    console.warn(
      `[OpenAIImage] Ignoring options.size="${optSize}"; using ${NATIVE_POSTER_IMAGE_SIZE} for latency. ` +
        "Set OPENAI_IMAGE_SIZE or options.allowNonNativeImageSize: true to override.",
    );
  }
  return NATIVE_POSTER_IMAGE_SIZE;
}

/**
 * `input_fidelity` for image edit — supported on `gpt-image-1` / `gpt-image-1.5` (not mini).
 * Omit for other models unless `OPENAI_IMAGE_INPUT_FIDELITY` is `high` or `low`.
 */
function resolveOpenAiEditInputFidelity(model) {
  const raw = process.env.OPENAI_IMAGE_INPUT_FIDELITY?.trim().toLowerCase();
  if (raw === "high" || raw === "low") return raw;
  if (raw === "off" || raw === "0" || raw === "false") return null;
  const m = String(model).toLowerCase();
  if (
    m.includes("gpt-image-1.5") ||
    (m.includes("gpt-image-1") && !m.includes("mini"))
  ) {
    return "high";
  }
  return null;
}

/**
 * Streaming image generation (GPT image models).
 *
 * When `options.honoreeReference` is set (`buffer` + `mimeType`), uses **images.edit**
 * so the honoree photo is an actual image input (`input_fidelity` when supported).
 *
 * @param {string} promptText
 * @param {object} [options]
 * @param {string} [options.model]
 * @param {string} [options.size]
 * @param {boolean} [options.allowNonNativeImageSize]
 * @param {'low'|'medium'|'high'|'auto'} [options.quality]
 * @param {{ buffer: Buffer, mimeType?: string } | null} [options.honoreeReference]
 */
async function createFinalPosterStream(promptText, options = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !String(apiKey).trim()) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  maybeWarnStrictLatencyRegion();

  const client = new OpenAI({ apiKey: String(apiKey).trim() });
  const model = options.model ?? resolveImageModel(options);
  const partial_images = resolvePartialImagesCount();
  const size = resolvePosterImageSize(options);
  const quality = resolveImageQuality(options);

  const honoree = options.honoreeReference;
  if (
    honoree &&
    Buffer.isBuffer(honoree.buffer) &&
    honoree.buffer.length > 0
  ) {
    const mime =
      typeof honoree.mimeType === "string" && honoree.mimeType.trim()
        ? honoree.mimeType.trim()
        : "image/jpeg";
    const ext = mime.includes("png")
      ? "png"
      : mime.includes("webp")
        ? "webp"
        : "jpg";
    const imageFile = await toFile(honoree.buffer, `honoree.${ext}`, {
      type: mime,
    });

    const fidelity = resolveOpenAiEditInputFidelity(model);

    console.log(
      `[OpenAIImage] stream edit (honoree reference): model=${model} partial_images=${partial_images} size=${size} quality=${quality}` +
        (fidelity ? ` input_fidelity=${fidelity}` : "") +
        " — emits image_edit.* stream events.",
    );

    /** @type {import("openai/resources").ImagesAPI.ImageEditParamsStreaming} */
    const editBody = {
      image: imageFile,
      prompt: typeof promptText === "string" ? promptText.trim() : "",
      model,
      stream: true,
      partial_images,
      size,
      quality,
      output_format: "png",
    };
    if (fidelity) editBody.input_fidelity = fidelity;

    return client.images.edit(editBody);
  }

  console.log(
    `[OpenAIImage] stream request: model=${model} partial_images=${partial_images} size=${size} quality=${quality} ` +
      "(OpenAI may emit fewer partial_image events than partial_images if the final image finishes sooner — see API note on partial_images.)",
  );

  return client.images.generate({
    prompt: promptText,
    model,
    stream: true,
    partial_images,
    /** Native square path — see LATENCY OPTIMIZATION NOTE at top of file. */
    size,
    /** GPT image: `low` | `medium` | `high` | `auto` only (default `low`). */
    quality,
    output_format: "png",
  });
}

/**
 * Iterate OpenAI image stream; yields decoded PNG buffers for partials and the final image.
 * Partials include `elapsedMsSinceStreamStart` and `deltaMsSincePreviousPartial` for observability.
 *
 * @param {string} promptText
 * @param {object} [options]
 * @returns {AsyncGenerator<
 *   | { kind: 'partial', index: number, buffer: Buffer, elapsedMsSinceStreamStart: number, deltaMsSincePreviousPartial: number }
 *   | { kind: 'final', buffer: Buffer },
 *   void,
 *   void
 * >}
 */
async function* streamFinalPosterBuffers(promptText, options = {}) {
  const streamStart = performance.now();
  const stream = await createFinalPosterStream(promptText, options);
  let lastClock = streamStart;
  let sawFinal = false;

  for await (const event of stream) {
    if (isOpenAiImageStreamPartialEvent(event)) {
      const now = performance.now();
      const elapsedMsSinceStreamStart = Math.round(now - streamStart);
      const deltaMsSincePreviousPartial = Math.round(now - lastClock);
      lastClock = now;
      const index = event.partial_image_index;
      console.log(
        `[OpenAIImage] Partial${index + 1}: elapsedSinceStreamStart=${elapsedMsSinceStreamStart}ms intervalSincePrev=${deltaMsSincePreviousPartial}ms (partial_image_index=${index})`,
      );
      yield {
        kind: "partial",
        index,
        buffer: Buffer.from(event.b64_json, "base64"),
        elapsedMsSinceStreamStart,
        deltaMsSincePreviousPartial,
      };
    } else if (isOpenAiImageStreamCompletedEvent(event)) {
      sawFinal = true;
      yield {
        kind: "final",
        buffer: Buffer.from(event.b64_json, "base64"),
      };
    }
  }

  if (!sawFinal) {
    throw new Error(
      "OpenAI image stream ended without image_generation.completed / image_edit.completed",
    );
  }
}

module.exports = {
  createFinalPosterStream,
  streamFinalPosterBuffers,
  resolvePartialImagesCount,
  resolveImageModel,
  resolvePosterImageSize,
  resolveImageQuality,
};
