'use client';

import { useState, useEffect } from 'react';
import {
    CardElement,
    useStripe,
    useElements,
    Elements,
} from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe';
import { Loader2, CreditCard, ChevronRight, Lock } from 'lucide-react';

interface PaymentFormProps {
    amount: number;
    eventId: string;
    guestId: string;
    guestName: string;
    hostName: string;
    blessing: string;
    templateId: string;
    onSuccess: () => void;
    onError: (error: string) => void;
}

const cardElementOptions = {
    style: {
        base: {
            fontSize: '16px',
            color: '#1f2937',
            fontFamily: 'system-ui, sans-serif',
            '::placeholder': {
                color: '#9ca3af',
            },
            iconColor: '#8B5CF6',
        },
        invalid: {
            color: '#ef4444',
            iconColor: '#ef4444',
        },
    },
    hidePostalCode: false,
};

function CheckoutForm({
    amount,
    eventId,
    guestId,
    guestName,
    hostName,
    blessing,
    templateId,
    onSuccess,
    onError
}: PaymentFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [cardComplete, setCardComplete] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            setMessage('Payment system is loading. Please wait...');
            return;
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
            setMessage('Card form not found. Please refresh the page.');
            return;
        }

        if (!cardComplete) {
            setMessage('Please complete your card details.');
            return;
        }

        setIsProcessing(true);
        setMessage(null);

        try {
            // Create payment intent
            const response = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    eventId,
                    guestId,
                    guestName,
                    hostName,
                    blessing,
                    templateId,
                }),
            });

            const data = await response.json();

            if (data.error) {
                setMessage(data.error);
                setIsProcessing(false);
                return;
            }

            // Confirm the payment
            const { error, paymentIntent } = await stripe.confirmCardPayment(
                data.clientSecret,
                {
                    payment_method: {
                        card: cardElement,
                        billing_details: {
                            name: guestName,
                        },
                    },
                }
            );

            if (error) {
                setMessage(error.message || 'Payment failed. Please try again.');
                onError(error.message || 'Payment failed');
                setIsProcessing(false);
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                // Confirm the gift in our database
                try {
                    const confirmResponse = await fetch('/api/confirm-gift', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            paymentIntentId: paymentIntent.id,
                            eventId,
                            guestId,
                        }),
                    });

                    const confirmData = await confirmResponse.json();

                    if (confirmData.success) {
                        onSuccess();
                    } else {
                        onError(confirmData.error || 'Failed to record gift');
                    }
                } catch (err) {
                    onError('Failed to record gift');
                }
                setIsProcessing(false);
            }
        } catch (err) {
            setMessage('An unexpected error occurred. Please try again.');
            setIsProcessing(false);
        }
    };

    const fee = (amount * 0.03).toFixed(2);
    const total = (amount * 1.03).toFixed(2);

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount Summary */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100">
                <div className="text-xs font-semibold text-purple-600 mb-3 flex items-center gap-1">
                    <span>💳</span> Payment Breakdown
                </div>

                {/* Gift to child */}
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-sm">🎁</span>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-700">Gift to {hostName.split(' ')[0]}</span>
                            <div className="text-xs text-gray-500">Goes directly to their card</div>
                        </div>
                    </div>
                    <span className="font-bold text-green-600 text-lg">${amount.toFixed(2)}</span>
                </div>

                {/* Service fee */}
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-sm">🐷</span>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-700">Service Fee</span>
                            <div className="text-xs text-gray-500">Only 3% (vs 15-20% gift cards)</div>
                        </div>
                    </div>
                    <span className="font-semibold text-purple-600">${fee}</span>
                </div>

                {/* Divider */}
                <div className="border-t border-purple-200 my-3"></div>

                {/* Total */}
                <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">You Pay</span>
                    <div className="text-right">
                        <span className="font-black text-2xl text-purple-600">${total}</span>
                    </div>
                </div>

                {/* Reassurance */}
                <div className="mt-3 bg-white/60 rounded-xl p-3 flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-xs text-gray-600">
                        <strong>${amount.toFixed(2)}</strong> goes straight to {hostName.split(' ')[0]}&apos;s PiggyBank card
                    </span>
                </div>
            </div>

            {/* Card Input */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Card Details
                </label>
                <div className="bg-white border-2 border-gray-200 rounded-xl p-4 focus-within:border-purple-500 transition-colors">
                    <CardElement
                        options={cardElementOptions}
                        onChange={(e) => setCardComplete(e.complete)}
                    />
                </div>
            </div>

            {/* Error Message */}
            {message && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                    {message}
                </div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isProcessing || !stripe || !cardComplete}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isProcessing ? (
                    <>
                        <Loader2 size={20} className="animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <CreditCard size={20} />
                        Send ${amount} Gift
                        <ChevronRight size={20} />
                    </>
                )}
            </button>

            {/* Security Note */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <Lock size={12} />
                <span>Secured by Stripe. Your payment info is encrypted.</span>
            </div>
        </form>
    );
}

interface StripePaymentFormProps {
    amount: number;
    eventId: string;
    guestId: string;
    guestName: string;
    hostName: string;
    blessing: string;
    templateId: string;
    onSuccess: () => void;
    onError: (error: string) => void;
}

export default function StripePaymentForm(props: StripePaymentFormProps) {
    const [ready, setReady] = useState(false);
    const stripePromise = getStripe();

    useEffect(() => {
        if (props.amount > 0) {
            setReady(true);
        }
    }, [props.amount]);

    if (!ready) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-purple-500" />
                <span className="ml-2 text-gray-500">Preparing payment...</span>
            </div>
        );
    }

    return (
        <Elements
            stripe={stripePromise}
            options={{
                appearance: {
                    theme: 'stripe',
                    variables: {
                        colorPrimary: '#8B5CF6',
                        colorBackground: '#ffffff',
                        colorText: '#1f2937',
                        colorDanger: '#ef4444',
                        fontFamily: 'system-ui, sans-serif',
                        borderRadius: '12px',
                    },
                },
            }}
        >
            <CheckoutForm {...props} />
        </Elements>
    );
}
