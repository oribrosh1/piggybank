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

async function updatePoster(eventId, posterPrompt, posterUrl = null) {
    const ref = getDb().collection(COLLECTION).doc(eventId);
    const data = {
        posterPrompt,
        posterGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (posterUrl != null) data.posterUrl = posterUrl;
    await ref.update(data);
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
    getAll,
};
