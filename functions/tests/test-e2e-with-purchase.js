/**
 * End-to-End Client Flow Test — WITH FUNDING + PURCHASE
 *
 * Full user journey including a guest gifting money and the parent
 * spending it with the virtual card:
 *
 *   1. Parent signs up                    → Firebase Auth + Firestore
 *   2. Parent creates a birthday event    → Firestore event doc
 *   3. Parent submits banking info        → createCustomConnectAccount (API)
 *   4. App shows real-time progress       → onSnapshot
 *   5. Stripe webhook activates card      → handleFAFeaturesUpdated
 *   6. App shows "Card ready!"            → onSnapshot sees "complete"
 *   7. Parent views card details          → getCardDetails (API)
 *   8. Guest sends a $50 gift             → receivedCredit to FA (simulates gift)
 *   9. Parent checks balance              → getFinancialAccountBalance (API)
 *  10. Parent makes a $25 purchase        → createTestAuthorization — APPROVED
 *  11. Parent checks remaining balance    → balance reduced by $25
 *
 * Usage:
 *   node functions/tests/test-e2e-with-purchase.js [--cleanup]
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
const { handleFAFeaturesUpdated } = require("../controllers/webhookController");

const provisioningService = createProvisioningService(stripe, stripeService);
const stripeConnectService = createStripeConnectService(stripe, stripeService, provisioningService);

const CLEANUP = process.argv.includes("--cleanup");
const RUN_ID = Date.now();

const FIRST_NAMES = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn", "Jamie", "Dakota", "Skyler", "Reese", "Harper", "Finley", "Emerson"];
const LAST_NAMES = ["Smith", "Chen", "Garcia", "Patel", "Kim", "Brown", "Silva", "Muller", "Tanaka", "Wilson", "Ahmed", "Kowalski", "Santos", "Berg", "Russo"];
const CHILD_NAMES = ["Mia", "Liam", "Emma", "Noah", "Olivia", "Elijah", "Ava", "Lucas", "Sophia", "Mason"];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const parentFirst = pick(FIRST_NAMES);
const parentLast = pick(LAST_NAMES);
const childName = pick(CHILD_NAMES);
const childAge = Math.floor(Math.random() * 10) + 3;

const GIFT_AMOUNT = 5000;
const PURCHASE_AMOUNT = 2500;

const PARENT = {
    email: `test-purchase-${RUN_ID}@creditkid.app`,
    password: "TestPassword123!",
    firstName: parentFirst,
    lastName: parentLast,
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

let uid = null;
let eventId = null;
let accountId = null;
let financialAccountId = null;
let unsubscribe = null;
const statusTimeline = [];
let assertions = { passed: 0, failed: 0 };

// ─── Helpers ───

function ts() {
    return new Date().toISOString().split("T")[1].replace("Z", "");
}

function log(icon, msg, data) {
    const line = `[${ts()}] ${icon}  ${msg}`;
    if (data !== undefined) {
        console.log(line, typeof data === "object" ? JSON.stringify(data, null, 2) : data);
    } else {
        console.log(line);
    }
}

function assert(label, condition) {
    if (condition) {
        console.log(`       ✅ ${label}`);
        assertions.passed++;
    } else {
        console.error(`       ❌ FAILED: ${label}`);
        assertions.failed++;
    }
}

function $(cents) {
    return `$${(cents / 100).toFixed(2)}`;
}

function startRealtimeListener() {
    return new Promise((resolve) => {
        const docRef = db.collection(PROVISIONING_COLLECTION).doc(uid);
        unsubscribe = docRef.onSnapshot((snapshot) => {
            if (!snapshot.exists) return;
            const data = snapshot.data();
            statusTimeline.push({ status: data.status, step: data.step, time: ts() });
            log("📡", `[realtime] status=${data.status} → "${data.step}"`);
        }, (err) => {
            console.warn(`[realtime] listener error: ${err.message}`);
        });
        resolve();
    });
}

// ─── Test Steps ───

async function step1_parentSignsUp() {
    log("👤", `SIGN UP — ${parentFirst} ${parentLast} creates an account`);

    const userRecord = await admin.auth().createUser({
        email: PARENT.email,
        password: PARENT.password,
        displayName: `${parentFirst} ${parentLast}`,
        phoneNumber: PARENT.phone,
    });
    uid = userRecord.uid;

    await db.collection("users").doc(uid).set({
        email: PARENT.email,
        fullName: `${parentFirst} ${parentLast}`,
        phone: PARENT.phone,
        role: "parent",
        onboardingStep: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    assert("Firebase user created", !!uid);
    log("👤", `Account created: ${uid}`);
}

async function step2_parentCreatesEvent() {
    log("🎂", `CREATE EVENT — ${childName}'s ${childAge}th birthday party`);

    const eventRef = await db.collection("events").add({
        eventName: `${childName}'s Birthday Party`,
        eventType: "birthday",
        childName: `${childName} ${parentLast}`,
        childAge,
        eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        suggestedAmount: GIFT_AMOUNT,
        venue: "Fun Zone",
        description: `${childName}'s ${childAge}th birthday!`,
        creatorId: uid,
        creatorEmail: PARENT.email,
        status: "active",
        guestCount: 0,
        totalGifted: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    eventId = eventRef.id;

    await db.collection("users").doc(uid).update({
        onboardingStep: 1,
        eventIds: admin.firestore.FieldValue.arrayUnion(eventId),
    });

    assert("Event created", !!eventId);
    log("🎂", `Event ID: ${eventId}`);
}

async function step3_parentSubmitsBanking() {
    log("🏦", "SUBMIT BANKING — Parent fills out banking form and submits");

    await startRealtimeListener();

    const result = await stripeConnectService.createCustomConnectAccount(uid, {
        country: "US",
        firstName: parentFirst,
        lastName: parentLast,
        email: PARENT.email,
        phone: PARENT.phone,
        dob: PARENT.dob,
        address: PARENT.address,
        city: PARENT.city,
        state: PARENT.state,
        zipCode: PARENT.zipCode,
        ssnLast4: PARENT.ssnLast4,
        routingNumber: PARENT.routingNumber,
        accountNumber: PARENT.accountNumber,
        accountHolderName: `${parentFirst} ${parentLast}`,
        useTestDocument: true,
    });

    accountId = result.accountId;
    assert("API returned accountId", !!accountId);
    log("🏦", `Stripe account: ${accountId}`);
}

async function step4_appShowsProgress() {
    log("📱", "APP PROGRESS — Client sees real-time updates via onSnapshot...");

    for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const latest = statusTimeline[statusTimeline.length - 1];
        if (latest?.status === "waiting_for_activation") {
            log("📱", "App shows: 'Activating financial account...'");
            assert("Client saw phase1 status", statusTimeline.some((s) => s.status === "phase1"));
            assert("Client saw waiting_for_activation status", true);
            return;
        }
        if (latest?.status === "failed") throw new Error(`Provisioning failed: ${latest.step}`);
    }
    throw new Error("Timed out waiting for waiting_for_activation");
}

async function step5_stripeFiresWebhook() {
    log("⚡", "WEBHOOK — Stripe activates FA and fires webhook...");

    const task = await db.collection(PROVISIONING_COLLECTION).doc(uid).get();
    financialAccountId = task.data().financialAccountId;

    for (let i = 0; i < 40; i++) {
        const fa = await stripe.treasury.financialAccounts.retrieve(
            financialAccountId,
            { expand: ["features"] },
            { stripeAccount: accountId }
        );
        const status = fa.features?.card_issuing?.status;
        if (i % 5 === 0) log("⚡", `Waiting for Stripe... card_issuing=${status} (${i + 1}/40)`);

        if (status === "active") {
            log("⚡", "FA activated — firing webhook handler");
            await handleFAFeaturesUpdated(db, provisioningService, {
                id: fa.id,
                features: fa.features,
                metadata: fa.metadata,
            });
            assert("Webhook handler completed successfully", true);
            return;
        }
        await new Promise((r) => setTimeout(r, 3000));
    }
    throw new Error("FA did not activate within timeout");
}

async function step6_appShowsCardReady() {
    log("📱", "APP COMPLETE — Waiting for onSnapshot to deliver 'complete'...");

    for (let i = 0; i < 10; i++) {
        const latest = statusTimeline[statusTimeline.length - 1];
        if (latest?.status === "complete") {
            log("📱", "App shows: 'Card ready!'");
            assert("Client saw complete status", true);
            return;
        }
        await new Promise((r) => setTimeout(r, 1000));
    }
    assert("Client saw complete status", false);
}

async function step7_parentViewsCard() {
    log("💳", "VIEW CARD — Parent taps to see card details");

    const card = await stripeConnectService.getCardDetails(uid);
    assert("Card details returned", !!card);
    assert("Card has last4", !!card.last4);
    assert("Card has no full number (sensitive)", !card.number);
    assert("Card has no CVC (sensitive)", !card.cvc);

    log("💳", `Card: **** **** **** ${card.last4}  exp ${card.exp_month}/${card.exp_year}  ${card.brand}`);
}

async function step8_guestSendsGift() {
    log("🎁", `GIFT — A guest sends ${$(GIFT_AMOUNT)} for ${childName}'s birthday`);

    // Wait for financial_addresses.aba feature to activate (needed for ACH credits)
    for (let i = 0; i < 20; i++) {
        const fa = await stripe.treasury.financialAccounts.retrieve(
            financialAccountId,
            { expand: ["features"] },
            { stripeAccount: accountId }
        );
        const abaStatus = fa.features?.financial_addresses?.aba?.status;
        if (abaStatus === "active") break;
        if (i % 5 === 0) log("🎁", `Waiting for ABA feature... status=${abaStatus} (${i + 1}/20)`);
        await new Promise((r) => setTimeout(r, 3000));
    }

    const credit = await stripe.testHelpers.treasury.receivedCredits.create(
        {
            financial_account: financialAccountId,
            amount: GIFT_AMOUNT,
            currency: "usd",
            network: "ach",
            description: "Gift",
        },
        { stripeAccount: accountId }
    );

    assert("Received credit created", !!credit.id);
    assert(`Credit amount is ${$(GIFT_AMOUNT)}`, credit.amount === GIFT_AMOUNT);
    assert("Credit status is succeeded", credit.status === "succeeded");

    log("🎁", `Credit ${credit.id}: ${$(credit.amount)} — ${credit.status}`);
}

async function step9_parentChecksBalance() {
    log("💰", "CHECK BALANCE — Parent opens the app to see their balance");

    await new Promise((r) => setTimeout(r, 2000));

    const fa = await stripe.treasury.financialAccounts.retrieve(
        financialAccountId,
        { stripeAccount: accountId }
    );

    const cash = fa.balance?.cash?.usd || 0;
    log("💰", `Financial Account balance: ${$(cash)}`);

    assert(`Balance is ${$(GIFT_AMOUNT)}`, cash === GIFT_AMOUNT);
}

async function step10_parentMakesPurchase() {
    log("🛒", `PURCHASE — Parent uses card for a ${$(PURCHASE_AMOUNT)} purchase`);

    const auth = await stripeConnectService.createTestAuthorization(uid, PURCHASE_AMOUNT);

    assert("Authorization created", !!auth.authorizationId);
    assert("Authorization APPROVED", auth.approved === true);
    assert(`Amount is ${$(PURCHASE_AMOUNT)}`, auth.amount === PURCHASE_AMOUNT);

    log("🛒", `Authorization ${auth.authorizationId}: ${$(auth.amount)} — ${auth.approved ? "APPROVED" : "DECLINED"}`);
}

async function step11_parentChecksRemainingBalance() {
    log("💰", "REMAINING BALANCE — Parent checks how much is left");

    await new Promise((r) => setTimeout(r, 2000));

    const fa = await stripe.treasury.financialAccounts.retrieve(
        financialAccountId,
        { stripeAccount: accountId }
    );

    const cash = fa.balance?.cash?.usd || 0;
    const expected = GIFT_AMOUNT - PURCHASE_AMOUNT;

    log("💰", `Balance: ${$(cash)}  (started ${$(GIFT_AMOUNT)}, spent ${$(PURCHASE_AMOUNT)})`);

    assert(`Remaining balance is ${$(expected)}`, cash === expected);
}

// ─── Cleanup ───

async function cleanup() {
    console.log("\n--- CLEANUP ---");
    try {
        if (unsubscribe) unsubscribe();
        if (accountId) { await stripe.accounts.del(accountId); console.log("  Stripe account deleted"); }
        if (eventId) { await db.collection("events").doc(eventId).delete(); console.log("  Event deleted"); }
        if (uid) {
            await db.collection("stripeAccounts").doc(uid).delete();
            await db.collection(PROVISIONING_COLLECTION).doc(uid).delete();
            await db.collection("users").doc(uid).delete();
            await admin.auth().deleteUser(uid);
            console.log("  User + Firestore docs deleted");
        }
        console.log("  ✅ Cleanup complete");
    } catch (err) {
        console.error("  Cleanup error:", err.message);
    }
}

// ─── Main ───

async function main() {
    console.log();
    console.log("╔" + "═".repeat(68) + "╗");
    console.log("║  E2E CLIENT FLOW — WITH FUNDING + PURCHASE" + " ".repeat(24) + "║");
    console.log("║" + " ".repeat(68) + "║");
    console.log(`║  Parent: ${(parentFirst + " " + parentLast).padEnd(58)}║`);
    console.log(`║  Child:  ${(childName + " " + parentLast + ", age " + childAge).padEnd(58)}║`);
    console.log(`║  Gift:   ${$(GIFT_AMOUNT)}   Purchase: ${$(PURCHASE_AMOUNT)}${" ".repeat(42)}║`);
    console.log("╚" + "═".repeat(68) + "╝");
    console.log();

    const start = Date.now();

    try {
        await step1_parentSignsUp();
        console.log();
        await step2_parentCreatesEvent();
        console.log();
        await step3_parentSubmitsBanking();
        console.log();
        await step4_appShowsProgress();
        console.log();
        await step5_stripeFiresWebhook();
        console.log();
        await step6_appShowsCardReady();
        console.log();
        await step7_parentViewsCard();
        console.log();
        await step8_guestSendsGift();
        console.log();
        await step9_parentChecksBalance();
        console.log();
        await step10_parentMakesPurchase();
        console.log();
        await step11_parentChecksRemainingBalance();

        const elapsed = ((Date.now() - start) / 1000).toFixed(1);

        console.log();
        console.log("─".repeat(70));
        console.log("  STATUS TIMELINE:");
        console.log("─".repeat(70));
        for (const entry of statusTimeline) {
            const icon = entry.status === "complete" ? "✅" :
                         entry.status === "failed" ? "❌" :
                         entry.status === "waiting_for_activation" ? "⏳" : "🔄";
            console.log(`  ${icon} [${entry.time}] ${entry.status} → "${entry.step}"`);
        }

        console.log();
        console.log("─".repeat(70));
        console.log("  MONEY FLOW:");
        console.log("─".repeat(70));
        console.log(`  🎁 Guest gifted:        +${$(GIFT_AMOUNT)}`);
        console.log(`  🛒 Parent spent:        -${$(PURCHASE_AMOUNT)}`);
        console.log(`  💰 Remaining balance:    ${$(GIFT_AMOUNT - PURCHASE_AMOUNT)}`);

        console.log();
        console.log("╔" + "═".repeat(68) + "╗");
        console.log(`║  ${assertions.passed} PASSED, ${assertions.failed} FAILED — ${elapsed}s${" ".repeat(Math.max(0, 50 - elapsed.length))}║`);
        console.log("╚" + "═".repeat(68) + "╝");
        console.log();

    } catch (err) {
        console.error(`\n  ❌ TEST FAILED: ${err.message}`);
        if (err.stack) console.error(err.stack);
    }

    if (unsubscribe) unsubscribe();
    if (CLEANUP) await cleanup();
    process.exit(assertions.failed > 0 ? 1 : 0);
}

main();
