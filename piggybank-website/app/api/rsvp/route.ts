import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getFieldValue } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { eventId, guestId, response } = body;

        // Validate input
        if (!eventId || !guestId || !response) {
            return NextResponse.json(
                { error: 'Missing required fields: eventId, guestId, response' },
                { status: 400 }
            );
        }

        if (!['confirmed', 'declined'].includes(response)) {
            return NextResponse.json(
                { error: 'Invalid response. Must be "confirmed" or "declined"' },
                { status: 400 }
            );
        }

        const db = await getAdminDb();
        const FieldValue = await getFieldValue();
        const eventRef = db.collection('events').doc(eventId);
        const eventDoc = await eventRef.get();

        if (!eventDoc.exists) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            );
        }

        const eventData = eventDoc.data();
        const guests = eventData?.guests || [];

        // Find the guest
        const guestIndex = guests.findIndex((g: any) => g.id === guestId);

        if (guestIndex === -1) {
            return NextResponse.json(
                { error: 'Guest not found in this event' },
                { status: 404 }
            );
        }

        const guest = guests[guestIndex];

        // Update guest status
        const updatedGuest = {
            ...guest,
            status: response === 'confirmed' ? 'confirmed' : 'added', // 'declined' resets to 'added'
            confirmedAt: response === 'confirmed' ? FieldValue.serverTimestamp() : null,
            rsvpResponse: response,
            rsvpRespondedAt: FieldValue.serverTimestamp(),
        };

        // Update the guests array
        guests[guestIndex] = updatedGuest;

        // Update guest stats
        const guestStats = eventData?.guestStats || { total: 0, added: 0, invited: 0, confirmed: 0, paid: 0, totalPaid: 0 };

        // Recalculate stats
        const newStats = {
            total: guests.length,
            added: guests.filter((g: any) => g.status === 'added').length,
            invited: guests.filter((g: any) => g.status === 'invited').length,
            confirmed: guests.filter((g: any) => g.status === 'confirmed').length,
            paid: guests.filter((g: any) => g.status === 'paid').length,
            totalPaid: guestStats.totalPaid,
        };

        // Update Firestore
        await eventRef.update({
            guests: guests,
            guestStats: newStats,
            updatedAt: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({
            success: true,
            message: response === 'confirmed'
                ? `Thank you for confirming, ${guest.name}! See you there! 🎉`
                : `We're sorry you can't make it, ${guest.name}. Maybe next time!`,
            guest: {
                id: guest.id,
                name: guest.name,
                status: updatedGuest.status,
                rsvpResponse: response,
            },
        });

    } catch (error) {
        console.error('Error updating RSVP:', error);
        return NextResponse.json(
            { error: 'Failed to update RSVP. Please try again.' },
            { status: 500 }
        );
    }
}

// GET endpoint to check guest status
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('eventId');
        const guestId = searchParams.get('guestId');

        if (!eventId || !guestId) {
            return NextResponse.json(
                { error: 'Missing required parameters: eventId, guestId' },
                { status: 400 }
            );
        }

        const db = await getAdminDb();
        const eventDoc = await db.collection('events').doc(eventId).get();

        if (!eventDoc.exists) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            );
        }

        const eventData = eventDoc.data();
        const guests = eventData?.guests || [];
        const guest = guests.find((g: any) => g.id === guestId);

        if (!guest) {
            return NextResponse.json(
                { error: 'Guest not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            guest: {
                id: guest.id,
                name: guest.name,
                status: guest.status,
                rsvpResponse: guest.rsvpResponse,
            },
        });

    } catch (error) {
        console.error('Error fetching guest:', error);
        return NextResponse.json(
            { error: 'Failed to fetch guest information' },
            { status: 500 }
        );
    }
}

