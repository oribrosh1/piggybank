import React, { useState, useMemo, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
    TextInput,
    Alert,
    Pressable,
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
    PhoneOff,
    UserX,
} from "lucide-react-native";
import { Event, Guest, GuestStatus } from "@/types/events";

/** Filter options: coming = accepted invitation only (confirmed); paid = confirmed+paid (gifted) */
type SortOption = "all" | "added" | "invited" | "coming" | "paid" | "invalid_phone" | "declined";

interface GuestManagementModalProps {
    visible: boolean;
    onClose: () => void;
    event: Event;
    onSendInvites?: (selectedGuests: Guest[]) => void;
    /** When set, guest list opens filtered (confirmed → coming, paid → paid) */
    initialFilter?: "added" | "invited" | "confirmed" | "paid";
    /** Called when user taps Add guest (e.g. navigate to add-guests screen); modal typically closes first */
    onAddGuest?: () => void;
}

const STATUS_CONFIG: Record<GuestStatus, { bg: string; color: string; label: string; icon: any }> = {
    invited: { bg: "#DBEAFE", color: "#1D4ED8", label: "Invited", icon: Clock },
    added: { bg: "#FEE2E2", color: "#B91C1C", label: "Not invited", icon: UserPlus },
    confirmed: { bg: "#D1FAE5", color: "#047857", label: "Coming", icon: UserCheck },
    paid: { bg: "#CCFBF1", color: "#0F766E", label: "Gifted", icon: DollarSign },
    invalid_phone: { bg: "#FEF3C7", color: "#B45309", label: "Invalid number", icon: PhoneOff },
    declined: { bg: "#F1F5F9", color: "#475569", label: "Not coming", icon: UserX },
};

function guestMatchesFilter(guest: Guest, filterKey: SortOption): boolean {
    if (filterKey === "all") return true;
    if (filterKey === "coming") return guest.status === "confirmed"; // accepted invitation only
    if (filterKey === "paid") return guest.status === "confirmed" || guest.status === "paid"; // confirmed+paid (gifted)
    return guest.status === filterKey;
}

export default function GuestManagementModal({
    visible,
    onClose,
    event,
    onSendInvites,
    initialFilter,
    onAddGuest,
}: GuestManagementModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFilters, setSelectedFilters] = useState<Set<SortOption>>(new Set(["all"]));
    const [showFilterModal, setShowFilterModal] = useState(false);

    // Open guest list at specific segment when initialFilter is set
    useEffect(() => {
        if (!visible) {
            setSelectedFilters(new Set(["all"]));
            return;
        }
        if (initialFilter) {
            const mapped: SortOption =
                initialFilter === "confirmed" ? "coming" :
                initialFilter === "paid" ? "paid" :
                initialFilter;
            setSelectedFilters(new Set([mapped]));
        }
    }, [visible, initialFilter]);
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

        // Filter by status (multi-select: show if guest matches any selected filter)
        const showAll = selectedFilters.size === 0 || selectedFilters.has("all");
        if (!showAll) {
            guests = guests.filter((g) =>
                [...selectedFilters].some((key) => guestMatchesFilter(g, key))
            );
        }

        // Sort by status priority: added -> invited -> confirmed -> paid -> invalid_phone -> declined
        const statusOrder: Record<GuestStatus, number> = {
            added: 0,
            invited: 1,
            confirmed: 2,
            paid: 3,
            invalid_phone: 4,
            declined: 5,
        };
        guests.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

        return guests;
    }, [event.guests, searchQuery, selectedFilters]);

    // Counts for filter modal (all options and combinations)
    const filterCounts = useMemo(() => {
        const added = event.guests.filter((g) => g.status === "added").length;
        const invited = event.guests.filter((g) => g.status === "invited").length;
        const confirmed = event.guests.filter((g) => g.status === "confirmed").length;
        const paid = event.guests.filter((g) => g.status === "paid").length;
        const invalid_phone = event.guests.filter((g) => g.status === "invalid_phone").length;
        const declined = event.guests.filter((g) => g.status === "declined").length;
        return {
            all: event.guests.length,
            added,
            invited,
            coming: confirmed, // accepted invitation only
            paid: confirmed + paid, // confirmed+paid (gifted)
            invalid_phone,
            declined,
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

    /** Enter selection mode with only this guest selected (e.g. when tapping a not-invited guest row). */
    const enterSelectionModeWithGuest = (guestId: string) => {
        setSelectionMode(true);
        setSelectedGuests(new Set([guestId]));
    };

    const exitSelectionMode = () => {
        setSelectionMode(false);
        setSelectedGuests(new Set());
    };

    const getSortLabel = (option: SortOption) => {
        switch (option) {
            case "all": return "All guests";
            case "added": return "To invite";
            case "invited": return "Invited";
            case "coming": return "Coming";
            case "paid": return "Gifted";
            case "invalid_phone": return "Invalid number";
            case "declined": return "Not coming";
        }
    };

    const FILTER_OPTIONS: Array<{ key: SortOption; label: string; emoji: string; count: number }> = [
        { key: "all", label: "All guests", emoji: "👥", count: filterCounts.all },
        { key: "added", label: "To invite", emoji: "⏳", count: filterCounts.added },
        { key: "invited", label: "Invited", emoji: "📤", count: filterCounts.invited },
        { key: "coming", label: "Coming", emoji: "🎉", count: filterCounts.coming },
        { key: "paid", label: "Gifted", emoji: "🎁", count: filterCounts.paid },
        { key: "invalid_phone", label: "Invalid number", emoji: "📵", count: filterCounts.invalid_phone },
        { key: "declined", label: "Not coming", emoji: "🙁", count: filterCounts.declined },
    ];

    const CHIP_STYLES: Record<SortOption, { bg: string; border: string; color: string }> = {
        all: { bg: "#EDE9FE", border: "#DDD6FE", color: "#5B21B6" },
        added: { bg: "#FEE2E2", border: "#FECACA", color: "#B91C1C" },
        invited: { bg: "#DBEAFE", border: "#93C5FD", color: "#1D4ED8" },
        coming: { bg: "#D1FAE5", border: "#A7F3D0", color: "#047857" },
        paid: { bg: "#CCFBF1", border: "#99F6E4", color: "#0F766E" },
        invalid_phone: { bg: "#FEF3C7", border: "#FDE68A", color: "#B45309" },
        declined: { bg: "#F1F5F9", border: "#E2E8F0", color: "#475569" },
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
                        <View style={{ flexDirection: "row", alignItems: "center", flex: 1, minWidth: 0 }}>
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
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            {onAddGuest && (
                                <TouchableOpacity
                                    onPress={() => {
                                        onClose();
                                        onAddGuest();
                                    }}
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 20,
                                        backgroundColor: "#8B5CF6",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <UserPlus size={20} color="#FFFFFF" strokeWidth={2.5} />
                                </TouchableOpacity>
                            )}
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
                    </View>

                    {/* Amount card + Apply filters – same row */}
                    <View style={{ flexDirection: "row", alignItems: "stretch", gap: 12, marginBottom: 12 }}>
                        {/* Filtered result count – minimal stat card */}
                        <View
                            style={{
                                flex: 1,
                                backgroundColor: "#FAF5FF",
                                borderRadius: 14,
                                paddingVertical: 12,
                                paddingHorizontal: 16,
                                borderWidth: 1,
                                borderColor: "#EDE9FE",
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.04,
                                shadowRadius: 3,
                                elevation: 2,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 11,
                                    fontWeight: "700",
                                    color: "#7C3AED",
                                    letterSpacing: 0.5,
                                    marginBottom: 2,
                                }}
                            >
                                FILTERED RESULT
                            </Text>
                            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                                <Text style={{ fontSize: 26, fontWeight: "800", color: "#5B21B6", letterSpacing: -0.5 }}>
                                    {filteredGuests.length}
                                </Text>
                                <Text style={{ fontSize: 14, fontWeight: "600", color: "#6D28D9", marginLeft: 6 }}>
                                    {filteredGuests.length === 1 ? "guest" : "guests"}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={() => setShowFilterModal(true)}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "#8B5CF6",
                                borderRadius: 12,
                                paddingVertical: 12,
                                paddingHorizontal: 16,
                            }}
                        >
                            <Filter size={18} color="#FFFFFF" strokeWidth={2} />
                            <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF", marginLeft: 8 }}>
                                Apply filters
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Showing – active filters as chips */}
                    <View
                        style={{
                            width: "100%",
                            marginBottom: 12,
                        }}
                    >
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                            <Text
                                style={{
                                    fontSize: 11,
                                    fontWeight: "800",
                                    color: "#9CA3AF",
                                    letterSpacing: 0.8,
                                }}
                            >
                                SHOWING
                            </Text>
                            {!(selectedFilters.size === 0 || selectedFilters.has("all")) && (
                                <TouchableOpacity
                                    onPress={() => setSelectedFilters(new Set(["all"]))}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    style={{ paddingVertical: 4, paddingHorizontal: 8 }}
                                >
                                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#8B5CF6" }}>
                                        Reset filters
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        {(selectedFilters.size === 0 || selectedFilters.has("all")) ? (
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    alignSelf: "flex-start",
                                    backgroundColor: "#EDE9FE",
                                    paddingVertical: 10,
                                    paddingHorizontal: 14,
                                    borderRadius: 20,
                                    borderWidth: 1,
                                    borderColor: "#DDD6FE",
                                }}
                            >
                                <Text style={{ fontSize: 16 }}>👥</Text>
                                <Text style={{ fontSize: 14, fontWeight: "700", color: "#5B21B6", marginLeft: 8 }}>
                                    All guests
                                </Text>
                            </View>
                        ) : (
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                                {FILTER_OPTIONS.filter((o) => o.key !== "all" && selectedFilters.has(o.key)).map((opt) => {
                                    const chipStyle = CHIP_STYLES[opt.key];
                                    return (
                                        <View
                                            key={opt.key}
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                backgroundColor: chipStyle.bg,
                                                paddingVertical: 8,
                                                paddingHorizontal: 12,
                                                borderRadius: 16,
                                                borderWidth: 1,
                                                borderColor: chipStyle.border,
                                            }}
                                        >
                                            <Text style={{ fontSize: 14 }}>{opt.emoji}</Text>
                                            <Text
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: "700",
                                                    color: chipStyle.color,
                                                    marginLeft: 6,
                                                }}
                                                numberOfLines={1}
                                            >
                                                {opt.label}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
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
                                        onPress={() => {
                                            if (selectionMode) {
                                                toggleGuestSelection(guest.id);
                                            } else if (guest.status === "added") {
                                                enterSelectionModeWithGuest(guest.id);
                                            }
                                        }}
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

            {/* Apply filters modal – all options and combinations */}
            <Modal
                visible={showFilterModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowFilterModal(false)}
            >
                <Pressable
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(15, 23, 42, 0.5)",
                        justifyContent: "flex-end",
                    }}
                    onPress={() => setShowFilterModal(false)}
                >
                    <Pressable
                        style={{
                            backgroundColor: "#FFFFFF",
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            paddingTop: 20,
                            paddingBottom: 32,
                            paddingHorizontal: 20,
                            maxHeight: "80%",
                        }}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                            <Text style={{ fontSize: 18, fontWeight: "800", color: "#111827" }}>Filter guests</Text>
                            <TouchableOpacity
                                onPress={() => setShowFilterModal(false)}
                                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" }}
                            >
                                <X size={18} color="#6B7280" strokeWidth={2} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
                            {FILTER_OPTIONS.map((item) => {
                                const isSelected = selectedFilters.has(item.key);
                                return (
                                    <TouchableOpacity
                                        key={item.key}
                                        onPress={() => {
                                            setSelectedFilters((prev) => {
                                                const next = new Set(prev);
                                                if (item.key === "all") {
                                                    return new Set(["all"]);
                                                }
                                                next.delete("all");
                                                if (next.has(item.key)) {
                                                    next.delete(item.key);
                                                    if (next.size === 0) next.add("all");
                                                } else {
                                                    next.add(item.key);
                                                }
                                                return next;
                                            });
                                        }}
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            paddingVertical: 14,
                                            paddingHorizontal: 16,
                                            backgroundColor: isSelected ? "#EDE9FE" : "#F9FAFB",
                                            borderRadius: 14,
                                            marginBottom: 8,
                                            borderWidth: 2,
                                            borderColor: isSelected ? "#8B5CF6" : "transparent",
                                        }}
                                    >
                                        {isSelected ? (
                                            <CheckSquare size={22} color="#8B5CF6" strokeWidth={2} />
                                        ) : (
                                            <Square size={22} color="#9CA3AF" strokeWidth={2} />
                                        )}
                                        <Text style={{ fontSize: 20, marginLeft: 12 }}>{item.emoji}</Text>
                                        <Text style={{ flex: 1, fontSize: 16, fontWeight: "700", color: "#374151", marginLeft: 8 }}>
                                            {item.label}
                                        </Text>
                                        <Text style={{ fontSize: 15, fontWeight: "800", color: isSelected ? "#8B5CF6" : "#6B7280" }}>
                                            {item.count}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                        <TouchableOpacity
                            onPress={() => {
                                setSelectedFilters(new Set(["all"]));
                                setShowFilterModal(false);
                            }}
                            style={{
                                marginTop: 16,
                                paddingVertical: 12,
                                alignItems: "center",
                            }}
                        >
                            <Text style={{ fontSize: 15, fontWeight: "700", color: "#8B5CF6" }}>Reset filters</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setShowFilterModal(false)}
                            style={{
                                marginTop: 8,
                                paddingVertical: 14,
                                borderRadius: 14,
                                backgroundColor: "#8B5CF6",
                                alignItems: "center",
                            }}
                        >
                            <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>Done</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
        </Modal>
    );
}

