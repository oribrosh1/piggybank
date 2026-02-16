import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAdminDb } from '@/lib/firebase-admin';
import { Calendar, Sparkles } from 'lucide-react';
import { getEventEmoji, getEventTypeLabel, formatDate } from '@/lib/types';

type PublicProfile = {
    fullName: string;
    uid: string;
    accountType?: string;
};

type UserEventSummary = {
    id: string;
    eventName: string;
    eventType: string;
    date: string;
    time: string;
};

const LOG_PREFIX = '[CreditKid /users/[slug]]';

/** Resolve user by profileSlug (name-based) or by uid for backward compatibility */
async function getPublicProfileBySlug(slug: string): Promise<PublicProfile | null> {
    const slugTrim = (slug || '').trim();
    console.log(`${LOG_PREFIX} getPublicProfileBySlug start`, {
        slug: slugTrim,
        slugLength: slugTrim.length,
        slugLower: slugTrim.toLowerCase(),
        is28Alnum: slugTrim.length === 28 && /^[a-zA-Z0-9]+$/.test(slugTrim),
    });

    try {
        const db = await getAdminDb();
        if (!slugTrim) {
            console.log(`${LOG_PREFIX} getPublicProfileBySlug: empty slug, returning null`);
            return null;
        }

        // 1) Try by profileSlug (exact match – Firestore is case-sensitive)
        let bySlug = await db.collection('users').where('profileSlug', '==', slugTrim).limit(1).get();
        console.log(`${LOG_PREFIX} query profileSlug==slugTrim`, { slug: slugTrim, empty: bySlug.empty, size: bySlug.size });

        if (bySlug.empty && slugTrim !== slugTrim.toLowerCase()) {
            const slugLower = slugTrim.toLowerCase();
            bySlug = await db.collection('users').where('profileSlug', '==', slugLower).limit(1).get();
            console.log(`${LOG_PREFIX} query profileSlug==slugLower (fallback)`, { slugLower, empty: bySlug.empty, size: bySlug.size });
        }

        if (!bySlug.empty) {
            const data = bySlug.docs[0].data();
            const docId = bySlug.docs[0].id;
            console.log(`${LOG_PREFIX} found by profileSlug`, { slug: slugTrim, docId, fullName: data?.fullName, hasProfileSlug: !!data?.profileSlug });
            return {
                fullName: data?.fullName ?? 'CreditKid Member',
                uid: docId,
                accountType: data?.accountType,
            };
        }

        // 3) Fallback: treat slug as uid (Firebase ids are 28 chars, alphanumeric) for old links
        if (slugTrim.length === 28 && /^[a-zA-Z0-9]+$/.test(slugTrim)) {
            const userDoc = await db.collection('users').doc(slugTrim).get();
            console.log(`${LOG_PREFIX} uid fallback doc.get`, { slug: slugTrim, exists: userDoc.exists });
            if (userDoc.exists) {
                const data = userDoc.data();
                console.log(`${LOG_PREFIX} found by uid fallback`, { slug: slugTrim, fullName: data?.fullName });
                return {
                    fullName: data?.fullName ?? 'CreditKid Member',
                    uid: slugTrim,
                    accountType: data?.accountType,
                };
            }
        }

        console.log(`${LOG_PREFIX} not found (no match)`, { slug: slugTrim });
        return null;
    } catch (err) {
        console.error(`${LOG_PREFIX} getPublicProfileBySlug error`, { slug: slugTrim, error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined });
        return null;
    }
}

/** Fetch events created by this user (for profile page listing). No orderBy to avoid requiring a composite index. */
async function getEventsByCreatorId(uid: string): Promise<UserEventSummary[]> {
    console.log(`${LOG_PREFIX} getEventsByCreatorId start`, { uid, uidLength: uid?.length });
    try {
        const db = await getAdminDb();
        const snapshot = await db
            .collection('events')
            .where('creatorId', '==', uid)
            .limit(10)
            .get();
        console.log(`${LOG_PREFIX} getEventsByCreatorId query done`, { uid, total: snapshot.size });
        if (snapshot.size > 0) {
            snapshot.docs.forEach((doc, i) => {
                const d = doc.data();
                console.log(`${LOG_PREFIX} getEventsByCreatorId doc[${i}]`, {
                    id: doc.id,
                    creatorId: d?.creatorId,
                    status: d?.status,
                    eventName: d?.eventName,
                });
            });
        }
        const events = snapshot.docs
            .filter((doc) => {
                const s = doc.data()?.status;
                return s === 'active' || s === undefined;
            })
            .map((doc) => {
                const d = doc.data();
                return {
                    id: doc.id,
                    eventName: d.eventName ?? 'Event',
                    eventType: d.eventType ?? 'other',
                    date: d.date ?? '',
                    time: d.time ?? '',
                };
            });
        events.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        const result = events.slice(0, 10);
        console.log(`${LOG_PREFIX} getEventsByCreatorId done`, { uid, total: snapshot.size, active: events.length, returning: result.length, eventIds: result.map((e) => e.id) });
        return result;
    } catch (err) {
        console.error(`${LOG_PREFIX} getEventsByCreatorId error`, { uid, error: err instanceof Error ? err.message : String(err) });
        return [];
    }
}

export async function generateMetadata({
    params,
}: {
    params: { slug: string };
}): Promise<Metadata> {
    const slug = typeof params.slug === 'string' ? params.slug : (params as { slug?: string }).slug ?? '';
    console.log(`${LOG_PREFIX} generateMetadata`, { slug });
    const profile = await getPublicProfileBySlug(slug);
    if (!profile) {
        console.log(`${LOG_PREFIX} generateMetadata: no profile, title=Not Found`);
        return { title: 'Not Found | CreditKid' };
    }
    return {
        title: `${profile.fullName} | CreditKid`,
        description: 'CreditKid member profile – personal event fundraising and allowance management.',
        robots: 'index, follow',
    };
}

export const revalidate = 300;

export default async function UserProfilePage({
    params,
}: {
    params: { slug: string };
}) {
    const slug = typeof params.slug === 'string' ? params.slug : (params as { slug?: string }).slug ?? '';
    console.log(`${LOG_PREFIX} UserProfilePage request`, { slug, timestamp: new Date().toISOString() });
    const profile = await getPublicProfileBySlug(slug);
    if (!profile) {
        console.log(`${LOG_PREFIX} UserProfilePage 404 notFound`, { slug });
        notFound();
    }
    console.log(`${LOG_PREFIX} UserProfilePage profile ok`, { slug, fullName: profile.fullName, uid: profile.uid });

    const events = await getEventsByCreatorId(profile.uid);
    console.log(`${LOG_PREFIX} UserProfilePage events loaded`, { slug, uid: profile.uid, eventsCount: events.length, eventIds: events.map((e) => e.id) });
    const theme = {
        gradient: 'from-violet-500 via-purple-600 to-fuchsia-600',
        glow: 'shadow-purple-500/50',
    };
    const initial = profile.fullName.charAt(0).toUpperCase();

    return (
        <main className="min-h-screen bg-[#F3F4F6]">
            {/* Hero Header – same style as event page */}
            <section className={`bg-gradient-to-br ${theme.gradient} pt-10 pb-20 px-6 relative overflow-hidden rounded-b-[40px]`}>
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-10 left-[10%] w-16 h-16 bg-white/10 rounded-full animate-pulse" />
                    <div className="absolute top-16 right-[15%] w-10 h-10 bg-white/15 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <div className="absolute top-32 left-[25%] w-8 h-8 bg-white/10 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-24 right-[25%] w-6 h-6 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                    <div className="absolute top-12 left-[8%] text-2xl opacity-30">✨</div>
                    <div className="absolute top-8 right-[12%] text-xl opacity-25">⭐</div>
                    <div className="absolute top-28 right-[8%] text-lg opacity-20">✨</div>
                </div>

                <div className="max-w-md mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full mb-5 border border-white/20">
                        <Sparkles size={14} className="text-white" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">CreditKid Member</span>
                        <Sparkles size={14} className="text-white" />
                    </div>

                    <div className={`w-24 h-24 mx-auto mb-5 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center shadow-2xl ${theme.glow} border-4 border-white/30`}>
                        <span className="text-4xl font-black text-white drop-shadow-lg">{initial}</span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight drop-shadow-lg">
                        {profile.fullName}
                    </h1>

                    <p className="text-white/80 text-sm font-medium">
                        Personal event fundraising & allowance for family celebrations
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <div className="px-4 pt-5 pb-8">
                <div className="max-w-md mx-auto space-y-4">
                    {/* No event yet card – same card style as event details */}
                    <div className="bg-white rounded-3xl shadow-xl p-6 space-y-5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#EDE9FE] flex items-center justify-center flex-shrink-0">
                                <Calendar size={22} className="text-[#8B5CF6]" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Events</p>
                                <p className="text-base font-bold text-gray-900">
                                    {events.length > 0 ? `${events.length} event${events.length === 1 ? '' : 's'}` : 'No event yet'}
                                </p>
                            </div>
                        </div>
                        {events.length > 0 ? (
                            <ul className="space-y-3">
                                {events.map((ev) => (
                                    <li key={ev.id}>
                                        <Link
                                            href={`/event/${ev.id}`}
                                            className="block rounded-2xl border border-gray-100 bg-gray-50/80 p-4 hover:bg-[#EDE9FE]/50 hover:border-[#8B5CF6]/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl" aria-hidden>{getEventEmoji(ev.eventType as 'birthday' | 'barMitzvah' | 'batMitzvah' | 'other')}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-900 truncate">{ev.eventName}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {ev.date ? formatDate(ev.date) : ''}{ev.time ? ` · ${ev.time}` : ''}
                                                    </p>
                                                </div>
                                                <span className="text-[#8B5CF6] font-semibold text-sm shrink-0">View →</span>
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    {profile.fullName} hasn't created an event yet. When they do, you'll be able to RSVP and send a gift straight to their CreditKid card.
                                </p>
                                <div className="pt-4 border-t border-gray-100">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Coming soon</p>
                                    <p className="text-sm text-gray-600">
                                        Create your first event in the CreditKid app to share your link and start receiving gifts.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Powered by CreditKid */}
                    <div className="bg-gradient-to-br from-purple-600 to-pink-500 rounded-3xl p-6 text-center">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                            <span className="text-3xl"></span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">
                            Powered by CreditKid
                        </h3>
                        <p className="text-white/80 text-sm mb-4">
                            The smart way to give and receive gifts. No more gift cards sitting in drawers!
                        </p>
                    </div>
                </div>
            </div>

            <footer className="py-6 px-4 text-center text-sm text-gray-500 border-t border-gray-200 bg-white">
                <p>© 2026 CreditKid. The end of gift cards is here! 🎉</p>
            </footer>
        </main>
    );
}
