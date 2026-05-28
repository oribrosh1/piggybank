/**
 * Poster generation — existing event + honoree photo from Storage
 *
 * Loads `events/{eventId}` from Firestore, verifies `events/{eventId}/honoree_photo` exists in Storage
 * (same path as {@link readHonoreePhotoIfExists}), then runs `generatePoster` in-process (same as the
 * main client-parity test, but without creating a throwaway user/event).
 *
 * WARNING: This updates poster-related fields on the real event document (posterPrompt, posterUrl,
 * skeleton URLs, aiPosterTitle, timings, etc.). Use a dev/staging event only.
 *
 * For **Vertex-only** no-text + with-text probes (no Firestore writes, saves PNGs under
 * `functions/tests/temp-images/`), use:
 *   node functions/tests/test-vertex-imagen-skeleton-pair.js
 *   node functions/tests/test-vertex-imagen-skeleton-pair.js --use-firestore-prompts
 *
 * Run from repo root:
 *   node functions/tests/test-poster-generation-existing-event.js
 *   node functions/tests/test-poster-generation-existing-event.js --event-id=OTHER_ID
 *   POSTER_E2E_EXISTING_EVENT_ID=OTHER_ID node functions/tests/test-poster-generation-existing-event.js
 *
 * Prerequisites:
 *   - `functions/.env`: GEMINI_API_KEY, FUNCTIONS_STORAGE_BUCKET (or defaults), TOGETHER / OpenAI as needed
 *   - `firebaseserviceAccountKey.json` at repo root
 *   - Honoree reference at `gs://<bucket>/events/<eventId>/honoree_photo`
 */

const path = require("path");
const fs = require("fs");
const https = require("https");
const http = require("http");

require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", ".env"), override: true });

const argv = process.argv.slice(2);
const EVENT_FLAG =
    argv.find((a) => a.startsWith("--event-id="))?.slice("--event-id=".length)?.trim() ||
    process.env.POSTER_E2E_EXISTING_EVENT_ID?.trim() ||
    "nLXzXItL2caR6FJ5tReP";

const PROJECT_ID = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "piggybank-a0011";
process.env.GCLOUD_PROJECT = PROJECT_ID;
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(
    __dirname,
    "..",
    "..",
    "firebaseserviceAccountKey.json",
);

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
const STORAGE_BUCKET = defaultStorageBucket();

const admin = require("firebase-admin");

const RUN_ID = Date.now();
const TEMP_DIR = path.join(__dirname, "temp-images");

const log = {
    info: (m, o) => console.log(`[${new Date().toISOString()}] ℹ️  ${m}`, o !== undefined ? o : ""),
    ok: (m) => console.log(`[${new Date().toISOString()}] ✅ ${m}`),
    fail: (m, e) => console.error(`[${new Date().toISOString()}] ❌ ${m}`, e || ""),
};

let adminDb;

async function waitForPosterFields(id, opts = {}) {
    const maxWaitMs = opts.maxWaitMs ?? 45_000;
    const intervalMs = opts.intervalMs ?? 2000;
    const deadline = Date.now() + maxWaitMs;
    let last = await readPosterFieldsFromEvent(id);
    while (Date.now() < deadline) {
        last = await readPosterFieldsFromEvent(id);
        if (last.skeletonPosterUrl && last.skeletonPosterWithTextUrl) break;
        await new Promise((r) => setTimeout(r, intervalMs));
    }
    return last;
}

async function readPosterFieldsFromEvent(id) {
    const snap = await adminDb.collection("events").doc(id).get();
    if (!snap.exists) return {};
    const d = snap.data() || {};
    return {
        aiPosterTitle:
            typeof d.aiPosterTitle === "string" && d.aiPosterTitle.trim()
                ? d.aiPosterTitle.trim()
                : undefined,
        skeletonPosterUrl:
            typeof d.skeletonPosterUrl === "string" && d.skeletonPosterUrl.trim()
                ? d.skeletonPosterUrl.trim()
                : undefined,
        skeletonPosterWithTextUrl:
            typeof d.skeletonPosterWithTextUrl === "string" &&
            d.skeletonPosterWithTextUrl.trim()
                ? d.skeletonPosterWithTextUrl.trim()
                : undefined,
        posterUrl:
            typeof d.posterUrl === "string" && d.posterUrl.trim()
                ? d.posterUrl.trim()
                : undefined,
    };
}

async function downloadUrlToFile(urlStr, destPath) {
    return new Promise((resolve, reject) => {
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        const u = new URL(urlStr);
        const lib = u.protocol === "https:" ? https : http;
        const file = fs.createWriteStream(destPath);
        lib
            .get(urlStr, (res) => {
                if (res.statusCode === 301 || res.statusCode === 302) {
                    const loc = res.headers.location;
                    file.close();
                    fs.unlink(destPath, () => {});
                    if (!loc) return reject(new Error("Redirect without location"));
                    return downloadUrlToFile(loc, destPath).then(resolve).catch(reject);
                }
                if (res.statusCode !== 200) {
                    file.close();
                    fs.unlink(destPath, () => {});
                    return reject(new Error(`HTTP ${res.statusCode}`));
                }
                res.pipe(file);
                file.on("finish", () => file.close(() => resolve()));
            })
            .on("error", (err) => {
                file.close();
                fs.unlink(destPath, () => {});
                reject(err);
            });
    });
}

function usageDie(msg) {
    if (msg) console.error(msg);
    console.error(`
Usage:
  node functions/tests/test-poster-generation-existing-event.js
  node functions/tests/test-poster-generation-existing-event.js --event-id=<FirestoreEventDocId>
  POSTER_E2E_EXISTING_EVENT_ID=<id> node functions/tests/test-poster-generation-existing-event.js

Default event id: nLXzXItL2caR6FJ5tReP (override with flags/env above).

Requires Storage object: gs://<bucket>/events/<eventId>/honoree_photo
`);
    process.exit(1);
}

async function main() {
    if (!fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
        usageDie(`Missing service account: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
    }
    if (!process.env.GEMINI_API_KEY || !String(process.env.GEMINI_API_KEY).trim()) {
        usageDie("GEMINI_API_KEY missing (functions/.env).");
    }

    const eventId = EVENT_FLAG;
    if (!eventId) usageDie("No event id.");

    if (!admin.apps.length) {
        admin.initializeApp({
            projectId: PROJECT_ID,
            storageBucket: STORAGE_BUCKET,
        });
    }
    adminDb = admin.firestore();

    log.info(
        `WARNING: This will regenerate poster assets on events/${eventId} (writes posterPrompt, URLs, aiPosterTitle, etc.).`,
    );
    log.info(`Admin: projectId=${PROJECT_ID} storageBucket=${STORAGE_BUCKET}`);
    log.info(`Target event: ${eventId}`);

    const snap = await adminDb.collection("events").doc(eventId).get();
    if (!snap.exists) {
        usageDie(`Event not found: events/${eventId}`);
    }
    const eventData = { id: snap.id, ...snap.data() };
    log.info(`Loaded event: ${eventData.eventName || "(no name)"}`);

    const storageRepository = require(path.join(__dirname, "..", "repositories", "storageRepository"));
    let honoreeRef;
    try {
        honoreeRef = await storageRepository.readHonoreePhotoIfExists(eventId);
    } catch (e) {
        usageDie(`readHonoreePhotoIfExists failed: ${e.message}`);
    }
    if (!honoreeRef || !honoreeRef.buffer?.length) {
        usageDie(
            `No honoree reference at gs://${STORAGE_BUCKET}/events/${eventId}/honoree_photo — upload a photo there first (same as the app).`,
        );
    }
    log.ok(
        `Honoree ref OK: ${honoreeRef.buffer.length} bytes, mime=${honoreeRef.mimeType || "unknown"}`,
    );

    fs.mkdirSync(TEMP_DIR, { recursive: true });
    const base = `honoree-${eventId}-${RUN_ID}`;

    const aiService = require(path.join(__dirname, "..", "services", "aiService"));
    log.info("Calling aiService.generatePoster in-process…");
    const out = await aiService.generatePoster(eventId, eventData, {});
    log.ok(`generatePoster returned posterUrl=${!!out.posterUrl}`);

    const fields = await waitForPosterFields(eventId);
    log.info("Poster pipeline fields (from Firestore)", {
        aiPosterTitle: fields.aiPosterTitle ?? "(none)",
        skeletonPosterUrl: fields.skeletonPosterUrl
            ? `${fields.skeletonPosterUrl.slice(0, 72)}…`
            : "(none)",
        skeletonPosterWithTextUrl: fields.skeletonPosterWithTextUrl
            ? `${fields.skeletonPosterWithTextUrl.slice(0, 72)}…`
            : "(none)",
    });

    const posterUrlToSave = fields.posterUrl || out.posterUrl;
    if (!posterUrlToSave) {
        log.fail("No posterUrl on event or return value — skipping downloads");
        process.exit(1);
    }

    const outFile = path.join(TEMP_DIR, `poster-${base}.png`);
    await downloadUrlToFile(posterUrlToSave, outFile);
    log.ok(`Wrote ${outFile} (${fs.statSync(outFile).size} bytes)`);

    if (fields.aiPosterTitle) {
        const titlePath = path.join(TEMP_DIR, `ai-title-${base}.txt`);
        fs.mkdirSync(TEMP_DIR, { recursive: true });
        fs.writeFileSync(titlePath, `${fields.aiPosterTitle}\n`, "utf8");
        log.ok(`Wrote ${titlePath}`);
    }

    if (fields.skeletonPosterUrl) {
        const skPath = path.join(TEMP_DIR, `skeleton-no-text-${base}.png`);
        await downloadUrlToFile(fields.skeletonPosterUrl, skPath);
        log.ok(`Wrote ${skPath} (${fs.statSync(skPath).size} bytes)`);
    }

    if (fields.skeletonPosterWithTextUrl) {
        const sktPath = path.join(TEMP_DIR, `skeleton-with-text-${base}.png`);
        await downloadUrlToFile(fields.skeletonPosterWithTextUrl, sktPath);
        log.ok(`Wrote ${sktPath} (${fs.statSync(sktPath).size} bytes)`);
    }

    log.ok("Done.");
    process.exit(0);
}

main().catch((err) => {
    log.fail("Test failed", err.message || err);
    process.exit(1);
});
