/**
 * Poster generation — client-parity integration test
 *
 * Mirrors the mobile app flow:
 *   1. Firebase Auth (email/password, same client SDK as rules tests)
 *   2. Create `events/{eventId}` with the same fields the app expects
 *   3. Attach Firestore listeners (like React Native):
 *        - `events/{eventId}` → posterUrl
 *        - `eventPosterVersions` where eventId == …
 *   4. POST `/generatePoster` with Bearer ID token (+ optional App Check, same rules as client)
 *   5. Wait until `posterUrl` appears on the event doc (or versions collection)
 *   6. Download the image URL to `functions/tests/temp-images/poster-<eventId>-<ts>.png`
 *
 * Prerequisites:
 *   - Run from repo root: `node functions/tests/test-poster-generation-client-flow.js`
 *   - Root `.env`: EXPO_PUBLIC_FIREBASE_* and app keys
 *   - `functions/.env`: GEMINI_API_KEY when not using `--mock` (override merge)
 *   - `firebaseserviceAccountKey.json` at repo root (Admin + Storage for in-process aiService)
 *
 * Generation mode:
 *   - `--mock` (recommended for CI / no quota): simulates Gemini — writes `posterPrompt`, `posterUrl`,
 *     `posterThemeId`, and `eventPosterVersions` via Admin (same shape as aiService). No GEMINI_API_KEY.
 *   - Default (no --mock): run `functions/services/aiService.js` in-process (needs GEMINI_API_KEY).
 *   - `--http`: POST to deployed /generatePoster (needs GEMINI in GCP).
 *
 * Flags:
 *   --no-cleanup   Keep Firestore user/event and downloaded file for inspection
 *   --mock         Fake Gemini responses (Firestore writes only; downloads a public PNG URL)
 *   --http         Use remote API instead of local aiService
 */

const path = require("path");
const fs = require("fs");
const https = require("https");
const http = require("http");

require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
// functions/.env overrides root for duplicate keys (dotenv does not override by default)
require("dotenv").config({ path: path.join(__dirname, "..", ".env"), override: true });

const FORCE_HTTP = process.argv.includes("--http");
const USE_MOCK_GEMINI =
    process.argv.includes("--mock") || process.env.POSTER_E2E_MOCK === "1";
const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && String(process.env.GEMINI_API_KEY).trim());
/** In-process aiService — skipped when USE_MOCK_GEMINI */
const useLocalAiPipeline = !FORCE_HTTP && !USE_MOCK_GEMINI;

const PROJECT_ID = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "piggybank-a0011";
process.env.GCLOUD_PROJECT = PROJECT_ID;
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, "..", "..", "firebaseserviceAccountKey.json");

const admin = require("firebase-admin");
const { initializeApp: initClientApp, deleteApp } = require("firebase/app");
const {
    getFirestore,
    doc,
    collection,
    setDoc,
    onSnapshot,
    query,
    where,
    serverTimestamp,
} = require("firebase/firestore");
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require("firebase/auth");

const CLOUD_API_BASE =
    process.env.EXPO_PUBLIC_API_BASE_URL || "https://us-central1-piggybank-a0011.cloudfunctions.net/api";

const RUN_ID = Date.now();
const TEST_EMAIL = `poster-e2e-${RUN_ID}@test-creditkid.app`;
const PASSWORD = `PosterTest!${RUN_ID}`;
const POSTER_THEME_ID = "space_explorer";

const NO_CLEANUP = process.argv.includes("--no-cleanup");
const TEMP_DIR = path.join(__dirname, "temp-images");

/** Match src/firebase/appCheck.ts — skip App Check header in test/stripe-test builds */
function shouldSkipAppCheckHeader() {
    return (
        process.env.EXPO_PUBLIC_SKIP_APP_CHECK === "true" ||
        process.env.EXPO_PUBLIC_STRIPE_TEST_MODE === "true"
    );
}

let adminDb;
let clientApp;
let db;
let auth;
let uid;
let eventId;
let unsubEvent;
let unsubVersions;

const log = {
    info: (m, o) => console.log(`[${new Date().toISOString()}] ℹ️  ${m}`, o !== undefined ? o : ""),
    snap: (m, o) => console.log(`[${new Date().toISOString()}] 📡 ${m}`, o !== undefined ? o : ""),
    ok: (m) => console.log(`[${new Date().toISOString()}] ✅ ${m}`),
    fail: (m, e) => console.error(`[${new Date().toISOString()}] ❌ ${m}`, e || ""),
};

function guestStatsEmpty() {
    return {
        total: 0,
        added: 0,
        invited: 0,
        confirmed: 0,
        paid: 0,
        invalidNumber: 0,
        notComing: 0,
        totalPaid: 0,
    };
}

async function downloadUrlToFile(urlStr, destPath) {
    return new Promise((resolve, reject) => {
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

/**
 * Same shape as getCloudFunctionAuthHeaders (api.ts) — Bearer token; App Check only when not in test skip.
 */
async function buildClientLikeHeaders() {
    const user = auth.currentUser;
    if (!user) throw new Error("Not signed in");
    const idToken = await user.getIdToken(true);
    const headers = {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
    };
    if (!shouldSkipAppCheckHeader()) {
        // Optional: real token would require @react-native-firebase/app-check; skip in Node or set STRIPE_TEST_MODE
        log.info("App Check not attached (set EXPO_PUBLIC_STRIPE_TEST_MODE=true if Functions reject requests)");
    }
    return headers;
}

async function callGeneratePosterHttp() {
    const headers = await buildClientLikeHeaders();
    const body = JSON.stringify({ eventId, posterThemeId: POSTER_THEME_ID });
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 170_000);

    let res;
    try {
        res = await fetch(`${CLOUD_API_BASE}/generatePoster`, {
            method: "POST",
            headers,
            body,
            signal: controller.signal,
        });
    } finally {
        clearTimeout(t);
    }

    const raw = await res.text();
    let data = {};
    if (raw) {
        try {
            data = JSON.parse(raw);
        } catch {
            throw new Error(`Non-JSON response (${res.status}): ${raw.slice(0, 300)}`);
        }
    }
    if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data;
}

const posterVersionRepository = require(path.join(__dirname, "..", "repositories", "posterVersionRepository"));

/** Public HTTPS image URL for mock mode (download step). Override with POSTER_MOCK_IMAGE_URL. */
const MOCK_POSTER_IMAGE_URL =
    process.env.POSTER_MOCK_IMAGE_URL || "https://httpbin.org/image/png";

/**
 * Simulates successful Gemini + storage upload: same Firestore fields as aiService.generatePoster.
 */
async function applyMockGeminiWrites() {
    const mockPrompt =
        "Mock Gemini text response: invitation poster prompt for E2E (no Generative Language API call).";
    await adminDb
        .collection("events")
        .doc(eventId)
        .update({
            posterPrompt: mockPrompt,
            posterUrl: MOCK_POSTER_IMAGE_URL,
            posterGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
            posterThemeId: POSTER_THEME_ID,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    await posterVersionRepository.addPosterVersion(uid, eventId, {
        posterUrl: MOCK_POSTER_IMAGE_URL,
        posterPrompt: mockPrompt,
        posterThemeId: POSTER_THEME_ID,
    });
    return { posterUrl: MOCK_POSTER_IMAGE_URL };
}

async function main() {
    if (!process.env.EXPO_PUBLIC_FIREBASE_API_KEY) {
        throw new Error("Missing EXPO_PUBLIC_FIREBASE_API_KEY in .env (needed for client SDK auth)");
    }

    if (!fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
        throw new Error(`Missing service account key: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
    }

    if (!USE_MOCK_GEMINI && useLocalAiPipeline && !hasGeminiKey) {
        throw new Error(
            "GEMINI_API_KEY not found after loading .env — add it to functions/.env (override merge), " +
                "or run with --mock to skip Gemini, or --http if the deployed function has GEMINI in GCP."
        );
    }

    if (!admin.apps.length) {
        admin.initializeApp({ projectId: PROJECT_ID });
    }
    adminDb = admin.firestore();

    fs.mkdirSync(TEMP_DIR, { recursive: true });

    const clientConfig = {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        authDomain:
            process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || `${PROJECT_ID}.firebaseapp.com`,
        projectId: PROJECT_ID,
    };

    clientApp = initClientApp(clientConfig, `poster-test-${RUN_ID}`);
    db = getFirestore(clientApp);
    auth = getAuth(clientApp);

    if (USE_MOCK_GEMINI) {
        log.info("Mode: MOCK Gemini — Admin writes only (no Generative Language API)");
    } else if (useLocalAiPipeline) {
        log.info("Mode: LOCAL aiService (GEMINI_API_KEY from functions/.env via dotenv override)");
    } else {
        log.info(`Mode: HTTP → ${CLOUD_API_BASE}/generatePoster`);
    }
    log.info(`Project: ${PROJECT_ID}`);

    // --- Auth (same pattern as test-firestore-rules.js) ---
    let cred;
    try {
        cred = await createUserWithEmailAndPassword(auth, TEST_EMAIL, PASSWORD);
    } catch (e) {
        if (e.code === "auth/email-already-in-use") {
            cred = await signInWithEmailAndPassword(auth, TEST_EMAIL, PASSWORD);
        } else throw e;
    }
    uid = cred.user.uid;
    log.ok(`Signed in as ${uid}`);

    await setDoc(doc(db, "users", uid), {
        email: TEST_EMAIL,
        fullName: "Poster E2E Parent",
        role: "parent",
        onboardingStep: 0,
        createdAt: serverTimestamp(),
    });

    // --- Event (aligned with client createEvent / aiService fields) ---
    const eventRef = doc(collection(db, "events"));
    eventId = eventRef.id;

    const future = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    await setDoc(eventRef, {
        creatorId: uid,
        creatorName: "Poster E2E Parent",
        creatorEmail: TEST_EMAIL,
        eventType: "barMitzvah",
        childName: "Shili",
        eventName: "Shili's Bar Mitzvah",
        age: "13",
        date: future,
        time: "4:00 PM",
        address1: "123 Test Street",
        address2: "",
        guests: [],
        totalGuests: 0,
        guestStats: guestStatsEmpty(),
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    log.ok(`Event created: ${eventId}`);

    // --- Listener state (like useEventPosterScreen) ---
    let latestEventPosterUrl = null;
    const versionRows = [];
    let snapshotDone = false;

    const donePromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error("Timed out after 180s waiting for posterUrl on event doc"));
        }, 180_000);

        function finish(url, source) {
            if (snapshotDone) return;
            snapshotDone = true;
            clearTimeout(timeout);
            resolve({ posterUrl: url, source });
        }

        unsubEvent = onSnapshot(
            doc(db, "events", eventId),
            (snap) => {
                if (!snap.exists()) return;
                const d = snap.data();
                const url = d.posterUrl;
                latestEventPosterUrl = typeof url === "string" && url.length > 0 ? url : null;
                log.snap(`events/${eventId} snapshot`, { posterUrl: latestEventPosterUrl });
                if (latestEventPosterUrl) finish(latestEventPosterUrl, "events.onSnapshot");
            },
            (err) => log.fail("events listener error", err)
        );

        unsubVersions = onSnapshot(
            query(collection(db, "eventPosterVersions"), where("eventId", "==", eventId)),
            (snap) => {
                versionRows.length = 0;
                snap.forEach((d) => versionRows.push({ id: d.id, ...d.data() }));
                versionRows.sort((a, b) => (b.versionNumber || 0) - (a.versionNumber || 0));
                log.snap("eventPosterVersions snapshot", {
                    count: versionRows.length,
                    top: versionRows[0]
                        ? { version: versionRows[0].versionNumber, posterUrl: versionRows[0].posterUrl }
                        : null,
                });
                const top = versionRows[0];
                if (top?.posterUrl && !snapshotDone) {
                    finish(top.posterUrl, "eventPosterVersions.onSnapshot");
                }
            },
            (err) => log.fail("versions listener error", err)
        );

        // Listeners first, then generation (mock, in-process aiService, or HTTP — same order as app)
        (async () => {
            try {
                await new Promise((r) => setTimeout(r, 400));

                if (USE_MOCK_GEMINI) {
                    const out = await applyMockGeminiWrites();
                    log.ok(`Mock Gemini returned posterUrl=${!!out.posterUrl}`);
                    if (out.posterUrl && !snapshotDone) {
                        finish(out.posterUrl, "mock Gemini (Admin)");
                    }
                } else if (useLocalAiPipeline) {
                    const aiService = require(path.join(__dirname, "..", "services", "aiService"));
                    const snap = await adminDb.collection("events").doc(eventId).get();
                    if (!snap.exists) throw new Error("Event missing before local generatePoster");
                    const eventData = { id: snap.id, ...snap.data() };
                    log.info("Calling aiService.generatePoster in-process…");
                    const out = await aiService.generatePoster(eventId, eventData, POSTER_THEME_ID);
                    log.ok(`Local aiService returned posterUrl=${!!out.posterUrl}`);
                    if (out.posterUrl && !snapshotDone) {
                        finish(out.posterUrl, "aiService direct");
                    }
                } else {
                    const data = await callGeneratePosterHttp();
                    log.ok(`HTTP generatePoster returned posterUrl=${!!data.posterUrl}`);
                    if (data.posterUrl && !snapshotDone) {
                        finish(data.posterUrl, "HTTP response");
                    }
                }
            } catch (err) {
                clearTimeout(timeout);
                if (!snapshotDone) reject(err);
            }
        })();
    });

    const result = await donePromise;
    const outFile = path.join(TEMP_DIR, `poster-${eventId}-${RUN_ID}.png`);
    log.info(`Saving image from ${result.source} → ${outFile}`);
    await downloadUrlToFile(result.posterUrl, outFile);
    log.ok(`Wrote ${outFile} (${fs.statSync(outFile).size} bytes)`);

    if (unsubEvent) unsubEvent();
    if (unsubVersions) unsubVersions();

    if (!NO_CLEANUP) {
        await cleanup();
    } else {
        log.info("--no-cleanup: leaving user, event, and file in place");
    }

    await deleteApp(clientApp);
    process.exit(0);
}

async function cleanup() {
    try {
        if (eventId) {
            const snap = await adminDb.collection("eventPosterVersions").where("eventId", "==", eventId).get();
            const batch = adminDb.batch();
            snap.docs.forEach((d) => batch.delete(d.ref));
            await batch.commit();
        }
        if (eventId) await adminDb.collection("events").doc(eventId).delete();
        if (uid) await adminDb.collection("users").doc(uid).delete();
        if (uid) await admin.auth().deleteUser(uid);
        log.ok("Cleanup: event versions, event, user removed");
    } catch (e) {
        log.fail("Cleanup error (manual cleanup may be needed)", e);
    }
}

main().catch((err) => {
    log.fail("Test failed", err.message || err);
    if (unsubEvent) try { unsubEvent(); } catch (_) {}
    if (unsubVersions) try { unsubVersions(); } catch (_) {}
    if (clientApp) try { deleteApp(clientApp); } catch (_) {}
    process.exit(1);
});
