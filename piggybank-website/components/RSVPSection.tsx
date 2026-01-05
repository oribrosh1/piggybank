'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    CheckCircle,
    XCircle,
    Loader2,
    PartyPopper,
    Heart,
    Sparkles,
    Image as ImageIcon,
    Gift,
    X,
    Lock
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import Stripe component to avoid SSR issues
const StripePaymentForm = dynamic(() => import('./StripePaymentForm'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-purple-500" />
            <span className="ml-2 text-gray-500">Loading payment...</span>
        </div>
    ),
});

interface RSVPSectionProps {
    eventId: string;
    hostName: string;
    themeColor: string;
    eventName?: string;
    childAge?: string;
    eventType?: string;
}

interface GuestInfo {
    id: string;
    name: string;
    status: string;
    rsvpResponse?: string;
}

// Sample templates - in production these would come from your database/storage
const SAMPLE_TEMPLATES = [
    { id: '1', name: 'Balloons', emoji: '🎈', bgColor: 'from-pink-400 to-purple-500' },
    { id: '2', name: 'Confetti', emoji: '🎊', bgColor: 'from-yellow-400 to-orange-500' },
    { id: '3', name: 'Stars', emoji: '⭐', bgColor: 'from-blue-400 to-indigo-500' },
    { id: '4', name: 'Hearts', emoji: '💖', bgColor: 'from-red-400 to-pink-500' },
    { id: '5', name: 'Cake', emoji: '🎂', bgColor: 'from-amber-400 to-yellow-500' },
    { id: '6', name: 'Party', emoji: '🎉', bgColor: 'from-green-400 to-teal-500' },
    { id: '7', name: 'Rainbow', emoji: '🌈', bgColor: 'from-red-400 via-yellow-400 to-blue-400' },
    { id: '8', name: 'Sparkles', emoji: '✨', bgColor: 'from-purple-400 to-pink-400' },
    { id: '9', name: 'Crown', emoji: '👑', bgColor: 'from-yellow-500 to-amber-600' },
    { id: '10', name: 'Rocket', emoji: '🚀', bgColor: 'from-slate-600 to-slate-800' },
    { id: '11', name: 'Unicorn', emoji: '🦄', bgColor: 'from-pink-300 to-purple-400' },
    { id: '12', name: 'Gaming', emoji: '🎮', bgColor: 'from-indigo-500 to-purple-600' },
];

export default function RSVPSection({ eventId, hostName, themeColor, eventName, childAge, eventType }: RSVPSectionProps) {
    const searchParams = useSearchParams();
    const guestId = searchParams.get('guest');

    const [guest, setGuest] = useState<GuestInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [response, setResponse] = useState<'confirmed' | 'declined' | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Gift section state
    const [giftAmount, setGiftAmount] = useState<number>(25);
    const [customAmount, setCustomAmount] = useState<string>('');
    const [blessing, setBlessing] = useState<string>('');
    const [selectedTemplate, setSelectedTemplate] = useState(SAMPLE_TEMPLATES[0]);
    const [showTemplateGallery, setShowTemplateGallery] = useState(false);
    const [generatingBlessing, setGeneratingBlessing] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    // Fetch guest info on mount
    useEffect(() => {
        async function fetchGuest() {
            if (!guestId) {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/rsvp?eventId=${eventId}&guestId=${guestId}`);
                const data = await res.json();

                if (data.success) {
                    setGuest(data.guest);
                    if (data.guest.rsvpResponse) {
                        setResponse(data.guest.rsvpResponse);
                        setSubmitted(true);
                    }
                }
            } catch (err) {
                console.error('Error fetching guest:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchGuest();
    }, [eventId, guestId]);

    const handleRSVP = async (rsvpResponse: 'confirmed' | 'declined') => {
        if (!guestId) {
            setError('Invalid invitation link. Please contact the host.');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch('/api/rsvp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId,
                    guestId,
                    response: rsvpResponse,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setResponse(rsvpResponse);
                setSubmitted(true);
                setGuest(data.guest);
            } else {
                setError(data.error || 'Something went wrong. Please try again.');
            }
        } catch (err) {
            setError('Failed to submit RSVP. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="bg-white rounded-3xl shadow-xl p-6">
                <div className="flex items-center justify-center gap-3 py-8">
                    <Loader2 size={24} className="animate-spin text-gray-400" />
                    <span className="text-gray-500">Loading your invitation...</span>
                </div>
            </div>
        );
    }

    // No guest ID - don't render RSVP section at all
    if (!guestId) {
        return null;
    }

    // Already submitted
    if (submitted) {
        return (
            <div className="bg-white rounded-3xl shadow-xl p-6 overflow-hidden relative">
                {/* Confetti animation for confirmed */}
                {response === 'confirmed' && (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-2 left-4 text-2xl animate-bounce" style={{ animationDelay: '0.1s' }}>🎉</div>
                        <div className="absolute top-4 right-6 text-2xl animate-bounce" style={{ animationDelay: '0.3s' }}>🎊</div>
                        <div className="absolute bottom-4 left-8 text-xl animate-bounce" style={{ animationDelay: '0.5s' }}>✨</div>
                    </div>
                )}

                <div className="text-center py-4 relative">
                    {response === 'confirmed' ? (
                        <>
                            <div
                                className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                                style={{ backgroundColor: `${themeColor}20` }}
                            >
                                <PartyPopper size={40} style={{ color: themeColor }} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                You&apos;re Going! 🎉
                            </h3>
                            <p className="text-gray-600 mb-2">
                                {guest?.name}, we can&apos;t wait to see you there!
                            </p>
                            <div
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                                style={{ backgroundColor: `${themeColor}20`, color: themeColor }}
                            >
                                <CheckCircle size={16} />
                                Confirmed
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <Heart size={40} className="text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Maybe Next Time
                            </h3>
                            <p className="text-gray-600 mb-4">
                                We&apos;ll miss you, {guest?.name}! Feel free to send a gift anyway 💝
                            </p>
                            <button
                                onClick={() => {
                                    setSubmitted(false);
                                    setResponse(null);
                                }}
                                className="text-sm text-purple-600 font-semibold hover:underline"
                            >
                                Changed your mind? Update RSVP
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // RSVP Form
    return (
        <div className="space-y-4">
            {/* RSVP Card */}
            <div className="bg-white rounded-3xl shadow-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: `${themeColor}20` }}
                    >
                        <CheckCircle size={24} style={{ color: themeColor }} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">
                            Hey {guest?.name}! 👋
                        </h3>
                        <p className="text-sm text-gray-600">Will you be joining us?</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">
                        {error}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={() => handleRSVP('confirmed')}
                        disabled={submitting}
                        className="flex-1 py-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <>
                                <CheckCircle size={20} />
                                I&apos;ll Be There!
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => handleRSVP('declined')}
                        disabled={submitting}
                        className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <>
                                <XCircle size={20} />
                                Can&apos;t Make It
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* PiggyBank Gift Promo */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 border-2 border-purple-100">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-2xl">🐷</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">
                            Skip the Gift Card! 🎁
                        </h3>
                        <p className="text-sm text-purple-600 font-medium">Give a gift they&apos;ll actually use</p>
                    </div>
                </div>

                {/* Stats callout */}
                <div className="bg-white rounded-2xl p-4 mb-4 border border-purple-100">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">😱</span>
                        <span className="text-sm font-bold text-red-500">$27 Billion</span>
                        <span className="text-sm text-gray-600">in gift cards go unused every year!</span>
                    </div>
                    <p className="text-xs text-gray-500">
                        43% of Americans have at least one unused gift card sitting in a drawer.
                    </p>
                </div>

                {/* Benefits */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-green-600 text-xs">✓</span>
                        </div>
                        <span className="text-sm text-gray-700">
                            <strong>Use anywhere</strong> – not locked to one store
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-green-600 text-xs">✓</span>
                        </div>
                        <span className="text-sm text-gray-700">
                            <strong>Apple Pay ready</strong> – they can tap & pay instantly
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-green-600 text-xs">✓</span>
                        </div>
                        <span className="text-sm text-gray-700">
                            <strong>Never expires</strong> – no hidden fees or expiration
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-green-600 text-xs">✓</span>
                        </div>
                        <span className="text-sm text-gray-700">
                            <strong>Only 3% fee</strong> – gift cards have 15-20% hidden markup!
                        </span>
                    </div>
                </div>

                {/* Bottom message */}
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                    <p className="text-sm text-amber-800 text-center">
                        💡 <strong>$50 with PiggyBank</strong> = $48.50 they can spend anywhere<br />
                        <span className="text-amber-600">vs. $50 locked to one store that might go unused</span>
                    </p>
                </div>
            </div>

            {/* Gift Card Creator Section */}
            {!paymentSuccess ? (
                <div className="bg-white rounded-3xl shadow-xl p-6">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center"
                            style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}dd)` }}
                        >
                            <Gift size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">
                                Send Your Gift 🎁
                            </h3>
                            <p className="text-sm text-gray-600">Create a personalized virtual gift card</p>
                        </div>
                    </div>

                    {/* Amount Selection */}
                    <div className="mb-6">
                        <label className="text-sm font-semibold text-gray-700 mb-3 block">
                            Gift Amount
                        </label>
                        <div className="grid grid-cols-4 gap-2 mb-3">
                            {[25, 50, 100, 150].map((amount) => (
                                <button
                                    key={amount}
                                    onClick={() => { setGiftAmount(amount); setCustomAmount(''); }}
                                    className={`py-3 rounded-xl font-bold text-sm transition-all ${giftAmount === amount && !customAmount
                                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    ${amount}
                                </button>
                            ))}
                        </div>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
                            <input
                                type="number"
                                placeholder="Custom amount"
                                value={customAmount}
                                onChange={(e) => { setCustomAmount(e.target.value); setGiftAmount(0); }}
                                className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Card Preview */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-semibold text-gray-700">
                                Card Preview
                            </label>
                            <button
                                onClick={() => setShowTemplateGallery(true)}
                                className="flex items-center gap-1 text-sm text-purple-600 font-semibold hover:text-purple-700"
                            >
                                <ImageIcon size={16} />
                                Change Design
                            </button>
                        </div>

                        {/* Preview Card */}
                        <div
                            className={`relative rounded-2xl p-6 bg-gradient-to-br ${selectedTemplate.bgColor} overflow-hidden`}
                            style={{ minHeight: '200px' }}
                        >
                            {/* Decorative elements */}
                            <div className="absolute top-4 right-4 text-4xl opacity-30">{selectedTemplate.emoji}</div>
                            <div className="absolute bottom-4 left-4 text-6xl opacity-20">{selectedTemplate.emoji}</div>

                            {/* Card content */}
                            <div className="relative z-10">
                                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-1 inline-block mb-4">
                                    <span className="text-white text-xs font-semibold">🐷 PiggyBank Gift</span>
                                </div>

                                <div className="text-white mb-4">
                                    <div className="text-4xl font-black mb-1">
                                        ${customAmount || giftAmount}
                                    </div>
                                    <div className="text-sm opacity-90">
                                        For {hostName.split(' ')[0]}&apos;s {eventType === 'birthday' ? 'Birthday' : 'Celebration'}
                                    </div>
                                </div>

                                {/* Message with sender info */}
                                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-3">
                                    {/* Sender badge */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 bg-white/40 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm font-bold">
                                                {guest?.name?.charAt(0) || 'G'}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-white text-sm font-bold">{guest?.name || 'Guest'}</div>
                                            <div className="text-white/70 text-xs">sends you this gift 💝</div>
                                        </div>
                                    </div>

                                    {/* Blessing message */}
                                    {blessing ? (
                                        <div className="border-t border-white/20 pt-3 mt-2">
                                            <p className="text-white text-sm italic leading-relaxed">&quot;{blessing}&quot;</p>
                                            <p className="text-white/60 text-xs mt-2 text-right">— {guest?.name || 'Guest'}</p>
                                        </div>
                                    ) : (
                                        <div className="border-t border-white/20 pt-3 mt-2">
                                            <p className="text-white/60 text-sm italic">Add a personal message below...</p>
                                        </div>
                                    )}
                                </div>

                                {/* Reassurance text */}
                                <div className="flex items-center gap-2 text-white/80 text-xs">
                                    <CheckCircle size={14} />
                                    <span>{hostName.split(' ')[0]} will see this is from <strong>{guest?.name || 'you'}</strong></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Blessing Input */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-semibold text-gray-700">
                                Your Message
                            </label>
                            <button
                                onClick={async () => {
                                    setGeneratingBlessing(true);
                                    // Simulate AI generation - in production, call your AI endpoint
                                    await new Promise(resolve => setTimeout(resolve, 1500));
                                    const blessings = [
                                        `Happy ${childAge ? childAge + 'th' : ''} Birthday! 🎉 Wishing you a day filled with joy, laughter, and all your favorite things. May this year bring you endless adventures!`,
                                        `To an amazing kid on your special day! 🌟 May your birthday be as wonderful as you are. Here's to making incredible memories!`,
                                        `Happy Birthday! 🎂 You're growing into such an awesome person. Enjoy your day and spend this however makes you happiest!`,
                                        `Wishing you the happiest of birthdays! 🎈 May all your dreams come true this year. Have a blast!`,
                                    ];
                                    setBlessing(blessings[Math.floor(Math.random() * blessings.length)]);
                                    setGeneratingBlessing(false);
                                }}
                                disabled={generatingBlessing}
                                className="flex items-center gap-1 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-lg font-semibold hover:shadow-md transition-all disabled:opacity-50"
                            >
                                {generatingBlessing ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Sparkles size={14} />
                                )}
                                {generatingBlessing ? 'Generating...' : 'AI Generate'}
                            </button>
                        </div>
                        <textarea
                            value={blessing}
                            onChange={(e) => setBlessing(e.target.value)}
                            placeholder={`Write a special message for ${hostName.split(' ')[0]}...`}
                            rows={3}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none transition-colors resize-none"
                        />
                    </div>

                    {/* Payment Section */}
                    <div className="border-t-2 border-gray-100 pt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Lock size={16} className="text-green-600" />
                            <span className="text-sm font-semibold text-gray-700">Secure Payment</span>
                        </div>

                        {/* Stripe Payment Form */}
                        <StripePaymentForm
                            amount={customAmount ? parseFloat(customAmount) : giftAmount}
                            eventId={eventId}
                            guestId={guestId || ''}
                            guestName={guest?.name || ''}
                            hostName={hostName}
                            blessing={blessing}
                            templateId={selectedTemplate.id}
                            onSuccess={() => setPaymentSuccess(true)}
                            onError={(err) => setError(err)}
                        />

                        {/* Fee Comparison */}
                        <div className="mt-6 bg-gray-50 rounded-2xl p-4">
                            <div className="text-xs font-semibold text-gray-500 mb-3 text-center">
                                💡 Compare the hidden fees
                            </div>

                            {/* Store fees */}
                            <div className="space-y-2 mb-3">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-red-500">🎯</span>
                                        <span className="text-gray-600">Target Gift Cards</span>
                                    </div>
                                    <span className="text-red-500 font-semibold">~5-10% markup</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-blue-500">🏪</span>
                                        <span className="text-gray-600">Best Buy Gift Cards</span>
                                    </div>
                                    <span className="text-red-500 font-semibold">~5-15% markup</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-600">☕</span>
                                        <span className="text-gray-600">Starbucks Gift Cards</span>
                                    </div>
                                    <span className="text-red-500 font-semibold">~10-20% markup</span>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-200 my-3"></div>

                            {/* PiggyBank fee */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🐷</span>
                                    <span className="text-gray-900 font-semibold">PiggyBank</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                                        Only 3%
                                    </span>
                                </div>
                            </div>

                            {/* Bottom note */}
                            <div className="mt-3 text-center">
                                <p className="text-xs text-gray-500">
                                    On a <strong>$50 gift</strong>: Store cards = ~$42-47 value → PiggyBank = <span className="text-green-600 font-semibold">$48.50</span> to spend
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Payment Success */
                <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <PartyPopper size={40} className="text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Gift Sent! 🎉
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Your ${customAmount || giftAmount} gift has been sent to {hostName.split(' ')[0]}!
                    </p>
                    <div className="bg-gray-50 rounded-xl p-4 text-left mb-4">
                        <div className="text-sm text-gray-500 mb-1">Gift from</div>
                        <div className="font-semibold text-gray-900">{guest?.name}</div>
                        {blessing && (
                            <>
                                <div className="text-sm text-gray-500 mt-3 mb-1">Your message</div>
                                <div className="text-gray-700 italic">&quot;{blessing}&quot;</div>
                            </>
                        )}
                    </div>
                    <p className="text-sm text-gray-500">
                        {hostName.split(' ')[0]} will receive a notification with your gift! 💝
                    </p>
                </div>
            )}

            {/* Template Gallery Modal */}
            {showTemplateGallery && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[80vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">Choose a Design</h3>
                            <button
                                onClick={() => setShowTemplateGallery(false)}
                                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Template Grid */}
                        <div className="p-4 overflow-y-auto max-h-[60vh]">
                            <p className="text-sm text-gray-500 mb-4">
                                200+ designs available • More coming soon!
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                                {SAMPLE_TEMPLATES.map((template) => (
                                    <button
                                        key={template.id}
                                        onClick={() => {
                                            setSelectedTemplate(template);
                                            setShowTemplateGallery(false);
                                        }}
                                        className={`aspect-square rounded-2xl bg-gradient-to-br ${template.bgColor} flex flex-col items-center justify-center transition-all hover:scale-105 ${selectedTemplate.id === template.id ? 'ring-4 ring-purple-500 ring-offset-2' : ''
                                            }`}
                                    >
                                        <span className="text-3xl mb-1">{template.emoji}</span>
                                        <span className="text-white text-xs font-medium">{template.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

