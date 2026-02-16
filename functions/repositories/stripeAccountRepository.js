const admin = require("firebase-admin");

const COLLECTION = "stripeAccounts";

function getDb() {
    return admin.firestore();
}

async function getByUid(uid) {
    const doc = await getDb().collection(COLLECTION).doc(uid).get();
    if (!doc.exists) return null;
    return { uid: doc.id, ...doc.data() };
}

async function set(uid, data) {
    const ref = getDb().collection(COLLECTION).doc(uid);
    await ref.set(
        {
            ...data,
            created: data.created ?? admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
    );
}

async function update(uid, data) {
    const ref = getDb().collection(COLLECTION).doc(uid);
    await ref.update({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}

async function getByAccountId(accountId) {
    const snapshot = await getDb()
        .collection(COLLECTION)
        .where("accountId", "==", accountId)
        .limit(1)
        .get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { uid: doc.id, ...doc.data() };
}

module.exports = {
    getByUid,
    set,
    update,
    getByAccountId,
};
