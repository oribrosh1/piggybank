import React, { useEffect, useState, useRef } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Animated,
    Platform,
    KeyboardAvoidingView,
    ActivityIndicator,
    Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
    ArrowLeft,
    Plus,
    X,
    Users,
    Search,
    UserPlus,
    RefreshCw,
    Check,
} from "lucide-react-native";
import * as Contacts from "expo-contacts";
import { routes } from "../../../types/routes";
import { Guest, Event } from "../../../types/events";
import { getEvent, updateEventGuests } from "../../../src/lib/eventService";

export default function AddGuestsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newGuests, setNewGuests] = useState<Guest[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [phoneContacts, setPhoneContacts] = useState<Guest[]>([]);
    const [isLoadingContacts, setIsLoadingContacts] = useState(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadEvent();
        loadContacts();
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();
    }, [id]);

    const loadEvent = async () => {
        if (!id) return;
        setLoading(true);
        const eventData = await getEvent(id);
        setEvent(eventData);
        setLoading(false);
    };

    const loadContacts = async () => {
        setIsLoadingContacts(true);
        try {
            const { status } = await Contacts.requestPermissionsAsync();

            if (status !== "granted") {
                setHasPermission(false);
                setIsLoadingContacts(false);
                return;
            }

            setHasPermission(true);

            const { data } = await Contacts.getContactsAsync({
                fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
                sort: Contacts.SortTypes.FirstName,
            });

            const transformedContacts: Guest[] = data
                .filter((contact) => contact.phoneNumbers && contact.phoneNumbers.length > 0 && contact.name)
                .map((contact) => ({
                    id: contact.id || String(Math.random()),
                    name: contact.name || "Unknown",
                    phone: contact.phoneNumbers?.[0]?.number || "",
                    status: "added" as const,
                    addedAt: new Date(),
                }))
                .filter((contact) => contact.phone);

            setPhoneContacts(transformedContacts);
        } catch (error) {
            console.error("Error loading contacts:", error);
            Alert.alert("Error", "Failed to load contacts.");
        } finally {
            setIsLoadingContacts(false);
        }
    };

    // Get IDs of existing guests in the event
    const existingGuestIds = new Set(event?.guests.map((g) => g.id) || []);
    const newGuestIds = new Set(newGuests.map((g) => g.id));

    const filteredContacts = phoneContacts.filter(
        (c) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !existingGuestIds.has(c.id) &&
            !newGuestIds.has(c.id)
    );

    const addGuest = (contact: Guest) => {
        setNewGuests([...newGuests, { ...contact, addedAt: new Date() }]);
    };

    const removeGuest = (guestId: string) => {
        setNewGuests(newGuests.filter((g) => g.id !== guestId));
    };

    const handleSave = async () => {
        if (!event || !id || newGuests.length === 0) return;

        setSaving(true);
        try {
            const updatedGuests = [...event.guests, ...newGuests];
            const result = await updateEventGuests(id, updatedGuests);

            if (result.success) {
                Alert.alert(
                    "Success",
                    `Added ${newGuests.length} new guest${newGuests.length > 1 ? "s" : ""} to your event!`,
                    [{ text: "OK", onPress: () => router.back() }]
                );
            } else {
                Alert.alert("Error", result.error || "Failed to add guests");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Something went wrong");
        } finally {
            setSaving(false);
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
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{ backgroundColor: "#8B5CF6", borderRadius: 16, paddingVertical: 14, paddingHorizontal: 24 }}
                >
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, backgroundColor: "#FFFFFF" }}
        >
            <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
                <Animated.ScrollView
                    style={{ flex: 1, opacity: fadeAnim }}
                    contentContainerStyle={{ paddingBottom: 140 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View
                        style={{
                            backgroundColor: "#8B5CF6",
                            paddingTop: insets.top,
                            paddingBottom: 24,
                            borderBottomLeftRadius: 32,
                            borderBottomRightRadius: 32,
                        }}
                    >
                        <View style={{ paddingHorizontal: 20, paddingBottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                            <TouchableOpacity
                                onPress={() => router.back()}
                                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}
                            >
                                <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
                            </TouchableOpacity>
                            <Text style={{ fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.8)", letterSpacing: 1 }}>
                                ADD GUESTS
                            </Text>
                            <View style={{ width: 40 }} />
                        </View>

                        <View style={{ paddingHorizontal: 20 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                                <UserPlus size={28} color="#FFFFFF" strokeWidth={2.5} />
                                <Text style={{ fontSize: 28, fontWeight: "900", color: "#FFFFFF", marginLeft: 12 }}>
                                    Invite Guests
                                </Text>
                            </View>
                            <Text style={{ fontSize: 15, color: "rgba(255,255,255,0.9)", fontWeight: "500" }}>
                                Add more people to {event.eventName} 🎉
                            </Text>
                        </View>
                    </View>

                    {/* Current Guest Count */}
                    <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
                        <View
                            style={{
                                backgroundColor: "#F5F3FF",
                                borderRadius: 16,
                                padding: 16,
                                borderLeftWidth: 4,
                                borderLeftColor: "#8B5CF6",
                                marginBottom: 20,
                                flexDirection: "row",
                                alignItems: "center",
                            }}
                        >
                            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#8B5CF6", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                                <Users size={22} color="#FFFFFF" strokeWidth={2.5} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 15, fontWeight: "800", color: "#6D28D9" }}>
                                    Current Guest List
                                </Text>
                                <Text style={{ fontSize: 13, color: "#7C3AED", fontWeight: "600", marginTop: 2 }}>
                                    {event.totalGuests} guest{event.totalGuests !== 1 ? "s" : ""} already added
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Form Content */}
                    <View style={{ backgroundColor: "#FFFFFF", paddingHorizontal: 24 }}>
                        {/* Add Guests Card */}
                        <View
                            style={{
                                backgroundColor: "#FFFFFF",
                                borderRadius: 24,
                                padding: 20,
                                marginBottom: 20,
                                borderWidth: 2,
                                borderColor: "#F3F4F6",
                            }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#EDE9FE", alignItems: "center", justifyContent: "center" }}>
                                    <UserPlus size={22} color="#8B5CF6" strokeWidth={2.5} />
                                </View>
                                <View style={{ marginLeft: 14, flex: 1 }}>
                                    <Text style={{ fontSize: 17, fontWeight: "800", color: "#111827" }}>
                                        Select from Contacts
                                    </Text>
                                    <Text style={{ fontSize: 12, fontWeight: "500", color: "#9CA3AF", marginTop: 2 }}>
                                        {phoneContacts.length > 0
                                            ? `${filteredContacts.length} contacts available`
                                            : "Loading contacts..."}
                                    </Text>
                                </View>
                                {phoneContacts.length > 0 && (
                                    <TouchableOpacity
                                        onPress={loadContacts}
                                        style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" }}
                                    >
                                        <RefreshCw size={16} color="#9CA3AF" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Search Input */}
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    backgroundColor: "#F9FAFB",
                                    borderRadius: 14,
                                    paddingHorizontal: 14,
                                    borderWidth: 2,
                                    borderColor: "#E5E7EB",
                                    marginBottom: 16,
                                }}
                            >
                                <Search size={18} color="#9CA3AF" />
                                <TextInput
                                    style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 10, fontSize: 15, fontWeight: "600", color: "#111827" }}
                                    placeholder="Search contacts..."
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

                            {/* Contact List */}
                            <View style={{ maxHeight: 280 }}>
                                {isLoadingContacts ? (
                                    <View style={{ paddingVertical: 40, alignItems: "center" }}>
                                        <ActivityIndicator size="large" color="#8B5CF6" />
                                        <Text style={{ fontSize: 14, color: "#9CA3AF", fontWeight: "600", marginTop: 12 }}>
                                            Loading contacts...
                                        </Text>
                                    </View>
                                ) : hasPermission === false ? (
                                    <View style={{ paddingVertical: 30, alignItems: "center" }}>
                                        <Text style={{ fontSize: 40, marginBottom: 12 }}>🔒</Text>
                                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#6B7280", marginBottom: 8 }}>
                                            Permission Required
                                        </Text>
                                        <Text style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", marginBottom: 16 }}>
                                            Allow access to contacts to add guests
                                        </Text>
                                        <TouchableOpacity
                                            onPress={loadContacts}
                                            style={{ backgroundColor: "#8B5CF6", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, flexDirection: "row", alignItems: "center" }}
                                        >
                                            <RefreshCw size={16} color="#FFFFFF" />
                                            <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF", marginLeft: 8 }}>
                                                Try Again
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                                        {filteredContacts.slice(0, 50).map((contact, index) => (
                                            <TouchableOpacity
                                                key={contact.id}
                                                onPress={() => addGuest(contact)}
                                                style={{
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    paddingVertical: 12,
                                                    borderBottomWidth: index < Math.min(filteredContacts.length, 50) - 1 ? 1 : 0,
                                                    borderBottomColor: "#F3F4F6",
                                                }}
                                            >
                                                <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "#EDE9FE", alignItems: "center", justifyContent: "center" }}>
                                                    <Text style={{ fontSize: 18, fontWeight: "700", color: "#8B5CF6" }}>
                                                        {contact.name.charAt(0).toUpperCase()}
                                                    </Text>
                                                </View>
                                                <View style={{ flex: 1, marginLeft: 12 }}>
                                                    <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827" }}>
                                                        {contact.name}
                                                    </Text>
                                                    <Text style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>
                                                        {contact.phone}
                                                    </Text>
                                                </View>
                                                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#8B5CF6", alignItems: "center", justifyContent: "center" }}>
                                                    <Plus size={18} color="#FFFFFF" strokeWidth={3} />
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                        {filteredContacts.length === 0 && (
                                            <View style={{ paddingVertical: 20, alignItems: "center" }}>
                                                <Text style={{ fontSize: 14, color: "#9CA3AF", fontWeight: "600" }}>
                                                    {searchQuery ? "No contacts match your search" : "All contacts already added! 🎉"}
                                                </Text>
                                            </View>
                                        )}
                                        {filteredContacts.length > 50 && (
                                            <View style={{ paddingVertical: 12, alignItems: "center" }}>
                                                <Text style={{ fontSize: 12, color: "#9CA3AF", fontWeight: "600" }}>
                                                    Showing 50 of {filteredContacts.length} • Use search to find more
                                                </Text>
                                            </View>
                                        )}
                                    </ScrollView>
                                )}
                            </View>
                        </View>

                        {/* New Guests Card */}
                        <View
                            style={{
                                backgroundColor: "#FFFFFF",
                                borderRadius: 24,
                                padding: 20,
                                marginBottom: 20,
                                borderWidth: 2,
                                borderColor: newGuests.length > 0 ? "#8B5CF6" : "#F3F4F6",
                            }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: newGuests.length > 0 ? "#8B5CF6" : "#F3F4F6", alignItems: "center", justifyContent: "center" }}>
                                    <Text style={{ fontSize: 20 }}>✨</Text>
                                </View>
                                <View style={{ marginLeft: 14, flex: 1 }}>
                                    <Text style={{ fontSize: 17, fontWeight: "800", color: "#111827" }}>
                                        New Guests to Add
                                    </Text>
                                    <Text style={{ fontSize: 12, fontWeight: "500", color: "#9CA3AF", marginTop: 2 }}>
                                        {newGuests.length === 0 ? "Select contacts above" : `${newGuests.length} new guest${newGuests.length > 1 ? "s" : ""} selected`}
                                    </Text>
                                </View>
                                {newGuests.length > 0 && (
                                    <View style={{ backgroundColor: "#8B5CF6", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
                                        <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF" }}>
                                            +{newGuests.length}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {newGuests.length === 0 ? (
                                <View
                                    style={{
                                        backgroundColor: "#F9FAFB",
                                        borderRadius: 16,
                                        padding: 24,
                                        alignItems: "center",
                                        borderWidth: 2,
                                        borderStyle: "dashed",
                                        borderColor: "#E5E7EB",
                                    }}
                                >
                                    <Text style={{ fontSize: 40, marginBottom: 12 }}>👆</Text>
                                    <Text style={{ fontSize: 15, fontWeight: "700", color: "#6B7280", marginBottom: 4 }}>
                                        No New Guests Selected
                                    </Text>
                                    <Text style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center" }}>
                                        Tap on contacts above to add them
                                    </Text>
                                </View>
                            ) : (
                                <View style={{ maxHeight: 240 }}>
                                    <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                                        <View style={{ gap: 10 }}>
                                            {newGuests.map((guest) => (
                                                <View
                                                    key={guest.id}
                                                    style={{
                                                        backgroundColor: "#FAF5FF",
                                                        borderRadius: 16,
                                                        padding: 14,
                                                        flexDirection: "row",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#EDE9FE", alignItems: "center", justifyContent: "center" }}>
                                                        <Text style={{ fontSize: 18, fontWeight: "700", color: "#8B5CF6" }}>
                                                            {guest.name.charAt(0)}
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827" }}>
                                                            {guest.name}
                                                        </Text>
                                                        <Text style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>
                                                            {guest.phone}
                                                        </Text>
                                                    </View>
                                                    <TouchableOpacity
                                                        onPress={() => removeGuest(guest.id)}
                                                        style={{ width: 32, height: 32, backgroundColor: "#FEE2E2", borderRadius: 16, alignItems: "center", justifyContent: "center" }}
                                                    >
                                                        <X size={16} color="#EF4444" strokeWidth={3} />
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                        </View>
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                    </View>
                </Animated.ScrollView>

                {/* Floating Save Button */}
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
                    }}
                >
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={newGuests.length === 0 || saving}
                        style={{
                            backgroundColor: newGuests.length > 0 && !saving ? "#8B5CF6" : "#E5E7EB",
                            borderRadius: 18,
                            paddingVertical: 18,
                            alignItems: "center",
                            flexDirection: "row",
                            justifyContent: "center",
                        }}
                    >
                        {saving ? (
                            <ActivityIndicator color="#FFFFFF" style={{ marginRight: 10 }} />
                        ) : (
                            <Check size={20} color={newGuests.length > 0 ? "#FFFFFF" : "#9CA3AF"} strokeWidth={3} style={{ marginRight: 10 }} />
                        )}
                        <Text
                            style={{
                                fontSize: 17,
                                fontWeight: "800",
                                color: newGuests.length > 0 && !saving ? "#FFFFFF" : "#9CA3AF",
                            }}
                        >
                            {saving
                                ? "Adding Guests..."
                                : newGuests.length > 0
                                    ? `Add ${newGuests.length} Guest${newGuests.length > 1 ? "s" : ""}`
                                    : "Select Guests to Add"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

