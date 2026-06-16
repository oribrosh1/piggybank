const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const axios = require("axios");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const { getBankingProvider, getPaymentsProvider } = require("../config/providerConfig");

exports.onEventCreated = onDocumentCreated("events/{eventId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return null;
    const eventData = snapshot.data();
    const eventId = event.params.eventId;
    const creatorId = eventData.creatorId;
    console.log("New event created:", eventId, "by user:", creatorId);
    try {
        const bankingDoc = await db.collection("bankingAccounts").doc(creatorId).get();
        const stripeAccountDoc = await db.collection("stripeAccounts").doc(creatorId).get();
        const userDoc = await db.collection("users").doc(creatorId).get();
        const userData = userDoc.exists ? userDoc.data() : {};

        let stripeAccountId =
            stripeAccountDoc.exists ? stripeAccountDoc.data()?.accountId : null;
        if (!stripeAccountId) stripeAccountId = userData.stripeAccountId || null;

        const bankingAccountId =
            bankingDoc.exists
                ? (bankingDoc.data()?.depositAccountId || bankingDoc.data()?.accountId)
                : (userData.bankingAccountId || null);

        const paymentProvider = getPaymentsProvider();
        const bankingProvider = getBankingProvider();

        const patch = {
            paymentProvider,
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (stripeAccountId) patch.stripeAccountId = stripeAccountId;
        if (bankingAccountId) patch.bankingAccountId = bankingAccountId;
        if (bankingProvider === "unit" && bankingAccountId) {
            patch.paymentAccountId = bankingAccountId;
        } else if (stripeAccountId) {
            patch.paymentAccountId = stripeAccountId;
        }

        const hasBanking =
            bankingProvider === "unit"
                ? !!bankingAccountId
                : !!stripeAccountId;

        if (hasBanking || (paymentProvider === "stripe" && stripeAccountId)) {
            await snapshot.ref.update(patch);
            return { success: true, stripeAccountId, bankingAccountId };
        }

        await snapshot.ref.update({
            ...patch,
            needsBankingSetup: true,
        });
        return null;
    } catch (error) {
        console.error("onEventCreated error:", eventId, error);
        await snapshot.ref.update({
            stripeSetupFailed: true,
            stripeSetupError: error.message,
            updatedAt: FieldValue.serverTimestamp(),
        });
        return { success: false, error: error.message };
    }
});

exports.onTransactionCreated = onDocumentCreated("transactions/{transactionId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return null;
    const data = snapshot.data();
    const transactionId = event.params.transactionId;
    const { receiverId, senderName, amount, childName: txChildName, eventId } = data || {};
    if (!receiverId || senderName == null || amount == null) return null;
    let childName = txChildName;
    let parentId = null;
    try {
        const childDoc = await db.collection("users").doc(receiverId).get();
        if (!childDoc.exists) return null;
        const childData = childDoc.data();
        if (!childName && (childData.displayName || childData.fullName)) childName = childData.displayName || childData.fullName;
        parentId = (childData.parentIds || [])[0] || null;
        if (!parentId && eventId) {
            const eventSnap = await db.collection("events").doc(eventId).get();
            if (eventSnap.exists) parentId = eventSnap.data().creatorId || null;
        }
    } catch (err) {
        console.error("[onTransactionCreated] Error:", err);
        return null;
    }
    const message = "New gift received! " + senderName + " just sent you a $" + amount + " gift for " + (childName || "your child") + "!";
    const tokens = [];
    try {
        const childDoc = await db.collection("users").doc(receiverId).get();
        const childToken = childDoc.exists ? childDoc.data().expoPushToken : null;
        if (childToken) tokens.push({ token: childToken, label: "child" });
    } catch (e) {}
    if (parentId) {
        try {
            const parentDoc = await db.collection("users").doc(parentId).get();
            const parentToken = parentDoc.exists ? parentDoc.data().expoPushToken : null;
            if (parentToken) tokens.push({ token: parentToken, label: "parent" });
        } catch (e) {}
    }
    if (tokens.length === 0) return null;
    const payload = tokens.map(({ token }) => ({ to: token, sound: "default", title: "New gift!", body: message }));
    try {
        const res = await axios.post(EXPO_PUSH_URL, payload, { headers: { "Content-Type": "application/json" }, timeout: 10000 });
        const results = res.data?.data || [];
        tokens.forEach((t, i) => {
            if (results[i]?.status === "ok") console.log("[onTransactionCreated] Push sent to", t.label, transactionId);
        });
    } catch (err) {
        console.error("[onTransactionCreated] Expo push failed:", err.message);
    }
    return null;
});
