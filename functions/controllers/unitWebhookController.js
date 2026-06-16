/**
 * Unit.co webhook handler.
 * @see https://www.unit.co/docs/api/webhooks/
 */
function createUnitWebhookHandler(bankingProvider) {
    return async function unitWebhookHandler(req, res) {
        const token = process.env.UNIT_WEBHOOK_TOKEN;
        const authHeader = req.headers.authorization || "";
        const incoming = authHeader.replace(/^Bearer\s+/i, "");

        if (token && incoming !== token) {
            console.error("[unit-webhook] invalid token");
            return res.status(401).send("Unauthorized");
        }

        const event = req.body;
        const eventType = event?.data?.type || event?.type;
        console.log(`[unit-webhook] type=${eventType}`);

        try {
            if (bankingProvider?.handleWebhookEvent) {
                await bankingProvider.handleWebhookEvent(event);
            }
        } catch (err) {
            console.error(`[unit-webhook] processing error: ${err.message}`);
        }

        res.json({ received: true });
    };
}

module.exports = { createUnitWebhookHandler };
