/**
 * Security Hardening Round 2 — Tests
 *
 * Validates the three testable security changes:
 *   A. Mandatory phone verification on claimChildInvite
 *   B. Daily SMS invite cap (10/day per user)
 *   C. Firestore default-deny catch-all rule
 *
 * App Check enforcement tests omitted (requires Apple Developer account).
 *
 * Usage:
 *   node functions/tests/test-security-hardening-r2.js
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

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

// ─── Extended in-memory Firestore mock ────────────────────────────
// Supports: .doc(), .add(), .collection() on doc refs (subcollections),
//           .where() chains, .limit(), .get(), .batch()
function createMockFirestore() {
    const collections = {};

    function getCollection(name) {
        if (!collections[name]) collections[name] = {};
        return collections[name];
    }

    function resolveValue(v) {
        if (v && v._type === "serverTimestamp") return new Date();
        if (v && typeof v === "object" && typeof v.toDate === "function") return v;
        return v;
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
            set: async (data) => {
                const resolved = {};
                for (const [k, v] of Object.entries(data)) resolved[k] = resolveValue(v);
                col[docId] = resolved;
            },
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
            collection: (subName) => {
                const subColName = `${collectionName}/${docId}/${subName}`;
                return collectionRef(subColName);
            },
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
                const resolved = {};
                for (const [k, v] of Object.entries(data)) resolved[k] = resolveValue(v);
                col[id] = resolved;
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
                return {
                    empty: docs.length === 0,
                    size: docs.length,
                    docs,
                };
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
function createMockAdmin(db) {
    return {
        firestore: Object.assign(() => db, {
            FieldValue: {
                serverTimestamp: () => ({ _type: "serverTimestamp" }),
                increment: (n) => ({ _type: "increment", _value: n }),
                delete: () => ({ _type: "delete" }),
            },
            Timestamp: {
                fromDate: (d) => ({ toDate: () => d }),
            },
        }),
        auth: () => ({
            createCustomToken: async (uid, claims) =>
                `mock-token-${uid}-${JSON.stringify(claims || {})}`,
        }),
        appCheck: () => ({
            verifyToken: async () => {},
        }),
    };
}

// ─── Module cache replacement (same pattern as test-parent-child-linking) ──
const firebaseAdminCachePath = require.resolve("firebase-admin");
const eventRepoCachePath = require.resolve(path.resolve(__dirname, "../repositories/eventRepository"));
const stripeAccountRepoCachePath = require.resolve(path.resolve(__dirname, "../repositories/stripeAccountRepository"));
const smsServiceCachePath = require.resolve(path.resolve(__dirname, "../services/smsService"));
const controllerCachePath = require.resolve(path.resolve(__dirname, "../controllers/childInviteController"));

function buildController(db, mockAdmin) {
    const eventRepo = {
        getById: async (id) => {
            const d = db._getDoc("events", id);
            return d ? { id, ...d } : null;
        },
    };

    const sentMessages = [];
    const smsService = {
        sendSMS: async (to, body) => {
            sentMessages.push({ to, body });
            return `mock-sid-${Date.now()}`;
        },
    };

    const stripeAccountRepo = { getByUid: async () => null };

    require.cache[firebaseAdminCachePath] = {
        id: firebaseAdminCachePath, filename: firebaseAdminCachePath, loaded: true,
        exports: mockAdmin,
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

    return { childInviteController, sentMessages };
}

function mockReq(user, body) {
    return { user, body, headers: {}, ip: "127.0.0.1" };
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

function hashPin(pin, salt) {
    return crypto.pbkdf2Sync(pin, salt, 100_000, 32, "sha256").toString("hex");
}

function seedValidToken(db, tokenId, overrides = {}) {
    const pin = "123456";
    const pinSalt = crypto.randomBytes(16).toString("hex");
    const pinHash = hashPin(pin, pinSalt);
    const expiresAt = { toDate: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) };

    db._setDoc("childInviteTokens", tokenId, {
        eventId: "evt-test",
        creatorId: "parent-uid",
        childPhone: "+15551234567",
        childName: "TestKid",
        pinHash,
        pinSalt,
        pinAttempts: 0,
        claimed: false,
        expiresAt,
        ...overrides,
    });

    return { pin, pinSalt, pinHash };
}

// ══════════════════════════════════════════════════════════════════
//  A. Mandatory Phone Verification on Claim
// ══════════════════════════════════════════════════════════════════
async function testPhoneVerification() {
    console.log("\n═══ A. MANDATORY PHONE VERIFICATION ON CLAIM ═══");

    const db = createMockFirestore();
    const mockAdmin = createMockAdmin(db);

    db._setDoc("events", "evt-test", {
        eventName: "Phone Test Event",
        creatorId: "parent-uid",
    });

    const { childInviteController } = buildController(db, mockAdmin);

    const { pin } = seedValidToken(db, "token-phone-a1");

    // A1: No phone_number on req.user → 403
    section("A1 — No phone_number on authenticated user → 403");
    const r1 = mockRes();
    await childInviteController.claimChildInvite(
        mockReq({ uid: "child-uid-1" }, { token: "token-phone-a1", pin }),
        r1
    );
    assert("Returns 403", r1._status === 403);
    assert("Error says phone verification required", r1._json?.error?.includes("Phone verification required"));

    // A2: Wrong phone → 403
    section("A2 — Authenticated phone does not match invite → 403");
    seedValidToken(db, "token-phone-a2");
    const r2 = mockRes();
    await childInviteController.claimChildInvite(
        mockReq(
            { uid: "child-uid-2", phone_number: "+15559999999" },
            { token: "token-phone-a2", pin }
        ),
        r2
    );
    assert("Returns 403", r2._status === 403);
    assert("Error says phone does not match", r2._json?.error?.includes("does not match"));

    // A3: Matching phone → success
    section("A3 — Authenticated phone matches invite → success");
    seedValidToken(db, "token-phone-a3");
    const r3 = mockRes();
    await childInviteController.claimChildInvite(
        mockReq(
            { uid: "child-uid-3", phone_number: "+15551234567" },
            { token: "token-phone-a3", pin }
        ),
        r3
    );
    assert("Returns 200 (no error status)", r3._status === null);
    assert("Has childAccountId", typeof r3._json?.childAccountId === "string");
    assert("Has customToken", typeof r3._json?.customToken === "string");

    // A4: Audit log written for no_phone_verified
    section("A4 — Audit log written with 'no_phone_verified'");
    seedValidToken(db, "token-phone-a4");
    const r4 = mockRes();
    await childInviteController.claimChildInvite(
        mockReq({ uid: "child-uid-4" }, { token: "token-phone-a4", pin }),
        r4
    );
    // Give fire-and-forget log a tick to write
    await new Promise(r => setTimeout(r, 50));
    const auditCol = db._collections["childInviteTokens/token-phone-a4/claimAttempts"];
    const auditDocs = auditCol ? Object.values(auditCol) : [];
    assert("Audit entry exists", auditDocs.length >= 1);
    assert("Audit result is no_phone_verified", auditDocs.some(d => d.result === "no_phone_verified"));
}

// ══════════════════════════════════════════════════════════════════
//  B. Daily SMS Invite Cap
// ══════════════════════════════════════════════════════════════════
async function testDailySmsCap() {
    console.log("\n═══ B. DAILY SMS INVITE CAP (10/DAY PER USER) ═══");

    // B1: User with 9 recent invites → next one succeeds
    section("B1 — 9 recent invites + 1 more → succeeds (under limit)");
    {
        const db = createMockFirestore();
        const mockAdmin = createMockAdmin(db);
        db._setDoc("events", "evt-cap-1", { eventName: "Cap Test", creatorId: "parent-cap" });

        const recentDate = new Date(Date.now() - 1000 * 60 * 30); // 30 min ago
        for (let i = 0; i < 9; i++) {
            db._setDoc("childInviteTokens", `old-invite-${i}`, {
                creatorId: "parent-cap",
                createdAt: { toDate: () => recentDate },
                eventId: `evt-old-${i}`,
                claimed: false,
            });
        }

        const { childInviteController } = buildController(db, mockAdmin);
        const res = mockRes();
        await childInviteController.sendChildInvite(
            mockReq({ uid: "parent-cap" }, { eventId: "evt-cap-1", childPhone: "+15551110001", childName: "Kid" }),
            res
        );
        assert("Returns success (no error status)", res._status === null);
        assert("success=true", res._json?.success === true);
    }

    // B2: User with 10 recent invites → blocked (429)
    section("B2 — 10 recent invites + 1 more → 429 daily_limit_exceeded");
    {
        const db = createMockFirestore();
        const mockAdmin = createMockAdmin(db);
        db._setDoc("events", "evt-cap-2", { eventName: "Cap Test 2", creatorId: "parent-cap" });

        const recentDate = new Date(Date.now() - 1000 * 60 * 30);
        for (let i = 0; i < 10; i++) {
            db._setDoc("childInviteTokens", `old-invite-b2-${i}`, {
                creatorId: "parent-cap",
                createdAt: { toDate: () => recentDate },
                eventId: `evt-old-${i}`,
                claimed: false,
            });
        }

        const { childInviteController } = buildController(db, mockAdmin);
        const res = mockRes();
        await childInviteController.sendChildInvite(
            mockReq({ uid: "parent-cap" }, { eventId: "evt-cap-2", childPhone: "+15551110002", childName: "Kid" }),
            res
        );
        assert("Returns 429", res._status === 429);
        assert("Code is daily_limit_exceeded", res._json?.code === "daily_limit_exceeded");
        assert("Error mentions 10 invites", res._json?.error?.includes("10"));
    }

    // B3: Different user not affected
    section("B3 — Different user with 0 invites → succeeds");
    {
        const db = createMockFirestore();
        const mockAdmin = createMockAdmin(db);
        db._setDoc("events", "evt-cap-3", { eventName: "Cap Test 3", creatorId: "parent-other" });

        const recentDate = new Date(Date.now() - 1000 * 60 * 30);
        for (let i = 0; i < 10; i++) {
            db._setDoc("childInviteTokens", `old-invite-b3-${i}`, {
                creatorId: "parent-cap",
                createdAt: { toDate: () => recentDate },
                eventId: `evt-old-${i}`,
                claimed: false,
            });
        }

        const { childInviteController } = buildController(db, mockAdmin);
        const res = mockRes();
        await childInviteController.sendChildInvite(
            mockReq({ uid: "parent-other" }, { eventId: "evt-cap-3", childPhone: "+15551110003", childName: "Kid" }),
            res
        );
        assert("Returns success", res._status === null);
        assert("success=true", res._json?.success === true);
    }

    // B4: Old invites (>24h) don't count
    section("B4 — 10 invites from 25h ago → next one succeeds (not counted)");
    {
        const db = createMockFirestore();
        const mockAdmin = createMockAdmin(db);
        db._setDoc("events", "evt-cap-4", { eventName: "Cap Test 4", creatorId: "parent-cap" });

        const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
        for (let i = 0; i < 10; i++) {
            db._setDoc("childInviteTokens", `old-invite-b4-${i}`, {
                creatorId: "parent-cap",
                createdAt: { toDate: () => oldDate },
                eventId: `evt-old-${i}`,
                claimed: false,
            });
        }

        const { childInviteController } = buildController(db, mockAdmin);
        const res = mockRes();
        await childInviteController.sendChildInvite(
            mockReq({ uid: "parent-cap" }, { eventId: "evt-cap-4", childPhone: "+15551110004", childName: "Kid" }),
            res
        );
        assert("Returns success (old invites not counted)", res._status === null);
        assert("success=true", res._json?.success === true);
    }
}

// ══════════════════════════════════════════════════════════════════
//  C. Firestore Default-Deny Catch-All Rule
// ══════════════════════════════════════════════════════════════════
function testFirestoreCatchAll() {
    console.log("\n═══ C. FIRESTORE DEFAULT-DENY CATCH-ALL RULE ═══");

    const rulesPath = path.join(__dirname, "..", "..", "firestore.rules");
    const rules = fs.readFileSync(rulesPath, "utf8");

    // C1: Catch-all rule exists
    section("C1 — Catch-all deny rule exists");
    assert("Contains match /{document=**}", rules.includes("match /{document=**}"));
    assert("Contains allow read, write: if false",
        /match \/\{document=\*\*\}[\s\S]*?allow read, write: if false/.test(rules));

    // C2: Catch-all is the last match block
    section("C2 — Catch-all is the last match block");
    const lastMatchIdx = rules.lastIndexOf("match /");
    const catchAllIdx = rules.indexOf("match /{document=**}");
    assert("Catch-all is at the last match position", lastMatchIdx === catchAllIdx);

    const childInviteIdx = rules.indexOf("match /childInviteTokens");
    assert("Catch-all comes after childInviteTokens rule", catchAllIdx > childInviteIdx);

    // C3: Existing explicit rules still present
    section("C3 — Existing collection rules still present");
    const expectedCollections = ["users", "events", "childAccounts", "provisioningTasks", "stripeAccounts", "virtualCards", "transactions"];
    for (const col of expectedCollections) {
        assert(`match /${col}/ rule exists`, rules.includes(`match /${col}/`));
    }

    // C4: No wildcard allow-all
    section("C4 — No wildcard allow-all rule");
    assert("No 'allow read, write: if true' on {document=**}",
        !(/match \/\{document=\*\*\}[\s\S]*?allow read, write: if true/.test(rules)));
}

// ══════════════════════════════════════════════════════════════════
//  Main
// ══════════════════════════════════════════════════════════════════
(async () => {
    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║  SECURITY HARDENING ROUND 2 — TESTS                     ║");
    console.log("╚══════════════════════════════════════════════════════════╝");

    await testPhoneVerification();
    await testDailySmsCap();
    testFirestoreCatchAll();

    const total = passed + failed;
    console.log("\n══════════════════════════════════════════════════════════");
    console.log(`  Results: ${passed}/${total} passed, ${failed} failed`);
    console.log(`  Sections: ${sections.length}`);
    console.log("══════════════════════════════════════════════════════════\n");

    process.exit(failed > 0 ? 1 : 0);
})();
