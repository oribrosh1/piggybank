/**
 * User Service - Handles user profile (Stripe account is created only after banking onboarding completes)
 * Uses React Native Firebase for Firestore to share auth state
 */
import firestore from '@react-native-firebase/firestore';
import { createExpressAccount } from './api';
import type {
    UserProfile,
    CreateUserProfileData,
    UpdateUserProfileData,
    UserCredential,
    SignupAdditionalData,
    InitializeUserResult,
    OnboardingStep
} from '../../types/user';

/**
 * Initialize user profile (no Stripe account yet; created only after banking onboarding completes)
 * Called automatically after signup
 */
export async function initializeUserProfile(
    userCredential: UserCredential | { user: { uid: string; email: string | null; displayName?: string | null } },
    additionalData: SignupAdditionalData = {}
): Promise<InitializeUserResult> {
    // Support both Firebase Auth shape ({ user: { uid, email } }) and flattened ({ uid, email })
    const uid = 'user' in userCredential && userCredential.user
        ? userCredential.user.uid
        : (userCredential as UserCredential).uid;
    const email = 'user' in userCredential && userCredential.user
        ? (userCredential.user.email ?? null)
        : ((userCredential as UserCredential).email ?? null);

    if (!uid) {
        throw new Error('User credential missing uid (use userCredential.user.uid for Firebase Auth result)');
    }

    try {
        console.log('🚀 Initializing user profile for:', uid);

        const fullName =
            additionalData.fullName ||
            [additionalData.legalFirstName, additionalData.legalLastName].filter(Boolean).join(' ') ||
            '';
        const userProfileData: CreateUserProfileData = {
            uid,
            email,
            fullName,
            createdAt: new Date(),
            updatedAt: new Date(),
            kycStatus: 'pending',
            verificationStatus: 'pending',
            notificationsEnabled: true,
            biometricEnabled: false,
            eventsCreated: 0,
            eventsAttended: 0,
            totalReceived: 0,
            totalPaid: 0,
            accountType: 'parent',
        };

        await firestore().collection('users').doc(uid).set(userProfileData);

        console.log('✅ User profile created (Stripe account will be created when user completes banking setup)');

        return {
            success: true,
            userProfile: userProfileData,
            stripeAccount: null,
            message: 'Account created! Complete banking setup when you\'re ready to receive payments.',
        };
    } catch (error) {
        console.error('❌ Error initializing user profile:', error);
        throw error;
    }
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | undefined> {
    try {
        const docSnap = await firestore().collection('users').doc(uid).get();

        if (!docSnap.exists) {
            return undefined;
        }

        const data = docSnap.data();
        return {
            ...data,
            uid: docSnap.id,
            createdAt: data?.createdAt?.toDate?.() || new Date(),
            updatedAt: data?.updatedAt?.toDate?.() || new Date(),
        } as UserProfile;
    } catch (error) {
        console.error('Error getting user profile:', error);
        throw error;
    }
}

/**
 * Update user profile
 */
export async function updateUserProfile(uid: string, updates: UpdateUserProfileData): Promise<{ success: boolean }> {
    try {
        const updateData = {
            ...updates,
            updatedAt: firestore.FieldValue.serverTimestamp(),
        };

        await firestore().collection('users').doc(uid).update(updateData);

        return { success: true };
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
}

/**
 * Retry Stripe account creation (if it failed during signup)
 */
export async function retryStripeAccountCreation(
    uid: string,
    email: string
): Promise<{
    success: boolean;
    stripeAccount: {
        accountId: string;
        accountLink: string;
        success: boolean;
    };
}> {
    try {
        console.log('🔄 Retrying Stripe account creation for:', uid);

        const stripeResult = await createExpressAccount({
            email,
            country: 'US',
            business_type: 'individual'
        });

        // Update user profile
        await updateUserProfile(uid, {
            stripeAccountId: stripeResult.accountId,
            stripeAccountLink: stripeResult.accountLink,
            stripeAccountCreated: true,
            stripeAccountStatus: 'onboarding_required' as const,
            stripeAccountError: undefined, // Clear any previous error
        });

        return {
            success: true,
            stripeAccount: stripeResult,
        };
    } catch (error) {
        console.error('Error retrying Stripe account creation:', error);
        throw error;
    }
}

/**
 * Check if user needs to complete Stripe onboarding
 */
export async function needsStripeOnboarding(uid: string): Promise<boolean> {
    try {
        const profile = await getUserProfile(uid);

        if (!profile) return true;

        // Check if Stripe account exists and is not fully onboarded
        return (
            !profile.stripeAccountCreated ||
            profile.stripeAccountStatus === 'onboarding_required' ||
            profile.stripeAccountStatus === 'pending'
        );
    } catch (error) {
        console.error('Error checking Stripe onboarding status:', error);
        return true; // Assume needs onboarding if error
    }
}

/**
 * Update user's onboarding step
 * Steps: 1-4
 * 1: Create, manage & track event + invite guests
 * 2: Get virtual card + receive gifts to balance
 * 3: Assign card to child (child downloads app)
 * 4: Child pays with Apple Pay + parents track spending
 */
export async function updateOnboardingStep(uid: string, step: OnboardingStep): Promise<{ success: boolean }> {
    try {
        await firestore().collection('users').doc(uid).update({
            onboardingStep: step,
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });

        console.log(`✅ Onboarding step updated to ${step} for user ${uid}`);
        return { success: true };
    } catch (error) {
        console.error('Error updating onboarding step:', error);
        throw error;
    }
}

/**
 * Advance user to next onboarding step (if not at max)
 */
export async function advanceOnboardingStep(uid: string): Promise<{ success: boolean; newStep: OnboardingStep }> {
    try {
        const profile = await getUserProfile(uid);
        const currentStep = profile?.onboardingStep || 0;

        if (currentStep >= 4) {
            return { success: true, newStep: 4 };
        }

        const newStep = (currentStep + 1) as OnboardingStep;
        await updateOnboardingStep(uid, newStep);

        return { success: true, newStep };
    } catch (error) {
        console.error('Error advancing onboarding step:', error);
        throw error;
    }
}
