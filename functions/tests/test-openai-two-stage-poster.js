#!/usr/bin/env node
/**
 * OpenAI two-stage poster benchmark (local dev / QA):
 *
 * **Stage 1 — fast skeleton / preview** (text-only `images.generate`, streaming):
 *   - Default model: `gpt-image-1-mini` (override `OPENAI_TWO_STAGE_SKELETON_MODEL` or `--skeleton-model=`)
 *   - Default quality: `low`, size: `1024x1024` (smallest square supported by GPT image generate API)
 *
 * **Stage 2 — final poster + likeness** (`images.edit` with honoree face reference):
 *   - Default model: `gpt-image-2` (override `OPENAI_TWO_STAGE_FINAL_MODEL` or `--final-model=`)
 *   - Default quality: `high`
 *   - Downloads **`honoreeFaceCropUrl`** from the event (or `--face-crop-url=`) and passes bytes as `honoreeReference` (same path as production OpenAI final).
 *
 * Prints wall-clock duration per stage, prints **full Stage 1 / Stage 2 prompts** (for OpenAI
 * playground copy-paste), writes PNGs + `urls.json` / `urls.txt` + `prompt-stage1-skeleton.txt` /
 * `prompt-stage2-final.txt` under `functions/tests/temp-images/openai-two-stage-<runId>/`
 * (includes `honoreeFaceCropUrl`, `honoreePhotoUrl` when present). Also writes
 * **`crop-url-sent-to-openai.txt`** — the exact URL whose bytes are passed as `honoreeReference`
 * (from event `honoreeFaceCropUrl` or `--face-crop-url=`).
 *
 * From repo root:
 *   node functions/tests/test-openai-two-stage-poster.js --event-id=<id> --use-firestore-prompts
 *   OPENAI_TWO_STAGE_PROMPT="..." node functions/tests/test-openai-two-stage-poster.js --event-id=<id>
 *   node functions/tests/test-openai-two-stage-poster.js --event-id=<id> --skip-skeleton --face-crop-url=https://...
 *
 * Requires: `OPENAI_API_KEY`, `functions/.env` + root `.env` as usual; Firestore read needs
 * `firebaseserviceAccountKey.json` at repo root (same as other function tests).
 */

const fs = require("fs");
const path = require("path");
const { performance } = require("perf_hooks");

require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
  override: true,
});

const axios = require("axios");

const argv = process.argv.slice(2);

function argValue(prefix) {
  const hit = argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length).trim() : "";
}

const EVENT_ID =
  argValue("--event-id=") ||
  process.env.POSTER_E2E_EXISTING_EVENT_ID?.trim() ||
  process.env.OPENAI_TWO_STAGE_EVENT_ID?.trim() ||
  "";
const USE_FS_PROMPTS = argv.includes("--use-firestore-prompts");
const SKIP_SKELETON = argv.includes("--skip-skeleton");
const FACE_CROP_URL_ARG = argValue("--face-crop-url=");

const SKELETON_MODEL =
  argValue("--skeleton-model=") ||
  process.env.OPENAI_TWO_STAGE_SKELETON_MODEL?.trim() ||
  "gpt-image-1-mini";
const FINAL_MODEL =
  argValue("--final-model=") ||
  process.env.OPENAI_TWO_STAGE_FINAL_MODEL?.trim() ||
  "gpt-image-2";

const SKELETON_QUALITY =
  argValue("--skeleton-quality=") ||
  process.env.OPENAI_TWO_STAGE_SKELETON_QUALITY?.trim() ||
  "low";
const FINAL_QUALITY =
  argValue("--final-quality=") ||
  process.env.OPENAI_TWO_STAGE_FINAL_QUALITY?.trim() ||
  "high";

/** Native square for both stages (API does not expose smaller sizes for GPT image generate/edit in current SDK). */
const IMAGE_SIZE =
  argValue("--size=") || process.env.OPENAI_TWO_STAGE_IMAGE_SIZE?.trim() || "1024x1024";

const PROJECT_ID = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "piggybank-a0011";
process.env.GCLOUD_PROJECT = PROJECT_ID;
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(
  __dirname,
  "..",
  "..",
  "firebaseserviceAccountKey.json",
);

/** Kept in sync with {@link file://./../services/aiService.js} `buildImagenPrompt` honoree branch. */
const FINAL_POSTER_TYPOGRAPHY_PREFIX =
  "[Poster typography] Spell names and titles exactly as in the brief; large legible letterforms, strong contrast, generous margins. Avoid tiny blocks, warped or mirrored letters, nonsense glyphs, overlapping characters, or misspelled words.\n\n";

const FACE_ONLY_FINAL_SUFFIX =
  "\n\nFACE-ONLY REFERENCE (IMAGE INPUT): The API receives a **cropped face** derived from the uploaded honoree photo (Vision/heuristic crop). Preserve likeness—face shape, hair, skin tone, and age-appropriate appearance—for the focal illustrated portrait. Integrate into the full invitation poster layout, typography, lighting, and scene described above (do not output the raw snapshot as the entire poster).";

function usageDie(msg) {
  if (msg) console.error(msg);
  console.error(`
Usage:
  node functions/tests/test-openai-two-stage-poster.js --event-id=<FirestoreEventId> --use-firestore-prompts
  # or pass prompt via env (skips --use-firestore-prompts):
  OPENAI_TWO_STAGE_PROMPT="..." node functions/tests/test-openai-two-stage-poster.js --event-id=<id>

Options:
  --skip-skeleton              Only run Stage 2 (final + face edit)
  --face-crop-url=<https...> Override event.honoreeFaceCropUrl
  --skeleton-model=...         default gpt-image-1-mini (or gpt-image-2 for a faster-but-larger model)
  --final-model=...            default gpt-image-2
  --skeleton-quality=low|medium|high|auto
  --final-quality=...
  --size=1024x1024|...        default 1024x1024
`);
  process.exit(1);
}

/**
 * @param {string} url
 * @returns {Promise<{ buffer: Buffer, contentType: string }>}
 */
async function fetchUrlToBuffer(url) {
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 120_000,
    maxContentLength: 25 * 1024 * 1024,
    validateStatus: (s) => s >= 200 && s < 400,
  });
  const buf = Buffer.isBuffer(res.data) ? res.data : Buffer.from(res.data);
  const ct =
    (typeof res.headers["content-type"] === "string" && res.headers["content-type"]) ||
    "application/octet-stream";
  return { buffer: buf, contentType: ct.split(";")[0].trim() };
}

/**
 * @param {string} imagePrompt
 * @param {boolean} hasFaceRef
 */
function buildFinalOpenAiPrompt(imagePrompt, hasFaceRef) {
  let p = FINAL_POSTER_TYPOGRAPHY_PREFIX + imagePrompt;
  if (hasFaceRef) p += FACE_ONLY_FINAL_SUFFIX;
  return p;
}

/**
 * Drains OpenAI image stream until the final frame. **Wall time is often 1–8+ minutes** for
 * `images.edit` + `gpt-image-2` + `high` (large payloads, many partials) — without heartbeats
 * this looks “stuck”; OpenAI’s own SDK does not apply a short client timeout here.
 *
 * @param {AsyncGenerator<{ kind: string, buffer?: Buffer }>} gen
 * @param {{ label?: string, heartbeatSec?: number }} [opts]
 * @returns {Promise<{ finalBuffer: Buffer, partialCount: number, ms: number }>}
 */
async function drainImageStream(gen, opts = {}) {
  const label = opts.label || "openai-image";
  const heartbeatSec = typeof opts.heartbeatSec === "number" ? opts.heartbeatSec : 45;
  const t0 = performance.now();
  let partialCount = 0;
  /** @type {Buffer|null} */
  let finalBuffer = null;

  let lastProgress = t0;
  /** @type {ReturnType<typeof setInterval> | null} */
  let hb = null;
  if (heartbeatSec > 0) {
    hb = setInterval(() => {
      const elapsedSec = Math.round((performance.now() - t0) / 1000);
      const sincePartialSec = Math.round((performance.now() - lastProgress) / 1000);
      console.log(
        `[openai-two-stage] ${label}: still waiting on OpenAI stream… ${elapsedSec}s elapsed (last stream activity ~${sincePartialSec}s ago, partials so far=${partialCount}). Stage 2 edit + high quality often takes several minutes.`,
      );
    }, heartbeatSec * 1000);
  }

  try {
    for await (const chunk of gen) {
      lastProgress = performance.now();
      if (chunk.kind === "partial") partialCount += 1;
      if (chunk.kind === "final" && chunk.buffer) finalBuffer = chunk.buffer;
    }
  } finally {
    if (hb) clearInterval(hb);
  }

  const ms = Math.round(performance.now() - t0);
  if (!finalBuffer || finalBuffer.length === 0) {
    throw new Error("OpenAI image stream ended without a final buffer");
  }
  return { finalBuffer, partialCount, ms };
}

async function main() {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    usageDie("OPENAI_API_KEY is not set (add to functions/.env).");
  }
  if (!EVENT_ID) usageDie("Missing --event-id= (or POSTER_E2E_EXISTING_EVENT_ID / OPENAI_TWO_STAGE_EVENT_ID).");

  const sa = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!sa || !fs.existsSync(sa)) {
    usageDie(`Missing service account JSON: ${sa || "(unset)"}`);
  }

  let posterPrompt = (process.env.OPENAI_TWO_STAGE_PROMPT || "").trim();
  if (!posterPrompt && !USE_FS_PROMPTS) {
    usageDie("Provide --use-firestore-prompts (event.posterPrompt) or set OPENAI_TWO_STAGE_PROMPT.");
  }

  const admin = require("firebase-admin");
  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  const db = admin.firestore();
  const snap = await db.collection("events").doc(EVENT_ID).get();
  if (!snap.exists) usageDie(`Event not found: events/${EVENT_ID}`);
  const data = snap.data() || {};

  if (USE_FS_PROMPTS || posterPrompt.length < 10) {
    const fromFs =
      typeof data.posterPrompt === "string" ? data.posterPrompt.trim() : "";
    if (USE_FS_PROMPTS && fromFs.length < 10) {
      usageDie(
        "event.posterPrompt is missing or shorter than 10 characters; run full poster generation first or set OPENAI_TWO_STAGE_PROMPT.",
      );
    }
    if (fromFs.length >= 10) {
      posterPrompt = fromFs;
      if (USE_FS_PROMPTS && fromFs.length < 100) {
        console.warn(
          `[openai-two-stage] event.posterPrompt is only ${fromFs.length} chars (production briefs are often longer).`,
        );
      }
    }
  }
  if (posterPrompt.length < 10) {
    usageDie("posterPrompt must be at least 10 characters (Firestore or OPENAI_TWO_STAGE_PROMPT).");
  }

  const honoreePhotoUrl =
    typeof data.honoreePhotoUrl === "string" ? data.honoreePhotoUrl.trim() : "";
  let honoreeFaceCropUrl =
    FACE_CROP_URL_ARG ||
    (typeof data.honoreeFaceCropUrl === "string" && data.honoreeFaceCropUrl.trim()) ||
    "";
  if (!honoreeFaceCropUrl) {
    usageDie(
      "No honoreeFaceCropUrl on event; generate a poster once to populate it, or pass --face-crop-url=https://...",
    );
  }

  const aiService = require(path.join(__dirname, "..", "services", "aiService"));
  const openAIImageService = require(path.join(__dirname, "..", "services", "openAIImageService"));

  const runId = `${Date.now()}`;
  const outDir = path.join(__dirname, "temp-images", `openai-two-stage-${runId}`);
  await fs.promises.mkdir(outDir, { recursive: true });

  console.log(`[openai-two-stage] eventId=${EVENT_ID}`);
  console.log(`[openai-two-stage] output dir: ${outDir}`);
  console.log(`[openai-two-stage] honoreeFaceCropUrl=${honoreeFaceCropUrl}`);

  const tFetch0 = performance.now();
  const { buffer: faceCropBuffer, contentType: faceContentType } =
    await fetchUrlToBuffer(honoreeFaceCropUrl);
  const fetchFaceMs = Math.round(performance.now() - tFetch0);
  console.log(
    `[openai-two-stage] downloaded face crop: bytes=${faceCropBuffer.length} contentType=${faceContentType} durationMs=${fetchFaceMs}`,
  );

  const cropUrlSentPath = path.join(outDir, "crop-url-sent-to-openai.txt");
  await fs.promises.writeFile(cropUrlSentPath, `${honoreeFaceCropUrl}\n`, "utf8");
  console.log(
    `[openai-two-stage] saved reference download URL for OpenAI edit: ${path.basename(cropUrlSentPath)}`,
  );

  const mimeType =
    faceContentType === "image/png"
      ? "image/png"
      : faceContentType === "image/webp"
        ? "image/webp"
        : faceContentType === "image/jpeg" || faceContentType === "image/jpg"
          ? "image/jpeg"
          : "image/png";

  /** Stage 1: text-only “skeleton” (no reference image — matches fast preview intent). */
  const skeletonPrompt = aiService.buildSkeletonWithTextImagenPromptBody(
    false,
    posterPrompt,
  );
  const finalPrompt = buildFinalOpenAiPrompt(posterPrompt, true);

  const promptSkPath = path.join(outDir, "prompt-stage1-skeleton.txt");
  const promptFinPath = path.join(outDir, "prompt-stage2-final.txt");
  await fs.promises.writeFile(promptSkPath, skeletonPrompt, "utf8");
  await fs.promises.writeFile(promptFinPath, finalPrompt, "utf8");

  const bar = "=".repeat(72);
  console.log(`\n${bar}`);
  console.log(
    "PLAYGROUND — Stage 1 (images.generate): paste as prompt. No reference image.",
  );
  console.log(`${bar}\n`);
  console.log(skeletonPrompt);
  console.log(`\n${bar}\n`);

  console.log(`${bar}`);
  console.log(
    "PLAYGROUND — Stage 2 (images.edit): paste as prompt + upload face crop image.",
  );
  console.log(`Face image URL (download & upload in playground):\n${honoreeFaceCropUrl}`);
  console.log(`${bar}\n`);
  console.log(finalPrompt);
  console.log(`\n${bar}`);
  console.log(
    `[openai-two-stage] prompts saved: ${path.basename(promptSkPath)}, ${path.basename(promptFinPath)}`,
  );

  /** @type {{ stage: string, model: string, quality: string, size: string, durationMs: number, partialCount: number, outputFile: string }|null} */
  let skeletonMeta = null;

  if (!SKIP_SKELETON) {
    console.log(
      `[openai-two-stage] Stage 1 skeleton: model=${SKELETON_MODEL} quality=${SKELETON_QUALITY} size=${IMAGE_SIZE} (generate, no honoree image)`,
    );
    console.log(
      "[openai-two-stage] Calling OpenAI (streaming). First log may be a partial or final; silence ≠ stuck.",
    );
    const skGen = openAIImageService.streamFinalPosterBuffers(skeletonPrompt, {
      model: SKELETON_MODEL,
      quality: /** @type {'low'|'medium'|'high'|'auto'} */ (SKELETON_QUALITY),
      size: IMAGE_SIZE,
      allowNonNativeImageSize: true,
    });
    const sk = await drainImageStream(skGen, { label: "Stage1-skeleton" });
    const skPath = path.join(outDir, "01-skeleton-final.png");
    await fs.promises.writeFile(skPath, sk.finalBuffer);
    skeletonMeta = {
      stage: "skeleton_generate",
      model: SKELETON_MODEL,
      quality: SKELETON_QUALITY,
      size: IMAGE_SIZE,
      durationMs: sk.ms,
      partialCount: sk.partialCount,
      outputFile: path.basename(skPath),
    };
    console.log(
      `[openai-two-stage] Stage 1 done: durationMs=${sk.ms} partials=${sk.partialCount} -> ${skPath}`,
    );
  } else {
    console.log("[openai-two-stage] Stage 1 skipped (--skip-skeleton)");
  }

  console.log(
    `[openai-two-stage] Stage 2 final: model=${FINAL_MODEL} quality=${FINAL_QUALITY} size=${IMAGE_SIZE} (images.edit + face crop)`,
  );
  console.log(
    "[openai-two-stage] Stage 2 is usually **much slower** than Stage 1 (reference image + higher quality + large streamed PNG). Expect roughly 2–10+ minutes; heartbeat logs every ~45s if quiet.",
  );
  const finGen = openAIImageService.streamFinalPosterBuffers(finalPrompt, {
    model: FINAL_MODEL,
    quality: /** @type {'low'|'medium'|'high'|'auto'} */ (FINAL_QUALITY),
    size: IMAGE_SIZE,
    allowNonNativeImageSize: true,
    honoreeReference: {
      buffer: faceCropBuffer,
      mimeType,
    },
  });
  const fin = await drainImageStream(finGen, { label: "Stage2-final-edit" });
  const finPath = path.join(outDir, "02-final-poster.png");
  await fs.promises.writeFile(finPath, fin.finalBuffer);
  console.log(
    `[openai-two-stage] Stage 2 done: durationMs=${fin.ms} partials=${fin.partialCount} -> ${finPath}`,
  );

  const payload = {
    eventId: EVENT_ID,
    runId,
    honoreeFaceCropUrl,
    honoreePhotoUrl: honoreePhotoUrl || undefined,
    faceCropFetchMs: fetchFaceMs,
    posterPromptChars: posterPrompt.length,
    skeleton: skeletonMeta,
    final: {
      stage: "final_edit",
      model: FINAL_MODEL,
      quality: FINAL_QUALITY,
      size: IMAGE_SIZE,
      durationMs: fin.ms,
      partialCount: fin.partialCount,
      outputFile: path.basename(finPath),
    },
    totalOpenAiMs:
      (skeletonMeta ? skeletonMeta.durationMs : 0) + fin.ms,
    promptFiles: {
      stage1Skeleton: "prompt-stage1-skeleton.txt",
      stage2Final: "prompt-stage2-final.txt",
    },
    /** Filename in this folder: exact HTTPS URL used to download bytes for OpenAI `images.edit`. */
    cropUrlSentToOpenAiFile: "crop-url-sent-to-openai.txt",
  };

  const jsonPath = path.join(outDir, "urls.json");
  await fs.promises.writeFile(jsonPath, JSON.stringify(payload, null, 2), "utf8");

  const txt = [
    `eventId=${EVENT_ID}`,
    `honoreeFaceCropUrl=${honoreeFaceCropUrl}`,
    honoreePhotoUrl ? `honoreePhotoUrl=${honoreePhotoUrl}` : "",
    skeletonMeta
      ? `skeleton: model=${skeletonMeta.model} quality=${skeletonMeta.quality} durationMs=${skeletonMeta.durationMs}`
      : "skeleton: skipped",
    `final: model=${FINAL_MODEL} quality=${FINAL_QUALITY} durationMs=${fin.ms}`,
    `outputs: ${outDir}`,
    `prompts: prompt-stage1-skeleton.txt, prompt-stage2-final.txt (also printed above)`,
    `openAi honoree image download URL: crop-url-sent-to-openai.txt`,
  ]
    .filter(Boolean)
    .join("\n");
  await fs.promises.writeFile(path.join(outDir, "urls.txt"), txt + "\n", "utf8");

  console.log(`[openai-two-stage] wrote ${jsonPath}`);
  console.log("[openai-two-stage] summary:\n" + txt);
}

main().catch((e) => {
  console.error("[openai-two-stage] FAILED:", e.message || e);
  process.exit(1);
});
