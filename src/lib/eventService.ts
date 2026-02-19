/**
 * Event Service
 * Handles event creation and database updates
 * Uses React Native Firebase for Firestore to share auth state
 */

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Event, EventSummary, CreateEventData, Guest, calculateGuestStats } from "@/types/events";
import { UserProfile } from "@/types/user";

export interface CreateEventResult {
    success: boolean;
    eventId?: string;
    error?: string;
}

/**
 * Creates an event in Firestore
 * A Firebase Cloud Function will automatically create a Stripe Connect account for the user
 */
export async function createEvent(eventData: CreateEventData): Promise<CreateEventResult> {
    try {
        const user = auth().currentUser;
        if (!user) {
            throw new Error('User must be authenticated to create an event');
        }

        const uid = user.uid;

        console.log('📅 Creating event for user:', uid);

        // Get user data (may not exist yet)
        const userDoc = await firestore().collection('users').doc(uid).get();
        const userExists = userDoc.exists();
        const userData = userDoc.data() as UserProfile | undefined;

        // Generate unique event ID
        const eventId = firestore().collection('events').doc().id;

        // Calculate guest stats
        const guestStats = calculateGuestStats(eventData.guests);

        // Build typed event object
        const event: Event = {
            id: eventId,
            // Creator info
            creatorId: uid,
            creatorName: userData?.fullName || user.displayName || 'Unknown',
            creatorEmail: user.email || null,
            // Event details
            eventType: eventData.eventType,
            eventName: eventData.formData.eventName,
            // Optional event details
            eventCategory: eventData.formData.eventCategory,
            partyType: eventData.formData.partyType,
            otherPartyType: eventData.formData.otherPartyType,
            attireType: eventData.formData.attireType,
            footwearType: eventData.formData.footwearType,
            theme: eventData.formData.theme,
            parking: eventData.formData.parking,
            kosherType: eventData.formData.kosherType,
            mealType: eventData.formData.mealType,
            vegetarianType: eventData.formData.vegetarianType,
            age: eventData.formData.age,
            // Date & Time
            date: eventData.formData.date,
            time: eventData.formData.time,
            // Location
            address1: eventData.formData.address1 || '',
            address2: eventData.formData.address2 || '',
            // Guests
            guests: eventData.guests,
            totalGuests: eventData.guests.length,
            guestStats: guestStats,
            // Status
            status: 'active',
            // Stripe account will be linked by Cloud Function
            stripeAccountId: userData?.stripeAccountId,
            // Timestamps
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // Remove undefined values before saving
        const cleanEvent = removeUndefined(event);

        // Save event to Firestore
        await firestore().collection('events').doc(eventId).set(cleanEvent);

        console.log('✅ Event saved to Firestore:', eventId);

        // Update or create user document
        if (userExists) {
            // User exists - update eventsCreated counter
            await firestore().collection('users').doc(uid).update({
                eventsCreated: firestore.FieldValue.increment(1),
                updatedAt: firestore.FieldValue.serverTimestamp(),
            });
        } else {
            // User doesn't exist - create user document
            const newUserProfile: UserProfile = {
                uid: uid,
                email: user.email,
                fullName: user.displayName || 'Unknown',
                eventsCreated: 1,
                eventsAttended: 0,
                totalReceived: 0,
                totalPaid: 0,
                kycStatus: 'not_started',
                verificationStatus: 'not_started',
                notificationsEnabled: true,
                biometricEnabled: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                accountType: 'parent',
            };
            await firestore().collection('users').doc(uid).set(newUserProfile);
        }

        console.log('✅ User document updated');

        // Update onboarding step to 1 (created event + added guests) if not already past it
        const currentStep = userData?.onboardingStep || 0;
        if (currentStep < 1) {
            await firestore().collection('users').doc(uid).update({
                onboardingStep: 1,
            });
            console.log('✅ Onboarding step advanced to 1 (event created)');
        }

        return {
            success: true,
            eventId: eventId,
        };
    } catch (error: any) {
        console.error('❌ Error creating event:', error);
        return {
            success: false,
            error: error.message || 'Failed to create event',
        };
    }
}

/**
 * Helper to remove undefined values from an object
 */
function removeUndefined(obj: any): any {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
            if (Array.isArray(value)) {
                result[key] = value.map(item =>
                    typeof item === 'object' && item !== null ? removeUndefined(item) : item
                );
            } else if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
                result[key] = removeUndefined(value);
            } else {
                result[key] = value;
            }
        }
    }
    return result;
}

/**
 * Get event summaries (without full guest data) for the current user
 * Use this for listing events - it only fetches stats, not individual guests
 */
export async function getUserEventsStats(): Promise<EventSummary[]> {
    try {
        const user = auth().currentUser;
        if (!user) {
            throw new Error('User must be authenticated');
        }

        // Query events where creatorId matches current user
        const snapshot = await firestore()
            .collection('events')
            .where('creatorId', '==', user.uid)
            .get();

        // Map documents to EventSummary (without guests array)
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                creatorId: data.creatorId,
                creatorName: data.creatorName,
                creatorEmail: data.creatorEmail,
                eventType: data.eventType,
                eventName: data.eventName,
                eventCategory: data.eventCategory,
                partyType: data.partyType,
                otherPartyType: data.otherPartyType,
                attireType: data.attireType,
                footwearType: data.footwearType,
                theme: data.theme,
                parking: data.parking,
                kosherType: data.kosherType,
                mealType: data.mealType,
                vegetarianType: data.vegetarianType,
                age: data.age,
                date: data.date,
                time: data.time,
                address1: data.address1,
                address2: data.address2,
                totalGuests: data.totalGuests || 0,
                guestStats: data.guestStats || { total: 0, added: 0, invited: 0, confirmed: 0, paid: 0, invalidNumber: 0, notComing: 0, totalPaid: 0 },
                status: data.status,
                stripeAccountId: data.stripeAccountId,
                posterUrl: data.posterUrl,
                posterPrompt: data.posterPrompt,
                createdAt: data.createdAt?.toDate?.() || new Date(),
                updatedAt: data.updatedAt?.toDate?.() || new Date(),
            } as EventSummary;
        });
    } catch (error) {
        console.error('Error fetching user events:', error);
        return [];
    }
}

/**
 * Get a single event by ID
 */
export async function getEvent(eventId: string): Promise<Event | null> {
    try {
        const eventDoc = await firestore().collection('events').doc(eventId).get();

        if (!eventDoc.exists) {
            return null;
        }

        const data = eventDoc.data()!;
        return {
            ...data,
            id: eventDoc.id,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
        } as Event;
    } catch (error) {
        console.error('Error fetching event:', error);
        return null;
    }
}

/**
 * Update an event
 */
export async function updateEvent(eventId: string, updates: Partial<Event>): Promise<{ success: boolean; error?: string }> {
    try {
        // Filter out undefined values (Firebase doesn't accept them)
        const cleanUpdates: Record<string, any> = {};
        for (const [key, value] of Object.entries(updates)) {
            if (value !== undefined) {
                cleanUpdates[key] = value;
            }
        }

        await firestore().collection('events').doc(eventId).update({
            ...cleanUpdates,
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });

        return { success: true };
    } catch (error: any) {
        console.error('Error updating event:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Helper to convert Guest to Firestore-safe format (removes undefined values)
 */
function guestToFirestoreData(guest: Guest): Record<string, any> {
    const data: Record<string, any> = {
        id: guest.id,
        name: guest.name,
        phone: guest.phone,
        status: guest.status,
    };
    // Only add optional fields if they have values
    if (guest.addedAt) data.addedAt = guest.addedAt;
    if (guest.invitedAt) data.invitedAt = guest.invitedAt;
    if (guest.confirmedAt) data.confirmedAt = guest.confirmedAt;
    if (guest.paidAt) data.paidAt = guest.paidAt;
    if (guest.paymentAmount !== undefined) data.paymentAmount = guest.paymentAmount;
    if (guest.paymentId) data.paymentId = guest.paymentId;
    return data;
}

/**
 * Update event guests and recalculate stats
 * Use this whenever guests are modified (added, status changed, etc.)
 */
export async function updateEventGuests(
    eventId: string,
    guests: Guest[]
): Promise<{ success: boolean; error?: string }> {
    try {
        // Recalculate stats from the guests array
        const guestStats = calculateGuestStats(guests);

        // Convert guests to Firestore-safe format (no undefined values)
        const firestoreGuests = guests.map(guestToFirestoreData);

        await firestore().collection('events').doc(eventId).update({
            guests: firestoreGuests,
            totalGuests: guests.length,
            guestStats: guestStats,
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });

        return { success: true };
    } catch (error: any) {
        console.error('Error updating event guests:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update just the guest stats (without changing guests array)
 * Useful for recalculating stats after bulk operations
 */
export async function refreshEventGuestStats(eventId: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Get full event with guests
        const event = await getEvent(eventId);
        if (!event) {
            return { success: false, error: 'Event not found' };
        }

        // Recalculate and update stats
        const guestStats = calculateGuestStats(event.guests);

        await firestore().collection('events').doc(eventId).update({
            guestStats: guestStats,
            totalGuests: event.guests.length,
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });

        return { success: true };
    } catch (error: any) {
        console.error('Error refreshing event guest stats:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Generate AI invitation poster for an event
 */
export async function generateEventPoster(eventId: string): Promise<{
    success: boolean;
    posterUrl?: string;
    posterPrompt?: string;
    error?: string;
}> {
    try {
        const user = auth().currentUser;
        if (!user) {
            throw new Error('User must be authenticated');
        }

        // Get the user's ID token for authentication
        const idToken = await user.getIdToken();

        // Call the Cloud Function
        const response = await fetch(
            'https://us-central1-piggybank-174f3.cloudfunctions.net/api/generatePoster',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({ eventId }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to generate poster');
        }

        return {
            success: true,
            posterUrl: data.posterUrl,
            posterPrompt: data.posterPrompt,
        };
    } catch (error: any) {
        console.error('Error generating event poster:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Save a poster URL to an event (for externally generated images)
 */
export async function saveEventPoster(
    eventId: string,
    posterUrl: string,
    posterPrompt?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const updates: Record<string, any> = {
            posterUrl,
            updatedAt: firestore.FieldValue.serverTimestamp(),
        };
        if (posterPrompt) {
            updates.posterPrompt = posterPrompt;
        }

        await firestore().collection('events').doc(eventId).update(updates);

        return { success: true };
    } catch (error: any) {
        console.error('Error saving event poster:', error);
        return { success: false, error: error.message };
    }
}
