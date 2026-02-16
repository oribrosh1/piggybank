const admin = require("firebase-admin");
const axios = require("axios");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");

const db = admin.firestore();
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

exports.onEventCreated = onDocumentCreated("events/{eventId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return null;
    const eventData = snapshot.data();
    const eventId = event.params.eventId;
    const creatorId = eventData.creatorId;
    console.log("New event created:", eventId, "by user:", creatorId);
    try {
        const stripeAccountDoc = await db.collection("stripeAccounts").doc(creatorId).get();
        let accountId = stripeAccountDoc.exists ? stripeAccountDoc.data()?.accountId : null;
        if (!accountId) {
            const userDoc = await db.collection("users").doc(creatorId).get();
            if (userDoc.exists) accountId = userDoc.data()?.stripeAccountId || null;
        }
        if (accountId) {
            await snapshot.ref.update({
                stripeAccountId: accountId,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return { success: true, accountId };
        }
        await snapshot.ref.update({
            needsBankingSetup: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return null;
    } catch (error) {
        console.error("onEventCreated error:", eventId, error);
        await snapshot.ref.update({
            stripeSetupFailed: true,
            stripeSetupError: error.message,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
