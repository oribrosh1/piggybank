const { AppError, handleError } = require("../utils/errors");

/**
 * Returns Stripe Connect controller handlers. Injected with stripeConnectService (from createStripeConnectService(stripe, stripeService)).
 * @param {object} stripeConnectService
 */
function createStripeController(stripeConnectService) {
    async function createCustomConnectAccount(req, res) {
        const uid = req.user.uid;
        console.log(`[createCustomConnectAccount] uid=${uid}`);
        try {
            const result = await stripeConnectService.createCustomConnectAccount(uid, req.body);
            console.log(`[createCustomConnectAccount] success uid=${uid} accountId=${result.accountId || "?"}`);
            res.json(result);
        } catch (err) {
            console.error(`[createCustomConnectAccount] error uid=${uid} code=${err.code || "none"} message=${err.message}`);
            if (err.code === "capability_not_enabled" || (err.type === "StripeInvalidRequestError" && /platform has been onboarded|card_issuing can only be requested/i.test(err.message || ""))) {
                return res.status(400).json({
                    error: "Card issuing is not enabled for this platform. Complete Issuing onboarding in the Stripe Dashboard (Dashboard → Issuing) first.",
                    code: err.code || "capability_not_enabled",
                    source: "createCustomConnectAccount",
                });
            }
            if (err.code === "postal_code_invalid" || (err.param && String(err.param).includes("postal_code"))) {
                return res.status(400).json({
                    error: "The ZIP code doesn't match a valid US address. Please check that your ZIP code matches your state.",
                    code: "postal_code_invalid",
                    param: "zipCode",
                });
            }
            handleError(err, res);
        }
    }

    async function createOnboardingLink(req, res) {
        const uid = req.user.uid;
        console.log(`[createOnboardingLink] uid=${uid}`);
        try {
            const result = await stripeConnectService.createOnboardingLink(uid, req.body || {});
            console.log(`[createOnboardingLink] success uid=${uid}`);
            res.json(result);
        } catch (err) {
            console.error(`[createOnboardingLink] error uid=${uid} code=${err.code || "none"} message=${err.message}`);
            if (err.statusCode === 400) {
                return res.status(400).json({ error: err.message });
            }
            if (err.code === "url_invalid" && err.param === "return_url") {
                return res.status(400).json({
                    error: "Server URL config invalid. Set PUBLIC_BASE_URL to your app's HTTPS domain.",
                    code: err.code,
                    source: "createOnboardingLink",
                });
            }
            if (err.code === "link_expired" || err.type === "StripeInvalidRequestError") {
                return res.status(400).json({ error: "Link expired or invalid. Request a new onboarding link.", code: err.code || "link_expired" });
            }
            handleError(err, res);
        }
    }

    async function getAccountStatus(req, res) {
        const uid = req.user.uid;
        console.log(`[getAccountStatus] uid=${uid}`);
        try {
            const result = await stripeConnectService.getAccountStatus(uid);
            console.log(`[getAccountStatus] success uid=${uid} status=${result.status || "?"}`);
            res.json(result);
        } catch (err) {
            console.error(`[getAccountStatus] error uid=${uid} message=${err.message}`);
            handleError(err, res);
        }
    }

    async function updateAccountCapabilities(req, res) {
        const uid = req.user.uid;
        console.log(`[updateAccountCapabilities] uid=${uid}`);
        try {
            const result = await stripeConnectService.updateAccountCapabilities(uid);
            console.log(`[updateAccountCapabilities] success uid=${uid}`);
            res.json(result);
        } catch (err) {
            console.error(`[updateAccountCapabilities] error uid=${uid} code=${err.code || "none"} message=${err.message}`);
            if (err.code === "capability_not_enabled") {
                return res.status(400).json({ error: "Capability not enabled on platform.", code: err.code });
            }
            handleError(err, res);
        }
    }

    async function getFinancialAccountBalance(req, res) {
        const uid = req.user.uid;
        console.log(`[getFinancialAccountBalance] uid=${uid}`);
        try {
            const result = await stripeConnectService.getFinancialAccountBalance(uid);
            console.log(`[getFinancialAccountBalance] success uid=${uid}`);
            res.json(result);
        } catch (err) {
            console.error(`[getFinancialAccountBalance] error uid=${uid} code=${err.code || "none"} message=${err.message}`);
            handleError(err, res);
        }
    }

    async function retryProvisioning(req, res) {
        const uid = req.user.uid;
        console.log(`[retryProvisioning] uid=${uid}`);
        try {
            const result = await stripeConnectService.retryProvisioning(uid);
            console.log(`[retryProvisioning] success uid=${uid}`);
            res.json(result);
        } catch (err) {
            console.error(`[retryProvisioning] error uid=${uid} code=${err.code || "none"} message=${err.message}`);
            handleError(err, res);
        }
    }

    async function createIssuingCardholder(req, res) {
        const uid = req.user.uid;
        const { name, email, phone, line1, line2, city, state, postal_code, dob } = req.body;
        console.log(`[createIssuingCardholder] uid=${uid}`);
        if (!name || !email || !line1 || !city || !state || !postal_code) {
            return res.status(400).json({ error: "Missing required fields: name, email, line1, city, state, postal_code" });
        }
        const ISSUING_TEST_PHONE = "+15555555555";
        const isTestMode = (process.env.STRIPE_SECRET_KEY || "").toString().startsWith("sk_test_");
        const raw = (phone || "").toString().replace(/\D/g, "");
        const isPlaceholderPhone = !phone || raw === "0000000000" || raw === "10000000000" || phone === "+10000000000";
        const cardholderPhone = (isTestMode && isPlaceholderPhone) ? ISSUING_TEST_PHONE : (phone || undefined);
        const [first_name, ...lastParts] = (name || "").trim().split(/\s+/);
        const last_name = lastParts.length ? lastParts.join(" ") : first_name;
        try {
            const result = await stripeConnectService.createIssuingCardholder(uid, {
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
            console.log(`[createIssuingCardholder] success uid=${uid} cardholderId=${result.cardholderId || "?"}`);
            res.json(result);
        } catch (err) {
            console.error(`[createIssuingCardholder] error uid=${uid} code=${err.code || "none"} message=${err.message}`);
            if (err.code === "capability_not_enabled") {
                return res.status(400).json({ error: "Card issuing not enabled.", code: err.code });
            }
            handleError(err, res);
        }
    }

    async function createVirtualCard(req, res) {
        const uid = req.user.uid;
        const { spendingLimitAmount = 50000, spendingLimitInterval = "per_authorization" } = req.body;
        console.log(`[createVirtualCard] uid=${uid} limit=${spendingLimitAmount}`);
        try {
            const result = await stripeConnectService.createVirtualCard(uid, {
                spendingLimitAmount: Math.min(Number(spendingLimitAmount) || 50000, 50000),
                spendingLimitInterval,
            });
            console.log(`[createVirtualCard] success uid=${uid} cardId=${result.cardId || "?"}`);
            res.json(result);
        } catch (err) {
            console.error(`[createVirtualCard] error uid=${uid} code=${err.code || "none"} message=${err.message}`);
            if (err.code === "insufficient_funds" || err.code === "capability_not_enabled" || err.code === "card_exists") {
                return res.status(400).json({ error: err.message, code: err.code });
            }
            handleError(err, res);
        }
    }

    async function getCardDetails(req, res) {
        const uid = req.user.uid;
        console.log(`[getCardDetails] uid=${uid}`);
        try {
            const result = await stripeConnectService.getCardDetails(uid);
            console.log(`[getCardDetails] success uid=${uid}`);
            res.json(result);
        } catch (err) {
            console.error(`[getCardDetails] error uid=${uid} code=${err.code || "none"} message=${err.message}`);
            if (err.code === "resource_missing") {
                return res.status(404).json({ error: "Card not found.", code: err.code });
            }
            handleError(err, res);
        }
    }

    async function createTestAuthorization(req, res) {
        const uid = req.user.uid;
        const { amount = 1000 } = req.body;
        console.log(`[createTestAuthorization] uid=${uid} amount=${amount}`);
        try {
            const result = await stripeConnectService.createTestAuthorization(uid, amount);
            console.log(`[createTestAuthorization] success uid=${uid}`);
            res.json(result);
        } catch (err) {
            console.error(`[createTestAuthorization] error uid=${uid} code=${err.code || "none"} message=${err.message}`);
            if (err.code === "resource_missing") {
                return res.status(404).json({ error: "Card not found.", code: err.code });
            }
            handleError(err, res);
        }
    }

    async function getBalance(req, res) {
        const uid = req.user.uid;
        console.log(`[getBalance] uid=${uid}`);
        try {
            const result = await stripeConnectService.getBalance(uid);
            console.log(`[getBalance] success uid=${uid}`);
            res.json(result);
        } catch (err) {
            console.error(`[getBalance] error uid=${uid} message=${err.message}`);
            handleError(err, res);
        }
    }

    async function getTransactions(req, res) {
        const uid = req.user.uid;
        const limit = parseInt(req.query.limit) || 10;
        const starting_after = req.query.starting_after || undefined;
        console.log(`[getTransactions] uid=${uid} limit=${limit}`);
        try {
            const result = await stripeConnectService.getTransactions(uid, limit, starting_after);
            console.log(`[getTransactions] success uid=${uid} count=${result.transactions?.length || 0}`);
            res.json(result);
        } catch (err) {
            console.error(`[getTransactions] error uid=${uid} message=${err.message}`);
            handleError(err, res);
        }
    }

    async function getAccountDetails(req, res) {
        const uid = req.user.uid;
        console.log(`[getAccountDetails] uid=${uid}`);
        try {
            const result = await stripeConnectService.getAccountDetails(uid);
            console.log(`[getAccountDetails] success uid=${uid}`);
            res.json(result);
        } catch (err) {
            console.error(`[getAccountDetails] error uid=${uid} message=${err.message}`);
            handleError(err, res);
        }
    }

    async function getPayouts(req, res) {
        const uid = req.user.uid;
        const limit = parseInt(req.query.limit) || 10;
        const starting_after = req.query.starting_after || undefined;
        console.log(`[getPayouts] uid=${uid} limit=${limit}`);
        try {
            const result = await stripeConnectService.getPayouts(uid, limit, starting_after);
            console.log(`[getPayouts] success uid=${uid} count=${result.payouts?.length || 0}`);
            res.json(result);
        } catch (err) {
            console.error(`[getPayouts] error uid=${uid} message=${err.message}`);
            handleError(err, res);
        }
    }

    async function createPayout(req, res) {
        const uid = req.user.uid;
        const { amount, currency } = req.body;
        console.log(`[createPayout] uid=${uid}`);
        if (!amount || amount < 1) {
            return res.status(400).json({ error: "Amount required (minimum 1 cent)" });
        }
        try {
            const result = await stripeConnectService.createPayout(uid, amount, currency);
            console.log(`[createPayout] success uid=${uid} payoutId=${result.payoutId || "?"}`);
            res.json(result);
        } catch (err) {
            console.error(`[createPayout] error uid=${uid} code=${err.code || "none"} message=${err.message}`);
            if (err.code === "balance_insufficient") {
                return res.status(400).json({ error: "Insufficient balance for payout.", code: err.code });
            }
            handleError(err, res);
        }
    }

    async function addBankAccount(req, res) {
        const uid = req.user.uid;
        const { account_holder_name, routing_number, account_number } = req.body;
        console.log(`[addBankAccount] uid=${uid}`);
        if (!account_holder_name || !routing_number || !account_number) {
            return res.status(400).json({ error: "Missing required fields: account_holder_name, routing_number, account_number" });
        }
        try {
            const result = await stripeConnectService.addBankAccount(uid, req.body);
            console.log(`[addBankAccount] success uid=${uid}`);
            res.json(result);
        } catch (err) {
            console.error(`[addBankAccount] error uid=${uid} message=${err.message}`);
            handleError(err, res);
        }
    }

    async function updateAccountInfo(req, res) {
        const uid = req.user.uid;
        console.log(`[updateAccountInfo] uid=${uid}`);
        try {
            const result = await stripeConnectService.updateAccountInfo(uid, req.body);
            console.log(`[updateAccountInfo] success uid=${uid}`);
            res.json(result);
        } catch (err) {
            console.error(`[updateAccountInfo] error uid=${uid} code=${err.code || "none"} message=${err.message}`);
            if (err.code === "postal_code_invalid" || (err.param && String(err.param).includes("postal_code"))) {
                return res.status(400).json({ error: "Invalid ZIP code.", code: "postal_code_invalid" });
            }
            handleError(err, res);
        }
    }

    async function acceptTermsOfService(req, res) {
        const uid = req.user.uid;
        console.log(`[acceptTermsOfService] uid=${uid}`);
        try {
            const result = await stripeConnectService.acceptTermsOfService(uid, req.body.ip);
            console.log(`[acceptTermsOfService] success uid=${uid}`);
            res.json(result);
        } catch (err) {
            console.error(`[acceptTermsOfService] error uid=${uid} message=${err.message}`);
            handleError(err, res);
        }
    }

    async function testVerifyAccount(req, res) {
        const uid = req.user.uid;
        console.log(`[testVerifyAccount] uid=${uid}`);
        try {
            const result = await stripeConnectService.testVerifyAccount(uid);
            console.log(`[testVerifyAccount] success uid=${uid}`);
            res.json(result);
        } catch (err) {
            console.error(`[testVerifyAccount] error uid=${uid} message=${err.message}`);
            handleError(err, res);
        }
    }

    async function testCreateTransaction(req, res) {
        const uid = req.user.uid;
        const { amount } = req.body;
        console.log(`[testCreateTransaction] uid=${uid}`);
        try {
            const result = await stripeConnectService.testCreateTransaction(uid, amount);
            console.log(`[testCreateTransaction] success uid=${uid}`);
            res.json(result);
        } catch (err) {
            console.error(`[testCreateTransaction] error uid=${uid} message=${err.message}`);
            handleError(err, res);
        }
    }

    async function testAddBalance(req, res) {
        const uid = req.user.uid;
        const { amount } = req.body;
        console.log(`[testAddBalance] uid=${uid}`);
        try {
            const result = await stripeConnectService.testAddBalance(uid, amount);
            console.log(`[testAddBalance] success uid=${uid}`);
            res.json(result);
        } catch (err) {
            console.error(`[testAddBalance] error uid=${uid} message=${err.message}`);
            handleError(err, res);
        }
    }

    async function createPushProvisioningEphemeralKey(req, res) {
        const uid = req.user.uid;
        const { apiVersion } = req.body;
        console.log(`[createPushProvisioningEphemeralKey] uid=${uid}`);
        try {
            const result = await stripeConnectService.createPushProvisioningEphemeralKey(uid, { apiVersion });
            console.log(`[createPushProvisioningEphemeralKey] success uid=${uid}`);
            res.json(result);
        } catch (err) {
            console.error(`[createPushProvisioningEphemeralKey] error uid=${uid} code=${err.code || "none"} message=${err.message}`);
            if (err.code === "no_card") {
                return res.status(404).json({ error: err.message, code: err.code });
            }
            handleError(err, res);
        }
    }

    async function getCardDetailsWithWallet(req, res) {
        const uid = req.user.uid;
        console.log(`[getCardDetailsWithWallet] uid=${uid}`);
        try {
            const result = await stripeConnectService.getCardDetailsWithWallet(uid);
            console.log(`[getCardDetailsWithWallet] success uid=${uid}`);
            res.json(result);
        } catch (err) {
            console.error(`[getCardDetailsWithWallet] error uid=${uid} code=${err.code || "none"} message=${err.message}`);
            if (err.code === "resource_missing") {
                return res.status(404).json({ error: "Card not found.", code: err.code });
            }
            handleError(err, res);
        }
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
        getBalance,
        getTransactions,
        getAccountDetails,
        getPayouts,
        createPayout,
        addBankAccount,
        updateAccountInfo,
        acceptTermsOfService,
        testVerifyAccount,
        testCreateTransaction,
        testAddBalance,
    };
}

module.exports = { createStripeController };
