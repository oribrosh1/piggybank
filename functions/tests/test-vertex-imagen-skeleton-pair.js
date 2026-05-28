/**
 * Vertex Imagen skeleton pair — **no Firestore writes** (read-only event + honoree).
 *
 * Runs Stage A Gemini (poster brief + visual teaser) unless `--use-firestore-prompts` is set,
 * then generates **two** unary Vertex images using the same prompt bodies as production skeleton
 * previews (no-text vs with-text). Prints duration per image and writes PNGs under
 * `functions/tests/temp-images/`. The two Vertex calls run **in parallel** (`Promise.all`).
 *
 * When a honoree photo exists in Storage, its **pixels** are sent as `referenceImages` (raw) to
 * **Imagen 3 Instruct Customization** (`imagen-3.0-capability-001`, overridable via
 * `VERTEX_IMAGEN_CAPABILITY_MODEL`). Prompts are prefixed so they reference image `[1]` per Vertex docs.
 * Without a honoree photo, calls use **`imagen-3.0-fast-generate-001`** (text-only).
 *
 * From repo root:
 *   node functions/tests/test-vertex-imagen-skeleton-pair.js
 *   node functions/tests/test-vertex-imagen-skeleton-pair.js --event-id=OTHER_ID
 *   node functions/tests/test-vertex-imagen-skeleton-pair.js --use-firestore-prompts
 *
 * `--use-firestore-prompts` skips Gemini and uses `events/{id}.posterPrompt` (≥100 chars) plus
 * optional `visualTeaser` for the no-text branch (falls back to built-in teaser when missing).
 *
 * Requires: `functions/.env` (GEMINI unless using firestore prompts), service account JSON,
 * Vertex enabled (`VERTEX_IMAGEN_ENABLED` not `0`), GCP project env.
 */

const path = require("path");
const fs = require("fs");
const { performance } = require("perf_hooks");

require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", ".env"), override: true });

const argv = process.argv.slice(2);
const EVENT_FLAG =
    argv.find((a) => a.startsWith("--event-id="))?.slice("--event-id=".length)?.trim() ||
    process.env.POSTER_E2E_EXISTING_EVENT_ID?.trim() ||
    "nLXzXItL2caR6FJ5tReP";
const USE_FS_PROMPTS = argv.includes("--use-firestore-prompts");

const PROJECT_ID = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "piggybank-a0011";
process.env.GCLOUD_PROJECT = PROJECT_ID;
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(
    __dirname,
    "..",
    "..",
    "firebaseserviceAccountKey.json",
);

const IMAGEN_SKELETON_MODEL = "imagen-3.0-fast-generate-001";
const TEMP_DIR = path.join(__dirname, "temp-images");
const RUN_ID = Date.now();

function defaultStorageBucket() {
    const fromEnv =
        process.env.FUNCTIONS_STORAGE_BUCKET?.trim() ||
        process.env.FIREBASE_STORAGE_BUCKET?.trim() ||
        process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ||
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ||
        "";
    if (fromEnv) return fromEnv;
    return `${PROJECT_ID}.firebasestorage.app`;
}

const log = {
    info: (m, o) => console.log(`[${new Date().toISOString()}] ℹ️  ${m}`, o !== undefined ? o : ""),
    ok: (m) => console.log(`[${new Date().toISOString()}] ✅ ${m}`),
    fail: (m, e) => console.error(`[${new Date().toISOString()}] ❌ ${m}`, e || ""),
};

function usageDie(msg) {
    if (msg) console.error(msg);
    process.exit(1);
}

/** Vertex Instruct Customization requires `image [1]` when passing referenceId 1. */
function augmentPromptForInstructCustomizationWithHonoreeRef(prompt, hasRef) {
    if (!hasRef) return prompt;
    const prefix =
        "Transform the subject in image [1] according to the detailed instructions below. The reference is a **cropped face** from the child's photo—preserve facial likeness, hairstyle, skin tone, and age-appropriate appearance.\n\n";
    const combined = prefix + prompt;
    return combined.length > 4000 ? combined.slice(0, 4000) : combined;
}

async function main() {
    if (!fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
        usageDie(`Missing service account: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
    }
    if (!USE_FS_PROMPTS) {
        const k = process.env.GEMINI_API_KEY && String(process.env.GEMINI_API_KEY).trim();
        if (!k) usageDie("GEMINI_API_KEY missing (or pass --use-firestore-prompts).");
    }

    const admin = require("firebase-admin");
    if (!admin.apps.length) {
        admin.initializeApp({
            projectId: PROJECT_ID,
            storageBucket: defaultStorageBucket(),
        });
    }
    const adminDb = admin.firestore();

    const eventId = EVENT_FLAG;
    const snap = await adminDb.collection("events").doc(eventId).get();
    if (!snap.exists) usageDie(`Event not found: events/${eventId}`);
    const eventData = { id: snap.id, ...snap.data() };

    const storageRepository = require(path.join(__dirname, "..", "repositories", "storageRepository"));
    const aiService = require(path.join(__dirname, "..", "services", "aiService"));
    const vertexImagen = require(path.join(__dirname, "..", "services", "vertexImagenService"));
    const capabilityModelId = vertexImagen.resolveVertexImagenCapabilityModelId();

    let honoreeRef;
    try {
        honoreeRef = await storageRepository.readHonoreePhotoIfExists(eventId);
    } catch (e) {
        usageDie(`readHonoreePhotoIfExists failed: ${e.message}`);
    }
    const hasHonoree = Boolean(honoreeRef?.buffer?.length);
    if (hasHonoree) {
        try {
            const honoreeFaceCropService = require(path.join(
                __dirname,
                "..",
                "services",
                "honoreeFaceCropService",
            ));
            if (honoreeFaceCropService.isHonoreeFaceCropEnabled()) {
                const faceBuf = await honoreeFaceCropService.extractFaceReferencePng(
                    honoreeRef.buffer,
                    honoreeRef.mimeType,
                );
                if (faceBuf?.length) {
                    honoreeRef = { buffer: faceBuf, mimeType: "image/png" };
                    log.info(`Honoree face crop for test: ${faceBuf.length} bytes PNG (Vision or heuristic).`);
                }
            }
        } catch (e) {
            log.info(`Honoree face crop skipped, full upload used: ${e.message}`);
        }
    }
    if (!hasHonoree) {
        log.info("No honoree photo — text-only Vertex (fast); prompts omit reference-photo extra clauses.");
    } else {
        log.info(
            `Honoree image from Storage → face crop → Vertex referenceImages + ${capabilityModelId}.`,
        );
    }

    log.info(
        `Read-only test: no DB updates. Event=${eventId} vertexModel=${hasHonoree ? capabilityModelId : IMAGEN_SKELETON_MODEL}`,
    );

    let imagePrompt;
    let visualTeaserPatch;

    if (USE_FS_PROMPTS) {
        const pp =
            typeof eventData.posterPrompt === "string" ? eventData.posterPrompt.trim() : "";
        if (pp.length < 100) {
            usageDie(
                "--use-firestore-prompts requires events/{id}.posterPrompt with length ≥ 100 (run full generatePoster once or remove flag).",
            );
        }
        imagePrompt = pp;
        const vt =
            typeof eventData.visualTeaser === "string" && eventData.visualTeaser.trim().length >= 40
                ? eventData.visualTeaser.trim()
                : undefined;
        visualTeaserPatch = vt;
        log.info(`Using Firestore posterPrompt (${pp.length} chars) and visualTeaser=${vt ? `${vt.length} chars` : "(fallback in builder)"}`);
    } else {
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const stageAStart = performance.now();
        const stageA = await aiService.runPosterStageAParallelForTest(
            genAI,
            eventData,
            hasHonoree,
        );
        log.info(
            `Stage A (Gemini only, no writes) wallMs=${Math.round(performance.now() - stageAStart)}`,
        );
        imagePrompt = stageA.imagePrompt;
        visualTeaserPatch = stageA.visualTeaserPatch;
    }

    const promptNoText = aiService.buildSkeletonNoTextImagenPromptBody(
        eventData,
        hasHonoree,
        visualTeaserPatch,
    );
    const promptWithText = aiService.buildSkeletonWithTextImagenPromptBody(
        hasHonoree,
        imagePrompt,
    );

    log.info(`Prompt lengths: noText=${promptNoText.length} withText=${promptWithText.length}`);

    const childImageLine = hasHonoree
        ? `YES — **cropped face** PNG bytes (${honoreeRef.buffer.length} B) as Vertex referenceImages (REFERENCE_TYPE_RAW), model=${capabilityModelId}.`
        : "NO — no honoree file in Storage; Vertex text-only, model=" + `${IMAGEN_SKELETON_MODEL}.`;
    log.info(`Child image used in this test's Vertex calls: ${childImageLine}`);

    fs.mkdirSync(TEMP_DIR, { recursive: true });
    const base = `vertex-skeleton-${eventId}-${RUN_ID}`;

    /**
     * @returns {Promise<{ label: string, ms: number, outPath: string }>}
     */
    async function runOne(label, promptText, outName) {
        const t0 = performance.now();
        const promptForVertex = augmentPromptForInstructCustomizationWithHonoreeRef(
            promptText,
            hasHonoree,
        );
        const effectiveModel = hasHonoree ? capabilityModelId : IMAGEN_SKELETON_MODEL;
        const usesChildImage = Boolean(hasHonoree);
        const buf = await vertexImagen.generatePosterBufferWithVertexImagen(promptForVertex, {
            vertexModelId: IMAGEN_SKELETON_MODEL,
            referenceImageBytes: hasHonoree ? honoreeRef.buffer : undefined,
        });
        const ms = Math.round(performance.now() - t0);
        console.log(
            `[VertexImagenTest] ${label} childImageInRequest=${usesChildImage ? "yes" : "no"} model=${effectiveModel} durationMs=${ms} bytes=${buf?.length ?? 0}`,
        );
        if (!buf || buf.length === 0) {
            throw new Error(`${label}: Vertex returned no image (check VERTEX_IMAGEN_ENABLED, quotas, credentials).`);
        }
        const outPath = path.join(TEMP_DIR, `${outName}-${base}.png`);
        fs.writeFileSync(outPath, buf);
        log.ok(`Wrote ${outPath} (${buf.length} bytes)`);
        return { label, ms, outPath };
    }

    const pairT0 = performance.now();
    const [noTextResult, withTextResult] = await Promise.all([
        runOne("noText (zero-glyphs teaser)", promptNoText, "vertex-imagen-no-text"),
        runOne("withText (poster brief + typography)", promptWithText, "vertex-imagen-with-text"),
    ]);
    const pairWallMs = Math.round(performance.now() - pairT0);

    console.log(
        `[VertexImagenTest] Summary parallelWallMs=${pairWallMs} noTextMs=${noTextResult.ms} withTextMs=${withTextResult.ms} sequentialSumMs=${noTextResult.ms + withTextResult.ms}`,
    );
    log.ok("Done (no Firestore or Storage poster writes).");
}

main().catch((err) => {
    log.fail("Test failed", err.message || err);
    process.exit(1);
});
