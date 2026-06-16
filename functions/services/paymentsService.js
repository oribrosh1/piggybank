const Stripe = require("stripe");
const { getPaymentsProvider } = require("../config/providerConfig");

/**
 * Guest gift payments stay on Stripe when PAYMENTS_PROVIDER=stripe (default).
 */
function createPaymentsService() {
    const provider = getPaymentsProvider();

    function getStripe() {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error("STRIPE_SECRET_KEY is required when PAYMENTS_PROVIDER=stripe");
        }
        return Stripe(process.env.STRIPE_SECRET_KEY);
    }

    async function createGiftPaymentIntent(params) {
        if (provider !== "stripe") {
            const err = new Error(`Gift payments are not configured for provider: ${provider}`);
            err.statusCode = 501;
            throw err;
        }

        const {
            amount,
            eventId,
            guestId,
            guestName,
            hostName,
            blessing,
            templateId,
            connectedAccountId,
        } = params;

        const giftAmountInCents = Math.round(amount * 100);
        const feeRate = Number(process.env.PLATFORM_FEE_RATE || 0.03);
        const platformFeeInCents = Math.round(giftAmountInCents * feeRate);
        const totalChargeInCents = giftAmountInCents + platformFeeInCents;
        const stripe = getStripe();

        const paymentIntentOptions = {
            amount: totalChargeInCents,
            currency: "usd",
            payment_method_types: ["card"],
            metadata: {
                eventId: eventId || "",
                guestId: guestId || "",
                guestName: guestName || "",
                hostName: hostName || "",
                giftAmount: amount.toString(),
                feeAmount: (platformFeeInCents / 100).toFixed(2),
                blessing: blessing?.substring(0, 500) || "",
                templateId: templateId || "",
                type: "creditkid_gift",
            },
        };

        if (connectedAccountId) {
            paymentIntentOptions.application_fee_amount = platformFeeInCents;
            paymentIntentOptions.transfer_data = { destination: connectedAccountId };
        }

        const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);

        return {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount,
            fee: platformFeeInCents / 100,
            total: totalChargeInCents / 100,
            hasConnectedAccount: !!connectedAccountId,
            paymentsProvider: "stripe",
        };
    }

    return {
        provider,
        createGiftPaymentIntent,
        getStripe,
    };
}

module.exports = { createPaymentsService };
