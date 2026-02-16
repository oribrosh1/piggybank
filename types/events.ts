/**
 * Event types - minimal types based on actual usage in the app
 */

import {
    DocumentData,
    FirestoreDataConverter,
    QueryDocumentSnapshot,
    SnapshotOptions,
    Timestamp
} from 'firebase/firestore';

export type EventType = "birthday" | "barMitzvah" | "batMitzvah" | "other";

// Event category for dress code options
export type EventCategory = "party" | "formal";

// Form data used in event-details.tsx
export interface EventFormData {
    age: string;
    eventName: string;
    // Event category (party vs formal event)
    eventCategory?: EventCategory;
    // Optional event details (Party only)
    partyType?: string; // For parties: pool, beach, garden, indoor, other (single select)
    otherPartyType?: string; // Custom party type when "other" is selected
    attireType?: string; // For parties: swimwear, casual, costume (single select)
    footwearType?: string; // For parties: sneakers, slides, any (single select)
    theme?: string; // Party theme selection
    parking?: string;
    // Dietary selections
    kosherType?: string; // not-kosher, kosher-style, kosher, glatt-kosher
    mealType?: string; // dairy, meat, pareve
    vegetarianType?: string; // none, vegetarian, vegan, or by_request (when meal is meat: guests can request vegetarian)
    // Date/Time/Location
    date: string;
    time: string;
    address1: string;
    address2: string;
}

/**
 * Guest status in an event
 * - added: Guest added to list, not invited yet
 * - invited: Invitation sent via SMS
 * - confirmed: Guest confirmed attendance (RSVP'd yes)
 * - paid: Guest confirmed and paid
 */
export type GuestStatus = 'added' | 'invited' | 'confirmed' | 'paid';

/**
 * Aggregated guest statistics (stored on event for quick access)
 */
export interface GuestStats {
    total: number;
    added: number;      // Added but not invited
    invited: number;    // Invited but not confirmed
    confirmed: number;  // Confirmed but not paid
    paid: number;       // Confirmed and paid
    totalPaid: number;  // Total amount paid (in cents)
}

/**
 * Calculate guest stats from guests array
 */
export function calculateGuestStats(guests: Guest[]): GuestStats {
    return {
        total: guests.length,
        added: guests.filter(g => g.status === 'added').length,
        invited: guests.filter(g => g.status === 'invited').length,
        confirmed: guests.filter(g => g.status === 'confirmed').length,
        paid: guests.filter(g => g.status === 'paid').length,
        totalPaid: guests.reduce((sum, g) => sum + (g.paymentAmount || 0), 0),
    };
}

// Guest data used in select-guests.tsx
export interface Guest {
    id: string;
    name: string;
    phone: string;
    status: GuestStatus;
    // Timestamps
    addedAt?: Date;
    invitedAt?: Date;
    confirmedAt?: Date;
    paidAt?: Date;
    // Payment info (when status is 'paid')
    paymentAmount?: number; // in cents
    paymentId?: string; // Stripe payment ID
    /** Blessing/message from guest when they paid (website gift flow) */
    blessing?: string;
}

/**
 * Child account: created when child opens parent's invite link.
 * One child account per event (one kid sees their event balance + gifts).
 */
export interface ChildAccount {
    id: string;
    eventId: string;
    userId: string; // Firebase Auth UID (anonymous or custom token)
    /** Balance in cents; updated when gifts are paid and when child spends (Issuing). */
    balanceCents: number;
    eventName?: string;
    creatorName?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Complete Event data stored in Firestore
 */
export interface Event {
    // Event ID
    id: string;

    // Owner/Creator
    creatorId: string;
    creatorName: string;
    creatorEmail: string | null;

    // Event Details
    eventType: EventType;
    eventName: string;
    // Event category and attire (Party only)
    eventCategory?: EventCategory;
    partyType?: string; // Pool, Beach, Garden, Indoor, Other
    otherPartyType?: string; // Custom party type
    attireType?: string; // Single select: swimwear, casual, costume
    footwearType?: string; // Single select: sneakers, slides, any
    // Optional event details
    theme?: string; // Party theme selection
    customTheme?: string; // Custom theme when "other" is selected
    parking?: string;
    // Dietary selections
    kosherType?: string; // not-kosher, kosher-style, kosher, glatt-kosher
    mealType?: string; // dairy, meat, pareve
    vegetarianType?: string; // none, vegetarian, vegan, or by_request (when meal is meat: guests can request vegetarian)
    age?: string; // For birthday events

    // Date & Time
    date: string; // ISO date string
    time: string;

    // Location
    address1: string; // Primary address (venue name)
    address2: string; // Secondary address (street, city)

    // AI Generated Poster
    posterUrl?: string; // URL to AI-generated invitation poster
    posterPrompt?: string; // The prompt used to generate the poster

    // Guests
    guests: Guest[];
    totalGuests: number;

    // Guest Stats (denormalized for quick access - updated when guests change)
    guestStats: GuestStats;

    // Stripe Connect Account (for payments)
    stripeAccountId?: string;

    // Status
    status: 'draft' | 'active' | 'completed' | 'cancelled';

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Data needed to create an event
 */
export interface CreateEventData {
    eventType: EventType;
    formData: EventFormData;
    guests: Guest[];
}

/**
 * Event Summary - lightweight version without full guests array
 * Used for listing events to avoid fetching all guest data
 */
export type EventSummary = Omit<Event, 'guests'>;

/**
 * Firestore Converter for Event
 * Automatically converts between Firestore documents and TypeScript types
 */
/**
 * Helper to convert Guest dates to Firestore-friendly format
 */
const guestToFirestore = (guest: Guest): DocumentData => {
    const data: DocumentData = {
        id: guest.id,
        name: guest.name,
        phone: guest.phone,
        status: guest.status,
    };
    if (guest.addedAt) data.addedAt = guest.addedAt instanceof Date ? Timestamp.fromDate(guest.addedAt) : guest.addedAt;
    if (guest.invitedAt) data.invitedAt = guest.invitedAt instanceof Date ? Timestamp.fromDate(guest.invitedAt) : guest.invitedAt;
    if (guest.confirmedAt) data.confirmedAt = guest.confirmedAt instanceof Date ? Timestamp.fromDate(guest.confirmedAt) : guest.confirmedAt;
    if (guest.paidAt) data.paidAt = guest.paidAt instanceof Date ? Timestamp.fromDate(guest.paidAt) : guest.paidAt;
    if (guest.paymentAmount) data.paymentAmount = guest.paymentAmount;
    if (guest.paymentId) data.paymentId = guest.paymentId;
    if (guest.blessing) data.blessing = guest.blessing;
    return data;
};

/**
 * Helper to convert Firestore data to Guest
 */
const guestFromFirestore = (data: DocumentData): Guest => ({
    id: data.id,
    name: data.name,
    phone: data.phone,
    status: data.status || 'added',
    addedAt: data.addedAt?.toDate?.() ?? undefined,
    invitedAt: data.invitedAt?.toDate?.() ?? undefined,
    confirmedAt: data.confirmedAt?.toDate?.() ?? undefined,
    paidAt: data.paidAt?.toDate?.() ?? undefined,
    paymentAmount: data.paymentAmount,
    paymentId: data.paymentId,
    blessing: data.blessing,
});

export const eventConverter: FirestoreDataConverter<Event> = {
    /**
     * Convert TypeScript object to Firestore document
     * Removes undefined values (Firestore doesn't accept them)
     */
    toFirestore(event: Event): DocumentData {
        const data: DocumentData = {
            id: event.id,
            creatorId: event.creatorId,
            creatorName: event.creatorName,
            creatorEmail: event.creatorEmail,
            eventType: event.eventType,
            eventName: event.eventName,
            date: event.date,
            time: event.time,
            address1: event.address1,
            address2: event.address2,
            guests: event.guests.map(guestToFirestore),
            totalGuests: event.totalGuests,
            guestStats: event.guestStats,
            status: event.status,
            createdAt: event.createdAt instanceof Date
                ? Timestamp.fromDate(event.createdAt)
                : event.createdAt,
            updatedAt: event.updatedAt instanceof Date
                ? Timestamp.fromDate(event.updatedAt)
                : event.updatedAt,
        };

        // Add optional fields only if they have values
        if (event.eventCategory) data.eventCategory = event.eventCategory;
        if (event.partyType) data.partyType = event.partyType;
        if (event.otherPartyType) data.otherPartyType = event.otherPartyType;
        if (event.attireType) data.attireType = event.attireType;
        if (event.footwearType) data.footwearType = event.footwearType;
        if (event.theme) data.theme = event.theme;
        if (event.customTheme) data.customTheme = event.customTheme;
        if (event.parking) data.parking = event.parking;
        if (event.kosherType) data.kosherType = event.kosherType;
        if (event.mealType) data.mealType = event.mealType;
        if (event.vegetarianType) data.vegetarianType = event.vegetarianType;
        if (event.age) data.age = event.age;
        if (event.stripeAccountId) data.stripeAccountId = event.stripeAccountId;
        if (event.posterUrl) data.posterUrl = event.posterUrl;
        if (event.posterPrompt) data.posterPrompt = event.posterPrompt;

        return data;
    },

    /**
     * Convert Firestore document to TypeScript object
     */
    fromFirestore(
        snapshot: QueryDocumentSnapshot,
        options?: SnapshotOptions
    ): Event {
        const data = snapshot.data(options);

        return {
            id: snapshot.id,
            creatorId: data.creatorId,
            creatorName: data.creatorName,
            creatorEmail: data.creatorEmail ?? null,
            eventType: data.eventType,
            eventName: data.eventName,
            eventCategory: data.eventCategory,
            partyType: data.partyType,
            otherPartyType: data.otherPartyType,
            attireType: data.attireType,
            footwearType: data.footwearType,
            theme: data.theme,
            customTheme: data.customTheme,
            parking: data.parking,
            kosherType: data.kosherType,
            mealType: data.mealType,
            vegetarianType: data.vegetarianType,
            age: data.age,
            date: data.date,
            time: data.time,
            address1: data.address1 ?? '',
            address2: data.address2 ?? '',
            posterUrl: data.posterUrl,
            posterPrompt: data.posterPrompt,
            guests: (data.guests ?? []).map(guestFromFirestore),
            totalGuests: data.totalGuests ?? 0,
            guestStats: data.guestStats ?? { total: 0, added: 0, invited: 0, confirmed: 0, paid: 0, totalPaid: 0 },
            stripeAccountId: data.stripeAccountId,
            status: data.status ?? 'active',
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
            updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
        };
    },
};

/**
 * Firestore Converter for EventSummary
 * Returns event data without the full guests array (for listing)
 */
export const eventSummaryConverter: FirestoreDataConverter<EventSummary> = {
    toFirestore(event: EventSummary): DocumentData {
        // This converter is read-only for summaries
        throw new Error('eventSummaryConverter is read-only. Use eventConverter for writes.');
    },

    fromFirestore(
        snapshot: QueryDocumentSnapshot,
        options?: SnapshotOptions
    ): EventSummary {
        const data = snapshot.data(options);

        return {
            id: snapshot.id,
            creatorId: data.creatorId,
            creatorName: data.creatorName,
            creatorEmail: data.creatorEmail ?? null,
            eventType: data.eventType,
            eventName: data.eventName,
            eventCategory: data.eventCategory,
            partyType: data.partyType,
            otherPartyType: data.otherPartyType,
            attireType: data.attireType,
            footwearType: data.footwearType,
            theme: data.theme,
            customTheme: data.customTheme,
            parking: data.parking,
            kosherType: data.kosherType,
            mealType: data.mealType,
            vegetarianType: data.vegetarianType,
            age: data.age,
            date: data.date,
            time: data.time,
            address1: data.address1 ?? '',
            address2: data.address2 ?? '',
            posterUrl: data.posterUrl,
            posterPrompt: data.posterPrompt,
            // NOTE: guests array is NOT fetched - use guestStats instead
            totalGuests: data.totalGuests ?? 0,
            guestStats: data.guestStats ?? { total: 0, added: 0, invited: 0, confirmed: 0, paid: 0, totalPaid: 0 },
            stripeAccountId: data.stripeAccountId,
            status: data.status ?? 'active',
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
            updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
        };
    },
};

