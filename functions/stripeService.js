/**
 * StripeService – dedicated module for all Stripe API logic (Connect + Issuing).
 * Keeps Stripe calls in one place; route handlers in index.js delegate here.
 * Never store SSN or full card numbers in the database.
 */

/**
 * Create a Stripe Custom Connected Account (Stage 1).
 * @param {import("stripe").Stripe} stripe
 * @param {{ country: string, profileUrl: string, firstName: string, lastName: string, email: string, phone: string, dob: { day: number, month: number, year: number }, address: string, address2?: string, city: string, state: string, zipCode: string, ssnLast4: string, firebaseUserId?: string }} opts
 * @returns {Promise<import("stripe").Stripe.Account>}
 */
async function createCustomConnectAccount(stripe, opts) {
    const { country = "US", profileUrl, firstName, lastName, email, phone, dob, address, address2, city, state, zipCode, ssnLast4, firebaseUserId } = opts;
    const individual = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        address: {
            line1: address,
            // line2: address2 || undefined,
            city: city,
            state: state,
            postal_code: zipCode,
            country: "US",
        },
    };
    if (dob && typeof dob === "object" && dob.day != null && dob.month != null && dob.year != null) {
        individual.dob = { day: dob.day, month: dob.month, year: dob.year };
    }
    if (ssnLast4) individual.ssn_last_4 = ssnLast4;

    const createPayload = {
        type: "custom",
        country,
        business_type: "individual",
        capabilities: {
            transfers: { requested: true },
            card_payments: { requested: true },
        },
        business_profile: {
            mcc: "7399",
            url: profileUrl,
            product_description: "Personal event fundraising and family allowance management.",
        },
        individual,
        tos_acceptance: { service_agreement: "full" , date: Math.floor(Date.now() / 1000), ip: '0.0.0.0',},
        settings: {
            payouts: { statement_descriptor: "CREDITKID" },
            payments: { statement_descriptor: "CREDITKID GIFT" },
        },
    };
    if (firebaseUserId) {
        createPayload.metadata = { firebase_user_id: firebaseUserId };
    }
    return await stripe.accounts.create(createPayload);
}

/**
 * Create an Account Link for hosted onboarding (Stage 2).
 * @param {import("stripe").Stripe} stripe
 * @param {{ accountId: string, returnUrl: string, refreshUrl: string }} opts
 * @returns {Promise<import("stripe").Stripe.AccountLink>}
 */
async function createAccountLink(stripe, opts) {
    const { accountId, returnUrl, refreshUrl } = opts;
    return stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: "account_onboarding",
        collection_options: { fields: "eventually_due" },
    });
}

/**
 * Get issuing balance for a connected account (Stage 3).
 * @param {import("stripe").Stripe} stripe
 * @param {string} accountId
 * @returns {Promise<{ issuingAvailable: number, currency: string }>}
 */
async function getIssuingBalance(stripe, accountId) {
    const balance = await stripe.balance.retrieve({ stripeAccount: accountId });
    const issuing = balance.issuing || { available: [{ amount: 0, currency: "usd" }] };
    const availableCents = (issuing.available && issuing.available[0]) ? issuing.available[0].amount : 0;
    const currency = (issuing.available && issuing.available[0]) ? issuing.available[0].currency : "usd";
    return { issuingAvailable: availableCents, currency };
}

/**
 * Top up issuing balance from linked bank (Stage 3).
 * @param {import("stripe").Stripe} stripe
 * @param {{ accountId: string, amount: number }} opts
 * @returns {Promise<import("stripe").Stripe.Topup>}
 */
async function topUpIssuing(stripe, opts) {
    const { accountId, amount } = opts;
    return stripe.topups.create(
        { amount: Number(amount), currency: "usd", description: "CreditKid Issuing balance top-up" },
        { stripeAccount: accountId }
    );
}

/**
 * Create an Issuing cardholder (Stage 4).
 * @param {import("stripe").Stripe} stripe
 * @param {{ accountId: string, name: string, email: string, phone?: string, line1: string, line2?: string, city: string, state: string, postal_code: string, dob?: object }} opts
 * @returns {Promise<import("stripe").Stripe.Issuing.Cardholder>}
 */
async function createIssuingCardholder(stripe, opts) {
    const { accountId, name, email, phone, line1, line2, city, state, postal_code, dob } = opts;
    const [first_name, ...lastParts] = (name || "").trim().split(/\s+/);
    const last_name = lastParts.length ? lastParts.join(" ") : first_name;
    return stripe.issuing.cardholders.create(
        {
            type: "individual",
            name: `${first_name} ${last_name}`,
            email,
            phone_number: phone || undefined,
            billing: {
                address: {
                    line1,
                    line2: line2 || undefined,
                    city,
                    state,
                    postal_code,
                    country: "US",
                },
            },
            individual: {
                first_name,
                last_name,
                dob: dob ? (typeof dob === "object" ? dob : { day: 1, month: 1, year: 1990 }) : undefined,
            },
        },
        { stripeAccount: accountId }
    );
}

/**
 * Create and activate a virtual card (Stage 4).
 * @param {import("stripe").Stripe} stripe
 * @param {{ accountId: string, cardholderId: string, spendingLimitAmount?: number, spendingLimitInterval?: string }} opts
 * @returns {Promise<import("stripe").Stripe.Issuing.Card>}
 */
async function createVirtualCard(stripe, opts) {
    const { accountId, cardholderId, spendingLimitAmount = 50000, spendingLimitInterval = "per_authorization" } = opts;
    return stripe.issuing.cards.create(
        {
            cardholder: cardholderId,
            type: "virtual",
            currency: "usd",
            status: "active",
            spending_controls: {
                spending_limits: [
                    {
                        amount: Math.min(Number(spendingLimitAmount) || 50000, 50000),
                        interval: spendingLimitInterval,
                    },
                ],
            },
        },
        { stripeAccount: accountId }
    );
}

/**
 * Retrieve card sensitive details (number, CVC) server-side only. Never store in DB.
 * @param {import("stripe").Stripe} stripe
 * @param {{ accountId: string, cardId: string }} opts
 * @returns {Promise<{ last4: string, exp_month: number, exp_year: number, brand?: string, number?: string, cvc?: string }>}
 */
async function getCardDetails(stripe, opts) {
    const { accountId, cardId } = opts;
    const card = await stripe.issuing.cards.retrieve(
        cardId,
        { expand: ["number", "cvc"] },
        { stripeAccount: accountId }
    );
    const out = {
        last4: card.last4,
        exp_month: card.exp_month,
        exp_year: card.exp_year,
        brand: card.brand,
    };
    if (card.number) out.number = card.number;
    if (card.cvc) out.cvc = card.cvc;
    return out;
}

/**
 * Update a Connect account to request capabilities (e.g. if they were not requested at creation).
 * Optionally sets metadata.firebase_user_id if provided (backfill for existing accounts).
 * @param {import("stripe").Stripe} stripe
 * @param {string} accountId - Connect account ID (acct_xxx)
 * @param {{ firebaseUserId?: string }} opts - optional; if firebaseUserId is set, metadata is included in the update
 * @returns {Promise<import("stripe").Stripe.Account>}
 */
async function updateAccountCapabilities(stripe, accountId, opts = {}) {
    const payload = {
        capabilities: {
            card_issuing: { requested: true },
            transfers: { requested: true },
            card_payments: { requested: true }
        },
    };
    if (opts.firebaseUserId) {
        payload.metadata = { firebase_user_id: opts.firebaseUserId };
    }
    return stripe.accounts.update(accountId, payload);
}

/**
 * Create a test-mode authorization for an Issuing card (test mode only).
 * @param {import("stripe").Stripe} stripe
 * @param {{ accountId: string; cardId: string; amount?: number; currency?: string }} opts
 * @returns {Promise<import("stripe").Stripe.Issuing.Authorization>}
 */
async function createTestAuthorization(stripe, opts) {
    const { accountId, cardId, amount = 1000, currency = "usd" } = opts;
    return stripe.testHelpers.issuing.authorizations.create(
        { card: cardId, amount, currency },
        { stripeAccount: accountId }
    );
}

/**
 * Retrieve the connected account's balance (available + pending).
 * @param {import("stripe").Stripe} stripe
 * @param {string} accountId
 */
async function getConnectBalance(stripe, accountId) {
    return stripe.balance.retrieve({ stripeAccount: accountId });
}

/**
 * List balance transactions for a connected account.
 * @param {import("stripe").Stripe} stripe
 * @param {string} accountId
 * @param {{ limit?: number, starting_after?: string }} opts
 */
async function getBalanceTransactions(stripe, accountId, opts = {}) {
    const params = { limit: opts.limit || 10 };
    if (opts.starting_after) params.starting_after = opts.starting_after;
    return stripe.balanceTransactions.list(params, { stripeAccount: accountId });
}

/**
 * Retrieve full account object for a connected account.
 * @param {import("stripe").Stripe} stripe
 * @param {string} accountId
 */
async function getFullAccount(stripe, accountId) {
    return stripe.accounts.retrieve(accountId);
}

/**
 * List payouts for a connected account.
 * @param {import("stripe").Stripe} stripe
 * @param {string} accountId
 * @param {{ limit?: number, starting_after?: string }} opts
 */
async function listPayouts(stripe, accountId, opts = {}) {
    const params = { limit: opts.limit || 10 };
    if (opts.starting_after) params.starting_after = opts.starting_after;
    return stripe.payouts.list(params, { stripeAccount: accountId });
}

/**
 * Create a payout from connected account to their bank.
 * @param {import("stripe").Stripe} stripe
 * @param {string} accountId
 * @param {{ amount: number, currency?: string }} opts
 */
async function createPayout(stripe, accountId, opts) {
    return stripe.payouts.create(
        { amount: opts.amount, currency: opts.currency || "usd" },
        { stripeAccount: accountId }
    );
}

/**
 * Add an external bank account to a connected account.
 * @param {import("stripe").Stripe} stripe
 * @param {string} accountId
 * @param {{ account_holder_name: string, account_holder_type?: string, routing_number: string, account_number: string, country?: string, currency?: string }} opts
 */
async function addBankAccount(stripe, accountId, opts) {
    return stripe.accounts.createExternalAccount(accountId, {
        external_account: {
            object: "bank_account",
            country: opts.country || "US",
            currency: opts.currency || "usd",
            account_holder_name: opts.account_holder_name,
            account_holder_type: opts.account_holder_type || "individual",
            routing_number: opts.routing_number,
            account_number: opts.account_number,
        },
    });
}

/**
 * Update individual/business info on a connected account.
 * @param {import("stripe").Stripe} stripe
 * @param {string} accountId
 * @param {object} payload
 */
async function updateAccountInfo(stripe, accountId, payload) {
    const update = {};
    const individual = {};

    if (payload.first_name) individual.first_name = payload.first_name;
    if (payload.last_name) individual.last_name = payload.last_name;
    if (payload.email) individual.email = payload.email;
    if (payload.phone) individual.phone = payload.phone;
    if (payload.dob) individual.dob = payload.dob;
    if (payload.address) individual.address = payload.address;
    if (payload.ssn_last_4) individual.ssn_last_4 = payload.ssn_last_4;
    if (payload.id_number) individual.id_number = payload.id_number;

    if (Object.keys(individual).length > 0) update.individual = individual;

    const bp = {};
    if (payload.business_profile_mcc) bp.mcc = payload.business_profile_mcc;
    if (payload.business_profile_url) bp.url = payload.business_profile_url;
    if (payload.business_profile_product_description) bp.product_description = payload.business_profile_product_description;
    if (payload.business_profile_support_phone) bp.support_phone = payload.business_profile_support_phone;
    if (Object.keys(bp).length > 0) update.business_profile = bp;

    if (payload.statement_descriptor) {
        update.settings = { payments: { statement_descriptor: payload.statement_descriptor } };
    }

    return stripe.accounts.update(accountId, update);
}

/**
 * Accept TOS for a connected account.
 * @param {import("stripe").Stripe} stripe
 * @param {string} accountId
 * @param {string} [ip]
 */
async function acceptTos(stripe, accountId, ip) {
    return stripe.accounts.update(accountId, {
        tos_acceptance: {
            date: Math.floor(Date.now() / 1000),
            ip: ip || "0.0.0.0",
        },
    });
}

module.exports = {
    createCustomConnectAccount,
    createAccountLink,
    getIssuingBalance,
    topUpIssuing,
    createIssuingCardholder,
    createVirtualCard,
    getCardDetails,
    updateAccountCapabilities,
    createTestAuthorization,
    getConnectBalance,
    getBalanceTransactions,
    getFullAccount,
    listPayouts,
    createPayout,
    addBankAccount,
    updateAccountInfo,
    acceptTos,
};
