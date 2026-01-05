/**
 * User Service - Handles user profile and Stripe account creation
 */
import { collection, doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import firebase from '../firebase';
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
import { userProfileConverter } from '../../types/user';

/**
 * Initialize user profile and create Stripe Connect account
 * Called automatically after signup
 */
export async function initializeUserProfile(
    userCredential: UserCredential,
    additionalData: SignupAdditionalData = {}
): Promise<InitializeUserResult> {
    const user = userCredential.user;
    const uid = user.uid;

    try {
        console.log('🚀 Initializing user profile for:', uid);

        // 1. Get Firestore instance
        const db = firebase.firestore();

        // 2. Create user profile document in Firestore
        const userProfileData: CreateUserProfileData = {
            uid: uid,
            email: user.email,
            fullName: additionalData.fullName || '',
            createdAt: new Date(),
            updatedAt: new Date(),
            // KYC and verification status
            kycStatus: 'pending',
            verificationStatus: 'pending',
            // Account settings
            notificationsEnabled: true,
            biometricEnabled: false,
            // Stats
            eventsCreated: 0,
            eventsAttended: 0,
            totalReceived: 0,
            totalPaid: 0,
        };

        // Save user profile to Firestore with type converter
        const userRef = doc(collection(db, 'users'), uid).withConverter(userProfileConverter);
        await setDoc(userRef, userProfileData as UserProfile);


        console.log('✅ User profile created');

        // 3. Create Stripe Connect account automatically
        try {
            console.log('🏦 Creating Stripe Connect account...');

            const stripeResult = await createExpressAccount({
                email: user.email ?? undefined,
                country: 'US', // Default to US, can be updated later
                business_type: 'individual'
            });

            console.log('✅ Stripe account created:', stripeResult.accountId);

            // Store Stripe account info in user profile
            const userRef = doc(collection(db, 'users'), uid).withConverter(userProfileConverter);
            await updateDoc(userRef, {
                stripeAccountId: stripeResult.accountId,
                stripeAccountLink: stripeResult.accountLink,
                stripeAccountCreated: true,
                stripeAccountStatus: 'onboarding_required' as const,
                updatedAt: Timestamp.now(),
            });

            return {
                success: true,
                userProfile: userProfileData,
                stripeAccount: stripeResult,
                message: 'Account created successfully! Your payment account is ready for setup.',
            };
        } catch (stripeError: any) {
            console.warn('⚠️ Stripe account creation failed (non-critical):', stripeError);

            // Mark that Stripe account creation failed but don't block signup
            const userRef = doc(collection(db, 'users'), uid).withConverter(userProfileConverter);
            await updateDoc(userRef, {
                stripeAccountCreated: false,
                stripeAccountError: stripeError?.message || 'Unknown error',
                updatedAt: Timestamp.now(),
            });

            // Return success for user profile but note Stripe issue
            return {
                success: true,
                userProfile: userProfileData,
                stripeAccount: null,
                message: 'Account created! Payment account setup will be available soon.',
                warning: 'Payment account creation pending. You can set it up later from Banking.',
            };
        }
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
        const db = firebase.firestore();

        // Use converter for automatic type conversion
        const userRef = doc(collection(db, 'users'), uid).withConverter(userProfileConverter);
        const docSnap = await getDoc(userRef);

        return docSnap.exists() ? docSnap.data() : undefined;
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
        const db = firebase.firestore();

        const updateData = {
            ...updates,
            updatedAt: Timestamp.now(),
        };

        const userRef = doc(collection(db, 'users'), uid).withConverter(userProfileConverter);
        await updateDoc(userRef, updateData);

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
        const db = firebase.firestore();

        const userRef = doc(collection(db, 'users'), uid);
        await updateDoc(userRef, {
            onboardingStep: step,
            updatedAt: Timestamp.now(),
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

