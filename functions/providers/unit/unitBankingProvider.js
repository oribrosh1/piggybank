const admin = require("firebase-admin");
const bankingAccountRepository = require("../../repositories/bankingAccountRepository");
const userRepository = require("../../repositories/userRepository");
const { createUnitClient } = require("./unitClient");

function parseDobString(dob) {
    if (!dob || typeof dob !== "string") return null;
    const match = dob.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return null;
    return {
        month: parseInt(match[1], 10),
        day: parseInt(match[2], 10),
        year: parseInt(match[3], 10),
    };
}

function mapApplicationStatus(status) {
    const s = (status || "").toString().toLowerCase();
    if (s === "approved") return "approved";
    if (s === "denied" || s === "canceled") return "rejected";
    if (s === "pendingreview" || s === "pending") return "pending";
    return "onboarding_required";
}

function normalizeCapabilities(record) {
    const cardReady = !!record.cardId;
    const accountOpen = (record.status || "") === "approved" || !!record.depositAccountId;
    return {
        card_issuing: cardReady ? "active" : accountOpen ? "pending" : "inactive",
        transfers: accountOpen ? "active" : "inactive",
        treasury: accountOpen ? "active" : "inactive",
    };
}

async function syncUserBankingFields(uid, record) {
    const status = mapApplicationStatus(record.status);
    await userRepository.setBankingAccount(uid, {
        bankingProvider: "unit",
        bankingAccountId: record.customerId || record.accountId || record.applicationId || null,
        bankingAccountStatus: status,
        virtualCardId: record.cardId || undefined,
        // Legacy Stripe fields left untouched for migrated users
    }).catch(() => {});
}

/**
 * Unit.co banking provider: applications, deposit accounts, virtual debit cards.
 */
function createUnitBankingProvider() {
    const unit = createUnitClient();

    async function ensureRecord(uid) {
        let record = await bankingAccountRepository.getByUid(uid);
        if (!record) {
            await bankingAccountRepository.set(uid, {
                provider: "unit",
                status: "onboarding_required",
                externalIds: { unit: {} },
            });
            record = await bankingAccountRepository.getByUid(uid);
        }
        return record;
    }

    async function createCustomConnectAccount(uid, body) {
        const existing = await bankingAccountRepository.getByUid(uid);
        if (existing?.customerId || existing?.applicationId) {
            await syncUserBankingFields(uid, existing);
            return {
                accountId: existing.customerId || existing.applicationId,
                success: true,
                existing: true,
                provider: "unit",
            };
        }

        const {
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
        } = body || {};

        const dobObj = parseDobString(dob);
        const application = await unit.createIndividualApplication({
            ssn: ssnLast4 ? `00000${ssnLast4}` : undefined,
            fullName: { first: firstName, last: lastName },
            dateOfBirth: dobObj ? `${dobObj.year}-${String(dobObj.month).padStart(2, "0")}-${String(dobObj.day).padStart(2, "0")}` : undefined,
            address: {
                street: address,
                street2: address2 || undefined,
                city,
                state,
                postalCode: zipCode,
                country: "US",
            },
            email,
            phone: phone ? { countryCode: "1", number: String(phone).replace(/\D/g, "").slice(-10) } : undefined,
            tags: { firebaseUserId: uid },
        });

        const applicationId = application?.data?.id;
        const applicationStatus = application?.data?.attributes?.status || "Pending";

        const record = await bankingAccountRepository.upsertFromProvider(uid, {
            provider: "unit",
            applicationId,
            accountId: applicationId,
            status: applicationStatus,
            externalIdsKey: "unit",
            externalIdsValue: { applicationId },
        });
        await syncUserBankingFields(uid, record);

        return {
            accountId: applicationId,
            success: true,
            existing: false,
            provider: "unit",
            status: applicationStatus,
        };
    }

    async function createOnboardingLink(uid, body) {
        const record = await ensureRecord(uid);
        if (!record.applicationId && !record.customerId) {
            const err = new Error("Create a banking application before requesting onboarding.");
            err.statusCode = 400;
            throw err;
        }
        const baseUrl = (process.env.PUBLIC_BASE_URL || "https://credit-kid.com").replace(/\/+$/, "");
        const returnUrl = (body?.returnUrl && String(body.returnUrl).startsWith("https://"))
            ? body.returnUrl
            : `${baseUrl}/banking/setup/success`;
        // Unit white-label application form URL is configured per program; expose placeholder for client routing.
        const url = process.env.UNIT_ONBOARDING_URL
            ? `${process.env.UNIT_ONBOARDING_URL}?uid=${encodeURIComponent(uid)}&return=${encodeURIComponent(returnUrl)}`
            : returnUrl;
        return {
            accountId: record.customerId || record.applicationId,
            url,
            success: true,
            provider: "unit",
        };
    }

    async function refreshApplicationState(uid, record) {
        if (!record.applicationId) return record;
        try {
            const app = await unit.getApplication(record.applicationId);
            const attrs = app?.data?.attributes || {};
            const status = attrs.status || record.status;
            const customerId = app?.data?.relationships?.customer?.data?.id || record.customerId;

            const patch = {
                status,
                customerId: customerId || record.customerId,
                accountId: customerId || record.applicationId,
                externalIdsKey: "unit",
                externalIdsValue: {
                    applicationId: record.applicationId,
                    customerId: customerId || undefined,
                },
            };

            if (customerId && !record.depositAccountId) {
                const account = await unit.createDepositAccount(customerId);
                const depositAccountId = account?.data?.id;
                patch.depositAccountId = depositAccountId;
                patch.externalIdsValue.depositAccountId = depositAccountId;
                patch.status = "approved";
            }

            const updated = await bankingAccountRepository.upsertFromProvider(uid, patch);
            await syncUserBankingFields(uid, updated);
            return updated;
        } catch (e) {
            console.warn(`[UnitBankingProvider] refreshApplicationState uid=${uid}: ${e.message}`);
            return record;
        }
    }

    async function getAccountStatus(uid) {
        let record = await bankingAccountRepository.getByUid(uid);
        if (!record) return { exists: false, provider: "unit" };
        record = await refreshApplicationState(uid, record);
        const capabilities = normalizeCapabilities(record);
        return {
            exists: true,
            provider: "unit",
            accountId: record.customerId || record.applicationId,
            charges_enabled: record.status === "approved" || !!record.depositAccountId,
            payouts_enabled: !!record.depositAccountId,
            details_submitted: record.status !== "onboarding_required",
            requirements: {
                currently_due: record.status === "approved" ? [] : ["complete_application"],
                eventually_due: [],
                past_due: [],
            },
            capabilities,
            bankingStatus: mapApplicationStatus(record.status),
        };
    }

    async function updateAccountCapabilities(uid) {
        const record = await refreshApplicationState(uid, await ensureRecord(uid));
        return {
            accountId: record.customerId || record.applicationId,
            capabilities: normalizeCapabilities(record),
            success: true,
            provider: "unit",
        };
    }

    async function getFinancialAccountBalance(uid) {
        const record = await refreshApplicationState(uid, await ensureRecord(uid));
        if (!record.depositAccountId) {
            const err = new Error("No deposit account found. Application may still be pending.");
            err.statusCode = 404;
            throw err;
        }
        const account = await unit.getAccount(record.depositAccountId);
        const balance = account?.data?.attributes?.balance || 0;
        const available = account?.data?.attributes?.available || balance;
        return {
            balance: { cash: { usd: balance } },
            available: { cash: { usd: available } },
            success: true,
            provider: "unit",
        };
    }

    async function retryProvisioning(uid) {
        const record = await refreshApplicationState(uid, await ensureRecord(uid));
        if (!record.depositAccountId) {
            const err = new Error("Deposit account not ready yet.");
            err.statusCode = 400;
            throw err;
        }
        if (!record.cardId) {
            await createVirtualCard(uid, {});
        }
        return { status: "complete", success: true, provider: "unit" };
    }

    async function createIssuingCardholder(uid, body) {
        const record = await refreshApplicationState(uid, await ensureRecord(uid));
        if (!record.customerId) {
            const err = new Error("Unit customer not ready. Complete application first.");
            err.statusCode = 400;
            throw err;
        }
        return {
            cardholderId: record.customerId,
            success: true,
            existing: true,
            provider: "unit",
        };
    }

    async function createVirtualCard(uid, body) {
        const record = await refreshApplicationState(uid, await ensureRecord(uid));
        if (!record.depositAccountId || !record.customerId) {
            const err = new Error("Deposit account not ready. Complete Unit onboarding first.");
            err.statusCode = 400;
            throw err;
        }
        if (record.cardId) {
            const err = new Error("You already have a virtual card.");
            err.code = "card_exists";
            err.statusCode = 400;
            throw err;
        }
        const card = await unit.createVirtualDebitCard(record.customerId, record.depositAccountId, {
            tags: { firebaseUserId: uid },
        });
        const cardId = card?.data?.id;
        const last4 = card?.data?.attributes?.last4;
        const status = (card?.data?.attributes?.status || "Active").toLowerCase();

        const updated = await bankingAccountRepository.upsertFromProvider(uid, {
            cardId,
            externalIdsKey: "unit",
            externalIdsValue: { cardId },
        });
        await userRepository.update(uid, { virtualCardId: cardId }).catch(() => {});
        await syncUserBankingFields(uid, updated);

        return {
            cardId,
            last4,
            status,
            success: true,
            provider: "unit",
        };
    }

    async function getCardDetails(uid) {
        const record = await bankingAccountRepository.getByUid(uid);
        if (!record?.cardId) {
            const err = new Error("No card found. Create a virtual card first.");
            err.statusCode = 404;
            throw err;
        }
        const card = await unit.getCard(record.cardId);
        const attrs = card?.data?.attributes || {};
        return {
            card: {
                id: record.cardId,
                last4: attrs.last4,
                exp_month: attrs.expirationDate ? parseInt(attrs.expirationDate.split("/")[0], 10) : null,
                exp_year: attrs.expirationDate ? parseInt(attrs.expirationDate.split("/")[1], 10) + 2000 : null,
                status: (attrs.status || "Active").toLowerCase(),
            },
            success: true,
            provider: "unit",
        };
    }

    async function getCardDetailsWithWallet(uid) {
        const details = await getCardDetails(uid);
        return {
            ...details,
            walletProvisioningSupported: false,
            message: "Apple Wallet provisioning requires Stripe Issuing. Use physical/virtual card details with Unit.",
        };
    }

    async function createPushProvisioningEphemeralKey() {
        const err = new Error("Apple Wallet push provisioning is not available with Unit provider.");
        err.code = "not_supported";
        err.statusCode = 400;
        throw err;
    }

    async function createTestAuthorization() {
        const err = new Error("Test authorizations are only available in Stripe Issuing test mode.");
        err.statusCode = 400;
        throw err;
    }

    async function getBalance(uid) {
        const fa = await getFinancialAccountBalance(uid);
        const cents = fa.available?.cash?.usd || fa.balance?.cash?.usd || 0;
        return {
            available: [{ amount: cents, currency: "usd" }],
            pending: [{ amount: 0, currency: "usd" }],
            success: true,
            provider: "unit",
        };
    }

    async function getTransactions(uid, limit) {
        const record = await bankingAccountRepository.getByUid(uid);
        if (!record?.depositAccountId) {
            const err = new Error("No deposit account found");
            err.statusCode = 404;
            throw err;
        }
        const result = await unit.listTransactions(record.depositAccountId, limit || 25);
        const rows = result?.data || [];
        return {
            transactions: rows.map((t) => {
                const a = t.attributes || {};
                return {
                    id: t.id,
                    amount: a.amount,
                    currency: "usd",
                    type: a.type || "transaction",
                    status: a.status || "posted",
                    description: a.summary || a.description || null,
                    created: a.createdAt ? Math.floor(new Date(a.createdAt).getTime() / 1000) : 0,
                    available_on: a.createdAt ? Math.floor(new Date(a.createdAt).getTime() / 1000) : 0,
                    fee: 0,
                    net: a.amount,
                };
            }),
            has_more: !!result?.links?.next,
            success: true,
            provider: "unit",
        };
    }

    async function getAccountDetails(uid) {
        const record = await refreshApplicationState(uid, await ensureRecord(uid));
        const status = await getAccountStatus(uid);
        return {
            accountId: record.customerId || record.applicationId,
            type: "unit_deposit",
            country: "US",
            default_currency: "usd",
            charges_enabled: status.charges_enabled,
            payouts_enabled: status.payouts_enabled,
            details_submitted: status.details_submitted,
            requirements: status.requirements,
            capabilities: status.capabilities,
            business_type: "individual",
            individual: null,
            settings: { payouts: {}, payments: {} },
            external_accounts: [],
            cardholderId: record.customerId || null,
            virtualCardId: record.cardId || null,
            depositAccountId: record.depositAccountId || null,
            created: 0,
            success: true,
            provider: "unit",
        };
    }

    async function getPayouts() {
        return { payouts: [], has_more: false, success: true, provider: "unit" };
    }

    async function createPayout() {
        const err = new Error("Use Unit ACH/wire payments for outbound transfers.");
        err.statusCode = 400;
        throw err;
    }

    async function addBankAccount() {
        const err = new Error("Link external accounts through Unit counterparties.");
        err.statusCode = 400;
        throw err;
    }

    async function updateAccountInfo() {
        const err = new Error("Update customer profile through Unit application/customer APIs.");
        err.statusCode = 400;
        throw err;
    }

    async function acceptTermsOfService(uid) {
        const record = await ensureRecord(uid);
        return { accountId: record.customerId || record.applicationId, tos_accepted: true, success: true, provider: "unit" };
    }

    async function testVerifyAccount(uid) {
        const record = await refreshApplicationState(uid, await ensureRecord(uid));
        return {
            success: true,
            accountId: record.customerId || record.applicationId,
            capabilities: normalizeCapabilities(record),
            message: "Unit sandbox application refreshed",
            provider: "unit",
        };
    }

    async function testCreateTransaction() {
        const err = new Error("Simulated transactions are Stripe test-mode only.");
        err.statusCode = 400;
        throw err;
    }

    async function testAddBalance() {
        const err = new Error("Use Unit sandbox funding APIs to add test balance.");
        err.statusCode = 400;
        throw err;
    }

    async function handleWebhookEvent(event) {
        const db = admin.firestore();
        const eventType = event?.data?.type || event?.type;
        const resource = event?.data?.attributes?.payload?.data || event?.data?.relationships;
        const tags = event?.data?.attributes?.tags || {};
        const uid = tags.firebaseUserId || tags.firebase_user_id;

        if (!uid) return;

        if (eventType === "application.approved" || eventType === "customer.created") {
            await refreshApplicationState(uid, await ensureRecord(uid));
        }

        if (eventType === "account.created" || eventType === "account.opened") {
            const accountId = event?.data?.id;
            if (accountId) {
                await bankingAccountRepository.upsertFromProvider(uid, {
                    depositAccountId: accountId,
                    status: "approved",
                    externalIdsKey: "unit",
                    externalIdsValue: { depositAccountId: accountId },
                });
            }
        }

        if (eventType === "card.created" || eventType === "card.activated") {
            const cardId = event?.data?.id;
            if (cardId) {
                await bankingAccountRepository.upsertFromProvider(uid, {
                    cardId,
                    externalIdsKey: "unit",
                    externalIdsValue: { cardId },
                });
                await userRepository.update(uid, { virtualCardId: cardId }).catch(() => {});
            }
        }

        await db.collection("unitWebhookEvents").doc(String(event?.data?.id || Date.now())).set({
            type: eventType,
            uid,
            receivedAt: admin.firestore.FieldValue.serverTimestamp(),
        }).catch(() => {});
    }

    async function freezeCard(uid, cardId) {
        await unit.updateCard(cardId, { status: "Frozen" });
        return { success: true, provider: "unit" };
    }

    async function unfreezeCard(uid, cardId) {
        await unit.updateCard(cardId, { status: "Active" });
        return { success: true, provider: "unit" };
    }

    return {
        name: "unit",
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
        handleWebhookEvent,
        freezeCard,
        unfreezeCard,
        refreshApplicationState,
    };
}

module.exports = { createUnitBankingProvider, parseDobString, normalizeCapabilities };
