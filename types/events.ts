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

/** Create-flow picker: birthday vs bar/bat (no "other"). */
export type CelebrationPickerType = Exclude<EventType, "other">;

/** For bar/bat: is the event mainly the party or the ceremony? */
export type MitzvahCelebrationFocus = "party" | "ceremony";

/** Partner presets in the create-flow Kosher Catering card (`later` = skip for now, poster first). */
export type KosherCateringPartnerId = "glatt-bistro" | "sky-high" | "heritage-kitchen";
export type KosherCateringPartnerChoice = KosherCateringPartnerId | "later";

/** Preset visual themes for AI poster generation (step 3) */
export type PosterThemeId = "space_explorer" | "neon_disco" | "magical_forest";

/** One saved AI poster image version (collection `eventPosterVersions`) */
export interface EventPosterVersionRow {
    id: string;
    accountId: string;
    eventId: string;
    posterUrl: string | null;
    versionNumber: number;
    posterPrompt?: string | null;
    posterThemeId?: PosterThemeId | null;
    createdAt?: Date;
}

// Event category for dress code options
export type EventCategory = "party" | "formal";

// Form data used in event-details.tsx
export interface EventFormData {
    age: string;
    /** Honoree first name (shown on poster & invitations). */
    childName: string;
    /** Step 2: what we’re celebrating (drives optional details & saved `eventType`). */
    celebrationType?: CelebrationPickerType;
    /** When `celebrationType` is bar/bat — party vs ceremony. */
    mitzvahCelebrationFocus?: MitzvahCelebrationFocus;
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
    /** Partner from the Kosher Catering card, or `later` to create the poster first. */
    kosherCateringPartnerId?: KosherCateringPartnerChoice;
    mealType?: string; // dairy, meat, pareve
    /** When `mealType` is dairy — milk supervised under Jewish law (Chalav Yisrael). */
    chalavYisrael?: boolean;
    vegetarianType?: string; // none, vegetarian, vegan, or by_request (when meal is meat: guests can request vegetarian)
    // Date/Time/Location
    date: string;
    time: string;
    address1: string;
    address2: string;
    /**
     * When true, user skipped party/theme/catering in step 2 — they get a standard (non–AI) invitation look until they add details.
     */
    optionalDetailsLater?: boolean;
    /** Local `file://` image from picker; uploaded to Storage after the event is created. */
    honoreePhotoUri?: string;
}

/**
 * Guest status in an event
 * - added: Guest added to list, not invited yet
 * - invited: Invitation sent via SMS
 * - confirmed: Guest confirmed attendance (RSVP'd yes)
 * - paid: Guest confirmed and paid
 * - invalid_phone: Phone invalid or SMS delivery failed
 * - declined: Guest declined (not coming)
 */
export type GuestStatus = 'added' | 'invited' | 'confirmed' | 'paid' | 'invalid_phone' | 'declined';

/**
 * Aggregated guest statistics (stored on event for quick access)
 */
export interface GuestStats {
    total: number;
    added: number;         // Added but not invited
    invited: number;       // Invited but not confirmed
    confirmed: number;     // Confirmed but not paid
    paid: number;          // Confirmed and paid
    invalidNumber: number; // Invalid phone or delivery failed
    notComing: number;     // Declined
    totalPaid: number;     // Total amount paid (in cents)
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
        invalidNumber: guests.filter(g => g.status === 'invalid_phone').length,
        notComing: guests.filter(g => g.status === 'declined').length,
        totalPaid: guests.reduce((sum, g) => sum + (g.paymentAmount || 0), 0),
    };
}

// Guest data used in select-guests.tsx
export interface Guest {
    id: string;
    name: string;
    phone: string;
    status: GuestStatus;
    /** Local device contact photo URI — UI only; not stored in Firestore. */
    imageUri?: string;
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
    /** Gift card design id from website (`1`–`12`), used to render the blessing card */
    templateId?: string;
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
    /** Derived display title for lists, invites, and legacy UIs (e.g. "Emma's 8th Birthday"). */
    eventName: string;
    /** Honoree name as entered at creation (preferred for UI). */
    childName?: string;
    /** Bar/bat: whether the celebration is centered on the party or the ceremony. */
    mitzvahCelebrationFocus?: MitzvahCelebrationFocus;
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
    kosherCateringPartnerId?: KosherCateringPartnerChoice;
    mealType?: string; // dairy, meat, pareve
    chalavYisrael?: boolean;
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
    /** Parent-uploaded reference photo of the honoree for AI poster likeness (Storage public URL). */
    honoreePhotoUrl?: string;
    /** Skipped optional details at creation — basic template until details added or AI run */
    optionalDetailsLater?: boolean;
    /** Last selected AI poster theme from create flow or regenerate */
    posterThemeId?: PosterThemeId;

    // Guests
    guests: Guest[];
    totalGuests: number;

    // Guest Stats (denormalized for quick access - updated when guests change)
    guestStats: GuestStats;

    // Child phone (set when parent creates invite link)
    childPhone?: string;

    // Stripe Connect Account (for payments)
    stripeAccountId?: string;
    /** Set by onEventCreated when host had no Connect account yet */
    needsBankingSetup?: boolean;
    /** When false, scheduled reminder SMS cron skips this event (default: reminders on) */
    reminderSmsEnabled?: boolean;

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
        if (event.kosherCateringPartnerId) data.kosherCateringPartnerId = event.kosherCateringPartnerId;
        if (event.mealType) data.mealType = event.mealType;
        if (event.chalavYisrael === true) data.chalavYisrael = true;
        if (event.vegetarianType) data.vegetarianType = event.vegetarianType;
        if (event.age) data.age = event.age;
        if (event.childName) data.childName = event.childName;
        if (event.mitzvahCelebrationFocus) data.mitzvahCelebrationFocus = event.mitzvahCelebrationFocus;
        if (event.childPhone) data.childPhone = event.childPhone;
        if (event.stripeAccountId) data.stripeAccountId = event.stripeAccountId;
        if (event.posterUrl) data.posterUrl = event.posterUrl;
        if (event.posterPrompt) data.posterPrompt = event.posterPrompt;
        if (event.honoreePhotoUrl) data.honoreePhotoUrl = event.honoreePhotoUrl;
        if (event.optionalDetailsLater === true) data.optionalDetailsLater = true;
        if (event.posterThemeId) data.posterThemeId = event.posterThemeId;
        if (event.needsBankingSetup === true) data.needsBankingSetup = true;
        if (event.reminderSmsEnabled === false) data.reminderSmsEnabled = false;

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
            childName: data.childName,
            mitzvahCelebrationFocus: data.mitzvahCelebrationFocus,
            eventCategory: data.eventCategory,
            partyType: data.partyType,
            otherPartyType: data.otherPartyType,
            attireType: data.attireType,
            footwearType: data.footwearType,
            theme: data.theme,
            customTheme: data.customTheme,
            parking: data.parking,
            kosherType: data.kosherType,
            kosherCateringPartnerId: data.kosherCateringPartnerId,
            mealType: data.mealType,
            chalavYisrael: data.chalavYisrael === true,
            vegetarianType: data.vegetarianType,
            age: data.age,
            date: data.date,
            time: data.time,
            address1: data.address1 ?? '',
            address2: data.address2 ?? '',
            posterUrl: data.posterUrl,
            posterPrompt: data.posterPrompt,
            honoreePhotoUrl: data.honoreePhotoUrl,
            optionalDetailsLater: data.optionalDetailsLater === true,
            posterThemeId: data.posterThemeId,
            childPhone: data.childPhone,
            guests: (data.guests ?? []).map(guestFromFirestore),
            totalGuests: data.totalGuests ?? 0,
            guestStats: data.guestStats ?? { total: 0, added: 0, invited: 0, confirmed: 0, paid: 0, invalidNumber: 0, notComing: 0, totalPaid: 0 },
            stripeAccountId: data.stripeAccountId,
            needsBankingSetup: data.needsBankingSetup === true,
            reminderSmsEnabled: data.reminderSmsEnabled === false ? false : true,
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
            childName: data.childName,
            mitzvahCelebrationFocus: data.mitzvahCelebrationFocus,
            eventCategory: data.eventCategory,
            partyType: data.partyType,
            otherPartyType: data.otherPartyType,
            attireType: data.attireType,
            footwearType: data.footwearType,
            theme: data.theme,
            customTheme: data.customTheme,
            parking: data.parking,
            kosherType: data.kosherType,
            kosherCateringPartnerId: data.kosherCateringPartnerId,
            mealType: data.mealType,
            chalavYisrael: data.chalavYisrael === true,
            vegetarianType: data.vegetarianType,
            age: data.age,
            date: data.date,
            time: data.time,
            address1: data.address1 ?? '',
            address2: data.address2 ?? '',
            posterUrl: data.posterUrl,
            posterPrompt: data.posterPrompt,
            honoreePhotoUrl: data.honoreePhotoUrl,
            optionalDetailsLater: data.optionalDetailsLater === true,
            posterThemeId: data.posterThemeId,
            childPhone: data.childPhone,
            // NOTE: guests array is NOT fetched - use guestStats instead
            totalGuests: data.totalGuests ?? 0,
            guestStats: data.guestStats ?? { total: 0, added: 0, invited: 0, confirmed: 0, paid: 0, invalidNumber: 0, notComing: 0, totalPaid: 0 },
            stripeAccountId: data.stripeAccountId,
            needsBankingSetup: data.needsBankingSetup === true,
            reminderSmsEnabled: data.reminderSmsEnabled === false ? false : true,
            status: data.status ?? 'active',
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
            updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
        };
    },
};

