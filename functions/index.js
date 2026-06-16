const path = require("path");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

// Repo-root `.env` then `functions/.env` (same pattern as `functions/tests/*` scripts).
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({ path: path.join(__dirname, ".env"), override: true });

const { isSandbox, getBankingProvider } = require("./config/providerConfig");
const { getBankingProviderInstance } = require("./providers/bankingProviderFactory");
const { createBankingController } = require("./controllers/bankingController");
const { registerWebhookRoutes } = require("./controllers/webhookRouter");

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const stripeService = require("./stripeService");
const { createStripeConnectService } = require("./services/stripeConnectService");
const posterController = require("./controllers/posterController");
const { verifyFirebaseToken } = require("./middleware/auth");

const { createProvisioningService } = require("./services/provisioningService");
const provisioningService = createProvisioningService(stripe, stripeService);

const stripeConnectService = createStripeConnectService(stripe, stripeService, provisioningService);
const bankingProvider = getBankingProviderInstance({ stripeConnectService });
const bankingController = createBankingController(bankingProvider);

const ALLOWED_ORIGINS = [
    "https://credit-kid.com",
    "https://www.credit-kid.com",
    /^https:\/\/creditkid-.*\.vercel\.app$/,
    /^creditkid:\/\//,
    /^exp:\/\//,
];
if (process.env.NODE_ENV !== "production") {
    ALLOWED_ORIGINS.push("http://localhost:3000", "http://localhost:8081", "http://localhost:19006");
}
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

registerWebhookRoutes(app, {
    stripe,
    stripeConnectService,
    provisioningService,
    bankingProvider,
});

const { generalLimiter } = require("./middleware/rateLimit");
const { verifyAppCheck, warnAppCheck } = require("./middleware/appCheck");

function appCheckMiddlewareForKyc() {
    if (isSandbox()) return [];
    if (process.env.APPCHECK_RELAXED === "1") return [warnAppCheck];
    return [verifyAppCheck];
}

app.post(
    "/createCustomConnectAccount",
    express.json({ limit: "8mb" }),
    generalLimiter,
    ...appCheckMiddlewareForKyc(),
    verifyFirebaseToken,
    bankingController.createCustomConnectAccount
);

app.post(
    "/saveQuickPoster",
    express.json({ limit: "8mb" }),
    generalLimiter,
    ...appCheckMiddlewareForKyc(),
    verifyFirebaseToken,
    posterController.saveQuickPoster
);

app.use(express.json({ limit: "256kb" }));

const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || process.env.APP_BASE_URL || "https://credit-kid.com";

require("./routes").registerRoutes(app, {
    verifyFirebaseToken,
    bankingController,
    posterController,
    stripe,
    db,
    storage,
    admin,
    PUBLIC_BASE_URL,
    bankingProvider,
});

console.log(`[api] bankingProvider=${getBankingProvider()} sandbox=${isSandbox()}`);

exports.api = functions.https.onRequest({ timeoutSeconds: 180 }, app);
exports.onEventCreated = require("./triggers/firestoreTriggers").onEventCreated;
exports.onTransactionCreated = require("./triggers/firestoreTriggers").onTransactionCreated;
exports.sendEventReminderSMS = require("./triggers/schedulerTriggers").sendEventReminderSMS;
exports.provisioningWatchdog = require("./triggers/provisioningWatchdog").provisioningWatchdog;
