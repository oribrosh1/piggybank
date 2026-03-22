const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

require("dotenv").config();

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const stripeService = require("./stripeService");
const { createStripeConnectService } = require("./services/stripeConnectService");
const { createStripeController } = require("./controllers/stripeController");
const posterController = require("./controllers/posterController");
const { verifyFirebaseToken } = require("./middleware/auth");
const { createStripeWebhookHandler } = require("./controllers/webhookController");

const { createProvisioningService } = require("./services/provisioningService");
const provisioningService = createProvisioningService(stripe, stripeService);

const stripeConnectService = createStripeConnectService(stripe, stripeService, provisioningService);
const stripeController = createStripeController(stripeConnectService);
const stripeWebhookHandler = createStripeWebhookHandler(stripe, stripeConnectService, provisioningService);

const ALLOWED_ORIGINS = [
    "https://creditkid.vercel.app",
    "https://www.creditkid.vercel.app",
    /^https:\/\/creditkid-.*\.vercel\.app$/, // Vercel preview deploys
    /^creditkid:\/\//,                       // React Native deep links
    /^exp:\/\//,                             // Expo dev client
];
if (process.env.NODE_ENV !== "production") {
    ALLOWED_ORIGINS.push("http://localhost:3000", "http://localhost:8081", "http://localhost:19006");
}
const app = express();
app.use(cors({
    origin(origin, callback) {
        if (!origin) return callback(null, true); // server-to-server / mobile
        const allowed = ALLOWED_ORIGINS.some((o) =>
            o instanceof RegExp ? o.test(origin) : o === origin
        );
        callback(allowed ? null : new Error("CORS not allowed"), allowed);
    },
}));
app.post("/webhook", express.raw({ type: "application/json" }), stripeWebhookHandler);

const { generalLimiter } = require("./middleware/rateLimit");
app.post("/createCustomConnectAccount",
    express.json({ limit: "8mb" }),
    generalLimiter,
    verifyFirebaseToken,
    stripeController.createCustomConnectAccount
);

app.use(express.json({ limit: "256kb" }));

const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || process.env.APP_BASE_URL || "https://creditkid.vercel.app";

require("./routes").registerRoutes(app, {
    verifyFirebaseToken,
    stripeController,
    posterController,
    stripe,
    db,
    storage,
    admin,
    PUBLIC_BASE_URL,
});

exports.api = functions.https.onRequest({ timeoutSeconds: 180 }, app);
exports.onEventCreated = require("./triggers/firestoreTriggers").onEventCreated;
exports.onTransactionCreated = require("./triggers/firestoreTriggers").onTransactionCreated;
exports.sendEventReminderSMS = require("./triggers/schedulerTriggers").sendEventReminderSMS;
exports.provisioningWatchdog = require("./triggers/provisioningWatchdog").provisioningWatchdog;
