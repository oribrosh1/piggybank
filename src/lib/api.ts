// API wrapper for calling Firebase Cloud Functions
import axios from 'axios';
import firebase from '../firebase';

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

