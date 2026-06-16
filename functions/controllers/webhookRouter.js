const { createStripeWebhookHandler } = require("./webhookController");
const { createUnitWebhookHandler } = require("./unitWebhookController");

/**
 * Routes provider webhooks. Legacy `/webhook` remains Stripe for backward compatibility.
 */
function registerWebhookRoutes(app, deps) {
    const { stripe, stripeConnectService, provisioningService, bankingProvider } = deps;

    const stripeHandler = createStripeWebhookHandler(stripe, stripeConnectService, provisioningService);
    const unitHandler = createUnitWebhookHandler(bankingProvider);

    app.post("/webhook", stripeHandler);
    app.post("/webhooks/stripe", stripeHandler);
    app.post("/webhooks/unit", unitHandler);
}

module.exports = { registerWebhookRoutes };
