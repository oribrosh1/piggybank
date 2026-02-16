import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Share,
    Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Users } from "lucide-react-native";
import { getEvent } from "../../src/lib/eventService";
import { getChildInviteLink } from "../../src/lib/api";
import { Event, Guest } from "../../types/events";
import { routes } from "../../types/routes";
import {
    EventHeader,
    SuccessMessage,
    QuickActions,
    EventDetailsCard,
    PartyDetailsCard,
    DietaryInfoCard,
    GuestListCard,
    GuestStatsCard,
    TipCard,
    InvitationPreview,
    AIPosterGenerator,
    GuestManagementModal,
} from "../components/event-dashboard";

export default function EventDashboard() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [childLinkLoading, setChildLinkLoading] = useState(false);

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

    const handleShare = () => {
        // TODO: Implement share functionality
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
            Alert.alert("Error", err?.response?.data?.error || err?.message || "Could not create link.");
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
                />

                {/* Guest List Card */}
                <GuestListCard
                    event={event}
                    delay={650}
                    onAddGuest={handleAddGuests}
                />

                {/* AI Poster Generator */}
                <AIPosterGenerator
                    event={event}
                    delay={750}
                    onPosterGenerated={() => loadEvent()}
                />

                {/* Invitation Preview */}
                <InvitationPreview event={event} delay={850} />

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
                onClose={() => setShowGuestModal(false)}
                event={event}
                onSendInvites={handleSendInvites}
            />
        </View>
    );
}
