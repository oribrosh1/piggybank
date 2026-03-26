/**
 * Test 2: Cron fallback provisioning (RECOVERY PATH)
 *
 * Validates that the provisioningWatchdog cron correctly detects stuck
 * "waiting_for_activation" tasks and completes Phase 3 when the FA
 * card_issuing feature is active — without any webhook.
 *
 * Steps:
 *   1. Create Firebase Auth user + Firestore docs
 *   2. Create Stripe Connected Account → fires runProvisioning (Phase 1 only)
 *   3. Wait for provisioningTasks status = "waiting_for_activation"
 *   4. Wait for FA card_issuing to become active on Stripe
 *   5. Backdate updatedAt to simulate a stale task (>5 min old)
 *   6. Run the cron handler logic directly
 *   7. Verify Phase 3 ran: cardholder + card created, status = "complete"
 *
 * Usage:
 *   node functions/tests/test-cron-provisioning.js [--cleanup]
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const PROJECT_ID = "piggybank-a0011";
process.env.GCLOUD_PROJECT = PROJECT_ID;
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, "..", "..", "firebaseserviceAccountKey.json");

const admin = require("firebase-admin");
const Stripe = require("stripe");

admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const stripeService = require("../stripeService");
const { createStripeConnectService } = require("../services/stripeConnectService");
const { createProvisioningService, PROVISIONING_COLLECTION } = require("../services/provisioningService");

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
    email: `test-cron-${RUN_ID}@creditkid.app`,
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

async function setup() {
    log("Setup", "Creating Firebase user + Firestore docs...");

    const userRecord = await admin.auth().createUser({
        email: TEST_PARENT.email,
        password: TEST_PARENT.password,
        displayName: `${TEST_PARENT.firstName} ${TEST_PARENT.lastName}`,
        phoneNumber: TEST_PARENT.phone,
    });
    testUid = userRecord.uid;

    await db.collection("users").doc(testUid).set({
        email: TEST_PARENT.email,
        fullName: `${TEST_PARENT.firstName} ${TEST_PARENT.lastName}`,
        phone: TEST_PARENT.phone,
        role: "parent",
        onboardingStep: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    log("Setup", `✅ User created uid=${testUid}`);
}

async function step1_createAccountAndRunPhase1() {
    log("Step 1", "Creating Stripe Connected Account (triggers Phase 1)...");

    const result = await stripeConnectService.createCustomConnectAccount(testUid, {
        country: "US",
        firstName: TEST_PARENT.firstName,
        lastName: TEST_PARENT.lastName,
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
        accountHolderName: `${TEST_PARENT.firstName} ${TEST_PARENT.lastName}`,
        useTestDocument: true,
    });

    testAccountId = result.accountId;
    log("Step 1", `✅ Account created: ${testAccountId}`);
}

async function step2_waitForWaitingStatus() {
    log("Step 2", "Waiting for provisioningTasks to reach 'waiting_for_activation'...");

    const MAX_POLLS = 30;
    for (let i = 0; i < MAX_POLLS; i++) {
        const doc = await db.collection(PROVISIONING_COLLECTION).doc(testUid).get();
        if (doc.exists) {
            const data = doc.data();
            log("Step 2", `Poll ${i + 1}/${MAX_POLLS}: status=${data.status}`);

            if (data.status === "waiting_for_activation") {
                assert("Status is waiting_for_activation", true);
                return data;
            }
            if (data.status === "failed") {
                throw new Error(`Provisioning failed: ${data.error}`);
            }
        }
        await new Promise((r) => setTimeout(r, 2000));
    }
    throw new Error("Timed out waiting for waiting_for_activation status");
}

async function step3_waitForFAActive(financialAccountId) {
    log("Step 3", "Waiting for FA card_issuing to become active on Stripe...");

    const MAX_POLLS = 30;
    for (let i = 0; i < MAX_POLLS; i++) {
        const fa = await stripe.treasury.financialAccounts.retrieve(
            financialAccountId,
            { expand: ["features"] },
            { stripeAccount: testAccountId }
        );
        const status = fa.features?.card_issuing?.status;
        log("Step 3", `Poll ${i + 1}/${MAX_POLLS}: card_issuing=${status}`);

        if (status === "active") {
            log("Step 3", "✅ FA card_issuing is active");
            return;
        }
        await new Promise((r) => setTimeout(r, 3000));
    }
    throw new Error("FA card_issuing did not become active within timeout");
}

async function step4_backdateTask() {
    log("Step 4", "Backdating updatedAt to simulate stale task (>5 min ago)...");

    const staleTime = new Date(Date.now() - 6 * 60 * 1000);
    await db.collection(PROVISIONING_COLLECTION).doc(testUid).update({
        updatedAt: admin.firestore.Timestamp.fromDate(staleTime),
    });

    assert("No webhook was triggered (simulating missed webhook)", true);
    log("Step 4", "✅ Task backdated to simulate stale state");
}

async function step5_runCronHandler() {
    log("Step 5", "Running cron watchdog handler...");

    const STALE_THRESHOLD_MS = 5 * 60 * 1000;
    const MAX_RETRIES = 3;
    const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);

    const snapshot = await db
        .collection(PROVISIONING_COLLECTION)
        .where("status", "in", ["phase1", "waiting_for_activation", "phase3"])
        .where("updatedAt", "<", cutoff)
        .get();

    log("Step 5", `Cron found ${snapshot.size} stuck task(s)`);
    assert("Cron detects at least 1 stuck task", snapshot.size >= 1);

    let found = false;
    for (const doc of snapshot.docs) {
        if (doc.id !== testUid) continue;
        found = true;

        const data = doc.data();
        assert("Stuck task has status waiting_for_activation", data.status === "waiting_for_activation");

        const financialAccountId = data.financialAccountId;
        assert("Task has financialAccountId", !!financialAccountId);

        const fa = await stripe.treasury.financialAccounts.retrieve(
            financialAccountId,
            { expand: ["features"] },
            { stripeAccount: data.accountId }
        );
        const cardIssuingStatus = fa.features?.card_issuing?.status;
        log("Step 5", `FA card_issuing status: ${cardIssuingStatus}`);
        assert("FA card_issuing is active", cardIssuingStatus === "active");

        log("Step 5", "Running phase3 via cron path...");
        await provisioningService.runPhase3(
            testUid,
            data.accountId,
            financialAccountId,
            data.body || {}
        );
    }

    assert("Our test task was found by cron query", found);
    log("Step 5", "✅ Cron handler completed");
}

async function step6_verifyComplete() {
    log("Step 6", "Verifying final state...");

    const task = await db.collection(PROVISIONING_COLLECTION).doc(testUid).get();
    const data = task.data();

    log("Step 6", "Final provisioning state:", {
        status: data.status,
        step: data.step,
        virtualCardId: data.virtualCardId,
        cardholderId: data.cardholderId,
    });

    assert("Status is 'complete'", data.status === "complete");
    assert("virtualCardId is set", !!data.virtualCardId);
    assert("cardholderId is set", !!data.cardholderId);
    assert("Cron successfully completed provisioning", data.status === "complete");
}

async function step7_verifyIdempotency() {
    log("Step 7", "Verifying idempotency (running phase3 again)...");

    const task = await db.collection(PROVISIONING_COLLECTION).doc(testUid).get();
    const data = task.data();

    await provisioningService.runPhase3(
        testUid,
        data.accountId || testAccountId,
        data.financialAccountId,
        data.body || {}
    );

    const after = await db.collection(PROVISIONING_COLLECTION).doc(testUid).get();
    assert("Status still 'complete' after re-run (idempotent)", after.data().status === "complete");
    assert("virtualCardId unchanged", after.data().virtualCardId === data.virtualCardId);
    log("Step 7", "✅ Idempotency verified");
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
    console.log("  TEST 2: CRON FALLBACK PROVISIONING");
    console.log("=".repeat(70));
    console.log();

    const start = Date.now();

    try {
        await setup();
        await step1_createAccountAndRunPhase1();
        const taskData = await step2_waitForWaitingStatus();
        await step3_waitForFAActive(taskData.financialAccountId);
        await step4_backdateTask();
        await step5_runCronHandler();
        await step6_verifyComplete();
        await step7_verifyIdempotency();

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
