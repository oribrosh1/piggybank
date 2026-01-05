import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Users, UserPlus } from "lucide-react-native";
import { Event } from "../../../types/events";
import { getGuestStatusConfig } from "./utils";

interface GuestListCardProps {
    event: Event;
    delay?: number;
    onAddGuest?: () => void;
}

export default function GuestListCard({ event, delay = 600, onAddGuest }: GuestListCardProps) {
    return (
        <Animated.View
            entering={FadeInDown.delay(delay).duration(400)}
            style={{
                marginHorizontal: 24,
                marginTop: 16,
                backgroundColor: "#FFFFFF",
                borderRadius: 20,
                padding: 20,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
                elevation: 3,
            }}
        >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Users size={20} color="#8B5CF6" strokeWidth={2} />
                    <Text style={{ fontSize: 18, fontWeight: "800", color: "#111827", marginLeft: 10 }}>
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
                        <Text style={{ fontSize: 13, fontWeight: "800", color: "#8B5CF6" }}>
                            {event.totalGuests}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    onPress={onAddGuest}
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#8B5CF6",
                        borderRadius: 10,
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                    }}
                >
                    <UserPlus size={14} color="#FFFFFF" strokeWidth={2.5} />
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#FFFFFF", marginLeft: 6 }}>Add</Text>
                </TouchableOpacity>
            </View>

            {event.guests.length === 0 ? (
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
                    <Text style={{ fontSize: 40, marginBottom: 8 }}>👥</Text>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: "#6B7280" }}>No Guests Yet</Text>
                    <Text style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", marginTop: 4 }}>
                        Add guests to start sending invites
                    </Text>
                </View>
            ) : (
                <View style={{ maxHeight: 280 }}>
                    <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                        <View style={{ gap: 10 }}>
                            {event.guests.map((guest) => {
                                const status = getGuestStatusConfig(guest.status);

                                return (
                                    <View
                                        key={guest.id}
                                        style={{
                                            backgroundColor: "#FAF5FF",
                                            borderRadius: 14,
                                            padding: 14,
                                            flexDirection: "row",
                                            alignItems: "center",
                                        }}
                                    >
                                        <View
                                            style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 22,
                                                backgroundColor: "#EDE9FE",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <Text style={{ fontSize: 18, fontWeight: "700", color: "#8B5CF6" }}>
                                                {guest.name.charAt(0).toUpperCase()}
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
                                        <View
                                            style={{
                                                backgroundColor: status.bg,
                                                borderRadius: 8,
                                                paddingVertical: 4,
                                                paddingHorizontal: 8,
                                            }}
                                        >
                                            <Text style={{ fontSize: 11, fontWeight: "700", color: status.color }}>{status.label}</Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </ScrollView>
                </View>
            )}
        </Animated.View>
    );
}

