const admin = require("firebase-admin");
const { onSchedule } = require("firebase-functions/v2/scheduler");

const db = admin.firestore();
const PROVISIONING_COLLECTION = "provisioningTasks";
const STALE_THRESHOLD_MS = 5 * 60 * 1000;
const MAX_RETRIES = 3;

exports.provisioningWatchdog = onSchedule(
    { schedule: "every 5 minutes", timeZone: "America/Los_Angeles" },
    async () => {
        const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);

        let snapshot;
        try {
            snapshot = await db
                .collection(PROVISIONING_COLLECTION)
                .where("status", "in", ["phase1", "waiting_for_activation", "phase3"])
                .where("updatedAt", "<", cutoff)
                .get();
        } catch (err) {
            console.error("[provisioningWatchdog] query failed:", err.message);
            return;
        }

        if (snapshot.empty) {
            return;
        }

        console.log(`[provisioningWatchdog] found ${snapshot.size} stuck task(s)`);

        const Stripe = require("stripe");
        const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
        const stripeService = require("../stripeService");
        const { createProvisioningService } = require("../services/provisioningService");
        const provisioningService = createProvisioningService(stripe, stripeService);

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const uid = doc.id;
            const retryCount = data.retryCount || 0;

            if (retryCount >= MAX_RETRIES) {
                console.log(`[provisioningWatchdog] uid=${uid} max retries reached (${retryCount}), marking failed`);
                await doc.ref.update({
                    status: "failed",
                    step: "Max retries exceeded",
                    error: "Provisioning failed after multiple attempts. Please contact support.",
                    retryable: false,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                continue;
            }

            const accountId = data.accountId || null;
            if (!accountId) {
                const stripeDoc = await db.collection("stripeAccounts").doc(uid).get();
                if (!stripeDoc.exists || !stripeDoc.data().accountId) {
                    await doc.ref.update({
                        status: "failed",
                        step: "No Stripe account found",
                        error: "Cannot retry: no Stripe account ID",
                        retryable: false,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    continue;
                }
            }

            const resolvedAccountId = accountId || (await db.collection("stripeAccounts").doc(uid).get()).data().accountId;

            if (data.status === "waiting_for_activation") {
                await handleWaitingTask(doc, uid, resolvedAccountId, data, retryCount, stripe, provisioningService);
            } else {
                await handleStuckTask(doc, uid, resolvedAccountId, data, retryCount, provisioningService);
            }
        }
    }
);

async function handleWaitingTask(doc, uid, accountId, data, retryCount, stripe, provisioningService) {
    const financialAccountId = data.financialAccountId;
    if (!financialAccountId) {
        console.error(`[provisioningWatchdog] uid=${uid} waiting_for_activation but no FA ID`);
        await doc.ref.update({
            status: "failed",
            step: "Missing financial account",
            error: "No financial account ID found for activation check",
            retryable: false,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return;
    }

    try {
        const fa = await stripe.treasury.financialAccounts.retrieve(
            financialAccountId,
            { expand: ["features"] },
            { stripeAccount: accountId }
        );
        const cardIssuingStatus = fa.features?.card_issuing?.status;
        console.log(`[provisioningWatchdog] uid=${uid} FA card_issuing=${cardIssuingStatus}`);

        if (cardIssuingStatus === "active") {
            console.log(`[provisioningWatchdog] uid=${uid} FA active, running phase3`);
            await provisioningService.runPhase3(uid, accountId, financialAccountId, data.body || {});
        } else {
            await doc.ref.update({
                retryCount: retryCount + 1,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`[provisioningWatchdog] uid=${uid} FA not active yet, retry ${retryCount + 1}/${MAX_RETRIES}`);
        }
    } catch (err) {
        console.error(`[provisioningWatchdog] uid=${uid} FA check failed: ${err.message}`);
        await doc.ref.update({
            retryCount: retryCount + 1,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
}

async function handleStuckTask(doc, uid, accountId, data, retryCount, provisioningService) {
    console.log(`[provisioningWatchdog] uid=${uid} stuck at ${data.status}, retry ${retryCount + 1}/${MAX_RETRIES}`);

    try {
        await doc.ref.update({
            retryCount: retryCount + 1,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        provisioningService.runProvisioning(uid, accountId, data.body || {}).catch((err) => {
            console.error(`[provisioningWatchdog] retry failed for uid=${uid}: ${err.message}`);
        });
    } catch (err) {
        console.error(`[provisioningWatchdog] failed to set up retry for uid=${uid}: ${err.message}`);
    }
}
