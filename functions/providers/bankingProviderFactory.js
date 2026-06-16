const { getBankingProvider } = require("../config/providerConfig");
const { createStripeBankingProvider } = require("./stripe/stripeBankingProvider");
const { createUnitBankingProvider } = require("./unit/unitBankingProvider");

let cached = null;

/**
 * @param {{ stripeConnectService: object }} deps
 */
function createBankingProvider(deps) {
    const bankingProvider = getBankingProvider();
    if (bankingProvider === "unit") {
        return createUnitBankingProvider();
    }
    return createStripeBankingProvider(deps.stripeConnectService);
}

function getBankingProviderInstance(deps) {
    if (!cached) {
        cached = createBankingProvider(deps);
    }
    return cached;
}

function resetBankingProviderCache() {
    cached = null;
}

module.exports = {
    createBankingProvider,
    getBankingProviderInstance,
    resetBankingProviderCache,
};
