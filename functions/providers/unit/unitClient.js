const axios = require("axios");
const { getUnitBaseUrl, isUnitSandbox } = require("../../config/providerConfig");

/**
 * Minimal Unit.co JSON:API client.
 * @see https://www.unit.co/docs/api/
 */
function createUnitClient() {
    const token = process.env.UNIT_API_TOKEN;
    if (!token) {
        throw new Error("UNIT_API_TOKEN is required when BANKING_PROVIDER=unit");
    }

    const client = axios.create({
        baseURL: getUnitBaseUrl(),
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/vnd.api+json",
            Accept: "application/json",
        },
        timeout: 30000,
    });

    async function request(method, path, data) {
        try {
            const res = await client.request({ method, url: path, data });
            return res.data;
        } catch (err) {
            const detail =
                err.response?.data?.errors?.[0]?.detail ||
                err.response?.data?.message ||
                err.message;
            const e = new Error(detail || "Unit API request failed");
            e.statusCode = err.response?.status || 500;
            e.unitErrors = err.response?.data?.errors;
            throw e;
        }
    }

    return {
        isSandbox: isUnitSandbox(),
        getApplication(applicationId) {
            return request("GET", `/applications/${applicationId}`);
        },
        createIndividualApplication(attrs) {
            return request("POST", "/applications", {
                data: {
                    type: "individualApplication",
                    attributes: attrs,
                },
            });
        },
        createDepositAccount(customerId, depositProduct) {
            return request("POST", "/accounts", {
                data: {
                    type: "depositAccount",
                    attributes: {
                        depositProduct: depositProduct || process.env.UNIT_DEPOSIT_PRODUCT || "checking",
                        tags: { source: "creditkid" },
                    },
                    relationships: {
                        customer: {
                            data: { type: "customer", id: String(customerId) },
                        },
                    },
                },
            });
        },
        getAccount(accountId) {
            return request("GET", `/accounts/${accountId}`);
        },
        createVirtualDebitCard(customerId, accountId, attrs = {}) {
            return request("POST", "/cards", {
                data: {
                    type: "individualVirtualDebitCard",
                    attributes: {
                        ...attrs,
                    },
                    relationships: {
                        account: {
                            data: { type: "account", id: String(accountId) },
                        },
                    },
                },
            });
        },
        getCard(cardId) {
            return request("GET", `/cards/${cardId}`);
        },
        updateCard(cardId, attributes) {
            return request("PATCH", `/cards/${cardId}`, {
                data: {
                    type: "individualVirtualDebitCard",
                    attributes,
                },
            });
        },
        listTransactions(accountId, limit = 25) {
            return request("GET", `/accounts/${accountId}/transactions?page[limit]=${limit}`);
        },
        createBookPayment(fromAccountId, toAccountId, amountCents, description) {
            return request("POST", "/payments", {
                data: {
                    type: "bookPayment",
                    attributes: {
                        amount: amountCents,
                        description: description || "CreditKid gift settlement",
                        tags: { source: "creditkid" },
                    },
                    relationships: {
                        account: {
                            data: { type: "account", id: String(fromAccountId) },
                        },
                        counterpartyAccount: {
                            data: { type: "account", id: String(toAccountId) },
                        },
                    },
                },
            });
        },
    };
}

module.exports = { createUnitClient };
