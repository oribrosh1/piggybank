import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import {
    Calendar,
    Clock,
    MapPin,
    Shirt,
    Car,
    Check,
    Loader2
} from 'lucide-react';
import { getAdminDb } from '@/lib/firebase-admin';
import { EventData, getEventEmoji, getEventTypeLabel, formatDate } from '@/lib/types';
import RSVPSection from '@/components/RSVPSection';
import GiftCardSection from '@/components/GiftCardSection';

// Fetch event data
async function getEvent(id: string): Promise<EventData | null> {
    try {
        const db = await getAdminDb();
        const eventDoc = await db.collection('events').doc(id).get();

        if (!eventDoc.exists) {
            return null;
        }

        const data = eventDoc.data();
        return {
            id: eventDoc.id,
            ...data,
            createdAt: data?.createdAt?.toDate() || new Date(),
        } as EventData;
    } catch (error) {
        console.error('Error fetching event:', error);
        return null;
    }
}

// Generate metadata for SMS preview
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const event = await getEvent(params.id);

    if (!event) {
        return {
            title: 'Event Not Found | PiggyBank',
        };
    }

    const emoji = getEventEmoji(event.eventType);
    const typeLabel = getEventTypeLabel(event.eventType);
    const title = `${emoji} You're Invited! ${event.eventName}`;
    const description = `Join us for ${event.creatorName}'s ${typeLabel}! ${formatDate(event.date)} at ${event.time}. RSVP now and send a gift directly to their PiggyBank card!`;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://creditkid.app';
    const eventUrl = `${baseUrl}/event/${event.id}`;
    const ogImageUrl = `${baseUrl}/api/og?title=${encodeURIComponent(event.eventName)}&type=${event.eventType}&date=${encodeURIComponent(event.date)}&host=${encodeURIComponent(event.creatorName)}`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: eventUrl,
            siteName: 'PiggyBank',
            type: 'website',
            images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${event.eventName} - ${typeLabel}` }],
        },
        twitter: { card: 'summary_large_image', title, description, images: [ogImageUrl] },
        other: { 'apple-mobile-web-app-title': title },
    };
}

export const revalidate = 60;

export default async function EventPage({ params }: { params: { id: string } }) {
    const event = await getEvent(params.id);

    if (!event) {
        notFound();
    }

    const emoji = getEventEmoji(event.eventType);
    const typeLabel = getEventTypeLabel(event.eventType);
    const formattedDate = formatDate(event.date);
    const firstName = event.creatorName.split(' ')[0];

    // Theme colors based on event type
    const themes = {
        birthday: {
            gradient: 'from-amber-400 via-orange-500 to-pink-500',
            accent: '#F59E0B',
            glow: 'shadow-orange-500/50',
        },
        barMitzvah: {
            gradient: 'from-blue-500 via-indigo-600 to-purple-700',
            accent: '#6366F1',
            glow: 'shadow-indigo-500/50',
        },
        batMitzvah: {
            gradient: 'from-pink-400 via-rose-500 to-purple-600',
            accent: '#EC4899',
            glow: 'shadow-pink-500/50',
        },
        other: {
            gradient: 'from-violet-500 via-purple-600 to-fuchsia-600',
            accent: '#8B5CF6',
            glow: 'shadow-purple-500/50',
        },
    };
    const theme = themes[event.eventType] || themes.other;

    return (
        <main className="min-h-screen bg-[#F3F4F6]">
            {/* Hero Header */}
            <section className={`bg-gradient-to-br ${theme.gradient} pt-10 pb-20 px-6 relative overflow-hidden rounded-b-[40px]`}>
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 overflow-hidden">
                    {/* Floating circles */}
                    <div className="absolute top-10 left-[10%] w-16 h-16 bg-white/10 rounded-full animate-pulse" />
                    <div className="absolute top-16 right-[15%] w-10 h-10 bg-white/15 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <div className="absolute top-32 left-[25%] w-8 h-8 bg-white/10 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-24 right-[25%] w-6 h-6 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />

                    {/* Decorative sparkles */}
                    <div className="absolute top-12 left-[8%] text-2xl opacity-30">✨</div>
                    <div className="absolute top-8 right-[12%] text-xl opacity-25">⭐</div>
                    <div className="absolute top-28 right-[8%] text-lg opacity-20">✨</div>
                </div>

                <div className="max-w-md mx-auto text-center relative z-10">
                    {/* Sparkle Badge */}
                    <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full mb-5 border border-white/20">
                        <span className="text-sm">✨</span>
                        <span className="text-xs font-bold text-white uppercase tracking-wider">You&apos;re Invited!</span>
                        <span className="text-sm">✨</span>
                    </div>

                    {/* Emoji Circle with Glow */}
                    <div className={`w-24 h-24 mx-auto mb-5 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center shadow-2xl ${theme.glow} border-4 border-white/30`}>
                        <span className="text-5xl drop-shadow-lg">{emoji}</span>
                    </div>

                    {/* Event Name */}
                    <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight drop-shadow-lg">
                        {event.eventName}
                    </h1>

                    {/* Host Name */}
                    <p className="text-white/80 text-sm font-medium mb-4">
                        Hosted by <span className="text-white font-bold">{event.creatorName}</span>
                    </p>

                    {/* Age Badge */}
                    {event.age && (
                        <div className="inline-flex items-center gap-2 bg-white text-gray-800 px-5 py-2 rounded-full shadow-xl">
                            <span className="text-base">🎂</span>
                            <span className="font-black text-base">Turning {event.age}!</span>
                            <span className="text-base">🎉</span>
                        </div>
                    )}

                    {/* Event Type Badge */}
                    {!event.age && (
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-5 py-2 rounded-full border border-white/30">
                            <span className="text-white font-bold text-sm">{typeLabel}</span>
                        </div>
                    )}
                </div>
            </section>

            {/* Main Content */}
            <div className="px-4 pt-5 pb-8">
                <div className="max-w-md mx-auto space-y-4">

                    {/* Event Details Card */}
                    <div className="bg-white rounded-3xl shadow-xl p-6 space-y-5">
                        {/* Date */}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#EDE9FE] flex items-center justify-center flex-shrink-0">
                                <Calendar size={22} className="text-[#8B5CF6]" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Date</p>
                                <p className="text-base font-bold text-gray-900">{formattedDate}</p>
                            </div>
                        </div>

                        {/* Time */}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
                                <Clock size={22} className="text-[#F59E0B]" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Time</p>
                                <p className="text-base font-bold text-gray-900">{event.time}</p>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#D1FAE5] flex items-center justify-center flex-shrink-0">
                                <MapPin size={22} className="text-[#10B981]" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Location</p>
                                <p className="text-base font-bold text-gray-900">{event.address1}</p>
                                {event.address2 && (
                                    <p className="text-sm text-gray-500 mt-0.5">{event.address2}</p>
                                )}
                                {event.parking && (
                                    <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-2">
                                        <Car size={12} />
                                        <span>{event.parking}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Theme & Attire Badges */}
                        {(event.theme || event.attireType) && (
                            <div className="pt-4 border-t border-gray-100">
                                <div className="flex flex-wrap gap-2">
                                    {event.theme && (
                                        <span className="bg-[#EDE9FE] text-[#7C3AED] px-3.5 py-1.5 rounded-full text-xs font-bold">
                                            🎭 {event.theme}
                                        </span>
                                    )}
                                    {event.attireType && (
                                        <span className="bg-[#DBEAFE] text-[#2563EB] px-3.5 py-1.5 rounded-full text-xs font-bold">
                                            <Shirt size={12} className="inline mr-1" />
                                            {event.attireType}
                                        </span>
                                    )}
                                    {event.footwearType && (
                                        <span className="bg-[#FCE7F3] text-[#DB2777] px-3.5 py-1.5 rounded-full text-xs font-bold">
                                            👟 {event.footwearType}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Food Info Badges */}
                        {(event.kosherType || event.mealType || (event.vegetarianType && event.vegetarianType !== 'None')) && (
                            <div className="pt-4 border-t border-gray-100">
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Food Info</p>
                                <div className="flex flex-wrap gap-2">
                                    {event.kosherType && (
                                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                                            {event.kosherType}
                                        </span>
                                    )}
                                    {event.mealType && (
                                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                                            {event.mealType}
                                        </span>
                                    )}
                                    {event.vegetarianType && event.vegetarianType !== 'None' && (
                                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">
                                            {event.vegetarianType}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RSVP Section */}
                    <Suspense fallback={
                        <div className="bg-white rounded-3xl shadow-lg p-6">
                            <div className="flex items-center justify-center gap-3 py-8">
                                <Loader2 size={24} className="animate-spin text-gray-400" />
                                <span className="text-gray-500">Loading...</span>
                            </div>
                        </div>
                    }>
                        <RSVPSection
                            eventId={event.id}
                            hostName={event.creatorName}
                            themeColor="#8B5CF6"
                            eventName={event.eventName}
                            childAge={event.age}
                            eventType={event.eventType}
                        />
                    </Suspense>

                    {/* PiggyBank Gift Section */}
                    <div className="bg-[#FAF5FF] rounded-3xl p-6 border-2 border-[#E9D5FF]">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6] flex items-center justify-center">
                                <span className="text-2xl">🐷</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-extrabold text-gray-900">Skip the Gift Card! 🎁</h3>
                                <p className="text-xs font-semibold text-[#7C3AED]">Give a gift they&apos;ll actually use</p>
                            </div>
                        </div>

                        {/* Benefits */}
                        <div className="space-y-3 mb-6">
                            {[
                                "Use anywhere – not locked to one store",
                                "Apple Pay ready – tap & pay instantly",
                                "Never expires – no hidden fees",
                                "Only 3% fee – vs 15-20% gift card markup"
                            ].map((benefit, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-[#D1FAE5] flex items-center justify-center flex-shrink-0">
                                        <Check size={10} className="text-[#059669]" strokeWidth={3} />
                                    </div>
                                    <span className="text-sm text-gray-700 font-medium">{benefit}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Gift Card Section */}
                    <GiftCardSection
                        firstName={firstName}
                        eventType={event.eventType}
                        typeLabel={typeLabel}
                        age={event.age}
                    />

                    {/* Powered by PiggyBank */}
                    <div className="bg-gradient-to-br from-purple-600 to-pink-500 rounded-3xl p-6 text-center">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                            <span className="text-3xl">🐷</span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">
                            Powered by PiggyBank
                        </h3>
                        <p className="text-white/80 text-sm mb-4">
                            The smart way to give and receive gifts. No more gift cards sitting in drawers!
                        </p>
                        <button className="bg-white text-purple-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:shadow-lg transition-all">
                            Learn More
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-6 px-4 text-center text-sm text-gray-500 border-t border-gray-200 bg-white">
                <p>© 2024 PiggyBank. The end of gift cards is here! 🎉</p>
            </footer>
        </main>
    );
}
