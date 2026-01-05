/**
 * Family Service
 * Handles family management, virtual cards, and spending tracking
 */

import { collection, doc, setDoc, getDoc, updateDoc, getDocs, query, where, Timestamp, arrayUnion } from 'firebase/firestore';
import firebase from '../firebase';
import {
    Family,
    VirtualCard,
    Transaction,
    FamilyMember,
    SpendingSummary,
    SpendingLimit,
    familyConverter,
    virtualCardConverter,
    transactionConverter,
    TransactionCategory
} from '../../types/family';
import { UserProfile, AccountType } from '../../types/user';
import { userProfileConverter } from '../../types/user';

// ============================================
// Family Management
// ============================================

/**
 * Create a new family group
 */
export async function createFamily(familyName: string): Promise<{ success: boolean; familyId?: string; error?: string }> {
    try {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('User must be authenticated');

        const db = firebase.firestore();
        const familyId = doc(collection(db, 'families')).id;

        // Get user profile
        const userRef = doc(collection(db, 'users'), user.uid).withConverter(userProfileConverter);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();

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
        const familyRef = doc(collection(db, 'families'), familyId).withConverter(familyConverter);
        await setDoc(familyRef, family);

        // Update user profile with family ID
        await updateDoc(userRef, {
            familyId: familyId,
            accountType: 'parent',
            updatedAt: Timestamp.now(),
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
        const db = firebase.firestore();
        const familyRef = doc(collection(db, 'families'), familyId).withConverter(familyConverter);
        const familyDoc = await getDoc(familyRef);
        return familyDoc.exists() ? familyDoc.data() : null;
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
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('User must be authenticated');

        const db = firebase.firestore();

        // Verify user is a parent in this family
        const family = await getFamily(familyId);
        if (!family || !family.parentIds.includes(user.uid)) {
            throw new Error('Not authorized to add children to this family');
        }

        // Generate child ID (they'll link this later when they sign up)
        const childId = doc(collection(db, 'users')).id;

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
        const familyRef = doc(collection(db, 'families'), familyId);
        await updateDoc(familyRef, {
            childIds: arrayUnion(childId),
            members: [...family.members, childMember],
            updatedAt: Timestamp.now(),
        });

        // Update parent's childIds
        const userRef = doc(collection(db, 'users'), user.uid);
        await updateDoc(userRef, {
            childIds: arrayUnion(childId),
            updatedAt: Timestamp.now(),
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
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('User must be authenticated');

        const db = firebase.firestore();

        // Verify user is a parent in this family
        const family = await getFamily(familyId);
        if (!family || !family.parentIds.includes(user.uid)) {
            throw new Error('Not authorized');
        }

        // Get child's profile
        const childRef = doc(collection(db, 'users'), childUid).withConverter(userProfileConverter);
        const childDoc = await getDoc(childRef);
        if (!childDoc.exists()) {
            throw new Error('Child account not found');
        }

        const childData = childDoc.data();

        // Update child's profile
        await updateDoc(childRef, {
            familyId: familyId,
            accountType: 'child' as AccountType,
            parentIds: arrayUnion(user.uid),
            updatedAt: Timestamp.now(),
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

        const familyRef = doc(collection(db, 'families'), familyId);
        await updateDoc(familyRef, {
            childIds: arrayUnion(childUid),
            members: [...family.members, childMember],
            updatedAt: Timestamp.now(),
        });

        // Update parent's childIds and advance onboarding
        const parentRef = doc(collection(db, 'users'), user.uid).withConverter(userProfileConverter);
        const parentSnapshot = await getDoc(parentRef);
        const parentProfile = parentSnapshot.data();
        const parentCurrentStep = parentProfile?.onboardingStep || 0;

        await updateDoc(parentRef, {
            childIds: arrayUnion(childUid),
            onboardingStep: parentCurrentStep < 3 ? 3 : parentCurrentStep,
            updatedAt: Timestamp.now(),
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
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('User must be authenticated');

        const db = firebase.firestore();

        // Get parent's profile to verify and get family ID
        const parentRef = doc(collection(db, 'users'), user.uid).withConverter(userProfileConverter);
        const parentDoc = await getDoc(parentRef);
        const parentData = parentDoc.data();

        if (!parentData?.familyId) {
            throw new Error('You must create a family first');
        }

        if (!parentData.childIds?.includes(childUid)) {
            throw new Error('This child is not in your family');
        }

        // Generate card details (in production, this would come from Stripe Issuing)
        const cardId = doc(collection(db, 'virtualCards')).id;
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
        const cardRef = doc(collection(db, 'virtualCards'), cardId).withConverter(virtualCardConverter);
        await setDoc(cardRef, card);

        // Update child's profile with card ID
        const childRef = doc(collection(db, 'users'), childUid);
        await updateDoc(childRef, {
            virtualCardId: cardId,
            spendingLimitDaily: spendingLimit?.daily,
            spendingLimitMonthly: spendingLimit?.monthly,
            updatedAt: Timestamp.now(),
        });

        // Advance onboarding to step 2 (get virtual card)
        const currentStep = parentData?.onboardingStep || 0;
        if (currentStep < 2) {
            await updateDoc(parentRef, {
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
        const db = firebase.firestore();
        const cardRef = doc(collection(db, 'virtualCards'), cardId).withConverter(virtualCardConverter);
        const cardDoc = await getDoc(cardRef);
        return cardDoc.exists() ? cardDoc.data() : null;
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
        const db = firebase.firestore();
        const cardsRef = collection(db, 'virtualCards').withConverter(virtualCardConverter);
        const snapshot = await getDocs(query(cardsRef, where('familyId', '==', familyId)));
        return snapshot.docs.map(doc => doc.data());
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
        const db = firebase.firestore();

        const card = await getVirtualCard(cardId);
        if (!card) throw new Error('Card not found');

        const newBalance = card.balance + amount;

        const cardRef = doc(collection(db, 'virtualCards'), cardId);
        await updateDoc(cardRef, {
            balance: newBalance,
            status: card.status === 'pending_activation' ? 'active' : card.status,
            updatedAt: Timestamp.now(),
        });

        // Update child's totalReceived
        const childRef = doc(collection(db, 'users'), card.assignedTo);
        await updateDoc(childRef, {
            totalReceived: (card.balance || 0) + amount,
            updatedAt: Timestamp.now(),
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
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('User must be authenticated');

        const db = firebase.firestore();

        const card = await getVirtualCard(cardId);
        if (!card) throw new Error('Card not found');
        if (card.createdBy !== user.uid) throw new Error('Not authorized');

        const cardRef = doc(collection(db, 'virtualCards'), cardId);
        await updateDoc(cardRef, {
            status: status,
            updatedAt: Timestamp.now(),
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
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('User must be authenticated');

        const db = firebase.firestore();

        const card = await getVirtualCard(cardId);
        if (!card) throw new Error('Card not found');
        if (card.createdBy !== user.uid) throw new Error('Not authorized');

        const cardRef = doc(collection(db, 'virtualCards'), cardId);
        await updateDoc(cardRef, {
            spendingLimit: limits,
            updatedAt: Timestamp.now(),
        });

        // Also update child's profile
        const childRef = doc(collection(db, 'users'), card.assignedTo);
        await updateDoc(childRef, {
            spendingLimitDaily: limits.daily,
            spendingLimitMonthly: limits.monthly,
            updatedAt: Timestamp.now(),
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
        const db = firebase.firestore();
        const transactionsRef = collection(db, 'transactions').withConverter(transactionConverter);
        const snapshot = await getDocs(
            query(transactionsRef, where('cardId', '==', cardId))
        );

        const transactions = snapshot.docs.map(doc => doc.data());
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
        const db = firebase.firestore();
        const transactionsRef = collection(db, 'transactions').withConverter(transactionConverter);
        const snapshot = await getDocs(
            query(transactionsRef, where('familyId', '==', familyId))
        );

        const transactions = snapshot.docs.map(doc => doc.data());
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

