// API wrapper for calling Firebase Cloud Functions
import axios from 'axios';
import firebase from "@/src/firebase";
import { appCheckReady, isAppCheckEnabled } from "@/src/firebase/appCheck";

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

export interface GetFinancialAccountBalanceResponse {
    balance: Record<string, unknown>;
    currency: string;
    status: string;
    features: Record<string, unknown>;
    success: boolean;
}

export interface RetryProvisioningResponse {
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

/** STAGE 4 – Card metadata (last4 only — full number never leaves Stripe; used via Apple Pay) */
export interface GetCardDetailsResponse {
    last4: string;
    exp_month: number;
    exp_year: number;
    brand?: string;
    success: boolean;
}

/** Card details with Apple/Google Wallet provisioning fields */
export interface GetCardDetailsWithWalletResponse {
    last4: string;
    exp_month: number;
    exp_year: number;
    brand?: string;
    cardId: string;
    primaryAccountIdentifier: string | null;
    walletStatus: {
        apple_pay: 'eligible' | 'ineligible';
    };
    success: boolean;
}

/** Push provisioning ephemeral key for Apple/Google Wallet */
export interface CreatePushProvisioningEphemeralKeyPayload {
    apiVersion?: string;
}

export interface CreatePushProvisioningEphemeralKeyResponse {
    ephemeralKey: Record<string, unknown>;
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

/**
 * Resolves an App Check token when App Check is enabled (production or
 * EXPO_PUBLIC_APP_CHECK_IN_DEV). The API middleware may require
 * X-Firebase-AppCheck; without it the server can return 401 before Firebase auth runs.
 * Retries with force-refresh and a short delay to handle cold start after login.
 */
async function getAppCheckTokenForRequest(): Promise<string | undefined> {
    if (!isAppCheckEnabled) {
        return undefined;
    }
    const { getToken } =
        require("@react-native-firebase/app-check") as typeof import("@react-native-firebase/app-check");
    const tryOnce = async (forceRefresh: boolean) => {
        const appCheck = await appCheckReady;
        if (!appCheck) return undefined;
        const result = await getToken(appCheck, forceRefresh);
        return result.token ?? undefined;
    };
    try {
        let t = await tryOnce(false);
        if (!t) t = await tryOnce(true);
        if (t) return t;
    } catch (e) {
        console.warn("[api] App Check getToken failed:", e);
    }
    await new Promise((r) => setTimeout(r, 500));
    try {
        return await tryOnce(true);
    } catch (e) {
        console.warn("[api] App Check retry failed:", e);
        return undefined;
    }
}

/** Auth + optional App Check headers for Cloud Function HTTP calls (including `fetch` from eventService). */
export async function getCloudFunctionAuthHeaders(): Promise<Record<string, string>> {
    const token = await firebase.auth().currentUser?.getIdToken(true);
    if (!token) {
        throw new Error('No authentication token found');
    }
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    const appCheckToken = await getAppCheckTokenForRequest();
    if (appCheckToken) {
        headers["X-Firebase-AppCheck"] = appCheckToken;
    } else if (process.env.NODE_ENV === "development" && isAppCheckEnabled) {
        console.warn(
            "[api] No App Check token — Cloud Functions will return 401. For Expo dev, register a debug token in Firebase Console and set EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN."
        );
    }
    return headers;
}

/**
 * Logs Axios error status + JSON body from Cloud Functions (e.g. "Missing App Check token" vs "Invalid token").
 * Use when debugging 401s from `getChildCard` and other API calls.
 */
export function logApiErrorDetail(prefix: string, err: unknown): void {
    if (!axios.isAxiosError(err)) {
        console.warn(prefix, err);
        return;
    }
    const status = err.response?.status;
    const raw = err.response?.data;
    const serverError =
        raw && typeof raw === "object" && "error" in raw
            ? (raw as { error: string }).error
            : raw;
    const path = err.config?.url?.replace(/^.*\/api/, "") ?? err.config?.url;
    console.warn(`${prefix}`, { status, serverError, path });
    if (status === 401) {
        const hint =
            String(serverError).includes("App Check") || serverError === undefined
                ? "App Check: add EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN (Firebase Console → App Check → Apps → Debug token), or set Cloud Functions env APPCHECK_RELAXED=1 on dev only."
                : String(serverError).includes("Invalid token") || String(serverError).includes("authorization")
                  ? "Auth: sign out and back in, or confirm Firebase project matches the app."
                  : "See serverError above.";
        console.warn("[api] 401 hint:", hint);
    }
}

// ============================================
// Child invite (parent link → child claims account)
// ============================================

export interface ClaimChildInviteResponse {
    childAccountId: string;
    eventId: string;
    eventName?: string;
    ephemeralKeySecret?: string | null;
    cardLast4?: string | null;
}

/** Child: claim invite with token + PIN (requires Firebase Phone Auth). */
export async function claimChildInvite(token: string, pin: string): Promise<ClaimChildInviteResponse> {
    const headers = await getCloudFunctionAuthHeaders();
    const res = await axios.post<ClaimChildInviteResponse>(
        `${BASE}/claimChildInvite`,
        { token, pin },
        { headers }
    );
    return res.data;
}

export interface PendingInviteResponse {
    hasPending: boolean;
    childName?: string | null;
    childPhone?: string | null;
    expiresAt?: string | null;
}

/** Parent: check if a pending invite exists for the given event. */
export async function getPendingInvite(eventId: string): Promise<PendingInviteResponse> {
    const headers = await getCloudFunctionAuthHeaders();
    const res = await axios.get<PendingInviteResponse>(
        `${BASE}/getPendingInvite`,
        { headers, params: { eventId } }
    );
    return res.data;
}

/** Parent: revoke all pending invites for the given event. */
export async function revokeChildInvite(eventId: string): Promise<{ success: boolean; revokedCount: number }> {
    const headers = await getCloudFunctionAuthHeaders();
    const res = await axios.post<{ success: boolean; revokedCount: number }>(
        `${BASE}/revokeChildInvite`,
        { eventId },
        { headers }
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
    const headers = await getCloudFunctionAuthHeaders();
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
    const headers = await getCloudFunctionAuthHeaders();
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
    const headers = await getCloudFunctionAuthHeaders();
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
    const headers = await getCloudFunctionAuthHeaders();
    const res = await axios.post<UpdateAccountCapabilitiesResponse>(
        `${BASE}/updateAccountCapabilities`,
        {},
        { headers }
    );
    return res.data;
}

/**
 * Stripe Connect hosted onboarding (Account Link). Collects KYC in the browser — not in-app.
 * If the user has no Connect account yet, the backend creates one from their Firebase email/name, then returns the link.
 * Return/refresh URLs are chosen on the server (HTTPS on PUBLIC_BASE_URL); Stripe rejects exp:// / custom-scheme URLs.
 */
export async function createOnboardingLink(): Promise<CreateOnboardingLinkResponse> {
    const headers = await getCloudFunctionAuthHeaders();
    const res = await axios.post<CreateOnboardingLinkResponse>(
        `${BASE}/createOnboardingLink`,
        {},
        { headers }
    );
    return res.data;
}

/**
 * Get Treasury Financial Account balance
 */
export async function getFinancialAccountBalance(): Promise<GetFinancialAccountBalanceResponse> {
    const headers = await getCloudFunctionAuthHeaders();
    const res = await axios.get<GetFinancialAccountBalanceResponse>(
        `${BASE}/getFinancialAccountBalance`,
        { headers }
    );
    return res.data;
}

/**
 * Retry a failed provisioning task
 */
export async function retryProvisioning(): Promise<RetryProvisioningResponse> {
    const headers = await getCloudFunctionAuthHeaders();
    const res = await axios.post<RetryProvisioningResponse>(
        `${BASE}/retryProvisioning`,
        {},
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
    const headers = await getCloudFunctionAuthHeaders();
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
    const headers = await getCloudFunctionAuthHeaders();
    const res = await axios.post<CreateVirtualCardResponse>(
        `${BASE}/createVirtualCard`,
        payload,
        { headers }
    );
    return res.data;
}

/**
 * STAGE 4 – Fetch card metadata (last4, expiry, brand). Full card number never leaves Stripe.
 */
export async function getCardDetails(): Promise<GetCardDetailsResponse> {
    const headers = await getCloudFunctionAuthHeaders();
    const res = await axios.get<GetCardDetailsResponse>(
        `${BASE}/getCardDetails`,
        { headers }
    );
    return res.data;
}

/**
 * Get card details including Apple Wallet provisioning fields (primaryAccountIdentifier).
 */
export async function getCardDetailsWithWallet(): Promise<GetCardDetailsWithWalletResponse> {
    const headers = await getCloudFunctionAuthHeaders();
    const res = await axios.get<GetCardDetailsWithWalletResponse>(
        `${BASE}/getCardDetailsWithWallet`,
        { headers }
    );
    return res.data;
}

/**
 * Create an ephemeral key for push provisioning a card to Apple/Google Wallet.
 */
export async function createPushProvisioningEphemeralKey(
    payload: CreatePushProvisioningEphemeralKeyPayload = {}
): Promise<CreatePushProvisioningEphemeralKeyResponse> {
    const headers = await getCloudFunctionAuthHeaders();
    const res = await axios.post<CreatePushProvisioningEphemeralKeyResponse>(
        `${BASE}/createPushProvisioningEphemeralKey`,
        payload,
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
    const headers = await getCloudFunctionAuthHeaders();
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
    const headers = await getCloudFunctionAuthHeaders();
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
    const headers = await getCloudFunctionAuthHeaders();
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
    const headers = await getCloudFunctionAuthHeaders();
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
    const headers = await getCloudFunctionAuthHeaders();
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
    const headers = await getCloudFunctionAuthHeaders();
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
    const headers = await getCloudFunctionAuthHeaders();
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
    const headers = await getCloudFunctionAuthHeaders();
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
    const headers = await getCloudFunctionAuthHeaders();
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
    const headers = await getCloudFunctionAuthHeaders();
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
    const headers = await getCloudFunctionAuthHeaders();
    const res = await axios.post<AcceptTermsOfServiceResponse>(
        `${BASE}/acceptTermsOfService`,
        { ip },
        { headers }
    );
    return res.data;
}

// ============================================
// Child Card Management (parent controls child's Issuing card)
// ============================================

export interface ChildCardInfo {
    id: string;
    last4: string;
    expMonth: number;
    expYear: number;
    status: 'active' | 'inactive' | 'canceled';
    brand: string;
    spendingControls?: {
        spending_limits?: Array<{ amount: number; interval: string }>;
        blocked_categories?: string[];
    };
}

export interface ChildCardResponse {
    success: boolean;
    childName: string | null;
    card: ChildCardInfo;
    balance: number;
}

export interface ChildIssuingTransaction {
    id: string;
    amount: number;
    currency: string;
    merchantName: string;
    merchantCategory: string;
    merchantCity: string | null;
    merchantCountry: string | null;
    type: string;
    created: number;
    status: string;
}

export interface ChildTransactionsResponse {
    success: boolean;
    transactions: ChildIssuingTransaction[];
    hasMore: boolean;
}

export interface ChildSpendingSummaryResponse {
    success: boolean;
    period: string;
    totalSpent: number;
    transactionCount: number;
    averageTransaction: number;
    largestTransaction: number;
    byCategory: Record<string, number>;
    topMerchants: Array<{ name: string; amount: number; count: number }>;
}

export async function getChildCard(childAccountId: string): Promise<ChildCardResponse> {
    const headers = await getCloudFunctionAuthHeaders();
    const res = await axios.get<ChildCardResponse>(
        `${BASE}/getChildCard`,
        { headers, params: { childAccountId } }
    );
    return res.data;
}

export async function freezeChildCard(childAccountId: string): Promise<{ success: boolean }> {
    const headers = await getCloudFunctionAuthHeaders();
    const res = await axios.post<{ success: boolean }>(
        `${BASE}/freezeChildCard`,
        { childAccountId },
        { headers }
    );
    return res.data;
}

export async function unfreezeChildCard(childAccountId: string): Promise<{ success: boolean }> {
    const headers = await getCloudFunctionAuthHeaders();
    const res = await axios.post<{ success: boolean }>(
        `${BASE}/unfreezeChildCard`,
        { childAccountId },
        { headers }
    );
    return res.data;
}

export async function updateChildSpendingLimits(
    childAccountId: string,
    limits: { daily?: number; weekly?: number; monthly?: number; perTransaction?: number }
): Promise<{ success: boolean }> {
    const headers = await getCloudFunctionAuthHeaders();
    const res = await axios.post<{ success: boolean }>(
        `${BASE}/updateChildSpendingLimits`,
        { childAccountId, ...limits },
        { headers }
    );
    return res.data;
}

export async function updateChildBlockedCategories(
    childAccountId: string,
    blockedCategories: string[]
): Promise<{ success: boolean }> {
    const headers = await getCloudFunctionAuthHeaders();
    const res = await axios.post<{ success: boolean }>(
        `${BASE}/updateChildBlockedCategories`,
        { childAccountId, blockedCategories },
        { headers }
    );
    return res.data;
}

export async function getChildTransactions(
    childAccountId: string,
    limit: number = 20,
    startingAfter?: string
): Promise<ChildTransactionsResponse> {
    const headers = await getCloudFunctionAuthHeaders();
    const params: Record<string, string> = { childAccountId, limit: limit.toString() };
    if (startingAfter) params.startingAfter = startingAfter;
    const res = await axios.get<ChildTransactionsResponse>(
        `${BASE}/getChildTransactions`,
        { headers, params }
    );
    return res.data;
}

export async function getChildSpendingSummary(
    childAccountId: string,
    period: 'day' | 'week' | 'month' = 'month'
): Promise<ChildSpendingSummaryResponse> {
    const headers = await getCloudFunctionAuthHeaders();
    const res = await axios.get<ChildSpendingSummaryResponse>(
        `${BASE}/getChildSpendingSummary`,
        { headers, params: { childAccountId, period } }
    );
    return res.data;
}

export interface SendChildInviteResponse {
    success: boolean;
    childName: string | null;
    expiresAt: string;
    /** True when Twilio was not used (Stripe test mode only). */
    smsSkipped?: boolean;
    /** Only when smsSkipped + test mode — use for dev without Twilio. Never shown in production SMS path. */
    devInviteLink?: string;
    devPin?: string;
}

export async function sendChildInvite(
    eventId: string,
    childPhone: string,
    childName: string
): Promise<SendChildInviteResponse> {
    const headers = await getCloudFunctionAuthHeaders();
    const res = await axios.post<SendChildInviteResponse>(
        `${BASE}/sendChildInvite`,
        { eventId, childPhone, childName },
        { headers }
    );
    return res.data;
}

export async function testLinkChildAccount(): Promise<{ success: boolean; childAccountId: string }> {
    const headers = await getCloudFunctionAuthHeaders();
    const res = await axios.post<{ success: boolean; childAccountId: string }>(
        `${BASE}/testLinkChildAccount`,
        {},
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
    const headers = await getCloudFunctionAuthHeaders();
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
    const headers = await getCloudFunctionAuthHeaders();
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
    const headers = await getCloudFunctionAuthHeaders();
    const res = await axios.post<TestTransactionResponse>(
        `${BASE}/testAddBalance`,
        { amount },
        { headers }
    );
    return res.data;
}

