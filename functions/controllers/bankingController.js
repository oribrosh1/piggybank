const { handleError } = require("../utils/errors");
const { getPublicProviderConfig } = require("../config/providerConfig");

/**
 * Provider-neutral banking controller. Delegates to active banking provider (Stripe or Unit).
 * @param {object} bankingProvider
 */
function createBankingController(bankingProvider) {
    async function getProviderConfig(req, res) {
        res.json({ success: true, ...getPublicProviderConfig() });
    }

    async function createCustomConnectAccount(req, res) {
        const uid = req.user.uid;
        try {
            const result = await bankingProvider.createCustomConnectAccount(uid, req.body);
            res.json(result);
        } catch (err) {
            console.error(`[createCustomConnectAccount] uid=${uid} provider=${bankingProvider.name} ${err.message}`);
            if (err.code === "capability_not_enabled") {
                return res.status(400).json({
                    error: "Card issuing is not enabled for this platform.",
                    code: err.code,
                });
            }
            if (err.code === "postal_code_invalid") {
                return res.status(400).json({
                    error: "The ZIP code doesn't match a valid US address.",
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
            const result = await bankingProvider.createOnboardingLink(uid, req.body || {});
            res.json(result);
        } catch (err) {
            handleError(err, res);
        }
    }

    async function getAccountStatus(req, res) {
        const uid = req.user.uid;
        try {
            const result = await bankingProvider.getAccountStatus(uid);
            res.json(result);
        } catch (err) {
            handleError(err, res);
        }
    }

    async function updateAccountCapabilities(req, res) {
        const uid = req.user.uid;
        try {
            const result = await bankingProvider.updateAccountCapabilities(uid);
            res.json(result);
        } catch (err) {
            handleError(err, res);
        }
    }

    async function getFinancialAccountBalance(req, res) {
        const uid = req.user.uid;
        try {
            const result = await bankingProvider.getFinancialAccountBalance(uid);
            res.json(result);
        } catch (err) {
            handleError(err, res);
        }
    }

    async function retryProvisioning(req, res) {
        const uid = req.user.uid;
        try {
            const result = await bankingProvider.retryProvisioning(uid);
            res.json(result);
        } catch (err) {
            handleError(err, res);
        }
    }

    async function createIssuingCardholder(req, res) {
        const uid = req.user.uid;
        const { name, email, phone, line1, line2, city, state, postal_code, dob } = req.body;
        if (!name || !email || !line1 || !city || !state || !postal_code) {
            return res.status(400).json({ error: "Missing required fields: name, email, line1, city, state, postal_code" });
        }
        try {
            const result = await bankingProvider.createIssuingCardholder(uid, {
                name, email, phone, line1, line2, city, state, postal_code, dob,
            });
            res.json(result);
        } catch (err) {
            handleError(err, res);
        }
    }

    async function createVirtualCard(req, res) {
        const uid = req.user.uid;
        const { spendingLimitAmount = 50000, spendingLimitInterval = "per_authorization" } = req.body;
        try {
            const result = await bankingProvider.createVirtualCard(uid, {
                spendingLimitAmount: Math.min(Number(spendingLimitAmount) || 50000, 50000),
                spendingLimitInterval,
            });
            res.json(result);
        } catch (err) {
            if (err.code === "card_exists") {
                return res.status(400).json({ error: err.message, code: err.code });
            }
            handleError(err, res);
        }
    }

    async function getCardDetails(req, res) {
        const uid = req.user.uid;
        try {
            const result = await bankingProvider.getCardDetails(uid);
            res.json(result);
        } catch (err) {
            if (err.statusCode === 404) {
                return res.status(404).json({ error: err.message });
            }
            handleError(err, res);
        }
    }

    async function getCardDetailsWithWallet(req, res) {
        const uid = req.user.uid;
        try {
            const result = await bankingProvider.getCardDetailsWithWallet(uid);
            res.json(result);
        } catch (err) {
            handleError(err, res);
        }
    }

    async function createPushProvisioningEphemeralKey(req, res) {
        const uid = req.user.uid;
        try {
            const result = await bankingProvider.createPushProvisioningEphemeralKey(uid, req.body);
            res.json(result);
        } catch (err) {
            if (err.code === "not_supported" || err.code === "no_card") {
                return res.status(err.statusCode || 400).json({ error: err.message, code: err.code });
            }
            handleError(err, res);
        }
    }

    async function createTestAuthorization(req, res) {
        const uid = req.user.uid;
        const { amount = 1000 } = req.body;
        try {
            const result = await bankingProvider.createTestAuthorization(uid, amount);
            res.json(result);
        } catch (err) {
            handleError(err, res);
        }
    }

    async function getBalance(req, res) {
        const uid = req.user.uid;
        try {
            const result = await bankingProvider.getBalance(uid);
            res.json(result);
        } catch (err) {
            handleError(err, res);
        }
    }

    async function getTransactions(req, res) {
        const uid = req.user.uid;
        const limit = parseInt(req.query.limit, 10) || 10;
        const starting_after = req.query.starting_after || undefined;
        try {
            const result = await bankingProvider.getTransactions(uid, limit, starting_after);
            res.json(result);
        } catch (err) {
            handleError(err, res);
        }
    }

    async function getAccountDetails(req, res) {
        const uid = req.user.uid;
        try {
            const result = await bankingProvider.getAccountDetails(uid);
            res.json(result);
        } catch (err) {
            handleError(err, res);
        }
    }

    async function getPayouts(req, res) {
        const uid = req.user.uid;
        const limit = parseInt(req.query.limit, 10) || 10;
        const starting_after = req.query.starting_after || undefined;
        try {
            const result = await bankingProvider.getPayouts(uid, limit, starting_after);
            res.json(result);
        } catch (err) {
            handleError(err, res);
        }
    }

    async function createPayout(req, res) {
        const uid = req.user.uid;
        const { amount, currency } = req.body;
        if (!amount || amount < 1) {
            return res.status(400).json({ error: "Amount required (minimum 1 cent)" });
        }
        try {
            const result = await bankingProvider.createPayout(uid, amount, currency);
            res.json(result);
        } catch (err) {
            handleError(err, res);
        }
    }

    async function addBankAccount(req, res) {
        const uid = req.user.uid;
        try {
            const result = await bankingProvider.addBankAccount(uid, req.body);
            res.json(result);
        } catch (err) {
            handleError(err, res);
        }
    }

    async function updateAccountInfo(req, res) {
        const uid = req.user.uid;
        try {
            const result = await bankingProvider.updateAccountInfo(uid, req.body);
            res.json(result);
        } catch (err) {
            handleError(err, res);
        }
    }

    async function acceptTermsOfService(req, res) {
        const uid = req.user.uid;
        try {
            const result = await bankingProvider.acceptTermsOfService(uid, req.body?.ip);
            res.json(result);
        } catch (err) {
            handleError(err, res);
        }
    }

    async function testVerifyAccount(req, res) {
        const uid = req.user.uid;
        try {
            const result = await bankingProvider.testVerifyAccount(uid);
            res.json(result);
        } catch (err) {
            handleError(err, res);
        }
    }

    async function testCreateTransaction(req, res) {
        const uid = req.user.uid;
        try {
            const result = await bankingProvider.testCreateTransaction(uid, req.body?.amount);
            res.json(result);
        } catch (err) {
            handleError(err, res);
        }
    }

    async function testAddBalance(req, res) {
        const uid = req.user.uid;
        try {
            const result = await bankingProvider.testAddBalance(uid, req.body?.amount);
            res.json(result);
        } catch (err) {
            handleError(err, res);
        }
    }

    return {
        getProviderConfig,
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

module.exports = { createBankingController };
