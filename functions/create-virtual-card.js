/**
 * One-off: create a virtual Issuing card for an existing cardholder (Connect account).
 * Run this first to get an ic_xxx card ID, then use create-test-authorization.js with that ID.
 *
 * Usage:
 *   node functions/create-virtual-card.js [cardholder_id] [account_id]
 *   Or set STRIPE_ISSUING_CARDHOLDER_ID and STRIPE_CONNECT_ACCOUNT_ID in functions/.env
 *
 * Example:
 *   node functions/create-virtual-card.js ich_1T0IhwHW8n5LJxKT5AwErQ22 acct_1KE7WKHW8n5LJxKT
 */
require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const Stripe = require("stripe");

const cardholderId = process.argv[2] || process.env.STRIPE_ISSUING_CARDHOLDER_ID;
const accountId = process.argv[3] || process.env.STRIPE_CONNECT_ACCOUNT_ID;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function main() {
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error("❌ STRIPE_SECRET_KEY not set in functions/.env");
        process.exit(1);
    }
    if (!cardholderId || !cardholderId.startsWith("ich_")) {
        console.error("Usage: node functions/create-virtual-card.js <cardholder_id> <account_id>");
        console.error("   Or set STRIPE_ISSUING_CARDHOLDER_ID and STRIPE_CONNECT_ACCOUNT_ID in functions/.env");
        process.exit(1);
    }
    if (!accountId || !accountId.startsWith("acct_")) {
        console.error("Provide Connect account ID (acct_xxx) as second arg or STRIPE_CONNECT_ACCOUNT_ID in .env");
        process.exit(1);
    }

    try {
        const card = await stripe.issuing.cards.create(
            {
                cardholder: cardholderId,
                currency: "usd",
                type: "virtual",
                status: "active",
                spending_controls: {
                    spending_limits: [
                        { amount: 50000, interval: "per_authorization" },
                    ],
                },
            },
            { stripeAccount: accountId }
        );
        console.log("Your New Card ID:", card.id);
    } catch (err) {
        console.error("Error:", err.message);
        if (err.code === "insufficient_funds") {
            console.error("  Top up the Connect account's issuing balance first (POST /topUpIssuing).");
        }
        process.exit(1);
    }
}

main();
