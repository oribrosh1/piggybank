const admin = require("firebase-admin");

function getBucket() {
    return admin.storage().bucket();
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
    return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
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

module.exports = {
    savePoster,
    downloadFile,
};
