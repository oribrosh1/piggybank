/**
 * Test 1: Webhook-driven provisioning (PRIMARY PATH)
 *
 * Tests the production webhook flow end-to-end.
 * Phase 3 is triggered ONLY through the webhook handler — never called directly.
 *
 * Flow:
 *   1. Create user + Stripe account → Phase 1 runs, status = "waiting_for_activation"
 *   2. Wait for Stripe to activate FA card_issuing (simulates real-world delay)
 *   3. Construct the webhook event payload and call handleFAFeaturesUpdated()
 *   4. Verify the webhook handler triggered Phase 3 → status = "complete"
 *
 * Usage:
 *   node functions/tests/test-webhook-provisioning.js [--cleanup]
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const PROJECT_ID = "piggybank-a0011";
process.env.GCLOUD_PROJECT = PROJECT_ID;
const path = require("path");
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, "..", "..", "firebaseserviceAccountKey.json");

const admin = require("firebase-admin");
const Stripe = require("stripe");

admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const stripeService = require("../stripeService");
const { createStripeConnectService } = require("../services/stripeConnectService");
const { createProvisioningService, PROVISIONING_COLLECTION } = require("../services/provisioningService");
const { handleFAFeaturesUpdated } = require("../controllers/webhookController");

const provisioningService = createProvisioningService(stripe, stripeService);
const stripeConnectService = createStripeConnectService(stripe, stripeService, provisioningService);

const CLEANUP = process.argv.includes("--cleanup");
const RUN_ID = Date.now();

const FIRST_NAMES = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn", "Jamie", "Dakota", "Skyler", "Reese", "Harper", "Finley", "Emerson"];
const LAST_NAMES = ["Smith", "Chen", "Garcia", "Patel", "Kim", "Brown", "Silva", "Muller", "Tanaka", "Wilson", "Ahmed", "Kowalski", "Santos", "Berg", "Russo"];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const firstName = pick(FIRST_NAMES);
const lastName = pick(LAST_NAMES);

const TEST_PARENT = {
    email: `test-wh-${RUN_ID}@creditkid.app`,
    password: "TestPassword123!",
    firstName,
    lastName,
    phone: `+1555${String(RUN_ID).slice(-7)}`,
    dob: "01/01/1990",
    address: "123 Main St",
    city: "San Francisco",
    state: "CA",
    zipCode: "94111",
    ssnLast4: "0000",
    routingNumber: "110000000",
    accountNumber: "000123456789",
};

let testUid = null;
let testAccountId = null;
let assertions = { passed: 0, failed: 0 };

function log(step, msg, data) {
    const ts = new Date().toISOString().split("T")[1].replace("Z", "");
    if (data !== undefined) {
        console.log(`[${ts}] [${step}] ${msg}`, typeof data === "object" ? JSON.stringify(data, null, 2) : data);
    } else {
        console.log(`[${ts}] [${step}] ${msg}`);
    }
}

function assert(label, condition) {
    if (condition) {
        console.log(`  ✅ ASSERT: ${label}`);
        assertions.passed++;
    } else {
        console.error(`  ❌ ASSERT FAILED: ${label}`);
        assertions.failed++;
    }
}

async function step1_setup() {
    log("Step 1", `Creating user + Stripe account for ${firstName} ${lastName}...`);

    const userRecord = await admin.auth().createUser({
        email: TEST_PARENT.email,
        password: TEST_PARENT.password,
        displayName: `${firstName} ${lastName}`,
        phoneNumber: TEST_PARENT.phone,
    });
    testUid = userRecord.uid;

    await db.collection("users").doc(testUid).set({
        email: TEST_PARENT.email,
        fullName: `${firstName} ${lastName}`,
        phone: TEST_PARENT.phone,
        role: "parent",
        onboardingStep: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const result = await stripeConnectService.createCustomConnectAccount(testUid, {
        country: "US",
        firstName, lastName,
        email: TEST_PARENT.email,
        phone: TEST_PARENT.phone,
        dob: TEST_PARENT.dob,
        address: TEST_PARENT.address,
        city: TEST_PARENT.city,
        state: TEST_PARENT.state,
        zipCode: TEST_PARENT.zipCode,
        ssnLast4: TEST_PARENT.ssnLast4,
        routingNumber: TEST_PARENT.routingNumber,
        accountNumber: TEST_PARENT.accountNumber,
        accountHolderName: `${firstName} ${lastName}`,
        useTestDocument: true,
    });

    testAccountId = result.accountId;
    log("Step 1", `✅ Account created: ${testAccountId}`);
}

async function step2_confirmWaitingForActivation() {
    log("Step 2", "Confirming Phase 1 completes → waiting_for_activation...");

    for (let i = 0; i < 30; i++) {
        const doc = await db.collection(PROVISIONING_COLLECTION).doc(testUid).get();
        if (doc.exists) {
            const s = doc.data().status;
            if (s === "waiting_for_activation") {
                const data = doc.data();
                assert("Status is waiting_for_activation", true);
                assert("financialAccountId stored", !!data.financialAccountId);
                assert("accountId stored", !!data.accountId);
                assert("body persisted for Phase 3", !!data.body);
                log("Step 2", `✅ FA=${data.financialAccountId}`);
                return data;
            }
            if (s === "failed") throw new Error(`Phase 1 failed: ${doc.data().error}`);
        }
        await new Promise((r) => setTimeout(r, 2000));
    }
    throw new Error("Timed out waiting for waiting_for_activation");
}

async function step3_waitForStripeActivation(financialAccountId) {
    log("Step 3", "Waiting for Stripe to activate FA card_issuing (real-world delay)...");

    for (let i = 0; i < 40; i++) {
        const fa = await stripe.treasury.financialAccounts.retrieve(
            financialAccountId,
            { expand: ["features"] },
            { stripeAccount: testAccountId }
        );
        const status = fa.features?.card_issuing?.status;
        log("Step 3", `Poll ${i + 1}/40: card_issuing=${status}`);

        if (status === "active") {
            log("Step 3", "✅ FA activated — Stripe would now fire the webhook");
            return fa;
        }
        await new Promise((r) => setTimeout(r, 3000));
    }
    throw new Error("FA card_issuing did not activate within timeout");
}

async function step4_fireWebhookHandler(fa) {
    log("Step 4", "Firing webhook handler: handleFAFeaturesUpdated()");

    const taskBefore = await db.collection(PROVISIONING_COLLECTION).doc(testUid).get();
    assert("Status before webhook is waiting_for_activation", taskBefore.data().status === "waiting_for_activation");

    const webhookPayload = {
        id: fa.id,
        features: fa.features,
        metadata: fa.metadata,
    };

    log("Step 4", "Webhook payload:", webhookPayload);

    await handleFAFeaturesUpdated(db, provisioningService, webhookPayload);

    log("Step 4", "✅ Webhook handler completed");
}

async function step5_verifyComplete() {
    log("Step 5", "Verifying final state...");

    const task = await db.collection(PROVISIONING_COLLECTION).doc(testUid).get();
    const data = task.data();

    assert("Status is 'complete'", data.status === "complete");
    assert("virtualCardId is set", !!data.virtualCardId);
    assert("cardholderId is set", !!data.cardholderId);
    assert("financialAccountId is set", !!data.financialAccountId);
    assert("Step says 'Card ready!'", data.step === "Card ready!");

    log("Step 5", "✅ Provisioning complete via webhook", {
        virtualCardId: data.virtualCardId,
        cardholderId: data.cardholderId,
    });
}

async function step6_verifyIdempotency(fa) {
    log("Step 6", "Verifying idempotency — firing webhook again...");

    const before = await db.collection(PROVISIONING_COLLECTION).doc(testUid).get();
    const cardBefore = before.data().virtualCardId;

    await handleFAFeaturesUpdated(db, provisioningService, {
        id: fa.id,
        features: fa.features,
        metadata: fa.metadata,
    });

    const after = await db.collection(PROVISIONING_COLLECTION).doc(testUid).get();
    assert("Status still 'complete' after duplicate webhook", after.data().status === "complete");
    assert("virtualCardId unchanged (no duplicate card)", after.data().virtualCardId === cardBefore);

    log("Step 6", "✅ Idempotency verified — duplicate webhook safely ignored");
}

async function cleanup() {
    console.log("\n--- CLEANUP ---");
    try {
        if (testAccountId) await stripe.accounts.del(testAccountId);
        if (testUid) {
            await db.collection("stripeAccounts").doc(testUid).delete();
            await db.collection(PROVISIONING_COLLECTION).doc(testUid).delete();
            await db.collection("users").doc(testUid).delete();
            await admin.auth().deleteUser(testUid);
        }
        console.log("  ✅ Cleanup done");
    } catch (err) {
        console.error("  Cleanup error:", err.message);
    }
}

async function main() {
    console.log("=".repeat(70));
    console.log("  TEST 1: WEBHOOK-ONLY PROVISIONING");
    console.log(`  User: ${firstName} ${lastName}`);
    console.log("=".repeat(70));
    console.log();

    const start = Date.now();

    try {
        await step1_setup();
        const taskData = await step2_confirmWaitingForActivation();
        const fa = await step3_waitForStripeActivation(taskData.financialAccountId);
        await step4_fireWebhookHandler(fa);
        await step5_verifyComplete();
        await step6_verifyIdempotency(fa);

        console.log();
        console.log("=".repeat(70));
        console.log(`  RESULTS: ${assertions.passed} passed, ${assertions.failed} failed — ${((Date.now() - start) / 1000).toFixed(1)}s`);
        console.log("=".repeat(70));
    } catch (err) {
        console.error(`\n  ❌ TEST ERROR: ${err.message}`);
        if (err.stack) console.error(err.stack);
    }

    if (CLEANUP) await cleanup();
    process.exit(assertions.failed > 0 ? 1 : 0);
}

main();
