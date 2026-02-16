// API wrapper for calling Firebase Cloud Functions
import axios from 'axios';
import firebase from "@/src/firebase";

// API base URL from environment variables
const BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "https://us-central1-piggybank-a0011.cloudfunctions.net/api";

// ============================================
// Type Definitions
// ============================================

export interface CreateExpressAccountPayload {
    email?: string;
    country?: string;
    business_type?: 'individual' | 'company';
}

export interface CreateExpressAccountResponse {
    accountId: string;
    accountLink: string;
    success: boolean;
}

export interface CreateCustomConnectAccountPayload {
    country?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dob: string;
    address: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    ssnLast4: string;
    /** Document type chosen by user (e.g. drivers_license, passport). */
    idDocumentType?: string;
    /** If true (test mode only), backend attaches Stripe test identity document. */
    useTestDocument?: boolean;
    /** Bank account for payouts: 9-digit routing number. */
    routingNumber?: string;
    /** Bank account number (full). */
    accountNumber?: string;
    /** Account holder name for the bank account. */
    accountHolderName?: string;
}

export interface CreateCustomConnectAccountResponse {
    accountId: string;
    success: boolean;
    existing?: boolean;
}

/** Stripe Connect account capabilities (e.g. card_issuing, transfers) */
export type AccountCapabilities = Record<string, 'active' | 'inactive' | 'pending'>;

export interface AccountStatusResponse {
    exists: boolean;
    accountId?: string;
    charges_enabled?: boolean;
    payouts_enabled?: boolean;
    details_submitted?: boolean;
    requirements?: {
        currently_due: string[];
        eventually_due: string[];
        past_due: string[];
    };
    /** e.g. { card_issuing: 'active', transfers: 'active' } – only proceed to Issue Card when card_issuing === 'active' */
    capabilities?: AccountCapabilities;
}

export interface UpdateAccountCapabilitiesResponse {
    accountId: string;
    capabilities?: AccountCapabilities;
    success: boolean;
}

export interface UploadVerificationFilePayload {
    accountId: string;
    storagePath: string;
    purpose?: 'identity_document' | 'additional_verification';
}

export interface UploadVerificationFileResponse {
    fileId: string;
    success: boolean;
}

export interface CreatePaymentIntentPayload {
    amount: number;
    currency?: string;
    connectedAccountId: string;
    description?: string;
}

export interface CreatePaymentIntentResponse {
    clientSecret: string;
    paymentIntentId: string;
    success: boolean;
}

export interface BalanceAmount {
    amount: number;
    currency: string;
    source_types?: {
        card?: number;
        [key: string]: number | undefined;
    };
}

export interface GetBalanceResponse {
    available: BalanceAmount[];
    pending: BalanceAmount[];
    success: boolean;
}

export interface CreatePayoutPayload {
    amount: number;
    currency?: string;
}

export interface CreatePayoutResponse {
    payoutId: string;
    amount: number;
    arrival_date: number;
    success: boolean;
}

export interface Transaction {
    id: string;
    amount: number;
    currency: string;
    type: string;
    status: string;
    description: string | null;
    created: number;
    available_on: number;
    fee: number;
    net: number;
}

export interface GetTransactionsResponse {
    transactions: Transaction[];
    has_more: boolean;
    success: boolean;
}

export interface ExternalBankAccount {
    id: string;
    object: string;
    bank_name: string;
    last4: string;
    routing_number: string;
    currency: string;
    country: string;
    default_for_currency: boolean;
    status: string;
}

export interface AccountRequirements {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
    pending_verification: string[];
    disabled_reason: string | null;
}

export interface GetAccountDetailsResponse {
    accountId: string;
    type: string;
    country: string;
    default_currency: string;
    charges_enabled: boolean;
    payouts_enabled: boolean;
    details_submitted: boolean;
    requirements: AccountRequirements;
    capabilities: Record<string, string>;
    business_type: string;
    individual: {
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
        dob: { day: number; month: number; year: number } | null;
        address: {
            line1: string;
            line2: string;
            city: string;
            state: string;
            postal_code: string;
            country: string;
        } | null;
        verification: {
            status: string;
            document: { front: string | null; back: string | null };
        };
    } | null;
    settings: {
        payouts: { schedule: { interval: string } };
        payments: Record<string, unknown>;
    };
    external_accounts: ExternalBankAccount[];
    cardholderId?: string | null;
    virtualCardId?: string | null;
    created: number;
    success: boolean;
}

export interface Payout {
    id: string;
    amount: number;
    currency: string;
    status: string;
    arrival_date: number;
    created: number;
    method: string;
    type: string;
    description: string | null;
    destination: string;
    failure_message: string | null;
}

export interface GetPayoutsResponse {
    payouts: Payout[];
    has_more: boolean;
    success: boolean;
}

export interface AddBankAccountPayload {
    account_holder_name: string;
    account_holder_type?: 'individual' | 'company';
    routing_number: string;
    account_number: string;
    country?: string;
    currency?: string;
}

export interface AddBankAccountResponse {
    bankAccountId: string;
    bank_name: string;
    last4: string;
    success: boolean;
}

export interface UpdateAccountInfoPayload {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    dob?: { day: number; month: number; year: number };
    address?: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
    };
    ssn_last_4?: string;
    id_number?: string;
    business_profile_mcc?: string;
    business_profile_url?: string;
    business_profile_product_description?: string;
    business_profile_support_phone?: string;
    statement_descriptor?: string;
}

export interface UpdateAccountInfoResponse {
    accountId: string;
    requirements: AccountRequirements;
    charges_enabled: boolean;
    payouts_enabled: boolean;
    success: boolean;
}

export interface AcceptTermsOfServiceResponse {
    accountId: string;
    tos_accepted: boolean;
    success: boolean;
}

export interface CreateOnboardingLinkResponse {
    accountId: string;
    url: string;
    success: boolean;
}

export interface GetIssuingBalanceResponse {
    issuingAvailable: number;
    issuingAvailableFormatted: string;
    currency: string;
    canCreateCard: boolean;
    success: boolean;
}

export interface TopUpIssuingPayload {
    amount: number; // cents
}

export interface TopUpIssuingResponse {
    topupId: string;
    amount: number;
    status: string;
    success: boolean;
}

export interface CreateIssuingCardholderPayload {
    name: string;
    email: string;
    phone?: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    dob?: { day: number; month: number; year: number };
}

export interface CreateIssuingCardholderResponse {
    cardholderId: string;
    success: boolean;
    existing?: boolean;
}

export interface CreateVirtualCardPayload {
    spendingLimitAmount?: number; // cents, default 50000 ($500)
    spendingLimitInterval?: 'per_authorization' | 'daily' | 'weekly' | 'monthly' | 'all_time';
}

export interface CreateVirtualCardResponse {
    cardId: string;
    last4: string;
    status: string;
    success: boolean;
}

/** STAGE 4 – Server-side card details (number, CVC); never stored in DB */
export interface GetCardDetailsResponse {
    last4: string;
    exp_month: number;
    exp_year: number;
    brand?: string;
    number?: string;
    cvc?: string;
    success: boolean;
}

/** Test mode only – create a test authorization on the user's Issuing card */
export interface CreateTestAuthorizationResponse {
    authorizationId: string;
    amount: number;
    currency: string;
    approved: boolean;
    status: string;
    success: boolean;
}

// Test endpoints (only work in test mode)
export interface TestTransactionResponse {
    success: boolean;
    paymentIntentId?: string;
    transferId?: string;
    amount: number;
    status?: string;
    message: string;
}

// ============================================
// Helper Functions
// ============================================

async function authHeaders(): Promise<{ Authorization: string }> {
    const token = await firebase.auth().currentUser?.getIdToken(true);
    if (!token) {
        throw new Error('No authentication token found');
    }
    return { Authorization: `Bearer ${token}` };
}

// ============================================
// Child invite (parent link → child claims account)
// ============================================

export interface GetChildInviteLinkResponse {
    link: string;
    expiresAt: string;
    token: string;
}

export interface ClaimChildInviteResponse {
    customToken: string;
    childAccountId: string;
    eventId: string;
    eventName?: string;
}

/** Parent: get SMS link for child to open (requires auth). */
export async function getChildInviteLink(eventId: string): Promise<GetChildInviteLinkResponse> {
    const headers = await authHeaders();
    const res = await axios.post<GetChildInviteLinkResponse>(
        `${BASE}/getChildInviteLink`,
        { eventId },
        { headers }
    );
    return res.data;
}

/** Child: claim invite with token from link (no auth). Returns customToken to sign in. */
export async function claimChildInvite(token: string): Promise<ClaimChildInviteResponse> {
    const res = await axios.post<ClaimChildInviteResponse>(
        `${BASE}/claimChildInvite`,
        { token },
        { headers: { 'Content-Type': 'application/json' } }
    );
    return res.data;
}

// ============================================
// API Functions
// ============================================

/**
 * Create a Stripe Express Connect account
 */
export async function createExpressAccount(
    payload: CreateExpressAccountPayload
): Promise<CreateExpressAccountResponse> {
    const headers = await authHeaders();
    const res = await axios.post<CreateExpressAccountResponse>(
        `${BASE}/createExpressAccount`,
        payload,
        { headers }
    );
    return res.data;
}

/**
 * Create Stripe Connect Custom account (in-app onboarding, no redirect).
 * Call this before updating individual/business info and adding bank account.
 */
export async function createCustomConnectAccount(
    payload: CreateCustomConnectAccountPayload
): Promise<CreateCustomConnectAccountResponse> {
    const headers = await authHeaders();
    const res = await axios.post<CreateCustomConnectAccountResponse>(
        `${BASE}/createCustomConnectAccount`,
        payload,
        { headers }
    );
    return res.data;
}

/**
 * Get Stripe account status and verification details
 */
export async function getAccountStatus(): Promise<AccountStatusResponse> {
    const headers = await authHeaders();
    const res = await axios.get<AccountStatusResponse>(
        `${BASE}/getAccountStatus`,
        { headers }
    );
    return res.data;
}

/**
 * Request capabilities (card_issuing, transfers) on the Connect account. Use if account was created without them.
 */
export async function updateAccountCapabilities(): Promise<UpdateAccountCapabilitiesResponse> {
    const headers = await authHeaders();
    const res = await axios.post<UpdateAccountCapabilitiesResponse>(
        `${BASE}/updateAccountCapabilities`,
        {},
        { headers }
    );
    return res.data;
}

/**
 * STAGE 2 – Create Stripe Hosted Onboarding link (SSN, DOB, Address, Bank)
 */
export async function createOnboardingLink(): Promise<CreateOnboardingLinkResponse> {
    const headers = await authHeaders();
    const res = await axios.post<CreateOnboardingLinkResponse>(
        `${BASE}/createOnboardingLink`,
        {},
        { headers }
    );
    return res.data;
}

/**
 * STAGE 2.5 – Get Issuing balance; canCreateCard when > $0
 */
export async function getIssuingBalance(): Promise<GetIssuingBalanceResponse> {
    const headers = await authHeaders();
    const res = await axios.get<GetIssuingBalanceResponse>(
        `${BASE}/getIssuingBalance`,
        { headers }
    );
    return res.data;
}

/**
 * STAGE 2.5 – Top-up Issuing balance (from linked bank)
 */
export async function topUpIssuing(
    payload: TopUpIssuingPayload
): Promise<TopUpIssuingResponse> {
    const headers = await authHeaders();
    const res = await axios.post<TopUpIssuingResponse>(
        `${BASE}/topUpIssuing`,
        payload,
        { headers }
    );
    return res.data;
}

/**
 * STAGE 3 – Create Issuing cardholder (individual, KYC details)
 */
export async function createIssuingCardholder(
    payload: CreateIssuingCardholderPayload
): Promise<CreateIssuingCardholderResponse> {
    const headers = await authHeaders();
    const res = await axios.post<CreateIssuingCardholderResponse>(
        `${BASE}/createIssuingCardholder`,
        payload,
        { headers }
    );
    return res.data;
}

/**
 * STAGE 3 – Issue virtual card (only when funded and verified)
 */
export async function createVirtualCard(
    payload: CreateVirtualCardPayload = {}
): Promise<CreateVirtualCardResponse> {
    const headers = await authHeaders();
    const res = await axios.post<CreateVirtualCardResponse>(
        `${BASE}/createVirtualCard`,
        payload,
        { headers }
    );
    return res.data;
}

/**
 * STAGE 4 – Fetch card sensitive details (number, CVV) securely from server. Never stored in DB.
 */
export async function getCardDetails(): Promise<GetCardDetailsResponse> {
    const headers = await authHeaders();
    const res = await axios.get<GetCardDetailsResponse>(
        `${BASE}/getCardDetails`,
        { headers }
    );
    return res.data;
}

/**
 * Test mode only – create a test authorization on the user's virtual card (e.g. $10 default).
 */
export async function createTestAuthorization(
    payload: { amount?: number } = {}
): Promise<CreateTestAuthorizationResponse> {
    const headers = await authHeaders();
    const res = await axios.post<CreateTestAuthorizationResponse>(
        `${BASE}/createTestAuthorization`,
        payload,
        { headers }
    );
    return res.data;
}

/**
 * Upload identity verification file to Stripe
 */
export async function uploadVerificationFile(
    payload: UploadVerificationFilePayload
): Promise<UploadVerificationFileResponse> {
    const headers = await authHeaders();
    const res = await axios.post<UploadVerificationFileResponse>(
        `${BASE}/uploadVerificationFile`,
        payload,
        { headers }
    );
    return res.data;
}

/**
 * Create a payment intent to receive money into Connect account
 */
export async function createPaymentIntent(
    payload: CreatePaymentIntentPayload
): Promise<CreatePaymentIntentResponse> {
    const headers = await authHeaders();
    const res = await axios.post<CreatePaymentIntentResponse>(
        `${BASE}/createPaymentIntent`,
        payload,
        { headers }
    );
    return res.data;
}

/**
 * Get Stripe account balance
 */
export async function getBalance(): Promise<GetBalanceResponse> {
    const headers = await authHeaders();
    const res = await axios.get<GetBalanceResponse>(
        `${BASE}/getBalance`,
        { headers }
    );
    return res.data;
}

/**
 * Create a payout to withdraw money to bank account
 */
export async function createPayout(
    payload: CreatePayoutPayload
): Promise<CreatePayoutResponse> {
    const headers = await authHeaders();
    const res = await axios.post<CreatePayoutResponse>(
        `${BASE}/createPayout`,
        payload,
        { headers }
    );
    return res.data;
}

/**
 * Get transaction history for the connected Stripe account
 */
export async function getTransactions(
    limit: number = 10,
    starting_after?: string
): Promise<GetTransactionsResponse> {
    const headers = await authHeaders();
    const params = new URLSearchParams({ limit: limit.toString() });
    if (starting_after) {
        params.append('starting_after', starting_after);
    }
    const res = await axios.get<GetTransactionsResponse>(
        `${BASE}/getTransactions?${params.toString()}`,
        { headers }
    );
    return res.data;
}

/**
 * Get full Stripe Custom account details
 */
export async function getAccountDetails(): Promise<GetAccountDetailsResponse> {
    const headers = await authHeaders();
    const res = await axios.get<GetAccountDetailsResponse>(
        `${BASE}/getAccountDetails`,
        { headers }
    );
    return res.data;
}

/**
 * Get payout history
 */
export async function getPayouts(
    limit: number = 10,
    starting_after?: string
): Promise<GetPayoutsResponse> {
    const headers = await authHeaders();
    const params = new URLSearchParams({ limit: limit.toString() });
    if (starting_after) {
        params.append('starting_after', starting_after);
    }
    const res = await axios.get<GetPayoutsResponse>(
        `${BASE}/getPayouts?${params.toString()}`,
        { headers }
    );
    return res.data;
}

/**
 * Add a bank account to the Stripe Custom account
 */
export async function addBankAccount(
    payload: AddBankAccountPayload
): Promise<AddBankAccountResponse> {
    const headers = await authHeaders();
    const res = await axios.post<AddBankAccountResponse>(
        `${BASE}/addBankAccount`,
        payload,
        { headers }
    );
    return res.data;
}

/**
 * Update account verification info for Custom accounts
 */
export async function updateAccountInfo(
    payload: UpdateAccountInfoPayload
): Promise<UpdateAccountInfoResponse> {
    const headers = await authHeaders();
    const res = await axios.post<UpdateAccountInfoResponse>(
        `${BASE}/updateAccountInfo`,
        payload,
        { headers }
    );
    return res.data;
}

/**
 * Accept Stripe Terms of Service (required for Custom accounts)
 */
export async function acceptTermsOfService(
    ip?: string
): Promise<AcceptTermsOfServiceResponse> {
    const headers = await authHeaders();
    const res = await axios.post<AcceptTermsOfServiceResponse>(
        `${BASE}/acceptTermsOfService`,
        { ip },
        { headers }
    );
    return res.data;
}

// ============================================
// TEST ENDPOINTS (Only work in Stripe test mode)
// ============================================

interface TestVerifyResponse {
    success: boolean;
    accountId: string;
    capabilities: Record<string, string>;
    message: string;
}

/**
 * Auto-verify account for testing (enables transfers capability)
 * Only works in Stripe test mode!
 */
export async function testVerifyAccount(): Promise<TestVerifyResponse> {
    const headers = await authHeaders();
    const res = await axios.post<TestVerifyResponse>(
        `${BASE}/testVerifyAccount`,
        {},
        { headers }
    );
    return res.data;
}

/**
 * Create a test transaction (simulates receiving a payment)
 * Only works in Stripe test mode!
 */
export async function testCreateTransaction(
    amount: number = 2500 // Amount in cents, default $25
): Promise<TestTransactionResponse> {
    const headers = await authHeaders();
    const res = await axios.post<TestTransactionResponse>(
        `${BASE}/testCreateTransaction`,
        { amount },
        { headers }
    );
    return res.data;
}

/**
 * Add test balance directly (simulates a transfer)
 * Only works in Stripe test mode!
 */
export async function testAddBalance(
    amount: number = 5000 // Amount in cents, default $50
): Promise<TestTransactionResponse> {
    const headers = await authHeaders();
    const res = await axios.post<TestTransactionResponse>(
        `${BASE}/testAddBalance`,
        { amount },
        { headers }
    );
    return res.data;
}

