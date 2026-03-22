const admin = require("firebase-admin");
const { PROVISIONING_COLLECTION } = require("../services/provisioningService");

function createStripeWebhookHandler(stripe, stripeConnectService, provisioningService) {
    const db = admin.firestore();

    return async function stripeWebhookHandler(req, res) {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        let event;
        try {
            const signature = req.headers["stripe-signature"];
            event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
        } catch (err) {
            console.error(`[webhook] signature verification failed: ${err.message}`);
            return res.status(400).send("Webhook Error: " + err.message);
        }
        console.log(`[webhook] received type=${event.type} id=${event.id}`);

        try {
            if (event.type === "account.updated") {
                const account = event.data.object;
                await stripeConnectService.handleWebhookAccountUpdated(account);
                console.log(`[webhook] account.updated processed accountId=${account.id}`);
            }

            if (event.type === "payment_intent.succeeded") {
                const paymentIntent = event.data.object;
                console.log(`[webhook] payment_intent.succeeded paymentIntentId=${paymentIntent.id} amount=${paymentIntent.amount}`);
                await db.collection("payments").add({
                    paymentIntentId: paymentIntent.id,
                    amount: paymentIntent.amount,
                    currency: paymentIntent.currency,
                    status: paymentIntent.status,
                    created: admin.firestore.FieldValue.serverTimestamp(),
                });
                console.log(`[webhook] payment saved paymentIntentId=${paymentIntent.id}`);
            }

            if (event.type === "treasury.financial_account.features_status_updated") {
                await handleFAFeaturesUpdated(db, provisioningService, event.data.object);
            }
        } catch (err) {
            console.error(`[webhook] processing error type=${event.type} id=${event.id} message=${err.message}`);
        }

        res.json({ received: true });
    };
}

async function handleFAFeaturesUpdated(db, provisioningService, faObject) {
    const TAG = "[webhook:fa_features]";
    const financialAccountId = faObject.id;
    const cardIssuingStatus = faObject.features?.card_issuing?.status;

    console.log(`${TAG} FA=${financialAccountId} card_issuing=${cardIssuingStatus}`);

    if (cardIssuingStatus !== "active") {
        console.log(`${TAG} card_issuing not active yet, ignoring`);
        return;
    }

    const uid = faObject.metadata?.uid;
    const accountId = faObject.metadata?.accountId;

    if (!uid || !accountId) {
        console.warn(`${TAG} FA missing metadata (uid/accountId), cannot proceed`);
        return;
    }

    const taskDoc = await db.collection(PROVISIONING_COLLECTION).doc(uid).get();
    if (!taskDoc.exists) {
        console.warn(`${TAG} no provisioning task for uid=${uid}, ignoring`);
        return;
    }

    const task = taskDoc.data();

    if (task.status === "complete") {
        console.log(`${TAG} uid=${uid} already complete, ignoring (idempotent)`);
        return;
    }

    if (task.status !== "waiting_for_activation") {
        console.log(`${TAG} uid=${uid} status=${task.status}, not waiting_for_activation, ignoring`);
        return;
    }

    console.log(`${TAG} uid=${uid} card_issuing active, triggering phase3`);

    try {
        await provisioningService.runPhase3(uid, accountId, financialAccountId, task.body || {});
    } catch (err) {
        console.error(`${TAG} phase3 failed for uid=${uid}: ${err.message}`);
        await db.collection(PROVISIONING_COLLECTION).doc(uid).update({
            status: "failed",
            step: "Card creation failed",
            error: err.message,
            retryable: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
}

module.exports = { createStripeWebhookHandler, handleFAFeaturesUpdated };
