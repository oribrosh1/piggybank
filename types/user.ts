/**
 * User Types
 * Defines user profile and account data structures
 */

import {
    DocumentData,
    FirestoreDataConverter,
    QueryDocumentSnapshot,
    SnapshotOptions,
    Timestamp
} from 'firebase/firestore';

/**
 * KYC (Know Your Customer) verification status
 */
export type KYCStatus = 'pending' | 'approved' | 'rejected' | 'not_started';

/**
 * Identity verification status
 */
export type VerificationStatus = 'pending' | 'verified' | 'failed' | 'not_started';

/**
 * Stripe Connect account status
 */
export type StripeAccountStatus =
    | 'onboarding_required'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'restricted';

/**
 * Getting Started step (1-4)
 * 1: Create, manage & track event + invite guests
 * 2: Get virtual card + receive gifts to balance
 * 3: Assign card to child (child downloads app)
 * 4: Child pays with Apple Pay + parents track spending
 */
export type OnboardingStep = 1 | 2 | 3 | 4;

/**
 * Account type - Parent creates events, Child spends with virtual card
 */
export type AccountType = 'parent' | 'child';

/**
 * Core user profile data stored in Firestore
 */
export interface UserProfile {
    // Firebase Auth
    uid: string;
    email: string | null;

    // Personal Info
    fullName: string;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;

    // Verification Status
    kycStatus: KYCStatus;
    verificationStatus: VerificationStatus;

    // Stripe Connect Account
    stripeAccountId?: string;
    stripeAccountLink?: string;
    stripeAccountCreated?: boolean;
    stripeAccountStatus?: StripeAccountStatus;
    stripeAccountError?: string;

    // Settings
    notificationsEnabled: boolean;
    biometricEnabled: boolean;

    // Stats
    eventsCreated: number;
    eventsAttended: number;
    totalReceived: number; // in cents
    totalPaid: number; // in cents

    // Onboarding Progress (1-7, completed steps)
    onboardingStep?: OnboardingStep;

    // Family & Account Type
    accountType: AccountType;   // 'parent' or 'child'
    familyId?: string;          // Family group ID (shared between parent & children)

    // For Parent accounts
    childIds?: string[];        // Array of linked child UIDs

    // For Child accounts
    parentIds?: string[];       // Array of linked parent UIDs
    virtualCardId?: string;     // Assigned virtual card ID
    totalSpent?: number;        // Total amount spent (in cents)

    // Spending controls (set by parent for child)
    spendingLimitDaily?: number;    // Daily limit in cents
    spendingLimitMonthly?: number;  // Monthly limit in cents
}

/**
 * Data required to create a new user profile
 */
export interface CreateUserProfileData {
    uid: string;
    email: string | null;
    fullName: string;
    createdAt: Date;
    updatedAt: Date;
    kycStatus: KYCStatus;
    verificationStatus: VerificationStatus;
    notificationsEnabled: boolean;
    biometricEnabled: boolean;
    eventsCreated: number;
    eventsAttended: number;
    totalReceived: number;
    totalPaid: number;
}

/**
 * Partial updates allowed to user profile
 */
export type UpdateUserProfileData = Partial<Omit<UserProfile, 'uid' | 'createdAt'>>;

/**
 * User credential from Firebase Auth
 */
export interface UserCredential {
    user: {
        uid: string;
        email: string | null;
    };
}

/**
 * Additional data passed during signup
 */
export interface SignupAdditionalData {
    fullName?: string;
}

/**
 * Result of user profile initialization
 */
export interface InitializeUserResult {
    success: boolean;
    userProfile: CreateUserProfileData;
    stripeAccount: {
        accountId: string;
        accountLink: string;
        success: boolean;
    } | null;
    message: string;
    warning?: string;
}

/**
 * Firestore Converter for UserProfile
 * Automatically converts between Firestore documents and TypeScript types
 */
export const userProfileConverter: FirestoreDataConverter<UserProfile> = {
    /**
     * Convert TypeScript object to Firestore document
     * Removes undefined values (Firestore doesn't accept them)
     */
    toFirestore(userProfile: UserProfile): DocumentData {
        const data: DocumentData = {
            uid: userProfile.uid,
            email: userProfile.email,
            fullName: userProfile.fullName,
            createdAt: userProfile.createdAt instanceof Date
                ? Timestamp.fromDate(userProfile.createdAt)
                : userProfile.createdAt,
            updatedAt: userProfile.updatedAt instanceof Date
                ? Timestamp.fromDate(userProfile.updatedAt)
                : userProfile.updatedAt,
            kycStatus: userProfile.kycStatus,
            verificationStatus: userProfile.verificationStatus,
            notificationsEnabled: userProfile.notificationsEnabled,
            biometricEnabled: userProfile.biometricEnabled,
            eventsCreated: userProfile.eventsCreated,
            eventsAttended: userProfile.eventsAttended,
            totalReceived: userProfile.totalReceived,
            totalPaid: userProfile.totalPaid,
        };

        // Add optional Stripe fields only if they have values
        if (userProfile.stripeAccountId) data.stripeAccountId = userProfile.stripeAccountId;
        if (userProfile.stripeAccountLink) data.stripeAccountLink = userProfile.stripeAccountLink;
        if (userProfile.stripeAccountCreated !== undefined) data.stripeAccountCreated = userProfile.stripeAccountCreated;
        if (userProfile.stripeAccountStatus) data.stripeAccountStatus = userProfile.stripeAccountStatus;
        if (userProfile.stripeAccountError) data.stripeAccountError = userProfile.stripeAccountError;

        // Add onboarding step if set
        if (userProfile.onboardingStep) data.onboardingStep = userProfile.onboardingStep;

        // Family-related fields
        data.accountType = userProfile.accountType;
        if (userProfile.familyId) data.familyId = userProfile.familyId;
        if (userProfile.childIds?.length) data.childIds = userProfile.childIds;
        if (userProfile.parentIds?.length) data.parentIds = userProfile.parentIds;
        if (userProfile.virtualCardId) data.virtualCardId = userProfile.virtualCardId;
        if (userProfile.totalSpent !== undefined) data.totalSpent = userProfile.totalSpent;
        if (userProfile.spendingLimitDaily !== undefined) data.spendingLimitDaily = userProfile.spendingLimitDaily;
        if (userProfile.spendingLimitMonthly !== undefined) data.spendingLimitMonthly = userProfile.spendingLimitMonthly;

        return data;
    },

    /**
     * Convert Firestore document to TypeScript object
     */
    fromFirestore(
        snapshot: QueryDocumentSnapshot,
        options?: SnapshotOptions
    ): UserProfile {
        const data = snapshot.data(options);

        return {
            uid: data.uid,
            email: data.email ?? null,
            fullName: data.fullName,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            kycStatus: data.kycStatus,
            verificationStatus: data.verificationStatus,
            stripeAccountId: data.stripeAccountId,
            stripeAccountLink: data.stripeAccountLink,
            stripeAccountCreated: data.stripeAccountCreated,
            stripeAccountStatus: data.stripeAccountStatus,
            stripeAccountError: data.stripeAccountError,
            notificationsEnabled: data.notificationsEnabled ?? true,
            biometricEnabled: data.biometricEnabled ?? false,
            eventsCreated: data.eventsCreated ?? 0,
            eventsAttended: data.eventsAttended ?? 0,
            totalReceived: data.totalReceived ?? 0,
            totalPaid: data.totalPaid ?? 0,
            onboardingStep: data.onboardingStep,
            // Family fields
            accountType: data.accountType ?? 'parent', // Default to parent for existing users
            familyId: data.familyId,
            childIds: data.childIds,
            parentIds: data.parentIds,
            virtualCardId: data.virtualCardId,
            totalSpent: data.totalSpent,
            spendingLimitDaily: data.spendingLimitDaily,
            spendingLimitMonthly: data.spendingLimitMonthly,
        };
    },
};

