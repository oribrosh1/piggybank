const admin = require("firebase-admin");

const COLLECTION = "events";

function getDb() {
    return admin.firestore();
}

async function getById(eventId) {
    const doc = await getDb().collection(COLLECTION).doc(eventId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
}

async function getRef(eventId) {
    return getDb().collection(COLLECTION).doc(eventId);
}

async function update(eventId, data) {
    const ref = getDb().collection(COLLECTION).doc(eventId);
    const updateData = {
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await ref.update(updateData);
}

async function updatePoster(eventId, posterPrompt, posterUrl = null, visualTeaser) {
    const ref = getDb().collection(COLLECTION).doc(eventId);
    const data = {
        posterPrompt,
        posterGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (posterUrl != null) data.posterUrl = posterUrl;
    if (typeof visualTeaser === "string" && visualTeaser.trim().length > 0) {
        data.visualTeaser = visualTeaser.trim();
    }
    await ref.update(data);
}

/**
 * Patch fast-preview skeleton poster URL (parallel Stage B, Imagen fast).
 * @param {string} eventId
 * @param {string} skeletonPosterUrl
 * @param {{ skeletonProgress?: { steps: number, url: string, durationMs?: number }[] }} [patch]
 */
async function updateSkeletonPoster(eventId, skeletonPosterUrl, patch = {}) {
    const ref = getDb().collection(COLLECTION).doc(eventId);
    const data = {
        skeletonPosterUrl,
        skeletonPosterGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (Array.isArray(patch.skeletonProgress)) {
        data.skeletonProgress = patch.skeletonProgress;
    }
    await ref.update(data);
}

/**
 * Patch the second FLUX preview that includes on-poster typography (Stage B parallel branch).
 * @param {string} eventId
 * @param {string} skeletonPosterWithTextUrl
 */
async function updateSkeletonPosterWithText(eventId, skeletonPosterWithTextUrl) {
    const ref = getDb().collection(COLLECTION).doc(eventId);
    await ref.update({
        skeletonPosterWithTextUrl,
        skeletonPosterWithTextGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}

/**
 * Persist the Gemini-generated invitation headline (separate from `posterPrompt`).
 * @param {string} eventId
 * @param {string} aiPosterTitle
 */
async function updateAiPosterTitle(eventId, aiPosterTitle) {
    const ref = getDb().collection(COLLECTION).doc(eventId);
    await ref.update({
        aiPosterTitle,
        aiPosterTitleGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}

/**
 * Append one progressive skeleton preview URL (Vertex streaming partials).
 * @param {string} eventId
 * @param {string} previewUrl
 */
async function appendSkeletonPartialPreviewUrl(eventId, previewUrl) {
    const ref = getDb().collection(COLLECTION).doc(eventId);
    await ref.update({
        skeletonPartialPreviewUrls: admin.firestore.FieldValue.arrayUnion(previewUrl),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}

/**
 * Clear skeleton preview fields before a new generation run (optional hygiene).
 * @param {string} eventId
 */
async function clearSkeletonPoster(eventId) {
    const ref = getDb().collection(COLLECTION).doc(eventId);
    await ref.update({
        skeletonPosterUrl: admin.firestore.FieldValue.delete(),
        skeletonPosterGeneratedAt: admin.firestore.FieldValue.delete(),
        skeletonPartialPreviewUrls: admin.firestore.FieldValue.delete(),
        skeletonProgress: admin.firestore.FieldValue.delete(),
        skeletonPosterWithTextUrl: admin.firestore.FieldValue.delete(),
        skeletonPosterWithTextGeneratedAt: admin.firestore.FieldValue.delete(),
        aiPosterTitle: admin.firestore.FieldValue.delete(),
        aiPosterTitleGeneratedAt: admin.firestore.FieldValue.delete(),
        honoreeFaceCropUrl: admin.firestore.FieldValue.delete(),
        honoreeFaceCropGeneratedAt: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}

/**
 * Progressive OpenAI **final** streaming preview only (`preview_invitation_*` in Storage).
 * Together FLUX skeleton frames use `skeletonPosterUrl` / `skeletonProgress`, not this field.
 * @param {string} eventId
 * @param {string} posterStreamingPreviewUrl
 */
async function updatePosterStreamingPreview(eventId, posterStreamingPreviewUrl) {
    const ref = getDb().collection(COLLECTION).doc(eventId);
    await ref.update({
        posterStreamingPreviewUrl,
        posterStreamingPreviewUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}

/** Remove streaming preview fields after final poster is committed or before a new run. */
async function clearPosterStreamingPreview(eventId) {
    const ref = getDb().collection(COLLECTION).doc(eventId);
    await ref.update({
        posterStreamingPreviewUrl: admin.firestore.FieldValue.delete(),
        posterStreamingPreviewUpdatedAt: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}

/**
 * Wall-clock timings (ms) for poster pipeline steps — written at end of generatePoster.
 * @param {string} eventId
 * @param {{
 *   honoreeFetchMs?: number|null,
 *   stageAMs?: number|null,
 *   stageBMs?: number|null,
 *   posterUploadMs?: number|null,
 *   skeletonStageMs?: number|null,
 *   skeletonWithTextStageMs?: number|null,
 *   coolTitleMs?: number|null,
 *   finalStageMs?: number|null,
 *   totalMs: number,
 *   stageASkipped?: boolean,
 *   openAIPartialArrivalMs?: Record<string, number>|null,
 *   openAIPartialDeltaMs?: Record<string, number>|null,
 * }} timing
 */
async function setPosterGenerationTiming(eventId, timing) {
    const ref = getDb().collection(COLLECTION).doc(eventId);
    const posterGenTiming = { totalMs: timing.totalMs };
    if (timing.honoreeFetchMs != null) posterGenTiming.honoreeFetchMs = timing.honoreeFetchMs;
    if (timing.stageAMs != null) posterGenTiming.stageAMs = timing.stageAMs;
    if (timing.stageBMs != null) posterGenTiming.stageBMs = timing.stageBMs;
    if (timing.posterUploadMs != null) posterGenTiming.posterUploadMs = timing.posterUploadMs;
    if (timing.skeletonStageMs != null) posterGenTiming.skeletonStageMs = timing.skeletonStageMs;
    if (timing.skeletonWithTextStageMs != null)
        posterGenTiming.skeletonWithTextStageMs = timing.skeletonWithTextStageMs;
    if (timing.coolTitleMs != null) posterGenTiming.coolTitleMs = timing.coolTitleMs;
    if (timing.finalStageMs != null) posterGenTiming.finalStageMs = timing.finalStageMs;
    if (timing.stageASkipped === true) posterGenTiming.stageASkipped = true;
    if (timing.openAIPartialArrivalMs && typeof timing.openAIPartialArrivalMs === "object") {
        posterGenTiming.openAIPartialArrivalMs = timing.openAIPartialArrivalMs;
    }
    if (timing.openAIPartialDeltaMs && typeof timing.openAIPartialDeltaMs === "object") {
        posterGenTiming.openAIPartialDeltaMs = timing.openAIPartialDeltaMs;
    }
    await ref.update({
        posterGenTiming,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}

/**
 * Persist public URL for the server-generated face crop (`honoree_face_reference.png`).
 * @param {string} eventId
 * @param {string} honoreeFaceCropUrl
 */
async function updateHonoreeFaceCropUrl(eventId, honoreeFaceCropUrl) {
    const ref = getDb().collection(COLLECTION).doc(eventId);
    await ref.update({
        honoreeFaceCropUrl,
        honoreeFaceCropGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}

async function getAll() {
    const snapshot = await getDb().collection(COLLECTION).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

module.exports = {
    getById,
    getRef,
    update,
    updatePoster,
    updateSkeletonPoster,
    updateSkeletonPosterWithText,
    updateAiPosterTitle,
    appendSkeletonPartialPreviewUrl,
    clearSkeletonPoster,
    updatePosterStreamingPreview,
    clearPosterStreamingPreview,
    setPosterGenerationTiming,
    updateHonoreeFaceCropUrl,
    getAll,
};
