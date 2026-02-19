import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Calendar, Clock, MapPin, Car, Edit3 } from "lucide-react-native";
import { Event } from "@/types/events";
import { formatDate } from "./utils";

interface EventDetailsCardProps {
    event: Event;
    delay?: number;
    onEdit?: () => void;
}

export default function EventDetailsCard({ event, delay = 300, onEdit }: EventDetailsCardProps) {
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
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: "800", color: "#111827" }}>Event Details</Text>
                <TouchableOpacity
                    onPress={onEdit}
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#F3F4F6",
                        borderRadius: 10,
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                    }}
                >
                    <Edit3 size={14} color="#6B7280" strokeWidth={2.5} />
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", marginLeft: 6 }}>Edit</Text>
                </TouchableOpacity>
            </View>

            {/* Date */}
            <View style={{ flexDirection: "row", marginBottom: 16 }}>
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                    <View
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            backgroundColor: "#EDE9FE",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                        }}
                    >
                        <Calendar size={20} color="#8B5CF6" strokeWidth={2} />
                    </View>
                    <View>
                        <Text style={{ fontSize: 12, color: "#9CA3AF", fontWeight: "600" }}>Date</Text>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827" }}>
                            {formatDate(event.date)}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Time */}
            <View style={{ flexDirection: "row", marginBottom: 16 }}>
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                    <View
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            backgroundColor: "#FEF3C7",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                        }}
                    >
                        <Clock size={20} color="#F59E0B" strokeWidth={2} />
                    </View>
                    <View>
                        <Text style={{ fontSize: 12, color: "#9CA3AF", fontWeight: "600" }}>Time</Text>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827" }}>{event.time}</Text>
                    </View>
                </View>
            </View>

            {/* Location */}
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <View
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: "#D1FAE5",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                    }}
                >
                    <MapPin size={20} color="#10B981" strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: "#9CA3AF", fontWeight: "600" }}>Location</Text>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827" }}>{event.address1}</Text>
                    {event.address2 && (
                        <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{event.address2}</Text>
                    )}
                </View>
            </View>

            {/* Parking */}
            {event.parking && (
                <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 16 }}>
                    <View
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            backgroundColor: "#DBEAFE",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                        }}
                    >
                        <Car size={20} color="#3B82F6" strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, color: "#9CA3AF", fontWeight: "600" }}>Parking</Text>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827" }}>{event.parking}</Text>
                    </View>
                </View>
            )}
        </Animated.View>
    );
}

