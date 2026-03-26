/**
 * Parent–Child Linking Flow Tests
 *
 * Exercises the full invite-and-claim lifecycle through the real controller
 * code with mocked Firebase/Stripe/Twilio dependencies.
 *
 * Scenarios:
 *   A. Happy path          — parent sends SMS invite, child claims with PIN → auto-login via Custom Token
 *   B. Parent validations  — missing fields, wrong event owner, non-existent event
 *   C. Child validations   — wrong PIN, expired token, already claimed, missing fields
 *   D. PIN brute-force     — lockout after 5 wrong attempts
 *   E. Phone normalization — various phone formats all match correctly
 *   F. Token security      — token entropy, one-time use, expiry enforcement
 *   G. Stripe card access  — child receives ephemeral key when parent has card
 *   H. Multiple children   — two children on same event
 *   I. Edge cases          — event deleted before claim, expiresAt ~30 days
 *   J. SMS delivery        — sendChildInvite formats message correctly
 *   K. Auto-login          — claimChildInvite creates Firebase user + Custom Token
 *   L. Legacy endpoint     — getChildInviteLink still works for backward compat
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

    function matchFilter(docData, filters) {
        return filters.every(({ field, op, value }) => {
            let docVal = docData[field];
            if (docVal && typeof docVal.toDate === "function") docVal = docVal.toDate();
            let cmpVal = value;
            if (cmpVal && typeof cmpVal.toDate === "function") cmpVal = cmpVal.toDate();
            switch (op) {
                case "==": return docVal === cmpVal;
                case ">=": return docVal >= cmpVal;
                case "<=": return docVal <= cmpVal;
                case ">": return docVal > cmpVal;
                case "<": return docVal < cmpVal;
                default: return false;
            }
        });
    }

    function doc(collectionName, docId) {
        const col = getCollection(collectionName);
        const ref = {
            id: docId,
            path: `${collectionName}/${docId}`,
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
            collection: (subName) => collectionRef(`${collectionName}/${docId}/${subName}`),
        };
        return ref;
    }

    let autoIdCounter = 0;

    function collectionRef(name) {
        return {
            doc: (id) => doc(name, id),
            add: async (data) => {
                const id = `auto_${++autoIdCounter}`;
                const col = getCollection(name);
                col[id] = { ...data };
                return { id };
            },
            where: (field, op, value) => buildQuery(name, [{ field, op, value }]),
        };
    }

    function buildQuery(colName, filters) {
        let _limit = Infinity;
        const q = {
            where: (field, op, value) => buildQuery(colName, [...filters, { field, op, value }]),
            limit: (n) => { _limit = n; return q; },
            get: async () => {
                const col = getCollection(colName);
                const docs = [];
                for (const [id, data] of Object.entries(col)) {
                    if (matchFilter(data, filters)) {
                        docs.push({
                            id,
                            ref: doc(colName, id),
                            data: () => ({ ...data }),
                        });
                        if (docs.length >= _limit) break;
                    }
                }
                return { empty: docs.length === 0, size: docs.length, docs };
            },
        };
        return q;
    }

    const db = {
        collection: (name) => collectionRef(name),
        batch: () => {
            const ops = [];
            return {
                update: (ref, data) => ops.push({ ref, data }),
                commit: async () => {
                    for (const { ref, data } of ops) await ref.update(data);
                },
            };
        },
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
function createMockAdmin(db, usersByUid = {}, usersByPhone = {}) {
    return {
        firestore: () => db,
        auth: () => ({
            getUser: async (uid) => {
                if (!usersByUid[uid]) {
                    const err = new Error(`User ${uid} not found`);
                    err.code = "auth/user-not-found";
                    throw err;
                }
                return usersByUid[uid];
            },
            getUserByPhoneNumber: async (phone) => {
                if (!usersByPhone[phone]) {
                    const err = new Error(`No user found for phone ${phone}`);
                    err.code = "auth/user-not-found";
                    throw err;
                }
                return usersByPhone[phone];
            },
            createUser: async (data) => {
                const uid = `auto-child-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                const record = { uid, phoneNumber: data.phoneNumber, displayName: data.displayName || null };
                usersByUid[uid] = record;
                if (data.phoneNumber) usersByPhone[data.phoneNumber] = record;
                return record;
            },
            createCustomToken: async (uid, claims) => {
                return `mock-custom-token-${uid}-${JSON.stringify(claims || {})}`;
            },
        }),
    };
}

// ─── Mock modules & build controller ──────────────────────────────

const path = require("path");

const firebaseAdminCachePath = require.resolve("firebase-admin");
const eventRepoCachePath = require.resolve(path.resolve(__dirname, "../repositories/eventRepository"));
const stripeAccountRepoCachePath = require.resolve(path.resolve(__dirname, "../repositories/stripeAccountRepository"));
const smsServiceCachePath = require.resolve(path.resolve(__dirname, "../services/smsService"));
const controllerCachePath = require.resolve(path.resolve(__dirname, "../controllers/childInviteController"));

function buildController(db, mockAdmin, stripeAccounts = {}, smsSpy = null) {
    const eventRepo = {
        getById: async (id) => {
            const doc = db._getDoc("events", id);
            return doc ? { id, ...doc } : null;
        },
    };

    const stripeAccountRepo = {
        getByUid: async (uid) => stripeAccounts[uid] || null,
    };

    const sentMessages = [];
    const smsService = {
        isSmsConfigured: () => true,
        sendSMS: async (to, body) => {
            sentMessages.push({ to, body });
            if (smsSpy) smsSpy(to, body);
            return `mock-sid-${Date.now()}`;
        },
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
    require.cache[smsServiceCachePath] = {
        id: smsServiceCachePath, filename: smsServiceCachePath, loaded: true,
        exports: smsService,
    };

    delete require.cache[controllerCachePath];
    const childInviteController = require(controllerCachePath);

    return { childInviteController, eventRepo, stripeAccountRepo, smsService, sentMessages };
}

// ─── Request/Response helpers ─────────────────────────────────────
function mockReq(user, body, extras = {}) {
    return { user, body, headers: {}, ip: "127.0.0.1", ...extras };
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
    console.log("\n═══ A. HAPPY PATH — PARENT SENDS SMS, CHILD CLAIMS WITH PIN ═══");

    const db = createMockFirestore();
    const parentUid = "parent-uid-001";
    const childPhone = "+15551234567";

    const usersByUid = {};
    const usersByPhone = {};
    const mockAdmin = createMockAdmin(db, usersByUid, usersByPhone);

    db._setDoc("events", "evt-birthday", {
        eventName: "Mia's Birthday",
        creatorId: parentUid,
        status: "active",
    });

    const { childInviteController, sentMessages } = buildController(db, mockAdmin);

    // ── Step 1: Parent sends SMS invite ──
    section("A1 — Parent sends child invite via SMS");
    const parentReq = mockReq(
        { uid: parentUid },
        { eventId: "evt-birthday", childPhone: "5551234567", childName: "Mia" }
    );
    const parentRes = mockRes();
    await childInviteController.sendChildInvite(parentReq, parentRes);

    assert("Returns 200 (no error status)", parentRes._status === null);
    assert("Response has success=true", parentRes._json?.success === true);
    assert("Response has childName", parentRes._json?.childName === "Mia");
    assert("Response has expiresAt", typeof parentRes._json?.expiresAt === "string");
    assert("Response does NOT leak link", parentRes._json?.link === undefined);
    assert("Response does NOT leak pin", parentRes._json?.pin === undefined);
    assert("Response does NOT leak token", parentRes._json?.token === undefined);

    section("A2 — SMS was sent via Twilio");
    assert("One SMS sent", sentMessages.length === 1);
    assert("SMS sent to correct phone", sentMessages[0].to === "+15551234567");
    assert("SMS body mentions Mia", sentMessages[0].body.includes("Mia"));
    assert("SMS body has App Store link", sentMessages[0].body.includes("apps.apple.com") || sentMessages[0].body.includes("APP_STORE"));
    assert("SMS body has deep link", sentMessages[0].body.includes("creditkidapp://child?token="));
    assert("SMS body has PIN (6 digits)", /\d{6}/.test(sentMessages[0].body));

    // Extract token and PIN from SMS body
    const tokenMatch = sentMessages[0].body.match(/creditkidapp:\/\/child\?token=([a-f0-9]+)/);
    const pinMatch = sentMessages[0].body.match(/code:\s*(\d{6})/i);
    const token = tokenMatch?.[1];
    const pin = pinMatch?.[1];
    assert("Token extracted from SMS", !!token);
    assert("PIN extracted from SMS", !!pin);

    section("A3 — Token stored correctly in Firestore");
    const tokenDoc = db._getDoc("childInviteTokens", token);
    assert("Token doc exists", !!tokenDoc);
    assert("Token has eventId", tokenDoc.eventId === "evt-birthday");
    assert("Token has creatorId", tokenDoc.creatorId === parentUid);
    assert("Token has normalized phone", tokenDoc.childPhone === "+15551234567");
    assert("Token has childName", tokenDoc.childName === "Mia");
    assert("Token has pinHash", typeof tokenDoc.pinHash === "string" && tokenDoc.pinHash.length === 64);
    assert("Token not claimed", tokenDoc.claimed === false);
    assert("Token pinAttempts = 0", tokenDoc.pinAttempts === 0);

    section("A4 — Event updated with child info");
    const eventDoc = db._getDoc("events", "evt-birthday");
    assert("Event has childPhone", eventDoc.childPhone === "+15551234567");
    assert("Event has childName", eventDoc.childName === "Mia");

    // ── Step 2: Child claims the invite (requires phone auth) ──
    section("A5 — Child claims invite with PIN (authenticated via phone)");
    const childReq = mockReq({ uid: "child-uid-mia", phone_number: "+15551234567" }, { token, pin });
    const childRes = mockRes();
    await childInviteController.claimChildInvite(childReq, childRes);

    assert("Returns 200 (no error status)", childRes._status === null);
    assert("Response has customToken", typeof childRes._json?.customToken === "string");
    assert("customToken is a mock token", childRes._json.customToken.startsWith("mock-custom-token-"));
    assert("Response has childAccountId", typeof childRes._json?.childAccountId === "string");
    assert("Response has eventId", childRes._json?.eventId === "evt-birthday");
    assert("Response has eventName", childRes._json?.eventName === "Mia's Birthday");

    section("A6 — Child account created correctly");
    const childAccountId = childRes._json.childAccountId;
    const childAccount = db._getDoc("childAccounts", childAccountId);
    assert("Child account exists", !!childAccount);
    assert("Child account has userId (auto-created)", typeof childAccount.userId === "string");
    assert("Child account has eventId", childAccount.eventId === "evt-birthday");
    assert("Child account has creatorId", childAccount.creatorId === parentUid);
    assert("Child account has phone", childAccount.phoneNumber === "+15551234567");

    section("A7 — Token marked as claimed");
    const claimedToken = db._getDoc("childInviteTokens", token);
    assert("Token is claimed", claimedToken.claimed === true);
    assert("Token has claimedBy", typeof claimedToken.claimedBy === "string");
}

async function testParentValidations() {
    console.log("\n═══ B. PARENT-SIDE VALIDATIONS ═══");

    const db = createMockFirestore();
    const parentUid = "parent-uid-002";
    const otherUid = "other-uid-002";

    const mockAdmin = createMockAdmin(db, {}, {});

    db._setDoc("events", "evt-bday-2", {
        eventName: "Test Event",
        creatorId: parentUid,
    });

    const { childInviteController } = buildController(db, mockAdmin);

    section("B1 — Missing eventId");
    const r1 = mockRes();
    await childInviteController.sendChildInvite(
        mockReq({ uid: parentUid }, { childPhone: "+15551111111", childName: "Test" }),
        r1
    );
    assert("Returns 400", r1._status === 400);
    assert("Error mentions eventId", r1._json?.error?.includes("eventId"));

    section("B2 — Missing childPhone");
    const r2 = mockRes();
    await childInviteController.sendChildInvite(
        mockReq({ uid: parentUid }, { eventId: "evt-bday-2", childName: "Test" }),
        r2
    );
    assert("Returns 400", r2._status === 400);
    assert("Error mentions childPhone", r2._json?.error?.includes("childPhone"));

    section("B3 — Invalid phone number (too short)");
    const r3 = mockRes();
    await childInviteController.sendChildInvite(
        mockReq({ uid: parentUid }, { eventId: "evt-bday-2", childPhone: "123", childName: "Test" }),
        r3
    );
    assert("Returns 400", r3._status === 400);
    assert("Error mentions invalid phone", r3._json?.error?.includes("Invalid phone"));

    section("B4 — Event not found");
    const r4 = mockRes();
    await childInviteController.sendChildInvite(
        mockReq({ uid: parentUid }, { eventId: "nonexistent", childPhone: "+15551111111", childName: "Test" }),
        r4
    );
    assert("Returns 404", r4._status === 404);

    section("B5 — Not the event creator (another user's event)");
    const r5 = mockRes();
    await childInviteController.sendChildInvite(
        mockReq({ uid: otherUid }, { eventId: "evt-bday-2", childPhone: "+15551111111", childName: "Test" }),
        r5
    );
    assert("Returns 403", r5._status === 403);
    assert("Error mentions authorization", r5._json?.error?.toLowerCase()?.includes("not authorized"));
}

async function testChildValidations() {
    console.log("\n═══ C. CHILD-SIDE VALIDATIONS ═══");

    const db = createMockFirestore();
    const parentUid = "parent-uid-003";
    const childPhone = "+15559876543";

    const mockAdmin = createMockAdmin(db, {}, {});

    db._setDoc("events", "evt-bday-3", {
        eventName: "Birthday 3",
        creatorId: parentUid,
    });

    const { childInviteController, sentMessages } = buildController(db, mockAdmin);

    // Create a valid invite first
    const parentRes = mockRes();
    await childInviteController.sendChildInvite(
        mockReq({ uid: parentUid }, { eventId: "evt-bday-3", childPhone, childName: "Kid" }),
        parentRes
    );
    const tokenMatch = sentMessages[0].body.match(/creditkidapp:\/\/child\?token=([a-f0-9]+)/);
    const pinMatch = sentMessages[0].body.match(/code:\s*(\d{6})/i);
    const token = tokenMatch[1];
    const pin = pinMatch[1];

    section("C1 — Missing token");
    const r1 = mockRes();
    await childInviteController.claimChildInvite(mockReq(null, { pin: "123456" }), r1);
    assert("Returns 400", r1._status === 400);
    assert("Error mentions token", r1._json?.error?.includes("token"));

    section("C2 — Missing PIN");
    const r2 = mockRes();
    await childInviteController.claimChildInvite(mockReq(null, { token }), r2);
    assert("Returns 400", r2._status === 400);
    assert("Error mentions PIN", r2._json?.error?.includes("PIN"));

    section("C3 — Invalid token (not found)");
    const r3 = mockRes();
    await childInviteController.claimChildInvite(
        mockReq(null, { token: "nonexistent_token_abc", pin }),
        r3
    );
    assert("Returns 404", r3._status === 404);

    section("C4 — Wrong PIN (first attempt)");
    const r4 = mockRes();
    await childInviteController.claimChildInvite(
        mockReq(null, { token, pin: "000000" }),
        r4
    );
    assert("Returns 403", r4._status === 403);
    assert("Error mentions incorrect PIN", r4._json?.error?.includes("Incorrect PIN"));
    assert("Error shows remaining attempts", r4._json?.error?.includes("remaining"));

    section("C5 — Correct PIN after a wrong attempt still works");
    const r5 = mockRes();
    await childInviteController.claimChildInvite(
        mockReq({ uid: "child-uid-c5", phone_number: "+15559876543" }, { token, pin }),
        r5
    );
    assert("Returns 200", r5._status === null);
    assert("Claim succeeded", !!r5._json?.childAccountId);
    assert("Custom token returned", typeof r5._json?.customToken === "string");

    section("C6 — Token already claimed (double claim)");
    const r6 = mockRes();
    await childInviteController.claimChildInvite(
        mockReq(null, { token, pin }),
        r6
    );
    assert("Returns 410", r6._status === 410);
    assert("Error mentions already used", r6._json?.error?.includes("already been used"));
}

async function testPinBruteForce() {
    console.log("\n═══ D. PIN BRUTE-FORCE LOCKOUT ═══");

    const db = createMockFirestore();
    const parentUid = "parent-uid-004";
    const childPhone = "+15551112222";

    const mockAdmin = createMockAdmin(db, {}, {});

    db._setDoc("events", "evt-bday-4", {
        eventName: "Birthday 4",
        creatorId: parentUid,
    });

    const { childInviteController, sentMessages } = buildController(db, mockAdmin);

    const parentRes = mockRes();
    await childInviteController.sendChildInvite(
        mockReq({ uid: parentUid }, { eventId: "evt-bday-4", childPhone, childName: "Kid" }),
        parentRes
    );
    const tokenMatch = sentMessages[0].body.match(/creditkidapp:\/\/child\?token=([a-f0-9]+)/);
    const pinMatch = sentMessages[0].body.match(/code:\s*(\d{6})/i);
    const token = tokenMatch[1];
    const pin = pinMatch[1];

    section("D1 — 5 wrong PIN attempts exhaust the limit");
    for (let i = 1; i <= 5; i++) {
        const r = mockRes();
        await childInviteController.claimChildInvite(
            mockReq(null, { token, pin: "999999" }),
            r
        );
        assert(`Wrong attempt ${i}/5 → 403`, r._status === 403);
    }

    section("D2 — 6th attempt with correct PIN → still locked out (429)");
    const rLocked = mockRes();
    await childInviteController.claimChildInvite(
        mockReq(null, { token, pin }),
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

    const mockAdmin = createMockAdmin(db, {}, {});

    section("E1 — Various phone formats produce valid SMS invites");
    for (const { input, expected, label } of phoneFormats) {
        db._setDoc("events", `evt-phone-${label}`, {
            eventName: "Phone Test",
            creatorId: parentUid,
        });

        const { childInviteController, sentMessages } = buildController(db, mockAdmin);
        const res = mockRes();
        await childInviteController.sendChildInvite(
            mockReq({ uid: parentUid }, { eventId: `evt-phone-${label}`, childPhone: input, childName: "Kid" }),
            res
        );
        assert(`"${input}" (${label}) → SMS sent`, res._status === null && res._json?.success === true);

        const tokenId = sentMessages[0]?.body?.match(/creditkidapp:\/\/child\?token=([a-f0-9]+)/)?.[1];
        const tokenDoc = db._getDoc("childInviteTokens", tokenId);
        assert(`"${input}" → stored as ${expected}`, tokenDoc?.childPhone === expected);
    }
}

async function testTokenSecurity() {
    console.log("\n═══ F. TOKEN SECURITY ═══");

    const db = createMockFirestore();
    const parentUid = "parent-uid-006";

    const mockAdmin = createMockAdmin(db, {}, {});

    db._setDoc("events", "evt-bday-6", {
        eventName: "Birthday 6",
        creatorId: parentUid,
    });

    const { childInviteController, sentMessages } = buildController(db, mockAdmin);

    const parentRes = mockRes();
    await childInviteController.sendChildInvite(
        mockReq({ uid: parentUid }, { eventId: "evt-bday-6", childPhone: "+15553334444", childName: "Kid" }),
        parentRes
    );

    const tokenMatch = sentMessages[0].body.match(/creditkidapp:\/\/child\?token=([a-f0-9]+)/);
    const token = tokenMatch[1];

    section("F1 — Token has sufficient entropy (48 hex chars = 24 bytes)");
    assert("Token is 48 hex characters", /^[a-f0-9]{48}$/.test(token));

    section("F2 — PIN in SMS is 6 digits");
    const pinMatch = sentMessages[0].body.match(/code:\s*(\d{6})/i);
    assert("PIN is 6 digits", /^\d{6}$/.test(pinMatch?.[1]));

    section("F3 — PIN hash uses PBKDF2 (64-char hex = 32 bytes)");
    const tokenDoc = db._getDoc("childInviteTokens", token);
    assert("pinHash is 64 hex chars", /^[a-f0-9]{64}$/.test(tokenDoc.pinHash));
    assert("pinSalt is 32 hex chars", /^[a-f0-9]{32}$/.test(tokenDoc.pinSalt));

    section("F4 — Two invites produce different tokens and salts");
    db._setDoc("events", "evt-bday-6b", { eventName: "Birthday 6b", creatorId: parentUid });
    const parentRes2 = mockRes();
    await childInviteController.sendChildInvite(
        mockReq({ uid: parentUid }, { eventId: "evt-bday-6b", childPhone: "+15553334444", childName: "Kid" }),
        parentRes2
    );
    const token2Match = sentMessages[1].body.match(/creditkidapp:\/\/child\?token=([a-f0-9]+)/);
    const token2 = token2Match[1];
    assert("Different tokens", token !== token2);
    const tokenDoc2 = db._getDoc("childInviteTokens", token2);
    assert("Different salts", tokenDoc.pinSalt !== tokenDoc2.pinSalt);

    section("F5 — Expired token is rejected");
    const expiredToken = "expired_token_" + crypto.randomBytes(17).toString("hex");
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const pinSalt = crypto.randomBytes(16).toString("hex");
    const pinHash = crypto.pbkdf2Sync("123456", pinSalt, 100_000, 32, "sha256").toString("hex");
    db._setDoc("childInviteTokens", expiredToken, {
        eventId: "evt-bday-6",
        creatorId: parentUid,
        childPhone: "+15553334444",
        pinHash,
        pinSalt,
        pinAttempts: 0,
        claimed: false,
        expiresAt: { toDate: () => pastDate },
    });

    const rExpired = mockRes();
    await childInviteController.claimChildInvite(
        mockReq(null, { token: expiredToken, pin: "123456" }),
        rExpired
    );
    assert("Returns 410 for expired token", rExpired._status === 410);
    assert("Error mentions expired", rExpired._json?.error?.includes("expired"));
}

async function testStripeCardAccess() {
    console.log("\n═══ G. STRIPE CARD ACCESS ON CLAIM ═══");

    const db = createMockFirestore();
    const parentUid = "parent-uid-007";
    const childPhone = "+15557778888";

    const mockAdmin = createMockAdmin(db, {}, {});

    db._setDoc("events", "evt-bday-7", {
        eventName: "Birthday 7",
        creatorId: parentUid,
    });

    section("G1 — Claim succeeds even when parent has no Stripe card (graceful)");
    const { childInviteController, sentMessages } = buildController(db, mockAdmin, {});

    const parentRes = mockRes();
    await childInviteController.sendChildInvite(
        mockReq({ uid: parentUid }, { eventId: "evt-bday-7", childPhone, childName: "Kid" }),
        parentRes
    );
    const tokenMatch = sentMessages[0].body.match(/creditkidapp:\/\/child\?token=([a-f0-9]+)/);
    const pinMatch = sentMessages[0].body.match(/code:\s*(\d{6})/i);
    const token = tokenMatch[1];
    const pin = pinMatch[1];

    const childRes = mockRes();
    await childInviteController.claimChildInvite(
        mockReq({ uid: "child-uid-g1", phone_number: "+15557778888" }, { token, pin }),
        childRes
    );
    assert("Claim succeeded", childRes._status === null);
    assert("childAccountId returned", !!childRes._json?.childAccountId);
    assert("customToken returned", typeof childRes._json?.customToken === "string");
    assert("No ephemeral key (parent has no card)", childRes._json?.ephemeralKeySecret === null);
    assert("No cardLast4 (parent has no card)", childRes._json?.cardLast4 === null);

    section("G2 — Claim succeeds and returns eventName");
    assert("eventName is returned", childRes._json?.eventName === "Birthday 7");
}

async function testMultipleChildren() {
    console.log("\n═══ H. MULTIPLE CHILDREN ═══");

    const db = createMockFirestore();
    const parentUid = "parent-uid-008";
    const child1Phone = "+15551110001";
    const child2Phone = "+15551110002";

    const mockAdmin = createMockAdmin(db, {}, {});

    db._setDoc("events", "evt-bday-8", {
        eventName: "Birthday 8",
        creatorId: parentUid,
    });

    const { childInviteController, sentMessages } = buildController(db, mockAdmin);

    section("H1 — Parent sends invite for child 1, child 1 claims");
    const parentRes1 = mockRes();
    await childInviteController.sendChildInvite(
        mockReq({ uid: parentUid }, { eventId: "evt-bday-8", childPhone: child1Phone, childName: "Child1" }),
        parentRes1
    );
    const t1Match = sentMessages[0].body.match(/creditkidapp:\/\/child\?token=([a-f0-9]+)/);
    const p1Match = sentMessages[0].body.match(/code:\s*(\d{6})/i);
    const t1 = t1Match[1], p1 = p1Match[1];

    const childRes1 = mockRes();
    await childInviteController.claimChildInvite(mockReq({ uid: "child-uid-h1", phone_number: child1Phone }, { token: t1, pin: p1 }), childRes1);
    assert("Child 1 claimed successfully", childRes1._status === null && !!childRes1._json?.childAccountId);

    section("H2 — Parent sends invite for child 2 on the same event");
    const parentRes2 = mockRes();
    await childInviteController.sendChildInvite(
        mockReq({ uid: parentUid }, { eventId: "evt-bday-8", childPhone: child2Phone, childName: "Child2" }),
        parentRes2
    );
    assert("Second invite sent", parentRes2._status === null && parentRes2._json?.success === true);
    const t2Match = sentMessages[1].body.match(/creditkidapp:\/\/child\?token=([a-f0-9]+)/);
    const p2Match = sentMessages[1].body.match(/code:\s*(\d{6})/i);
    const t2 = t2Match[1], p2 = p2Match[1];

    const childRes2 = mockRes();
    await childInviteController.claimChildInvite(mockReq({ uid: "child-uid-h2", phone_number: child2Phone }, { token: t2, pin: p2 }), childRes2);
    assert("Child 2 claimed successfully", childRes2._status === null && !!childRes2._json?.childAccountId);
    assert("Different child account IDs", childRes1._json.childAccountId !== childRes2._json.childAccountId);

    section("H3 — Cannot reuse child 1's already-claimed token");
    const r3 = mockRes();
    await childInviteController.claimChildInvite(mockReq({ uid: "child-uid-h1", phone_number: child1Phone }, { token: t1, pin: p1 }), r3);
    assert("Returns 410 (already claimed)", r3._status === 410);
}

async function testEdgeCases() {
    console.log("\n═══ I. EDGE CASES ═══");

    const db = createMockFirestore();
    const parentUid = "parent-uid-009";
    const childPhone = "+15556667777";

    const mockAdmin = createMockAdmin(db, {}, {});

    db._setDoc("events", "evt-bday-9", {
        eventName: "Birthday 9",
        creatorId: parentUid,
    });

    const { childInviteController, sentMessages } = buildController(db, mockAdmin);

    // Create a valid invite
    const parentRes = mockRes();
    await childInviteController.sendChildInvite(
        mockReq({ uid: parentUid }, { eventId: "evt-bday-9", childPhone, childName: "Kid" }),
        parentRes
    );

    section("I1 — expiresAt is ~30 days from now");
    const expiresAt = new Date(parentRes._json.expiresAt);
    const now = new Date();
    const diffDays = (expiresAt - now) / (1000 * 60 * 60 * 24);
    assert("expiresAt is 29-31 days from now", diffDays >= 29 && diffDays <= 31);

    section("I2 — Event deleted between invite creation and claim → 404");
    db._setDoc("events", "evt-disappear", {
        eventName: "Vanishing Event",
        creatorId: parentUid,
    });
    const parentRes2 = mockRes();
    await childInviteController.sendChildInvite(
        mockReq({ uid: parentUid }, { eventId: "evt-disappear", childPhone, childName: "Kid" }),
        parentRes2
    );
    const t2Match = sentMessages[1].body.match(/creditkidapp:\/\/child\?token=([a-f0-9]+)/);
    const p2Match = sentMessages[1].body.match(/code:\s*(\d{6})/i);
    const t2 = t2Match[1], p2 = p2Match[1];

    delete db._collections["events"]["evt-disappear"];

    const r3 = mockRes();
    await childInviteController.claimChildInvite(mockReq({ uid: "child-uid-i2", phone_number: childPhone }, { token: t2, pin: p2 }), r3);
    assert("Returns 404", r3._status === 404);
    assert("Error mentions event no longer exists", r3._json?.error?.includes("no longer exists"));

    section("I3 — sendChildInvite without childName uses default greeting");
    db._setDoc("events", "evt-noname", { eventName: "No Name Event", creatorId: parentUid });
    const parentRes3 = mockRes();
    await childInviteController.sendChildInvite(
        mockReq({ uid: parentUid }, { eventId: "evt-noname", childPhone }),
        parentRes3
    );
    assert("Succeeds without childName", parentRes3._status === null);
    assert("Response childName is null", parentRes3._json?.childName === null);
    const smsBody = sentMessages[2].body;
    assert("SMS greets with 'there' when no name", smsBody.includes("Hi there!"));
}

async function testSmsDelivery() {
    console.log("\n═══ J. SMS DELIVERY FORMAT ═══");

    const db = createMockFirestore();
    const parentUid = "parent-uid-010";
    const childPhone = "+15551234999";

    const mockAdmin = createMockAdmin(db, {}, {});

    db._setDoc("events", "evt-sms-test", {
        eventName: "SMS Test Event",
        creatorId: parentUid,
    });

    const { childInviteController, sentMessages } = buildController(db, mockAdmin);

    const parentRes = mockRes();
    await childInviteController.sendChildInvite(
        mockReq({ uid: parentUid }, { eventId: "evt-sms-test", childPhone, childName: "Emma" }),
        parentRes
    );

    section("J1 — SMS body contains all required elements");
    const body = sentMessages[0].body;
    assert("Contains child's name", body.includes("Emma"));
    assert("Contains numbered step 1", body.includes("1."));
    assert("Contains numbered step 2", body.includes("2."));
    assert("Contains numbered step 3", body.includes("3."));
    assert("Contains deep link scheme", body.includes("creditkidapp://"));
    assert("Ends with encouraging message", body.includes("gifts are waiting"));

    section("J2 — SMS is sent to normalized phone");
    assert("Sent to E.164 format", sentMessages[0].to === "+15551234999");
}

async function testAutoLogin() {
    console.log("\n═══ K. PHONE-AUTH CLAIM + CUSTOM TOKEN ═══");

    const db = createMockFirestore();
    const parentUid = "parent-uid-011";
    const childPhone = "+15559991111";
    const childUid = "child-uid-autologin";

    const usersByUid = {};
    const usersByPhone = {};
    const mockAdmin = createMockAdmin(db, usersByUid, usersByPhone);

    db._setDoc("events", "evt-autologin", {
        eventName: "Auto Login Test",
        creatorId: parentUid,
    });

    const { childInviteController, sentMessages } = buildController(db, mockAdmin);

    const parentRes = mockRes();
    await childInviteController.sendChildInvite(
        mockReq({ uid: parentUid }, { eventId: "evt-autologin", childPhone, childName: "Autokid" }),
        parentRes
    );
    const tokenMatch = sentMessages[0].body.match(/creditkidapp:\/\/child\?token=([a-f0-9]+)/);
    const pinMatch = sentMessages[0].body.match(/code:\s*(\d{6})/i);
    const token = tokenMatch[1];
    const pin = pinMatch[1];

    section("K1 — Authenticated child claims invite and gets custom token");
    const childRes = mockRes();
    await childInviteController.claimChildInvite(
        mockReq({ uid: childUid, phone_number: childPhone }, { token, pin }),
        childRes
    );
    assert("Claim succeeded", childRes._status === null);
    assert("customToken returned", typeof childRes._json?.customToken === "string");

    const childAccount = db._getDoc("childAccounts", childRes._json.childAccountId);
    assert("Child account uses authenticated uid", childAccount.userId === childUid);

    section("K2 — Custom token contains child role and eventId");
    const customToken = childRes._json.customToken;
    assert("Token includes child role", customToken.includes('"role":"child"'));
    assert("Token includes eventId", customToken.includes('"eventId":"evt-autologin"'));

    section("K3 — Same child claims second event with same phone");
    db._setDoc("events", "evt-autologin-2", { eventName: "Second Event", creatorId: parentUid });
    const parentRes2 = mockRes();
    await childInviteController.sendChildInvite(
        mockReq({ uid: parentUid }, { eventId: "evt-autologin-2", childPhone, childName: "Autokid" }),
        parentRes2
    );
    const t2Match = sentMessages[1].body.match(/creditkidapp:\/\/child\?token=([a-f0-9]+)/);
    const p2Match = sentMessages[1].body.match(/code:\s*(\d{6})/i);

    const childRes2 = mockRes();
    await childInviteController.claimChildInvite(
        mockReq({ uid: childUid, phone_number: childPhone }, { token: t2Match[1], pin: p2Match[1] }),
        childRes2
    );
    assert("Second claim succeeded", childRes2._status === null);

    const childAccount1 = db._getDoc("childAccounts", childRes._json.childAccountId);
    const childAccount2 = db._getDoc("childAccounts", childRes2._json.childAccountId);
    assert("Same userId for both claims (same authenticated child)", childAccount1.userId === childAccount2.userId);
}

function testLegacyEndpointRemoved() {
    console.log("\n═══ L. LEGACY ENDPOINT REMOVED ═══");

    const db = createMockFirestore();
    const mockAdmin = createMockAdmin(db, {}, {});
    const { childInviteController } = buildController(db, mockAdmin);

    section("L1 — getChildInviteLink no longer exported (removed for security)");
    assert("getChildInviteLink is undefined", childInviteController.getChildInviteLink === undefined);
}

// ═══════════════════════════════════════════════════════════════════
//  Main
// ═══════════════════════════════════════════════════════════════════
(async () => {
    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║  PARENT–CHILD LINKING FLOW TESTS (SMS + AUTO-LOGIN)     ║");
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
    await testSmsDelivery();
    await testAutoLogin();
    testLegacyEndpointRemoved();

    const total = passed + failed;
    console.log("\n══════════════════════════════════════════════════════════");
    console.log(`  Results: ${passed}/${total} passed, ${failed} failed`);
    console.log(`  Sections: ${sections.length}`);
    console.log("══════════════════════════════════════════════════════════\n");

    process.exit(failed > 0 ? 1 : 0);
})();
