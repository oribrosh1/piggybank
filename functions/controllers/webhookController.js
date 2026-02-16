const admin = require("firebase-admin");

function createStripeWebhookHandler(stripe, stripeConnectService) {
    const db = admin.firestore();

    return async function stripeWebhookHandler(req, res) {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        let event;
        try {
            const signature = req.headers["stripe-signature"];
            event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
        } catch (err) {
            console.error("Webhook signature verification failed:", err.message);
            return res.status(400).send("Webhook Error: " + err.message);
        }
        console.log("Webhook received:", event.type);

        if (event.type === "account.updated") {
            const account = event.data.object;
            await stripeConnectService.handleWebhookAccountUpdated(account);
            console.log("Webhook account.updated processed for", account.id);
        }

        if (event.type === "payment_intent.succeeded") {
            const paymentIntent = event.data.object;
            console.log("Payment succeeded:", paymentIntent.id);
            await db.collection("payments").add({
                paymentIntentId: paymentIntent.id,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                status: paymentIntent.status,
                created: admin.firestore.FieldValue.serverTimestamp(),
            });
        }

        res.json({ received: true });
    };
}

module.exports = { createStripeWebhookHandler };
