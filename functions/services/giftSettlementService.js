const admin = require("firebase-admin");
const { getBankingProvider, getPaymentsProvider } = require("../config/providerConfig");
const bankingAccountRepository = require("../repositories/bankingAccountRepository");

const SETTLEMENTS_COLLECTION = "giftSettlements";

/**
 * When PAYMENTS_PROVIDER=stripe and BANKING_PROVIDER=unit, record gift payments
 * for later settlement into the child's Unit deposit account.
 */
async function recordGiftPaymentForSettlement(paymentIntent) {
    if (getPaymentsProvider() !== "stripe" || getBankingProvider() !== "unit") {
        return null;
    }

    const metadata = paymentIntent.metadata || {};
    const eventId = metadata.eventId;
    const guestId = metadata.guestId;
    const giftAmountCents = Math.round(Number(metadata.giftAmount || 0) * 100);

    if (!eventId || giftAmountCents < 1) return null;

    const db = admin.firestore();
    const eventDoc = await db.collection("events").doc(eventId).get();
    if (!eventDoc.exists) return null;

    const creatorId = eventDoc.data()?.creatorId;
    if (!creatorId) return null;

    const banking = await bankingAccountRepository.getByUid(creatorId);
    const depositAccountId = banking?.depositAccountId;

    const settlementRef = db.collection(SETTLEMENTS_COLLECTION).doc(paymentIntent.id);
    await settlementRef.set({
        paymentIntentId: paymentIntent.id,
        eventId,
        guestId: guestId || null,
        creatorId,
        giftAmountCents,
        platformFeeCents: paymentIntent.application_fee_amount || 0,
        currency: paymentIntent.currency || "usd",
        status: depositAccountId ? "pending_transfer" : "awaiting_unit_account",
        unitDepositAccountId: depositAccountId || null,
        paymentsProvider: "stripe",
        bankingProvider: "unit",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return settlementRef.id;
}

module.exports = {
    SETTLEMENTS_COLLECTION,
    recordGiftPaymentForSettlement,
};
