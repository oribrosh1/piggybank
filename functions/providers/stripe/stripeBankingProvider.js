const bankingAccountRepository = require("../../repositories/bankingAccountRepository");
const userRepository = require("../../repositories/userRepository");

/**
 * Stripe banking provider – delegates to existing Connect/Treasury/Issuing stack
 * and mirrors normalized fields into bankingAccounts + users.
 */
function createStripeBankingProvider(stripeConnectService) {
    async function mirrorStripeRecord(uid, patch = {}) {
        const stripeAccountRepository = require("../../repositories/stripeAccountRepository");
        const stripeDoc = await stripeAccountRepository.getByUid(uid);
        if (!stripeDoc) return null;

        const capabilities = stripeDoc.capabilities || patch.capabilities || {};
        const cardIssuingActive =
            capabilities.card_issuing === "active" || stripeDoc.cardIssuingActive === true;

        const record = await bankingAccountRepository.upsertFromProvider(uid, {
            provider: "stripe",
            accountId: stripeDoc.accountId,
            depositAccountId: stripeDoc.financialAccountId || null,
            cardId: stripeDoc.virtualCardId || null,
            applicationId: null,
            customerId: stripeDoc.cardholderId || null,
            status: cardIssuingActive ? "approved" : stripeDoc.status || "pending",
            capabilities,
            externalIdsKey: "stripe",
            externalIdsValue: {
                accountId: stripeDoc.accountId,
                financialAccountId: stripeDoc.financialAccountId,
                cardholderId: stripeDoc.cardholderId,
                virtualCardId: stripeDoc.virtualCardId,
            },
            ...patch,
        });

        await userRepository.setBankingAccount(uid, {
            bankingProvider: "stripe",
            bankingAccountId: stripeDoc.accountId,
            bankingAccountStatus: cardIssuingActive ? "approved" : (stripeDoc.status || "pending"),
            virtualCardId: stripeDoc.virtualCardId || undefined,
            stripeAccountId: stripeDoc.accountId,
            stripeAccountStatus: cardIssuingActive ? "approved" : (stripeDoc.status || "pending"),
        }).catch(() => {});

        return record;
    }

    async function wrap(uid, fn, ...args) {
        const result = await fn(...args);
        if (uid) await mirrorStripeRecord(uid).catch(() => {});
        return { ...result, provider: "stripe" };
    }

    return {
        name: "stripe",
        async createCustomConnectAccount(uid, body) {
            const result = await stripeConnectService.createCustomConnectAccount(uid, body);
            await mirrorStripeRecord(uid);
            return { ...result, provider: "stripe" };
        },
        createOnboardingLink(uid, body) {
            return wrap(uid, stripeConnectService.createOnboardingLink, uid, body);
        },
        async getAccountStatus(uid) {
            const result = await stripeConnectService.getAccountStatus(uid);
            await mirrorStripeRecord(uid, { capabilities: result.capabilities });
            return { ...result, provider: "stripe" };
        },
        updateAccountCapabilities(uid) {
            return wrap(uid, stripeConnectService.updateAccountCapabilities, uid);
        },
        getFinancialAccountBalance(uid) {
            return wrap(uid, stripeConnectService.getFinancialAccountBalance, uid);
        },
        retryProvisioning(uid) {
            return wrap(uid, stripeConnectService.retryProvisioning, uid);
        },
        createIssuingCardholder(uid, body) {
            return wrap(uid, stripeConnectService.createIssuingCardholder, uid, body);
        },
        createVirtualCard(uid, body) {
            return wrap(uid, stripeConnectService.createVirtualCard, uid, body);
        },
        getCardDetails(uid) {
            return wrap(uid, stripeConnectService.getCardDetails, uid);
        },
        getCardDetailsWithWallet(uid) {
            return wrap(uid, stripeConnectService.getCardDetailsWithWallet, uid);
        },
        createPushProvisioningEphemeralKey(uid, body) {
            return wrap(uid, stripeConnectService.createPushProvisioningEphemeralKey, uid, body);
        },
        createTestAuthorization(uid, amount) {
            return wrap(uid, stripeConnectService.createTestAuthorization, uid, amount);
        },
        getBalance(uid) {
            return wrap(uid, stripeConnectService.getBalance, uid);
        },
        getTransactions(uid, limit, starting_after) {
            return wrap(uid, stripeConnectService.getTransactions, uid, limit, starting_after);
        },
        getAccountDetails(uid) {
            return wrap(uid, stripeConnectService.getAccountDetails, uid);
        },
        getPayouts(uid, limit, starting_after) {
            return wrap(uid, stripeConnectService.getPayouts, uid, limit, starting_after);
        },
        createPayout(uid, amount, currency) {
            return wrap(uid, stripeConnectService.createPayout, uid, amount, currency);
        },
        addBankAccount(uid, body) {
            return wrap(uid, stripeConnectService.addBankAccount, uid, body);
        },
        updateAccountInfo(uid, body) {
            return wrap(uid, stripeConnectService.updateAccountInfo, uid, body);
        },
        acceptTermsOfService(uid, ip) {
            return wrap(uid, stripeConnectService.acceptTermsOfService, uid, ip);
        },
        testVerifyAccount(uid) {
            return wrap(uid, stripeConnectService.testVerifyAccount, uid);
        },
        testCreateTransaction(uid, amount) {
            return wrap(uid, stripeConnectService.testCreateTransaction, uid, amount);
        },
        testAddBalance(uid, amount) {
            return wrap(uid, stripeConnectService.testAddBalance, uid, amount);
        },
        handleWebhookAccountUpdated(account) {
            return stripeConnectService.handleWebhookAccountUpdated(account);
        },
        mirrorStripeRecord,
    };
}

module.exports = { createStripeBankingProvider };
