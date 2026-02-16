/**
 * Add test balance to a Stripe Connect connected account (test mode only).
 * Usage: node scripts/add-connect-balance.js [accountId] [amountCents]
 * Example: node scripts/add-connect-balance.js acct_1T1BtpHj7bT8Hksy 1000
 * (Adds $10.00 to acct_1T1BtpHj7bT8Hksy. Default amount: 1000 = $10.)
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const Stripe = require("stripe");
const accountId = process.argv[2] || "acct_1T1BtpHj7bT8Hksy";
const amountCents = parseInt(process.argv[3], 10) || 1000;

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey || !secretKey.startsWith("sk_test_")) {
    console.error("STRIPE_SECRET_KEY (test) must be set in functions/.env");
    process.exit(1);
}

if (!accountId.startsWith("acct_")) {
    console.error("First argument must be a Stripe account ID (acct_...)");
    process.exit(1);
}

const stripe = new Stripe(secretKey);

async function main() {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountCents,
            currency: "usd",
            payment_method: "pm_card_visa",
            confirm: true,
            automatic_payment_methods: { enabled: true, allow_redirects: "never" },
            transfer_data: { destination: accountId },
            description: "Test balance credit",
            metadata: { script: "add-connect-balance" },
        });
        console.log(`Added $${(amountCents / 100).toFixed(2)} to ${accountId}`);
        console.log("PaymentIntent:", paymentIntent.id);
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}

main();
