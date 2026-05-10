/**
 * Vertex Imagen (text-to-image) via Prediction API.
 * Progressive previews use `:streamRawPredict` with the same publisher-model endpoint
 * as unary `:predict` (JSON instances/parameters). Unary `serverStreamingPredict` in the
 * Node client targets Tensor `inputs`, which does not match Imagen JSON payloads.
 * @see https://cloud.google.com/vertex-ai/generative-ai/docs/reference/rest/v1/projects.locations.publishers.models/streamRawPredict
 */

const aiplatform = require("@google-cloud/aiplatform");
const { PredictionServiceClient } = aiplatform.v1;
const { helpers } = aiplatform;

/** Rough prompt cap for predict payloads (Imagen model limits vary). */
const MAX_IMAGEN_PROMPT_CHARS = 4000;

/** Default publisher ids — parallel skeleton (fast) + final (ultra). */
const DEFAULT_IMAGEN_SKELETON_MODEL = "imagen-3.0-fast-generate-001";
const DEFAULT_IMAGEN_FINAL_MODEL = "imagen-4.0-ultra-generate-001";

/** Reuse gRPC channels per regional endpoint (TLS handshake amortization). */
const predictionClientsByEndpoint = new Map();

function getPredictionClient(apiEndpoint) {
  let client = predictionClientsByEndpoint.get(apiEndpoint);
  if (!client) {
    client = new PredictionServiceClient({ apiEndpoint });
    predictionClientsByEndpoint.set(apiEndpoint, client);
  }
  return client;
}

function resolveVertexImagenSkeletonModelId() {
  const fromEnv = process.env.VERTEX_IMAGEN_SKELETON_MODEL;
  if (typeof fromEnv === "string" && fromEnv.trim()) return fromEnv.trim();
  return DEFAULT_IMAGEN_SKELETON_MODEL;
}

/** Ultra final; `VERTEX_IMAGEN_MODEL` aliases final when callers omit explicit vertexModelId. */
function resolveVertexImagenFinalModelId() {
  const primary =
    process.env.VERTEX_IMAGEN_FINAL_MODEL || process.env.VERTEX_IMAGEN_MODEL;
  if (typeof primary === "string" && primary.trim()) return primary.trim();
  return DEFAULT_IMAGEN_FINAL_MODEL;
}

function resolveGcpProjectId() {
  return (
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    process.env.GCP_PROJECT ||
    ""
  ).trim();
}

function isImagenFallbackEnabled() {
  const v = process.env.VERTEX_IMAGEN_ENABLED;
  if (v === "0" || v === "false" || v === "off") return false;
  return true;
}

function isVertexStreamingEnabled() {
  const v = process.env.VERTEX_IMAGEN_STREAMING;
  if (v === "0" || v === "false" || v === "off") return false;
  return true;
}

/**
 * Build REST JSON body for Imagen (matches VisionGenerativeModelInstance / Params).
 * @param {string} prompt
 * @param {{ extraParameters?: Record<string, unknown> }} [opts]
 */
function buildImagenRestPredictBody(prompt, opts = {}) {
  const aspectRatio = (process.env.VERTEX_IMAGEN_ASPECT_RATIO || "9:16").trim();
  const addWatermark = process.env.VERTEX_IMAGEN_WATERMARK !== "0";
  const parameters = {
    sampleCount: 1,
    aspectRatio,
    addWatermark,
    safetyFilterLevel: "block_some",
    personGeneration: "allow_all",
    includeProgressiveOutputs: true,
    include_progressive_outputs: true,
    ...(opts.extraParameters && typeof opts.extraParameters === "object"
      ? opts.extraParameters
      : {}),
  };
  return {
    instances: [{ prompt }],
    parameters,
  };
}

/**
 * Extract base64 image from Predict REST JSON (unary or streamed chunk).
 * @param {unknown} json
 * @returns {string|null}
 */
function extractBytesBase64FromPredictJson(json) {
  if (!json || typeof json !== "object") return null;
  const preds = json.predictions;
  if (!Array.isArray(preds) || preds.length === 0) return null;
  const p = preds[0];
  if (!p || typeof p !== "object") return null;
  if (typeof p.bytesBase64Encoded === "string") return p.bytesBase64Encoded;
  const nested =
    p.structValue?.fields?.bytesBase64Encoded?.stringValue ?? null;
  if (typeof nested === "string") return nested;
  return null;
}

/**
 * Publisher Imagen models often reject streamRawPredict with FAILED_PRECONDITION.
 */
function isStreamRawPredictUnsupportedError(err) {
  if (!err || typeof err !== "object") return false;
  const msg = String(err.message || "");
  /** gRPC 9 = FAILED_PRECONDITION — Vertex rejects streaming for many publisher models. */
  const code = err.code ?? err.status;
  if (code === 9 && /streamRawPredict is not supported/i.test(msg)) return true;
  if (/streamRawPredict is not supported/i.test(msg)) return true;
  return false;
}

function httpBodyToUtf8(httpBody) {
  if (!httpBody?.data) return "";
  const d = httpBody.data;
  if (Buffer.isBuffer(d)) return d.toString("utf8");
  if (d instanceof Uint8Array) return Buffer.from(d).toString("utf8");
  if (typeof d === "string") return d;
  return Buffer.from(d).toString("utf8");
}

/**
 * gRPC-web streaming responses may not expose Symbol.asyncIterator on older runtimes.
 * @param {import("stream").Readable} stream
 */
async function* asyncIterableFromGaxServerStream(stream) {
  if (stream && typeof stream[Symbol.asyncIterator] === "function") {
    for await (const chunk of stream) {
      yield chunk;
    }
    return;
  }
  const queue = [];
  let streamEnded = false;
  let streamError = null;
  let resume = () => {};

  stream.on("data", (chunk) => {
    queue.push(chunk);
    resume();
  });
  stream.on("end", () => {
    streamEnded = true;
    resume();
  });
  stream.on("error", (err) => {
    streamError = err;
    resume();
  });

  while (!streamEnded || queue.length > 0) {
    if (streamError) throw streamError;
    if (queue.length > 0) {
      yield queue.shift();
    } else if (!streamEnded) {
      await new Promise((resolve) => {
        resume = () => {
          resume = () => {};
          resolve();
        };
      });
    }
  }
  if (streamError) throw streamError;
}

/**
 * Stream PNG buffers from Vertex Imagen progressive generation (streamRawPredict).
 * Falls back to empty iteration if streaming is disabled or fails early (caller may unary predict).
 *
 * @param {string} promptText
 * @param {{ vertexModelId?: string, extraParameters?: Record<string, unknown> }} [callOptions]
 * @returns {AsyncGenerator<Buffer, void, void>}
 */
async function* streamPosterBuffersWithVertexImagen(promptText, callOptions = {}) {
  if (!isImagenFallbackEnabled()) {
    return;
  }

  const projectId = resolveGcpProjectId();
  if (!projectId) {
    console.warn(
      "[VertexImagen] Stream skipped: no GOOGLE_CLOUD_PROJECT / GCLOUD_PROJECT / GCP_PROJECT",
    );
    return;
  }

  if (!isVertexStreamingEnabled()) {
    return;
  }

  const location = (process.env.VERTEX_LOCATION || "us-central1").trim();
  const fromCall =
    typeof callOptions.vertexModelId === "string"
      ? callOptions.vertexModelId.trim()
      : "";
  const modelId = (
    fromCall ||
    process.env.VERTEX_IMAGEN_MODEL ||
    DEFAULT_IMAGEN_FINAL_MODEL
  ).trim();

  let prompt = typeof promptText === "string" ? promptText.trim() : "";
  if (!prompt) return;
  if (prompt.length > MAX_IMAGEN_PROMPT_CHARS) {
    prompt = prompt.slice(0, MAX_IMAGEN_PROMPT_CHARS).trimEnd();
  }

  const apiEndpoint = `${location}-aiplatform.googleapis.com`;
  const endpoint = `projects/${projectId}/locations/${location}/publishers/google/models/${modelId}`;
  const client = getPredictionClient(apiEndpoint);

  const bodyJson = buildImagenRestPredictBody(prompt, {
    extraParameters: callOptions.extraParameters,
  });
  const payload = Buffer.from(JSON.stringify(bodyJson), "utf8");

  const stream = client.streamRawPredict({
    endpoint,
    httpBody: {
      contentType: "application/json",
      data: payload,
    },
  });

  try {
    for await (const httpBody of asyncIterableFromGaxServerStream(stream)) {
      const utf8 = httpBodyToUtf8(httpBody);
      if (!utf8 || !utf8.trim()) continue;
      let json;
      try {
        json = JSON.parse(utf8);
      } catch {
        continue;
      }
      const b64 = extractBytesBase64FromPredictJson(json);
      if (b64) {
        yield Buffer.from(b64, "base64");
      }
    }
  } catch (err) {
    if (isStreamRawPredictUnsupportedError(err)) {
      console.info(
        "[VertexImagen] streamRawPredict not supported for this model/API — using unary predict fallback (expected for publisher Imagen).",
      );
      return;
    }
    console.warn(`[VertexImagen] streamRawPredict iteration error: ${err.message}`);
    throw err;
  }
}

/**
 * Unary predict (legacy path / fallback).
 * @param {string} promptText
 * @param {{ vertexModelId?: string }} [callOptions]
 * @returns {Promise<Buffer|null>} PNG bytes or null if skipped / no image
 */
async function generatePosterBufferWithVertexImagen(promptText, callOptions = {}) {
  if (!isImagenFallbackEnabled()) {
    return null;
  }

  const projectId = resolveGcpProjectId();
  if (!projectId) {
    console.warn(
      "[VertexImagen] Skipped: no GOOGLE_CLOUD_PROJECT / GCLOUD_PROJECT / GCP_PROJECT",
    );
    return null;
  }

  const location = (process.env.VERTEX_LOCATION || "us-central1").trim();
  const fromCall =
    typeof callOptions.vertexModelId === "string"
      ? callOptions.vertexModelId.trim()
      : "";
  const modelId = (
    fromCall ||
    process.env.VERTEX_IMAGEN_MODEL ||
    DEFAULT_IMAGEN_FINAL_MODEL
  ).trim();
  const aspectRatio = (
    process.env.VERTEX_IMAGEN_ASPECT_RATIO || "9:16"
  ).trim();
  const addWatermark = process.env.VERTEX_IMAGEN_WATERMARK !== "0";

  let prompt = typeof promptText === "string" ? promptText.trim() : "";
  if (!prompt) return null;
  if (prompt.length > MAX_IMAGEN_PROMPT_CHARS) {
    prompt = prompt.slice(0, MAX_IMAGEN_PROMPT_CHARS).trimEnd();
  }

  const apiEndpoint = `${location}-aiplatform.googleapis.com`;
  const client = getPredictionClient(apiEndpoint);
  const endpoint = `projects/${projectId}/locations/${location}/publishers/google/models/${modelId}`;

  const instance = helpers.toValue({ prompt });
  const parameters = helpers.toValue({
    sampleCount: 1,
    aspectRatio,
    addWatermark,
    safetyFilterLevel: "block_some",
    personGeneration: "allow_all",
  });

  const [response] = await client.predict({
    endpoint,
    instances: [instance],
    parameters,
  });

  const predictions = response.predictions || [];
  if (predictions.length === 0) {
    console.warn("[VertexImagen] No predictions in response");
    return null;
  }

  const b64 =
    predictions[0].structValue?.fields?.bytesBase64Encoded?.stringValue;
  if (!b64) {
    console.warn("[VertexImagen] Missing bytesBase64Encoded in prediction");
    return null;
  }

  return Buffer.from(b64, "base64");
}

/**
 * Collect final buffer from progressive stream, or null if empty (caller should unary predict).
 * @param {string} promptText
 * @param {{ vertexModelId?: string }} [callOptions]
 * @returns {Promise<Buffer|null>}
 */
async function generatePosterBufferWithVertexImagenStreamLast(
  promptText,
  callOptions = {},
) {
  let last = null;
  try {
    for await (const buf of streamPosterBuffersWithVertexImagen(
      promptText,
      callOptions,
    )) {
      if (buf && buf.length > 0) last = buf;
    }
  } catch (e) {
    console.warn(`[VertexImagen] stream collect failed: ${e.message}`);
    return null;
  }
  return last;
}

module.exports = {
  streamPosterBuffersWithVertexImagen,
  generatePosterBufferWithVertexImagen,
  generatePosterBufferWithVertexImagenStreamLast,
  resolveGcpProjectId,
  isImagenFallbackEnabled,
  resolveVertexImagenSkeletonModelId,
  resolveVertexImagenFinalModelId,
};
