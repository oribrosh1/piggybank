const admin = require("firebase-admin");
const { getBankingProvider } = require("../config/providerConfig");

const COLLECTION = "bankingAccounts";

function getDb() {
    return admin.firestore();
}

/**
 * Normalized banking record per user (provider-agnostic).
 * Provider-specific IDs are also stored under `externalIds`.
 */
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
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: data.createdAt ?? admin.firestore.FieldValue.serverTimestamp(),
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

async function upsertFromProvider(uid, patch) {
    const provider = patch.provider || getBankingProvider();
    const existing = (await getByUid(uid)) || {};
    const externalIds = {
        ...(existing.externalIds || {}),
        ...(patch.externalIds || {}),
    };
    if (patch.externalIdsKey && patch.externalIdsValue) {
        externalIds[patch.externalIdsKey] = {
            ...(externalIds[patch.externalIdsKey] || {}),
            ...patch.externalIdsValue,
        };
    }
    const record = {
        provider,
        accountId: patch.accountId ?? existing.accountId ?? null,
        depositAccountId: patch.depositAccountId ?? existing.depositAccountId ?? null,
        cardId: patch.cardId ?? existing.cardId ?? null,
        applicationId: patch.applicationId ?? existing.applicationId ?? null,
        customerId: patch.customerId ?? existing.customerId ?? null,
        status: patch.status ?? existing.status ?? "pending",
        capabilities: patch.capabilities ?? existing.capabilities ?? {},
        externalIds,
    };
    await set(uid, record);
    return { uid, ...record };
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
    COLLECTION,
    getByUid,
    set,
    update,
    upsertFromProvider,
    getByAccountId,
};
