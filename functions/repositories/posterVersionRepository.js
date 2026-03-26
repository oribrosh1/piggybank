const admin = require("firebase-admin");

const VERSIONS = "eventPosterVersions";
const COUNTERS = "posterVersionCounters";

function getDb() {
    return admin.firestore();
}

/**
 * Atomically increments per-event version and writes a poster version row.
 * @param {string} accountId - event owner (creatorId)
 * @param {string} eventId
 * @param {{ posterUrl: string, posterPrompt?: string|null, posterThemeId?: string|null }} data
 * @returns {Promise<number>} versionNumber
 */
async function addPosterVersion(accountId, eventId, data) {
    const db = getDb();
    const counterRef = db.collection(COUNTERS).doc(eventId);
    const versionsCol = db.collection(VERSIONS);

    return db.runTransaction(async (tx) => {
        const counterSnap = await tx.get(counterRef);
        const nextVersion = counterSnap.exists
            ? (counterSnap.data().nextVersion || 0) + 1
            : 1;

        tx.set(
            counterRef,
            {
                accountId,
                eventId,
                nextVersion: nextVersion,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
        );

        const vRef = versionsCol.doc();
        tx.set(vRef, {
            accountId,
            eventId,
            versionNumber: nextVersion,
            posterUrl: data.posterUrl,
            posterPrompt: data.posterPrompt ?? null,
            posterThemeId: data.posterThemeId ?? null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return nextVersion;
    });
}

module.exports = {
    addPosterVersion,
};
