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
 * @param {object} stripeService - module with createCustomConnectAccount, createAccountLink, getIssuingBalance, etc.
 */
function createStripeConnectService(stripe, stripeService) {
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

        const admin = require("firebase-admin");
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

        return { accountId: account.id, success: true, existing: false };
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
        const admin = require("firebase-admin");
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

    async function getIssuingBalance(uid) {
        const doc = await stripeAccountRepository.getByUid(uid);
        if (!doc || !doc.accountId) {
            const err = new Error("No Stripe account found");
            err.statusCode = 404;
            throw err;
        }
        const { issuingAvailable: availableCents, currency } = await stripeService.getIssuingBalance(stripe, doc.accountId);
        return {
            issuingAvailable: availableCents,
            issuingAvailableFormatted: (availableCents / 100).toFixed(2),
            currency,
            canCreateCard: availableCents > 0,
            success: true,
        };
    }

    async function topUpIssuing(uid, amount) {
        const doc = await stripeAccountRepository.getByUid(uid);
        if (!doc || !doc.accountId) {
            const err = new Error("No Stripe account found");
            err.statusCode = 404;
            throw err;
        }
        const topup = await stripeService.topUpIssuing(stripe, { accountId: doc.accountId, amount: Number(amount) });
        return { topupId: topup.id, amount: topup.amount, status: topup.status, success: true };
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
        const { issuingAvailable } = await stripeService.getIssuingBalance(stripe, doc.accountId);
        if (issuingAvailable <= 0) {
            const err = new Error("Insufficient issuing balance. Add funds before creating a card.");
            err.code = "insufficient_funds";
            err.statusCode = 400;
            throw err;
        }
        const card = await stripeService.createVirtualCard(stripe, {
            accountId: doc.accountId,
            cardholderId: doc.cardholderId,
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
        const admin = require("firebase-admin");
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

    return {
        createCustomConnectAccount,
        createOnboardingLink,
        getAccountStatus,
        updateAccountCapabilities,
        getIssuingBalance,
        topUpIssuing,
        createIssuingCardholder,
        createVirtualCard,
        getCardDetails,
        createTestAuthorization,
        handleWebhookAccountUpdated,
        parseDobString,
        normalizeUSZip,
    };
}

module.exports = { createStripeConnectService, parseDobString, normalizeUSZip };
