/**
 * Firestore Security Rules — Live Integration Tests
 *
 * Tests every collection's rules against the REAL Firestore using:
 *   - firebase-admin (server SDK) → seeds data, mints custom tokens, cleans up
 *   - firebase (client SDK)       → simulates a mobile client with auth
 *
 * Each test verifies real allow/deny behaviour from the client perspective,
 * exactly as the mobile app would experience it.
 *
 * Collections tested:
 *   1. users/{userId}               — own doc only
 *   2. provisioningTasks/{userId}    — read own, write blocked
 *   3. stripeAccounts/{userId}       — read own, write blocked
 *   4. childInviteTokens/{tokenId}   — fully locked
 *   5. virtualCards/{cardId}         — read by createdBy only
 *   6. transactions/{txId}           — read by userId/createdBy only
 *   7. events/{eventId}              — create any, update/delete by owner
 *   8. families/{familyId}           — read/modify by parents only
 *   9. childAccounts/{id}            — read by userId only, write blocked
 *  10. invitations/{id}              — read by sender/recipient, modify by sender
 *
 * Usage:
 *   node functions/tests/test-firestore-rules.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });

const PROJECT_ID = "piggybank-a0011";
process.env.GCLOUD_PROJECT = PROJECT_ID;
process.env.GOOGLE_APPLICATION_CREDENTIALS = "/tmp/piggybank-adc.json";

const admin = require("firebase-admin");
const { initializeApp: initClientApp, deleteApp } = require("firebase/app");
const { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc } = require("firebase/firestore");
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require("firebase/auth");

admin.initializeApp({ projectId: PROJECT_ID });
const adminDb = admin.firestore();

const RUN_ID = Date.now();
const TEST_PREFIX = `_rules_test_${RUN_ID}`;

const PASSWORD = `TestPass!${RUN_ID}`;

let passed = 0;
let failed = 0;
let clientAppA, clientAppB, clientAppChild;
let dbA, dbB, dbChild;
let USER_A_UID, USER_B_UID, CHILD_UID;

const testEmails = {
    userA: `rules-testa-${RUN_ID}@test-creditkid.com`,
    userB: `rules-testb-${RUN_ID}@test-creditkid.com`,
    child: `rules-testchild-${RUN_ID}@test-creditkid.com`,
};

function assert(label, condition) {
    if (condition) { passed++; console.log(`    ✅ ${label}`); }
    else { failed++; console.error(`    ❌ ${label}`); }
}

function section(name) { console.log(`\n  ── ${name} ──`); }

async function createTestUser(email, claims = {}) {
    const clientConfig = {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: PROJECT_ID,
    };
    const app = initClientApp(clientConfig, `test-${email}`);
    const auth = getAuth(app);
    let userCred;
    try {
        userCred = await createUserWithEmailAndPassword(auth, email, PASSWORD);
    } catch (err) {
        if (err.code === "auth/email-already-in-use") {
            userCred = await signInWithEmailAndPassword(auth, email, PASSWORD);
        } else throw err;
    }
    const uid = userCred.user.uid;

    if (Object.keys(claims).length > 0) {
        await admin.auth().setCustomUserClaims(uid, claims);
        await new Promise((r) => setTimeout(r, 1000));
        await auth.currentUser.getIdToken(true);
        // Verify claims took effect
        const verifiedToken = await auth.currentUser.getIdTokenResult();
        const claimsOk = Object.keys(claims).every((k) => verifiedToken.claims[k] === claims[k]);
        if (!claimsOk) console.warn(`  ⚠ Claims may not have propagated for ${email}`);
    }

    const db = getFirestore(app);
    return { app, db, uid };
}

async function expectAllow(label, promiseFn) {
    try {
        await promiseFn();
        assert(`${label} → ALLOWED`, true);
    } catch (err) {
        assert(`${label} → ALLOWED (got: ${err.code || err.message})`, false);
    }
}

async function expectDeny(label, promiseFn) {
    try {
        await promiseFn();
        assert(`${label} → DENIED (but was allowed!)`, false);
    } catch (err) {
        const denied = err.code === "permission-denied" || err.message?.includes("PERMISSION_DENIED")
            || err.code === "firestore/permission-denied";
        assert(`${label} → DENIED`, denied);
    }
}

// ──────────────────────────────────────────────────────────
//  Seed test data (admin SDK — bypasses rules)
// ──────────────────────────────────────────────────────────
async function seedTestData() {
    console.log("  Seeding test data with admin SDK...\n");

    const ts = admin.firestore.FieldValue.serverTimestamp;

    await adminDb.doc(`users/${USER_A_UID}`).set({ displayName: "User A", email: testEmails.userA, createdAt: ts() });
    await adminDb.doc(`users/${USER_B_UID}`).set({ displayName: "User B", email: testEmails.userB, createdAt: ts() });

    await adminDb.doc(`provisioningTasks/${USER_A_UID}`).set({ status: "complete", step: "Card ready!", updatedAt: ts() });
    await adminDb.doc(`provisioningTasks/${USER_B_UID}`).set({ status: "phase1", step: "Starting...", updatedAt: ts() });

    await adminDb.doc(`stripeAccounts/${USER_A_UID}`).set({ accountId: "acct_testA", virtualCardId: "ic_testA" });
    await adminDb.doc(`stripeAccounts/${USER_B_UID}`).set({ accountId: "acct_testB", virtualCardId: "ic_testB" });

    await adminDb.doc(`childInviteTokens/${TEST_PREFIX}_token1`).set({ eventId: "evt1", createdAt: ts() });

    await adminDb.doc(`virtualCards/${TEST_PREFIX}_card1`).set({ createdBy: USER_A_UID, last4: "4242" });
    await adminDb.doc(`virtualCards/${TEST_PREFIX}_card2`).set({ createdBy: USER_B_UID, last4: "5555" });

    await adminDb.doc(`transactions/${TEST_PREFIX}_tx1`).set({ userId: USER_A_UID, createdBy: USER_A_UID, amount: 1000 });
    await adminDb.doc(`transactions/${TEST_PREFIX}_tx2`).set({ userId: USER_B_UID, createdBy: USER_B_UID, amount: 2000 });
    await adminDb.doc(`transactions/${TEST_PREFIX}_tx3`).set({ userId: USER_B_UID, createdBy: USER_A_UID, amount: 500 });

    await adminDb.doc(`events/${TEST_PREFIX}_evt1`).set({ creatorId: USER_A_UID, hostId: USER_A_UID, title: "A's Birthday", childName: "Mia" });
    await adminDb.doc(`events/${TEST_PREFIX}_evt2`).set({ creatorId: USER_B_UID, hostId: USER_B_UID, title: "B's Birthday", childName: "Liam" });

    await adminDb.doc(`families/${TEST_PREFIX}_fam1`).set({ parentIds: [USER_A_UID], familyName: "Family A" });

    await adminDb.doc(`childAccounts/${TEST_PREFIX}_ca1`).set({ userId: CHILD_UID, eventId: `${TEST_PREFIX}_evt1`, parentId: USER_A_UID });

    await adminDb.doc(`invitations/${TEST_PREFIX}_inv1`).set({ senderId: USER_A_UID, recipientId: USER_B_UID, eventId: `${TEST_PREFIX}_evt1`, status: "pending" });

    console.log("  ✓ Data seeded\n");
}

// ══════════════════════════════════════════════════════════
//  1. users/{userId}
// ══════════════════════════════════════════════════════════
async function testUsersCollection() {
    console.log("\n═══ 1. users/{userId} ═══");

    section("User A reads own doc");
    await expectAllow("Read own user doc", () => getDoc(doc(dbA, "users", USER_A_UID)));

    section("User A reads User B's doc");
    await expectDeny("Read other user's doc", () => getDoc(doc(dbA, "users", USER_B_UID)));

    section("User A writes own doc");
    await expectAllow("Write own user doc", () => updateDoc(doc(dbA, "users", USER_A_UID), { displayName: "Updated A" }));

    section("User A writes User B's doc");
    await expectDeny("Write other user's doc", () => updateDoc(doc(dbA, "users", USER_B_UID), { displayName: "Hacked" }));
}

// ══════════════════════════════════════════════════════════
//  2. provisioningTasks/{userId}
// ══════════════════════════════════════════════════════════
async function testProvisioningTasks() {
    console.log("\n═══ 2. provisioningTasks/{userId} ═══");

    section("User A reads own provisioning task");
    await expectAllow("Read own task", () => getDoc(doc(dbA, "provisioningTasks", USER_A_UID)));

    section("User A reads User B's provisioning task");
    await expectDeny("Read other user's task", () => getDoc(doc(dbA, "provisioningTasks", USER_B_UID)));

    section("User A tries to write own provisioning task");
    await expectDeny("Write own task (server-only)", () =>
        updateDoc(doc(dbA, "provisioningTasks", USER_A_UID), { status: "hacked" }));

    section("User A tries to create a provisioning task");
    await expectDeny("Create task (server-only)", () =>
        setDoc(doc(dbA, "provisioningTasks", "fake_user"), { status: "fake" }));

    section("User A tries to delete own provisioning task");
    await expectDeny("Delete own task (server-only)", () =>
        deleteDoc(doc(dbA, "provisioningTasks", USER_A_UID)));
}

// ══════════════════════════════════════════════════════════
//  3. stripeAccounts/{userId}
// ══════════════════════════════════════════════════════════
async function testStripeAccounts() {
    console.log("\n═══ 3. stripeAccounts/{userId} ═══");

    section("User A reads own Stripe account");
    await expectAllow("Read own Stripe account", () => getDoc(doc(dbA, "stripeAccounts", USER_A_UID)));

    section("User A reads User B's Stripe account");
    await expectDeny("Read other user's Stripe account", () => getDoc(doc(dbA, "stripeAccounts", USER_B_UID)));

    section("User A tries to modify own Stripe account");
    await expectDeny("Write own Stripe account (server-only)", () =>
        updateDoc(doc(dbA, "stripeAccounts", USER_A_UID), { accountId: "acct_stolen" }));

    section("User A tries to create a fake Stripe account doc");
    await expectDeny("Create fake Stripe account", () =>
        setDoc(doc(dbA, "stripeAccounts", "fake_user"), { accountId: "acct_fake" }));
}

// ══════════════════════════════════════════════════════════
//  4. childInviteTokens/{tokenId}
// ══════════════════════════════════════════════════════════
async function testChildInviteTokens() {
    console.log("\n═══ 4. childInviteTokens/{tokenId} — FULLY LOCKED ═══");

    section("User A tries to read a token");
    await expectDeny("Read token", () => getDoc(doc(dbA, "childInviteTokens", `${TEST_PREFIX}_token1`)));

    section("User A tries to create a token");
    await expectDeny("Create token", () =>
        setDoc(doc(dbA, "childInviteTokens", "forged_token"), { eventId: "evt_fake" }));

    section("User A tries to delete a token");
    await expectDeny("Delete token", () => deleteDoc(doc(dbA, "childInviteTokens", `${TEST_PREFIX}_token1`)));
}

// ══════════════════════════════════════════════════════════
//  5. virtualCards/{cardId}
// ══════════════════════════════════════════════════════════
async function testVirtualCards() {
    console.log("\n═══ 5. virtualCards/{cardId} ═══");

    section("User A reads own card");
    await expectAllow("Read own card", () => getDoc(doc(dbA, "virtualCards", `${TEST_PREFIX}_card1`)));

    section("User A reads User B's card");
    await expectDeny("Read other user's card", () => getDoc(doc(dbA, "virtualCards", `${TEST_PREFIX}_card2`)));

    section("User B reads own card");
    await expectAllow("User B reads own card", () => getDoc(doc(dbB, "virtualCards", `${TEST_PREFIX}_card2`)));

    section("User A tries to create a card (server-only)");
    await expectDeny("Create card from client", () =>
        setDoc(doc(dbA, "virtualCards", "fake_card"), { createdBy: USER_A_UID, last4: "9999" }));

    section("User A tries to modify own card");
    await expectDeny("Modify own card (server-only)", () =>
        updateDoc(doc(dbA, "virtualCards", `${TEST_PREFIX}_card1`), { last4: "0000" }));
}

// ══════════════════════════════════════════════════════════
//  6. transactions/{txId}
// ══════════════════════════════════════════════════════════
async function testTransactions() {
    console.log("\n═══ 6. transactions/{txId} ═══");

    section("User A reads own transaction (userId match)");
    await expectAllow("Read own tx", () => getDoc(doc(dbA, "transactions", `${TEST_PREFIX}_tx1`)));

    section("User A reads User B's transaction");
    await expectDeny("Read other user's tx", () => getDoc(doc(dbA, "transactions", `${TEST_PREFIX}_tx2`)));

    section("User A reads tx where they are createdBy (but userId is B)");
    await expectAllow("Read tx by createdBy match", () => getDoc(doc(dbA, "transactions", `${TEST_PREFIX}_tx3`)));

    section("User B reads tx3 (they are userId)");
    await expectAllow("User B reads tx where they are userId", () =>
        getDoc(doc(dbB, "transactions", `${TEST_PREFIX}_tx3`)));

    section("User A tries to create a transaction (server-only)");
    await expectDeny("Create tx from client", () =>
        setDoc(doc(dbA, "transactions", "fake_tx"), { userId: USER_A_UID, amount: 99999 }));

    section("User A tries to modify own transaction");
    await expectDeny("Modify own tx (server-only)", () =>
        updateDoc(doc(dbA, "transactions", `${TEST_PREFIX}_tx1`), { amount: 0 }));
}

// ══════════════════════════════════════════════════════════
//  7. events/{eventId}
// ══════════════════════════════════════════════════════════
async function testEvents() {
    console.log("\n═══ 7. events/{eventId} ═══");

    section("User A reads own event");
    await expectAllow("Read own event", () => getDoc(doc(dbA, "events", `${TEST_PREFIX}_evt1`)));

    section("User A reads User B's event (any authenticated user can read)");
    await expectAllow("Read other user's event", () => getDoc(doc(dbA, "events", `${TEST_PREFIX}_evt2`)));

    section("User A creates a new event");
    const newEvtId = `${TEST_PREFIX}_evt_new`;
    await expectAllow("Create event", () =>
        setDoc(doc(dbA, "events", newEvtId), { creatorId: USER_A_UID, hostId: USER_A_UID, title: "New Event" }));

    section("User A updates own event");
    await expectAllow("Update own event", () =>
        updateDoc(doc(dbA, "events", `${TEST_PREFIX}_evt1`), { title: "Updated Title" }));

    section("User A tries to update User B's event");
    await expectDeny("Update other user's event", () =>
        updateDoc(doc(dbA, "events", `${TEST_PREFIX}_evt2`), { title: "Hijacked" }));

    section("User A tries to delete User B's event");
    await expectDeny("Delete other user's event", () =>
        deleteDoc(doc(dbA, "events", `${TEST_PREFIX}_evt2`)));

    section("Child user can only read their linked event");
    await expectAllow("Child reads linked event", () =>
        getDoc(doc(dbChild, "events", `${TEST_PREFIX}_evt1`)));

    section("Child user cannot read unlinked event");
    await expectDeny("Child reads unlinked event", () =>
        getDoc(doc(dbChild, "events", `${TEST_PREFIX}_evt2`)));

    // Cleanup the created event
    await adminDb.doc(`events/${newEvtId}`).delete();
}

// ══════════════════════════════════════════════════════════
//  8. families/{familyId}
// ══════════════════════════════════════════════════════════
async function testFamilies() {
    console.log("\n═══ 8. families/{familyId} ═══");

    section("User A (parent) reads own family");
    await expectAllow("Parent reads family", () => getDoc(doc(dbA, "families", `${TEST_PREFIX}_fam1`)));

    section("User B (not a parent) reads the family");
    await expectDeny("Non-parent reads family", () => getDoc(doc(dbB, "families", `${TEST_PREFIX}_fam1`)));

    section("User A updates own family");
    await expectAllow("Parent updates family", () =>
        updateDoc(doc(dbA, "families", `${TEST_PREFIX}_fam1`), { familyName: "Updated Family" }));

    section("User B tries to update family they're not in");
    await expectDeny("Non-parent updates family", () =>
        updateDoc(doc(dbB, "families", `${TEST_PREFIX}_fam1`), { familyName: "Stolen" }));

    section("Any authenticated user can create a family");
    const newFamId = `${TEST_PREFIX}_fam_new`;
    await expectAllow("Create new family", () =>
        setDoc(doc(dbB, "families", newFamId), { parentIds: [USER_B_UID], familyName: "B's Family" }));
    await adminDb.doc(`families/${newFamId}`).delete();
}

// ══════════════════════════════════════════════════════════
//  9. childAccounts/{id}
// ══════════════════════════════════════════════════════════
async function testChildAccounts() {
    console.log("\n═══ 9. childAccounts/{id} ═══");

    section("Child reads own child account (userId match)");
    await expectAllow("Child reads own account", () =>
        getDoc(doc(dbChild, "childAccounts", `${TEST_PREFIX}_ca1`)));

    section("User A (parent) tries to read child account");
    await expectDeny("Parent reads child account (not their userId)", () =>
        getDoc(doc(dbA, "childAccounts", `${TEST_PREFIX}_ca1`)));

    section("Child tries to modify own account (server-only)");
    await expectDeny("Child writes own account", () =>
        updateDoc(doc(dbChild, "childAccounts", `${TEST_PREFIX}_ca1`), { parentId: "hacker" }));

    section("User A tries to create a child account (server-only)");
    await expectDeny("Create child account from client", () =>
        setDoc(doc(dbA, "childAccounts", "fake_ca"), { userId: USER_A_UID }));
}

// ══════════════════════════════════════════════════════════
// 10. invitations/{id}
// ══════════════════════════════════════════════════════════
async function testInvitations() {
    console.log("\n═══ 10. invitations/{inviteId} ═══");

    section("Sender (User A) reads invitation");
    await expectAllow("Sender reads invitation", () =>
        getDoc(doc(dbA, "invitations", `${TEST_PREFIX}_inv1`)));

    section("Recipient (User B) reads invitation");
    await expectAllow("Recipient reads invitation", () =>
        getDoc(doc(dbB, "invitations", `${TEST_PREFIX}_inv1`)));

    section("Unrelated user (Child) cannot read invitation");
    await expectDeny("Unrelated user reads invitation", () =>
        getDoc(doc(dbChild, "invitations", `${TEST_PREFIX}_inv1`)));

    section("Sender can update invitation");
    await expectAllow("Sender updates invitation", () =>
        updateDoc(doc(dbA, "invitations", `${TEST_PREFIX}_inv1`), { status: "cancelled" }));

    section("Recipient cannot update invitation");
    await expectDeny("Recipient updates invitation", () =>
        updateDoc(doc(dbB, "invitations", `${TEST_PREFIX}_inv1`), { status: "accepted_by_attacker" }));

    section("Any authenticated user can create an invitation");
    const newInvId = `${TEST_PREFIX}_inv_new`;
    await expectAllow("Create invitation", () =>
        setDoc(doc(dbB, "invitations", newInvId), {
            senderId: USER_B_UID, recipientId: USER_A_UID, eventId: "evt_test", status: "pending",
        }));
    await adminDb.doc(`invitations/${newInvId}`).delete();
}

// ──────────────────────────────────────────────────────────
//  Cleanup
// ──────────────────────────────────────────────────────────
async function cleanup() {
    console.log("\n  Cleaning up test data...");
    const docPaths = [
        `users/${USER_A_UID}`, `users/${USER_B_UID}`,
        `provisioningTasks/${USER_A_UID}`, `provisioningTasks/${USER_B_UID}`,
        `stripeAccounts/${USER_A_UID}`, `stripeAccounts/${USER_B_UID}`,
        `childInviteTokens/${TEST_PREFIX}_token1`,
        `virtualCards/${TEST_PREFIX}_card1`, `virtualCards/${TEST_PREFIX}_card2`,
        `transactions/${TEST_PREFIX}_tx1`, `transactions/${TEST_PREFIX}_tx2`, `transactions/${TEST_PREFIX}_tx3`,
        `events/${TEST_PREFIX}_evt1`, `events/${TEST_PREFIX}_evt2`,
        `families/${TEST_PREFIX}_fam1`,
        `childAccounts/${TEST_PREFIX}_ca1`,
        `invitations/${TEST_PREFIX}_inv1`,
    ];
    for (const p of docPaths) {
        if (p.includes("undefined")) continue;
        await adminDb.doc(p).delete().catch(() => {});
    }
    for (const uid of [USER_A_UID, USER_B_UID, CHILD_UID]) {
        if (uid) await admin.auth().deleteUser(uid).catch(() => {});
    }
    console.log("  ✓ Cleanup complete");
}

// ──────────────────────────────────────────────────────────
//  Main
// ──────────────────────────────────────────────────────────
(async () => {
    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║  FIRESTORE RULES — LIVE INTEGRATION TESTS               ║");
    console.log("║  Testing against real Firestore with client SDK auth     ║");
    console.log("╚══════════════════════════════════════════════════════════╝\n");

    try {
        console.log("  Creating Firebase Auth test users...");
        const sessA = await createTestUser(testEmails.userA);
        clientAppA = sessA.app; dbA = sessA.db; USER_A_UID = sessA.uid;

        const sessB = await createTestUser(testEmails.userB);
        clientAppB = sessB.app; dbB = sessB.db; USER_B_UID = sessB.uid;

        const sessChild = await createTestUser(testEmails.child, { role: "child", eventId: `${TEST_PREFIX}_evt1` });
        clientAppChild = sessChild.app; dbChild = sessChild.db; CHILD_UID = sessChild.uid;

        console.log(`  ✓ User A: ${USER_A_UID}`);
        console.log(`  ✓ User B: ${USER_B_UID}`);
        console.log(`  ✓ Child:  ${CHILD_UID}\n`);

        await seedTestData();

        await testUsersCollection();
        await testProvisioningTasks();
        await testStripeAccounts();
        await testChildInviteTokens();
        await testVirtualCards();
        await testTransactions();
        await testEvents();
        await testFamilies();
        await testChildAccounts();
        await testInvitations();

    } catch (err) {
        console.error("\n  💥 Fatal error:", err.message);
        console.error(err.stack);
    } finally {
        await cleanup();

        if (clientAppA) await deleteApp(clientAppA).catch(() => {});
        if (clientAppB) await deleteApp(clientAppB).catch(() => {});
        if (clientAppChild) await deleteApp(clientAppChild).catch(() => {});

        const total = passed + failed;
        console.log("\n══════════════════════════════════════════════════════════");
        console.log(`  Results: ${passed}/${total} passed, ${failed} failed`);
        console.log("══════════════════════════════════════════════════════════\n");

        await admin.app().delete();
        process.exit(failed > 0 ? 1 : 0);
    }
})();
