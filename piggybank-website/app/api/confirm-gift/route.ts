import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { paymentIntentId, eventId, guestId } = body;

        if (!paymentIntentId || !eventId || !guestId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Verify the payment was successful
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            return NextResponse.json(
                { error: 'Payment not completed' },
                { status: 400 }
            );
        }

        const db = getAdminDb();
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

        // Find and update the guest
        const guestIndex = guests.findIndex((g: any) => g.id === guestId);

        if (guestIndex === -1) {
            return NextResponse.json(
                { error: 'Guest not found' },
                { status: 404 }
            );
        }

        // Get gift amount from metadata
        const giftAmount = parseFloat(paymentIntent.metadata.giftAmount || '0');

        // Update guest with payment info
        guests[guestIndex] = {
            ...guests[guestIndex],
            status: 'paid',
            paidAt: FieldValue.serverTimestamp(),
            paymentAmount: giftAmount,
            paymentId: paymentIntentId,
            blessing: paymentIntent.metadata.blessing || '',
            templateId: paymentIntent.metadata.templateId || '',
        };

        // Recalculate guest stats
        const guestStats = {
            total: guests.length,
            added: guests.filter((g: any) => g.status === 'added').length,
            invited: guests.filter((g: any) => g.status === 'invited').length,
            confirmed: guests.filter((g: any) => g.status === 'confirmed').length,
            paid: guests.filter((g: any) => g.status === 'paid').length,
            totalPaid: guests
                .filter((g: any) => g.status === 'paid')
                .reduce((sum: number, g: any) => sum + (g.paymentAmount || 0), 0),
        };

        // Update event
        await eventRef.update({
            guests: guests,
            guestStats: guestStats,
            updatedAt: FieldValue.serverTimestamp(),
        });

        // TODO: Send notification to event creator
        // TODO: Add gift to virtual card balance

        return NextResponse.json({
            success: true,
            message: 'Gift sent successfully!',
            giftAmount: giftAmount,
            guestName: guests[guestIndex].name,
        });

    } catch (error: any) {
        console.error('Error confirming gift:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to confirm gift' },
            { status: 500 }
        );
    }
}

