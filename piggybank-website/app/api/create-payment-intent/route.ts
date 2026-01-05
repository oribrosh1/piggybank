import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminDb } from '@/lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            amount,
            eventId,
            guestId,
            guestName,
            hostName,
            blessing,
            templateId
        } = body;

        // Validate amount
        if (!amount || amount < 1) {
            return NextResponse.json(
                { error: 'Invalid amount' },
                { status: 400 }
            );
        }

        // Get the event to find the creator's Stripe Connect account
        let connectedAccountId: string | null = null;

        if (eventId) {
            try {
                const db = getAdminDb();
                const eventDoc = await db.collection('events').doc(eventId).get();

                if (eventDoc.exists) {
                    const eventData = eventDoc.data();
                    connectedAccountId = eventData?.stripeAccountId || null;

                    // If event doesn't have stripeAccountId, try to get it from the creator's profile
                    if (!connectedAccountId && eventData?.creatorId) {
                        const userDoc = await db.collection('users').doc(eventData.creatorId).get();
                        if (userDoc.exists) {
                            connectedAccountId = userDoc.data()?.stripeAccountId || null;
                        }
                    }
                }
            } catch (err) {
                console.warn('Could not fetch connected account:', err);
            }
        }

        // Convert to cents
        const giftAmountInCents = Math.round(amount * 100);
        const platformFeeInCents = Math.round(giftAmountInCents * 0.03); // 3% fee to PiggyBank
        const totalChargeInCents = giftAmountInCents + platformFeeInCents;

        // Build PaymentIntent options
        const paymentIntentOptions: Stripe.PaymentIntentCreateParams = {
            amount: totalChargeInCents,
            currency: 'usd',
            payment_method_types: ['card'],
            metadata: {
                eventId: eventId || '',
                guestId: guestId || '',
                guestName: guestName || '',
                hostName: hostName || '',
                giftAmount: amount.toString(),
                feeAmount: (platformFeeInCents / 100).toFixed(2),
                blessing: blessing?.substring(0, 500) || '',
                templateId: templateId || '',
                type: 'piggybank_gift',
            },
        };

        // If we have a connected account, use Stripe Connect with application fee
        // The gift amount goes to the connected account, fee goes to PiggyBank
        if (connectedAccountId) {
            paymentIntentOptions.application_fee_amount = platformFeeInCents;
            paymentIntentOptions.transfer_data = {
                destination: connectedAccountId,
            };

            console.log(`Creating payment with Connect: $${amount} gift + $${platformFeeInCents / 100} fee → ${connectedAccountId}`);
        } else {
            // No connected account - full amount goes to PiggyBank (platform)
            // This handles cases where event creator hasn't set up Stripe yet
            console.log(`Creating payment without Connect: $${totalChargeInCents / 100} to platform`);
        }

        // Create the PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: amount,
            fee: platformFeeInCents / 100,
            total: totalChargeInCents / 100,
            hasConnectedAccount: !!connectedAccountId,
        });

    } catch (error: any) {
        console.error('Error creating payment intent:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create payment' },
            { status: 500 }
        );
    }
}

