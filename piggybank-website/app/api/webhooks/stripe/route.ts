import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminDb, getFieldValue } from '@/lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json(
            { error: 'Webhook signature verification failed' },
            { status: 400 }
        );
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
            break;

        case 'payment_intent.payment_failed':
            await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
            break;

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    console.log('💰 Payment succeeded:', paymentIntent.id);

    const { eventId, guestId, giftAmount, blessing, templateId } = paymentIntent.metadata;

    if (!eventId || !guestId) {
        console.log('Missing eventId or guestId in metadata, skipping DB update');
        return;
    }

    try {
        const db = await getAdminDb();
        const FieldValue = await getFieldValue();
        const eventRef = db.collection('events').doc(eventId);
        const eventDoc = await eventRef.get();

        if (!eventDoc.exists) {
            console.error('Event not found:', eventId);
            return;
        }

        const eventData = eventDoc.data();
        const guests = eventData?.guests || [];

        // Find the guest
        const guestIndex = guests.findIndex((g: any) => g.id === guestId);

        if (guestIndex === -1) {
            console.error('Guest not found:', guestId);
            return;
        }

        // Check if already updated (idempotency)
        if (guests[guestIndex].status === 'paid' && guests[guestIndex].paymentId === paymentIntent.id) {
            console.log('Guest already marked as paid, skipping');
            return;
        }

        const amount = parseFloat(giftAmount || '0');

        // Update guest with payment info
        guests[guestIndex] = {
            ...guests[guestIndex],
            status: 'paid',
            paidAt: FieldValue.serverTimestamp(),
            paymentAmount: amount,
            paymentId: paymentIntent.id,
            blessing: blessing || '',
            templateId: templateId || '',
        };

        // Recalculate guest stats
        const guestStats = {
            total: guests.length,
            added: guests.filter((g: any) => g.status === 'added').length,
            invited: guests.filter((g: any) => g.status === 'invited').length,
            confirmed: guests.filter((g: any) => g.status === 'confirmed').length,
            paid: guests.filter((g: any) => g.status === 'paid').length,
            invalidNumber: guests.filter((g: any) => g.status === 'invalid_phone').length,
            notComing: guests.filter((g: any) => g.status === 'declined').length,
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

        console.log(`✅ Guest ${guestId} marked as paid: $${amount}`);

        // TODO: Send push notification to event creator
        // TODO: Add funds to virtual card balance

    } catch (error) {
        console.error('Error updating guest payment status:', error);
    }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    console.log('❌ Payment failed:', paymentIntent.id);

    const { eventId, guestId } = paymentIntent.metadata;

    if (!eventId || !guestId) {
        return;
    }

    // Optionally log failed payment attempts
    try {
        const db = await getAdminDb();
        const FieldValue = await getFieldValue();
        await db.collection('failed_payments').add({
            paymentIntentId: paymentIntent.id,
            eventId,
            guestId,
            error: paymentIntent.last_payment_error?.message || 'Unknown error',
            createdAt: FieldValue.serverTimestamp(),
        });
    } catch (error) {
        console.error('Error logging failed payment:', error);
    }
}

