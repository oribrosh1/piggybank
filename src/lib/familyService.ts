/**
 * Family Service
 * Handles family management, virtual cards, and spending tracking
 * Uses React Native Firebase for Firestore to share auth state
 */

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {
    Family,
    VirtualCard,
    Transaction,
    FamilyMember,
    SpendingSummary,
    SpendingLimit,
    TransactionCategory
} from '../../types/family';
import { UserProfile, AccountType } from '../../types/user';

// ============================================
// Family Management
// ============================================

/**
 * Create a new family group
 */
export async function createFamily(familyName: string): Promise<{ success: boolean; familyId?: string; error?: string }> {
    try {
        const user = auth().currentUser;
        if (!user) throw new Error('User must be authenticated');

        const familyId = firestore().collection('families').doc().id;

        // Get user profile
        const userDoc = await firestore().collection('users').doc(user.uid).get();
        const userData = userDoc.data() as UserProfile | undefined;

        const member: FamilyMember = {
            uid: user.uid,
            fullName: userData?.fullName || 'Unknown',
            email: user.email,
            accountType: 'parent',
            joinedAt: new Date(),
        };

        const family: Family = {
            id: familyId,
            name: familyName,
            parentIds: [user.uid],
            childIds: [],
            members: [member],
            createdBy: user.uid,
            notifyOnSpend: true,
            notifyOnLowBalance: true,
            lowBalanceThreshold: 1000, // $10
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // Save family
        await firestore().collection('families').doc(familyId).set(family);

        // Update user profile with family ID
        await firestore().collection('users').doc(user.uid).update({
            familyId: familyId,
            accountType: 'parent',
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });

        console.log('✅ Family created:', familyId);
        return { success: true, familyId };
    } catch (error: any) {
        console.error('❌ Error creating family:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get family by ID
 */
export async function getFamily(familyId: string): Promise<Family | null> {
    try {
        const familyDoc = await firestore().collection('families').doc(familyId).get();
        if (!familyDoc.exists) return null;

        const data = familyDoc.data()!;
        return {
            ...data,
            id: familyDoc.id,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
        } as Family;
    } catch (error) {
        console.error('Error getting family:', error);
        return null;
    }
}

/**
 * Add a child to the family
 */
export async function addChildToFamily(
    familyId: string,
    childData: { fullName: string; email?: string }
): Promise<{ success: boolean; childId?: string; error?: string }> {
    try {
        const user = auth().currentUser;
        if (!user) throw new Error('User must be authenticated');

        // Verify user is a parent in this family
        const family = await getFamily(familyId);
        if (!family || !family.parentIds.includes(user.uid)) {
            throw new Error('Not authorized to add children to this family');
        }

        // Generate child ID (they'll link this later when they sign up)
        const childId = firestore().collection('users').doc().id;

        const childMember: FamilyMember = {
            uid: childId,
            fullName: childData.fullName,
            email: childData.email || null,
            accountType: 'child',
            totalReceived: 0,
            totalSpent: 0,
            joinedAt: new Date(),
        };

        // Update family with new child
        await firestore().collection('families').doc(familyId).update({
            childIds: firestore.FieldValue.arrayUnion(childId),
            members: [...family.members, childMember],
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });

        // Update parent's childIds
        await firestore().collection('users').doc(user.uid).update({
            childIds: firestore.FieldValue.arrayUnion(childId),
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });

        console.log('✅ Child added to family:', childId);
        return { success: true, childId };
    } catch (error: any) {
        console.error('❌ Error adding child:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Link existing user account as child
 */
export async function linkChildAccount(
    familyId: string,
    childUid: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const user = auth().currentUser;
        if (!user) throw new Error('User must be authenticated');

        // Verify user is a parent in this family
        const family = await getFamily(familyId);
        if (!family || !family.parentIds.includes(user.uid)) {
            throw new Error('Not authorized');
        }

        // Get child's profile
        const childDoc = await firestore().collection('users').doc(childUid).get();
        if (!childDoc.exists) {
            throw new Error('Child account not found');
        }

        const childData = childDoc.data() as UserProfile | undefined;

        // Update child's profile
        await firestore().collection('users').doc(childUid).update({
            familyId: familyId,
            accountType: 'child' as AccountType,
            parentIds: firestore.FieldValue.arrayUnion(user.uid),
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });

        // Update family
        const childMember: FamilyMember = {
            uid: childUid,
            fullName: childData?.fullName || 'Unknown',
            email: childData?.email || null,
            accountType: 'child',
            totalReceived: childData?.totalReceived || 0,
            totalSpent: childData?.totalSpent || 0,
            joinedAt: new Date(),
        };

        await firestore().collection('families').doc(familyId).update({
            childIds: firestore.FieldValue.arrayUnion(childUid),
            members: [...family.members, childMember],
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });

        // Update parent's childIds and advance onboarding
        const parentDoc = await firestore().collection('users').doc(user.uid).get();
        const parentProfile = parentDoc.data() as UserProfile | undefined;
        const parentCurrentStep = parentProfile?.onboardingStep || 0;

        await firestore().collection('users').doc(user.uid).update({
            childIds: firestore.FieldValue.arrayUnion(childUid),
            onboardingStep: parentCurrentStep < 3 ? 3 : parentCurrentStep,
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });

        if (parentCurrentStep < 3) {
            console.log('✅ Parent onboarding step advanced to 3 (child linked)');
        }

        console.log('✅ Child account linked:', childUid);
        return { success: true };
    } catch (error: any) {
        console.error('❌ Error linking child:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// Virtual Card Management
// ============================================

/**
 * Create a virtual card for a child
 */
export async function createVirtualCard(
    childUid: string,
    cardholderName: string,
    spendingLimit?: SpendingLimit
): Promise<{ success: boolean; cardId?: string; error?: string }> {
    try {
        const user = auth().currentUser;
        if (!user) throw new Error('User must be authenticated');

        // Get parent's profile to verify and get family ID
        const parentDoc = await firestore().collection('users').doc(user.uid).get();
        const parentData = parentDoc.data() as UserProfile | undefined;

        if (!parentData?.familyId) {
            throw new Error('You must create a family first');
        }

        if (!parentData.childIds?.includes(childUid)) {
            throw new Error('This child is not in your family');
        }

        // Generate card details (in production, this would come from Stripe Issuing)
        const cardId = firestore().collection('virtualCards').doc().id;
        const lastFour = Math.floor(1000 + Math.random() * 9000).toString();

        const card: VirtualCard = {
            id: cardId,
            lastFour: lastFour,
            expiryMonth: 12,
            expiryYear: new Date().getFullYear() + 4,
            cardholderName: cardholderName,
            createdBy: user.uid,
            assignedTo: childUid,
            familyId: parentData.familyId,
            balance: 0,
            spendingLimit: spendingLimit,
            spentToday: 0,
            spentThisWeek: 0,
            spentThisMonth: 0,
            status: 'pending_activation',
            addedToApplePay: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // Save card
        await firestore().collection('virtualCards').doc(cardId).set(card);

        // Update child's profile with card ID
        await firestore().collection('users').doc(childUid).update({
            virtualCardId: cardId,
            spendingLimitDaily: spendingLimit?.daily,
            spendingLimitMonthly: spendingLimit?.monthly,
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });

        // Advance onboarding to step 2 (get virtual card)
        const currentStep = parentData?.onboardingStep || 0;
        if (currentStep < 2) {
            await firestore().collection('users').doc(user.uid).update({
                onboardingStep: 2,
            });
            console.log('✅ Onboarding step advanced to 2 (virtual card created)');
        }

        console.log('✅ Virtual card created:', cardId);
        return { success: true, cardId };
    } catch (error: any) {
        console.error('❌ Error creating virtual card:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get virtual card by ID
 */
export async function getVirtualCard(cardId: string): Promise<VirtualCard | null> {
    try {
        const cardDoc = await firestore().collection('virtualCards').doc(cardId).get();
        if (!cardDoc.exists) return null;

        const data = cardDoc.data()!;
        return {
            ...data,
            id: cardDoc.id,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
        } as VirtualCard;
    } catch (error) {
        console.error('Error getting virtual card:', error);
        return null;
    }
}

/**
 * Get cards for a family (for parents to view all children's cards)
 */
export async function getFamilyCards(familyId: string): Promise<VirtualCard[]> {
    try {
        const snapshot = await firestore()
            .collection('virtualCards')
            .where('familyId', '==', familyId)
            .get();

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                createdAt: data.createdAt?.toDate?.() || new Date(),
                updatedAt: data.updatedAt?.toDate?.() || new Date(),
            } as VirtualCard;
        });
    } catch (error) {
        console.error('Error getting family cards:', error);
        return [];
    }
}

/**
 * Add funds to a virtual card (from event gifts)
 */
export async function addFundsToCard(
    cardId: string,
    amount: number,
    source: string // e.g., "Birthday Party Gifts"
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
    try {
        const card = await getVirtualCard(cardId);
        if (!card) throw new Error('Card not found');

        const newBalance = card.balance + amount;

        await firestore().collection('virtualCards').doc(cardId).update({
            balance: newBalance,
            status: card.status === 'pending_activation' ? 'active' : card.status,
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });

        // Update child's totalReceived
        await firestore().collection('users').doc(card.assignedTo).update({
            totalReceived: (card.balance || 0) + amount,
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });

        console.log(`✅ Added $${(amount / 100).toFixed(2)} to card ${cardId}. New balance: $${(newBalance / 100).toFixed(2)}`);
        return { success: true, newBalance };
    } catch (error: any) {
        console.error('❌ Error adding funds:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Freeze/unfreeze a card (parent control)
 */
export async function setCardStatus(
    cardId: string,
    status: 'active' | 'frozen'
): Promise<{ success: boolean; error?: string }> {
    try {
        const user = auth().currentUser;
        if (!user) throw new Error('User must be authenticated');

        const card = await getVirtualCard(cardId);
        if (!card) throw new Error('Card not found');
        if (card.createdBy !== user.uid) throw new Error('Not authorized');

        await firestore().collection('virtualCards').doc(cardId).update({
            status: status,
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });

        console.log(`✅ Card ${cardId} status set to: ${status}`);
        return { success: true };
    } catch (error: any) {
        console.error('❌ Error setting card status:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update spending limits (parent control)
 */
export async function updateSpendingLimits(
    cardId: string,
    limits: SpendingLimit
): Promise<{ success: boolean; error?: string }> {
    try {
        const user = auth().currentUser;
        if (!user) throw new Error('User must be authenticated');

        const card = await getVirtualCard(cardId);
        if (!card) throw new Error('Card not found');
        if (card.createdBy !== user.uid) throw new Error('Not authorized');

        await firestore().collection('virtualCards').doc(cardId).update({
            spendingLimit: limits,
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });

        // Also update child's profile
        await firestore().collection('users').doc(card.assignedTo).update({
            spendingLimitDaily: limits.daily,
            spendingLimitMonthly: limits.monthly,
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });

        console.log(`✅ Spending limits updated for card ${cardId}`);
        return { success: true };
    } catch (error: any) {
        console.error('❌ Error updating limits:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// Transaction & Spending Tracking
// ============================================

/**
 * Get transactions for a card
 */
export async function getCardTransactions(
    cardId: string,
    limit: number = 50
): Promise<Transaction[]> {
    try {
        const snapshot = await firestore()
            .collection('transactions')
            .where('cardId', '==', cardId)
            .get();

        const transactions = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                createdAt: data.createdAt?.toDate?.() || new Date(),
            } as Transaction;
        });

        // Sort by date descending
        transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return transactions.slice(0, limit);
    } catch (error) {
        console.error('Error getting transactions:', error);
        return [];
    }
}

/**
 * Get all transactions for a family (for parent dashboard)
 */
export async function getFamilyTransactions(
    familyId: string,
    limit: number = 100
): Promise<Transaction[]> {
    try {
        const snapshot = await firestore()
            .collection('transactions')
            .where('familyId', '==', familyId)
            .get();

        const transactions = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                createdAt: data.createdAt?.toDate?.() || new Date(),
            } as Transaction;
        });

        transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return transactions.slice(0, limit);
    } catch (error) {
        console.error('Error getting family transactions:', error);
        return [];
    }
}

/**
 * Get spending summary for a child (for parent insights)
 */
export async function getSpendingSummary(
    cardId: string,
    period: 'day' | 'week' | 'month' | 'year' | 'all' = 'month'
): Promise<SpendingSummary | null> {
    try {
        const transactions = await getCardTransactions(cardId, 1000);

        // Calculate date range
        const now = new Date();
        let startDate: Date;
        switch (period) {
            case 'day':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(0);
        }

        // Filter transactions by period
        const filtered = transactions.filter(t =>
            t.createdAt >= startDate && t.status === 'completed'
        );

        // Calculate stats
        const totalSpent = filtered.reduce((sum, t) => sum + t.amount, 0);
        const byCategory: { [key in TransactionCategory]?: number } = {};
        const merchantCounts: { [key: string]: { amount: number; count: number } } = {};

        filtered.forEach(t => {
            // By category
            byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;

            // By merchant
            if (!merchantCounts[t.merchantName]) {
                merchantCounts[t.merchantName] = { amount: 0, count: 0 };
            }
            merchantCounts[t.merchantName].amount += t.amount;
            merchantCounts[t.merchantName].count++;
        });

        // Top merchants
        const topMerchants = Object.entries(merchantCounts)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);

        return {
            period,
            startDate,
            endDate: now,
            totalSpent,
            transactionCount: filtered.length,
            byCategory,
            topMerchants,
            averageTransaction: filtered.length > 0 ? totalSpent / filtered.length : 0,
            largestTransaction: filtered.length > 0 ? Math.max(...filtered.map(t => t.amount)) : 0,
        };
    } catch (error) {
        console.error('Error getting spending summary:', error);
        return null;
    }
}
