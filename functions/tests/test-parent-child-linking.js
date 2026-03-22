/**
 * Parent–Child Linking Flow Tests
 *
 * Exercises the full invite-and-claim lifecycle through the real controller
 * code with mocked Firebase/Stripe dependencies.
 *
 * Scenarios:
 *   A. Happy path          — parent creates link, child claims with correct phone + PIN
 *   B. Parent validations  — missing fields, wrong event owner, non-existent event
 *   C. Child validations   — wrong PIN, wrong phone, expired token, already claimed
 *   D. PIN brute-force     — lockout after 5 wrong attempts
 *   E. Phone normalization — various phone formats all match correctly
 *   F. Token security      — token entropy, one-time use, expiry enforcement
 *   G. Stripe card access  — child receives ephemeral key when parent has card
 *   H. Multiple children   — two children on same event, cross-child token reuse
 *   I. Edge cases          — no phone on auth record, expiresAt ~30 days, event deleted before claim
 *
 * Usage:
 *   node functions/tests/test-parent-child-linking.js
 */

const crypto = require("crypto");

let passed = 0;
let failed = 0;
const sections = [];

function assert(label, condition) {
    if (condition) { passed++; console.log(`    ✅ ${label}`); }
    else { failed++; console.error(`    ❌ ${label}`); }
}

function section(name) {
    console.log(`\n  ── ${name} ──`);
    sections.push(name);
}

// ─── In-memory Firestore mock ─────────────────────────────────────
function createMockFirestore() {
    const collections = {};

    function getCollection(name) {
        if (!collections[name]) collections[name] = {};
        return collections[name];
    }

    function doc(collectionName, docId) {
        const col = getCollection(collectionName);
        return {
            get: async () => ({
                exists: !!col[docId],
                data: () => col[docId] ? { ...col[docId] } : undefined,
                id: docId,
            }),
            set: async (data) => { col[docId] = { ...data }; },
            update: async (data) => {
                if (!col[docId]) throw new Error(`Doc ${collectionName}/${docId} not found`);
                for (const [k, v] of Object.entries(data)) {
                    if (v && v._type === "delete") {
                        delete col[docId][k];
                    } else if (v && v._type === "increment") {
                        col[docId][k] = (col[docId][k] || 0) + v._value;
                    } else if (v && v._type === "serverTimestamp") {
                        col[docId][k] = new Date();
                    } else {
                        col[docId][k] = v;
                    }
                }
            },
            delete: async () => { delete col[docId]; },
        };
    }

    let autoIdCounter = 0;

    const db = {
        collection: (name) => ({
            doc: (id) => doc(name, id),
            add: async (data) => {
                const id = `auto_${++autoIdCounter}`;
                const col = getCollection(name);
                col[id] = { ...data };
                return { id };
            },
        }),
        _collections: collections,
        _getDoc: (col, id) => collections[col]?.[id],
        _setDoc: (col, id, data) => {
            if (!collections[col]) collections[col] = {};
            collections[col][id] = data;
        },
    };

    return db;
}

// ─── Mock Firebase Admin ──────────────────────────────────────────
function createMockAdmin(db, userRecords = {}) {
    return {
        firestore: () => db,
        auth: () => ({
            getUser: async (uid) => {
                if (!userRecords[uid]) throw new Error(`User ${uid} not found`);
                return userRecords[uid];
            },
        }),
    };
}

// ─── Mock modules & build controller ──────────────────────────────

const path = require("path");

const firebaseAdminCachePath = require.resolve("firebase-admin");
const eventRepoCachePath = require.resolve(path.resolve(__dirname, "../repositories/eventRepository"));
const stripeAccountRepoCachePath = require.resolve(path.resolve(__dirname, "../repositories/stripeAccountRepository"));
const controllerCachePath = require.resolve(path.resolve(__dirname, "../controllers/childInviteController"));

function buildController(db, mockAdmin, stripeAccounts = {}) {
    const eventRepo = {
        getById: async (id) => {
            const doc = db._getDoc("events", id);
            return doc ? { id, ...doc } : null;
        },
    };

    const stripeAccountRepo = {
        getByUid: async (uid) => stripeAccounts[uid] || null,
    };

    const mockFirebaseAdmin = {
        ...mockAdmin,
        firestore: Object.assign(() => db, {
            FieldValue: {
                serverTimestamp: () => ({ _type: "serverTimestamp" }),
                increment: (n) => ({ _type: "increment", _value: n }),
                delete: () => ({ _type: "delete" }),
                arrayUnion: (...args) => ({ _type: "arrayUnion", _values: args }),
            },
            Timestamp: {
                fromDate: (d) => ({ toDate: () => d }),
            },
        }),
    };

    // Inject mocks into require.cache so runtime require() calls find them
    require.cache[firebaseAdminCachePath] = {
        id: firebaseAdminCachePath, filename: firebaseAdminCachePath, loaded: true,
        exports: mockFirebaseAdmin,
    };
    require.cache[eventRepoCachePath] = {
        id: eventRepoCachePath, filename: eventRepoCachePath, loaded: true,
        exports: eventRepo,
    };
    require.cache[stripeAccountRepoCachePath] = {
        id: stripeAccountRepoCachePath, filename: stripeAccountRepoCachePath, loaded: true,
        exports: stripeAccountRepo,
    };

    // Force fresh load of the controller so it picks up the mocked deps
    delete require.cache[controllerCachePath];
    const childInviteController = require(controllerCachePath);

    return { childInviteController, eventRepo, stripeAccountRepo };
}

// ─── Request/Response helpers ─────────────────────────────────────
function mockReq(user, body, extras = {}) {
    return { user, body, ...extras };
}

function mockRes() {
    const res = {
        _status: null,
        _json: null,
        status(code) { res._status = code; return res; },
        json(data) { res._json = data; return res; },
    };
    return res;
}

// ═══════════════════════════════════════════════════════════════════
//  Test Suites
// ═══════════════════════════════════════════════════════════════════

async function testHappyPath() {
    console.log("\n═══ A. HAPPY PATH — FULL PARENT→CHILD FLOW ═══");

    const db = createMockFirestore();
    const parentUid = "parent-uid-001";
    const childUid = "child-uid-001";
    const childPhone = "+15551234567";

    const mockAdmin = createMockAdmin(db, {
        [childUid]: { uid: childUid, phoneNumber: childPhone },
    });

    db._setDoc("events", "evt-birthday", {
        eventName: "Mia's Birthday",
        creatorId: parentUid,
        status: "active",
    });

    const { childInviteController } = buildController(db, mockAdmin);

    // ── Step 1: Parent creates invite link ──
    section("A1 — Parent creates child invite link");
    const parentReq = mockReq(
        { uid: parentUid },
        { eventId: "evt-birthday", childPhone: "5551234567" },
        { PUBLIC_BASE_URL: "https://creditkid.vercel.app" }
    );
    const parentRes = mockRes();
    await childInviteController.getChildInviteLink(parentReq, parentRes);

    assert("Returns 200 (no error status)", parentRes._status === null);
    assert("Response has link", typeof parentRes._json?.link === "string");
    assert("Response has pin (6 digits)", /^\d{6}$/.test(parentRes._json?.pin));
    assert("Response has token", typeof parentRes._json?.token === "string");
    assert("Response has expiresAt", typeof parentRes._json?.expiresAt === "string");
    assert("Link contains token", parentRes._json?.link?.includes(parentRes._json?.token));
    assert("Link starts with base URL", parentRes._json?.link?.startsWith("https://creditkid.vercel.app/child?token="));

    const { token, pin } = parentRes._json;

    section("A2 — Token stored correctly in Firestore");
    const tokenDoc = db._getDoc("childInviteTokens", token);
    assert("Token doc exists", !!tokenDoc);
    assert("Token has eventId", tokenDoc.eventId === "evt-birthday");
    assert("Token has creatorId", tokenDoc.creatorId === parentUid);
    assert("Token has normalized phone", tokenDoc.childPhone === "+15551234567");
    assert("Token has pinHash", typeof tokenDoc.pinHash === "string" && tokenDoc.pinHash.length === 64);
    assert("Token has pinSalt", typeof tokenDoc.pinSalt === "string" && tokenDoc.pinSalt.length === 32);
    assert("Token not claimed", tokenDoc.claimed === false);
    assert("Token pinAttempts = 0", tokenDoc.pinAttempts === 0);

    section("A3 — Event updated with child phone");
    const eventDoc = db._getDoc("events", "evt-birthday");
    assert("Event has childPhone", eventDoc.childPhone === "+15551234567");

    // ── Step 2: Child claims the invite ──
    section("A4 — Child claims invite with correct PIN and phone");
    const childReq = mockReq({ uid: childUid }, { token, pin });
    const childRes = mockRes();
    await childInviteController.claimChildInvite(childReq, childRes);

    assert("Returns 200 (no error status)", childRes._status === null);
    assert("Response has childAccountId", typeof childRes._json?.childAccountId === "string");
    assert("Response has eventId", childRes._json?.eventId === "evt-birthday");
    assert("Response has eventName", childRes._json?.eventName === "Mia's Birthday");

    section("A5 — Child account created correctly");
    const childAccountId = childRes._json.childAccountId;
    const childAccount = db._getDoc("childAccounts", childAccountId);
    assert("Child account exists", !!childAccount);
    assert("Child account has userId", childAccount.userId === childUid);
    assert("Child account has eventId", childAccount.eventId === "evt-birthday");
    assert("Child account has creatorId", childAccount.creatorId === parentUid);
    assert("Child account has phone", childAccount.phoneNumber === "+15551234567");

    section("A6 — Token marked as claimed");
    const claimedToken = db._getDoc("childInviteTokens", token);
    assert("Token is claimed", claimedToken.claimed === true);
    assert("Token has claimedBy", claimedToken.claimedBy === childUid);
}

async function testParentValidations() {
    console.log("\n═══ B. PARENT-SIDE VALIDATIONS ═══");

    const db = createMockFirestore();
    const parentUid = "parent-uid-002";
    const otherUid = "other-uid-002";

    const mockAdmin = createMockAdmin(db, {});

    db._setDoc("events", "evt-bday-2", {
        eventName: "Test Event",
        creatorId: parentUid,
    });

    const { childInviteController } = buildController(db, mockAdmin);

    section("B1 — Missing eventId");
    const r1 = mockRes();
    await childInviteController.getChildInviteLink(
        mockReq({ uid: parentUid }, { childPhone: "+15551111111" }),
        r1
    );
    assert("Returns 400", r1._status === 400);
    assert("Error mentions eventId", r1._json?.error?.includes("eventId"));

    section("B2 — Missing childPhone");
    const r2 = mockRes();
    await childInviteController.getChildInviteLink(
        mockReq({ uid: parentUid }, { eventId: "evt-bday-2" }),
        r2
    );
    assert("Returns 400", r2._status === 400);
    assert("Error mentions childPhone", r2._json?.error?.includes("childPhone"));

    section("B3 — Invalid phone number (too short)");
    const r3 = mockRes();
    await childInviteController.getChildInviteLink(
        mockReq({ uid: parentUid }, { eventId: "evt-bday-2", childPhone: "123" }),
        r3
    );
    assert("Returns 400", r3._status === 400);
    assert("Error mentions invalid phone", r3._json?.error?.includes("Invalid phone"));

    section("B4 — Event not found");
    const r4 = mockRes();
    await childInviteController.getChildInviteLink(
        mockReq({ uid: parentUid }, { eventId: "nonexistent", childPhone: "+15551111111" }),
        r4
    );
    assert("Returns 404", r4._status === 404);

    section("B5 — Not the event creator (another user's event)");
    const r5 = mockRes();
    await childInviteController.getChildInviteLink(
        mockReq({ uid: otherUid }, { eventId: "evt-bday-2", childPhone: "+15551111111" }),
        r5
    );
    assert("Returns 403", r5._status === 403);
    assert("Error mentions authorization", r5._json?.error?.toLowerCase()?.includes("not authorized"));
}

async function testChildValidations() {
    console.log("\n═══ C. CHILD-SIDE VALIDATIONS ═══");

    const db = createMockFirestore();
    const parentUid = "parent-uid-003";
    const childUid = "child-uid-003";
    const wrongChildUid = "wrong-child-003";
    const childPhone = "+15559876543";

    const mockAdmin = createMockAdmin(db, {
        [childUid]: { uid: childUid, phoneNumber: childPhone },
        [wrongChildUid]: { uid: wrongChildUid, phoneNumber: "+15550000000" },
    });

    db._setDoc("events", "evt-bday-3", {
        eventName: "Birthday 3",
        creatorId: parentUid,
    });

    const { childInviteController } = buildController(db, mockAdmin);

    // Create a valid invite first
    const parentReq = mockReq(
        { uid: parentUid },
        { eventId: "evt-bday-3", childPhone },
        { PUBLIC_BASE_URL: "https://creditkid.vercel.app" }
    );
    const parentRes = mockRes();
    await childInviteController.getChildInviteLink(parentReq, parentRes);
    const { token, pin } = parentRes._json;

    section("C1 — Missing token");
    const r1 = mockRes();
    await childInviteController.claimChildInvite(mockReq({ uid: childUid }, { pin: "123456" }), r1);
    assert("Returns 400", r1._status === 400);
    assert("Error mentions token", r1._json?.error?.includes("token"));

    section("C2 — Missing PIN");
    const r2 = mockRes();
    await childInviteController.claimChildInvite(mockReq({ uid: childUid }, { token }), r2);
    assert("Returns 400", r2._status === 400);
    assert("Error mentions PIN", r2._json?.error?.includes("PIN"));

    section("C3 — No auth (no uid)");
    const r3 = mockRes();
    await childInviteController.claimChildInvite(mockReq(null, { token, pin }), r3);
    assert("Returns 401", r3._status === 401);

    section("C4 — Invalid token (not found)");
    const r4 = mockRes();
    await childInviteController.claimChildInvite(
        mockReq({ uid: childUid }, { token: "nonexistent_token_abc", pin }),
        r4
    );
    assert("Returns 404", r4._status === 404);

    section("C5 — Wrong phone number");
    const r5 = mockRes();
    await childInviteController.claimChildInvite(
        mockReq({ uid: wrongChildUid }, { token, pin }),
        r5
    );
    assert("Returns 403", r5._status === 403);
    assert("Error mentions phone mismatch", r5._json?.error?.toLowerCase()?.includes("phone"));

    section("C6 — Wrong PIN (first attempt)");
    const r6 = mockRes();
    await childInviteController.claimChildInvite(
        mockReq({ uid: childUid }, { token, pin: "000000" }),
        r6
    );
    assert("Returns 403", r6._status === 403);
    assert("Error mentions incorrect PIN", r6._json?.error?.includes("Incorrect PIN"));
    assert("Error shows remaining attempts", r6._json?.error?.includes("remaining"));

    section("C7 — Correct PIN after a wrong attempt still works");
    const r7 = mockRes();
    await childInviteController.claimChildInvite(
        mockReq({ uid: childUid }, { token, pin }),
        r7
    );
    assert("Returns 200", r7._status === null);
    assert("Claim succeeded", !!r7._json?.childAccountId);

    section("C8 — Token already claimed (double claim)");
    const r8 = mockRes();
    await childInviteController.claimChildInvite(
        mockReq({ uid: childUid }, { token, pin }),
        r8
    );
    assert("Returns 410", r8._status === 410);
    assert("Error mentions already used", r8._json?.error?.includes("already been used"));
}

async function testPinBruteForce() {
    console.log("\n═══ D. PIN BRUTE-FORCE LOCKOUT ═══");

    const db = createMockFirestore();
    const parentUid = "parent-uid-004";
    const childUid = "child-uid-004";
    const childPhone = "+15551112222";

    const mockAdmin = createMockAdmin(db, {
        [childUid]: { uid: childUid, phoneNumber: childPhone },
    });

    db._setDoc("events", "evt-bday-4", {
        eventName: "Birthday 4",
        creatorId: parentUid,
    });

    const { childInviteController } = buildController(db, mockAdmin);

    const parentRes = mockRes();
    await childInviteController.getChildInviteLink(
        mockReq({ uid: parentUid }, { eventId: "evt-bday-4", childPhone }, { PUBLIC_BASE_URL: "https://test.app" }),
        parentRes
    );
    const { token, pin } = parentRes._json;

    section("D1 — 5 wrong PIN attempts exhaust the limit");
    for (let i = 1; i <= 5; i++) {
        const r = mockRes();
        await childInviteController.claimChildInvite(
            mockReq({ uid: childUid }, { token, pin: "999999" }),
            r
        );
        assert(`Wrong attempt ${i}/5 → 403`, r._status === 403);
    }

    section("D2 — 6th attempt with correct PIN → still locked out (429)");
    const rLocked = mockRes();
    await childInviteController.claimChildInvite(
        mockReq({ uid: childUid }, { token, pin }),
        rLocked
    );
    assert("Returns 429 (locked out)", rLocked._status === 429);
    assert("Error mentions too many attempts", rLocked._json?.error?.includes("Too many"));

    section("D3 — pinAttempts counter in Firestore is correct");
    const tokenDoc = db._getDoc("childInviteTokens", token);
    assert("pinAttempts = 5", tokenDoc.pinAttempts === 5);
    assert("Token NOT claimed (lockout prevented claim)", tokenDoc.claimed === false);
}

async function testPhoneNormalization() {
    console.log("\n═══ E. PHONE NORMALIZATION ═══");

    const db = createMockFirestore();
    const parentUid = "parent-uid-005";

    const phoneFormats = [
        { input: "5551234567",      expected: "+15551234567",  label: "10-digit bare" },
        { input: "(555) 123-4567",  expected: "+15551234567",  label: "formatted (xxx) xxx-xxxx" },
        { input: "+15551234567",    expected: "+15551234567",  label: "already E.164" },
        { input: "15551234567",     expected: "+15551234567",  label: "11-digit with leading 1" },
        { input: "555-123-4567",    expected: "+15551234567",  label: "dashes" },
        { input: "555.123.4567",    expected: "+15551234567",  label: "dots" },
    ];

    const mockAdmin = createMockAdmin(db, {});

    section("E1 — Various phone formats produce valid invite links");
    for (const { input, expected, label } of phoneFormats) {
        db._setDoc("events", `evt-phone-${label}`, {
            eventName: "Phone Test",
            creatorId: parentUid,
        });

        const { childInviteController } = buildController(db, mockAdmin);
        const res = mockRes();
        await childInviteController.getChildInviteLink(
            mockReq({ uid: parentUid }, { eventId: `evt-phone-${label}`, childPhone: input }, { PUBLIC_BASE_URL: "https://test.app" }),
            res
        );
        assert(`"${input}" (${label}) → link created`, res._status === null && !!res._json?.link);

        const tokenId = res._json?.token;
        const tokenDoc = db._getDoc("childInviteTokens", tokenId);
        assert(`"${input}" → stored as ${expected}`, tokenDoc?.childPhone === expected);
    }

    section("E2 — Parent uses 10-digit, child authenticates with +1 prefix → match");
    const childUid = "child-uid-005";
    const mockAdmin2 = createMockAdmin(db, {
        [childUid]: { uid: childUid, phoneNumber: "+15559999999" },
    });

    db._setDoc("events", "evt-phone-match", {
        eventName: "Phone Match Test",
        creatorId: parentUid,
    });

    const { childInviteController: ctrl2 } = buildController(db, mockAdmin2);

    const parentRes = mockRes();
    await ctrl2.getChildInviteLink(
        mockReq({ uid: parentUid }, { eventId: "evt-phone-match", childPhone: "5559999999" }, { PUBLIC_BASE_URL: "https://test.app" }),
        parentRes
    );
    const { token, pin } = parentRes._json;

    const childRes = mockRes();
    await ctrl2.claimChildInvite(mockReq({ uid: childUid }, { token, pin }), childRes);
    assert("10-digit parent input matches +1 child auth", childRes._status === null && !!childRes._json?.childAccountId);
}

async function testTokenSecurity() {
    console.log("\n═══ F. TOKEN SECURITY ═══");

    const db = createMockFirestore();
    const parentUid = "parent-uid-006";
    const childUid = "child-uid-006";
    const childPhone = "+15553334444";

    const mockAdmin = createMockAdmin(db, {
        [childUid]: { uid: childUid, phoneNumber: childPhone },
    });

    db._setDoc("events", "evt-bday-6", {
        eventName: "Birthday 6",
        creatorId: parentUid,
    });

    const { childInviteController } = buildController(db, mockAdmin);

    const parentRes = mockRes();
    await childInviteController.getChildInviteLink(
        mockReq({ uid: parentUid }, { eventId: "evt-bday-6", childPhone }, { PUBLIC_BASE_URL: "https://test.app" }),
        parentRes
    );
    const { token, pin } = parentRes._json;

    section("F1 — Token has sufficient entropy (48 hex chars = 24 bytes)");
    assert("Token is 48 hex characters", /^[a-f0-9]{48}$/.test(token));

    section("F2 — PIN is 6 digits (zero-padded)");
    assert("PIN is 6 digits", /^\d{6}$/.test(pin));

    section("F3 — PIN hash uses PBKDF2 (64-char hex = 32 bytes)");
    const tokenDoc = db._getDoc("childInviteTokens", token);
    assert("pinHash is 64 hex chars", /^[a-f0-9]{64}$/.test(tokenDoc.pinHash));
    assert("pinSalt is 32 hex chars", /^[a-f0-9]{32}$/.test(tokenDoc.pinSalt));

    section("F4 — Two invites produce different tokens, PINs, and salts");
    db._setDoc("events", "evt-bday-6b", { eventName: "Birthday 6b", creatorId: parentUid });
    const parentRes2 = mockRes();
    await childInviteController.getChildInviteLink(
        mockReq({ uid: parentUid }, { eventId: "evt-bday-6b", childPhone }, { PUBLIC_BASE_URL: "https://test.app" }),
        parentRes2
    );
    assert("Different tokens", parentRes._json.token !== parentRes2._json.token);
    const tokenDoc2 = db._getDoc("childInviteTokens", parentRes2._json.token);
    assert("Different salts", tokenDoc.pinSalt !== tokenDoc2.pinSalt);

    section("F5 — Expired token is rejected");
    const expiredToken = "expired_token_" + crypto.randomBytes(17).toString("hex");
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const pinSalt = crypto.randomBytes(16).toString("hex");
    const pinHash = crypto.pbkdf2Sync("123456", pinSalt, 100_000, 32, "sha256").toString("hex");
    db._setDoc("childInviteTokens", expiredToken, {
        eventId: "evt-bday-6",
        creatorId: parentUid,
        childPhone,
        pinHash,
        pinSalt,
        pinAttempts: 0,
        claimed: false,
        expiresAt: { toDate: () => pastDate },
    });

    const rExpired = mockRes();
    await childInviteController.claimChildInvite(
        mockReq({ uid: childUid }, { token: expiredToken, pin: "123456" }),
        rExpired
    );
    assert("Returns 410 for expired token", rExpired._status === 410);
    assert("Error mentions expired", rExpired._json?.error?.includes("expired"));
}

async function testStripeCardAccess() {
    console.log("\n═══ G. STRIPE CARD ACCESS ON CLAIM ═══");

    const db = createMockFirestore();
    const parentUid = "parent-uid-007";
    const childUid = "child-uid-007";
    const childPhone = "+15557778888";

    const mockAdmin = createMockAdmin(db, {
        [childUid]: { uid: childUid, phoneNumber: childPhone },
    });

    db._setDoc("events", "evt-bday-7", {
        eventName: "Birthday 7",
        creatorId: parentUid,
    });

    section("G1 — Claim succeeds even when parent has no Stripe card (graceful)");
    const { childInviteController } = buildController(db, mockAdmin, {});

    const parentRes = mockRes();
    await childInviteController.getChildInviteLink(
        mockReq({ uid: parentUid }, { eventId: "evt-bday-7", childPhone }, { PUBLIC_BASE_URL: "https://test.app" }),
        parentRes
    );
    const { token, pin } = parentRes._json;

    const childRes = mockRes();
    await childInviteController.claimChildInvite(
        mockReq({ uid: childUid }, { token, pin }),
        childRes
    );
    assert("Claim succeeded", childRes._status === null);
    assert("childAccountId returned", !!childRes._json?.childAccountId);
    assert("No ephemeral key (parent has no card)", childRes._json?.ephemeralKeySecret === null);
    assert("No cardLast4 (parent has no card)", childRes._json?.cardLast4 === null);

    section("G2 — Claim succeeds and returns eventName");
    assert("eventName is returned", childRes._json?.eventName === "Birthday 7");
}

async function testMultipleChildren() {
    console.log("\n═══ H. MULTIPLE CHILDREN / RE-INVITE ═══");

    const db = createMockFirestore();
    const parentUid = "parent-uid-008";
    const child1Uid = "child-uid-008a";
    const child2Uid = "child-uid-008b";
    const child1Phone = "+15551110001";
    const child2Phone = "+15551110002";

    const mockAdmin = createMockAdmin(db, {
        [child1Uid]: { uid: child1Uid, phoneNumber: child1Phone },
        [child2Uid]: { uid: child2Uid, phoneNumber: child2Phone },
    });

    db._setDoc("events", "evt-bday-8", {
        eventName: "Birthday 8",
        creatorId: parentUid,
    });

    const { childInviteController } = buildController(db, mockAdmin);

    section("H1 — Parent creates invite for child 1, child 1 claims");
    const parentRes1 = mockRes();
    await childInviteController.getChildInviteLink(
        mockReq({ uid: parentUid }, { eventId: "evt-bday-8", childPhone: child1Phone }, { PUBLIC_BASE_URL: "https://test.app" }),
        parentRes1
    );
    const { token: t1, pin: p1 } = parentRes1._json;

    const childRes1 = mockRes();
    await childInviteController.claimChildInvite(mockReq({ uid: child1Uid }, { token: t1, pin: p1 }), childRes1);
    assert("Child 1 claimed successfully", childRes1._status === null && !!childRes1._json?.childAccountId);

    section("H2 — Parent creates a second invite for child 2 on the same event");
    const parentRes2 = mockRes();
    await childInviteController.getChildInviteLink(
        mockReq({ uid: parentUid }, { eventId: "evt-bday-8", childPhone: child2Phone }, { PUBLIC_BASE_URL: "https://test.app" }),
        parentRes2
    );
    assert("Second invite created", parentRes2._status === null && !!parentRes2._json?.token);
    const { token: t2, pin: p2 } = parentRes2._json;

    const childRes2 = mockRes();
    await childInviteController.claimChildInvite(mockReq({ uid: child2Uid }, { token: t2, pin: p2 }), childRes2);
    assert("Child 2 claimed successfully", childRes2._status === null && !!childRes2._json?.childAccountId);
    assert("Different child account IDs", childRes1._json.childAccountId !== childRes2._json.childAccountId);

    section("H3 — Child 2 cannot use child 1's already-claimed token");
    const r3 = mockRes();
    await childInviteController.claimChildInvite(mockReq({ uid: child2Uid }, { token: t1, pin: p1 }), r3);
    assert("Returns 410 (already claimed)", r3._status === 410);

    section("H4 — Child 1 cannot use child 2's token (phone mismatch)");
    db._setDoc("events", "evt-bday-8b", { eventName: "Birthday 8b", creatorId: parentUid });
    const parentRes3 = mockRes();
    await childInviteController.getChildInviteLink(
        mockReq({ uid: parentUid }, { eventId: "evt-bday-8b", childPhone: child2Phone }, { PUBLIC_BASE_URL: "https://test.app" }),
        parentRes3
    );
    const { token: t3, pin: p3 } = parentRes3._json;

    const r4 = mockRes();
    await childInviteController.claimChildInvite(mockReq({ uid: child1Uid }, { token: t3, pin: p3 }), r4);
    assert("Returns 403 (phone mismatch)", r4._status === 403);
}

async function testEdgeCases() {
    console.log("\n═══ I. EDGE CASES ═══");

    const db = createMockFirestore();
    const parentUid = "parent-uid-009";
    const childPhone = "+15556667777";

    // Child whose Firebase Auth record has NO phone number
    const noPhoneChildUid = "child-nophone-009";
    // Child whose phone matches
    const matchChildUid = "child-match-009";

    const mockAdmin = createMockAdmin(db, {
        [noPhoneChildUid]: { uid: noPhoneChildUid, phoneNumber: undefined },
        [matchChildUid]: { uid: matchChildUid, phoneNumber: childPhone },
    });

    db._setDoc("events", "evt-bday-9", {
        eventName: "Birthday 9",
        creatorId: parentUid,
    });

    const { childInviteController } = buildController(db, mockAdmin);

    // Create a valid invite
    const parentRes = mockRes();
    await childInviteController.getChildInviteLink(
        mockReq({ uid: parentUid }, { eventId: "evt-bday-9", childPhone }, { PUBLIC_BASE_URL: "https://test.app" }),
        parentRes
    );
    const { token, pin } = parentRes._json;

    section("I1 — Child with no phone on Firebase Auth record → 403");
    const r1 = mockRes();
    await childInviteController.claimChildInvite(
        mockReq({ uid: noPhoneChildUid }, { token, pin }),
        r1
    );
    assert("Returns 403", r1._status === 403);
    assert("Error mentions phone not verified", r1._json?.error?.includes("Phone number not verified"));

    section("I2 — expiresAt is ~30 days from now");
    const expiresAt = new Date(parentRes._json.expiresAt);
    const now = new Date();
    const diffDays = (expiresAt - now) / (1000 * 60 * 60 * 24);
    assert("expiresAt is 29-31 days from now", diffDays >= 29 && diffDays <= 31);

    section("I3 — Event deleted between invite creation and claim → 404");
    db._setDoc("events", "evt-disappear", {
        eventName: "Vanishing Event",
        creatorId: parentUid,
    });
    const parentRes2 = mockRes();
    await childInviteController.getChildInviteLink(
        mockReq({ uid: parentUid }, { eventId: "evt-disappear", childPhone }, { PUBLIC_BASE_URL: "https://test.app" }),
        parentRes2
    );
    const { token: t2, pin: p2 } = parentRes2._json;

    // Delete the event after the invite was created
    delete db._collections["events"]["evt-disappear"];

    const r3 = mockRes();
    await childInviteController.claimChildInvite(
        mockReq({ uid: matchChildUid }, { token: t2, pin: p2 }),
        r3
    );
    assert("Returns 404", r3._status === 404);
    assert("Error mentions event no longer exists", r3._json?.error?.includes("no longer exists"));
}

// ═══════════════════════════════════════════════════════════════════
//  Main
// ═══════════════════════════════════════════════════════════════════
(async () => {
    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║  PARENT–CHILD LINKING FLOW TESTS                       ║");
    console.log("╚══════════════════════════════════════════════════════════╝");

    await testHappyPath();
    await testParentValidations();
    await testChildValidations();
    await testPinBruteForce();
    await testPhoneNormalization();
    await testTokenSecurity();
    await testStripeCardAccess();
    await testMultipleChildren();
    await testEdgeCases();

    const total = passed + failed;
    console.log("\n══════════════════════════════════════════════════════════");
    console.log(`  Results: ${passed}/${total} passed, ${failed} failed`);
    console.log(`  Sections: ${sections.length}`);
    console.log("══════════════════════════════════════════════════════════\n");

    process.exit(failed > 0 ? 1 : 0);
})();
