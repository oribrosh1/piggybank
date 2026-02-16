import React, { useState, useMemo } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
    TextInput,
    Alert,
} from "react-native";
import {
    X,
    Search,
    Users,
    CheckCircle,
    Circle,
    Filter,
    MessageSquare,
    UserCheck,
    Clock,
    DollarSign,
    UserPlus,
    ChevronDown,
    Send,
    CheckSquare,
    Square,
} from "lucide-react-native";
import { Event, Guest, GuestStatus } from "@/types/events";

interface GuestManagementModalProps {
    visible: boolean;
    onClose: () => void;
    event: Event;
    onSendInvites?: (selectedGuests: Guest[]) => void;
}

type SortOption = "all" | "added" | "invited" | "confirmed" | "paid";

const STATUS_CONFIG: Record<GuestStatus, { bg: string; color: string; label: string; icon: any }> = {
    added: { bg: "#F3F4F6", color: "#6B7280", label: "Added", icon: UserPlus },
    invited: { bg: "#DBEAFE", color: "#1D4ED8", label: "Invited", icon: Clock },
    confirmed: { bg: "#D1FAE5", color: "#059669", label: "Confirmed", icon: UserCheck },
    paid: { bg: "#FEF3C7", color: "#D97706", label: "Paid", icon: DollarSign },
};

export default function GuestManagementModal({
    visible,
    onClose,
    event,
    onSendInvites,
}: GuestManagementModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>("all");
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());

    // Filter and sort guests
    const filteredGuests = useMemo(() => {
        let guests = [...event.guests];

        // Filter by search query
        if (searchQuery) {
            guests = guests.filter(
                (g) =>
                    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    g.phone.includes(searchQuery)
            );
        }

        // Filter by status
        if (sortBy !== "all") {
            guests = guests.filter((g) => g.status === sortBy);
        }

        // Sort by status priority: added -> invited -> confirmed -> paid
        const statusOrder: Record<GuestStatus, number> = {
            added: 0,
            invited: 1,
            confirmed: 2,
            paid: 3,
        };
        guests.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

        return guests;
    }, [event.guests, searchQuery, sortBy]);

    // Get counts by status
    const statusCounts = useMemo(() => {
        return {
            all: event.guests.length,
            added: event.guests.filter((g) => g.status === "added").length,
            invited: event.guests.filter((g) => g.status === "invited").length,
            confirmed: event.guests.filter((g) => g.status === "confirmed").length,
            paid: event.guests.filter((g) => g.status === "paid").length,
        };
    }, [event.guests]);

    // Get uninvited guests (status === 'added')
    const uninvitedGuests = useMemo(() => {
        return event.guests.filter((g) => g.status === "added");
    }, [event.guests]);

    const toggleGuestSelection = (guestId: string) => {
        const newSelected = new Set(selectedGuests);
        if (newSelected.has(guestId)) {
            newSelected.delete(guestId);
        } else {
            newSelected.add(guestId);
        }
        setSelectedGuests(newSelected);
    };

    const selectAll = () => {
        const allIds = filteredGuests.map((g) => g.id);
        setSelectedGuests(new Set(allIds));
    };

    const selectAllUninvited = () => {
        const uninvitedIds = uninvitedGuests.map((g) => g.id);
        setSelectedGuests(new Set(uninvitedIds));
    };

    const clearSelection = () => {
        setSelectedGuests(new Set());
    };

    const handleSendInvites = () => {
        const guestsToInvite = event.guests.filter((g) => selectedGuests.has(g.id));
        if (guestsToInvite.length === 0) {
            Alert.alert("No Guests Selected", "Please select at least one guest to invite.");
            return;
        }

        Alert.alert(
            "Send Invitations",
            `Send SMS invitations to ${guestsToInvite.length} guest${guestsToInvite.length > 1 ? "s" : ""}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Send",
                    onPress: () => {
                        onSendInvites?.(guestsToInvite);
                        setSelectionMode(false);
                        setSelectedGuests(new Set());
                    },
                },
            ]
        );
    };

    const enterSelectionMode = () => {
        setSelectionMode(true);
        // Pre-select all uninvited guests
        selectAllUninvited();
    };

    const exitSelectionMode = () => {
        setSelectionMode(false);
        setSelectedGuests(new Set());
    };

    const getSortLabel = (option: SortOption) => {
        switch (option) {
            case "all": return "All Guests";
            case "added": return "Not Invited";
            case "invited": return "Invited";
            case "confirmed": return "Confirmed";
            case "paid": return "Paid";
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
                {/* Header */}
                <View
                    style={{
                        backgroundColor: "#FFFFFF",
                        paddingHorizontal: 20,
                        paddingTop: 16,
                        paddingBottom: 16,
                        borderBottomWidth: 1,
                        borderBottomColor: "#E5E7EB",
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Users size={24} color="#8B5CF6" strokeWidth={2} />
                            <Text style={{ fontSize: 20, fontWeight: "800", color: "#111827", marginLeft: 10 }}>
                                Guest List
                            </Text>
                            <View
                                style={{
                                    backgroundColor: "#EDE9FE",
                                    borderRadius: 10,
                                    paddingVertical: 4,
                                    paddingHorizontal: 10,
                                    marginLeft: 10,
                                }}
                            >
                                <Text style={{ fontSize: 14, fontWeight: "800", color: "#8B5CF6" }}>
                                    {event.totalGuests}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                backgroundColor: "#F3F4F6",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <X size={20} color="#374151" strokeWidth={2} />
                        </TouchableOpacity>
                    </View>

                    {/* Status Filter Cards - Squared Design */}
                    <View style={{ flexDirection: "row", gap: 6, marginBottom: 16 }}>
                        {[
                            { key: "all", emoji: "👥", label: "All", color: "#8B5CF6", count: statusCounts.all },
                            { key: "added", emoji: "⏳", label: "New", color: "#EF4444", count: statusCounts.added },
                            { key: "invited", emoji: "📤", label: "Sent", color: "#3B82F6", count: statusCounts.invited },
                            { key: "confirmed", emoji: "🎉", label: "RSVP", color: "#10B981", count: statusCounts.confirmed },
                            { key: "paid", emoji: "🎁", label: "Gift", color: "#F59E0B", count: statusCounts.paid },
                        ].map((item) => {
                            const isSelected = sortBy === item.key;
                            return (
                                <TouchableOpacity
                                    key={item.key}
                                    onPress={() => setSortBy(item.key as SortOption)}
                                    style={{
                                        flex: 1,
                                        aspectRatio: 1,
                                        backgroundColor: isSelected ? item.color : "#F9FAFB",
                                        borderRadius: 12,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderWidth: 2,
                                        borderColor: isSelected ? item.color : "#E5E7EB",
                                    }}
                                >
                                    <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
                                    <Text
                                        style={{
                                            fontSize: 16,
                                            fontWeight: "900",
                                            color: isSelected ? "#FFFFFF" : "#111827",
                                            marginTop: 2,
                                        }}
                                    >
                                        {item.count}
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 9,
                                            fontWeight: "700",
                                            color: isSelected ? "rgba(255,255,255,0.9)" : "#9CA3AF",
                                            marginTop: 1,
                                        }}
                                    >
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Search Bar */}
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: "#F3F4F6",
                            borderRadius: 12,
                            paddingHorizontal: 14,
                            borderWidth: 1,
                            borderColor: "#E5E7EB",
                        }}
                    >
                        <Search size={18} color="#9CA3AF" />
                        <TextInput
                            style={{
                                flex: 1,
                                paddingVertical: 12,
                                paddingHorizontal: 10,
                                fontSize: 15,
                                fontWeight: "500",
                                color: "#111827",
                            }}
                            placeholder="Search by name or phone..."
                            placeholderTextColor="#9CA3AF"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery("")}>
                                <X size={18} color="#9CA3AF" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Selection Mode Header */}
                {selectionMode && (
                    <View
                        style={{
                            backgroundColor: "#EDE9FE",
                            paddingHorizontal: 20,
                            paddingVertical: 12,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <CheckSquare size={18} color="#7C3AED" strokeWidth={2} />
                            <Text style={{ fontSize: 14, fontWeight: "700", color: "#7C3AED", marginLeft: 8 }}>
                                {selectedGuests.size} selected
                            </Text>
                        </View>
                        <View style={{ flexDirection: "row", gap: 8 }}>
                            <TouchableOpacity
                                onPress={selectAll}
                                style={{
                                    backgroundColor: "#8B5CF6",
                                    borderRadius: 8,
                                    paddingVertical: 6,
                                    paddingHorizontal: 10,
                                }}
                            >
                                <Text style={{ fontSize: 12, fontWeight: "600", color: "#FFFFFF" }}>All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={selectAllUninvited}
                                style={{
                                    backgroundColor: "#FFFFFF",
                                    borderRadius: 8,
                                    paddingVertical: 6,
                                    paddingHorizontal: 10,
                                    borderWidth: 1,
                                    borderColor: "#8B5CF6",
                                }}
                            >
                                <Text style={{ fontSize: 12, fontWeight: "600", color: "#8B5CF6" }}>Uninvited</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={clearSelection}
                                style={{
                                    backgroundColor: "#FFFFFF",
                                    borderRadius: 8,
                                    paddingVertical: 6,
                                    paddingHorizontal: 10,
                                }}
                            >
                                <Text style={{ fontSize: 12, fontWeight: "600", color: "#6B7280" }}>Clear</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Guest List */}
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ padding: 20, paddingBottom: selectionMode ? 120 : 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    {filteredGuests.length === 0 ? (
                        <View
                            style={{
                                backgroundColor: "#FFFFFF",
                                borderRadius: 20,
                                padding: 40,
                                alignItems: "center",
                            }}
                        >
                            <Text style={{ fontSize: 48, marginBottom: 16 }}>🔍</Text>
                            <Text style={{ fontSize: 17, fontWeight: "700", color: "#374151", marginBottom: 8 }}>
                                No Guests Found
                            </Text>
                            <Text style={{ fontSize: 14, color: "#9CA3AF", textAlign: "center" }}>
                                {searchQuery
                                    ? "Try a different search term"
                                    : "No guests match the current filter"}
                            </Text>
                        </View>
                    ) : (
                        <View style={{ gap: 10 }}>
                            {filteredGuests.map((guest) => {
                                const status = STATUS_CONFIG[guest.status];
                                const StatusIcon = status.icon;
                                const isSelected = selectedGuests.has(guest.id);

                                return (
                                    <TouchableOpacity
                                        key={guest.id}
                                        onPress={() => selectionMode && toggleGuestSelection(guest.id)}
                                        activeOpacity={selectionMode ? 0.7 : 1}
                                        style={{
                                            backgroundColor: isSelected ? "#F5F3FF" : "#FFFFFF",
                                            borderRadius: 16,
                                            padding: 16,
                                            flexDirection: "row",
                                            alignItems: "center",
                                            borderWidth: isSelected ? 2 : 1,
                                            borderColor: isSelected ? "#8B5CF6" : "#E5E7EB",
                                        }}
                                    >
                                        {/* Selection Checkbox */}
                                        {selectionMode && (
                                            <View style={{ marginRight: 12 }}>
                                                {isSelected ? (
                                                    <View
                                                        style={{
                                                            width: 24,
                                                            height: 24,
                                                            borderRadius: 6,
                                                            backgroundColor: "#8B5CF6",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                        }}
                                                    >
                                                        <CheckCircle size={16} color="#FFFFFF" strokeWidth={3} />
                                                    </View>
                                                ) : (
                                                    <View
                                                        style={{
                                                            width: 24,
                                                            height: 24,
                                                            borderRadius: 6,
                                                            borderWidth: 2,
                                                            borderColor: "#D1D5DB",
                                                        }}
                                                    />
                                                )}
                                            </View>
                                        )}

                                        {/* Avatar */}
                                        <View
                                            style={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 24,
                                                backgroundColor: "#EDE9FE",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <Text style={{ fontSize: 20, fontWeight: "700", color: "#8B5CF6" }}>
                                                {guest.name.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>

                                        {/* Guest Info */}
                                        <View style={{ flex: 1, marginLeft: 14 }}>
                                            <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827" }}>
                                                {guest.name}
                                            </Text>
                                            <Text style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>
                                                {guest.phone}
                                            </Text>
                                        </View>

                                        {/* Status Badge */}
                                        <View
                                            style={{
                                                backgroundColor: status.bg,
                                                borderRadius: 10,
                                                paddingVertical: 6,
                                                paddingHorizontal: 10,
                                                flexDirection: "row",
                                                alignItems: "center",
                                            }}
                                        >
                                            <StatusIcon size={12} color={status.color} strokeWidth={2.5} />
                                            <Text
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: "700",
                                                    color: status.color,
                                                    marginLeft: 4,
                                                }}
                                            >
                                                {status.label}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </ScrollView>

                {/* Bottom Action */}
                <View
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        paddingHorizontal: 20,
                        paddingTop: 16,
                        paddingBottom: 34,
                        backgroundColor: "#FFFFFF",
                        borderTopWidth: 1,
                        borderTopColor: "#E5E7EB",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: -4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 12,
                        elevation: 12,
                    }}
                >
                    {selectionMode ? (
                        <View style={{ flexDirection: "row", gap: 12 }}>
                            <TouchableOpacity
                                onPress={exitSelectionMode}
                                style={{
                                    flex: 1,
                                    backgroundColor: "#F3F4F6",
                                    borderRadius: 16,
                                    paddingVertical: 16,
                                    alignItems: "center",
                                }}
                            >
                                <Text style={{ fontSize: 15, fontWeight: "700", color: "#6B7280" }}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSendInvites}
                                disabled={selectedGuests.size === 0}
                                style={{
                                    flex: 2,
                                    backgroundColor: selectedGuests.size > 0 ? "#8B5CF6" : "#D1D5DB",
                                    borderRadius: 16,
                                    paddingVertical: 16,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Send size={18} color="#FFFFFF" strokeWidth={2.5} />
                                <Text style={{ fontSize: 15, fontWeight: "800", color: "#FFFFFF", marginLeft: 8 }}>
                                    Send Invites ({selectedGuests.size})
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={enterSelectionMode}
                            disabled={uninvitedGuests.length === 0 && event.guests.length === 0}
                            style={{
                                backgroundColor: uninvitedGuests.length > 0 ? "#8B5CF6" : "#6B7280",
                                borderRadius: 16,
                                paddingVertical: 18,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <MessageSquare size={20} color="#FFFFFF" strokeWidth={2.5} />
                            <Text style={{ fontSize: 16, fontWeight: "800", color: "#FFFFFF", marginLeft: 10 }}>
                                Select Who to Invite
                            </Text>
                            {uninvitedGuests.length > 0 && (
                                <View
                                    style={{
                                        backgroundColor: "rgba(255,255,255,0.3)",
                                        borderRadius: 10,
                                        paddingVertical: 4,
                                        paddingHorizontal: 8,
                                        marginLeft: 10,
                                    }}
                                >
                                    <Text style={{ fontSize: 12, fontWeight: "700", color: "#FFFFFF" }}>
                                        {uninvitedGuests.length} new
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
}

