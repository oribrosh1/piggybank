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
import { useRouter, useFocusEffect } from "expo-router";
import { Users, X, ChevronRight, UserCheck, DollarSign, UserX, BellOff } from "lucide-react-native";
import { getEvent } from "@/src/lib/eventService";
import { honoreeNameFromEvent } from "@/src/lib/eventTitle";
import { sendChildInvite } from "@/src/lib/api";
import { Event, Guest, GuestStatus } from "@/types/events";
import { routes } from "@/types/routes";
import {
    AIPosterGenerator,
    GuestManagementModal,
    ChildLinkCard,
    InvitationPreview,
    PayoutSetupBanner,
    type AIPosterGeneratorRef,
    type InvitationPreviewRef,
} from "@/src/components/events";
import {
    DashboardTopBar,
    EventPosterIntroLine,
    PosterHeroCard,
    LiveStatusBanner,
    QuickActionsGrid,
    InvolveChildCard,
    DetailsStack,
    GuestListSection,
    WhatsNextTip,
    PAGE_BG,
} from "@/src/components/events/eventDashboard/EventDashboardLayout";
import CelebrationToolsModal from "@/src/components/events/eventDashboard/CelebrationToolsModal";
import GuestStatsModal from "@/src/components/events/eventDashboard/GuestStatsModal";
import ReminderScheduleModal from "@/src/components/events/eventDashboard/ReminderScheduleModal";

export function EventDashboardScreen({ eventId }: { eventId: string }) {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const id = eventId;

    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [guestModalInitialFilter, setGuestModalInitialFilter] = useState<GuestStatus | null>(null);
    const [showGuestStatsModal, setShowGuestStatsModal] = useState(false);
    const [showFeaturesModal, setShowFeaturesModal] = useState(false);
    const [showNotificationsModal, setShowNotificationsModal] = useState(false);
    const [showReminderScheduleModal, setShowReminderScheduleModal] = useState(false);
    const [childLinkLoading, setChildLinkLoading] = useState(false);
    const [childLinkOpen, setChildLinkOpen] = useState(false);
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

    useFocusEffect(
        useCallback(() => {
            loadEvent();
        }, [eventId])
    );

    const loadEvent = async () => {
        if (!eventId) return;
        setLoading(true);
        const eventData = await getEvent(eventId);
        setEvent(eventData);
        setLoading(false);
    };

    const handleSendInvites = (selectedGuests: Guest[]) => {
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

    const handleSendChildInvite = useCallback(async (childPhone: string, childName: string) => {
        if (!id) return;
        setChildLinkLoading(true);
        try {
            const res = await sendChildInvite(id, childPhone, childName);
            if (res.smsSkipped && res.devInviteLink && res.devPin) {
                Alert.alert(
                    "Invite created (test mode)",
                    `Twilio is not configured — SMS was not sent.\n\nLink:\n${res.devInviteLink}\n\nPIN: ${res.devPin}`,
                    [{ text: "OK" }]
                );
            } else {
                Alert.alert(
                    "SMS Sent!",
                    `We sent ${childName} an SMS with a download link and PIN code. They'll be able to see their gifts once they install the app.`,
                    [{ text: "Great!" }]
                );
            }
            setChildLinkOpen(false);
        } catch (err: unknown) {
            const e = err as { response?: { status?: number; data?: { error?: string } }; message?: string };
            const status = e?.response?.status;
            const serverMessage = e?.response?.data?.error;
            const message =
                status === 404
                    ? "This feature isn't available yet. Deploy the latest Cloud Functions, then try again."
                    : serverMessage || e?.message || "Could not send SMS.";
            Alert.alert("Error", message);
        } finally {
            setChildLinkLoading(false);
        }
    }, [eventId]);

    const handleEditEvent = () => {
        if (id) {
            router.push(routes.editEvent(id));
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: PAGE_BG, alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator size="large" color="#6B4EFF" />
                <Text style={{ marginTop: 16, fontSize: 16, color: "#6B7280" }}>Loading event...</Text>
            </View>
        );
    }

    if (!event) {
        return (
            <View style={{ flex: 1, backgroundColor: PAGE_BG, alignItems: "center", justifyContent: "center", padding: 24 }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>😕</Text>
                <Text style={{ fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 8 }}>Event Not Found</Text>
                <Text style={{ fontSize: 15, color: "#6B7280", textAlign: "center", marginBottom: 24 }}>
                    We couldn't find this event. It may have been deleted.
                </Text>
                <TouchableOpacity
                    onPress={() => router.push(routes.tabs.myEvent)}
                    style={{
                        backgroundColor: "#6B4EFF",
                        borderRadius: 16,
                        paddingVertical: 14,
                        paddingHorizontal: 24,
                    }}
                >
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>Go to My Event</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const childFirst = honoreeNameFromEvent(event);

    return (
        <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
            <ScrollView
                style={{ flex: 1, marginBottom: 20 }}
                contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
                showsVerticalScrollIndicator={false}
            >
                <DashboardTopBar
                    topInset={insets.top}
                    event={event}
                    onBell={() => setShowNotificationsModal(true)}
                    hasNotificationDot={notifications.length > 0}
                />

                <EventPosterIntroLine event={event} />

                <PosterHeroCard event={event} onGeneratePoster={() => posterRef.current?.open()} />

                <QuickActionsGrid
                    onSetReminderSchedule={() => setShowReminderScheduleModal(true)}
                    onAddGuests={handleAddGuests}
                    onShare={handleShare}
                    onStats={() => setShowGuestStatsModal(true)}
                    onFeatures={() => setShowFeaturesModal(true)}
                    onAlerts={() => setShowNotificationsModal(true)}
                    showAlertDot={notifications.length > 0}
                />

                <LiveStatusBanner />

                <PayoutSetupBanner event={event} />

                <InvolveChildCard
                    name={childFirst}
                    onLinkAccount={() => setChildLinkOpen(true)}
                    loading={childLinkLoading}
                />

                <ChildLinkCard
                    visible={childLinkOpen}
                    onClose={() => setChildLinkOpen(false)}
                    onSendInvite={handleSendChildInvite}
                    loading={childLinkLoading}
                    delay={0}
                />

                <View style={{ marginTop: 16 }}>
                    <DetailsStack event={event} onEditEvent={handleEditEvent} />
                </View>

                <View style={{ marginTop: 16 }}>
                    <GuestListSection event={event} onViewAll={handleManageGuests} />
                </View>

                <WhatsNextTip />

                <AIPosterGenerator
                    ref={posterRef}
                    event={event}
                    delay={0}
                    hideTrigger
                    onPosterGenerated={() => loadEvent()}
                />
                <InvitationPreview ref={previewRef} event={event} delay={0} hideTrigger />
            </ScrollView>

            <View
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    paddingHorizontal: 24,
                    paddingTop: 16,
                    paddingBottom: 10 ,
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
                        backgroundColor: "#6B4EFF",
                        borderRadius: 18,
                        paddingVertical: 18,
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                        shadowColor: "#6B4EFF",
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
                    {event.guests.filter((g) => g.status === "added").length > 0 && (
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
                                {event.guests.filter((g) => g.status === "added").length} new
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <GuestManagementModal
                visible={showGuestModal}
                onClose={() => {
                    setShowGuestModal(false);
                    setGuestModalInitialFilter(null);
                }}
                event={event}
                onSendInvites={handleSendInvites}
                initialFilter={
                    guestModalInitialFilter as
                        | "added"
                        | "invited"
                        | "confirmed"
                        | "paid"
                        | "invalid_phone"
                        | undefined
                }
                onAddGuest={handleAddGuests}
            />

            <GuestStatsModal
                visible={showGuestStatsModal && !!event}
                onClose={closeGuestStats}
                bottomInset={insets.bottom}
                event={event}
                onViewFullGuestList={() => {
                    closeGuestStats();
                    setGuestModalInitialFilter(null);
                    setShowGuestModal(true);
                }}
                onFixInvalidPhones={() => {
                    closeGuestStats();
                    setGuestModalInitialFilter("invalid_phone");
                    setShowGuestModal(true);
                }}
                onSendRemindersToPending={() => {
                    closeGuestStats();
                    setShowNotificationsModal(true);
                }}
            />

            <ReminderScheduleModal
                visible={showReminderScheduleModal}
                onClose={() => setShowReminderScheduleModal(false)}
                onSave={() => {
                    /* Persist reminder slots to event doc when backend field exists */
                }}
            />

            <CelebrationToolsModal
                visible={showFeaturesModal}
                onClose={closeFeatures}
                bottomInset={insets.bottom}
                onOpenGuestList={() => setShowGuestModal(true)}
                onOpenPoster={() => posterRef.current?.open()}
                onPreviewInvitation={() => previewRef.current?.open()}
                onOpenReminderSchedule={() => setShowReminderScheduleModal(true)}
            />

            <Modal
                visible={showNotificationsModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={closeNotifications}
            >
                <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FFFFFF", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
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
                            showsVerticalScrollIndicator
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
                                                    &ldquo;{notif.blessing}&rdquo;
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
