const { AppError, handleError } = require("../utils/errors");

/**
 * Returns Stripe Connect controller handlers. Injected with stripeConnectService (from createStripeConnectService(stripe, stripeService)).
 * @param {object} stripeConnectService
 */
function createStripeController(stripeConnectService) {
    async function createCustomConnectAccount(req, res) {
        const uid = req.user.uid;
        try {
            const result = await stripeConnectService.createCustomConnectAccount(uid, req.body);
            res.json(result);
        } catch (err) {
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
        try {
            const result = await stripeConnectService.createOnboardingLink(uid);
            res.json(result);
        } catch (err) {
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
        try {
            const result = await stripeConnectService.getAccountStatus(uid);
            res.json(result);
        } catch (err) {
            handleError(err, res);
        }
    }

    async function updateAccountCapabilities(req, res) {
        const uid = req.user.uid;
        try {
            const result = await stripeConnectService.updateAccountCapabilities(uid);
            res.json(result);
        } catch (err) {
            if (err.code === "capability_not_enabled") {
                return res.status(400).json({ error: "Capability not enabled on platform.", code: err.code });
            }
            handleError(err, res);
        }
    }

    async function getIssuingBalance(req, res) {
        const uid = req.user.uid;
        try {
            const result = await stripeConnectService.getIssuingBalance(uid);
            res.json(result);
        } catch (err) {
            if (err.code === "capability_not_enabled") {
                return res.status(400).json({ error: "Card issuing not enabled for this account.", code: err.code });
            }
            handleError(err, res);
        }
    }

    async function topUpIssuing(req, res) {
        const uid = req.user.uid;
        const { amount } = req.body;
        if (!amount || amount < 100) {
            return res.status(400).json({ error: "Amount required (minimum 100 cents = $1)" });
        }
        try {
            const result = await stripeConnectService.topUpIssuing(uid, amount);
            res.json(result);
        } catch (err) {
            if (err.code === "insufficient_funds" || err.code === "capability_not_enabled") {
                return res.status(400).json({ error: err.message, code: err.code });
            }
            handleError(err, res);
        }
    }

    async function createIssuingCardholder(req, res) {
        const uid = req.user.uid;
        const { name, email, phone, line1, line2, city, state, postal_code, dob } = req.body;
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
            res.json(result);
        } catch (err) {
            if (err.code === "capability_not_enabled") {
                return res.status(400).json({ error: "Card issuing not enabled.", code: err.code });
            }
            handleError(err, res);
        }
    }

    async function createVirtualCard(req, res) {
        const uid = req.user.uid;
        const { spendingLimitAmount = 50000, spendingLimitInterval = "per_authorization" } = req.body;
        try {
            const result = await stripeConnectService.createVirtualCard(uid, {
                spendingLimitAmount: Math.min(Number(spendingLimitAmount) || 50000, 50000),
                spendingLimitInterval,
            });
            res.json(result);
        } catch (err) {
            if (err.code === "insufficient_funds" || err.code === "capability_not_enabled" || err.code === "card_exists") {
                return res.status(400).json({ error: err.message, code: err.code });
            }
            handleError(err, res);
        }
    }

    async function getCardDetails(req, res) {
        const uid = req.user.uid;
        try {
            const result = await stripeConnectService.getCardDetails(uid);
            res.json(result);
        } catch (err) {
            if (err.code === "resource_missing") {
                return res.status(404).json({ error: "Card not found.", code: err.code });
            }
            handleError(err, res);
        }
    }

    async function createTestAuthorization(req, res) {
        const uid = req.user.uid;
        const { amount = 1000 } = req.body;
        try {
            const result = await stripeConnectService.createTestAuthorization(uid, amount);
            res.json(result);
        } catch (err) {
            if (err.code === "resource_missing") {
                return res.status(404).json({ error: "Card not found.", code: err.code });
            }
            handleError(err, res);
        }
    }

    async function getBalance(req, res) {
        try {
            const result = await stripeConnectService.getBalance(req.user.uid);
            res.json(result);
        } catch (err) {
            handleError(err, res);
        }
    }

    async function getTransactions(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const starting_after = req.query.starting_after || undefined;
            const result = await stripeConnectService.getTransactions(req.user.uid, limit, starting_after);
            res.json(result);
        } catch (err) {
            handleError(err, res);
        }
    }

    async function getAccountDetails(req, res) {
        try {
            const result = await stripeConnectService.getAccountDetails(req.user.uid);
            res.json(result);
        } catch (err) {
            handleError(err, res);
        }
    }

    async function getPayouts(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const starting_after = req.query.starting_after || undefined;
            const result = await stripeConnectService.getPayouts(req.user.uid, limit, starting_after);
            res.json(result);
        } catch (err) {
            handleError(err, res);
        }
    }

    async function createPayout(req, res) {
        const { amount, currency } = req.body;
        if (!amount || amount < 1) {
            return res.status(400).json({ error: "Amount required (minimum 1 cent)" });
        }
        try {
            const result = await stripeConnectService.createPayout(req.user.uid, amount, currency);
            res.json(result);
        } catch (err) {
            if (err.code === "balance_insufficient") {
                return res.status(400).json({ error: "Insufficient balance for payout.", code: err.code });
            }
            handleError(err, res);
        }
    }

    async function addBankAccount(req, res) {
        const { account_holder_name, routing_number, account_number } = req.body;
        if (!account_holder_name || !routing_number || !account_number) {
            return res.status(400).json({ error: "Missing required fields: account_holder_name, routing_number, account_number" });
        }
        try {
            const result = await stripeConnectService.addBankAccount(req.user.uid, req.body);
            res.json(result);
        } catch (err) {
            handleError(err, res);
        }
    }

    async function updateAccountInfo(req, res) {
        try {
            const result = await stripeConnectService.updateAccountInfo(req.user.uid, req.body);
            res.json(result);
        } catch (err) {
            if (err.code === "postal_code_invalid" || (err.param && String(err.param).includes("postal_code"))) {
                return res.status(400).json({ error: "Invalid ZIP code.", code: "postal_code_invalid" });
            }
            handleError(err, res);
        }
    }

    async function acceptTermsOfService(req, res) {
        try {
            const result = await stripeConnectService.acceptTermsOfService(req.user.uid, req.body.ip);
            res.json(result);
        } catch (err) {
            handleError(err, res);
        }
    }

    async function testVerifyAccount(req, res) {
        try {
            const result = await stripeConnectService.testVerifyAccount(req.user.uid);
            res.json(result);
        } catch (err) {
            handleError(err, res);
        }
    }

    async function testCreateTransaction(req, res) {
        try {
            const { amount } = req.body;
            const result = await stripeConnectService.testCreateTransaction(req.user.uid, amount);
            res.json(result);
        } catch (err) {
            handleError(err, res);
        }
    }

    async function testAddBalance(req, res) {
        try {
            const { amount } = req.body;
            const result = await stripeConnectService.testAddBalance(req.user.uid, amount);
            res.json(result);
        } catch (err) {
            handleError(err, res);
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
