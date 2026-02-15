/**
 * Create a test-mode authorization for a Stripe Issuing card (Connect account).
 * Test mode only. Card must exist (e.g. ic_xxx).
 *
 * Usage:
 *   node functions/create-test-authorization.js <card_id> <account_id> [amount_cents]
 *   Or set STRIPE_ISSUING_CARD_ID and STRIPE_CONNECT_ACCOUNT_ID in functions/.env
 *
 * Example:
 *   node functions/create-test-authorization.js ic_1ABC... acct_1KE7... 1500
 */
require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const Stripe = require("stripe");
const stripeService = require("./stripeService");

const cardId = process.argv[2] || process.env.STRIPE_ISSUING_CARD_ID;
const accountId = process.argv[3] || process.env.STRIPE_CONNECT_ACCOUNT_ID;
const amount = parseInt(process.argv[4] || "1000", 10) || 1000;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function main() {
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error("❌ STRIPE_SECRET_KEY not set in functions/.env");
        process.exit(1);
    }
    if (!cardId) {
        console.error("Usage: node functions/create-test-authorization.js <card_id> <account_id> [amount_cents]");
        console.error("   Or set STRIPE_ISSUING_CARD_ID and STRIPE_CONNECT_ACCOUNT_ID in functions/.env");
        console.error("   card_id must be a card ID (ic_xxx), not a cardholder ID (ich_xxx).");
        process.exit(1);
    }
    if (cardId.startsWith("ich_")) {
        console.error("❌ You passed a cardholder ID (ich_...). This script needs a card ID (ic_...).");
        console.error("   The cardholder 'ori brosh' has no cards yet. Create a virtual card first:");
        console.error("   1. In the app: fund the account (top up), then use Issue Card.");
        console.error("   2. Or create a card via POST /createVirtualCard, then use the returned card id (ic_xxx).");
        process.exit(1);
    }
    if (!cardId.startsWith("ic_")) {
        console.error("❌ card_id must start with ic_ (Issuing card). You passed:", cardId);
        process.exit(1);
    }
    if (!accountId || !accountId.startsWith("acct_")) {
        console.error("Provide Connect account ID (acct_xxx) as second arg or STRIPE_CONNECT_ACCOUNT_ID in .env");
        process.exit(1);
    }

    try {
        const auth = await stripeService.createTestAuthorization(stripe, {
            accountId,
            cardId,
            amount,
            currency: "usd",
        });
        console.log("Test authorization created:");
        console.log("  ID:", auth.id);
        console.log("  Amount:", auth.amount, "cents ($" + (auth.amount / 100).toFixed(2) + ")");
        console.log("  Approved:", auth.approved);
        console.log("  Status:", auth.status);
        if (!auth.approved || auth.status === "closed") {
            console.log("");
            console.log("  Tip: Declined/closed authorizations are usually due to:");
            console.log("  • Insufficient issuing balance — top up via POST /topUpIssuing or in the app.");
            console.log("  • Spending controls (amount or merchant category) on the card.");
        }
    } catch (err) {
        console.error("Error:", err.message);
        if (err.code === "resource_missing") console.error("  Card or account not found. Check IDs and test mode.");
        process.exit(1);
    }
}

main();
