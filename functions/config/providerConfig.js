/**
 * Provider configuration for banking (accounts/cards) and payments (guest checkout).
 *
 * Recommended production split:
 *   PAYMENTS_PROVIDER=stripe
 *   BANKING_PROVIDER=unit
 */

const VALID_PROVIDERS = ["stripe", "unit"];

function normalizeProvider(value, fallback) {
    const v = (value || "").toString().trim().toLowerCase();
    return VALID_PROVIDERS.includes(v) ? v : fallback;
}

function getBankingProvider() {
    return normalizeProvider(process.env.BANKING_PROVIDER, "stripe");
}

function getPaymentsProvider() {
    return normalizeProvider(process.env.PAYMENTS_PROVIDER, "stripe");
}

function isStripeTestKey() {
    return (process.env.STRIPE_SECRET_KEY || "").startsWith("sk_test_");
}

function isUnitSandbox() {
    const explicit = (process.env.UNIT_ENVIRONMENT || "").toLowerCase();
    if (explicit === "sandbox" || explicit === "production") {
        return explicit === "sandbox";
    }
    const base = (process.env.UNIT_BASE_URL || "").toLowerCase();
    if (base.includes("s.unit.sh")) return true;
    if (base.includes("api.unit.co")) return false;
    return process.env.NODE_ENV !== "production";
}

/** Sandbox / relaxed security mode for emulators and test keys. */
function isSandbox() {
    if (process.env.SANDBOX_MODE === "1") return true;
    if (getPaymentsProvider() === "stripe" && isStripeTestKey()) return true;
    if (getBankingProvider() === "unit" && isUnitSandbox()) return true;
    return process.env.NODE_ENV !== "production";
}

function getUnitBaseUrl() {
    if (process.env.UNIT_BASE_URL) return process.env.UNIT_BASE_URL.replace(/\/+$/, "");
    return isUnitSandbox() ? "https://api.s.unit.sh" : "https://api.unit.co";
}

function getPublicProviderConfig() {
    return {
        bankingProvider: getBankingProvider(),
        paymentsProvider: getPaymentsProvider(),
        sandbox: isSandbox(),
        features: {
            stripeTreasuryIssuing: getBankingProvider() === "stripe",
            unitBanking: getBankingProvider() === "unit",
            stripePayments: getPaymentsProvider() === "stripe",
            appleWalletProvisioning: getBankingProvider() === "stripe",
        },
    };
}

module.exports = {
    VALID_PROVIDERS,
    getBankingProvider,
    getPaymentsProvider,
    isStripeTestKey,
    isUnitSandbox,
    isSandbox,
    getUnitBaseUrl,
    getPublicProviderConfig,
};
