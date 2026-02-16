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

const stripeConnectService = createStripeConnectService(stripe, stripeService);
const stripeController = createStripeController(stripeConnectService);
const stripeWebhookHandler = createStripeWebhookHandler(stripe, stripeConnectService);

const app = express();
app.use(cors({ origin: true }));
app.post("/webhook", express.raw({ type: "application/json" }), stripeWebhookHandler);
app.use(express.json({ limit: "10mb" }));

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

exports.api = functions.https.onRequest(app);
exports.onEventCreated = require("./triggers/firestoreTriggers").onEventCreated;
exports.onTransactionCreated = require("./triggers/firestoreTriggers").onTransactionCreated;
exports.sendEventReminderSMS = require("./triggers/schedulerTriggers").sendEventReminderSMS;
