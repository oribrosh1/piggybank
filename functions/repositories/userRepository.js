const admin = require("firebase-admin");

const COLLECTION = "users";

function getDb() {
    return admin.firestore();
}

async function getById(uid) {
    const doc = await getDb().collection(COLLECTION).doc(uid).get();
    if (!doc.exists) return null;
    return { uid: doc.id, ...doc.data() };
}

async function update(uid, data) {
    const ref = getDb().collection(COLLECTION).doc(uid);
    const updateData = { ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    await ref.update(updateData);
}

async function setProfileSlug(uid, profileSlug) {
    return update(uid, { profileSlug });
}

async function setStripeAccount(uid, stripeAccountId, stripeAccountStatus) {
    return update(uid, { stripeAccountId, stripeAccountStatus: stripeAccountStatus || "pending" });
}

module.exports = { getById, update, setProfileSlug, setStripeAccount };
