const functions = require("firebase-functions");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Load environment variables from .env file
require('dotenv').config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

// Initialize Stripe with your secret key from environment variable
// Make sure STRIPE_SECRET_KEY is set in functions/.env file
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const stripeService = require("./stripeService");

const app = express();

// Enable CORS for all routes
app.use(cors({ origin: true }));

// Stripe webhook must get raw body for signature verification – register before express.json()
app.post("/webhook", express.raw({ type: "application/json" }), stripeWebhookHandler);

app.use(express.json({ limit: '10mb' }));

// Middleware: Verify Firebase ID token
async function verifyFirebaseToken(req, res, next) {
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid authorization header" });
    }

    const idToken = auth.split("Bearer ")[1];
    try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        req.user = decoded;
        next();
    } catch (err) {
        console.error("Token verification error:", err);
        res.status(401).json({ error: "Invalid token" });
    }
}

// Base URL for public profile (Stripe business_profile.url)
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || process.env.APP_BASE_URL || "https://creditkid.vercel.app";

/** Parse client dob string "MM/DD/YYYY" to Stripe format { day, month, year }. Returns null if invalid. */
function parseDobString(dob) {
    if (!dob || typeof dob !== "string") return null;
    const match = dob.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return null;
    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > new Date().getFullYear()) return null;
    return { day, month, year };
}

/** Normalize US ZIP to 5 digits (digits only, first 5). Returns null if fewer than 5 digits. */
function normalizeUSZip(zipCode) {
    if (zipCode == null) return null;
    const digits = String(zipCode).replace(/\D/g, "");
    if (digits.length < 5) return null;
    return digits.slice(0, 5);
}

// ============================================
// STAGE 1 – CREATE STRIPE CUSTOM CONNECT ACCOUNT (Connect + Issuing)
// Country: US, Type: custom, Business Type: individual
// Capabilities: transfers, card_issuing
// Business profile: mcc 7399, url = public user page, product_description
// ============================================
app.post("/createCustomConnectAccount", verifyFirebaseToken, async (req, res) => {
    const uid = req.user.uid;
    const { country = "US", firstName, lastName, email, phone, dob, address, address2, city, state, zipCode, ssnLast4, idDocumentType, useTestDocument, routingNumber, accountNumber, accountHolderName } = req.body;

    console.log("[createCustomConnectAccount] Start", { uid, country, hasZip: !!zipCode, useTestDocument: !!useTestDocument, hasBank: !!(routingNumber && accountNumber && accountHolderName) });

    try {
        const existing = await db.collection("stripeAccounts").doc(uid).get();
        if (existing.exists && existing.data().accountId) {
            console.log("[createCustomConnectAccount] Existing account, skip create", { uid, accountId: existing.data().accountId });
            return res.json({
                accountId: existing.data().accountId,
                success: true,
                existing: true,
            });
        }

        const userDoc = await db.collection('users').doc(uid).get();
        const userData = userDoc.exists ? userDoc.data() : {};
        let profileSlug = userData?.profileSlug;
        if (!profileSlug) {
            const name = (userData?.fullName || 'member').trim().toLowerCase()
                .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'member';
            profileSlug = `${name}-${uid.slice(0, 8)}`;
            if (userDoc.exists) {
                await db.collection('users').doc(uid).update({
                    profileSlug,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
            console.log("[createCustomConnectAccount] Generated profileSlug", { uid, profileSlug });
        }
        const profileUrl = `${PUBLIC_BASE_URL}/users/${profileSlug}`;
        console.log("[createCustomConnectAccount] Creating Custom Connect account", { uid, profileUrl });

        const dobObj = parseDobString(dob);
        const isTestMode = (process.env.STRIPE_SECRET_KEY || "").toString().startsWith("sk_test_");
        const accountPhone = isTestMode ? "0000000000" : phone;
        const normalizedZip = country === "US" ? normalizeUSZip(zipCode) : (zipCode ? String(zipCode).trim() : undefined);
        if (country === "US" && (!normalizedZip || normalizedZip.length !== 5)) {
            console.log("[createCustomConnectAccount] Invalid ZIP", { uid, zipCode: zipCode ? "***" : null, normalizedZip });
            return res.status(400).json({
                error: "Please enter a valid 5-digit US ZIP code.",
                code: "postal_code_invalid",
                param: "zipCode",
            });
        }

        const account = await stripeService.createCustomConnectAccount(stripe, { country, profileUrl, firstName, lastName, email, phone: accountPhone, dob: dobObj, address, address2, city, state, zipCode: normalizedZip || zipCode, ssnLast4 });
        console.log("[createCustomConnectAccount] Account created", { uid, accountId: account.id });

        if (useTestDocument && isTestMode) {
            try {
                await stripe.accounts.update(account.id, {
                    individual: { verification: { document: { front: "file_identity_document_success" } } },
                });
                console.log("[createCustomConnectAccount] Test identity document attached", { accountId: account.id });
            } catch (docErr) {
                console.warn("[createCustomConnectAccount] Test document attach failed (non-blocking)", { accountId: account.id, message: docErr.message });
            }
        }

        // In test mode, provide full SSN via account token so Stripe clears "Social Security Number (SSN)" requirement
        if (isTestMode) {
            try {
                const accountToken = await stripe.tokens.create({
                    account: {
                        business_type: "individual",
                        individual: { id_number: "000000000" },
                    },
                });
                await stripe.accounts.update(account.id, { account_token: accountToken.id });
                console.log("[createCustomConnectAccount] Test full SSN set", { accountId: account.id });
            } catch (ssnErr) {
                console.warn("[createCustomConnectAccount] Test SSN token failed (non-blocking)", { accountId: account.id, message: ssnErr.message });
            }
        }

        if (routingNumber && accountNumber && accountHolderName) {
            const routing = String(routingNumber).replace(/\D/g, "");
            const accountNum = String(accountNumber).replace(/\D/g, "");
            if (routing.length === 9 && accountNum.length >= 4) {
                try {
                    await stripe.accounts.createExternalAccount(account.id, {
                        external_account: {
                            object: "bank_account",
                            country: "US",
                            currency: "usd",
                            account_holder_name: String(accountHolderName).trim() || "Account Holder",
                            routing_number: routing,
                            account_number: accountNum,
                        },
                    });
                    console.log("[createCustomConnectAccount] External bank account added", { accountId: account.id });
                } catch (bankErr) {
                    console.warn("[createCustomConnectAccount] Add bank account failed (non-blocking)", { accountId: account.id, message: bankErr.message });
                }
            } else {
                console.log("[createCustomConnectAccount] Bank details skipped (invalid)", { accountId: account.id, routingLen: routing.length, accountLen: accountNum.length });
            }
        }

        await db.collection("stripeAccounts").doc(uid).set({
            accountId: account.id,
            country,
            business_type: "individual",
            type: "custom",
            created: admin.firestore.FieldValue.serverTimestamp(),
            status: "pending",
            cardIssuingActive: false,
        }, { merge: true });

        await db.collection("users").doc(uid).update({
            stripeAccountId: account.id,
            stripeAccountStatus: "pending",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }).catch(() => {});

        // In test mode, add a small amount to the new connected account balance (simulates first payment)
        if (isTestMode) {
            const testBalanceCents = 1000; // $10.00
            try {
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: testBalanceCents,
                    currency: "usd",
                    payment_method: "pm_card_visa",
                    confirm: true,
                    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
                    transfer_data: { destination: account.id },
                    description: "Welcome test credit",
                    metadata: { testPayment: "true", userId: uid, welcomeCredit: "true" },
                });
                console.log("[createCustomConnectAccount] Test welcome balance added", { accountId: account.id, amount: testBalanceCents, pi: paymentIntent.id });
            } catch (welcomeErr) {
                console.warn("[createCustomConnectAccount] Test welcome balance failed (non-blocking)", { accountId: account.id, message: welcomeErr.message });
            }
        }

        console.log("[createCustomConnectAccount] Success", { uid, accountId: account.id });
        res.json({
            accountId: account.id,
            success: true,
            existing: false,
        });
    } catch (err) {
        const isPlatformIssuingNotOnboarded =
            err.code === "capability_not_enabled" ||
            (err.type === "StripeInvalidRequestError" && /platform has been onboarded|card_issuing can only be requested/i.test(err.message || ""));
        if (isPlatformIssuingNotOnboarded) {
            console.error("[createCustomConnectAccount] Platform Issuing not onboarded –", err.message);
            return res.status(400).json({
                error: "Card issuing is not enabled for this platform. Complete Issuing onboarding in the Stripe Dashboard (Dashboard → Issuing) first.",
                code: err.code || "capability_not_enabled",
                source: "createCustomConnectAccount",
            });
        }
        if (err.code === "postal_code_invalid" || (err.param && String(err.param).includes("postal_code"))) {
            console.error("[createCustomConnectAccount] Stripe rejected postal code:", err.message);
            return res.status(400).json({
                error: "The ZIP code doesn't match a valid US address. Please check that your ZIP code matches your state (e.g. Florida ZIPs start with 32–34).",
                code: "postal_code_invalid",
                param: "zipCode",
            });
        }
        console.error("[createCustomConnectAccount] Error creating Custom Connect account:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// STAGE 2 – CREATE ONBOARDING LINK (Stripe Hosted Onboarding)
// Redirect user to Stripe to collect SSN, DOB, Address, Bank Account
// ============================================
app.post("/createOnboardingLink", verifyFirebaseToken, async (req, res) => {
    const uid = req.user.uid;
    try {
        const doc = await db.collection("stripeAccounts").doc(uid).get();
        if (!doc.exists || !doc.data().accountId) {
            return res.status(400).json({ error: "No Connect account. Call createCustomConnectAccount first." });
        }
        const accountId = doc.data().accountId;

        // Stripe requires valid HTTPS URLs for return_url and refresh_url (custom schemes like creditkidapp:// are rejected).
        // The page at returnUrl (e.g. https://yourdomain.com/banking/setup/success) should redirect to the app (e.g. creditkidapp://banking/setup/success).
        const returnPath = (process.env.STRIPE_RETURN_PATH || "banking/setup/success").replace(/^\//, "");
        const refreshPath = (process.env.STRIPE_REFRESH_PATH || "banking/setup/stripe-connection?refresh=true").replace(/^\//, "");
        const baseUrl = (PUBLIC_BASE_URL || "https://creditkid.vercel.app").replace(/\/+$/, "");
        const returnUrl = `${baseUrl}/${returnPath}`.replace(/([^:]\/)\/+/g, "$1");
        const refreshUrl = `${baseUrl}/${refreshPath}`.replace(/([^:]\/)\/+/g, "$1");

        const accountLink = await stripeService.createAccountLink(stripe, {
            accountId,
            returnUrl,
            refreshUrl,
        });

        res.json({ accountId, url: accountLink.url, success: true });
    } catch (err) {
        console.log(err);
        console.log(err.code);
        console.log(err.type);
        console.log(err.message);
        console.log(err.source);
        console.log(err.stack);
        console.log(err.name);
        console.log(err.message);
        console.log(err.stack);
        if (err.code === "capability_not_enabled") {
            console.error("[createOnboardingLink] capability_not_enabled – unexpected (usually from createCustomConnectAccount)");
            return res.status(400).json({ error: "Capability not enabled.", code: err.code, source: "createOnboardingLink" });
        }
        if (err.code === "url_invalid" && err.param === "return_url") {
            console.error("[createOnboardingLink] Stripe rejected return_url – ensure PUBLIC_BASE_URL is a valid HTTPS base (e.g. https://yourdomain.com)");
            return res.status(400).json({
                error: "Server URL config invalid. Set PUBLIC_BASE_URL to your app’s HTTPS domain (e.g. https://creditkid.vercel.app).",
                code: err.code,
                source: "createOnboardingLink",
            });
        }
        if (err.code === "link_expired" || err.type === "StripeInvalidRequestError") {
            return res.status(400).json({ error: "Link expired or invalid. Request a new onboarding link.", code: err.code || "link_expired" });
        }
        console.error("[createOnboardingLink] Error creating onboarding link:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// 1) CREATE STRIPE EXPRESS ACCOUNT
// ============================================
app.post("/createExpressAccount", verifyFirebaseToken, async (req, res) => {
    const uid = req.user.uid;
    const {
        business_type = "individual",
        country = "US",
        email
    } = req.body;

    try {
        console.log(`Creating Express account for user ${uid}`);

        // Create a Stripe Connect Express Account
        const account = await stripe.accounts.create({
            type: "express",
            country,
            email: email || req.user.email,
            business_type,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
            settings: {
                payouts: {
                    schedule: {
                        interval: 'manual', // or 'daily', 'weekly', 'monthly'
                    },
                },
            },
        });

        console.log(`Created account: ${account.id}`);

        // Save account ID in Firestore
        await db.collection("stripeAccounts").doc(uid).set({
            accountId: account.id,
            country,
            business_type,
            created: admin.firestore.FieldValue.serverTimestamp(),
            status: 'pending',
        }, { merge: true });

        // Create an account link for onboarding
        // For mobile apps, use deep links matching your app.json scheme
        // Default: 'creditkidapp' (from app.json line 8: "scheme": "creditkidapp")
        const appScheme = process.env.APP_SCHEME || 'creditkidapp';
        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: `${appScheme}://banking/setup/stripe-connection?refresh=true`,
            return_url: `${appScheme}://banking/setup/success`,
            type: "account_onboarding",
        });

        res.json({
            accountId: account.id,
            accountLink: accountLink.url,
            success: true
        });
    } catch (err) {
        console.error("Error creating Express account:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// 2) GET ACCOUNT STATUS
// ============================================
app.get("/getAccountStatus", verifyFirebaseToken, async (req, res) => {
    const uid = req.user.uid;

    try {
        // Get account ID from Firestore
        const doc = await db.collection("stripeAccounts").doc(uid).get();

        if (!doc.exists) {
            return res.json({ exists: false });
        }

        const { accountId } = doc.data();

        // Retrieve account from Stripe (includes capabilities, e.g. card_issuing, transfers)
        const account = await stripe.accounts.retrieve(accountId);

        // Update Firestore with latest status and capabilities
        await db.collection("stripeAccounts").doc(uid).update({
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            details_submitted: account.details_submitted,
            requirements: account.requirements,
            capabilities: account.capabilities,
            cardIssuingActive: account.capabilities?.card_issuing === "active",
            updated: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.json({
            exists: true,
            accountId: account.id,
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            details_submitted: account.details_submitted,
            requirements: account.requirements,
            capabilities: account.capabilities,
        });
    } catch (err) {
        console.error("Error getting account status:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// UPDATE ACCOUNT CAPABILITIES (request card_issuing + transfers)
// ============================================
app.post("/updateAccountCapabilities", verifyFirebaseToken, async (req, res) => {
    const uid = req.user.uid;
    try {
        const doc = await db.collection("stripeAccounts").doc(uid).get();
        if (!doc.exists || !doc.data().accountId) {
            return res.status(404).json({ error: "No Stripe account found" });
        }
        const accountId = doc.data().accountId;
        const account = await stripeService.updateAccountCapabilities(stripe, accountId);
        res.json({
            accountId: account.id,
            capabilities: account.capabilities,
            success: true,
        });
    } catch (err) {
        if (err.code === "capability_not_enabled") {
            return res.status(400).json({ error: "Capability not enabled on platform.", code: err.code });
        }
        console.error("Error updating account capabilities:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// 3) UPLOAD VERIFICATION FILE TO STRIPE
// ============================================
app.post("/uploadVerificationFile", verifyFirebaseToken, async (req, res) => {
    const uid = req.user.uid;
    const { accountId, storagePath, purpose = "identity_document" } = req.body;

    if (!accountId || !storagePath) {
        return res.status(400).json({ error: "Missing accountId or storagePath" });
    }

    try {
        console.log(`Uploading verification file for account ${accountId}`);

        // Get file from Firebase Storage
        const bucket = storage.bucket();
        const file = bucket.file(storagePath);
        const [buffer] = await file.download();
        const [metadata] = await file.getMetadata();

        // Upload to Stripe
        const stripeFile = await stripe.files.create({
            file: {
                data: buffer,
                name: storagePath.split("/").pop(),
                type: metadata.contentType || "application/octet-stream",
            },
            purpose,
        });

        console.log(`Stripe file created: ${stripeFile.id}`);

        // Attach file to account as verification document
        await stripe.accounts.update(accountId, {
            individual: {
                verification: {
                    document: {
                        front: stripeFile.id
                    }
                }
            }
        });

        // Update Firestore
        await db.collection("stripeAccounts").doc(uid).update({
            lastUploadedFile: stripeFile.id,
            verificationFileUploaded: true,
            updated: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.json({
            fileId: stripeFile.id,
            success: true
        });
    } catch (err) {
        console.error("Error uploading verification file:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// 4) CREATE PAYMENT INTENT (Receive Payment)
// ============================================
app.post("/createPaymentIntent", verifyFirebaseToken, async (req, res) => {
    const { amount, currency = "usd", connectedAccountId, description } = req.body;

    if (!amount || !connectedAccountId) {
        return res.status(400).json({ error: "Missing amount or connectedAccountId" });
    }

    try {
        console.log(`Creating PaymentIntent for ${amount} ${currency} to account ${connectedAccountId}`);

        // Create PaymentIntent with transfer to connected account
        const paymentIntent = await stripe.paymentIntents.create({
            amount, // Amount in cents (e.g., 1000 = $10.00)
            currency,
            payment_method_types: ["card"],
            description: description || "Payment to connected account",
            transfer_data: {
                destination: connectedAccountId, // Money goes to connected account
            },
            // Optional: Take an application fee (platform fee)
            // application_fee_amount: Math.floor(amount * 0.10), // 10% fee example
        });

        console.log(`PaymentIntent created: ${paymentIntent.id}`);

        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            success: true
        });
    } catch (err) {
        console.error("Error creating PaymentIntent:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// 5) GET ACCOUNT BALANCE
// ============================================
app.get("/getBalance", verifyFirebaseToken, async (req, res) => {
    const uid = req.user.uid;

    try {
        const doc = await db.collection("stripeAccounts").doc(uid).get();
        if (!doc.exists) {
            return res.status(404).json({ error: "No Stripe account found" });
        }
        const { accountId } = doc.data();
        const balance = await stripe.balance.retrieve({ stripeAccount: accountId });
        res.json({
            available: balance.available,
            pending: balance.pending,
            success: true,
        });
    } catch (err) {
        console.error("Error getting balance:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// STAGE 2.5 – GET ISSUING BALANCE (must be > 0 before Create Card)
// ============================================
app.get("/getIssuingBalance", verifyFirebaseToken, async (req, res) => {
    const uid = req.user.uid;
    try {
        const doc = await db.collection("stripeAccounts").doc(uid).get();
        if (!doc.exists || !doc.data().accountId) {
            return res.status(404).json({ error: "No Stripe account found" });
        }
        const accountId = doc.data().accountId;
        const { issuingAvailable: availableCents, currency } = await stripeService.getIssuingBalance(stripe, accountId);
        res.json({
            issuingAvailable: availableCents,
            issuingAvailableFormatted: (availableCents / 100).toFixed(2),
            currency,
            canCreateCard: availableCents > 0,
            success: true,
        });
    } catch (err) {
        if (err.code === "capability_not_enabled") {
            return res.status(400).json({ error: "Card issuing not enabled for this account.", code: err.code });
        }
        console.error("Error getting issuing balance:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// STAGE 2.5 – TOP-UP ISSUING BALANCE (from linked bank account)
// ============================================
app.post("/topUpIssuing", verifyFirebaseToken, async (req, res) => {
    const uid = req.user.uid;
    const { amount } = req.body; // amount in cents
    if (!amount || amount < 100) {
        return res.status(400).json({ error: "Amount required (minimum 100 cents = $1)" });
    }
    try {
        const doc = await db.collection("stripeAccounts").doc(uid).get();
        if (!doc.exists || !doc.data().accountId) {
            return res.status(404).json({ error: "No Stripe account found" });
        }
        const accountId = doc.data().accountId;
        const topup = await stripeService.topUpIssuing(stripe, { accountId, amount: Number(amount) });
        res.json({
            topupId: topup.id,
            amount: topup.amount,
            status: topup.status,
            success: true,
        });
    } catch (err) {
        if (err.code === "insufficient_funds") {
            return res.status(400).json({ error: "Insufficient funds.", code: err.code });
        }
        if (err.code === "capability_not_enabled") {
            return res.status(400).json({ error: "Capability not enabled.", code: err.code });
        }
        console.error("Error topping up issuing:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// STAGE 3 – CREATE CARDHOLDER (individual, KYC details)
// ============================================
// Valid E.164 test phone for Issuing cardholders (Stripe rejects placeholders like +10000000000)
const ISSUING_TEST_PHONE = "+15555555555";

app.post("/createIssuingCardholder", verifyFirebaseToken, async (req, res) => {
    const uid = req.user.uid;
    const { name, email, phone, line1, line2, city, state, postal_code, dob } = req.body;
    if (!name || !email || !line1 || !city || !state || !postal_code) {
        return res.status(400).json({ error: "Missing required fields: name, email, line1, city, state, postal_code" });
    }
    const [first_name, ...lastParts] = (name || "").trim().split(/\s+/);
    const last_name = lastParts.length ? lastParts.join(" ") : first_name;
    const isTestMode = (process.env.STRIPE_SECRET_KEY || "").toString().startsWith("sk_test_");
    const raw = (phone || "").toString().replace(/\D/g, "");
    const isPlaceholderPhone = !phone || raw === "0000000000" || raw === "10000000000" || phone === "+10000000000";
    const cardholderPhone = (isTestMode && isPlaceholderPhone) ? ISSUING_TEST_PHONE : (phone || undefined);
    try {
        const doc = await db.collection("stripeAccounts").doc(uid).get();
        if (!doc.exists || !doc.data().accountId) {
            return res.status(404).json({ error: "No Stripe account found" });
        }
        if (doc.data().cardholderId) {
            return res.json({ cardholderId: doc.data().cardholderId, success: true, existing: true });
        }
        const accountId = doc.data().accountId;
        const cardholder = await stripeService.createIssuingCardholder(stripe, {
            accountId,
            name: `${first_name} ${last_name}`,
            email,
            phone: cardholderPhone,
            line1,
            line2,
            city,
            state,
            postal_code,
            dob: dob ? (typeof dob === "object" ? dob : { day: 1, month: 1, year: 1990 }) : undefined,
        });
        await db.collection("stripeAccounts").doc(uid).update({
            cardholderId: cardholder.id,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.json({ cardholderId: cardholder.id, success: true, existing: false });
    } catch (err) {
        if (err.code === "capability_not_enabled") {
            return res.status(400).json({ error: "Card issuing not enabled.", code: err.code });
        }
        console.error("Error creating cardholder:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// STAGE 3 – ISSUE VIRTUAL CARD (virtual, usd, spending_controls)
// ============================================
app.post("/createVirtualCard", verifyFirebaseToken, async (req, res) => {
    const uid = req.user.uid;
    const { spendingLimitAmount = 50000, spendingLimitInterval = "per_authorization" } = req.body; // default $500/authorization
    try {
        const doc = await db.collection("stripeAccounts").doc(uid).get();
        if (!doc.exists || !doc.data().accountId) {
            return res.status(404).json({ error: "No Stripe account found" });
        }
        const { accountId, cardholderId, virtualCardId: existingCardId } = doc.data();
        if (existingCardId) {
            return res.status(400).json({ error: "You already have a virtual card.", code: "card_exists" });
        }
        if (!cardholderId) {
            return res.status(400).json({ error: "Create cardholder first (createIssuingCardholder)" });
        }
        const { issuingAvailable: availableCents } = await stripeService.getIssuingBalance(stripe, accountId);
        if (availableCents <= 0) {
            return res.status(400).json({
                error: "Insufficient issuing balance. Add funds before creating a card.",
                code: "insufficient_funds",
            });
        }
        const card = await stripeService.createVirtualCard(stripe, {
            accountId,
            cardholderId,
            spendingLimitAmount: Math.min(Number(spendingLimitAmount) || 50000, 50000),
            spendingLimitInterval,
        });
        await db.collection("stripeAccounts").doc(uid).update({
            virtualCardId: card.id,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        await db.collection("users").doc(uid).update({
            virtualCardId: card.id,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }).catch(() => {});
        res.json({
            cardId: card.id,
            last4: card.last4,
            status: card.status,
            success: true,
        });
    } catch (err) {
        if (err.code === "insufficient_funds") {
            return res.status(400).json({ error: "Insufficient issuing balance.", code: err.code });
        }
        if (err.code === "capability_not_enabled") {
            return res.status(400).json({ error: "Capability not enabled.", code: err.code });
        }
        console.error("Error creating virtual card:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// STAGE 4 – SECURE CARD DETAILS (server-side only; never store full number/CVV in DB)
// ============================================
app.get("/getCardDetails", verifyFirebaseToken, async (req, res) => {
    const uid = req.user.uid;
    try {
        const doc = await db.collection("stripeAccounts").doc(uid).get();
        if (!doc.exists || !doc.data().accountId) {
            return res.status(404).json({ error: "No Stripe account found" });
        }
        const { accountId, virtualCardId } = doc.data();
        const cardId = virtualCardId;
        if (!cardId) {
            return res.status(404).json({ error: "No card found. Create a virtual card first." });
        }
        const payload = await stripeService.getCardDetails(stripe, { accountId, cardId });
        res.json({ ...payload, success: true });
    } catch (err) {
        if (err.code === "resource_missing") {
            return res.status(404).json({ error: "Card not found.", code: err.code });
        }
        console.error("Error retrieving card details:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// TEST MODE – Create test authorization on Issuing card
// ============================================
app.post("/createTestAuthorization", verifyFirebaseToken, async (req, res) => {
    const uid = req.user.uid;
    const { amount = 1000 } = req.body; // cents, default $10
    try {
        const doc = await db.collection("stripeAccounts").doc(uid).get();
        if (!doc.exists || !doc.data().accountId) {
            return res.status(404).json({ error: "No Stripe account found" });
        }
        const { accountId, virtualCardId } = doc.data();
        if (!virtualCardId) {
            return res.status(400).json({
                error: "No card found. Create a virtual card first (Issue Card step).",
                code: "no_card",
            });
        }
        const authorization = await stripeService.createTestAuthorization(stripe, {
            accountId,
            cardId: virtualCardId,
            amount: Number(amount) || 1000,
        });
        res.json({
            authorizationId: authorization.id,
            amount: authorization.amount,
            currency: authorization.currency,
            approved: authorization.approved,
            status: authorization.status,
            success: true,
        });
    } catch (err) {
        if (err.code === "resource_missing") {
            return res.status(404).json({ error: "Card not found.", code: err.code });
        }
        console.error("Error creating test authorization:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// 6) CREATE PAYOUT (Withdraw money to bank)
// ============================================
app.post("/createPayout", verifyFirebaseToken, async (req, res) => {
    const uid = req.user.uid;
    const { amount, currency = "usd" } = req.body;

    try {
        // Get account ID from Firestore
        const doc = await db.collection("stripeAccounts").doc(uid).get();

        if (!doc.exists) {
            return res.status(404).json({ error: "No Stripe account found" });
        }

        const { accountId } = doc.data();

        // Create payout
        const payout = await stripe.payouts.create(
            {
                amount,
                currency,
            },
            {
                stripeAccount: accountId,
            }
        );

        res.json({
            payoutId: payout.id,
            amount: payout.amount,
            arrival_date: payout.arrival_date,
            success: true,
        });
    } catch (err) {
        console.error("Error creating payout:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// 7) GET TRANSACTIONS (Payment history for connected account)
// ============================================
app.get("/getTransactions", verifyFirebaseToken, async (req, res) => {
    const uid = req.user.uid;
    const { limit = 10, starting_after } = req.query;

    try {
        // Get account ID from Firestore
        const doc = await db.collection("stripeAccounts").doc(uid).get();

        if (!doc.exists) {
            return res.status(404).json({ error: "No Stripe account found" });
        }

        const { accountId } = doc.data();

        // Get balance transactions for the connected account
        const params = {
            limit: parseInt(limit),
        };

        if (starting_after) {
            params.starting_after = starting_after;
        }

        const transactions = await stripe.balanceTransactions.list(
            params,
            { stripeAccount: accountId }
        );

        // Format transactions for the app
        const formattedTransactions = transactions.data.map(txn => ({
            id: txn.id,
            amount: txn.amount,
            currency: txn.currency,
            type: txn.type,
            status: txn.status,
            description: txn.description,
            created: txn.created,
            available_on: txn.available_on,
            fee: txn.fee,
            net: txn.net,
        }));

        res.json({
            transactions: formattedTransactions,
            has_more: transactions.has_more,
            success: true,
        });
    } catch (err) {
        console.error("Error getting transactions:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// 8) GET FULL ACCOUNT DETAILS (For Custom accounts dashboard)
// ============================================
app.get("/getAccountDetails", verifyFirebaseToken, async (req, res) => {
    const uid = req.user.uid;

    try {
        // Get account ID from Firestore
        const doc = await db.collection("stripeAccounts").doc(uid).get();

        if (!doc.exists) {
            return res.status(404).json({ error: "No Stripe account found" });
        }

        const { accountId, cardholderId, virtualCardId } = doc.data();

        // Retrieve full account details from Stripe
        const account = await stripe.accounts.retrieve(accountId);

        // Get external accounts (bank accounts/debit cards)
        const externalAccounts = account.external_accounts?.data || [];

        res.json({
            accountId: account.id,
            type: account.type,
            country: account.country,
            default_currency: account.default_currency,
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            details_submitted: account.details_submitted,
            requirements: account.requirements,
            capabilities: account.capabilities,
            // Business/Individual info
            business_type: account.business_type,
            individual: account.individual ? {
                first_name: account.individual.first_name,
                last_name: account.individual.last_name,
                email: account.individual.email,
                phone: account.individual.phone,
                dob: account.individual.dob,
                address: account.individual.address,
                verification: account.individual.verification,
            } : null,
            // Payout settings
            settings: {
                payouts: account.settings?.payouts,
                payments: account.settings?.payments,
            },
            // Issuing (from Firestore)
            cardholderId: cardholderId || null,
            virtualCardId: virtualCardId || null,
            // External accounts (bank accounts)
            external_accounts: externalAccounts.map(ea => ({
                id: ea.id,
                object: ea.object,
                bank_name: ea.bank_name,
                last4: ea.last4,
                routing_number: ea.routing_number,
                currency: ea.currency,
                country: ea.country,
                default_for_currency: ea.default_for_currency,
                status: ea.status,
            })),
            created: account.created,
            success: true,
        });
    } catch (err) {
        console.error("Error getting account details:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// 9) GET PAYOUT HISTORY
// ============================================
app.get("/getPayouts", verifyFirebaseToken, async (req, res) => {
    const uid = req.user.uid;
    const { limit = 10, starting_after } = req.query;

    try {
        const doc = await db.collection("stripeAccounts").doc(uid).get();

        if (!doc.exists) {
            return res.status(404).json({ error: "No Stripe account found" });
        }

        const { accountId } = doc.data();

        const params = { limit: parseInt(limit) };
        if (starting_after) params.starting_after = starting_after;

        const payouts = await stripe.payouts.list(params, { stripeAccount: accountId });

        res.json({
            payouts: payouts.data.map(p => ({
                id: p.id,
                amount: p.amount,
                currency: p.currency,
                status: p.status,
                arrival_date: p.arrival_date,
                created: p.created,
                method: p.method,
                type: p.type,
                description: p.description,
                destination: p.destination,
                failure_message: p.failure_message,
            })),
            has_more: payouts.has_more,
            success: true,
        });
    } catch (err) {
        console.error("Error getting payouts:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// 10) ADD EXTERNAL BANK ACCOUNT
// ============================================
app.post("/addBankAccount", verifyFirebaseToken, async (req, res) => {
    const uid = req.user.uid;
    const {
        account_holder_name,
        account_holder_type = 'individual',
        routing_number,
        account_number,
        country = 'US',
        currency = 'usd'
    } = req.body;

    if (!routing_number || !account_number || !account_holder_name) {
        return res.status(400).json({
            error: "Missing required fields: routing_number, account_number, account_holder_name"
        });
    }

    try {
        const doc = await db.collection("stripeAccounts").doc(uid).get();

        if (!doc.exists) {
            return res.status(404).json({ error: "No Stripe account found" });
        }

        const { accountId } = doc.data();

        // Create bank account token
        const bankAccountToken = await stripe.tokens.create({
            bank_account: {
                country,
                currency,
                account_holder_name,
                account_holder_type,
                routing_number,
                account_number,
            },
        });

        // Attach to connected account
        const externalAccount = await stripe.accounts.createExternalAccount(
            accountId,
            { external_account: bankAccountToken.id }
        );

        res.json({
            bankAccountId: externalAccount.id,
            bank_name: externalAccount.bank_name,
            last4: externalAccount.last4,
            success: true,
        });
    } catch (err) {
        console.error("Error adding bank account:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// 11) UPDATE ACCOUNT VERIFICATION INFO (for Custom accounts)
// ============================================
app.post("/updateAccountInfo", verifyFirebaseToken, async (req, res) => {
    const uid = req.user.uid;
    const {
        first_name,
        last_name,
        email,
        phone,
        dob, // { day, month, year }
        address, // { line1, line2, city, state, postal_code, country }
        ssn_last_4,
        id_number, // Full SSN for US
        // Business profile (required for Custom account activation)
        business_profile_mcc,
        business_profile_url,
        business_profile_product_description,
        business_profile_support_phone,
        statement_descriptor,
    } = req.body;

    try {
        const doc = await db.collection("stripeAccounts").doc(uid).get();

        if (!doc.exists) {
            return res.status(404).json({ error: "No Stripe account found" });
        }

        const { accountId } = doc.data();

        const updateData = { individual: {} };

        if (first_name) updateData.individual.first_name = first_name;
        if (last_name) updateData.individual.last_name = last_name;
        if (email) updateData.individual.email = email;
        if (phone) updateData.individual.phone = phone;
        if (dob) updateData.individual.dob = dob;
        if (address) updateData.individual.address = address;
        if (ssn_last_4) updateData.individual.ssn_last_4 = ssn_last_4;
        if (id_number) updateData.individual.id_number = id_number;

        if (business_profile_mcc || business_profile_url || business_profile_product_description || business_profile_support_phone) {
            updateData.business_profile = {};
            if (business_profile_mcc) updateData.business_profile.mcc = String(business_profile_mcc);
            if (business_profile_url) updateData.business_profile.url = business_profile_url;
            if (business_profile_product_description) updateData.business_profile.product_description = business_profile_product_description;
            if (business_profile_support_phone) updateData.business_profile.support_phone = business_profile_support_phone;
        }

        if (statement_descriptor) {
            updateData.settings = { payments: { statement_descriptor: String(statement_descriptor).slice(0, 22) } };
        }

        const account = await stripe.accounts.update(accountId, updateData);

        res.json({
            accountId: account.id,
            requirements: account.requirements,
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            success: true,
        });
    } catch (err) {
        console.error("Error updating account info:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// 12) ACCEPT STRIPE TERMS OF SERVICE (Required for Custom accounts)
// ============================================
app.post("/acceptTermsOfService", verifyFirebaseToken, async (req, res) => {
    const uid = req.user.uid;
    const { ip } = req.body; // Client IP address

    try {
        const doc = await db.collection("stripeAccounts").doc(uid).get();

        if (!doc.exists) {
            return res.status(404).json({ error: "No Stripe account found" });
        }

        const { accountId } = doc.data();

        // Accept TOS
        const account = await stripe.accounts.update(accountId, {
            tos_acceptance: {
                date: Math.floor(Date.now() / 1000),
                ip: ip || req.ip || req.headers['x-forwarded-for']?.split(',')[0] || '0.0.0.0',
            },
        });

        res.json({
            accountId: account.id,
            tos_accepted: true,
            success: true,
        });
    } catch (err) {
        console.error("Error accepting TOS:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// 9) WEBHOOK HANDLER (Account Updates) – route registered above before express.json()
// ============================================
async function stripeWebhookHandler(req, res) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
        const signature = req.headers['stripe-signature'];
        event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`Webhook received: ${event.type}`);

    // Handle account.updated – STAGE 2: only proceed when capabilities.card_issuing === 'active'
    if (event.type === 'account.updated') {
        const account = event.data.object;
        const querySnapshot = await db.collection('stripeAccounts')
            .where('accountId', '==', account.id)
            .get();

        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const uid = doc.id;
            const cardIssuingActive = account.capabilities?.card_issuing === 'active';
            await doc.ref.update({
                charges_enabled: account.charges_enabled,
                payouts_enabled: account.payouts_enabled,
                details_submitted: account.details_submitted,
                requirements: account.requirements,
                capabilities: account.capabilities,
                cardIssuingActive: cardIssuingActive || doc.data().cardIssuingActive,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            if (cardIssuingActive) {
                await db.collection('users').doc(uid).update({
                    stripeAccountStatus: 'approved',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                }).catch(() => {});
            }
            console.log(`Updated account status for ${uid}, card_issuing active: ${cardIssuingActive}`);
        }
    }

    // Handle payment_intent.succeeded event
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        console.log(`Payment succeeded: ${paymentIntent.id}`);

        // You can store payment records in Firestore here
        await db.collection('payments').add({
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            created: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    res.json({ received: true });
}

// ============================================
// 7) GENERATE AI INVITATION POSTER
// ============================================
app.post("/generatePoster", verifyFirebaseToken, async (req, res) => {
    const { eventId } = req.body;

    if (!eventId) {
        return res.status(400).json({ error: "Missing eventId" });
    }

    try {
        console.log(`🎨 Generating AI poster for event: ${eventId}`);

        // 1. Get event data
        const eventRef = db.collection('events').doc(eventId);
        const eventDoc = await eventRef.get();

        if (!eventDoc.exists) {
            return res.status(404).json({ error: "Event not found" });
        }

        const event = eventDoc.data();

        // 2. Verify the user owns this event
        if (event.creatorId !== req.user.uid) {
            return res.status(403).json({ error: "Not authorized to modify this event" });
        }

        // 3. Build the prompt for Gemini
        const eventTypeLabel = {
            birthday: "Birthday Party",
            barMitzvah: "Bar Mitzvah",
            batMitzvah: "Bat Mitzvah",
        }[event.eventType] || "Celebration";

        const formatDate = (dateStr) => {
            const date = new Date(dateStr);
            return date.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
            });
        };

        // Build a detailed prompt
        let promptDetails = [];
        promptDetails.push(`Event Type: ${eventTypeLabel}`);
        promptDetails.push(`Event Name: ${event.eventName}`);
        if (event.age) promptDetails.push(`Age: Turning ${event.age}`);
        promptDetails.push(`Date: ${formatDate(event.date)}`);
        promptDetails.push(`Time: ${event.time}`);
        promptDetails.push(`Location: ${event.address1}${event.address2 ? ', ' + event.address2 : ''}`);
        if (event.theme) promptDetails.push(`Theme: ${event.theme}`);
        if (event.attireType) promptDetails.push(`Dress Code: ${event.attireType}`);
        if (event.partyType) promptDetails.push(`Party Type: ${event.partyType}`);

        const prompt = `Create a beautiful, modern, and elegant digital invitation poster for the following event:

${promptDetails.join('\n')}

Design requirements:
- Make it visually stunning and celebratory
- Use modern design aesthetics with clean typography
- Include festive elements appropriate for a ${eventTypeLabel}
- The design should feel premium and personalized
- Use vibrant but tasteful colors
- Include decorative elements like confetti, balloons, or sparkles as appropriate
- Make the event name prominent
- Layout should be suitable for mobile viewing (portrait orientation)
- Include all the event details in an elegant, readable format
- The style should be ${event.theme ? `themed around "${event.theme}"` : 'elegant and modern'}

Generate a prompt for creating this invitation poster image that I can use with an image generation AI. The prompt should be detailed and specific about visual elements, colors, typography, and layout.`;

        // 4. Call Gemini to generate a detailed image prompt
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const imagePrompt = response.text();

        console.log(`📝 Generated image prompt for event ${eventId}`);

        // 5. Now use Imagen (Google's image generation) or return the prompt
        // Note: For actual image generation, you would call Imagen API here
        // For now, we'll return the prompt and a placeholder approach

        // Store the prompt in the event for future use
        await eventRef.update({
            posterPrompt: imagePrompt,
            posterGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 6. Generate image using Gemini's image generation capability
        // Note: As of now, Gemini 1.5 doesn't directly generate images
        // We'll use Imagen 3 if available, or return the prompt for client-side generation

        let posterUrl = null;

        try {
            // Try to use Imagen for image generation
            const imagenModel = genAI.getGenerativeModel({ model: "imagen-3.0-generate-001" });
            const imageResult = await imagenModel.generateContent({
                contents: [{
                    role: "user",
                    parts: [{ text: imagePrompt }]
                }],
                generationConfig: {
                    responseModalities: ["image"],
                },
            });

            // If image generation succeeds, upload to Firebase Storage
            if (imageResult.response?.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
                const imageData = imageResult.response.candidates[0].content.parts[0].inlineData;
                const buffer = Buffer.from(imageData.data, 'base64');

                const bucket = storage.bucket();
                const fileName = `posters/${eventId}/invitation_${Date.now()}.png`;
                const file = bucket.file(fileName);

                await file.save(buffer, {
                    metadata: {
                        contentType: imageData.mimeType || 'image/png',
                    },
                });

                // Make the file publicly accessible
                await file.makePublic();
                posterUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

                // Update event with poster URL
                await eventRef.update({
                    posterUrl: posterUrl,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
        } catch (imagenError) {
            console.log(`⚠️ Image generation not available, returning prompt only:`, imagenError.message);
            // Image generation failed or not available - that's okay, we return the prompt
        }

        res.json({
            success: true,
            posterPrompt: imagePrompt,
            posterUrl: posterUrl,
            message: posterUrl
                ? "AI poster generated successfully!"
                : "Image prompt generated. Image generation requires Imagen API access.",
        });

    } catch (err) {
        console.error("Error generating AI poster:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// TEST: AUTO-VERIFY ACCOUNT (For test mode only - enables transfers capability)
// ============================================
app.post("/testVerifyAccount", verifyFirebaseToken, async (req, res) => {
    const uid = req.user.uid;

    // Only allow in test mode
    if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
        return res.status(403).json({
            error: "This endpoint is only available in test mode"
        });
    }

    try {
        const doc = await db.collection("stripeAccounts").doc(uid).get();

        if (!doc.exists) {
            return res.status(404).json({ error: "No Stripe account found. Create an event first!" });
        }

        const { accountId } = doc.data();

        // Update the account with ALL required test verification data
        const account = await stripe.accounts.update(accountId, {
            business_type: 'individual',
            individual: {
                // Test SSN that Stripe accepts in test mode
                ssn_last_4: '0000',
                // Test date of birth
                dob: {
                    day: 1,
                    month: 1,
                    year: 1990,
                },
                first_name: 'Test',
                last_name: 'User',
                email: 'test@example.com',
                phone: '+15555555555',
                address: {
                    line1: '123 Test Street',
                    city: 'San Francisco',
                    state: 'CA',
                    postal_code: '94111',
                    country: 'US',
                },
                // Relationship - marks this person as owner and representative
                relationship: {
                    owner: true,
                    representative: true,
                    percent_ownership: 100,
                    title: 'Owner',
                },
            },
            // Accept TOS
            tos_acceptance: {
                date: Math.floor(Date.now() / 1000),
                ip: req.ip || '127.0.0.1',
            },
            // Business profile with ALL required fields
            business_profile: {
                mcc: '8299', // Schools and Educational Services
                url: 'https://creditkid.vercel.app',
                product_description: 'Gift collection platform for special events',
            },
            // Settings including statement descriptors
            settings: {
                payouts: {
                    statement_descriptor: 'CREDITKID',
                },
                payments: {
                    statement_descriptor: 'CREDITKID GIFT',
                },
            },
        });

        console.log(`✅ Test account verified: ${accountId}`);
        console.log(`   Capabilities: ${JSON.stringify(account.capabilities)}`);

        // Also add a test bank account if one doesn't exist (required for payouts/transfers)
        let bankAccountAdded = false;
        try {
            const existingAccounts = await stripe.accounts.listExternalAccounts(accountId, { limit: 1 });
            if (existingAccounts.data.length === 0) {
                // Add test bank account
                const bankToken = await stripe.tokens.create({
                    bank_account: {
                        country: 'US',
                        currency: 'usd',
                        account_holder_name: 'Test User',
                        account_holder_type: 'individual',
                        routing_number: '110000000', // Stripe test routing number
                        account_number: '000123456789', // Stripe test account number
                    },
                });

                await stripe.accounts.createExternalAccount(accountId, {
                    external_account: bankToken.id,
                });
                bankAccountAdded = true;
                console.log(`✅ Test bank account added`);
            } else {
                console.log(`✅ Bank account already exists`);
            }
        } catch (bankErr) {
            console.log(`⚠️ Could not add test bank account: ${bankErr.message}`);
        }

        res.json({
            success: true,
            accountId: account.id,
            capabilities: account.capabilities,
            bankAccountAdded,
            message: `Account verified for testing!${bankAccountAdded ? ' Bank account added.' : ''} You can now receive test payments.`,
        });
    } catch (err) {
        console.error("Error verifying test account:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// TEST: CREATE FAKE TRANSACTION (Only for testing!)
// ============================================
app.post("/testCreateTransaction", verifyFirebaseToken, async (req, res) => {
    const uid = req.user.uid;
    const { amount = 2500 } = req.body; // Default $25.00

    // Only allow in test mode
    if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
        return res.status(403).json({
            error: "This endpoint is only available in test mode"
        });
    }

    try {
        const doc = await db.collection("stripeAccounts").doc(uid).get();

        if (!doc.exists) {
            return res.status(404).json({ error: "No Stripe account found" });
        }

        const { accountId } = doc.data();

        // Create a test charge that goes to the connected account
        // Using Stripe's test tokens
        const paymentIntent = await stripe.paymentIntents.create({
            amount: parseInt(amount),
            currency: 'usd',
            payment_method: 'pm_card_visa', // Test card
            confirm: true, // Automatically confirm
            transfer_data: {
                destination: accountId,
            },
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'never',
            },
        });

        console.log(`✅ Test transaction created: ${paymentIntent.id} for ${amount} cents`);

        res.json({
            success: true,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            status: paymentIntent.status,
            message: `Test payment of $${(amount / 100).toFixed(2)} created! Refresh your Credit screen to see it.`,
        });
    } catch (err) {
        console.error("Error creating test transaction:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// TEST: ADD TEST BALANCE (Simulates receiving a payment)
// ============================================
app.post("/testAddBalance", verifyFirebaseToken, async (req, res) => {
    const uid = req.user.uid;
    const { amount = 5000 } = req.body; // Default $50.00

    // Only allow in test mode
    if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
        return res.status(403).json({
            error: "This endpoint is only available in test mode"
        });
    }

    try {
        const doc = await db.collection("stripeAccounts").doc(uid).get();

        if (!doc.exists) {
            return res.status(404).json({ error: "No Stripe account found. Create an event first!" });
        }

        const { accountId } = doc.data();

        // Method 1: Create and confirm a PaymentIntent with automatic transfer
        // This simulates someone paying the connected account (like a gift/donation)
        const paymentIntent = await stripe.paymentIntents.create({
            amount: parseInt(amount),
            currency: 'usd',
            payment_method: 'pm_card_visa', // Test card
            confirm: true, // Auto-confirm
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'never'
            },
            // Transfer the funds to the connected account
            transfer_data: {
                destination: accountId,
            },
            // Optional: take a small platform fee
            // application_fee_amount: Math.round(amount * 0.029), // 2.9%
            description: `Test gift for account ${accountId}`,
            metadata: {
                testPayment: 'true',
                userId: uid,
            },
        });

        console.log(`✅ Test payment created: ${paymentIntent.id} for ${amount} cents to ${accountId}`);

        res.json({
            success: true,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            status: paymentIntent.status,
            message: `$${(amount / 100).toFixed(2)} test payment successful! The money will appear in your balance.`,
        });
    } catch (err) {
        console.error("Error adding test balance:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// CHILD INVITE LINK (parent sends link via SMS; child opens link to claim account)
// ============================================
const crypto = require("crypto");

const CHILD_INVITE_SECRET = process.env.CHILD_INVITE_JWT_SECRET || "creditkid-child-invite-secret-change-me";
const CHILD_INVITE_EXPIRY_DAYS = 30;
const APP_SCHEME = "creditkidapp";

function createChildInviteToken(eventId, creatorId) {
    const payload = {
        eventId,
        creatorId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + CHILD_INVITE_EXPIRY_DAYS * 24 * 60 * 60,
    };
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const sig = crypto.createHmac("sha256", CHILD_INVITE_SECRET).update(payloadB64).digest("base64url");
    return `${payloadB64}.${sig}`;
}

function verifyChildInviteToken(token) {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payloadB64, sig] = parts;
    const expectedSig = crypto.createHmac("sha256", CHILD_INVITE_SECRET).update(payloadB64).digest("base64url");
    if (expectedSig !== sig) return null;
    try {
        const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch {
        return null;
    }
}

// Parent: get child invite link for an event (requires auth)
app.post("/getChildInviteLink", verifyFirebaseToken, async (req, res) => {
    const uid = req.user.uid;
    const { eventId } = req.body || {};
    if (!eventId) {
        return res.status(400).json({ error: "eventId is required" });
    }
    try {
        const eventRef = db.collection("events").doc(eventId);
        const eventSnap = await eventRef.get();
        if (!eventSnap.exists) {
            return res.status(404).json({ error: "Event not found" });
        }
        const eventData = eventSnap.data();
        if (eventData.creatorId !== uid) {
            return res.status(403).json({ error: "Only the event creator can generate the child link" });
        }
        const token = createChildInviteToken(eventId, uid);
        const link = `${APP_SCHEME}://child?token=${encodeURIComponent(token)}`;
        const expiresAt = new Date(Date.now() + CHILD_INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        return res.json({ link, expiresAt: expiresAt.toISOString(), token });
    } catch (err) {
        console.error("getChildInviteLink error:", err);
        return res.status(500).json({ error: err.message });
    }
});

// Child: claim invite (no auth); creates anonymous user + childAccount, returns custom token
app.post("/claimChildInvite", async (req, res) => {
    const { token } = req.body || {};
    const payload = verifyChildInviteToken(token);
    if (!payload || !payload.eventId || !payload.creatorId) {
        return res.status(400).json({ error: "Invalid or expired link. Ask your parent to send a new one." });
    }
    const { eventId, creatorId } = payload;
    try {
        const eventRef = db.collection("events").doc(eventId);
        const eventSnap = await eventRef.get();
        if (!eventSnap.exists) {
            return res.status(404).json({ error: "Event not found" });
        }
        const eventData = eventSnap.data();

        // Check if child account already exists for this event (same device / existing anonymous user can re-open)
        const existingChild = await db.collection("childAccounts").where("eventId", "==", eventId).limit(1).get();
        if (!existingChild.empty) {
            const existing = existingChild.docs[0].data();
            const customToken = await admin.auth().createCustomToken(existing.userId, { eventId, role: "child" });
            return res.json({
                customToken,
                childAccountId: existingChild.docs[0].id,
                eventId,
                eventName: eventData.eventName,
            });
        }

        const childId = db.collection("childAccounts").doc().id;
        const uid = `child_${childId}`;
        await admin.auth().createUser({
            uid,
            displayName: eventData.eventName ? `Child: ${eventData.eventName}` : "Child",
            isAnonymous: false,
        });
        const customToken = await admin.auth().createCustomToken(uid, { eventId, role: "child" });

        const now = admin.firestore.FieldValue.serverTimestamp();
        await db.collection("childAccounts").doc(childId).set({
            id: childId,
            eventId,
            userId: uid,
            balanceCents: 0,
            eventName: eventData.eventName || null,
            creatorName: eventData.creatorName || null,
            createdAt: now,
            updatedAt: now,
        });

        return res.json({
            customToken,
            childAccountId: childId,
            eventId,
            eventName: eventData.eventName,
        });
    } catch (err) {
        console.error("claimChildInvite error:", err);
        return res.status(500).json({ error: err.message });
    }
});

// Export the Express app as a single Cloud Function
exports.api = functions.https.onRequest(app);

// ============================================
// FIRESTORE TRIGGER: On Event Created
// Attach existing Stripe account to event if user completed banking setup.
// Does NOT create Stripe accounts; those are created only when user completes
// banking onboarding (personal-info flow step 3).
// ============================================
exports.onEventCreated = onDocumentCreated('events/{eventId}', async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        console.log('No data associated with the event');
        return null;
    }
    const eventData = snapshot.data();
    const eventId = event.params.eventId;
    const creatorId = eventData.creatorId;

    console.log(`🎉 New event created: ${eventId} by user: ${creatorId}`);

    try {
        // 1. Check stripeAccounts first (set when user completes banking onboarding)
        const stripeAccountDoc = await db.collection('stripeAccounts').doc(creatorId).get();
        let accountId = stripeAccountDoc.exists ? stripeAccountDoc.data()?.accountId : null;

        // 2. Fallback: check users.stripeAccountId (legacy or synced from elsewhere)
        if (!accountId) {
            const userDoc = await db.collection('users').doc(creatorId).get();
            if (userDoc.exists) {
                accountId = userDoc.data()?.stripeAccountId || null;
            }
        }

        if (accountId) {
            console.log(`✅ Attaching existing Stripe account ${accountId} to event ${eventId}`);
            await snapshot.ref.update({
                stripeAccountId: accountId,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return { success: true, accountId };
        }

        // User has not completed banking setup yet; do NOT create a Stripe account
        console.log(`ℹ️ User ${creatorId} has no Stripe account yet. Complete banking setup to receive payments.`);
        await snapshot.ref.update({
            needsBankingSetup: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return null;
    } catch (error) {
        console.error(`❌ Error in onEventCreated for event ${eventId}:`, error);
        await snapshot.ref.update({
            stripeSetupFailed: true,
            stripeSetupError: error.message,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: false, error: error.message };
    }
});

