/**
 * E2E Child Card Spending Controls Test
 *
 * Provisions a real Stripe account, funds it, and systematically tests every
 * parental spending control on the child's virtual card:
 *
 *   Phase 1 — Setup (Steps 1-6)
 *     1. Parent signs up              → Firebase Auth + Firestore
 *     2. Parent creates event         → Firestore event doc
 *     3. Parent submits banking       → createCustomConnectAccount
 *     4. Wait for provisioning        → onSnapshot
 *     5. Webhook activates card       → handleFAFeaturesUpdated → get cardId
 *     6. Fund account ($500)          → receivedCredit to FA
 *
 *   Phase 2 — Spending Controls (Steps A-P)
 *     A. Baseline purchase                      → approved
 *     B. Freeze card                            → declined → unfreeze
 *     C. Per-transaction limit (within)         → approved
 *     D. Per-transaction limit (over)           → declined
 *     E. Daily spending limit (cumulative)      → approved then declined
 *     F. Reset limits                           → approved
 *     G. Blocked category: drinking_places      → declined
 *     H. Blocked category: gambling_transactions→ declined
 *     I. Allowed category: restaurants          → approved
 *     J. Add custom blocked category            → declined
 *     K. Remove custom blocked category         → approved
 *     L. Country: US (allowed)                  → approved
 *     M. Country: GB (blocked)                  → declined
 *     N. Add GB to allowed countries            → approved → reset
 *     O. Combined controls (limit + category)   → mixed
 *     P. Frozen card overrides all              → declined
 *
 *   Phase 3 — Summary (Steps Q-R)
 *     Q. Transaction list
 *     R. Authorization history
 *
 * Usage:
 *   node functions/tests/test-child-card-spending-controls.js [--cleanup]
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

const FIRST_NAMES = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn", "Jamie", "Dakota"];
const LAST_NAMES = ["Smith", "Chen", "Garcia", "Patel", "Kim", "Brown", "Silva", "Muller", "Tanaka", "Wilson"];
const CHILD_NAMES = ["Mia", "Liam", "Emma", "Noah", "Olivia", "Elijah", "Ava", "Lucas", "Sophia", "Mason"];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const parentFirst = pick(FIRST_NAMES);
const parentLast = pick(LAST_NAMES);
const childName = pick(CHILD_NAMES);
const childAge = Math.floor(Math.random() * 10) + 3;

const FUND_AMOUNT = 50000; // $500

const DEFAULT_BLOCKED_CATEGORIES = [
    "drinking_places",
    "package_stores_beer_wine_and_liquor",
    "cigar_stores_and_stands",
    "betting_casino_gambling",
    "government_licensed_online_casions_online_gambling_us_region_only",
    "government_licensed_horse_dog_racing_us_region_only",
    "dating_escort_services",
    "wires_money_orders",
    "pawn_shops",
];

const PARENT = {
    email: `test-controls-${RUN_ID}@creditkid.app`,
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
let cardId = null;
let unsubscribe = null;
const statusTimeline = [];
let assertions = { passed: 0, failed: 0 };

// ─── Helpers ───────────────────────────────────────────────────────

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

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
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

/**
 * Attempt a test authorization. Captures approved auths so they appear as
 * transactions in Phase 3.  Returns the Authorization object (or a synthetic
 * declined stub when Stripe throws).
 */
async function tryAuth(label, amount, merchantData = {}) {
    const merch = {
        category: "eating_places_restaurants",
        country: "US",
        name: "Test Merchant",
        city: "San Francisco",
        state: "CA",
        ...merchantData,
    };
    try {
        const auth = await stripe.testHelpers.issuing.authorizations.create(
            { card: cardId, amount, merchant_data: merch },
            { stripeAccount: accountId }
        );
        const verdict = auth.approved ? "APPROVED" : "DECLINED";
        log("💳", `[${label}] ${$(amount)} → ${verdict}  (${merch.category}, ${merch.country})`);

        if (auth.approved) {
            try {
                await stripe.testHelpers.issuing.authorizations.capture(
                    auth.id, {}, { stripeAccount: accountId }
                );
            } catch (capErr) {
                log("⚠️", `Capture failed for ${auth.id}: ${capErr.message}`);
            }
        }
        return auth;
    } catch (err) {
        log("⚠️", `[${label}] Auth error: ${err.message}`);
        return { approved: false, error: err.message };
    }
}

// ═══════════════════════════════════════════════════════════════════
//  PHASE 1 — SETUP
// ═══════════════════════════════════════════════════════════════════

async function setup_1_parentSignsUp() {
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

async function setup_2_parentCreatesEvent() {
    log("🎂", `CREATE EVENT — ${childName}'s ${childAge}th birthday party`);

    const eventRef = await db.collection("events").add({
        eventName: `${childName}'s Birthday Party`,
        eventType: "birthday",
        childName: `${childName} ${parentLast}`,
        childAge,
        eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        suggestedAmount: FUND_AMOUNT,
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

async function setup_3_parentSubmitsBanking() {
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

async function setup_4_waitForProvisioning() {
    log("📱", "PROVISIONING — Waiting for phase1 → waiting_for_activation...");

    for (let i = 0; i < 30; i++) {
        await sleep(2000);
        const latest = statusTimeline[statusTimeline.length - 1];
        if (latest?.status === "waiting_for_activation") {
            log("📱", "Provisioning reached waiting_for_activation");
            assert("Saw phase1 status", statusTimeline.some((s) => s.status === "phase1"));
            assert("Saw waiting_for_activation", true);
            return;
        }
        if (latest?.status === "failed") throw new Error(`Provisioning failed: ${latest.step}`);
    }
    throw new Error("Timed out waiting for waiting_for_activation");
}

async function setup_5_webhookActivation() {
    log("⚡", "WEBHOOK — Waiting for FA card_issuing to activate...");

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
            assert("Webhook handler completed", true);

            // Wait for onSnapshot to see "complete"
            for (let j = 0; j < 10; j++) {
                const latest = statusTimeline[statusTimeline.length - 1];
                if (latest?.status === "complete") break;
                await sleep(1000);
            }

            // Retrieve the card ID from provisioning task
            const finalTask = await db.collection(PROVISIONING_COLLECTION).doc(uid).get();
            cardId = finalTask.data().virtualCardId;
            assert("Card ID retrieved from provisioning", !!cardId);
            log("⚡", `Card ID: ${cardId}`);
            return;
        }
        await sleep(3000);
    }
    throw new Error("FA did not activate within timeout");
}

async function setup_6_fundAccount() {
    log("🎁", `FUND ACCOUNT — Adding ${$(FUND_AMOUNT)} to financial account`);

    // Wait for ABA feature to activate (needed for ACH credits)
    for (let i = 0; i < 20; i++) {
        const fa = await stripe.treasury.financialAccounts.retrieve(
            financialAccountId,
            { expand: ["features"] },
            { stripeAccount: accountId }
        );
        const abaStatus = fa.features?.financial_addresses?.aba?.status;
        if (abaStatus === "active") break;
        if (i % 5 === 0) log("🎁", `Waiting for ABA feature... status=${abaStatus} (${i + 1}/20)`);
        await sleep(3000);
    }

    const credit = await stripe.testHelpers.treasury.receivedCredits.create(
        {
            financial_account: financialAccountId,
            amount: FUND_AMOUNT,
            currency: "usd",
            network: "ach",
            description: "Fund",
        },
        { stripeAccount: accountId }
    );

    assert("Received credit created", !!credit.id);
    assert(`Credit amount is ${$(FUND_AMOUNT)}`, credit.amount === FUND_AMOUNT);
    assert("Credit status is succeeded", credit.status === "succeeded");
    log("🎁", `Funded: ${$(credit.amount)} — ${credit.status}`);

    // Brief pause for balance to settle
    await sleep(2000);
}

// ═══════════════════════════════════════════════════════════════════
//  PHASE 2 — SPENDING CONTROL TESTS
// ═══════════════════════════════════════════════════════════════════

async function testA_baseline() {
    log("🔵", "A. BASELINE — purchase with no extra restrictions");
    const auth = await tryAuth("baseline", 1000, { category: "taxicabs_limousines" });
    assert("A. Baseline $10 purchase approved", auth.approved === true);
}

async function testB_freeze() {
    log("🔵", "B. FREEZE CARD — should decline all purchases");
    await stripeService.updateCardStatus(stripe, { accountId, cardId, status: "inactive" });
    await sleep(1000);

    const auth = await tryAuth("frozen", 1000);
    assert("B. Frozen card purchase declined", auth.approved === false);

    await stripeService.updateCardStatus(stripe, { accountId, cardId, status: "active" });
    await sleep(1000);
    log("🔵", "B. Card unfrozen");
}

async function testC_perAuthWithin() {
    log("🔵", "C. PER-TRANSACTION LIMIT (within) — $15 vs $20 limit");
    await stripeService.updateCardSpendingControls(stripe, {
        accountId, cardId,
        spendingLimits: [{ amount: 2000, interval: "per_authorization" }],
    });
    await sleep(1000);

    const auth = await tryAuth("per-auth-within", 1500);
    assert("C. $15 within $20 per-auth limit approved", auth.approved === true);
}

async function testD_perAuthOver() {
    log("🔵", "D. PER-TRANSACTION LIMIT (over) — $25 vs $20 limit");
    const auth = await tryAuth("per-auth-over", 2500);
    assert("D. $25 exceeding $20 per-auth limit declined", auth.approved === false);
}

async function testE_dailyLimit() {
    // Prior approved spending today: A=$10 + C=$15 = $25 cumulative.
    // Set daily limit to $100 so $60 fits but $60+$30 ($90 + $25 prior = $115) does not.
    log("🔵", "E. DAILY SPENDING LIMIT — $60 + $30 against $100/day (with ~$25 prior)");
    await stripeService.updateCardSpendingControls(stripe, {
        accountId, cardId,
        spendingLimits: [{ amount: 10000, interval: "daily" }],
    });
    await sleep(1000);

    const auth1 = await tryAuth("daily-first", 6000);
    assert("E1. $60 within $100 daily limit (cumul ~$85) approved", auth1.approved === true);

    log("🔵", "E. Waiting 10s for spending aggregation...");
    await sleep(10000);

    const auth2 = await tryAuth("daily-second", 3000);
    assert("E2. $30 exceeding $100 daily (cumul ~$115) declined", auth2.approved === false);
}

async function testF_resetLimits() {
    log("🔵", "F. RESET LIMITS — restore generous limit");
    await stripeService.updateCardSpendingControls(stripe, {
        accountId, cardId,
        spendingLimits: [{ amount: 50000, interval: "per_authorization" }],
    });
    await sleep(1000);

    const auth = await tryAuth("reset", 1000);
    assert("F. Purchase after limit reset approved", auth.approved === true);
}

async function testG_blockedDrinking() {
    log("🔵", "G. BLOCKED CATEGORY — drinking_places (default)");
    const auth = await tryAuth("blocked-drinking", 1000, { category: "drinking_places" });
    assert("G. Drinking places declined", auth.approved === false);
}

async function testH_blockedGambling() {
    log("🔵", "H. BLOCKED CATEGORY — betting_casino_gambling (default)");
    const auth = await tryAuth("blocked-gambling", 1000, { category: "betting_casino_gambling" });
    assert("H. Gambling declined", auth.approved === false);
}

async function testI_allowedCategory() {
    log("🔵", "I. ALLOWED CATEGORY — eating_places_restaurants");
    const auth = await tryAuth("allowed-eating", 1000, { category: "eating_places_restaurants" });
    assert("I. Restaurants approved", auth.approved === true);
}

async function testJ_addCustomBlock() {
    log("🔵", "J. ADD CUSTOM BLOCKED CATEGORY — fast_food_restaurants");
    await stripeService.updateCardSpendingControls(stripe, {
        accountId, cardId,
        blockedCategories: [...DEFAULT_BLOCKED_CATEGORIES, "fast_food_restaurants"],
    });
    await sleep(1000);

    const auth = await tryAuth("custom-blocked", 1000, { category: "fast_food_restaurants" });
    assert("J. Fast food declined after adding to block list", auth.approved === false);
}

async function testK_removeCustomBlock() {
    log("🔵", "K. REMOVE CUSTOM BLOCKED CATEGORY — fast_food_restaurants");
    await stripeService.updateCardSpendingControls(stripe, {
        accountId, cardId,
        blockedCategories: DEFAULT_BLOCKED_CATEGORIES,
    });
    await sleep(1000);

    const auth = await tryAuth("unblocked-fastfood", 1000, { category: "fast_food_restaurants" });
    assert("K. Fast food approved after removing from block list", auth.approved === true);
}

async function testL_usAllowed() {
    log("🔵", "L. COUNTRY RESTRICTION — US merchant (allowed)");
    const auth = await tryAuth("us-allowed", 1000, { country: "US" });
    assert("L. US merchant approved", auth.approved === true);
}

async function testM_gbBlocked() {
    log("🔵", "M. COUNTRY RESTRICTION — GB merchant (blocked by default)");
    const auth = await tryAuth("gb-blocked", 1000, { country: "GB" });
    assert("M. GB merchant declined", auth.approved === false);
}

async function testN_addGbCountry() {
    log("🔵", "N. ADD GB TO ALLOWED COUNTRIES");
    await stripeService.updateCardSpendingControls(stripe, {
        accountId, cardId,
        allowedMerchantCountries: ["US", "GB"],
    });
    await sleep(1000);

    const auth = await tryAuth("gb-allowed", 1000, { country: "GB" });
    assert("N. GB merchant approved after adding to allowed list", auth.approved === true);

    // Reset to US-only
    await stripeService.updateCardSpendingControls(stripe, {
        accountId, cardId,
        allowedMerchantCountries: ["US"],
    });
    await sleep(1000);
    log("🔵", "N. Reset to US-only");
}

async function testO_combined() {
    log("🔵", "O. COMBINED CONTROLS — $30 per-auth limit + default blocked categories");
    await stripeService.updateCardSpendingControls(stripe, {
        accountId, cardId,
        spendingLimits: [{ amount: 3000, interval: "per_authorization" }],
    });
    await sleep(1000);

    const auth1 = await tryAuth("combined-ok", 2500, { category: "eating_places_restaurants" });
    assert("O1. $25 at restaurant (within limit, allowed) approved", auth1.approved === true);

    const auth2 = await tryAuth("combined-blocked-cat", 2500, { category: "drinking_places" });
    assert("O2. $25 at bar (blocked category) declined", auth2.approved === false);

    const auth3 = await tryAuth("combined-over-limit", 3500, { category: "eating_places_restaurants" });
    assert("O3. $35 at restaurant (over $30 limit) declined", auth3.approved === false);

    // Reset limits for subsequent tests
    await stripeService.updateCardSpendingControls(stripe, {
        accountId, cardId,
        spendingLimits: [{ amount: 50000, interval: "per_authorization" }],
    });
}

async function testP_frozenOverrides() {
    log("🔵", "P. FROZEN CARD OVERRIDES ALL — valid $5 purchase on frozen card");
    await stripeService.updateCardStatus(stripe, { accountId, cardId, status: "inactive" });
    await sleep(1000);

    const auth = await tryAuth("frozen-valid", 500, {
        category: "eating_places_restaurants",
        country: "US",
    });
    assert("P. Valid purchase on frozen card declined", auth.approved === false);

    await stripeService.updateCardStatus(stripe, { accountId, cardId, status: "active" });
    await sleep(1000);
    log("🔵", "P. Card unfrozen");
}

// ═══════════════════════════════════════════════════════════════════
//  PHASE 3 — SUMMARY VERIFICATION
// ═══════════════════════════════════════════════════════════════════

async function testQ_transactions() {
    log("📊", "Q. TRANSACTION LIST — verifying captured transactions");
    await sleep(2000);

    const result = await stripeService.listIssuingTransactions(stripe, {
        accountId, cardId, limit: 100,
    });
    const count = result.data.length;
    log("📊", `Found ${count} transaction(s)`);

    for (const t of result.data.slice(0, 5)) {
        log("📊", `  ${t.id}: ${$(Math.abs(t.amount))} at ${t.merchant_data?.name || "unknown"} (${t.merchant_data?.category || "?"})`);
    }

    assert("Q. At least 1 captured transaction exists", count >= 1);
}

async function testR_authorizations() {
    log("📊", "R. AUTHORIZATION HISTORY — verifying approved + declined");

    const result = await stripeService.listIssuingAuthorizations(stripe, {
        accountId, cardId, limit: 100,
    });
    const total = result.data.length;
    const approved = result.data.filter((a) => a.approved).length;
    const declined = total - approved;

    log("📊", `Found ${total} authorization(s): ${approved} approved, ${declined} declined`);

    assert("R1. Multiple authorizations recorded", total >= 10);
    assert("R2. At least 5 approved", approved >= 5);
    assert("R3. At least 5 declined", declined >= 5);
}

// ─── Cleanup ───────────────────────────────────────────────────────

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

// ─── Main ──────────────────────────────────────────────────────────

async function main() {
    console.log();
    console.log("╔" + "═".repeat(68) + "╗");
    console.log("║  E2E CHILD CARD SPENDING CONTROLS TEST" + " ".repeat(29) + "║");
    console.log("║" + " ".repeat(68) + "║");
    console.log(`║  Parent: ${(parentFirst + " " + parentLast).padEnd(58)}║`);
    console.log(`║  Child:  ${(childName + " " + parentLast + ", age " + childAge).padEnd(58)}║`);
    console.log(`║  Fund:   ${$(FUND_AMOUNT)}${" ".repeat(56)}║`);
    console.log("╚" + "═".repeat(68) + "╝");
    console.log();

    const start = Date.now();

    try {
        // ── Phase 1: Setup ──
        console.log("─".repeat(70));
        console.log("  PHASE 1 — SETUP");
        console.log("─".repeat(70));

        await setup_1_parentSignsUp();
        console.log();
        await setup_2_parentCreatesEvent();
        console.log();
        await setup_3_parentSubmitsBanking();
        console.log();
        await setup_4_waitForProvisioning();
        console.log();
        await setup_5_webhookActivation();
        console.log();
        await setup_6_fundAccount();

        // ── Phase 2: Spending Controls ──
        console.log();
        console.log("─".repeat(70));
        console.log("  PHASE 2 — SPENDING CONTROL TESTS");
        console.log("─".repeat(70));

        await testA_baseline();
        console.log();
        await testB_freeze();
        console.log();
        await testC_perAuthWithin();
        console.log();
        await testD_perAuthOver();
        console.log();
        await testE_dailyLimit();
        console.log();
        await testF_resetLimits();
        console.log();
        await testG_blockedDrinking();
        console.log();
        await testH_blockedGambling();
        console.log();
        await testI_allowedCategory();
        console.log();
        await testJ_addCustomBlock();
        console.log();
        await testK_removeCustomBlock();
        console.log();
        await testL_usAllowed();
        console.log();
        await testM_gbBlocked();
        console.log();
        await testN_addGbCountry();
        console.log();
        await testO_combined();
        console.log();
        await testP_frozenOverrides();

        // ── Phase 3: Summary ──
        console.log();
        console.log("─".repeat(70));
        console.log("  PHASE 3 — SUMMARY VERIFICATION");
        console.log("─".repeat(70));

        await testQ_transactions();
        console.log();
        await testR_authorizations();

        // ── Results ──
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
