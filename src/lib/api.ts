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

