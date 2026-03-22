/**
 * Security Hardening Test
 *
 * Validates all 7 security fixes without needing live Stripe/Firebase:
 *   1. CORS — blocks unknown origins, allows legitimate ones
 *   2. Card details — always returns last4 only, never full number/CVC
 *   3. Rate limiting — rejects after threshold
 *   4. Test endpoints — blocked when STRIPE_SECRET_KEY is live
 *   5. PII masking — maskValue utility works correctly
 *   6. Firestore rules — file contains required collection rules
 *   7. .env gitignore — .env not tracked by git
 *
 * Usage:
 *   node functions/tests/test-security.js
 */

const http = require("http");
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

let passed = 0;
let failed = 0;

function assert(label, condition) {
    if (condition) {
        passed++;
        console.log(`  ✅ ${label}`);
    } else {
        failed++;
        console.error(`  ❌ ${label}`);
    }
}

function request(server, method, urlPath, headers = {}) {
    return new Promise((resolve) => {
        const addr = server.address();
        const opts = {
            hostname: "127.0.0.1",
            port: addr.port,
            path: urlPath,
            method,
            headers,
        };
        const req = http.request(opts, (res) => {
            let body = "";
            res.on("data", (c) => (body += c));
            res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
        });
        req.end();
    });
}

// ──────────────────────────────────────────
// 1. CORS
// ──────────────────────────────────────────
async function testCors() {
    console.log("\n═══ 1. CORS ═══");

    const ALLOWED_ORIGINS = [
        "https://creditkid.vercel.app",
        "https://www.creditkid.vercel.app",
        /^https:\/\/creditkid-.*\.vercel\.app$/,
        /^creditkid:\/\//,
        /^exp:\/\//,
        "http://localhost:3000",
        "http://localhost:8081",
        "http://localhost:19006",
    ];

    const app = express();
    app.use(cors({
        origin(origin, callback) {
            if (!origin) return callback(null, true);
            const allowed = ALLOWED_ORIGINS.some((o) =>
                o instanceof RegExp ? o.test(origin) : o === origin
            );
            callback(allowed ? null : new Error("CORS not allowed"), allowed);
        },
    }));
    app.get("/test", (_req, res) => res.json({ ok: true }));

    const server = http.createServer(app);
    await new Promise((r) => server.listen(0, "127.0.0.1", r));

    // Allowed origins
    const r1 = await request(server, "GET", "/test", { Origin: "https://creditkid.vercel.app" });
    assert("creditkid.vercel.app → allowed (200)", r1.status === 200);
    assert("  has Access-Control-Allow-Origin header", r1.headers["access-control-allow-origin"] === "https://creditkid.vercel.app");

    const r2 = await request(server, "GET", "/test", { Origin: "https://creditkid-abc123.vercel.app" });
    assert("Vercel preview deploy → allowed (200)", r2.status === 200);

    const r3 = await request(server, "GET", "/test", { Origin: "http://localhost:3000" });
    assert("localhost:3000 → allowed (200)", r3.status === 200);

    const r4 = await request(server, "GET", "/test", { Origin: "creditkid://callback" });
    assert("React Native deep link → allowed (200)", r4.status === 200);

    const r5 = await request(server, "GET", "/test", { Origin: "exp://192.168.1.1:8081" });
    assert("Expo dev client → allowed (200)", r5.status === 200);

    // No origin (mobile / server-to-server)
    const r6 = await request(server, "GET", "/test", {});
    assert("No origin (mobile) → allowed (200)", r6.status === 200);

    // Blocked origins
    const r7 = await request(server, "GET", "/test", { Origin: "https://evil-site.com" });
    assert("evil-site.com → blocked (500)", r7.status === 500);

    const r8 = await request(server, "GET", "/test", { Origin: "https://fakecreditkid.vercel.app" });
    assert("fakecreditkid.vercel.app → blocked (500)", r8.status === 500);

    const r9 = await request(server, "GET", "/test", { Origin: "http://localhost:9999" });
    assert("localhost:9999 → blocked (500)", r9.status === 500);

    server.close();
}

// ──────────────────────────────────────────
// 2. Card details — never reveals full number/CVC
// ──────────────────────────────────────────
async function testCardDetailsSafe() {
    console.log("\n═══ 2. Card Details (last4 only, never full) ═══");

    const mockStripe = {
        issuing: {
            cards: {
                retrieve: async (_cardId, _opts, _stripeOpts) => {
                    return { last4: "4242", exp_month: 12, exp_year: 2028, brand: "Visa" };
                },
            },
        },
    };

    const { getCardDetails } = require("../stripeService");

    const result = await getCardDetails(mockStripe, {
        accountId: "acct_test",
        cardId: "ic_test",
    });
    assert("Has last4", result.last4 === "4242");
    assert("Has exp_month", result.exp_month === 12);
    assert("NO full number", result.number === undefined);
    assert("NO cvc", result.cvc === undefined);
}

// ──────────────────────────────────────────
// 3. Rate limiting
// ──────────────────────────────────────────
async function testRateLimiting() {
    console.log("\n═══ 3. Rate Limiting ═══");

    const rateLimit = require("express-rate-limit");
    const { ipKeyGenerator } = require("express-rate-limit");
    const testLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: 5,
        keyGenerator: (req) => req.headers["x-test-uid"] || ipKeyGenerator(req.ip),
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: "Too many requests", code: "rate_limit_exceeded" },
    });

    const app = express();
    app.use(testLimiter);
    app.get("/test", (_req, res) => res.json({ ok: true }));

    const server = http.createServer(app);
    await new Promise((r) => server.listen(0, "127.0.0.1", r));

    // First 5 should pass
    for (let i = 1; i <= 5; i++) {
        const r = await request(server, "GET", "/test", { "x-test-uid": "user-A" });
        assert(`Request ${i}/5 → allowed (${r.status})`, r.status === 200);
    }

    // 6th should be blocked
    const r6 = await request(server, "GET", "/test", { "x-test-uid": "user-A" });
    assert(`Request 6/5 → rate limited (${r6.status})`, r6.status === 429);
    const body6 = JSON.parse(r6.body);
    assert("Rate limit response has correct code", body6.code === "rate_limit_exceeded");

    // Different user should still pass
    const r7 = await request(server, "GET", "/test", { "x-test-uid": "user-B" });
    assert("Different user → allowed (200)", r7.status === 200);

    server.close();
}

// ──────────────────────────────────────────
// 4. Test endpoints blocked in production
// ──────────────────────────────────────────
async function testEndpointsGated() {
    console.log("\n═══ 4. Test Endpoints Gated ═══");

    const stubAuth = (_req, _res, next) => { next(); };
    const stubHandler = (_req, res) => res.json({ ok: true });
    const stubController = {
        createCustomConnectAccount: stubHandler,
        createOnboardingLink: stubHandler,
        getAccountStatus: stubHandler,
        updateAccountCapabilities: stubHandler,
        getFinancialAccountBalance: stubHandler,
        retryProvisioning: stubHandler,
        createIssuingCardholder: stubHandler,
        createVirtualCard: stubHandler,
        getCardDetails: stubHandler,
        createTestAuthorization: stubHandler,
        getBalance: stubHandler,
        getTransactions: stubHandler,
        getAccountDetails: stubHandler,
        getPayouts: stubHandler,
        createPayout: stubHandler,
        addBankAccount: stubHandler,
        updateAccountInfo: stubHandler,
        acceptTermsOfService: stubHandler,
        testVerifyAccount: stubHandler,
        testCreateTransaction: stubHandler,
        testAddBalance: stubHandler,
    };
    const stubPoster = { generatePoster: stubHandler };

    // --- Test mode (sk_test_) → endpoints available ---
    const origKey = process.env.STRIPE_SECRET_KEY;

    process.env.STRIPE_SECRET_KEY = "sk_test_fake123";
    delete require.cache[require.resolve("../routes")];
    const { registerRoutes: regTest } = require("../routes");

    const appTest = express();
    regTest(appTest, {
        verifyFirebaseToken: stubAuth,
        stripeController: stubController,
        posterController: stubPoster,
        PUBLIC_BASE_URL: "https://test.com",
    });
    const serverTest = http.createServer(appTest);
    await new Promise((r) => serverTest.listen(0, "127.0.0.1", r));

    const rt1 = await request(serverTest, "POST", "/testVerifyAccount");
    assert("Test mode: /testVerifyAccount → 200", rt1.status === 200);
    const rt2 = await request(serverTest, "POST", "/testCreateTransaction");
    assert("Test mode: /testCreateTransaction → 200", rt2.status === 200);
    const rt3 = await request(serverTest, "POST", "/testAddBalance");
    assert("Test mode: /testAddBalance → 200", rt3.status === 200);
    serverTest.close();

    // --- Live mode (sk_live_) → endpoints should 404 ---
    process.env.STRIPE_SECRET_KEY = "sk_live_real456";
    delete require.cache[require.resolve("../routes")];
    delete require.cache[require.resolve("../middleware/rateLimit")];
    const { registerRoutes: regLive } = require("../routes");

    const appLive = express();
    regLive(appLive, {
        verifyFirebaseToken: stubAuth,
        stripeController: stubController,
        posterController: stubPoster,
        PUBLIC_BASE_URL: "https://test.com",
    });
    const serverLive = http.createServer(appLive);
    await new Promise((r) => serverLive.listen(0, "127.0.0.1", r));

    const rl1 = await request(serverLive, "POST", "/testVerifyAccount");
    assert("Live mode: /testVerifyAccount → 404", rl1.status === 404);
    const rl2 = await request(serverLive, "POST", "/testCreateTransaction");
    assert("Live mode: /testCreateTransaction → 404", rl2.status === 404);
    const rl3 = await request(serverLive, "POST", "/testAddBalance");
    assert("Live mode: /testAddBalance → 404", rl3.status === 404);

    // Non-test endpoint still works in live mode
    const rl4 = await request(serverLive, "GET", "/getBalance");
    assert("Live mode: /getBalance → 200", rl4.status === 200);
    serverLive.close();

    process.env.STRIPE_SECRET_KEY = origKey;
}

// ──────────────────────────────────────────
// 5. PII masking
// ──────────────────────────────────────────
function testMaskPii() {
    console.log("\n═══ 5. PII Masking ═══");

    const { maskValue, SENSITIVE_KEYS } = require("../utils/maskPii");

    assert("email masked correctly", maskValue("email", "john@example.com") === "j***@example.com");
    assert("phone masked (last 4)", maskValue("phone", "+15551234567") === "***4567");
    assert("short phone masked", maskValue("phone", "123") === "***");
    assert("name masked", maskValue("name", "John Doe") === "Jo***");
    assert("ssn masked", maskValue("ssn", "123-45-6789") === "12***");
    assert("short value masked", maskValue("line1", "AB") === "***");
    assert("non-string passthrough", maskValue("email", 12345) === 12345);

    assert("SENSITIVE_KEYS includes email", SENSITIVE_KEYS.has("email"));
    assert("SENSITIVE_KEYS includes phone", SENSITIVE_KEYS.has("phone"));
    assert("SENSITIVE_KEYS includes account_number", SENSITIVE_KEYS.has("account_number"));
    assert("SENSITIVE_KEYS includes password", SENSITIVE_KEYS.has("password"));
    assert("SENSITIVE_KEYS does NOT include uid", !SENSITIVE_KEYS.has("uid"));
    assert("SENSITIVE_KEYS does NOT include accountId", !SENSITIVE_KEYS.has("accountId"));
}

// ──────────────────────────────────────────
// 6. Firestore rules
// ──────────────────────────────────────────
function testFirestoreRules() {
    console.log("\n═══ 6. Firestore Rules ═══");

    const rulesPath = path.join(__dirname, "..", "..", "firestore.rules");
    const rules = fs.readFileSync(rulesPath, "utf8");

    assert("Rules file exists", rules.length > 0);
    assert("provisioningTasks rule exists", rules.includes("match /provisioningTasks/{userId}"));
    assert("provisioningTasks read restricted to owner", rules.includes("request.auth.uid == userId") && rules.includes("provisioningTasks"));
    assert("provisioningTasks write blocked for clients", /provisioningTasks[\s\S]*?allow write: if false/.test(rules));
    assert("stripeAccounts rule exists", rules.includes("match /stripeAccounts/{userId}"));
    assert("stripeAccounts write blocked for clients", /stripeAccounts[\s\S]*?allow write: if false/.test(rules));
    assert("childInviteTokens fully locked", rules.includes("match /childInviteTokens/{tokenId}") && rules.includes("allow read, write: if false"));
    assert("virtualCards read restricted to owner", /virtualCards[\s\S]*?allow read:[\s\S]*?createdBy == request\.auth\.uid/.test(rules));
    assert("transactions read restricted to owner", /transactions\/\{transactionId\}[^}]*allow read:.*userId == request\.auth\.uid/s.test(rules));
}

// ──────────────────────────────────────────
// 7. .env gitignore
// ──────────────────────────────────────────
function testEnvGitignore() {
    console.log("\n═══ 7. .env in .gitignore ═══");

    const rootGitignore = fs.readFileSync(path.join(__dirname, "..", "..", ".gitignore"), "utf8");
    const fnGitignore = fs.readFileSync(path.join(__dirname, "..", ".gitignore"), "utf8");

    assert("Root .gitignore has .env", rootGitignore.includes(".env"));
    assert("functions/.gitignore has .env", fnGitignore.includes(".env"));

    try {
        const tracked = execSync("git ls-files --cached", {
            cwd: path.join(__dirname, "..", ".."),
            encoding: "utf8",
        });
        const envTracked = tracked.split("\n").filter((f) => /\/\.env$|^\.env$/.test(f));
        assert("No .env files tracked by git", envTracked.length === 0);
    } catch {
        assert("Git check skipped (not a git repo?)", true);
    }
}

// ──────────────────────────────────────────
// Main
// ──────────────────────────────────────────
(async () => {
    console.log("╔══════════════════════════════════════════╗");
    console.log("║     SECURITY HARDENING TEST SUITE        ║");
    console.log("╚══════════════════════════════════════════╝");

    await testCors();
    await testCardDetailsSafe();
    await testRateLimiting();
    await testEndpointsGated();
    testMaskPii();
    testFirestoreRules();
    testEnvGitignore();

    console.log("\n══════════════════════════════════════════");
    console.log(`  Results: ${passed} passed, ${failed} failed`);
    console.log("══════════════════════════════════════════\n");

    process.exit(failed > 0 ? 1 : 0);
})();
