/**
 * Run locally to check AccountCapabilities for a Stripe Connect account.
 * Usage:
 *   node functions/check-account-capabilities.js [acct_xxx]
 *   Or set STRIPE_CONNECT_ACCOUNT_ID in functions/.env
 */
require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const Stripe = require("stripe");

const accountId = process.argv[2] || process.env.STRIPE_CONNECT_ACCOUNT_ID;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function main() {
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error("❌ STRIPE_SECRET_KEY not set in functions/.env");
        process.exit(1);
    }
    if (!accountId || !accountId.startsWith("acct_")) {
        console.error("Usage: node functions/check-account-capabilities.js <acct_xxx>");
        console.error("   Or set STRIPE_CONNECT_ACCOUNT_ID in functions/.env");
        process.exit(1);
    }

    try {
        const account = await stripe.accounts.retrieve(accountId);
        console.log("Account ID:", account.id);
        console.log("Capabilities:", JSON.stringify(account.capabilities, null, 2));
        console.log("card_issuing === 'active':", account.capabilities?.card_issuing === "active");
        console.log("transfers === 'active':", account.capabilities?.transfers === "active");
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}

main();
