/**
 * One-off script to validate STRIPE_SECRET_KEY from functions/.env
 * Run from project root: node functions/check-stripe-key.js
 * Does not log or expose the key.
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const Stripe = require('stripe');

const key = process.env.STRIPE_SECRET_KEY;

if (!key) {
  console.error('❌ STRIPE_SECRET_KEY is not set in functions/.env');
  process.exit(1);
}

if (!key.startsWith('sk_test_') && !key.startsWith('sk_live_')) {
  console.error('❌ STRIPE_SECRET_KEY should start with sk_test_ or sk_live_');
  process.exit(1);
}

const stripe = new Stripe(key);

async function check() {
  try {
    const balance = await stripe.balance.retrieve();
    const mode = key.startsWith('sk_live_') ? 'LIVE' : 'TEST';
    console.log(`✅ Stripe API key is valid (${mode} mode)`);
    console.log(`   Available balance: ${(balance.available?.[0]?.amount ?? 0) / 100} ${balance.available?.[0]?.currency ?? 'usd'}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Stripe API key is invalid or revoked:', err.message);
    if (err.code === 'invalid_api_key') {
      console.error('   Get a valid key from https://dashboard.stripe.com/apikeys');
    }
    process.exit(1);
  }
}

check();
