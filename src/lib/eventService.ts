/**
 * Event Service
 * Handles event creation and database updates
 * Note: Stripe account creation is handled by a Firebase Cloud Function trigger
 */

import firebase from '../firebase';
import { collection, doc, setDoc, getDoc, updateDoc, increment, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { Event, EventSummary, CreateEventData, GuestStats, Guest, eventConverter, eventSummaryConverter, calculateGuestStats } from '../../types/events';
import { userProfileConverter, UserProfile } from '../../types/user';

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
        const user = firebase.auth().currentUser;
        if (!user) {
            throw new Error('User must be authenticated to create an event');
        }

        const db = firebase.firestore();
        const uid = user.uid;

        console.log('📅 Creating event for user:', uid);

        // Get user data with converter (may not exist yet)
        const userRef = doc(collection(db, 'users'), uid).withConverter(userProfileConverter);
        const userDoc = await getDoc(userRef);
        const userExists = userDoc.exists();
        const userData = userExists ? userDoc.data() : null;

        // Generate unique event ID
        const eventId = doc(collection(db, 'events')).id;

        // Calculate guest stats
        const guestStats = calculateGuestStats(eventData.guests);

        // Build typed event object - converter handles undefined removal
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

        // Save event to Firestore using converter
        const eventRef = doc(collection(db, 'events'), eventId).withConverter(eventConverter);
        await setDoc(eventRef, event);

        console.log('✅ Event saved to Firestore:', eventId);

        // Update or create user document
        if (userExists) {
            // User exists - update eventsCreated counter
            await updateDoc(userRef, {
                eventsCreated: increment(1),
                updatedAt: Timestamp.now(),
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
            await setDoc(userRef, newUserProfile);
        }

        console.log('✅ User document updated');

        // Update onboarding step to 1 (created event + added guests) if not already past it
        // Step 1: Create & manage your child's birthday event (invite guests from contacts)
        const currentStep = userData?.onboardingStep || 0;
        if (currentStep < 1) {
            await updateDoc(userRef, {
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
 * Get event summaries (without full guest data) for the current user
 * Use this for listing events - it only fetches stats, not individual guests
 */
export async function getUserEventsStats(): Promise<EventSummary[]> {
    try {
        const user = firebase.auth().currentUser;
        if (!user) {
            throw new Error('User must be authenticated');
        }

        const db = firebase.firestore();

        // Use summary converter - doesn't fetch guests array
        const eventsRef = collection(db, 'events').withConverter(eventSummaryConverter);

        // Query events where creatorId matches current user
        const snapshot = await getDocs(
            query(eventsRef, where('creatorId', '==', user.uid))
        );

        // Data is automatically typed as EventSummary[] (no guests array)
        return snapshot.docs.map(doc => doc.data());
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
        const db = firebase.firestore();

        // Use converter for automatic type conversion
        const eventRef = doc(collection(db, 'events'), eventId).withConverter(eventConverter);
        const eventDoc = await getDoc(eventRef);

        if (!eventDoc.exists()) {
            return null;
        }

        // Data is automatically typed as Event
        return eventDoc.data();
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
        const db = firebase.firestore();
        const eventRef = doc(collection(db, 'events'), eventId);

        // Filter out undefined values (Firebase doesn't accept them)
        const cleanUpdates: Record<string, any> = {};
        for (const [key, value] of Object.entries(updates)) {
            if (value !== undefined) {
                cleanUpdates[key] = value;
            }
        }

        await updateDoc(eventRef, {
            ...cleanUpdates,
            updatedAt: Timestamp.now(),
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
    if (guest.addedAt) data.addedAt = guest.addedAt instanceof Date ? Timestamp.fromDate(guest.addedAt) : guest.addedAt;
    if (guest.invitedAt) data.invitedAt = guest.invitedAt instanceof Date ? Timestamp.fromDate(guest.invitedAt) : guest.invitedAt;
    if (guest.confirmedAt) data.confirmedAt = guest.confirmedAt instanceof Date ? Timestamp.fromDate(guest.confirmedAt) : guest.confirmedAt;
    if (guest.paidAt) data.paidAt = guest.paidAt instanceof Date ? Timestamp.fromDate(guest.paidAt) : guest.paidAt;
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
        const db = firebase.firestore();
        const eventRef = doc(collection(db, 'events'), eventId);

        // Recalculate stats from the guests array
        const guestStats = calculateGuestStats(guests);

        // Convert guests to Firestore-safe format (no undefined values)
        const firestoreGuests = guests.map(guestToFirestoreData);

        await updateDoc(eventRef, {
            guests: firestoreGuests,
            totalGuests: guests.length,
            guestStats: guestStats,
            updatedAt: Timestamp.now(),
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
        const db = firebase.firestore();

        // Get full event with guests
        const event = await getEvent(eventId);
        if (!event) {
            return { success: false, error: 'Event not found' };
        }

        // Recalculate and update stats
        const guestStats = calculateGuestStats(event.guests);
        const eventRef = doc(collection(db, 'events'), eventId);

        await updateDoc(eventRef, {
            guestStats: guestStats,
            totalGuests: event.guests.length,
            updatedAt: Timestamp.now(),
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
        const user = firebase.auth().currentUser;
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
        const db = firebase.firestore();
        const eventRef = doc(collection(db, 'events'), eventId);

        const updates: Record<string, any> = {
            posterUrl,
            updatedAt: Timestamp.now(),
        };
        if (posterPrompt) {
            updates.posterPrompt = posterPrompt;
        }

        await updateDoc(eventRef, updates);

        return { success: true };
    } catch (error: any) {
        console.error('Error saving event poster:', error);
        return { success: false, error: error.message };
    }
}

