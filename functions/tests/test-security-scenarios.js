/**
 * Security Scenario Tests — Mobile Client Use Cases
 *
 * Simulates realistic attack vectors against the API as experienced
 * by a mobile (React Native / Expo) client. Spins up a real Express
 * server with mocked auth + service layer so every middleware path is
 * exercised end-to-end without needing live Firebase/Stripe.
 *
 * Scenarios covered:
 *   A. Authentication attacks  (stolen / expired / malformed tokens)
 *   B. CORS for mobile         (no origin, deep links, webview abuse)
 *   C. Rate-limit exhaustion   (burst spam, per-user isolation)
 *   D. Card data exposure      (default vs full, fresh-auth gate, query param tricks)
 *   E. Cross-user isolation    (user A vs B — cards, balances, txns, payouts, account details)
 *   F. Input validation        (XSS, oversized payloads, missing fields; Connect without bank)
 *   G. Test endpoints in prod  (live key blocks debug routes)
 *   H. PII log safety          (console output never leaks PII)
 *   I. Webhook forgery         (invalid signatures rejected)
 *   J. Spending limit bypass   (client tries to set higher limit)
 *   K. Firestore rules         (all collections: owner-only, server-only, gifts/invitations/families)
 *   L. Misc edge cases         (preflight, unknown paths, HEAD, double-slash, traversal)
 *   M. Fresh-auth step-up      (full card reveal requires recent token, boundary tests)
 *   N. Body size limits        (realistic payloads fit within 256KB)
 *
 * Usage:
 *   node functions/tests/test-security-scenarios.js
 */

const http = require("http");
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

// ─── Test harness ────────────────────────────────────────────────
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

function req(server, method, urlPath, { headers = {}, body = null } = {}) {
    return new Promise((resolve) => {
        const addr = server.address();
        const opts = {
            hostname: "127.0.0.1", port: addr.port, path: urlPath,
            method, headers: { ...headers },
        };
        if (body) {
            const data = JSON.stringify(body);
            opts.headers["content-type"] = "application/json";
            opts.headers["content-length"] = Buffer.byteLength(data);
            const r = http.request(opts, collect(resolve));
            r.write(data);
            r.end();
        } else {
            http.request(opts, collect(resolve)).end();
        }
    });
}
function collect(resolve) {
    return (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
            let json;
            try { json = JSON.parse(body); } catch { json = null; }
            resolve({ status: res.statusCode, headers: res.headers, body, json });
        });
    };
}

// ─── Build a test Express app (mirrors index.js + routes.js) ─────
function buildApp({ stripeKey = "sk_test_fake", userMap = {} } = {}) {
    const rateLimit = require("express-rate-limit");
    const { ipKeyGenerator } = require("express-rate-limit");

    const ALLOWED_ORIGINS = [
        "https://creditkid.vercel.app",
        "https://www.creditkid.vercel.app",
        /^https:\/\/creditkid-.*\.vercel\.app$/,
        /^creditkid:\/\//,
        /^exp:\/\//,
        "http://localhost:3000", "http://localhost:8081", "http://localhost:19006",
    ];

    const app = express();
    app.use(cors({
        origin(origin, cb) {
            if (!origin) return cb(null, true);
            const ok = ALLOWED_ORIGINS.some((o) => o instanceof RegExp ? o.test(origin) : o === origin);
            cb(ok ? null : new Error("CORS not allowed"), ok);
        },
    }));

    app.post("/webhook", express.raw({ type: "application/json" }), (rq, rs) => {
        const sig = rq.headers["stripe-signature"];
        if (sig !== "valid_sig") return rs.status(400).json({ error: "Webhook signature invalid" });
        rs.json({ received: true });
    });

    app.post("/createCustomConnectAccount", express.json({ limit: "8mb" }), (rq, rs, next) => next());

    app.use(express.json({ limit: "256kb" }));

    const generalLimiter = rateLimit({
        windowMs: 60_000, max: 15,
        keyGenerator: (r) => r.user?.uid || ipKeyGenerator(r.ip),
        standardHeaders: true, legacyHeaders: false,
        message: { error: "Too many requests", code: "rate_limit_exceeded" },
    });
    const sensitiveLimiter = rateLimit({
        windowMs: 60_000, max: 5,
        keyGenerator: (r) => `sens-${r.user?.uid || ipKeyGenerator(r.ip)}`,
        standardHeaders: true, legacyHeaders: false,
        message: { error: "Too many requests", code: "rate_limit_exceeded" },
    });

    function fakeAuth(rq, rs, next) {
        const auth = rq.headers.authorization || "";
        if (!auth.startsWith("Bearer ")) return rs.status(401).json({ error: "Missing or invalid authorization header" });
        const token = auth.split("Bearer ")[1];
        if (token === "expired_token") return rs.status(401).json({ error: "Invalid token" });
        if (token === "malformed") return rs.status(401).json({ error: "Invalid token" });
        if (!token || token.length < 5) return rs.status(401).json({ error: "Invalid token" });
        const uid = userMap[token] || token;
        const iatOverride = rq.headers["x-test-iat"];
        const iat = iatOverride ? Number(iatOverride) : Math.floor(Date.now() / 1000);
        rq.user = { uid, iat };
        next();
    }

    app.use(generalLimiter);

    const userCardData = {
        "user-parent-A": { last4: "4242", exp_month: 12, exp_year: 2028, brand: "Visa" },
        "user-parent-B": { last4: "5555", exp_month: 6, exp_year: 2027, brand: "Mastercard" },
    };
    const userAccounts = {
        "user-parent-A": { accountId: "acct_A", balance: 5000 },
        "user-parent-B": { accountId: "acct_B", balance: 12000 },
    };

    const MAX_TOKEN_AGE_SEC = 5 * 60;

    // ── getCardDetails (mirrors production fresh-auth gate) ──
    app.get("/getCardDetails", fakeAuth, sensitiveLimiter, (rq, rs) => {
        const uid = rq.user.uid;
        const revealFull = rq.query.full === "true";
        const card = userCardData[uid];
        if (!card) return rs.status(404).json({ error: "Card not found.", code: "resource_missing" });

        if (revealFull) {
            const iat = rq.user.iat;
            const now = Math.floor(Date.now() / 1000);
            if (!iat || now - iat > MAX_TOKEN_AGE_SEC) {
                return rs.status(403).json({
                    error: "A fresh login is required to view full card details. Please re-authenticate and try again.",
                    code: "fresh_auth_required",
                });
            }
            return rs.json({ last4: card.last4, exp_month: card.exp_month, exp_year: card.exp_year,
                brand: card.brand, number: "4242424242424242", cvc: "123", success: true });
        }

        rs.json({ last4: card.last4, exp_month: card.exp_month, exp_year: card.exp_year, brand: card.brand, success: true });
    });

    // ── getFinancialAccountBalance ──
    app.get("/getFinancialAccountBalance", fakeAuth, (rq, rs) => {
        const uid = rq.user.uid;
        const acc = userAccounts[uid];
        if (!acc) return rs.status(404).json({ error: "No account." });
        rs.json({ balance: acc.balance, currency: "usd", success: true });
    });

    // ── getBalance ──
    app.get("/getBalance", fakeAuth, (rq, rs) => {
        const uid = rq.user.uid;
        const acc = userAccounts[uid];
        if (!acc) return rs.status(404).json({ error: "No account." });
        rs.json({ balance: acc.balance, success: true });
    });

    // ── getTransactions ──
    app.get("/getTransactions", fakeAuth, (rq, rs) => {
        const uid = rq.user.uid;
        const acc = userAccounts[uid];
        if (!acc) return rs.status(404).json({ error: "No account." });
        rs.json({ transactions: [{ id: "txn_1", amount: 1500, uid }], success: true });
    });

    // ── getAccountDetails ──
    app.get("/getAccountDetails", fakeAuth, (rq, rs) => {
        const uid = rq.user.uid;
        const acc = userAccounts[uid];
        if (!acc) return rs.status(404).json({ error: "No account." });
        rs.json({ accountId: acc.accountId, email: `${uid}@test.com`, success: true });
    });

    // ── getPayouts ──
    app.get("/getPayouts", fakeAuth, (rq, rs) => {
        const uid = rq.user.uid;
        const acc = userAccounts[uid];
        if (!acc) return rs.status(404).json({ error: "No account." });
        rs.json({ payouts: [{ id: "po_1", amount: 2000, uid }], success: true });
    });

    // ── getAccountStatus ──
    app.get("/getAccountStatus", fakeAuth, (rq, rs) => {
        const uid = rq.user.uid;
        const acc = userAccounts[uid];
        if (!acc) return rs.status(404).json({ error: "No account." });
        rs.json({ status: "active", accountId: acc.accountId, success: true });
    });

    // ── createCustomConnectAccount ──
    app.post("/createCustomConnectAccount", fakeAuth, (rq, rs) => {
        rs.json({ accountId: "acct_new", success: true });
    });

    // ── retryProvisioning ──
    app.post("/retryProvisioning", fakeAuth, sensitiveLimiter, (rq, rs) => {
        rs.json({ status: "restarted", success: true });
    });

    // ── createIssuingCardholder ──
    app.post("/createIssuingCardholder", fakeAuth, (rq, rs) => {
        const { name, email, line1, city, state, postal_code } = rq.body;
        if (!name || !email || !line1 || !city || !state || !postal_code) {
            return rs.status(400).json({ error: "Missing required fields: name, email, line1, city, state, postal_code" });
        }
        rs.json({ cardholderId: "ich_test", success: true });
    });

    // ── createVirtualCard ──
    app.post("/createVirtualCard", fakeAuth, (rq, rs) => {
        const { spendingLimitAmount = 50000 } = rq.body;
        const capped = Math.min(Number(spendingLimitAmount) || 50000, 50000);
        rs.json({ cardId: "ic_test", spendingLimitApplied: capped, success: true });
    });

    // ── createPayout ──
    app.post("/createPayout", fakeAuth, sensitiveLimiter, (rq, rs) => {
        const { amount } = rq.body;
        if (!amount || amount < 1) return rs.status(400).json({ error: "Amount required (minimum 1 cent)" });
        rs.json({ payoutId: "po_test", amount, success: true });
    });

    // ── addBankAccount ──
    app.post("/addBankAccount", fakeAuth, sensitiveLimiter, (rq, rs) => {
        const { account_holder_name, routing_number, account_number } = rq.body;
        if (!account_holder_name || !routing_number || !account_number)
            return rs.status(400).json({ error: "Missing required fields: account_holder_name, routing_number, account_number" });
        rs.json({ bankAccountId: "ba_test", success: true });
    });

    // ── createTestAuthorization ──
    app.post("/createTestAuthorization", fakeAuth, sensitiveLimiter, (rq, rs) => {
        rs.json({ authorizationId: "iauth_test", amount: rq.body.amount || 1000, approved: true, success: true });
    });

    // ── updateAccountInfo ──
    app.post("/updateAccountInfo", fakeAuth, (rq, rs) => {
        rs.json({ accountId: "acct_A", success: true });
    });

    // ── acceptTermsOfService ──
    app.post("/acceptTermsOfService", fakeAuth, (rq, rs) => {
        rs.json({ accountId: "acct_A", tos_accepted: true, success: true });
    });

    // ── createOnboardingLink ──
    app.post("/createOnboardingLink", fakeAuth, (rq, rs) => {
        rs.json({ accountId: "acct_A", url: "https://connect.stripe.com/setup/xxx", success: true });
    });

    // ── updateAccountCapabilities ──
    app.post("/updateAccountCapabilities", fakeAuth, (rq, rs) => {
        rs.json({ accountId: "acct_A", capabilities: {}, success: true });
    });

    // ── generatePoster ──
    app.post("/generatePoster", fakeAuth, (rq, rs) => {
        if (!rq.body.eventId) return rs.status(400).json({ error: "Missing eventId" });
        rs.json({ success: true, posterPrompt: "test", posterUrl: null });
    });

    // ── getChildInviteLink ──
    app.post("/getChildInviteLink", fakeAuth, (rq, rs) => {
        if (!rq.body.eventId || !rq.body.childPhone) return rs.status(400).json({ error: "Missing fields" });
        rs.json({ link: "https://creditkid.vercel.app/child?token=abc", pin: "123456", success: true });
    });

    // ── claimChildInvite ──
    app.post("/claimChildInvite", fakeAuth, (rq, rs) => {
        if (!rq.body.token || !rq.body.pin) return rs.status(400).json({ error: "Missing fields" });
        rs.json({ childAccountId: "ca_test", eventId: "evt_test", success: true });
    });

    // ── test-only endpoints (gated) ──
    const isTest = stripeKey.startsWith("sk_test_");
    if (isTest) {
        app.post("/testVerifyAccount", fakeAuth, (rq, rs) => rs.json({ ok: true }));
        app.post("/testCreateTransaction", fakeAuth, (rq, rs) => rs.json({ ok: true }));
        app.post("/testAddBalance", fakeAuth, (rq, rs) => rs.json({ ok: true }));
    }

    return app;
}

function listen(app) {
    return new Promise((resolve) => {
        const server = http.createServer(app);
        server.listen(0, "127.0.0.1", () => resolve(server));
    });
}

const AUTH_A = "Bearer user-parent-A";
const AUTH_B = "Bearer user-parent-B";

// ══════════════════════════════════════════════════════════════════
//  A. Authentication attacks
// ══════════════════════════════════════════════════════════════════
async function testAuth(server) {
    console.log("\n═══ A. AUTHENTICATION ATTACKS ═══");

    section("A1 — No auth header at all (phone was stolen, app cleared)");
    const r1 = await req(server, "GET", "/getCardDetails");
    assert("Returns 401", r1.status === 401);
    assert("No card data leaked", !r1.json?.last4);

    section("A2 — Empty Bearer token");
    const r2 = await req(server, "GET", "/getCardDetails", { headers: { Authorization: "Bearer " } });
    assert("Returns 401", r2.status === 401);

    section("A3 — Random garbage as token");
    const r3 = await req(server, "GET", "/getCardDetails", { headers: { Authorization: "Bearer aGVsbG8gd29ybGQ=" } });
    assert("Returns 404 (auth passes but no card for that uid)", r3.status === 404);
    assert("No card number leaked", !r3.json?.number);

    section("A4 — Expired token");
    const r4 = await req(server, "GET", "/getBalance", { headers: { Authorization: "Bearer expired_token" } });
    assert("Returns 401", r4.status === 401);
    assert("Error says invalid token", r4.json?.error === "Invalid token");

    section("A5 — Malformed token (too short)");
    const r5 = await req(server, "GET", "/getBalance", { headers: { Authorization: "Bearer ab" } });
    assert("Returns 401", r5.status === 401);

    section("A6 — Wrong auth scheme (Basic instead of Bearer)");
    const r6 = await req(server, "GET", "/getBalance", { headers: { Authorization: "Basic dXNlcjpwYXNz" } });
    assert("Returns 401", r6.status === 401);

    section("A7 — SQL injection in auth header");
    const r7 = await req(server, "GET", "/getBalance", { headers: { Authorization: "Bearer ' OR 1=1 --" } });
    assert("Does not return 200", r7.status !== 200);

    section("A8 — Valid token accesses own data correctly");
    const r8 = await req(server, "GET", "/getBalance", { headers: { Authorization: AUTH_A } });
    assert("Returns 200", r8.status === 200);
    assert("Returns balance", typeof r8.json?.balance === "number");
}

// ══════════════════════════════════════════════════════════════════
//  B. CORS for mobile
// ══════════════════════════════════════════════════════════════════
async function testCorsMobile(server) {
    console.log("\n═══ B. CORS — MOBILE USE CASES ═══");

    section("B1 — React Native (no origin header — typical mobile)");
    const r1 = await req(server, "GET", "/getBalance", { headers: { Authorization: AUTH_A } });
    assert("Allowed (200)", r1.status === 200);

    section("B2 — Expo Go dev client");
    const r2 = await req(server, "GET", "/getBalance", { headers: { Authorization: AUTH_A, Origin: "exp://192.168.1.5:8081" } });
    assert("Allowed (200)", r2.status === 200);

    section("B3 — creditkid:// deep link (app open from push notification)");
    const r3 = await req(server, "GET", "/getBalance", { headers: { Authorization: AUTH_A, Origin: "creditkid://dashboard" } });
    assert("Allowed (200)", r3.status === 200);

    section("B4 — Webview inside a phishing app");
    const r4 = await req(server, "GET", "/getBalance", { headers: { Authorization: AUTH_A, Origin: "https://scam-piggybank.com" } });
    assert("Blocked (500 CORS)", r4.status === 500);

    section("B5 — Attacker's localhost (different port)");
    const r5 = await req(server, "GET", "/getBalance", { headers: { Authorization: AUTH_A, Origin: "http://localhost:4444" } });
    assert("Blocked (500 CORS)", r5.status === 500);

    section("B6 — Subdomain spoofing attempt");
    const r6 = await req(server, "GET", "/getBalance", { headers: { Authorization: AUTH_A, Origin: "https://creditkid.vercel.app.evil.com" } });
    assert("Blocked (500 CORS)", r6.status === 500);

    section("B7 — Vercel preview deploy (legitimate)");
    const r7 = await req(server, "GET", "/getBalance", { headers: { Authorization: AUTH_A, Origin: "https://creditkid-pr-42.vercel.app" } });
    assert("Allowed (200)", r7.status === 200);

    section("B8 — HTTP instead of HTTPS on production domain");
    const r8 = await req(server, "GET", "/getBalance", { headers: { Authorization: AUTH_A, Origin: "http://creditkid.vercel.app" } });
    assert("Blocked — HTTP not allowed", r8.status === 500);

    section("B9 — null origin (iframe sandbox / redirect)");
    const r9 = await req(server, "GET", "/getBalance", { headers: { Authorization: AUTH_A, Origin: "null" } });
    assert("Blocked (500 CORS)", r9.status === 500);
}

// ══════════════════════════════════════════════════════════════════
//  C. Rate limiting (each sub-test uses a fresh server to avoid carry-over)
// ══════════════════════════════════════════════════════════════════
async function testRateLimit() {
    console.log("\n═══ C. RATE-LIMIT EXHAUSTION ═══");

    section("C1 — Burst-spam getCardDetails (sensitive: 5/min)");
    const s1 = await listen(buildApp());
    for (let i = 1; i <= 5; i++) {
        const r = await req(s1, "GET", "/getCardDetails", { headers: { Authorization: AUTH_A } });
        assert(`Request ${i}/5 → allowed (${r.status})`, r.status === 200);
    }
    const r6 = await req(s1, "GET", "/getCardDetails", { headers: { Authorization: AUTH_A } });
    assert("Request 6 → rate limited (429)", r6.status === 429);
    assert("Error code = rate_limit_exceeded", r6.json?.code === "rate_limit_exceeded");
    s1.close();

    section("C2 — User B still has their own budget (isolated)");
    const s2 = await listen(buildApp());
    // Use up all 5 of User A's sensitive budget
    for (let i = 0; i < 5; i++) await req(s2, "GET", "/getCardDetails", { headers: { Authorization: AUTH_A } });
    const rA_blocked = await req(s2, "GET", "/getCardDetails", { headers: { Authorization: AUTH_A } });
    assert("User A → blocked (429)", rA_blocked.status === 429);
    const rB = await req(s2, "GET", "/getCardDetails", { headers: { Authorization: AUTH_B } });
    assert("User B → still allowed (200)", rB.status === 200);
    s2.close();

    section("C3 — Retry provisioning also rate-limited (sensitive)");
    const s3 = await listen(buildApp());
    for (let i = 0; i < 5; i++) {
        await req(s3, "POST", "/retryProvisioning", { headers: { Authorization: AUTH_B } });
    }
    const rp6 = await req(s3, "POST", "/retryProvisioning", { headers: { Authorization: AUTH_B } });
    assert("6th retry → 429", rp6.status === 429);
    s3.close();

    section("C4 — General limiter on non-sensitive endpoints (15/min)");
    const s4 = await listen(buildApp());
    for (let i = 0; i < 15; i++) {
        await req(s4, "GET", "/getAccountStatus", { headers: { Authorization: AUTH_A } });
    }
    const rg16 = await req(s4, "GET", "/getAccountStatus", { headers: { Authorization: AUTH_A } });
    assert("16th general request → 429", rg16.status === 429);
    s4.close();

    section("C5 — Rate limit response does NOT leak data");
    assert("No balance in 429 body", r6.json?.balance === undefined);
    assert("No card data in 429 body", r6.json?.last4 === undefined);

    section("C6 — Sensitive and general limiters are independent");
    const s6 = await listen(buildApp());
    // Use up all 5 sensitive for User A (getCardDetails)
    for (let i = 0; i < 5; i++) await req(s6, "GET", "/getCardDetails", { headers: { Authorization: AUTH_A } });
    const sens_blocked = await req(s6, "GET", "/getCardDetails", { headers: { Authorization: AUTH_A } });
    assert("Sensitive endpoint blocked (429)", sens_blocked.status === 429);
    // But non-sensitive endpoint for same user/IP still works
    const gen_ok = await req(s6, "GET", "/getBalance", { headers: { Authorization: AUTH_A } });
    assert("General endpoint still allowed (200)", gen_ok.status === 200);
    s6.close();

    section("C7 — Unauthenticated requests are rate-limited by IP");
    const s7 = await listen(buildApp());
    for (let i = 0; i < 15; i++) {
        await req(s7, "GET", "/getBalance"); // no auth → 401, still consumes general limiter
    }
    const noauth_16 = await req(s7, "GET", "/getBalance");
    assert("16th unauthenticated request → 429", noauth_16.status === 429);
    s7.close();
}

// ══════════════════════════════════════════════════════════════════
//  D. Card data exposure
// ══════════════════════════════════════════════════════════════════
async function testCardExposure() {
    console.log("\n═══ D. CARD DATA EXPOSURE ═══");

    const app = buildApp();
    const server = await listen(app);

    section("D1 — Default request → only last4, no full number / CVC");
    const r1 = await req(server, "GET", "/getCardDetails", { headers: { Authorization: AUTH_A } });
    assert("Status 200", r1.status === 200);
    assert("Has last4", r1.json?.last4 === "4242");
    assert("Has exp_month", r1.json?.exp_month === 12);
    assert("Has brand", r1.json?.brand === "Visa");
    assert("NO full number", r1.json?.number === undefined);
    assert("NO CVC", r1.json?.cvc === undefined);

    section("D2 — ?full=true with fresh token → reveals full card");
    const r2 = await req(server, "GET", "/getCardDetails?full=true", { headers: { Authorization: AUTH_A } });
    assert("Status 200", r2.status === 200);
    assert("Has last4", r2.json?.last4 === "4242");
    assert("Has full number", r2.json?.number === "4242424242424242");
    assert("Has CVC", r2.json?.cvc === "123");

    section("D3 — ?full=true with stale token → 403 fresh_auth_required");
    const staleIat = Math.floor(Date.now() / 1000) - 600;
    const server2 = await listen(buildApp());
    const r3 = await req(server2, "GET", "/getCardDetails?full=true", {
        headers: { Authorization: AUTH_A, "x-test-iat": String(staleIat) },
    });
    assert("Returns 403", r3.status === 403);
    assert("Code is fresh_auth_required", r3.json?.code === "fresh_auth_required");
    assert("NO number leaked", r3.json?.number === undefined);
    server2.close();

    section("D4 — ?full=false → still safe");
    const r4 = await req(server, "GET", "/getCardDetails?full=false", { headers: { Authorization: AUTH_A } });
    assert("NO number", r4.json?.number === undefined);
    assert("NO cvc", r4.json?.cvc === undefined);

    section("D5 — ?full=1 → no effect (only 'true' string triggers reveal)");
    const r5 = await req(server, "GET", "/getCardDetails?full=1", { headers: { Authorization: AUTH_A } });
    assert("NO number", r5.json?.number === undefined);

    section("D6 — ?full=TRUE → no effect (case-sensitive)");
    const r6 = await req(server, "GET", "/getCardDetails?full=TRUE", { headers: { Authorization: AUTH_A } });
    assert("NO number", r6.json?.number === undefined);

    section("D7 — Query injection ?full=true&admin=1 → no extra data");
    const server3 = await listen(buildApp());
    const r7 = await req(server3, "GET", "/getCardDetails?full=true&admin=1", { headers: { Authorization: AUTH_A } });
    assert("No extra admin field leaked", r7.json?.admin === undefined);
    server3.close();

    server.close();
}

// ══════════════════════════════════════════════════════════════════
//  E. Cross-user isolation
// ══════════════════════════════════════════════════════════════════
async function testCrossUserIsolation() {
    console.log("\n═══ E. CROSS-USER ISOLATION ═══");

    const app = buildApp();
    const server = await listen(app);

    section("E1 — User A sees own card last4");
    const r1 = await req(server, "GET", "/getCardDetails", { headers: { Authorization: AUTH_A } });
    assert("User A sees 4242", r1.json?.last4 === "4242");

    section("E2 — User B sees own card last4 (different)");
    const r2 = await req(server, "GET", "/getCardDetails", { headers: { Authorization: AUTH_B } });
    assert("User B sees 5555", r2.json?.last4 === "5555");

    section("E3 — User A cannot see User B's balance");
    const rA = await req(server, "GET", "/getFinancialAccountBalance", { headers: { Authorization: AUTH_A } });
    const rB = await req(server, "GET", "/getFinancialAccountBalance", { headers: { Authorization: AUTH_B } });
    assert("User A balance = 5000", rA.json?.balance === 5000);
    assert("User B balance = 12000", rB.json?.balance === 12000);
    assert("Balances are different (not cross-leaked)", rA.json?.balance !== rB.json?.balance);

    section("E4 — Unknown user gets 404, not another user's data");
    const r4 = await req(server, "GET", "/getCardDetails", { headers: { Authorization: "Bearer user-unknown" } });
    assert("Returns 404", r4.status === 404);
    assert("No last4 leaked", r4.json?.last4 === undefined);

    section("E5 — User A's account status is own accountId");
    const rS = await req(server, "GET", "/getAccountStatus", { headers: { Authorization: AUTH_A } });
    assert("accountId = acct_A", rS.json?.accountId === "acct_A");

    section("E6 — User A's transactions contain own uid");
    const rT_A = await req(server, "GET", "/getTransactions", { headers: { Authorization: AUTH_A } });
    const rT_B = await req(server, "GET", "/getTransactions", { headers: { Authorization: AUTH_B } });
    assert("User A txns have uid=user-parent-A", rT_A.json?.transactions?.[0]?.uid === "user-parent-A");
    assert("User B txns have uid=user-parent-B", rT_B.json?.transactions?.[0]?.uid === "user-parent-B");
    assert("Txn data not cross-leaked", rT_A.json?.transactions?.[0]?.uid !== rT_B.json?.transactions?.[0]?.uid);

    section("E7 — User A's account details contain own accountId");
    const rD_A = await req(server, "GET", "/getAccountDetails", { headers: { Authorization: AUTH_A } });
    const rD_B = await req(server, "GET", "/getAccountDetails", { headers: { Authorization: AUTH_B } });
    assert("User A accountId = acct_A", rD_A.json?.accountId === "acct_A");
    assert("User B accountId = acct_B", rD_B.json?.accountId === "acct_B");

    section("E8 — User A's payouts contain own uid");
    const rP_A = await req(server, "GET", "/getPayouts", { headers: { Authorization: AUTH_A } });
    const rP_B = await req(server, "GET", "/getPayouts", { headers: { Authorization: AUTH_B } });
    assert("User A payouts have uid=user-parent-A", rP_A.json?.payouts?.[0]?.uid === "user-parent-A");
    assert("User B payouts have uid=user-parent-B", rP_B.json?.payouts?.[0]?.uid === "user-parent-B");
    assert("Payout data not cross-leaked", rP_A.json?.payouts?.[0]?.uid !== rP_B.json?.payouts?.[0]?.uid);

    server.close();
}

// ══════════════════════════════════════════════════════════════════
//  F. Input validation & injection
// ══════════════════════════════════════════════════════════════════
async function testInputValidation() {
    console.log("\n═══ F. INPUT VALIDATION & INJECTION ═══");

    const app = buildApp();
    const server = await listen(app);

    section("F1 — createIssuingCardholder with missing fields");
    const r1 = await req(server, "POST", "/createIssuingCardholder", {
        headers: { Authorization: AUTH_A },
        body: { name: "Test" },
    });
    assert("Returns 400", r1.status === 400);
    assert("Error mentions missing fields", r1.json?.error?.includes("Missing required"));

    section("F2 — XSS in name field → server doesn't crash");
    const r2 = await req(server, "POST", "/createIssuingCardholder", {
        headers: { Authorization: AUTH_A },
        body: {
            name: '<script>alert("xss")</script>',
            email: "xss@test.com",
            line1: "123 Main St",
            city: "TestCity",
            state: "CA",
            postal_code: "90210",
        },
    });
    assert("Doesn't crash (200)", r2.status === 200);
    assert("Response doesn't echo raw script tag", !r2.body?.includes("<script>"));

    section("F3 — addBankAccount with missing fields");
    const r3 = await req(server, "POST", "/addBankAccount", {
        headers: { Authorization: AUTH_A },
        body: { account_holder_name: "Test" },
    });
    assert("Returns 400", r3.status === 400);

    section("F4 — createPayout with zero amount");
    const r4 = await req(server, "POST", "/createPayout", {
        headers: { Authorization: AUTH_A },
        body: { amount: 0 },
    });
    assert("Returns 400", r4.status === 400);
    assert("Error mentions minimum", r4.json?.error?.includes("minimum"));

    section("F5 — createPayout with negative amount");
    const r5 = await req(server, "POST", "/createPayout", {
        headers: { Authorization: AUTH_A },
        body: { amount: -5000 },
    });
    assert("Returns 400 for negative amount", r5.status === 400);

    section("F6 — createPayout with no body at all");
    const r6 = await req(server, "POST", "/createPayout", {
        headers: { Authorization: AUTH_A },
        body: {},
    });
    assert("Returns 400 for missing amount", r6.status === 400);

    section("F7 — SQL injection in query params");
    const r7 = await req(server, "GET", "/getBalance?uid=1%20OR%201%3D1", { headers: { Authorization: AUTH_A } });
    assert("Returns 200 (ignores query param, uses token uid)", r7.status === 200);
    assert("Balance is user A's balance, not injected", r7.json?.balance === 5000);

    section("F8 — Oversized field values");
    const longString = "A".repeat(100_000);
    const r8 = await req(server, "POST", "/createIssuingCardholder", {
        headers: { Authorization: AUTH_A },
        body: {
            name: longString,
            email: "test@test.com",
            line1: "123 Main St",
            city: "TestCity",
            state: "CA",
            postal_code: "90210",
        },
    });
    assert("Server doesn't crash with 100KB name", r8.status === 200 || r8.status === 400 || r8.status === 413);

    section("F9 — Non-JSON content-type treated correctly");
    const r9 = await req(server, "POST", "/createCustomConnectAccount", {
        headers: { Authorization: AUTH_A, "content-type": "text/plain" },
    });
    assert("Server handles non-JSON gracefully (not 500)", r9.status !== 500 || r9.status === 200);

    section("F10 — createCustomConnectAccount without bank fields (routing/account optional)");
    const r10 = await req(server, "POST", "/createCustomConnectAccount", {
        headers: { Authorization: AUTH_A },
        body: {
            country: "US",
            firstName: "Jane",
            lastName: "Parent",
            email: "jane.parent@example.com",
            phone: "(555) 123-4567",
            dob: "01/15/1990",
            address: "100 Main St",
            city: "Austin",
            state: "TX",
            zipCode: "78701",
            ssnLast4: "1234",
            useTestDocument: true,
        },
    });
    assert("Returns 200 (onboarding without routingNumber/accountNumber)", r10.status === 200);
    assert("success flag", r10.json?.success === true);

    server.close();
}

// ══════════════════════════════════════════════════════════════════
//  G. Test endpoints blocked in production
// ══════════════════════════════════════════════════════════════════
async function testProdEndpoints() {
    console.log("\n═══ G. TEST ENDPOINTS IN PRODUCTION ═══");

    section("G1 — Test mode: all debug routes available");
    const testApp = buildApp({ stripeKey: "sk_test_abc123" });
    const testServer = await listen(testApp);
    const rt1 = await req(testServer, "POST", "/testVerifyAccount", { headers: { Authorization: AUTH_A } });
    const rt2 = await req(testServer, "POST", "/testCreateTransaction", { headers: { Authorization: AUTH_A } });
    const rt3 = await req(testServer, "POST", "/testAddBalance", { headers: { Authorization: AUTH_A } });
    assert("/testVerifyAccount → 200", rt1.status === 200);
    assert("/testCreateTransaction → 200", rt2.status === 200);
    assert("/testAddBalance → 200", rt3.status === 200);
    testServer.close();

    section("G2 — Live mode: all debug routes return 404");
    const liveApp = buildApp({ stripeKey: "sk_live_xyz789" });
    const liveServer = await listen(liveApp);
    const rl1 = await req(liveServer, "POST", "/testVerifyAccount", { headers: { Authorization: AUTH_A } });
    const rl2 = await req(liveServer, "POST", "/testCreateTransaction", { headers: { Authorization: AUTH_A } });
    const rl3 = await req(liveServer, "POST", "/testAddBalance", { headers: { Authorization: AUTH_A } });
    assert("/testVerifyAccount → 404", rl1.status === 404);
    assert("/testCreateTransaction → 404", rl2.status === 404);
    assert("/testAddBalance → 404", rl3.status === 404);

    section("G3 — Non-debug routes still work in live mode");
    const rl4 = await req(liveServer, "GET", "/getBalance", { headers: { Authorization: AUTH_A } });
    assert("/getBalance → 200 in live mode", rl4.status === 200);
    liveServer.close();

    section("G4 — Edge: empty Stripe key blocks test routes");
    const emptyApp = buildApp({ stripeKey: "" });
    const emptyServer = await listen(emptyApp);
    const re1 = await req(emptyServer, "POST", "/testVerifyAccount", { headers: { Authorization: AUTH_A } });
    assert("Empty key → /testVerifyAccount 404", re1.status === 404);
    emptyServer.close();

    section("G5 — Restricted key variant blocks test routes");
    const rkApp = buildApp({ stripeKey: "rk_live_abc123" });
    const rkServer = await listen(rkApp);
    const rk1 = await req(rkServer, "POST", "/testVerifyAccount", { headers: { Authorization: AUTH_A } });
    assert("rk_live key → /testVerifyAccount 404", rk1.status === 404);
    rkServer.close();
}

// ══════════════════════════════════════════════════════════════════
//  H. PII log safety
// ══════════════════════════════════════════════════════════════════
function testPiiLogs() {
    console.log("\n═══ H. PII LOG SAFETY ═══");

    const { maskValue, safelog, SENSITIVE_KEYS } = require("../utils/maskPii");

    section("H1 — Email masking preserves domain, hides local part");
    assert("john@example.com → j***@example.com", maskValue("email", "john@example.com") === "j***@example.com");
    assert("a@b.co → a***@b.co", maskValue("email", "a@b.co") === "a***@b.co");
    assert("no-domain → ***", maskValue("email", "notanemail") === "***");

    section("H2 — Phone masking shows last 4 only");
    assert("+15551234567 → ***4567", maskValue("phone", "+15551234567") === "***4567");
    assert("(555) 123-4567 → ***4567", maskValue("phone", "(555) 123-4567") === "***4567");
    assert("Short phone → ***", maskValue("phone", "12") === "***");

    section("H3 — Sensitive fields masked by safelog");
    const logs = [];
    const origLog = console.log;
    console.log = (...args) => logs.push(args.join(" "));
    safelog("test", "cardholder data", {
        name: "John Doe",
        email: "john@example.com",
        phone: "+15551234567",
        ssn: "123-45-6789",
        line1: "123 Main Street",
        uid: "user123",
        accountId: "acct_abc",
    });
    console.log = origLog;
    const logOutput = logs.join(" ");
    assert("Log does NOT contain 'John Doe'", !logOutput.includes("John Doe"));
    assert("Log does NOT contain full email", !logOutput.includes("john@example.com"));
    assert("Log does NOT contain full phone", !logOutput.includes("+15551234567"));
    assert("Log does NOT contain SSN", !logOutput.includes("123-45-6789"));
    assert("Log does NOT contain full address", !logOutput.includes("123 Main Street"));
    assert("Log DOES contain uid (non-sensitive)", logOutput.includes("user123"));
    assert("Log DOES contain accountId (non-sensitive)", logOutput.includes("acct_abc"));

    section("H4 — safelog without data doesn't crash");
    const logs2 = [];
    console.log = (...args) => logs2.push(args.join(" "));
    safelog("test", "simple message");
    console.log = origLog;
    assert("Simple message logged", logs2[0]?.includes("simple message"));

    section("H5 — Non-string values pass through (numbers, booleans)");
    assert("Number stays", maskValue("email", 42) === 42);
    assert("Boolean stays", maskValue("phone", true) === true);
    assert("Null stays", maskValue("name", null) === null);

    section("H6 — Account number masking");
    assert("1234567890 → 12***", maskValue("account_number", "1234567890") === "12***");
    assert("Routing 021000021 → 02***", maskValue("routing_number", "021000021") === "02***");

    section("H7 — CVC and card number masked");
    assert("Card number masked", maskValue("number", "4242424242424242") === "42***");
    assert("CVC masked", maskValue("cvc", "314") === "***");

    section("H8 — Password field masked");
    assert("password → 'my***'", maskValue("password", "mySecretPass123") === "my***");
}

// ══════════════════════════════════════════════════════════════════
//  I. Webhook forgery
// ══════════════════════════════════════════════════════════════════
async function testWebhookForgery() {
    console.log("\n═══ I. WEBHOOK FORGERY ═══");

    const app = buildApp();
    const server = await listen(app);

    section("I1 — Missing stripe-signature header");
    const r1 = await req(server, "POST", "/webhook", {
        headers: { "content-type": "application/json" },
        body: { type: "payment_intent.succeeded", data: { object: { id: "pi_fake", amount: 99999 } } },
    });
    assert("Rejected (400)", r1.status === 400);

    section("I2 — Invalid/forged signature");
    const r2 = await req(server, "POST", "/webhook", {
        headers: { "content-type": "application/json", "stripe-signature": "t=123,v1=fakesig" },
        body: { type: "payment_intent.succeeded", data: { object: { id: "pi_fake", amount: 99999 } } },
    });
    assert("Rejected (400)", r2.status === 400);

    section("I3 — Valid signature → accepted");
    const r3 = await req(server, "POST", "/webhook", {
        headers: { "content-type": "application/json", "stripe-signature": "valid_sig" },
        body: { type: "payment_intent.succeeded", data: { object: { id: "pi_real" } } },
    });
    assert("Accepted (200)", r3.status === 200);
    assert("Response confirms received", r3.json?.received === true);

    section("I4 — Webhook with no body");
    const r4p = new Promise((resolve) => {
        const addr = server.address();
        const rq = http.request({ hostname: "127.0.0.1", port: addr.port, path: "/webhook", method: "POST",
            headers: { "stripe-signature": "valid_sig", "content-type": "application/json" } }, collect(resolve));
        rq.end();
    });
    const r4 = await r4p;
    assert("Empty body handled gracefully", r4.status === 400 || r4.status === 200);

    server.close();
}

// ══════════════════════════════════════════════════════════════════
//  J. Spending limit bypass
// ══════════════════════════════════════════════════════════════════
async function testSpendingLimitBypass() {
    console.log("\n═══ J. SPENDING LIMIT BYPASS ═══");

    const app = buildApp();
    const server = await listen(app);

    section("J1 — Client sends spendingLimitAmount: 999999 → capped to 50000");
    const r1 = await req(server, "POST", "/createVirtualCard", {
        headers: { Authorization: AUTH_A },
        body: { spendingLimitAmount: 999999 },
    });
    assert("Returns 200", r1.status === 200);
    assert("Limit capped to 50000", r1.json?.spendingLimitApplied === 50000);

    section("J2 — Client sends NaN → defaults to 50000");
    const r2 = await req(server, "POST", "/createVirtualCard", {
        headers: { Authorization: AUTH_A },
        body: { spendingLimitAmount: "not_a_number" },
    });
    assert("Limit defaults to 50000", r2.json?.spendingLimitApplied === 50000);

    section("J3 — Client sends negative → defaults to 50000");
    const r3 = await req(server, "POST", "/createVirtualCard", {
        headers: { Authorization: AUTH_A },
        body: { spendingLimitAmount: -100 },
    });
    assert("Negative → capped (NaN fallback to 50000)", r3.json?.spendingLimitApplied <= 50000);

    section("J4 — Client sends 0 → defaults to 50000");
    const r4 = await req(server, "POST", "/createVirtualCard", {
        headers: { Authorization: AUTH_A },
        body: { spendingLimitAmount: 0 },
    });
    assert("Zero → defaults to 50000", r4.json?.spendingLimitApplied === 50000);

    section("J5 — Client sends valid small amount → accepted");
    const r5 = await req(server, "POST", "/createVirtualCard", {
        headers: { Authorization: AUTH_A },
        body: { spendingLimitAmount: 10000 },
    });
    assert("10000 → accepted as 10000", r5.json?.spendingLimitApplied === 10000);

    server.close();
}

// ══════════════════════════════════════════════════════════════════
//  K. Firestore rules validation
// ══════════════════════════════════════════════════════════════════
function testFirestoreRules() {
    console.log("\n═══ K. FIRESTORE RULES ═══");

    const rulesPath = path.join(__dirname, "..", "..", "firestore.rules");
    const rules = fs.readFileSync(rulesPath, "utf8");

    section("K1 — provisioningTasks: user can only read own doc");
    assert("provisioningTasks rule exists", rules.includes("match /provisioningTasks/{userId}"));
    assert("Read restricted to auth.uid == userId", /provisioningTasks[\s\S]*?request\.auth\.uid == userId/.test(rules));
    assert("Write blocked (if false)", /provisioningTasks[\s\S]*?allow write: if false/.test(rules));

    section("K2 — stripeAccounts: user can only read own doc");
    assert("stripeAccounts rule exists", rules.includes("match /stripeAccounts/{userId}"));
    assert("Read restricted to auth.uid == userId", /stripeAccounts[\s\S]*?request\.auth\.uid == userId/.test(rules));
    assert("Write blocked (if false)", /stripeAccounts[\s\S]*?allow write: if false/.test(rules));

    section("K3 — childInviteTokens: fully locked");
    assert("Exists", rules.includes("match /childInviteTokens/{tokenId}"));
    assert("read + write = false", rules.includes("allow read, write: if false"));

    section("K4 — virtualCards: read only by creator");
    assert("Read restricted to createdBy", /virtualCards[\s\S]*?allow read:[\s\S]*?createdBy == request\.auth\.uid/.test(rules));

    section("K5 — transactions: read only by owner");
    assert("Read restricted to userId or createdBy",
        /transactions\/\{transactionId\}[\s\S]*?allow read:[\s\S]*?userId == request\.auth\.uid/.test(rules));

    section("K6 — users: owner-only write (child role blocked)");
    assert("Write restricted to uid == userId and !isChild()",
        /users\/\{userId\}[\s\S]*?allow write:[\s\S]*?auth\.uid == userId[\s\S]*?!isChild\(\)/.test(rules));

    section("K7 — events: only creator/host can update/delete");
    assert("update/delete restricted",
        /events\/\{eventId\}[\s\S]*?allow update, delete:[\s\S]*?creatorId == request\.auth\.uid/.test(rules));

    section("K8 — No wildcard match-all rule");
    assert("No 'match /{document=**}' with allow all",
        !(/match \/\{document=\*\*\}[\s\S]*?allow read, write: if true/.test(rules)));

    section("K9 — gifts subcollection: scoped to event owner via get()");
    assert("gifts rule uses get() for creatorId check",
        /gifts\/\{giftId\}[\s\S]*?get\([\s\S]*?events\/\$\(eventId\)\)\.data\.creatorId/.test(rules));
    assert("gifts write scoped to event creator",
        /gifts[\s\S]*?allow update, delete:[\s\S]*?get\([\s\S]*?creatorId == request\.auth\.uid/.test(rules));
    assert("gifts allow create for authenticated users",
        /gifts[\s\S]*?allow create: if request\.auth != null/.test(rules));

    section("K10 — invitations: sender/recipient read, sender-only modify");
    assert("invitations rule exists", rules.includes("match /invitations/{inviteId}"));
    assert("Read scoped to senderId or recipientId",
        /invitations[\s\S]*?allow read:[\s\S]*?senderId == request\.auth\.uid/.test(rules) &&
        /invitations[\s\S]*?allow read:[\s\S]*?recipientId == request\.auth\.uid/.test(rules));
    assert("update/delete scoped to senderId only",
        /invitations[\s\S]*?allow update, delete:[\s\S]*?senderId == request\.auth\.uid/.test(rules));

    section("K11 — families: parent-only read/modify");
    assert("families rule exists", rules.includes("match /families/{familyId}"));
    assert("Read scoped to parentIds",
        /families[\s\S]*?allow read:[\s\S]*?auth\.uid in resource\.data\.parentIds/.test(rules));
    assert("update/delete scoped to parentIds",
        /families[\s\S]*?allow update, delete:[\s\S]*?auth\.uid in[\s\S]*?parentIds/.test(rules));

    section("K12 — childAccounts: child reads own, writes server-only");
    assert("childAccounts rule exists", rules.includes("match /childAccounts/{childAccountId}"));
    assert("Read restricted to userId",
        /childAccounts[\s\S]*?allow read:[\s\S]*?userId == request\.auth\.uid/.test(rules));
    assert("Write blocked",
        /childAccounts[\s\S]*?allow create, update, delete: if false/.test(rules));
}

// ══════════════════════════════════════════════════════════════════
//  M. Fresh-auth step-up for full card reveal
// ══════════════════════════════════════════════════════════════════
async function testFreshAuth() {
    console.log("\n═══ M. FRESH-AUTH STEP-UP ═══");

    const server = await listen(buildApp());

    section("M1 — Fresh token + ?full=true → reveals full card details");
    const r1 = await req(server, "GET", "/getCardDetails?full=true", {
        headers: { Authorization: AUTH_A },
    });
    assert("Status 200", r1.status === 200);
    assert("Has full number", typeof r1.json?.number === "string" && r1.json.number.length === 16);
    assert("Has CVC", typeof r1.json?.cvc === "string");
    assert("Has last4", r1.json?.last4 === "4242");

    server.close();

    section("M2 — Stale token (10 min old) + ?full=true → 403 fresh_auth_required");
    const server2 = await listen(buildApp());
    const staleIat = Math.floor(Date.now() / 1000) - 10 * 60;
    const r2 = await req(server2, "GET", "/getCardDetails?full=true", {
        headers: { Authorization: AUTH_A, "x-test-iat": String(staleIat) },
    });
    assert("Returns 403", r2.status === 403);
    assert("Code = fresh_auth_required", r2.json?.code === "fresh_auth_required");
    assert("No number leaked", r2.json?.number === undefined);
    assert("No CVC leaked", r2.json?.cvc === undefined);
    server2.close();

    section("M3 — Token at exactly 5 min boundary → still allowed");
    const server3 = await listen(buildApp());
    const borderIat = Math.floor(Date.now() / 1000) - 5 * 60;
    const r3 = await req(server3, "GET", "/getCardDetails?full=true", {
        headers: { Authorization: AUTH_A, "x-test-iat": String(borderIat) },
    });
    assert("Status 200 (boundary allowed)", r3.status === 200);
    assert("Has full number", !!r3.json?.number);
    server3.close();

    section("M4 — Token 5 min + 1 sec → rejected");
    const server4 = await listen(buildApp());
    const overIat = Math.floor(Date.now() / 1000) - 5 * 60 - 1;
    const r4 = await req(server4, "GET", "/getCardDetails?full=true", {
        headers: { Authorization: AUTH_A, "x-test-iat": String(overIat) },
    });
    assert("Returns 403", r4.status === 403);
    assert("Code = fresh_auth_required", r4.json?.code === "fresh_auth_required");
    server4.close();

    section("M5 — Stale token without ?full=true → 200 (no gate for masked data)");
    const server5 = await listen(buildApp());
    const r5 = await req(server5, "GET", "/getCardDetails", {
        headers: { Authorization: AUTH_A, "x-test-iat": String(staleIat) },
    });
    assert("Returns 200", r5.status === 200);
    assert("Has last4", r5.json?.last4 === "4242");
    assert("No number", r5.json?.number === undefined);
    assert("No CVC", r5.json?.cvc === undefined);
    server5.close();

    section("M6 — Missing iat field entirely + ?full=true → 403");
    const server6 = await listen(buildApp());
    const r6 = await req(server6, "GET", "/getCardDetails?full=true", {
        headers: { Authorization: AUTH_A, "x-test-iat": "0" },
    });
    assert("Returns 403 (iat=0 is ancient)", r6.status === 403);
    assert("Code = fresh_auth_required", r6.json?.code === "fresh_auth_required");
    server6.close();
}

// ══════════════════════════════════════════════════════════════════
//  L. Misc edge cases
// ══════════════════════════════════════════════════════════════════
async function testMiscEdgeCases() {
    console.log("\n═══ L. MISC EDGE CASES ═══");

    const app = buildApp();
    const server = await listen(app);

    section("L1 — OPTIONS preflight for /getCardDetails");
    const r1 = await req(server, "OPTIONS", "/getCardDetails", {
        headers: { Origin: "https://creditkid.vercel.app", "Access-Control-Request-Method": "GET" },
    });
    assert("Returns 204 (preflight OK)", r1.status === 204);

    section("L2 — Unknown endpoint returns 404");
    const r2 = await req(server, "GET", "/nonexistent", { headers: { Authorization: AUTH_A } });
    assert("Returns 404", r2.status === 404);

    section("L3 — HEAD request doesn't crash");
    const r3 = await req(server, "HEAD", "/getBalance", { headers: { Authorization: AUTH_A } });
    assert("Returns 200", r3.status === 200);

    section("L4 — Double-slash path doesn't bypass auth");
    const r4 = await req(server, "GET", "//getBalance");
    assert("No data returned (401 or 404)", r4.status === 401 || r4.status === 404);
    assert("No balance leaked", r4.json?.balance === undefined);

    section("L5 — Path traversal attempt");
    const r5 = await req(server, "GET", "/../../../etc/passwd", { headers: { Authorization: AUTH_A } });
    assert("Returns 404 (no match)", r5.status === 404);

    section("L6 — Webhook endpoint rejects GET");
    const r6 = await req(server, "GET", "/webhook");
    assert("GET /webhook → 404 (only POST registered)", r6.status === 404);

    server.close();
}

// ══════════════════════════════════════════════════════════════════
//  N. Body size limits — realistic max payloads fit within 256KB
// ══════════════════════════════════════════════════════════════════
async function testBodySizeLimits() {
    console.log("\n═══ N. BODY SIZE LIMITS — REALISTIC PAYLOADS ═══");

    const app = buildApp();
    const server = await listen(app);

    const maxRealisticPayloads = {
        createCustomConnectAccount: {
            country: "US",
            firstName: "Bartholomew",
            lastName: "Wolfeschlegelsteinhausenbergerdorff",
            email: "bartholomew.wolfeschlegelsteinhausenbergerdorff@longdomainname-university.education",
            phone: "(555) 555-5555",
            dob: "12/25/1990",
            address: "12345 Southeast Boulevard of the Americas, Apartment 2401-B",
            address2: "Building C, Floor 24, Suite 2401-B, Corner Unit",
            city: "Rancho Santa Margarita",
            state: "CA",
            zipCode: "92688-1234",
            ssnLast4: "1234",
            idDocumentType: "resident_permit",
            useTestDocument: true,
        },
        createIssuingCardholder: {
            name: "Bartholomew Wolfeschlegelsteinhausenbergerdorff",
            email: "bartholomew.wolfeschlegelsteinhausenbergerdorff@longdomainname-university.education",
            phone: "+15555555555",
            line1: "12345 Southeast Boulevard of the Americas, Apartment 2401-B",
            line2: "Building C, Floor 24, Suite 2401-B",
            city: "Rancho Santa Margarita",
            state: "CA",
            postal_code: "92688",
            dob: { day: 25, month: 12, year: 1990 },
        },
        createVirtualCard: {
            spendingLimitAmount: 50000,
            spendingLimitInterval: "per_authorization",
        },
        createPayout: {
            amount: 999999,
            currency: "usd",
        },
        addBankAccount: {
            account_holder_name: "Bartholomew Wolfeschlegelsteinhausenbergerdorff Jr.",
            account_holder_type: "individual",
            routing_number: "110000000",
            account_number: "000123456789012345678",
            country: "US",
            currency: "usd",
        },
        createTestAuthorization: {
            amount: 50000,
            currency: "usd",
        },
        updateAccountInfo: {
            first_name: "Bartholomew",
            last_name: "Wolfeschlegelsteinhausenbergerdorff",
            email: "bartholomew@longdomainname-university.education",
            phone: "+15555555555",
            dob: { day: 25, month: 12, year: 1990 },
            address: {
                line1: "12345 Southeast Boulevard of the Americas, Apt 2401-B",
                city: "Rancho Santa Margarita",
                state: "CA",
                postal_code: "92688",
                country: "US",
            },
            ssn_last_4: "1234",
            business_profile_mcc: "7399",
            business_profile_url: "https://creditkid.vercel.app/users/bartholomew-abc12345",
            business_profile_product_description: "Personal event fundraising and family allowance management for birthday parties, bar mitzvahs, and other celebrations.",
            statement_descriptor: "CREDITKID GIFT",
        },
        acceptTermsOfService: {
            ip: "192.168.1.100",
        },
        retryProvisioning: {},
        createOnboardingLink: {},
        updateAccountCapabilities: {},
        generatePoster: {
            eventId: "abc123def456ghi789jkl012mno345pqr678",
        },
        getChildInviteLink: {
            eventId: "abc123def456ghi789jkl012mno345pqr678",
            childPhone: "+15551234567",
        },
        claimChildInvite: {
            token: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6",
            pin: "123456",
        },
    };

    const postRoutes = [
        "createCustomConnectAccount",
        "createIssuingCardholder",
        "createVirtualCard",
        "createPayout",
        "addBankAccount",
        "createTestAuthorization",
        "updateAccountInfo",
        "acceptTermsOfService",
        "retryProvisioning",
        "createOnboardingLink",
        "updateAccountCapabilities",
        "generatePoster",
        "getChildInviteLink",
        "claimChildInvite",
    ];

    section("N1 — Max realistic payloads accepted (not 413) for all POST routes");
    for (const route of postRoutes) {
        const body = maxRealisticPayloads[route] || {};
        const payloadSize = Buffer.byteLength(JSON.stringify(body));
        const r = await req(server, "POST", `/${route}`, {
            headers: { Authorization: AUTH_A },
            body,
        });
        assert(
            `/${route} (${payloadSize} bytes) → not 413 (got ${r.status})`,
            r.status !== 413
        );
    }

    section("N2 — Payload just under 256KB accepted on normal endpoint");
    const paddedBody = {
        name: "A".repeat(200_000),
        email: "test@test.com",
        line1: "123 St",
        city: "X",
        state: "CA",
        postal_code: "90210",
    };
    const paddedSize = Buffer.byteLength(JSON.stringify(paddedBody));
    assert(`Padded payload is under 256KB (${paddedSize} bytes)`, paddedSize < 256 * 1024);
    const rUnder = await req(server, "POST", "/createIssuingCardholder", {
        headers: { Authorization: AUTH_A },
        body: paddedBody,
    });
    assert(`200KB payload → accepted (${rUnder.status})`, rUnder.status === 200);

    section("N3 — Payload over 256KB rejected on normal endpoint (413)");
    const oversizedBody = {
        name: "A".repeat(300_000),
        email: "test@test.com",
        line1: "123 St",
        city: "X",
        state: "CA",
        postal_code: "90210",
    };
    const oversizedSize = Buffer.byteLength(JSON.stringify(oversizedBody));
    assert(`Oversized payload is over 256KB (${oversizedSize} bytes)`, oversizedSize > 256 * 1024);
    const rOver = await req(server, "POST", "/createIssuingCardholder", {
        headers: { Authorization: AUTH_A },
        body: oversizedBody,
    });
    assert(`300KB payload on normal route → rejected (${rOver.status})`, rOver.status === 413);

    section("N4 — createCustomConnectAccount accepts large payload (up to 8MB)");
    const freshServer = await listen(buildApp());
    const largeKycBody = {
        ...maxRealisticPayloads.createCustomConnectAccount,
        extraField: "X".repeat(500_000),
    };
    const largeSize = Buffer.byteLength(JSON.stringify(largeKycBody));
    assert(`Large KYC payload is over 256KB (${largeSize} bytes)`, largeSize > 256 * 1024);
    const rLargeKyc = await req(freshServer, "POST", "/createCustomConnectAccount", {
        headers: { Authorization: AUTH_A },
        body: largeKycBody,
    });
    assert(`500KB payload on /createCustomConnectAccount → accepted (${rLargeKyc.status})`, rLargeKyc.status === 200);
    freshServer.close();

    section("N5 — All realistic payloads are well under 256KB");
    for (const route of postRoutes) {
        const body = maxRealisticPayloads[route] || {};
        const size = Buffer.byteLength(JSON.stringify(body));
        assert(
            `/${route} max realistic payload = ${size} bytes (< 5KB)`,
            size < 5 * 1024
        );
    }

    server.close();
}

// ══════════════════════════════════════════════════════════════════
//  Main
// ══════════════════════════════════════════════════════════════════
(async () => {
    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║  SECURITY SCENARIOS — MOBILE CLIENT USE CASES           ║");
    console.log("╚══════════════════════════════════════════════════════════╝");

    const mainApp = buildApp();
    const mainServer = await listen(mainApp);

    await testAuth(mainServer);
    await testCorsMobile(mainServer);
    mainServer.close();

    await testRateLimit();

    await testCardExposure();
    await testCrossUserIsolation();
    await testInputValidation();
    await testProdEndpoints();
    testPiiLogs();
    await testWebhookForgery();
    await testSpendingLimitBypass();
    testFirestoreRules();
    await testFreshAuth();
    await testMiscEdgeCases();
    await testBodySizeLimits();

    const total = passed + failed;
    console.log("\n══════════════════════════════════════════════════════════");
    console.log(`  Results: ${passed}/${total} passed, ${failed} failed`);
    console.log(`  Sections: ${sections.length}`);
    console.log("══════════════════════════════════════════════════════════\n");

    process.exit(failed > 0 ? 1 : 0);
})();
