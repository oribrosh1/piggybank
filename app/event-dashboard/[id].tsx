import React, { useState, useCallback, useRef, useMemo } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Share,
    Platform,
    Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Users, X, TrendingUp, ChevronRight, MessageSquare, Gift, Share2, Link, BarChart3, Bell, Sparkles, UserPlus, Zap, Radio, Clock, Eye, UserCheck, DollarSign, UserX, BellOff } from "lucide-react-native";
import { getEvent } from "@/src/lib/eventService";
import { getChildInviteLink } from "@/src/lib/api";
import { Event, Guest, GuestStatus } from "@/types/events";
import { routes } from "@/types/routes";
import {
    EventHeader,
    SuccessMessage,
    QuickActions,
    ChildLinkCard,
    EventDetailsCard,
    PartyDetailsCard,
    DietaryInfoCard,
    GuestListCard,
    GuestStatsCard,
    TipCard,
    InvitationPreview,
    AIPosterGenerator,
    GuestManagementModal,
    type AIPosterGeneratorRef,
    type InvitationPreviewRef,
} from "@/src/components/events";

export default function EventDashboard() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [guestModalInitialFilter, setGuestModalInitialFilter] = useState<GuestStatus | null>(null);
    const [showGuestStatsModal, setShowGuestStatsModal] = useState(false);
    const [showFeaturesModal, setShowFeaturesModal] = useState(false);
    const [showNotificationsModal, setShowNotificationsModal] = useState(false);
    const [childLinkLoading, setChildLinkLoading] = useState(false);
    const posterRef = useRef<AIPosterGeneratorRef | null>(null);
    const previewRef = useRef<InvitationPreviewRef | null>(null);

    const closeGuestStats = useCallback(() => {
        setShowGuestStatsModal(false);
    }, []);
    const closeFeatures = useCallback(() => {
        setShowFeaturesModal(false);
    }, []);
    const closeNotifications = useCallback(() => {
        setShowNotificationsModal(false);
    }, []);

    const notifications = useMemo(() => {
        if (!event) return [];
        type NotifItem = { id: string; type: "rsvp" | "gift" | "declined"; name: string; date: Date; amount?: number; blessing?: string };
        const items: NotifItem[] = [];
        for (const g of event.guests) {
            if (g.status === "paid" && g.paidAt) {
                items.push({ id: `${g.id}-paid`, type: "gift", name: g.name, date: g.paidAt instanceof Date ? g.paidAt : new Date(g.paidAt), amount: g.paymentAmount, blessing: g.blessing });
            }
            if ((g.status === "confirmed" || g.status === "paid") && g.confirmedAt) {
                items.push({ id: `${g.id}-rsvp`, type: "rsvp", name: g.name, date: g.confirmedAt instanceof Date ? g.confirmedAt : new Date(g.confirmedAt) });
            }
            if (g.status === "declined" && g.confirmedAt) {
                items.push({ id: `${g.id}-declined`, type: "declined", name: g.name, date: g.confirmedAt instanceof Date ? g.confirmedAt : new Date(g.confirmedAt) });
            }
        }
        items.sort((a, b) => b.date.getTime() - a.date.getTime());
        return items;
    }, [event]);

    // Reload event data when screen comes into focus (after edit/add guests)
    useFocusEffect(
        useCallback(() => {
            loadEvent();
        }, [id])
    );

    const loadEvent = async () => {
        if (!id) return;
        setLoading(true);
        const eventData = await getEvent(id);
        setEvent(eventData);
        setLoading(false);
    };

    const handleSendInvites = (selectedGuests: Guest[]) => {
        // TODO: Implement actual SMS sending via Twilio or similar service
        Alert.alert(
            "Invitations Sent! 🎉",
            `Successfully sent invitations to ${selectedGuests.length} guest${selectedGuests.length > 1 ? "s" : ""}. They will receive an SMS with the event details and RSVP link.`,
            [{ text: "Great!", onPress: () => loadEvent() }]
        );
    };

    const handleManageGuests = () => {
        setShowGuestModal(true);
    };

    const handleAddGuests = () => {
        if (id) {
            router.push(routes.addGuests(id));
        }
    };

    const EVENT_WEB_BASE = process.env.EXPO_PUBLIC_WEBSITE_URL || "https://creditkid.vercel.app";
    const eventLoginUrl = id ? `${EVENT_WEB_BASE}/event/${id}` : "";

    const handleShare = () => {
        const appMessage =
            "CreditKid – The gift card kids actually use.\nCreate events, invite guests, and receive gifts straight to your child's card. Download the app or visit: " +
            EVENT_WEB_BASE;
        Share.share({
            message: appMessage,
            title: "CreditKid – Gifts for kids, made simple",
            url: Platform.OS === "ios" ? EVENT_WEB_BASE : undefined,
        });
    };

    const handleSendChildLink = useCallback(async () => {
        if (!id) return;
        setChildLinkLoading(true);
        try {
            const { link } = await getChildInviteLink(id);
            await Share.share({
                message: `Open this link to see your CreditKid balance and gifts: ${link}`,
                title: "CreditKid – Your balance & gifts",
                url: Platform.OS === "ios" ? link : undefined,
            });
        } catch (err: any) {
            const status = err?.response?.status;
            const serverMessage = err?.response?.data?.error;
            const message =
                status === 404
                    ? "Child link isn't available yet. Deploy the latest Cloud Functions (run in project root: firebase deploy --only functions), then try again."
                    : serverMessage || err?.message || "Could not create link.";
            Alert.alert("Error", message);
        } finally {
            setChildLinkLoading(false);
        }
    }, [id]);

    const handleEditEvent = () => {
        if (id) {
            router.push(routes.editEvent(id));
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: "#F9FAFB", alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={{ marginTop: 16, fontSize: 16, color: "#6B7280" }}>Loading event...</Text>
            </View>
        );
    }

    if (!event) {
        return (
            <View style={{ flex: 1, backgroundColor: "#F9FAFB", alignItems: "center", justifyContent: "center", padding: 24 }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>😕</Text>
                <Text style={{ fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 8 }}>Event Not Found</Text>
                <Text style={{ fontSize: 15, color: "#6B7280", textAlign: "center", marginBottom: 24 }}>
                    We couldn't find this event. It may have been deleted.
                </Text>
                <TouchableOpacity
                    onPress={() => router.push(routes.tabs.myEvents)}
                    style={{
                        backgroundColor: "#8B5CF6",
                        borderRadius: 16,
                        paddingVertical: 14,
                        paddingHorizontal: 24,
                    }}
                >
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>Go to My Events</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
            <ScrollView
                style={{ flex: 1, marginBottom: 20 }}
                contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <EventHeader event={event} topInset={insets.top} />

                {/* Success Message */}
                <SuccessMessage delay={100} />

                {/* Quick Actions */}
                <QuickActions
                    delay={200}
                    onSendInvites={handleManageGuests}
                    onAddGuests={handleAddGuests}
                    onShare={handleShare}
                    onSendChildLink={handleSendChildLink}
                    childLinkLoading={childLinkLoading}
                    onEditEvent={handleEditEvent}
                    onViewGuestStats={() => setShowGuestStatsModal(true)}
                    onOpenFeatures={() => setShowFeaturesModal(true)}
                    onOpenNotifications={() => setShowNotificationsModal(true)}
                />

                {/* Child link – send personal link to child */}
                <ChildLinkCard
                    delay={280}
                    onSendLink={handleSendChildLink}
                    loading={childLinkLoading}
                />

                {/* Event Details Card */}
                <EventDetailsCard
                    event={event}
                    delay={300}
                    onEdit={handleEditEvent}
                />

                {/* Party Details Card */}
                <PartyDetailsCard event={event} delay={400} />

                {/* Dietary Info Card */}
                <DietaryInfoCard event={event} delay={500} />

                {/* Guest Stats Card */}
                <GuestStatsCard
                    event={event}
                    delay={550}
                    onViewAll={handleManageGuests}
                    onViewSegment={(segment) => {
                        setGuestModalInitialFilter(segment);
                        setShowGuestModal(true);
                    }}
                />

                {/* Guest List Card */}
                <GuestListCard
                    event={event}
                    delay={650}
                    onAddGuest={handleAddGuests}
                />

                {/* AI Poster Generator */}
                <AIPosterGenerator
                    ref={posterRef}
                    event={event}
                    delay={750}
                    onPosterGenerated={() => loadEvent()}
                />

                {/* Invitation Preview */}
                <InvitationPreview ref={previewRef} event={event} delay={850} />

                {/* Tip Card */}
                <TipCard
                    title="What's next?"
                    message="Send invites to your guests via SMS. They'll receive all the event details and can RSVP instantly!"
                    delay={950}
                />
            </ScrollView>

            {/* Bottom Action Button - Manage Guests */}
            <View
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    paddingHorizontal: 24,
                    paddingTop: 16,
                    paddingBottom: insets.bottom + 16,
                    backgroundColor: "#FFFFFF",
                    borderTopWidth: 1,
                    borderTopColor: "#E5E7EB",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -6 },
                    shadowOpacity: 0.1,
                    shadowRadius: 16,
                    elevation: 12,
                }}
            >
                <TouchableOpacity
                    onPress={handleManageGuests}
                    style={{
                        backgroundColor: "#8B5CF6",
                        borderRadius: 18,
                        paddingVertical: 18,
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                        shadowColor: "#8B5CF6",
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.35,
                        shadowRadius: 16,
                        elevation: 8,
                    }}
                >
                    <Users size={20} color="#FFFFFF" strokeWidth={2.5} />
                    <Text style={{ fontSize: 17, fontWeight: "800", color: "#FFFFFF", marginLeft: 10 }}>
                        Manage & Track Guest List
                    </Text>
                    {event.guests.filter(g => g.status === 'added').length > 0 && (
                        <View
                            style={{
                                backgroundColor: "#FEF3C7",
                                borderRadius: 10,
                                paddingVertical: 4,
                                paddingHorizontal: 8,
                                marginLeft: 10,
                            }}
                        >
                            <Text style={{ fontSize: 11, fontWeight: "700", color: "#D97706" }}>
                                {event.guests.filter(g => g.status === 'added').length} new
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Guest Management Modal */}
            <GuestManagementModal
                visible={showGuestModal}
                onClose={() => {
                    setShowGuestModal(false);
                    setGuestModalInitialFilter(null);
                }}
                event={event}
                onSendInvites={handleSendInvites}
                initialFilter={guestModalInitialFilter as "added" | "invited" | "confirmed" | "paid" | undefined}
                onAddGuest={handleAddGuests}
            />

            {/* Guest Stats – page sheet (same pattern as Guest List modal) */}
            <Modal
                visible={showGuestStatsModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={closeGuestStats}
            >
                <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
                    {/* Header */}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FFFFFF", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}>
                        <Text style={{ fontSize: 20, fontWeight: "800", color: "#111827" }}>Guest stats</Text>
                        <TouchableOpacity
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            onPress={closeGuestStats}
                            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" }}
                        >
                            <X size={18} color="#374151" strokeWidth={2} />
                        </TouchableOpacity>
                    </View>

                    {event && (
                        <>
                        {/* Scrollable content */}
                        <ScrollView
                            style={{ flex: 1 }}
                            contentContainerStyle={{ padding: 20, paddingBottom: Math.max(24, insets.bottom + 100) }}
                            showsVerticalScrollIndicator={true}
                        >
                            {/* Hero stats – two cards */}
                            <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
                                <View
                                    style={{
                                        flex: 1,
                                        backgroundColor: "#F5F3FF",
                                        borderRadius: 16,
                                        paddingVertical: 18,
                                        paddingHorizontal: 16,
                                        alignItems: "center",
                                        borderWidth: 1,
                                        borderColor: "#EDE9FE",
                                    }}
                                >
                                    <Text style={{ fontSize: 32, fontWeight: "900", color: "#7C3AED", letterSpacing: -0.5 }}>
                                        {event.guestStats?.total ?? 0}
                                    </Text>
                                    <Text style={{ fontSize: 12, fontWeight: "700", color: "#6D28D9", marginTop: 4, letterSpacing: 0.5 }}>
                                        TOTAL GUESTS
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        flex: 1,
                                        backgroundColor: "#ECFDF5",
                                        borderRadius: 16,
                                        paddingVertical: 18,
                                        paddingHorizontal: 16,
                                        alignItems: "center",
                                        borderWidth: 1,
                                        borderColor: "#D1FAE5",
                                    }}
                                >
                                    <Text style={{ fontSize: 32, fontWeight: "900", color: "#059669", letterSpacing: -0.5 }}>
                                        {(event.guestStats?.total ?? 0) > 0
                                            ? Math.round(
                                                  ((event.guestStats?.confirmed ?? 0) + (event.guestStats?.paid ?? 0)) /
                                                      (event.guestStats?.total ?? 1) *
                                                  100
                                              )
                                            : 0}
                                        %
                                    </Text>
                                    <Text style={{ fontSize: 12, fontWeight: "700", color: "#047857", marginTop: 4, letterSpacing: 0.5 }}>
                                        RSVP RATE
                                    </Text>
                                </View>
                            </View>

                            {/* Status breakdown */}
                            <Text style={{ fontSize: 11, fontWeight: "800", color: "#9CA3AF", marginBottom: 10, letterSpacing: 0.8 }}>
                                BREAKDOWN
                            </Text>
                            <View style={{ gap: 10 }}>
                                {[
                                    { label: "Invited", value: event.guestStats?.invited ?? 0, emoji: "📤", color: "#1D4ED8", bg: "#DBEAFE" },
                                    { label: "Not invited", value: event.guestStats?.added ?? 0, emoji: "⏳", color: "#B91C1C", bg: "#FEE2E2" },
                                    { label: "Coming", value: event.guestStats?.confirmed ?? 0, emoji: "🎉", color: "#047857", bg: "#D1FAE5" },
                                    { label: "Gifted", value: event.guestStats?.paid ?? 0, emoji: "🎁", color: "#0F766E", bg: "#CCFBF1" },
                                    { label: "Invalid number", value: event.guestStats?.invalidNumber ?? 0, emoji: "📵", color: "#B45309", bg: "#FEF3C7" },
                                    { label: "Not coming", value: event.guestStats?.notComing ?? 0, emoji: "🙁", color: "#475569", bg: "#F1F5F9" },
                                ].map(({ label, value, emoji, color, bg }) => (
                                    <View
                                        key={label}
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            paddingVertical: 12,
                                            paddingHorizontal: 14,
                                            backgroundColor: bg,
                                            borderRadius: 14,
                                            borderLeftWidth: 4,
                                            borderLeftColor: color,
                                        }}
                                    >
                                        <Text style={{ fontSize: 20 }}>{emoji}</Text>
                                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#374151", marginLeft: 12, flex: 1 }}>
                                            {label}
                                        </Text>
                                        <Text style={{ fontSize: 18, fontWeight: "800", color }}>{value}</Text>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>

                        {/* Sticky bottom button */}
                        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: Math.max(16, insets.bottom), backgroundColor: "#FFFFFF", borderTopWidth: 1, borderTopColor: "#E5E7EB" }}>
                            <TouchableOpacity
                                onPress={() => {
                                    closeGuestStats();
                                    setShowGuestModal(true);
                                }}
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    paddingVertical: 14,
                                    borderRadius: 14,
                                    backgroundColor: "#8B5CF6",
                                }}
                            >
                                <Users size={20} color="#FFFFFF" strokeWidth={2.5} />
                                <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF", marginLeft: 10 }}>
                                    View full guest list
                                </Text>
                                <ChevronRight size={20} color="#FFFFFF" strokeWidth={2.5} style={{ marginLeft: 4 }} />
                            </TouchableOpacity>
                        </View>
                        </>
                    )}
                </View>
            </Modal>

            {/* Features – page sheet (same pattern as Guest List modal) */}
            <Modal
                visible={showFeaturesModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={closeFeatures}
            >
                <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
                    {/* Header */}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FFFFFF", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}>
                        <Text style={{ fontSize: 20, fontWeight: "800", color: "#111827" }}>Features</Text>
                        <TouchableOpacity
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            onPress={closeFeatures}
                            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" }}
                        >
                            <X size={18} color="#374151" strokeWidth={2} />
                        </TouchableOpacity>
                    </View>

                    {/* Scrollable content */}
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={{ padding: 20, paddingBottom: Math.max(24, insets.bottom + 100) }}
                        showsVerticalScrollIndicator={true}
                    >
                        <Text style={{ fontSize: 14, color: "#6D28D9", fontWeight: "600", marginBottom: 20 }}>
                            Everything you can do with your event
                        </Text>

                        {[
                            { icon: Radio, title: "Realtime RSVP", desc: "See who's coming as it happens. Guest confirmations and declines update instantly so you're always in the loop.", color: "#059669", bg: "#D1FAE5", actionable: true, onPress: () => { closeFeatures(); setTimeout(() => setShowGuestModal(true), 350); } },
                            { icon: Clock, title: "Scheduled messages", desc: "Schedule invite reminders and follow-ups to go out at the right time. Set it once and let the app handle the rest.", color: "#2563EB", bg: "#DBEAFE", actionable: true, onPress: () => { closeFeatures(); setTimeout(() => setShowNotificationsModal(true), 350); } },
                            { icon: Sparkles, title: "Generate AI poster", desc: "Create a custom event poster with AI. Describe your theme and get a unique design to share with guests.", color: "#A855F7", bg: "#F3E8FF", actionable: true, onPress: () => { closeFeatures(); setTimeout(() => posterRef.current?.open(), 350); } },
                            { icon: Eye, title: "Preview invitation", desc: "See exactly what your guests will get before you send. Preview the invitation and RSVP experience.", color: "#8B5CF6", bg: "#EDE9FE", actionable: true, onPress: () => { closeFeatures(); setTimeout(() => previewRef.current?.open(), 350); } },
                        ].map((item) => {
                            const Icon = item.icon;
                            const Wrapper = item.actionable ? TouchableOpacity : View;
                            return (
                                <Wrapper
                                    key={item.title}
                                    {...(item.actionable ? { onPress: item.onPress, activeOpacity: 0.7 } : {})}
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "flex-start",
                                        marginBottom: 16,
                                        backgroundColor: item.bg,
                                        borderRadius: 18,
                                        padding: 16,
                                        borderWidth: 1,
                                        borderColor: "rgba(0,0,0,0.04)",
                                    }}
                                >
                                    <View
                                        style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 14,
                                            backgroundColor: "#FFFFFF",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            shadowColor: "#000",
                                            shadowOffset: { width: 0, height: 1 },
                                            shadowOpacity: 0.06,
                                            shadowRadius: 4,
                                            elevation: 2,
                                        }}
                                    >
                                        <Icon size={22} color={item.color} strokeWidth={2.2} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 14 }}>
                                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                            <Text style={{ fontSize: 16, fontWeight: "800", color: "#1F2937", marginBottom: 4 }}>
                                                {item.title}
                                            </Text>
                                            {item.actionable && <ChevronRight size={16} color={item.color} strokeWidth={2.5} />}
                                        </View>
                                        <Text style={{ fontSize: 13, fontWeight: "500", color: "#6B7280", lineHeight: 19 }}>
                                            {item.desc}
                                        </Text>
                                    </View>
                                </Wrapper>
                            );
                        })}
                    </ScrollView>

                    {/* Sticky bottom button */}
                    <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: Math.max(16, insets.bottom), backgroundColor: "#FFFFFF", borderTopWidth: 1, borderTopColor: "#E5E7EB" }}>
                        <TouchableOpacity
                            onPress={closeFeatures}
                            style={{
                                paddingVertical: 14,
                                borderRadius: 14,
                                backgroundColor: "#8B5CF6",
                                alignItems: "center",
                            }}
                        >
                            <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>Got it</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Notifications – page sheet */}
            <Modal
                visible={showNotificationsModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={closeNotifications}
            >
                <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
                    {/* Header */}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FFFFFF", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Bell size={20} color="#8B5CF6" strokeWidth={2} />
                            <Text style={{ fontSize: 20, fontWeight: "800", color: "#111827", marginLeft: 10 }}>Notifications</Text>
                        </View>
                        <TouchableOpacity
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            onPress={closeNotifications}
                            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" }}
                        >
                            <X size={18} color="#374151" strokeWidth={2} />
                        </TouchableOpacity>
                    </View>

                    {notifications.length === 0 ? (
                        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}>
                            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                                <BellOff size={32} color="#D1D5DB" strokeWidth={1.5} />
                            </View>
                            <Text style={{ fontSize: 18, fontWeight: "800", color: "#374151", textAlign: "center", marginBottom: 8 }}>
                                No activity yet
                            </Text>
                            <Text style={{ fontSize: 14, fontWeight: "500", color: "#9CA3AF", textAlign: "center", lineHeight: 20 }}>
                                When guests RSVP or send gifts, you'll see it here in real time.
                            </Text>
                        </View>
                    ) : (
                        <ScrollView
                            style={{ flex: 1 }}
                            contentContainerStyle={{ padding: 20, paddingBottom: Math.max(24, insets.bottom + 40) }}
                            showsVerticalScrollIndicator={true}
                        >
                            <Text style={{ fontSize: 11, fontWeight: "800", color: "#9CA3AF", marginBottom: 14, letterSpacing: 0.8 }}>
                                RECENT ACTIVITY
                            </Text>

                            {notifications.map((notif, idx) => {
                                const isGift = notif.type === "gift";
                                const isDeclined = notif.type === "declined";

                                const icon = isGift ? DollarSign : isDeclined ? UserX : UserCheck;
                                const Icon = icon;
                                const iconColor = isGift ? "#0F766E" : isDeclined ? "#DC2626" : "#059669";
                                const iconBg = isGift ? "#CCFBF1" : isDeclined ? "#FEE2E2" : "#D1FAE5";

                                const title = isGift
                                    ? `${notif.name} sent a gift`
                                    : isDeclined
                                    ? `${notif.name} can't make it`
                                    : `${notif.name} is coming!`;

                                const timeAgo = formatTimeAgo(notif.date);

                                return (
                                    <View
                                        key={notif.id}
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "flex-start",
                                            marginBottom: idx === notifications.length - 1 ? 0 : 4,
                                            paddingVertical: 14,
                                            paddingHorizontal: 14,
                                            backgroundColor: "#FFFFFF",
                                            borderRadius: 16,
                                            borderWidth: 1,
                                            borderColor: "#F3F4F6",
                                            shadowColor: "#000",
                                            shadowOffset: { width: 0, height: 1 },
                                            shadowOpacity: 0.03,
                                            shadowRadius: 3,
                                            elevation: 1,
                                            ...(idx < notifications.length - 1 ? { marginBottom: 10 } : {}),
                                        }}
                                    >
                                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: iconBg, alignItems: "center", justifyContent: "center" }}>
                                            <Icon size={18} color={iconColor} strokeWidth={2.2} />
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={{ fontSize: 15, fontWeight: "700", color: "#1F2937" }}>
                                                {title}
                                            </Text>
                                            {isGift && notif.amount != null && notif.amount > 0 && (
                                                <Text style={{ fontSize: 14, fontWeight: "800", color: "#0F766E", marginTop: 2 }}>
                                                    ${(notif.amount / 100).toFixed(0)}
                                                </Text>
                                            )}
                                            {isGift && notif.blessing ? (
                                                <Text style={{ fontSize: 13, fontWeight: "500", color: "#6B7280", marginTop: 4, fontStyle: "italic", lineHeight: 18 }} numberOfLines={3}>
                                                    "{notif.blessing}"
                                                </Text>
                                            ) : null}
                                            <Text style={{ fontSize: 12, fontWeight: "500", color: "#9CA3AF", marginTop: 4 }}>
                                                {timeAgo}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    )}
                </View>
            </Modal>
        </View>
    );
}

function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay === 1) return "Yesterday";
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
