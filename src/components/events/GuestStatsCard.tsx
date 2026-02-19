import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { TrendingUp } from "lucide-react-native";
import { Event } from "@/types/events";
import type { GuestStatus } from "@/types/events";

interface GuestStatsCardProps {
    event: Event;
    delay?: number;
    onViewAll?: () => void;
    /** When a breakdown segment is pressed, open guest list filtered to that status */
    onViewSegment?: (segment: GuestStatus) => void;
}

const BREAKDOWN: Array<{
    label: string;
    key: keyof import("@/types/events").GuestStats;
    segment: import("@/types/events").GuestStatus;
    emoji: string;
    color: string;
    bg: string;
}> = [
    { label: "Invited", key: "invited", segment: "invited", emoji: "📤", color: "#1D4ED8", bg: "#DBEAFE" },
    { label: "Not invited", key: "added", segment: "added", emoji: "⏳", color: "#B91C1C", bg: "#FEE2E2" },
    { label: "Coming", key: "confirmed", segment: "confirmed", emoji: "🎉", color: "#047857", bg: "#D1FAE5" },
    { label: "Gifted", key: "paid", segment: "paid", emoji: "🎁", color: "#0F766E", bg: "#CCFBF1" },
    { label: "Invalid number", key: "invalidNumber", segment: "invalid_phone", emoji: "📵", color: "#B45309", bg: "#FEF3C7" },
    { label: "Not coming", key: "notComing", segment: "declined", emoji: "🙁", color: "#475569", bg: "#F1F5F9" },
];

export default function GuestStatsCard({ event, delay = 550, onViewAll, onViewSegment }: GuestStatsCardProps) {
    const stats = event.guestStats ?? { total: 0, added: 0, invited: 0, confirmed: 0, paid: 0, invalidNumber: 0, notComing: 0, totalPaid: 0 };
    const total = event.totalGuests ?? stats.total ?? 0;
    const rsvpRate =
        total > 0 ? Math.round(((stats.confirmed + stats.paid) / total) * 100) : 0;

    return (
        <Animated.View
            entering={FadeInDown.delay(delay).duration(400)}
            style={{
                marginHorizontal: 24,
                marginTop: 16,
            }}
        >
            <View
                style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 24,
                    overflow: "hidden",
                    shadowColor: "#6B21A8",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.12,
                    shadowRadius: 20,
                    elevation: 6,
                }}
            >
                {/* Header strip – same as popup */}
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: 16,
                        paddingBottom: 14,
                        paddingHorizontal: 20,
                        backgroundColor: "#FAF5FF",
                        borderBottomWidth: 1,
                        borderBottomColor: "#EDE9FE",
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 14,
                                backgroundColor: "#8B5CF6",
                                alignItems: "center",
                                justifyContent: "center",
                                shadowColor: "#8B5CF6",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.35,
                                shadowRadius: 6,
                                elevation: 3,
                            }}
                        >
                            <TrendingUp size={22} color="#FFFFFF" strokeWidth={2.5} />
                        </View>
                        <View style={{ marginLeft: 14 }}>
                            <Text style={{ fontSize: 18, fontWeight: "800", color: "#1F2937", letterSpacing: -0.3 }}>
                                Guest Stats
                            </Text>
                            <Text style={{ fontSize: 12, color: "#6B7280", fontWeight: "600", marginTop: 2 }}>
                                Track your RSVPs
                            </Text>
                        </View>
                    </View>
                    {onViewAll && (
                        <TouchableOpacity
                            onPress={onViewAll}
                            style={{
                                backgroundColor: "#F3F4F6",
                                borderRadius: 12,
                                paddingVertical: 10,
                                paddingHorizontal: 16,
                            }}
                        >
                            <Text style={{ fontSize: 13, fontWeight: "700", color: "#6B7280" }}>View All</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={{ padding: 20, paddingTop: 18 }}>
                    {/* Hero stats – two cards, same as popup */}
                    <View style={{ flexDirection: "row", gap: 12, marginBottom: 18 }}>
                        <View
                            style={{
                                flex: 1,
                                backgroundColor: "#F5F3FF",
                                borderRadius: 16,
                                paddingVertical: 16,
                                paddingHorizontal: 12,
                                alignItems: "center",
                                borderWidth: 1,
                                borderColor: "#EDE9FE",
                            }}
                        >
                            <Text style={{ fontSize: 28, fontWeight: "900", color: "#7C3AED", letterSpacing: -0.5 }}>
                                {total}
                            </Text>
                            <Text style={{ fontSize: 11, fontWeight: "700", color: "#6D28D9", marginTop: 4, letterSpacing: 0.5 }}>
                                TOTAL GUESTS
                            </Text>
                        </View>
                        <View
                            style={{
                                flex: 1,
                                backgroundColor: "#ECFDF5",
                                borderRadius: 16,
                                paddingVertical: 16,
                                paddingHorizontal: 12,
                                alignItems: "center",
                                borderWidth: 1,
                                borderColor: "#D1FAE5",
                            }}
                        >
                            <Text style={{ fontSize: 28, fontWeight: "900", color: "#059669", letterSpacing: -0.5 }}>
                                {rsvpRate}%
                            </Text>
                            <Text style={{ fontSize: 11, fontWeight: "700", color: "#047857", marginTop: 4, letterSpacing: 0.5 }}>
                                RSVP RATE
                            </Text>
                        </View>
                    </View>

                    {/* Breakdown – 3 rows x 2, updated colors per card */}
                    <Text style={{ fontSize: 11, fontWeight: "800", color: "#9CA3AF", marginBottom: 8, letterSpacing: 0.8 }}>
                        BREAKDOWN
                    </Text>
                    <View style={{ gap: 10 }}>
                        {[BREAKDOWN.slice(0, 2), BREAKDOWN.slice(2, 4), BREAKDOWN.slice(4, 6)].map((row, rowIdx) => (
                            <View key={rowIdx} style={{ flexDirection: "row", gap: 10 }}>
                                {row.map(({ label, key, segment, emoji, color, bg }) => {
                                    const value = stats[key] ?? 0;
                                    const handlePress = () => onViewSegment?.(segment);
                                    const content = (
                                        <>
                                            <Text style={{ fontSize: 18 }}>{emoji}</Text>
                                            <View style={{ marginLeft: 10, flex: 1 }}>
                                                <Text style={{ fontSize: 14, fontWeight: "700", color: "#374151" }} numberOfLines={1}>
                                                    {label}
                                                </Text>
                                                <Text style={{ fontSize: 18, fontWeight: "800", color }}>{value}</Text>
                                            </View>
                                        </>
                                    );
                                    const cellStyle = {
                                        flex: 1,
                                        flexDirection: "row" as const,
                                        alignItems: "center" as const,
                                        paddingVertical: 10,
                                        paddingHorizontal: 12,
                                        backgroundColor: bg,
                                        borderRadius: 14,
                                        borderWidth: 1,
                                        borderColor: color,
                                    };
                                    return onViewSegment ? (
                                        <TouchableOpacity key={segment} onPress={handlePress} style={cellStyle} activeOpacity={0.7}>
                                            {content}
                                        </TouchableOpacity>
                                    ) : (
                                        <View key={segment} style={cellStyle}>
                                            {content}
                                        </View>
                                    );
                                })}
                            </View>
                        ))}
                    </View>

                    {/* Total received */}
                    {(stats.totalPaid ?? 0) > 0 && (
                        <View
                            style={{
                                marginTop: 16,
                                backgroundColor: "#FFFBEB",
                                borderRadius: 14,
                                paddingVertical: 12,
                                paddingHorizontal: 14,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                borderLeftWidth: 4,
                                borderLeftColor: "#F59E0B",
                            }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <Text style={{ fontSize: 22 }}>🎁</Text>
                                <View style={{ marginLeft: 10 }}>
                                    <Text style={{ fontSize: 12, fontWeight: "700", color: "#92400E" }}>
                                        Total Gifts Received
                                    </Text>
                                    <Text style={{ fontSize: 11, color: "#B45309", marginTop: 1 }}>
                                        From {stats.paid} guest{stats.paid !== 1 ? "s" : ""}
                                    </Text>
                                </View>
                            </View>
                            <Text style={{ fontSize: 20, fontWeight: "900", color: "#D97706" }}>
                                ${((stats.totalPaid ?? 0) / 100).toFixed(0)}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </Animated.View>
    );
}
