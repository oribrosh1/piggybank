/**
 * Family & Virtual Card Types
 * Defines parent-child relationships, virtual cards, and spending tracking
 */

import {
    DocumentData,
    FirestoreDataConverter,
    QueryDocumentSnapshot,
    SnapshotOptions,
    Timestamp
} from 'firebase/firestore';

/**
 * Account type - determines app experience
 */
export type AccountType = 'parent' | 'child';

/**
 * Virtual Card Status
 */
export type CardStatus = 'active' | 'frozen' | 'cancelled' | 'pending_activation';

/**
 * Spending Limit Type
 */
export interface SpendingLimit {
    daily?: number;      // Daily limit in cents
    weekly?: number;     // Weekly limit in cents
    monthly?: number;    // Monthly limit in cents
    perTransaction?: number; // Per transaction limit in cents
}

/**
 * Virtual Card - Created by parent, assigned to child
 */
export interface VirtualCard {
    id: string;
    // Card Details
    lastFour: string;           // Last 4 digits for display
    expiryMonth: number;
    expiryYear: number;
    cardholderName: string;
    // Ownership
    createdBy: string;          // Parent UID who created it
    assignedTo: string;         // Child UID who can use it
    familyId: string;           // Family group ID
    // Balance & Limits
    balance: number;            // Current balance in cents
    spendingLimit?: SpendingLimit;
    // Spending Stats (updated daily)
    spentToday: number;
    spentThisWeek: number;
    spentThisMonth: number;
    // Status
    status: CardStatus;
    // Apple Pay
    addedToApplePay: boolean;
    applePayDeviceId?: string;
    // Stripe Card ID (for actual card operations)
    stripeCardId?: string;
    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    lastUsedAt?: Date;
}

/**
 * Transaction Category
 */
export type TransactionCategory =
    | 'food'
    | 'entertainment'
    | 'shopping'
    | 'gaming'
    | 'transport'
    | 'education'
    | 'other';

/**
 * Transaction - Record of card usage
 */
export interface Transaction {
    id: string;
    cardId: string;             // Virtual card used
    userId: string;             // Who made the transaction (child)
    familyId: string;           // Family group
    // Transaction Details
    amount: number;             // Amount in cents
    currency: string;           // 'usd'
    merchantName: string;
    merchantCategory?: string;
    category: TransactionCategory;
    description?: string;
    // Status
    status: 'pending' | 'completed' | 'declined' | 'refunded';
    declineReason?: string;     // If declined, why
    // Location (optional)
    location?: {
        city?: string;
        country?: string;
    };
    // Timestamps
    createdAt: Date;
    settledAt?: Date;
}

/**
 * Family Member - Simplified view for display
 */
export interface FamilyMember {
    uid: string;
    fullName: string;
    email: string | null;
    accountType: AccountType;
    avatarUrl?: string;
    // For children
    virtualCardId?: string;
    totalReceived?: number;     // Total gifts received
    totalSpent?: number;        // Total spent
    // Joined date
    joinedAt: Date;
}

/**
 * Family Group - Links parents and children
 */
export interface Family {
    id: string;
    name: string;               // e.g., "The Smith Family"
    // Members
    parentIds: string[];        // Array of parent UIDs (can have multiple)
    childIds: string[];         // Array of child UIDs
    members: FamilyMember[];    // Denormalized member data for quick access
    // Settings
    createdBy: string;          // Original creator
    defaultSpendingLimit?: SpendingLimit;
    // Notifications
    notifyOnSpend: boolean;     // Notify parents on child spending
    notifyOnLowBalance: boolean;
    lowBalanceThreshold: number; // in cents
    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Pending Family Invite
 */
export interface FamilyInvite {
    id: string;
    familyId: string;
    familyName: string;
    invitedBy: string;          // Parent UID
    invitedByName: string;      // Parent name for display
    // Invite target
    inviteType: 'email' | 'phone' | 'link';
    inviteEmail?: string;
    invitePhone?: string;
    inviteCode?: string;        // For link-based invites
    // Status
    status: 'pending' | 'accepted' | 'expired' | 'cancelled';
    accountType: AccountType;   // What type of account will be created
    // Timestamps
    createdAt: Date;
    expiresAt: Date;
    acceptedAt?: Date;
}

/**
 * Spending Summary - Aggregated stats for parents
 */
export interface SpendingSummary {
    // Time period
    period: 'day' | 'week' | 'month' | 'year' | 'all';
    startDate: Date;
    endDate: Date;
    // Totals
    totalSpent: number;
    transactionCount: number;
    // By Category
    byCategory: {
        [key in TransactionCategory]?: number;
    };
    // Top Merchants
    topMerchants: {
        name: string;
        amount: number;
        count: number;
    }[];
    // Average
    averageTransaction: number;
    largestTransaction: number;
}

// ============================================
// Firestore Converters
// ============================================

export const virtualCardConverter: FirestoreDataConverter<VirtualCard> = {
    toFirestore(card: VirtualCard): DocumentData {
        return {
            id: card.id,
            lastFour: card.lastFour,
            expiryMonth: card.expiryMonth,
            expiryYear: card.expiryYear,
            cardholderName: card.cardholderName,
            createdBy: card.createdBy,
            assignedTo: card.assignedTo,
            familyId: card.familyId,
            balance: card.balance,
            spendingLimit: card.spendingLimit,
            spentToday: card.spentToday,
            spentThisWeek: card.spentThisWeek,
            spentThisMonth: card.spentThisMonth,
            status: card.status,
            addedToApplePay: card.addedToApplePay,
            applePayDeviceId: card.applePayDeviceId,
            stripeCardId: card.stripeCardId,
            createdAt: card.createdAt instanceof Date ? Timestamp.fromDate(card.createdAt) : card.createdAt,
            updatedAt: card.updatedAt instanceof Date ? Timestamp.fromDate(card.updatedAt) : card.updatedAt,
            lastUsedAt: card.lastUsedAt instanceof Date ? Timestamp.fromDate(card.lastUsedAt) : card.lastUsedAt,
        };
    },

    fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): VirtualCard {
        const data = snapshot.data(options);
        return {
            id: snapshot.id,
            lastFour: data.lastFour,
            expiryMonth: data.expiryMonth,
            expiryYear: data.expiryYear,
            cardholderName: data.cardholderName,
            createdBy: data.createdBy,
            assignedTo: data.assignedTo,
            familyId: data.familyId,
            balance: data.balance ?? 0,
            spendingLimit: data.spendingLimit,
            spentToday: data.spentToday ?? 0,
            spentThisWeek: data.spentThisWeek ?? 0,
            spentThisMonth: data.spentThisMonth ?? 0,
            status: data.status ?? 'pending_activation',
            addedToApplePay: data.addedToApplePay ?? false,
            applePayDeviceId: data.applePayDeviceId,
            stripeCardId: data.stripeCardId,
            createdAt: data.createdAt?.toDate() ?? new Date(),
            updatedAt: data.updatedAt?.toDate() ?? new Date(),
            lastUsedAt: data.lastUsedAt?.toDate(),
        };
    },
};

export const transactionConverter: FirestoreDataConverter<Transaction> = {
    toFirestore(transaction: Transaction): DocumentData {
        const data: DocumentData = {
            id: transaction.id,
            cardId: transaction.cardId,
            userId: transaction.userId,
            familyId: transaction.familyId,
            amount: transaction.amount,
            currency: transaction.currency,
            merchantName: transaction.merchantName,
            category: transaction.category,
            status: transaction.status,
            createdAt: transaction.createdAt instanceof Date ? Timestamp.fromDate(transaction.createdAt) : transaction.createdAt,
        };
        if (transaction.merchantCategory) data.merchantCategory = transaction.merchantCategory;
        if (transaction.description) data.description = transaction.description;
        if (transaction.declineReason) data.declineReason = transaction.declineReason;
        if (transaction.location) data.location = transaction.location;
        if (transaction.settledAt) data.settledAt = transaction.settledAt instanceof Date ? Timestamp.fromDate(transaction.settledAt) : transaction.settledAt;
        return data;
    },

    fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): Transaction {
        const data = snapshot.data(options);
        return {
            id: snapshot.id,
            cardId: data.cardId,
            userId: data.userId,
            familyId: data.familyId,
            amount: data.amount,
            currency: data.currency ?? 'usd',
            merchantName: data.merchantName,
            merchantCategory: data.merchantCategory,
            category: data.category ?? 'other',
            description: data.description,
            status: data.status ?? 'completed',
            declineReason: data.declineReason,
            location: data.location,
            createdAt: data.createdAt?.toDate() ?? new Date(),
            settledAt: data.settledAt?.toDate(),
        };
    },
};

export const familyConverter: FirestoreDataConverter<Family> = {
    toFirestore(family: Family): DocumentData {
        return {
            id: family.id,
            name: family.name,
            parentIds: family.parentIds,
            childIds: family.childIds,
            members: family.members.map(m => ({
                ...m,
                joinedAt: m.joinedAt instanceof Date ? Timestamp.fromDate(m.joinedAt) : m.joinedAt,
            })),
            createdBy: family.createdBy,
            defaultSpendingLimit: family.defaultSpendingLimit,
            notifyOnSpend: family.notifyOnSpend,
            notifyOnLowBalance: family.notifyOnLowBalance,
            lowBalanceThreshold: family.lowBalanceThreshold,
            createdAt: family.createdAt instanceof Date ? Timestamp.fromDate(family.createdAt) : family.createdAt,
            updatedAt: family.updatedAt instanceof Date ? Timestamp.fromDate(family.updatedAt) : family.updatedAt,
        };
    },

    fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): Family {
        const data = snapshot.data(options);
        return {
            id: snapshot.id,
            name: data.name,
            parentIds: data.parentIds ?? [],
            childIds: data.childIds ?? [],
            members: (data.members ?? []).map((m: any) => ({
                ...m,
                joinedAt: m.joinedAt?.toDate() ?? new Date(),
            })),
            createdBy: data.createdBy,
            defaultSpendingLimit: data.defaultSpendingLimit,
            notifyOnSpend: data.notifyOnSpend ?? true,
            notifyOnLowBalance: data.notifyOnLowBalance ?? true,
            lowBalanceThreshold: data.lowBalanceThreshold ?? 1000, // $10 default
            createdAt: data.createdAt?.toDate() ?? new Date(),
            updatedAt: data.updatedAt?.toDate() ?? new Date(),
        };
    },
};

