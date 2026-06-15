const admin = require("firebase-admin");

function getBucket() {
    return admin.storage().bucket();
}

/** Public download URL — uses Storage emulator host when `FIREBASE_STORAGE_EMULATOR_HOST` is set. */
function getPublicUrl(bucketName, fileName) {
    const emulatorHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST;
    if (emulatorHost) {
        const encoded = encodeURIComponent(fileName);
        return `http://${emulatorHost}/v0/b/${bucketName}/o/${encoded}?alt=media`;
    }
    return `https://storage.googleapis.com/${bucketName}/${fileName}`;
}

/**
 * Save poster image buffer to posters/{eventId}/invitation_{timestamp}.png and make public.
 * @param {string} eventId
 * @param {Buffer} buffer
 * @param {string} [contentType='image/png']
 * @returns {Promise<string>} public URL
 */
async function savePoster(eventId, buffer, contentType = "image/png") {
    const bucket = getBucket();
    const fileName = `posters/${eventId}/invitation_${Date.now()}.png`;
    const file = bucket.file(fileName);
    await file.save(buffer, {
        metadata: { contentType },
    });
    await file.makePublic();
    return getPublicUrl(bucket.name, fileName);
}

/**
 * Save skeleton preview image (fast Imagen) beside final poster path.
 * @param {string} eventId
 * @param {Buffer} buffer
 * @param {string} [contentType='image/png']
 * @returns {Promise<string>} public URL
 */
async function saveSkeletonPoster(eventId, buffer, contentType = "image/png") {
    const bucket = getBucket();
    const fileName = `posters/${eventId}/skeleton_invitation_${Date.now()}.png`;
    const file = bucket.file(fileName);
    await file.save(buffer, {
        metadata: { contentType },
    });
    await file.makePublic();
    return getPublicUrl(bucket.name, fileName);
}

/**
 * Streaming partial preview while OpenAI final image is generating.
 * @param {string} eventId
 * @param {Buffer} buffer
 * @param {number} partialIndex
 * @param {string} [contentType='image/png']
 * @returns {Promise<string>} public URL
 */
async function savePosterStreamingPreview(
    eventId,
    buffer,
    partialIndex,
    contentType = "image/png",
) {
    const bucket = getBucket();
    const fileName = `posters/${eventId}/preview_invitation_${partialIndex}_${Date.now()}.png`;
    const file = bucket.file(fileName);
    await file.save(buffer, {
        metadata: { contentType },
    });
    await file.makePublic();
    return getPublicUrl(bucket.name, fileName);
}

/**
 * Download file from Storage (e.g. for Stripe verification upload).
 * @param {string} storagePath
 * @returns {Promise<{ buffer: Buffer, contentType: string }>}
 */
async function downloadFile(storagePath) {
    const bucket = getBucket();
    const file = bucket.file(storagePath);
    const [buffer] = await file.download();
    const [metadata] = await file.getMetadata();
    return {
        buffer,
        contentType: metadata?.contentType || "application/octet-stream",
    };
}

/**
 * Read parent-uploaded honoree reference at events/{eventId}/honoree_photo (if present).
 * @returns {Promise<{ buffer: Buffer, mimeType: string } | null>}
 */
async function readHonoreePhotoIfExists(eventId) {
    const bucket = getBucket();
    const file = bucket.file(`events/${eventId}/honoree_photo`);
    const [exists] = await file.exists();
    if (!exists) return null;
    const [buffer] = await file.download();
    const [metadata] = await file.getMetadata();
    return {
        buffer,
        mimeType: metadata?.contentType || "image/jpeg",
    };
}

/**
 * Signed HTTPS URL so third parties (e.g. Together.ai) can GET `honoree_photo` without bucket auth.
 * @param {string} eventId
 * @param {number} [expiresMs] default 60 minutes
 * @returns {Promise<string|null>}
 */
async function getHonoreePhotoSignedReadUrl(eventId, expiresMs = 60 * 60 * 1000) {
    const bucket = getBucket();
    const file = bucket.file(`events/${eventId}/honoree_photo`);
    const [exists] = await file.exists();
    if (!exists) return null;
    const [url] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + expiresMs,
    });
    return url;
}

/**
 * Face-only honoree PNG for reference URLs (`Together`, etc.). Original upload stays at `honoree_photo`.
 */
const honoreeFaceRefPath = (eventId) => `events/${eventId}/honoree_face_reference.png`;

/**
 * Face-only honoree PNG at `events/{eventId}/honoree_face_reference.png` — **public** read URL
 * (same pattern as `savePoster`) for clients and third-party APIs.
 * @param {string} eventId
 * @param {Buffer} pngBuffer
 * @returns {Promise<string>} Public HTTPS URL
 */
async function saveHonoreeFaceReference(eventId, pngBuffer) {
    const bucket = getBucket();
    const fileName = honoreeFaceRefPath(eventId);
    const file = bucket.file(fileName);
    await file.save(pngBuffer, {
        metadata: { contentType: "image/png" },
    });
    await file.makePublic();
    return getPublicUrl(bucket.name, fileName);
}

/**
 * Remove generated face reference so signed URLs fall back to the full `honoree_photo`.
 * @param {string} eventId
 * @returns {Promise<void>}
 */
async function deleteHonoreeFaceReferenceIfExists(eventId) {
    const bucket = getBucket();
    const file = bucket.file(honoreeFaceRefPath(eventId));
    const [exists] = await file.exists();
    if (exists) {
        await file.delete();
    }
}

/**
 * Signed URL for honoree conditioning: prefers `honoree_face_reference.png` when present, else full photo.
 * @param {string} eventId
 * @param {number} [expiresMs]
 * @returns {Promise<string|null>}
 */
async function getHonoreeReferenceSignedReadUrl(eventId, expiresMs = 60 * 60 * 1000) {
    const bucket = getBucket();
    const faceFile = bucket.file(honoreeFaceRefPath(eventId));
    const [faceExists] = await faceFile.exists();
    if (faceExists) {
        const [url] = await faceFile.getSignedUrl({
            action: "read",
            expires: Date.now() + expiresMs,
        });
        return url;
    }
    return getHonoreePhotoSignedReadUrl(eventId, expiresMs);
}

module.exports = {
    savePoster,
    saveSkeletonPoster,
    savePosterStreamingPreview,
    downloadFile,
    readHonoreePhotoIfExists,
    getHonoreePhotoSignedReadUrl,
    saveHonoreeFaceReference,
    deleteHonoreeFaceReferenceIfExists,
    getHonoreeReferenceSignedReadUrl,
};
