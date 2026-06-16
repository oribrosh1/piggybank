/**
 * Guest gift checkout via Stripe Payments (PAYMENTS_PROVIDER=stripe).
 * When BANKING_PROVIDER=unit, charges collect on the platform; Firebase webhook records
 * giftSettlements for transfer into the host's Unit deposit account.
 */
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminDb } from '@/lib/firebase-admin';

const paymentsProvider = (process.env.PAYMENTS_PROVIDER || 'stripe').toLowerCase();
const bankingProvider = (process.env.BANKING_PROVIDER || 'stripe').toLowerCase();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
    try {
        if (paymentsProvider !== 'stripe') {
            return NextResponse.json(
                { error: `Gift payments are not configured for provider: ${paymentsProvider}` },
                { status: 501 }
            );
        }

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

        if (!amount || amount < 1) {
            return NextResponse.json(
                { error: 'Invalid amount' },
                { status: 400 }
            );
        }

        let connectedAccountId: string | null = null;
        let creatorId: string | null = null;

        if (eventId) {
            try {
                const db = await getAdminDb();
                const eventDoc = await db.collection('events').doc(eventId).get();

                if (eventDoc.exists) {
                    const eventData = eventDoc.data();
                    creatorId = eventData?.creatorId || null;

                    if (bankingProvider === 'stripe') {
                        connectedAccountId = eventData?.stripeAccountId || null;
                        if (!connectedAccountId && creatorId) {
                            const userDoc = await db.collection('users').doc(creatorId).get();
                            if (userDoc.exists) {
                                connectedAccountId = userDoc.data()?.stripeAccountId || null;
                            }
                        }
                    }
                }
            } catch (err) {
                console.warn('Could not fetch connected account:', err);
            }
        }

        const giftAmountInCents = Math.round(amount * 100);
        const feeRate = Number(process.env.PLATFORM_FEE_RATE || 0.03);
        const platformFeeInCents = Math.round(giftAmountInCents * feeRate);
        const totalChargeInCents = giftAmountInCents + platformFeeInCents;

        const paymentIntentOptions: Stripe.PaymentIntentCreateParams = {
            amount: totalChargeInCents,
            currency: 'usd',
            payment_method_types: ['card'],
            metadata: {
                eventId: eventId || '',
                guestId: guestId || '',
                guestName: guestName || '',
                hostName: hostName || '',
                creatorId: creatorId || '',
                giftAmount: amount.toString(),
                feeAmount: (platformFeeInCents / 100).toFixed(2),
                blessing: blessing?.substring(0, 500) || '',
                templateId: templateId || '',
                type: 'creditkid_gift',
                paymentsProvider: 'stripe',
                bankingProvider,
            },
        };

        // Stripe Connect destination only when banking stays on Stripe
        if (bankingProvider === 'stripe' && connectedAccountId) {
            paymentIntentOptions.application_fee_amount = platformFeeInCents;
            paymentIntentOptions.transfer_data = {
                destination: connectedAccountId,
            };
            console.log(`Creating payment with Connect: $${amount} gift + $${platformFeeInCents / 100} fee → ${connectedAccountId}`);
        } else {
            console.log(`Creating platform payment: $${totalChargeInCents / 100} (bankingProvider=${bankingProvider})`);
        }

        const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: amount,
            fee: platformFeeInCents / 100,
            total: totalChargeInCents / 100,
            hasConnectedAccount: bankingProvider === 'stripe' && !!connectedAccountId,
            paymentsProvider: 'stripe',
            bankingProvider,
        });

    } catch (error: any) {
        console.error('Error creating payment intent:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create payment' },
            { status: 500 }
        );
    }
}
