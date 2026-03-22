const admin = require("firebase-admin");
const stripeAccountRepository = require("../repositories/stripeAccountRepository");
const userRepository = require("../repositories/userRepository");

function getDb() {
    return admin.firestore();
}

const PROVISIONING_COLLECTION = "provisioningTasks";

async function updateProvisioningStatus(uid, data) {
    await getDb().collection(PROVISIONING_COLLECTION).doc(uid).update({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}

function createProvisioningService(stripe, stripeService) {

    /**
     * Phase 1 only — sets up capabilities, creates Financial Account,
     * then exits with status "waiting_for_activation".
     * Phase 3 is triggered externally by webhook or cron.
     */
    async function runProvisioning(uid, accountId, body) {
        const TAG = `[provisioning uid=${uid}]`;
        console.log(`${TAG} starting`);

        try {
            // ── Phase 1: Capabilities + Financial Account ──
            await updateProvisioningStatus(uid, {
                status: "phase1",
                step: "Setting up capabilities...",
            });

            const tosDate = Math.floor(Date.now() / 1000);
            const tosIp = body?.ip || "127.0.0.1";

            const [capResult, updateResult] = await Promise.allSettled([
                stripeService.updateAccountCapabilities(stripe, accountId, {
                    firebaseUserId: uid,
                }),
                stripe.accounts.update(accountId, {
                    business_profile: {
                        annual_revenue: {
                            amount: 10000_00,
                            currency: "usd",
                            fiscal_year_end: "2025-12-31",
                        },
                        estimated_worker_count: 1,
                    },
                    settings: {
                        card_issuing: {
                            tos_acceptance: { date: tosDate, ip: tosIp },
                        },
                        treasury: {
                            tos_acceptance: { date: tosDate, ip: tosIp },
                        },
                    },
                }),
            ]);

            if (capResult.status === "rejected") {
                console.error(`${TAG} capabilities request failed: ${capResult.reason?.message}`);
                throw capResult.reason;
            }
            if (updateResult.status === "rejected") {
                console.warn(`${TAG} account update failed: ${updateResult.reason?.message}`);
            }

            console.log(`${TAG} capabilities requested, creating financial account...`);

            const fa = await stripe.treasury.financialAccounts.create(
                {
                    supported_currencies: ["usd"],
                    features: {
                        card_issuing: { requested: true },
                        financial_addresses: { aba: { requested: true } },
                        intra_stripe_flows: { requested: true },
                    },
                    metadata: { uid, accountId },
                },
                { stripeAccount: accountId }
            );

            const financialAccountId = fa.id;
            await stripeAccountRepository.update(uid, { financialAccountId });

            // Exit Phase 1 → webhook picks up from here
            await updateProvisioningStatus(uid, {
                status: "waiting_for_activation",
                step: "Waiting for card issuing activation...",
                financialAccountId,
                accountId,
                body,
            });

            console.log(`${TAG} phase1 done, FA=${financialAccountId}, waiting for webhook`);

        } catch (err) {
            console.error(`${TAG} provisioning failed: ${err.message}`);
            try {
                await updateProvisioningStatus(uid, {
                    status: "failed",
                    step: "Something went wrong",
                    error: err.message,
                    retryable: true,
                });
            } catch (writeErr) {
                console.error(`${TAG} failed to write failure status: ${writeErr.message}`);
            }
        }
    }

    /**
     * Phase 3 — creates cardholder + virtual card.
     * Called by webhook or cron fallback. Must be idempotent.
     */
    async function runPhase3(uid, accountId, financialAccountId, body) {
        const TAG = `[provisioning-phase3 uid=${uid}]`;

        const taskDoc = await getDb().collection(PROVISIONING_COLLECTION).doc(uid).get();
        if (!taskDoc.exists) {
            console.warn(`${TAG} no provisioning task found, skipping`);
            return;
        }
        const currentStatus = taskDoc.data().status;
        if (currentStatus === "complete") {
            console.log(`${TAG} already complete, skipping (idempotent)`);
            return;
        }

        console.log(`${TAG} starting phase3`);

        await updateProvisioningStatus(uid, {
            status: "phase3",
            step: "Creating your card...",
        });

        const {
            firstName,
            lastName,
            email,
            phone,
            address,
            city,
            state,
            zipCode,
            dob,
            ip,
        } = body || {};

        const tosIp = ip || "127.0.0.1";
        const isTestMode = (process.env.STRIPE_SECRET_KEY || "").startsWith("sk_test_");
        const ISSUING_TEST_PHONE = "+15555555555";
        const raw = (phone || "").toString().replace(/\D/g, "");
        const isPlaceholder = !phone || raw === "0000000000" || raw === "10000000000";
        const cardholderPhone = (isTestMode && isPlaceholder) ? ISSUING_TEST_PHONE : (phone || undefined);
        const cardholderName = `${firstName || ""} ${lastName || ""}`.trim();

        const cardholder = await stripeService.createIssuingCardholder(stripe, {
            accountId,
            name: cardholderName,
            email: email || "",
            phone: cardholderPhone,
            line1: address || "",
            city: city || "",
            state: state || "",
            postal_code: zipCode || "",
            dob: dob && typeof dob === "object" ? dob : { day: 1, month: 1, year: 1990 },
            tosIp,
        });

        await stripeAccountRepository.update(uid, { cardholderId: cardholder.id });

        const card = await stripeService.createVirtualCard(stripe, {
            accountId,
            cardholderId: cardholder.id,
            financialAccountId,
        });

        await stripeAccountRepository.update(uid, { virtualCardId: card.id });
        await userRepository.update(uid, { virtualCardId: card.id }).catch(() => {});

        await updateProvisioningStatus(uid, {
            status: "complete",
            step: "Card ready!",
            virtualCardId: card.id,
            cardholderId: cardholder.id,
            financialAccountId,
            body: admin.firestore.FieldValue.delete(),
        });

        console.log(`${TAG} complete, cardId=${card.id}`);
    }

    return { runProvisioning, runPhase3 };
}

module.exports = { createProvisioningService, PROVISIONING_COLLECTION };
