const { AppError, handleError } = require("../utils/errors");
const stripeService = require("../stripeService");

const CHILD_ACCOUNTS_COLLECTION = "childAccounts";

/**
 * Look up the child account + parent's Stripe account/card, verifying ownership.
 * Returns { childDoc, accountId, cardId }.
 */
async function resolveChildCard(uid, childAccountId) {
    const admin = require("firebase-admin");
    const db = admin.firestore();

    if (!childAccountId) {
        throw new AppError("Missing childAccountId", { statusCode: 400 });
    }

    const childSnap = await db.collection(CHILD_ACCOUNTS_COLLECTION).doc(childAccountId).get();
    if (!childSnap.exists) {
        throw new AppError("Child account not found", { statusCode: 404 });
    }
    const childDoc = childSnap.data();
    if (childDoc.creatorId !== uid) {
        throw new AppError("Not authorized to manage this child's card", { statusCode: 403 });
    }

    const userSnap = await db.collection("users").doc(uid).get();
    const userData = userSnap.exists ? userSnap.data() : {};
    const accountId = userData.stripeAccountId;
    if (!accountId) {
        throw new AppError("Parent has no Stripe account", { statusCode: 400 });
    }

    const cardId = childDoc.stripeCardId || userData.virtualCardId;
    if (!cardId) {
        throw new AppError("No virtual card found for this child", { statusCode: 400 });
    }

    return { childDoc, accountId, cardId };
}

/**
 * GET /getChildCard?childAccountId=...
 * Returns card details, status, spending controls, and balance from Stripe.
 */
async function getChildCard(req, res) {
    const uid = req.user.uid;
    const { childAccountId } = req.query;
    try {
        const { childDoc, accountId, cardId } = await resolveChildCard(uid, childAccountId);
        const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
        const card = await stripeService.getIssuingCard(stripe, { accountId, cardId });

        const admin = require("firebase-admin");
        const db = admin.firestore();
        const faId = (await db.collection("users").doc(uid).get()).data()?.financialAccountId;
        let balance = 0;
        if (faId) {
            try {
                const fa = await stripeService.getFinancialAccountBalance(stripe, accountId, faId);
                balance = fa.balance?.cash?.usd || 0;
            } catch (_) { /* non-fatal */ }
        }

        res.json({
            success: true,
            childName: childDoc.childName || null,
            card: {
                id: card.id,
                last4: card.last4,
                expMonth: card.exp_month,
                expYear: card.exp_year,
                status: card.status,
                brand: card.brand || "Visa",
                spendingControls: card.spending_controls || {},
            },
            balance,
        });
    } catch (err) {
        handleError(err, res);
    }
}

/**
 * POST /freezeChildCard  { childAccountId }
 */
async function freezeChildCard(req, res) {
    const uid = req.user.uid;
    const { childAccountId } = req.body;
    try {
        const { accountId, cardId } = await resolveChildCard(uid, childAccountId);
        const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
        await stripeService.updateCardStatus(stripe, { accountId, cardId, status: "inactive" });
        res.json({ success: true });
    } catch (err) {
        handleError(err, res);
    }
}

/**
 * POST /unfreezeChildCard  { childAccountId }
 */
async function unfreezeChildCard(req, res) {
    const uid = req.user.uid;
    const { childAccountId } = req.body;
    try {
        const { accountId, cardId } = await resolveChildCard(uid, childAccountId);
        const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
        await stripeService.updateCardStatus(stripe, { accountId, cardId, status: "active" });
        res.json({ success: true });
    } catch (err) {
        handleError(err, res);
    }
}

/**
 * POST /updateChildSpendingLimits  { childAccountId, daily?, weekly?, monthly?, perTransaction? }
 * Amounts are in cents.
 */
async function updateChildSpendingLimits(req, res) {
    const uid = req.user.uid;
    const { childAccountId, daily, weekly, monthly, perTransaction } = req.body;
    try {
        const { accountId, cardId } = await resolveChildCard(uid, childAccountId);
        const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

        const spendingLimits = [];
        if (daily != null) spendingLimits.push({ amount: Number(daily), interval: "daily" });
        if (weekly != null) spendingLimits.push({ amount: Number(weekly), interval: "weekly" });
        if (monthly != null) spendingLimits.push({ amount: Number(monthly), interval: "monthly" });
        if (perTransaction != null) spendingLimits.push({ amount: Number(perTransaction), interval: "per_authorization" });

        if (spendingLimits.length === 0) {
            return res.status(400).json({ error: "Provide at least one limit (daily, weekly, monthly, perTransaction)" });
        }

        await stripeService.updateCardSpendingControls(stripe, { accountId, cardId, spendingLimits });

        const admin = require("firebase-admin");
        const db = admin.firestore();
        await db.collection("virtualCards").doc(cardId).set(
            { spendingLimit: { daily, weekly, monthly, perTransaction }, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
            { merge: true }
        );

        res.json({ success: true });
    } catch (err) {
        handleError(err, res);
    }
}

/**
 * POST /updateChildBlockedCategories  { childAccountId, blockedCategories: string[] }
 */
async function updateChildBlockedCategories(req, res) {
    const uid = req.user.uid;
    const { childAccountId, blockedCategories } = req.body;
    try {
        if (!Array.isArray(blockedCategories)) {
            return res.status(400).json({ error: "blockedCategories must be an array" });
        }
        const { accountId, cardId } = await resolveChildCard(uid, childAccountId);
        const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
        await stripeService.updateCardSpendingControls(stripe, { accountId, cardId, blockedCategories });
        res.json({ success: true });
    } catch (err) {
        handleError(err, res);
    }
}

/**
 * GET /getChildTransactions?childAccountId=...&limit=20&startingAfter=...
 */
async function getChildTransactions(req, res) {
    const uid = req.user.uid;
    const { childAccountId, limit, startingAfter } = req.query;
    try {
        const { accountId, cardId } = await resolveChildCard(uid, childAccountId);
        const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
        const result = await stripeService.listIssuingTransactions(stripe, {
            accountId,
            cardId,
            limit: Math.min(Number(limit) || 20, 100),
            startingAfter: startingAfter || undefined,
        });

        const transactions = result.data.map((t) => ({
            id: t.id,
            amount: t.amount,
            currency: t.currency,
            merchantName: t.merchant_data?.name || "Unknown",
            merchantCategory: t.merchant_data?.category || "other",
            merchantCity: t.merchant_data?.city || null,
            merchantCountry: t.merchant_data?.country || null,
            type: t.type,
            created: t.created,
            status: t.type === "refund" ? "refunded" : "completed",
        }));

        res.json({
            success: true,
            transactions,
            hasMore: result.has_more,
        });
    } catch (err) {
        handleError(err, res);
    }
}

/**
 * GET /getChildSpendingSummary?childAccountId=...&period=month
 * Aggregates Issuing transactions by category/merchant.
 */
async function getChildSpendingSummary(req, res) {
    const uid = req.user.uid;
    const { childAccountId, period = "month" } = req.query;
    try {
        const { accountId, cardId } = await resolveChildCard(uid, childAccountId);
        const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

        const now = new Date();
        let created = {};
        if (period === "day") {
            const start = new Date(now); start.setHours(0, 0, 0, 0);
            created = { gte: Math.floor(start.getTime() / 1000) };
        } else if (period === "week") {
            const start = new Date(now); start.setDate(start.getDate() - 7);
            created = { gte: Math.floor(start.getTime() / 1000) };
        } else {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            created = { gte: Math.floor(start.getTime() / 1000) };
        }

        let allTxns = [];
        let startingAfter;
        let hasMore = true;
        while (hasMore) {
            const batch = await stripe.issuing.transactions.list(
                { card: cardId, limit: 100, created, ...(startingAfter ? { starting_after: startingAfter } : {}) },
                { stripeAccount: accountId }
            );
            allTxns = allTxns.concat(batch.data);
            hasMore = batch.has_more;
            if (batch.data.length > 0) startingAfter = batch.data[batch.data.length - 1].id;
        }

        const byCategory = {};
        const merchantMap = {};
        let totalSpent = 0;
        let largest = 0;

        for (const t of allTxns) {
            const absAmount = Math.abs(t.amount);
            if (t.amount < 0) {
                totalSpent += absAmount;
                if (absAmount > largest) largest = absAmount;
            }
            const cat = t.merchant_data?.category || "other";
            byCategory[cat] = (byCategory[cat] || 0) + absAmount;

            const mn = t.merchant_data?.name || "Unknown";
            if (!merchantMap[mn]) merchantMap[mn] = { name: mn, amount: 0, count: 0 };
            merchantMap[mn].amount += absAmount;
            merchantMap[mn].count += 1;
        }

        const topMerchants = Object.values(merchantMap).sort((a, b) => b.amount - a.amount).slice(0, 5);

        res.json({
            success: true,
            period,
            totalSpent,
            transactionCount: allTxns.length,
            averageTransaction: allTxns.length > 0 ? Math.round(totalSpent / allTxns.length) : 0,
            largestTransaction: largest,
            byCategory,
            topMerchants,
        });
    } catch (err) {
        handleError(err, res);
    }
}

/**
 * POST /testLinkChildAccount  (test-mode only)
 * Provisions a full Stripe Connect account with Treasury + Issuing for the
 * authenticated parent, creates a childAccounts doc, and funds the wallet.
 * This can take 2-5 minutes due to Stripe activation polling.
 */
async function testLinkChildAccount(req, res) {
    const uid = req.user.uid;
    const admin = require("firebase-admin");
    const db = admin.firestore();
    const Stripe = require("stripe");
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const stripeServiceLocal = require("../stripeService");
    const { createProvisioningService, PROVISIONING_COLLECTION } = require("../services/provisioningService");
    const { createStripeConnectService } = require("../services/stripeConnectService");
    const { handleFAFeaturesUpdated } = require("../controllers/webhookController");

    const provisioningService = createProvisioningService(stripe, stripeServiceLocal);
    const stripeConnectService = createStripeConnectService(stripe, stripeServiceLocal, provisioningService);

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    try {
        const userSnap = await db.collection("users").doc(uid).get();
        const userData = userSnap.exists ? userSnap.data() : {};

        // Check for existing child account
        const existingChild = await db.collection(CHILD_ACCOUNTS_COLLECTION)
            .where("creatorId", "==", uid).limit(1).get();
        if (!existingChild.empty) {
            return res.json({ success: true, childAccountId: existingChild.docs[0].id, alreadyLinked: true });
        }

        // Find or create an event for linking
        let eventId = null;
        const eventsSnap = await db.collection("events")
            .where("creatorId", "==", uid).limit(1).get();
        if (!eventsSnap.empty) {
            eventId = eventsSnap.docs[0].id;
        } else {
            const eventRef = await db.collection("events").add({
                eventName: "Test Child's Birthday",
                eventType: "birthday",
                childName: "Test Child",
                childAge: 10,
                eventDate: new Date(Date.now() + 14 * 86400000).toISOString(),
                suggestedAmount: 5000,
                venue: "Home",
                description: "Test event for child linking",
                creatorId: uid,
                creatorEmail: userData.email || "test@creditkid.app",
                status: "active",
                guestCount: 0,
                totalGifted: 0,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            eventId = eventRef.id;
        }

        // Check if parent already has a fully provisioned account
        const taskSnap = await db.collection(PROVISIONING_COLLECTION).doc(uid).get();
        let accountId = userData.stripeAccountId;
        let financialAccountId = taskSnap.exists ? taskSnap.data().financialAccountId : null;
        let cardId = taskSnap.exists ? taskSnap.data().virtualCardId : null;

        if (!accountId || !cardId) {
            // Full provisioning needed
            const runId = Date.now();
            const result = await stripeConnectService.createCustomConnectAccount(uid, {
                country: "US",
                firstName: userData.fullName?.split(" ")[0] || "Test",
                lastName: userData.fullName?.split(" ").slice(1).join(" ") || "Parent",
                email: userData.email || `test-link-${runId}@creditkid.app`,
                phone: userData.phone || `+1555${String(runId).slice(-7)}`,
                dob: "01/01/1990",
                address: "123 Main St",
                city: "San Francisco",
                state: "CA",
                zipCode: "94111",
                ssnLast4: "0000",
                routingNumber: "110000000",
                accountNumber: "000123456789",
                accountHolderName: userData.fullName || "Test Parent",
                useTestDocument: true,
            });
            accountId = result.accountId;

            // Poll for waiting_for_activation
            for (let i = 0; i < 30; i++) {
                await sleep(2000);
                const snap = await db.collection(PROVISIONING_COLLECTION).doc(uid).get();
                if (!snap.exists) continue;
                const data = snap.data();
                if (data.status === "waiting_for_activation") {
                    financialAccountId = data.financialAccountId;
                    break;
                }
                if (data.status === "failed") throw new Error(`Provisioning failed: ${data.step}`);
            }
            if (!financialAccountId) throw new Error("Timed out waiting for provisioning");

            // Poll for FA card_issuing active
            for (let i = 0; i < 40; i++) {
                const fa = await stripe.treasury.financialAccounts.retrieve(
                    financialAccountId, { expand: ["features"] }, { stripeAccount: accountId }
                );
                if (fa.features?.card_issuing?.status === "active") {
                    await handleFAFeaturesUpdated(db, provisioningService, {
                        id: fa.id, features: fa.features, metadata: fa.metadata,
                    });
                    break;
                }
                await sleep(3000);
            }

            // Wait for complete
            for (let i = 0; i < 15; i++) {
                const snap = await db.collection(PROVISIONING_COLLECTION).doc(uid).get();
                if (snap.exists && snap.data().status === "complete") {
                    cardId = snap.data().virtualCardId;
                    break;
                }
                await sleep(1000);
            }
            if (!cardId) throw new Error("Card was not provisioned");
        }

        // Create childAccounts doc
        const childRef = await db.collection(CHILD_ACCOUNTS_COLLECTION).add({
            creatorId: uid,
            userId: `test-child-${uid}`,
            eventId,
            childName: "Test Child",
            phoneNumber: "+10000000000",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Fund via Treasury
        if (financialAccountId) {
            for (let i = 0; i < 20; i++) {
                const fa = await stripe.treasury.financialAccounts.retrieve(
                    financialAccountId, { expand: ["features"] }, { stripeAccount: accountId }
                );
                if (fa.features?.financial_addresses?.aba?.status === "active") break;
                await sleep(3000);
            }
            await stripe.testHelpers.treasury.receivedCredits.create(
                { financial_account: financialAccountId, amount: 5000, currency: "usd", network: "ach", description: "Fund" },
                { stripeAccount: accountId }
            );
            await sleep(2000);
        }

        res.json({ success: true, childAccountId: childRef.id });
    } catch (err) {
        console.error("[testLinkChildAccount] Error:", err.message);
        handleError(err, res);
    }
}

module.exports = {
    getChildCard,
    freezeChildCard,
    unfreezeChildCard,
    updateChildSpendingLimits,
    updateChildBlockedCategories,
    getChildTransactions,
    getChildSpendingSummary,
    testLinkChildAccount,
};
