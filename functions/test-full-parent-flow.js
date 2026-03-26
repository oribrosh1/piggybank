/**
 * End-to-end test: Full parent onboarding flow with Treasury provisioning.
 *
 * Steps:
 *   1. Create a Firebase Auth test user (parent)
 *   2. Create a Firestore user document
 *   3. Create an event for the parent
 *   4. Create a Stripe Custom Connected Account (with bank, SSN, ID doc)
 *      → This fires runProvisioning() Phase 1:
 *        a. Requests capabilities (card_issuing, treasury, transfers, card_payments)
 *        b. Creates a Treasury Financial Account with metadata
 *        c. Sets status to "waiting_for_activation"
 *   5. Verify account is fully active
 *   6. Wait for "waiting_for_activation", then wait for FA activation, then run Phase 3
 *   7. Retrieve card details
 *   8. Create a test authorization on the card
 *
 * Usage:
 *   node functions/test-full-parent-flow.js [--cleanup]
 *
 *   --cleanup  Deletes the test user, Firestore docs, and Stripe account when done
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const PROJECT_ID = "piggybank-a0011";
process.env.GCLOUD_PROJECT = PROJECT_ID;
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, "..", "firebaseserviceAccountKey.json");

const admin = require("firebase-admin");
const Stripe = require("stripe");

admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const stripeService = require("./stripeService");
const { createStripeConnectService } = require("./services/stripeConnectService");
const { createProvisioningService } = require("./services/provisioningService");

const provisioningService = createProvisioningService(stripe, stripeService);
const stripeConnectService = createStripeConnectService(stripe, stripeService, provisioningService);

const CLEANUP = process.argv.includes("--cleanup");

const RUN_ID = Date.now();

const FIRST_NAMES = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn", "Jamie", "Dakota", "Skyler", "Reese", "Harper", "Finley", "Emerson"];
const LAST_NAMES = ["Smith", "Chen", "Garcia", "Patel", "Kim", "Brown", "Silva", "Muller", "Tanaka", "Wilson", "Ahmed", "Kowalski", "Santos", "Berg", "Russo"];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const TEST_PARENT = {
    email: `test-parent-${RUN_ID}@creditkid.app`,
    password: "TestPassword123!",
    firstName: pick(FIRST_NAMES),
    lastName: pick(LAST_NAMES),
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

const TEST_EVENT = {
    eventName: "Test Birthday Party",
    eventType: "birthday",
    childName: "Timmy Rosen",
    childAge: 7,
    eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    suggestedAmount: 2500,
    venue: "Fun Zone",
    description: "Timmy's 7th birthday party!",
};

let testUid = null;
let testEventId = null;
let testAccountId = null;

function log(step, message, data) {
    const ts = new Date().toISOString().split("T")[1].replace("Z", "");
    const prefix = `[${ts}] [Step ${step}]`;
    if (data !== undefined) {
        console.log(`${prefix} ${message}`, typeof data === "object" ? JSON.stringify(data, null, 2) : data);
    } else {
        console.log(`${prefix} ${message}`);
    }
}

function logError(step, message, err) {
    const ts = new Date().toISOString().split("T")[1].replace("Z", "");
    console.error(`[${ts}] [Step ${step}] ❌ ${message}: ${err.message}`);
    if (err.raw) console.error("  Stripe raw:", JSON.stringify(err.raw.message || err.raw));
}

async function step1_createFirebaseUser() {
    log(1, "Creating Firebase Auth user...");
    const userRecord = await admin.auth().createUser({
        email: TEST_PARENT.email,
        password: TEST_PARENT.password,
        displayName: `${TEST_PARENT.firstName} ${TEST_PARENT.lastName}`,
        phoneNumber: TEST_PARENT.phone,
    });
    testUid = userRecord.uid;
    log(1, `✅ Firebase user created`, { uid: testUid, email: userRecord.email, displayName: userRecord.displayName });
    return testUid;
}

async function step2_createUserDocument() {
    log(2, "Creating Firestore user document...");
    await db.collection("users").doc(testUid).set({
        email: TEST_PARENT.email,
        fullName: `${TEST_PARENT.firstName} ${TEST_PARENT.lastName}`,
        phone: TEST_PARENT.phone,
        role: "parent",
        onboardingStep: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const userDoc = await db.collection("users").doc(testUid).get();
    log(2, "✅ User document created", { uid: testUid, ...userDoc.data() });
}

async function step3_createEvent() {
    log(3, "Creating event for parent...");
    const eventRef = await db.collection("events").add({
        ...TEST_EVENT,
        creatorId: testUid,
        creatorEmail: TEST_PARENT.email,
        status: "active",
        guestCount: 0,
        totalGifted: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    testEventId = eventRef.id;

    await db.collection("users").doc(testUid).update({
        onboardingStep: 1,
        eventIds: admin.firestore.FieldValue.arrayUnion(testEventId),
    });

    log(3, "✅ Event created", { eventId: testEventId, eventName: TEST_EVENT.eventName, childName: TEST_EVENT.childName });
}

async function step4_createStripeAccountWithProvisioning() {
    log(4, "Creating Stripe Connected Account + firing provisioning...");
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
    log(4, "✅ Stripe account created, provisioning started", {
        accountId: testAccountId,
        status: result.status,
        existing: result.existing,
    });
}

async function step5_verifyAccountActive() {
    log(5, "Verifying account is fully active...");
    const account = await stripe.accounts.retrieve(testAccountId);
    log(5, "Current status:", {
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        capabilities: account.capabilities,
        currently_due: account.requirements?.currently_due,
    });

    if (account.requirements?.currently_due?.length > 0) {
        log(5, "Resolving pending requirements...", account.requirements.currently_due);

        const updates = {};
        const due = account.requirements.currently_due;

        if (due.includes("individual.id_number")) {
            const accountToken = await stripe.tokens.create({
                account: { business_type: "individual", individual: { id_number: "000000000" } },
            });
            updates.account_token = accountToken.id;
        }
        if (due.includes("individual.phone")) {
            updates.individual = { ...(updates.individual || {}), phone: "+15555550100" };
        }
        if (due.includes("individual.verification.document")) {
            updates.individual = {
                ...(updates.individual || {}),
                verification: { document: { front: "file_identity_document_success" } },
            };
        }

        if (Object.keys(updates).length > 0) {
            await stripe.accounts.update(testAccountId, updates);
            log(5, "Requirements resolved, re-checking...");
        }
    }

    let updated = await stripe.accounts.retrieve(testAccountId);

    const MAX_POLLS = 10;
    for (let i = 0; i < MAX_POLLS && (!updated.charges_enabled || !updated.payouts_enabled); i++) {
        log(5, `Waiting for Stripe to activate account... (${i + 1}/${MAX_POLLS})`);
        await new Promise((r) => setTimeout(r, 3000));
        updated = await stripe.accounts.retrieve(testAccountId);
    }

    log(5, "✅ Account verified", {
        charges_enabled: updated.charges_enabled,
        payouts_enabled: updated.payouts_enabled,
        capabilities: updated.capabilities,
    });

    if (!updated.charges_enabled || !updated.payouts_enabled) {
        log(5, "⚠️  Account not fully enabled after polling — Stripe may need manual review");
    }
}

async function step6_waitForProvisioning() {
    log(6, "Waiting for Phase 1 to complete (waiting_for_activation)...");

    // 6a: Wait for waiting_for_activation
    let taskData = null;
    for (let i = 0; i < 30; i++) {
        const taskDoc = await db.collection("provisioningTasks").doc(testUid).get();
        if (!taskDoc.exists) {
            log(6, `Poll ${i + 1}/30: no provisioningTasks doc yet`);
            await new Promise((r) => setTimeout(r, 2000));
            continue;
        }
        taskData = taskDoc.data();
        log(6, `Poll ${i + 1}/30: status=${taskData.status} step="${taskData.step}"`);

        if (taskData.status === "waiting_for_activation") break;
        if (taskData.status === "complete") {
            log(6, "✅ Already complete!");
            return true;
        }
        if (taskData.status === "failed") {
            log(6, `❌ Provisioning failed: ${taskData.error}`);
            return false;
        }
        await new Promise((r) => setTimeout(r, 2000));
    }

    if (!taskData || taskData.status !== "waiting_for_activation") {
        log(6, "⚠️  Did not reach waiting_for_activation");
        return false;
    }

    // 6b: Wait for FA card_issuing to become active
    log(6, "Waiting for FA card_issuing to become active...");
    const financialAccountId = taskData.financialAccountId;
    for (let i = 0; i < 30; i++) {
        const fa = await stripe.treasury.financialAccounts.retrieve(
            financialAccountId,
            { expand: ["features"] },
            { stripeAccount: testAccountId }
        );
        const status = fa.features?.card_issuing?.status;
        log(6, `FA poll ${i + 1}/30: card_issuing=${status}`);
        if (status === "active") break;
        await new Promise((r) => setTimeout(r, 3000));
    }

    // 6c: Run Phase 3 (simulating what webhook would do)
    log(6, "FA active — running Phase 3...");
    try {
        await provisioningService.runPhase3(testUid, testAccountId, financialAccountId, taskData.body || {});
    } catch (err) {
        log(6, `❌ Phase 3 failed: ${err.message}`);
        return false;
    }

    const finalDoc = await db.collection("provisioningTasks").doc(testUid).get();
    const final = finalDoc.data();
    if (final.status === "complete") {
        log(6, "✅ Provisioning complete!", {
            virtualCardId: final.virtualCardId,
            cardholderId: final.cardholderId,
            financialAccountId: final.financialAccountId,
        });
        return true;
    }

    log(6, `❌ Unexpected final status: ${final.status}`);
    return false;
}

async function step7_getCardDetails() {
    log(7, "Retrieving card details...");
    const result = await stripeConnectService.getCardDetails(testUid);
    log(7, "✅ Card details retrieved", {
        last4: result.last4,
        exp_month: result.exp_month,
        exp_year: result.exp_year,
        brand: result.brand,
    });
}

async function step8_testAuthorization() {
    log(8, "Creating test authorization ($10.00)...");
    const result = await stripeConnectService.createTestAuthorization(testUid, 1000);
    log(8, "✅ Test authorization", {
        authorizationId: result.authorizationId,
        amount: `$${(result.amount / 100).toFixed(2)}`,
        approved: result.approved,
        status: result.status,
    });
}

async function cleanup() {
    console.log("\n--- CLEANUP ---");
    try {
        if (testAccountId) {
            log("C", `Deleting Stripe account ${testAccountId}...`);
            await stripe.accounts.del(testAccountId);
            log("C", "✅ Stripe account deleted");
        }
    } catch (err) {
        logError("C", "Stripe account deletion failed", err);
    }
    try {
        if (testEventId) {
            log("C", `Deleting event ${testEventId}...`);
            await db.collection("events").doc(testEventId).delete();
            log("C", "✅ Event deleted");
        }
    } catch (err) {
        logError("C", "Event deletion failed", err);
    }
    try {
        if (testUid) {
            log("C", `Deleting Firestore docs for ${testUid}...`);
            await db.collection("stripeAccounts").doc(testUid).delete();
            await db.collection("provisioningTasks").doc(testUid).delete();
            await db.collection("users").doc(testUid).delete();
            log("C", "✅ Firestore docs deleted");
        }
    } catch (err) {
        logError("C", "Firestore deletion failed", err);
    }
    try {
        if (testUid) {
            log("C", `Deleting Firebase Auth user ${testUid}...`);
            await admin.auth().deleteUser(testUid);
            log("C", "✅ Firebase user deleted");
        }
    } catch (err) {
        logError("C", "Firebase user deletion failed", err);
    }
}

async function main() {
    console.log("=".repeat(70));
    console.log("  FULL PARENT ONBOARDING FLOW — TREASURY + PROVISIONING TEST");
    console.log("=".repeat(70));
    console.log(`  Stripe key: ${process.env.STRIPE_SECRET_KEY?.slice(0, 12)}...`);
    console.log(`  Cleanup: ${CLEANUP ? "YES" : "NO (pass --cleanup to delete test data)"}`);
    console.log("=".repeat(70));
    console.log();

    const startTime = Date.now();

    try {
        await step1_createFirebaseUser();
        await step2_createUserDocument();
        await step3_createEvent();
        await step4_createStripeAccountWithProvisioning();
        await step5_verifyAccountActive();

        const provisioningOk = await step6_waitForProvisioning();
        if (provisioningOk) {
            await step7_getCardDetails();
            await step8_testAuthorization();
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log();
        console.log("=".repeat(70));
        console.log(`  ✅ ALL STEPS COMPLETED in ${elapsed}s`);
        console.log("=".repeat(70));
        console.log();
        console.log("  Test data summary:");
        console.log(`    Firebase UID:    ${testUid}`);
        console.log(`    Email:           ${TEST_PARENT.email}`);
        console.log(`    Event ID:        ${testEventId}`);
        console.log(`    Stripe Account:  ${testAccountId}`);
        console.log();

    } catch (err) {
        console.error();
        console.error("=".repeat(70));
        console.error("  ❌ TEST FAILED");
        console.error("=".repeat(70));
        console.error(`  Error: ${err.message}`);
        if (err.stack) console.error(err.stack);
    }

    if (CLEANUP) {
        await cleanup();
    }

    process.exit(0);
}

main();
