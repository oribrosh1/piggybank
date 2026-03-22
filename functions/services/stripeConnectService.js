const admin = require("firebase-admin");
const stripeAccountRepository = require("../repositories/stripeAccountRepository");
const userRepository = require("../repositories/userRepository");

const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || process.env.APP_BASE_URL || "https://creditkid.vercel.app";

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

function normalizeUSZip(zipCode) {
    if (zipCode == null) return null;
    const digits = String(zipCode).replace(/\D/g, "");
    if (digits.length < 5) return null;
    return digits.slice(0, 5);
}

/**
 * @param {import("stripe").Stripe} stripe
 * @param {object} stripeService
 * @param {object} [provisioningService] - optional, injected for fire-and-forget provisioning
 */
function createStripeConnectService(stripe, stripeService, provisioningService) {
    async function getOrCreateProfileSlug(uid) {
        const user = await userRepository.getById(uid);
        let profileSlug = user?.profileSlug;
        if (!profileSlug) {
            const name = (user?.fullName || "member").trim().toLowerCase()
                .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "") || "member";
            profileSlug = `${name}-${uid.slice(0, 8)}`;
            await userRepository.setProfileSlug(uid, profileSlug);
        }
        return profileSlug;
    }

    async function createCustomConnectAccount(uid, body) {
        const existing = await stripeAccountRepository.getByUid(uid);
        if (existing && existing.accountId) {
            return { accountId: existing.accountId, success: true, existing: true };
        }

        const profileSlug = await getOrCreateProfileSlug(uid);
        const profileUrl = `${PUBLIC_BASE_URL}/users/${profileSlug}`;

        const {
            country = "US",
            firstName,
            lastName,
            email,
            phone,
            dob,
            address,
            address2,
            city,
            state,
            zipCode,
            ssnLast4,
            routingNumber,
            accountNumber,
            accountHolderName,
        } = body;

        const dobObj = parseDobString(dob);
        const isTestMode = (process.env.STRIPE_SECRET_KEY || "").toString().startsWith("sk_test_");
        const accountPhone = isTestMode ? "0000000000" : phone;
        const normalizedZip = country === "US" ? normalizeUSZip(zipCode) : (zipCode ? String(zipCode).trim() : undefined);

        if (country === "US" && (!normalizedZip || normalizedZip.length !== 5)) {
            const err = new Error("Please enter a valid 5-digit US ZIP code.");
            err.code = "postal_code_invalid";
            err.param = "zipCode";
            throw err;
        }

        const account = await stripeService.createCustomConnectAccount(stripe, {
            country,
            profileUrl,
            firstName,
            lastName,
            email,
            phone: accountPhone,
            dob: dobObj,
            address,
            address2,
            city,
            state,
            zipCode: normalizedZip || zipCode,
            ssnLast4,
            firebaseUserId: uid,
        });

        if (body.useTestDocument && isTestMode) {
            try {
                await stripe.accounts.update(account.id, {
                    individual: { verification: { document: { front: "file_identity_document_success" } } },
                    metadata: { firebase_user_id: uid },
                });
            } catch (e) {
                console.warn("[StripeConnectService] Test document attach failed", e.message);
            }
        }

        if (isTestMode) {
            try {
                const accountToken = await stripe.tokens.create({
                    account: {
                        business_type: "individual",
                        individual: { id_number: "000000000" },
                    },
                });
                await stripe.accounts.update(account.id, {
                    account_token: accountToken.id,
                    metadata: { firebase_user_id: uid },
                });
            } catch (e) {
                console.warn("[StripeConnectService] Test SSN token failed", e.message);
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
                } catch (e) {
                    console.warn("[StripeConnectService] Add bank account failed", e.message);
                }
            }
        }

        await stripeAccountRepository.set(uid, {
            accountId: account.id,
            country,
            business_type: "individual",
            type: "custom",
            status: "pending",
            cardIssuingActive: false,
        });
        await userRepository.setStripeAccount(uid, account.id, "pending").catch(() => {});

        if (isTestMode) {
            try {
                await stripe.paymentIntents.create({
                    amount: 1000,
                    currency: "usd",
                    payment_method: "pm_card_visa",
                    confirm: true,
                    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
                    transfer_data: { destination: account.id },
                    description: "Welcome test credit",
                    metadata: { testPayment: "true", userId: uid, welcomeCredit: "true" },
                });
            } catch (e) {
                console.warn("[StripeConnectService] Test welcome balance failed", e.message);
            }
        }

        if (provisioningService) {
            const db = admin.firestore();
            await db.collection("provisioningTasks").doc(uid).set({
                uid,
                accountId: account.id,
                status: "phase1",
                step: "Starting provisioning...",
                retryCount: 0,
                body: {
                    firstName, lastName, email, phone,
                    address, city, state, zipCode,
                    dob: dobObj,
                },
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            provisioningService.runProvisioning(uid, account.id, {
                firstName, lastName, email, phone,
                address, city, state, zipCode,
                dob: dobObj,
            }).catch(async (err) => {
                console.error(`[StripeConnectService] fire-and-forget provisioning failed uid=${uid}: ${err.message}`);
            });
        }

        return { accountId: account.id, status: "provisioning", success: true, existing: false };
    }

    async function createOnboardingLink(uid) {
        const doc = await stripeAccountRepository.getByUid(uid);
        if (!doc || !doc.accountId) {
            const err = new Error("No Connect account. Call createCustomConnectAccount first.");
            err.statusCode = 400;
            throw err;
        }
        const returnPath = (process.env.STRIPE_RETURN_PATH || "banking/setup/success").replace(/^\//, "");
        const refreshPath = (process.env.STRIPE_REFRESH_PATH || "banking/setup/stripe-connection?refresh=true").replace(/^\//, "");
        const baseUrl = (PUBLIC_BASE_URL || "https://creditkid.vercel.app").replace(/\/+$/, "");
        const returnUrl = `${baseUrl}/${returnPath}`.replace(/([^:]\/)\/+/g, "$1");
        const refreshUrl = `${baseUrl}/${refreshPath}`.replace(/([^:]\/)\/+/g, "$1");
        const accountLink = await stripeService.createAccountLink(stripe, {
            accountId: doc.accountId,
            returnUrl,
            refreshUrl,
        });
        return { accountId: doc.accountId, url: accountLink.url, success: true };
    }

    async function getAccountStatus(uid) {
        const doc = await stripeAccountRepository.getByUid(uid);
        if (!doc) return { exists: false };
        const account = await stripe.accounts.retrieve(doc.accountId);
        if (!account.metadata || !account.metadata.firebase_user_id) {
            try {
                await stripe.accounts.update(doc.accountId, {
                    metadata: { firebase_user_id: uid },
                });
            } catch (e) {
                console.warn("[StripeConnectService] Backfill metadata failed", e.message);
            }
        }
        await stripeAccountRepository.update(uid, {
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            details_submitted: account.details_submitted,
            requirements: account.requirements,
            capabilities: account.capabilities,
            cardIssuingActive: account.capabilities?.card_issuing === "active",
        });
        return {
            exists: true,
            accountId: account.id,
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            details_submitted: account.details_submitted,
            requirements: account.requirements,
            capabilities: account.capabilities,
        };
    }

    async function updateAccountCapabilities(uid) {
        const doc = await stripeAccountRepository.getByUid(uid);
        if (!doc || !doc.accountId) {
            const err = new Error("No Stripe account found");
            err.statusCode = 404;
            throw err;
        }
        const account = await stripeService.updateAccountCapabilities(stripe, doc.accountId, { firebaseUserId: uid });
        return { accountId: account.id, capabilities: account.capabilities, success: true };
    }

    async function getFinancialAccountBalance(uid) {
        const doc = await stripeAccountRepository.getByUid(uid);
        if (!doc || !doc.accountId) {
            const err = new Error("No Stripe account found");
            err.statusCode = 404;
            throw err;
        }
        if (!doc.financialAccountId) {
            const err = new Error("No financial account found. Provisioning may still be in progress.");
            err.statusCode = 404;
            throw err;
        }
        const result = await stripeService.getFinancialAccountBalance(stripe, doc.accountId, doc.financialAccountId);
        return { ...result, success: true };
    }

    async function retryProvisioning(uid) {
        if (!provisioningService) {
            const err = new Error("Provisioning service not available");
            err.statusCode = 500;
            throw err;
        }
        const db = admin.firestore();
        const taskDoc = await db.collection("provisioningTasks").doc(uid).get();
        if (!taskDoc.exists) {
            const err = new Error("No provisioning task found");
            err.statusCode = 404;
            throw err;
        }
        const task = taskDoc.data();
        if (task.status !== "failed") {
            const err = new Error("Can only retry failed tasks");
            err.statusCode = 400;
            throw err;
        }

        const doc = await stripeAccountRepository.getByUid(uid);
        if (!doc || !doc.accountId) {
            const err = new Error("No Stripe account found");
            err.statusCode = 404;
            throw err;
        }

        await db.collection("provisioningTasks").doc(uid).update({
            status: "phase1",
            step: "Retrying provisioning...",
            error: admin.firestore.FieldValue.delete(),
            retryCount: (task.retryCount || 0) + 1,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        provisioningService.runProvisioning(uid, doc.accountId, task.body || {}).catch((err) => {
            console.error(`[StripeConnectService] retry provisioning failed uid=${uid}: ${err.message}`);
        });

        return { status: "retrying", success: true };
    }

    async function createIssuingCardholder(uid, body) {
        const doc = await stripeAccountRepository.getByUid(uid);
        if (!doc || !doc.accountId) {
            const err = new Error("No Stripe account found");
            err.statusCode = 404;
            throw err;
        }
        if (doc.cardholderId) {
            return { cardholderId: doc.cardholderId, success: true, existing: true };
        }
        const cardholder = await stripeService.createIssuingCardholder(stripe, {
            accountId: doc.accountId,
            ...body,
        });
        await stripeAccountRepository.update(uid, { cardholderId: cardholder.id });
        return { cardholderId: cardholder.id, success: true, existing: false };
    }

    async function createVirtualCard(uid, body) {
        const doc = await stripeAccountRepository.getByUid(uid);
        if (!doc || !doc.accountId) {
            const err = new Error("No Stripe account found");
            err.statusCode = 404;
            throw err;
        }
        if (doc.virtualCardId) {
            const err = new Error("You already have a virtual card.");
            err.code = "card_exists";
            err.statusCode = 400;
            throw err;
        }
        if (!doc.cardholderId) {
            const err = new Error("Create cardholder first (createIssuingCardholder)");
            err.statusCode = 400;
            throw err;
        }
        const card = await stripeService.createVirtualCard(stripe, {
            accountId: doc.accountId,
            cardholderId: doc.cardholderId,
            financialAccountId: doc.financialAccountId || undefined,
            ...body,
        });
        await stripeAccountRepository.update(uid, { virtualCardId: card.id });
        await userRepository.update(uid, { virtualCardId: card.id }).catch(() => {});
        return { cardId: card.id, last4: card.last4, status: card.status, success: true };
    }

    async function getCardDetails(uid) {
        const doc = await stripeAccountRepository.getByUid(uid);
        if (!doc || !doc.accountId || !doc.virtualCardId) {
            const err = new Error("No card found. Create a virtual card first.");
            err.statusCode = 404;
            throw err;
        }
        const payload = await stripeService.getCardDetails(stripe, {
            accountId: doc.accountId,
            cardId: doc.virtualCardId,
        });
        return { ...payload, success: true };
    }

    async function createTestAuthorization(uid, amount) {
        const doc = await stripeAccountRepository.getByUid(uid);
        if (!doc || !doc.accountId || !doc.virtualCardId) {
            const err = new Error("No card found. Create a virtual card first (Issue Card step).");
            err.code = "no_card";
            err.statusCode = 400;
            throw err;
        }
        const authorization = await stripeService.createTestAuthorization(stripe, {
            accountId: doc.accountId,
            cardId: doc.virtualCardId,
            amount: Number(amount) || 1000,
        });
        return {
            authorizationId: authorization.id,
            amount: authorization.amount,
            currency: authorization.currency,
            approved: authorization.approved,
            status: authorization.status,
            success: true,
        };
    }

    async function handleWebhookAccountUpdated(account) {
        const row = await stripeAccountRepository.getByAccountId(account.id);
        if (!row) return;
        if (!account.metadata || !account.metadata.firebase_user_id) {
            try {
                await stripe.accounts.update(account.id, {
                    metadata: { firebase_user_id: row.uid },
                });
            } catch (e) {
                console.warn("[StripeConnectService] Webhook backfill metadata failed", e.message);
            }
        }
        const cardIssuingActive = account.capabilities?.card_issuing === "active";
        await stripeAccountRepository.update(row.uid, {
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            details_submitted: account.details_submitted,
            requirements: account.requirements,
            capabilities: account.capabilities,
            cardIssuingActive: cardIssuingActive || row.cardIssuingActive,
        });
        if (cardIssuingActive) {
            await userRepository.update(row.uid, { stripeAccountStatus: "approved" }).catch(() => {});
        }
    }

    async function getBalance(uid) {
        const doc = await stripeAccountRepository.getByUid(uid);
        if (!doc || !doc.accountId) {
            const err = new Error("No Stripe account found");
            err.statusCode = 404;
            throw err;
        }
        const balance = await stripeService.getConnectBalance(stripe, doc.accountId);
        return {
            available: balance.available || [],
            pending: balance.pending || [],
            success: true,
        };
    }

    async function getTransactions(uid, limit, starting_after) {
        const doc = await stripeAccountRepository.getByUid(uid);
        if (!doc || !doc.accountId) {
            const err = new Error("No Stripe account found");
            err.statusCode = 404;
            throw err;
        }
        const result = await stripeService.getBalanceTransactions(stripe, doc.accountId, { limit, starting_after });
        return {
            transactions: (result.data || []).map((t) => ({
                id: t.id,
                amount: t.amount,
                currency: t.currency,
                type: t.type,
                status: t.status,
                description: t.description,
                created: t.created,
                available_on: t.available_on,
                fee: t.fee,
                net: t.net,
            })),
            has_more: result.has_more,
            success: true,
        };
    }

    async function getAccountDetailsFunc(uid) {
        const doc = await stripeAccountRepository.getByUid(uid);
        if (!doc || !doc.accountId) {
            const err = new Error("No Stripe account found");
            err.statusCode = 404;
            throw err;
        }
        const account = await stripeService.getFullAccount(stripe, doc.accountId);
        const externalAccounts = (account.external_accounts?.data || []).map((ea) => ({
            id: ea.id,
            object: ea.object,
            bank_name: ea.bank_name || "",
            last4: ea.last4 || "",
            routing_number: ea.routing_number || "",
            currency: ea.currency || "usd",
            country: ea.country || "US",
            default_for_currency: !!ea.default_for_currency,
            status: ea.status || "new",
        }));
        return {
            accountId: account.id,
            type: account.type,
            country: account.country,
            default_currency: account.default_currency,
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            details_submitted: account.details_submitted,
            requirements: {
                currently_due: account.requirements?.currently_due || [],
                eventually_due: account.requirements?.eventually_due || [],
                past_due: account.requirements?.past_due || [],
                pending_verification: account.requirements?.pending_verification || [],
                disabled_reason: account.requirements?.disabled_reason || null,
            },
            capabilities: account.capabilities || {},
            business_type: account.business_type || "individual",
            individual: account.individual ? {
                first_name: account.individual.first_name || "",
                last_name: account.individual.last_name || "",
                email: account.individual.email || "",
                phone: account.individual.phone || "",
                dob: account.individual.dob || null,
                address: account.individual.address || null,
                verification: {
                    status: account.individual.verification?.status || "unverified",
                    document: {
                        front: account.individual.verification?.document?.front || null,
                        back: account.individual.verification?.document?.back || null,
                    },
                },
            } : null,
            settings: {
                payouts: account.settings?.payouts || {},
                payments: account.settings?.payments || {},
            },
            external_accounts: externalAccounts,
            cardholderId: doc.cardholderId || null,
            virtualCardId: doc.virtualCardId || null,
            created: account.created,
            success: true,
        };
    }

    async function getPayouts(uid, limit, starting_after) {
        const doc = await stripeAccountRepository.getByUid(uid);
        if (!doc || !doc.accountId) {
            const err = new Error("No Stripe account found");
            err.statusCode = 404;
            throw err;
        }
        const result = await stripeService.listPayouts(stripe, doc.accountId, { limit, starting_after });
        return {
            payouts: (result.data || []).map((p) => ({
                id: p.id,
                amount: p.amount,
                currency: p.currency,
                status: p.status,
                arrival_date: p.arrival_date,
                created: p.created,
                method: p.method,
                type: p.type,
                description: p.description,
                destination: typeof p.destination === "string" ? p.destination : p.destination?.id || "",
                failure_message: p.failure_message || null,
            })),
            has_more: result.has_more,
            success: true,
        };
    }

    async function createPayoutFunc(uid, amount, currency) {
        const doc = await stripeAccountRepository.getByUid(uid);
        if (!doc || !doc.accountId) {
            const err = new Error("No Stripe account found");
            err.statusCode = 404;
            throw err;
        }
        const payout = await stripeService.createPayout(stripe, doc.accountId, { amount, currency });
        return {
            payoutId: payout.id,
            amount: payout.amount,
            arrival_date: payout.arrival_date,
            success: true,
        };
    }

    async function addBankAccount(uid, body) {
        const doc = await stripeAccountRepository.getByUid(uid);
        if (!doc || !doc.accountId) {
            const err = new Error("No Stripe account found");
            err.statusCode = 404;
            throw err;
        }
        const bank = await stripeService.addBankAccount(stripe, doc.accountId, body);
        return {
            bankAccountId: bank.id,
            bank_name: bank.bank_name || "",
            last4: bank.last4 || "",
            success: true,
        };
    }

    async function updateAccountInfo(uid, body) {
        const doc = await stripeAccountRepository.getByUid(uid);
        if (!doc || !doc.accountId) {
            const err = new Error("No Stripe account found");
            err.statusCode = 404;
            throw err;
        }
        const account = await stripeService.updateAccountInfo(stripe, doc.accountId, body);
        return {
            accountId: account.id,
            requirements: {
                currently_due: account.requirements?.currently_due || [],
                eventually_due: account.requirements?.eventually_due || [],
                past_due: account.requirements?.past_due || [],
                pending_verification: account.requirements?.pending_verification || [],
                disabled_reason: account.requirements?.disabled_reason || null,
            },
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            success: true,
        };
    }

    async function acceptTermsOfService(uid, ip) {
        const doc = await stripeAccountRepository.getByUid(uid);
        if (!doc || !doc.accountId) {
            const err = new Error("No Stripe account found");
            err.statusCode = 404;
            throw err;
        }
        await stripeService.acceptTos(stripe, doc.accountId, ip);
        return { accountId: doc.accountId, tos_accepted: true, success: true };
    }

    async function testVerifyAccount(uid) {
        const doc = await stripeAccountRepository.getByUid(uid);
        if (!doc || !doc.accountId) {
            const err = new Error("No Stripe account found");
            err.statusCode = 404;
            throw err;
        }
        const accountId = doc.accountId;
        try {
            const accountToken = await stripe.tokens.create({
                account: {
                    business_type: "individual",
                    individual: { id_number: "000000000" },
                },
            });
            await stripe.accounts.update(accountId, {
                account_token: accountToken.id,
                individual: {
                    verification: { document: { front: "file_identity_document_success" } },
                },
                metadata: { firebase_user_id: uid },
            });
        } catch (e) {
            console.warn("[testVerifyAccount] Token/doc update failed:", e.message);
        }
        const account = await stripe.accounts.retrieve(accountId);
        await stripeAccountRepository.update(uid, {
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            details_submitted: account.details_submitted,
            capabilities: account.capabilities,
        });
        return {
            success: true,
            accountId,
            capabilities: account.capabilities || {},
            message: `Account verified! Capabilities: ${Object.entries(account.capabilities || {}).map(([k, v]) => `${k}=${v}`).join(", ")}`,
        };
    }

    async function testCreateTransaction(uid, amount) {
        const doc = await stripeAccountRepository.getByUid(uid);
        if (!doc || !doc.accountId) {
            const err = new Error("No Stripe account found");
            err.statusCode = 404;
            throw err;
        }
        const pi = await stripe.paymentIntents.create({
            amount: amount || 2500,
            currency: "usd",
            payment_method: "pm_card_visa",
            confirm: true,
            automatic_payment_methods: { enabled: true, allow_redirects: "never" },
            transfer_data: { destination: doc.accountId },
            description: "Test payment",
            metadata: { testPayment: "true", userId: uid },
        });
        return {
            success: true,
            paymentIntentId: pi.id,
            transferId: pi.transfer ? (typeof pi.transfer === "string" ? pi.transfer : pi.transfer.id) : undefined,
            amount: pi.amount,
            status: pi.status,
            message: `Test payment of $${(pi.amount / 100).toFixed(2)} created! Status: ${pi.status}`,
        };
    }

    async function testAddBalance(uid, amount) {
        const doc = await stripeAccountRepository.getByUid(uid);
        if (!doc || !doc.accountId) {
            const err = new Error("No Stripe account found");
            err.statusCode = 404;
            throw err;
        }
        const pi = await stripe.paymentIntents.create({
            amount: amount || 5000,
            currency: "usd",
            payment_method: "pm_card_visa",
            confirm: true,
            automatic_payment_methods: { enabled: true, allow_redirects: "never" },
            transfer_data: { destination: doc.accountId },
            description: "Test balance addition",
            metadata: { testBalance: "true", userId: uid },
        });
        return {
            success: true,
            paymentIntentId: pi.id,
            amount: pi.amount,
            status: pi.status,
            message: `$${(pi.amount / 100).toFixed(2)} added to balance! Status: ${pi.status}`,
        };
    }

    async function createPushProvisioningEphemeralKey(uid, body = {}) {
        const doc = await stripeAccountRepository.getByUid(uid);
        if (!doc || !doc.accountId || !doc.virtualCardId) {
            const err = new Error("No card found. Create a virtual card first.");
            err.code = "no_card";
            err.statusCode = 404;
            throw err;
        }
        const ephemeralKey = await stripeService.createIssuingEphemeralKey(stripe, {
            accountId: doc.accountId,
            cardId: doc.virtualCardId,
            apiVersion: body.apiVersion || undefined,
        });
        return { ephemeralKey, success: true };
    }

    async function getCardDetailsWithWallet(uid) {
        const doc = await stripeAccountRepository.getByUid(uid);
        if (!doc || !doc.accountId || !doc.virtualCardId) {
            const err = new Error("No card found. Create a virtual card first.");
            err.statusCode = 404;
            throw err;
        }
        const details = await stripeService.getCardDetailsWithWallet(stripe, {
            accountId: doc.accountId,
            cardId: doc.virtualCardId,
        });
        return { ...details, cardId: doc.virtualCardId, success: true };
    }

    return {
        createCustomConnectAccount,
        createOnboardingLink,
        getAccountStatus,
        updateAccountCapabilities,
        getFinancialAccountBalance,
        retryProvisioning,
        createIssuingCardholder,
        createVirtualCard,
        getCardDetails,
        getCardDetailsWithWallet,
        createPushProvisioningEphemeralKey,
        createTestAuthorization,
        handleWebhookAccountUpdated,
        parseDobString,
        normalizeUSZip,
        getBalance,
        getTransactions,
        getAccountDetails: getAccountDetailsFunc,
        getPayouts,
        createPayout: createPayoutFunc,
        addBankAccount,
        updateAccountInfo,
        acceptTermsOfService,
        testVerifyAccount,
        testCreateTransaction,
        testAddBalance,
    };
}

module.exports = { createStripeConnectService, parseDobString, normalizeUSZip };
