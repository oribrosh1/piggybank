#!/usr/bin/env node
/**
 * CLI: runs `generatePoster(eventId, event)` from aiService (Stage A: Gemini text,
 * default `gemini-2.5-flash`, override `GEMINI_STAGE_A_MODEL`;
 * Stage B: parallel Together FLUX skeleton (`black-forest-labs/FLUX.2-dev`;
 * Vertex Imagen fallback) + OpenAI `gpt-image-2` streaming final, or Vertex ultra final when `POSTER_FINAL_PROVIDER=vertex`).
 *
 * Run from repo root or from `functions/` (paths are resolved from this file):
 *   node functions/scripts/generate-poster.js --event-id=<FirestoreEventDocId>
 *   EVENT_ID=<id> node functions/scripts/generate-poster.js
 *
 *   POSTER_CREATOR_UID=<FirebaseAuthUid> node functions/scripts/generate-poster.js --seed
 *   (also accepts legacy POSTER_TEST_CREATOR_UID / POSTER_TEST_UID)
 *   Override seed honoree image URL: POSTER_SEED_HONOREE_PHOTO_URL=<https...>
 *
 * Env: root `.env` + `functions/.env` merged; GEMINI_API_KEY in functions/.env unless --dry-run.
 * Credentials: `firebaseserviceAccountKey.json` at repo root.
 * Storage: prefers `FUNCTIONS_STORAGE_BUCKET` (functions/.env; `FIREBASE_*` is reserved for deploy), then `EXPO_PUBLIC_` /
 *   `NEXT_PUBLIC_`, then `google-services.json` at repo root (`project_info.storage_bucket`),
 *   else `{projectId}.firebasestorage.app` (modern default).
 * Legacy `*.appspot.com` buckets only: set the env var explicitly.
 *
 * Outputs: `functions/poster-output/<creatorId>/<isoTimestamp>_<eventId>/`
 *   — `response.json` (URLs, posterGenTiming ms, local file names),
 *   `poster-image-brief.txt` (image prompt), `image-url.txt` / `skeleton-image-url.txt`,
 *   `skeleton.<ext>` and `poster.<ext>` when downloads succeed,
 *   `streaming-preview-urls.txt` + `preview-stream-001.<ext>` … when OpenAI streams partials.
 *
 * This script defaults `POSTER_STREAM_PREVIEW_UPDATES=all` if unset so each partial can be saved.
 * Set `POSTER_STREAM_PREVIEW_UPDATES` in `functions/.env` to override (e.g. `minimal`).
 */

const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
  override: true,
});

/** Default `all` so OpenAI emits every partial and we can persist each PNG under poster-output/. */
if (!String(process.env.POSTER_STREAM_PREVIEW_UPDATES ?? "").trim()) {
  process.env.POSTER_STREAM_PREVIEW_UPDATES = "all";
}

const PROJECT_ID = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "piggybank-a0011";
/** Default Firebase Storage bucket; required for Admin `storage().bucket()` without a name. */
function defaultStorageBucket() {
  const fromEnv =
    process.env.FUNCTIONS_STORAGE_BUCKET?.trim() ||
    process.env.FIREBASE_STORAGE_BUCKET?.trim() ||
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ||
    "";
  if (fromEnv) return fromEnv;

  try {
    const gsPath = path.join(__dirname, "..", "..", "google-services.json");
    if (fs.existsSync(gsPath)) {
      const parsed = JSON.parse(fs.readFileSync(gsPath, "utf8"));
      const b = parsed?.project_info?.storage_bucket?.trim();
      if (b) return b;
    }
  } catch {
    /* ignore */
  }

  return `${PROJECT_ID}.firebasestorage.app`;
}
const STORAGE_BUCKET = defaultStorageBucket();
process.env.GCLOUD_PROJECT = PROJECT_ID;
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(
  __dirname,
  "..",
  "..",
  "firebaseserviceAccountKey.json",
);

const argv = process.argv.slice(2);

/** Used as honoree reference when running with `--seed` (written to Storage `events/{id}/honoree_photo`). */
const DEFAULT_SEED_HONOREE_PHOTO_URL =
"https://t4.ftcdn.net/jpg/00/24/98/87/240_F_24988791_KOb5KeR3NgHxe8y6EK6qYeCYwtoM3XQE.jpg"

const HAS_DRY_RUN = argv.includes("--dry-run");
const HAS_SEED = argv.includes("--seed");
const HAS_CLEANUP = argv.includes("--cleanup");
const EVENT_FLAG =
  argv.find((a) => a.startsWith("--event-id="))?.slice("--event-id=".length) ||
  process.env.EVENT_ID ||
  "";
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

async function seedSampleEvent(adminDb, creatorUid) {
  const FieldValue = require("firebase-admin").firestore.FieldValue;
  const ref = adminDb.collection("events").doc();
  const eventId = ref.id;
  const future = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  /** Same shape as `Event` in types/events.ts (see createEvent in src/lib/eventService.ts). */
  const payload = {
    id: eventId,
    creatorId: creatorUid,
    creatorName: "Poster CLI",
    creatorEmail: "poster-cli@creditkid.dev",
    eventType: "birthday",
    eventName: "Jamie's Roller Disco Bash",
    childName: "Jamie",
    honoreeGender: "boy",
    eventCategory: "party",
    partyType: "trampoline",
    theme: "Roller disco + rainbow lights",
    partyVibe: "Chill pizza first, then open skate and glow necklaces.",
    honoreeFavoriteColor: "#8B5CF6",
    parking: "Free rear lot — enter via Cedar Lane.",
    locationNotes: "Ring bell for Suite 2.",
    kosherType: "kosher-style",
    kosherCateringPartnerId: "later",
    mealType: "dairy",
    vegetarianType: "by_request",
    age: "9",
    date: future,
    time: "4:30 PM",
    address1: "FunZone Party Center",
    address2: "88 Oak Ave, Springfield, NJ",
    optionalDetailsLater: false,
    guests: [],
    totalGuests: 0,
    guestStats: guestStatsEmpty(),
    status: "active",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await ref.set(payload);
  return eventId;
}

/**
 * Download a public JPEG/PNG URL and upload to the path `readHonoreePhotoIfExists` reads
 * ({@see functions/repositories/storageRepository.js}).
 */
async function uploadSeedHonoreePhotoFromUrl(eventId, imageUrl) {
  const axios = require("axios");
  const admin = require("firebase-admin");
  const resp = await axios.get(imageUrl, {
    responseType: "arraybuffer",
    timeout: 90_000,
    maxRedirects: 8,
    validateStatus: (s) => s >= 200 && s < 400,
    headers: {
      Accept: "image/*,*/*;q=0.8",
      "User-Agent":
        "Mozilla/5.0 (compatible; CreditKid-generate-poster-cli/1.0; +https://creditkid.dev)",
    },
  });
  const buffer = Buffer.from(resp.data);
  const contentType =
    (resp.headers["content-type"] &&
      String(resp.headers["content-type"]).split(";")[0].trim()) ||
    "image/jpeg";

  const bucket = admin.storage().bucket();
  const file = bucket.file(`events/${eventId}/honoree_photo`);
  await file.save(buffer, {
    metadata: { contentType },
  });
}

function safeCreatorFolder(creatorId) {
  const id =
    typeof creatorId === "string" && creatorId.trim()
      ? creatorId.trim()
      : "_unknown_creator";
  return id.replace(/[/\\:?*"<>|]/g, "_");
}

function runFolderName(eventId) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `${ts}_${eventId}`;
}

function extensionFromContentType(ct) {
  const base = (ct || "").split(";")[0].trim().toLowerCase();
  const map = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[base] || null;
}

async function tryDownloadPoster(posterUrl, destDir, basename = "poster") {
  if (!posterUrl || !/^https?:\/\//i.test(posterUrl)) {
    return null;
  }
  const axios = require("axios");
  try {
    const resp = await axios.get(posterUrl, {
      responseType: "arraybuffer",
      maxRedirects: 5,
      timeout: 120_000,
      validateStatus: (s) => s >= 200 && s < 400,
    });
    const ext =
      extensionFromContentType(resp.headers["content-type"]) ||
      (() => {
        try {
          const u = new URL(posterUrl);
          const m = u.pathname.match(/\.(png|jpe?g|webp|gif)$/i);
          return m ? m[1].toLowerCase().replace("jpeg", "jpg") : null;
        } catch {
          return null;
        }
      })();
    const safeBase = basename.replace(/[/\\:?*"<>|]/g, "_");
    const filename = ext ? `${safeBase}.${ext}` : `${safeBase}.bin`;
    const outPath = path.join(destDir, filename);
    await fsPromises.writeFile(outPath, Buffer.from(resp.data));
    return filename;
  } catch (e) {
    console.warn(`[save] Could not download ${basename} from URL: ${e.message}`);
    return null;
  }
}

/** Pretty-print `posterGenTiming` from the event doc (written by aiService). */
function printTimingsMs(posterGenTiming) {
  if (!posterGenTiming || typeof posterGenTiming !== "object") {
    console.log("\n=== timings (ms) ===\n  (no posterGenTiming on event doc)");
    return;
  }
  const rows = [
    ["honoreeFetchMs (read Storage ref)", posterGenTiming.honoreeFetchMs],
    ["stageAMs (Gemini brief)", posterGenTiming.stageAMs],
    ["stageASkipped", posterGenTiming.stageASkipped],
    ["skeletonStageMs (Together FLUX skeleton or Vertex fallback)", posterGenTiming.skeletonStageMs],
    ["finalStageMs (OpenAI streaming final or Vertex when POSTER_FINAL_PROVIDER=vertex)", posterGenTiming.finalStageMs],
    ["stageBMs (parallel Stage B wall-clock)", posterGenTiming.stageBMs],
    ["posterUploadMs (final to Storage)", posterGenTiming.posterUploadMs],
    ["totalMs (handler)", posterGenTiming.totalMs],
  ];
  console.log("\n=== timings (ms) ===");
  for (const [label, v] of rows) {
    if (v !== undefined && v !== null) {
      console.log(`  ${label}: ${v}`);
    }
  }
  const arr = posterGenTiming.openAIPartialArrivalMs;
  const del = posterGenTiming.openAIPartialDeltaMs;
  if (arr && typeof arr === "object" && Object.keys(arr).length > 0) {
    console.log("  OpenAI partial_image_index → arrival from stream start (ms):");
    for (const k of Object.keys(arr).sort((a, b) => Number(a) - Number(b))) {
      const d = del && del[k] != null ? `, intervalSincePrev=${del[k]}ms` : "";
      console.log(`    Partial${Number(k) + 1} (index ${k}): ${arr[k]}ms${d}`);
    }
  }
}

/**
 * @param {object} opts
 * @param {string} opts.creatorId
 * @param {string} opts.eventId
 * @param {string} [opts.partyType] snapshot from event (metadata only)
 * @param {boolean} opts.dryRun
 * @param {string} [opts.stageAPrompt]
 * @param {string} [opts.posterPrompt]
 * @param {string} [opts.posterUrl]
 * @param {string} [opts.skeletonPosterUrl]
 * @param {string} [opts.visualTeaser]
 * @param {string[]} [opts.streamingPreviewUrls] ordered unique URLs seen during generatePoster
 * @param {object|null} [opts.posterGenTiming]
 */
async function saveRunArtifacts(opts) {
  const {
    creatorId,
    eventId,
    partyType,
    dryRun,
    stageAPrompt,
    posterPrompt,
    posterUrl,
    skeletonPosterUrl,
    visualTeaser,
    streamingPreviewUrls,
    posterGenTiming,
  } = opts;

  const base = path.join(
    __dirname,
    "..",
    "poster-output",
    safeCreatorFolder(creatorId),
    runFolderName(eventId),
  );
  await fsPromises.mkdir(base, { recursive: true });

  const savedAt = new Date().toISOString();
  const payload = {
    savedAt,
    eventId,
    creatorId: creatorId || null,
    partyType: partyType ?? null,
    dryRun,
    posterPrompt: posterPrompt ?? null,
    posterUrl: posterUrl ?? null,
    skeletonPosterUrl: skeletonPosterUrl ?? null,
    visualTeaser: visualTeaser ?? null,
    posterGenTiming: posterGenTiming ?? null,
    localPosterFile: null,
    localSkeletonFile: null,
    streamingPreviewUrls: streamingPreviewUrls?.length ? streamingPreviewUrls : null,
    localStreamingFiles: [],
  };

  if (dryRun && stageAPrompt) {
    await fsPromises.writeFile(
      path.join(base, "stage-a-prompt.txt"),
      stageAPrompt,
      "utf8",
    );
    payload.stageAPromptLength = stageAPrompt.length;
  }

  if (!dryRun && posterPrompt) {
    await fsPromises.writeFile(
      path.join(base, "poster-image-brief.txt"),
      posterPrompt,
      "utf8",
    );
  }

  if (!dryRun && visualTeaser) {
    await fsPromises.writeFile(
      path.join(base, "visual-teaser.txt"),
      `${visualTeaser}\n`,
      "utf8",
    );
  }

  if (!dryRun && posterGenTiming) {
    await fsPromises.writeFile(
      path.join(base, "timings-ms.json"),
      JSON.stringify(posterGenTiming, null, 2),
      "utf8",
    );
  }

  if (!dryRun && skeletonPosterUrl) {
    await fsPromises.writeFile(
      path.join(base, "skeleton-image-url.txt"),
      `${skeletonPosterUrl}\n`,
      "utf8",
    );
    const localSk = await tryDownloadPoster(skeletonPosterUrl, base, "skeleton");
    if (localSk) {
      payload.localSkeletonFile = localSk;
    }
  }

  if (!dryRun && posterUrl) {
    await fsPromises.writeFile(
      path.join(base, "image-url.txt"),
      `${posterUrl}\n`,
      "utf8",
    );
    const local = await tryDownloadPoster(posterUrl, base, "poster");
    if (local) {
      payload.localPosterFile = local;
    }
  }

  if (!dryRun && streamingPreviewUrls && streamingPreviewUrls.length > 0) {
    await fsPromises.writeFile(
      path.join(base, "streaming-preview-urls.txt"),
      `${streamingPreviewUrls.join("\n")}\n`,
      "utf8",
    );
    for (let i = 0; i < streamingPreviewUrls.length; i++) {
      const name = `preview-stream-${String(i + 1).padStart(3, "0")}`;
      const local = await tryDownloadPoster(streamingPreviewUrls[i], base, name);
      if (local) {
        payload.localStreamingFiles.push(local);
      }
    }
  }

  await fsPromises.writeFile(
    path.join(base, "response.json"),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  console.log(`\n[save] Wrote artifacts under ${base}`);
  return base;
}

function creatorUidFromEnv() {
  return (
    process.env.POSTER_CREATOR_UID?.trim() ||
    process.env.POSTER_TEST_CREATOR_UID?.trim() ||
    process.env.POSTER_TEST_UID?.trim() ||
    ""
  );
}

function usageDie(msg) {
  if (msg) console.error(msg);
  console.error(`
Usage:
  node functions/scripts/generate-poster.js --event-id=<id>
  EVENT_ID=<id> node functions/scripts/generate-poster.js

  POSTER_CREATOR_UID=<authUid> node functions/scripts/generate-poster.js --seed
     (downloads default Fotolia kid portrait → Storage events/<id>/honoree_photo;
      override URL with POSTER_SEED_HONOREE_PHOTO_URL if needed.)

  … --dry-run     # Stage-A prompt text only (no Gemini / Storage)
  … --cleanup     # With --seed: delete seeded event doc after run

  Artifacts: functions/poster-output/<creatorId>/<timestamp>_<eventId>/

  --seed needs a real Firebase Auth UID as POSTER_CREATOR_UID (or legacy POSTER_TEST_CREATOR_UID).
`);
  process.exit(1);
}

async function main() {
  if (!fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    usageDie(`Missing service account: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
  }

  if (!HAS_DRY_RUN) {
    const hasKey = Boolean(
      process.env.GEMINI_API_KEY && String(process.env.GEMINI_API_KEY).trim(),
    );
    if (!hasKey) {
      usageDie(
        "GEMINI_API_KEY missing (functions/.env). Use --dry-run to skip Gemini, or set the key.",
      );
    }
  }

  let eventId = EVENT_FLAG.trim();
  let seeded = false;

  const admin = require("firebase-admin");
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: PROJECT_ID,
      storageBucket: STORAGE_BUCKET,
    });
    console.log(`[firebase] projectId=${PROJECT_ID} storageBucket=${STORAGE_BUCKET}\n`);
  }
  const adminDb = admin.firestore();

  if (HAS_SEED) {
    const creatorUid = creatorUidFromEnv();
    if (!creatorUid) {
      usageDie(
        "--seed requires POSTER_CREATOR_UID (real Firebase Auth user ID). Legacy: POSTER_TEST_CREATOR_UID or POSTER_TEST_UID.",
      );
    }
    eventId = await seedSampleEvent(adminDb, creatorUid);
    seeded = true;
    console.log(`[seed] Created events/${eventId} (creatorId=${creatorUid})`);
    const honoreeUrl =
      process.env.POSTER_SEED_HONOREE_PHOTO_URL?.trim() ||
      DEFAULT_SEED_HONOREE_PHOTO_URL;
    try {
      await uploadSeedHonoreePhotoFromUrl(eventId, honoreeUrl);
      console.log(
        `[seed] Stored honoree reference at gs://${STORAGE_BUCKET}/events/${eventId}/honoree_photo`,
      );
    } catch (e) {
      console.warn(`[seed] Could not fetch/upload honoree photo: ${e.message}`);
    }
    console.log("");
  }

  if (!eventId) {
    usageDie("Provide --event-id=<id> or EVENT_ID env, or run with --seed.");
  }

  const snap = await adminDb.collection("events").doc(eventId).get();
  if (!snap.exists) {
    usageDie(`Event not found: events/${eventId}`);
  }

  const event = { id: snap.id, ...snap.data() };
  const creatorId =
    typeof event.creatorId === "string" && event.creatorId.trim()
      ? event.creatorId.trim()
      : "";
  if (!creatorId) {
    console.warn(
      "[warn] Event has no creatorId — artifacts will use folder _unknown_creator",
    );
  }
  console.log(`[load] Event: ${eventId} (${event.eventName || "untitled"})\n`);

  const aiPath = path.join(__dirname, "..", "services", "aiService.js");
  const aiService = require(aiPath);

  if (HAS_DRY_RUN) {
    const prompt = aiService.buildPromptForPrompt(event, false);
    console.log("=== buildPromptForPrompt (dry-run, no photo note) ===\n");
    console.log(prompt);
    console.log("\n✅ dry-run OK");
    await saveRunArtifacts({
      creatorId: creatorId || "_unknown_creator",
      eventId,
      partyType: event.partyType,
      dryRun: true,
      stageAPrompt: prompt,
    });
  } else {
    console.log("[run] generatePoster (Together FLUX skeleton + OpenAI streaming final) …\n");
    console.log(
      `[env] POSTER_STREAM_PREVIEW_UPDATES=${process.env.POSTER_STREAM_PREVIEW_UPDATES || "(unset)"}`,
    );

    const streamingPreviewUrls = [];
    let lastStreamingUrl = null;
    const eventRef = adminDb.collection("events").doc(eventId);
    const unsubscribe = eventRef.onSnapshot(
      (docSnap) => {
        if (!docSnap.exists) return;
        const u = docSnap.data()?.posterStreamingPreviewUrl;
        if (
          typeof u === "string" &&
          u.length > 0 &&
          u !== lastStreamingUrl
        ) {
          lastStreamingUrl = u;
          streamingPreviewUrls.push(u);
        }
      },
      (err) => console.warn("[listen] posterStreamingPreviewUrl", err.message),
    );

    let out;
    try {
      out = await aiService.generatePoster(eventId, event, {});
    } finally {
      unsubscribe();
    }

    const afterSnap = await adminDb.collection("events").doc(eventId).get();
    const afterData = afterSnap.data() || {};
    const posterGenTiming = afterData.posterGenTiming || null;

    console.log("=== result ===");
    console.log(JSON.stringify(out, null, 2));
    if (out.posterPrompt) {
      console.log("\n=== posterPrompt (image brief, all chars) ===\n");
      console.log(out.posterPrompt);
    }
    printTimingsMs(posterGenTiming);

    const hasFinal = Boolean(out.posterUrl);
    const hasSk = Boolean(out.skeletonPosterUrl);
    console.log(
      hasFinal
        ? "\n✅ generatePoster OK (final posterUrl)"
        : "\n⚠️ generatePoster: no final posterUrl",
    );
    if (hasSk && !hasFinal) {
      console.log("   (skeleton preview URL may still be present)");
    }
    if (streamingPreviewUrls.length > 0) {
      console.log(
        `\n[stream] Captured ${streamingPreviewUrls.length} OpenAI streaming preview URL(s) → poster-output (preview-stream-*.png; skeleton stays skeletonPosterUrl / skeletonProgress)`,
      );
    }

    await saveRunArtifacts({
      creatorId: creatorId || "_unknown_creator",
      eventId,
      partyType: event.partyType,
      dryRun: false,
      posterPrompt: out.posterPrompt,
      posterUrl: out.posterUrl,
      skeletonPosterUrl: out.skeletonPosterUrl,
      visualTeaser: out.visualTeaser,
      streamingPreviewUrls,
      posterGenTiming,
    });
  }

  if (seeded && HAS_CLEANUP) {
    await adminDb.collection("events").doc(eventId).delete();
    console.log(`\n[cleanup] Deleted events/${eventId}`);
  } else if (seeded && !HAS_CLEANUP) {
    console.log(`\n[hint] Seed doc kept at events/${eventId}. Re-run with --cleanup to delete, or delete in console.`);
  }
}

main().catch((e) => {
  console.error("[fail]", e);
  process.exit(1);
});
