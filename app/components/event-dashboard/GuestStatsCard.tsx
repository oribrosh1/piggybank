import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Users, TrendingUp } from "lucide-react-native";
import { Event } from "../../../types/events";

interface GuestStatsCardProps {
    event: Event;
    delay?: number;
    onViewAll?: () => void;
}

export default function GuestStatsCard({ event, delay = 550, onViewAll }: GuestStatsCardProps) {
    const stats = event.guestStats;
    const total = event.totalGuests;

    // Calculate percentages for the progress bar
    const getPercentage = (value: number) => (total > 0 ? (value / total) * 100 : 0);

    const confirmedPercentage = getPercentage(stats.confirmed + stats.paid);
    const invitedPercentage = getPercentage(stats.invited);
    const paidPercentage = getPercentage(stats.paid);

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
                    padding: 20,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.08,
                    shadowRadius: 16,
                    elevation: 4,
                }}
            >
                {/* Header */}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 14,
                                backgroundColor: "#EDE9FE",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <TrendingUp size={22} color="#8B5CF6" strokeWidth={2.5} />
                        </View>
                        <View style={{ marginLeft: 12 }}>
                            <Text style={{ fontSize: 18, fontWeight: "800", color: "#111827" }}>
                                Guest Stats
                            </Text>
                            <Text style={{ fontSize: 12, color: "#9CA3AF", fontWeight: "500", marginTop: 2 }}>
                                Track your RSVPs
                            </Text>
                        </View>
                    </View>
                    {onViewAll && (
                        <TouchableOpacity
                            onPress={onViewAll}
                            style={{
                                backgroundColor: "#F3F4F6",
                                borderRadius: 10,
                                paddingVertical: 8,
                                paddingHorizontal: 14,
                            }}
                        >
                            <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280" }}>View All</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Main Stats Row */}
                <View
                    style={{
                        flexDirection: "row",
                        backgroundColor: "#F9FAFB",
                        borderRadius: 20,
                        padding: 16,
                        marginBottom: 10,
                    }}
                >
                    {/* Total Guests - Large */}
                    <View style={{ flex: 1, alignItems: "center", borderRightWidth: 1, borderRightColor: "#E5E7EB" }}>
                        <View
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: 32,
                                backgroundColor: "#8B5CF6",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 8,
                            }}
                        >
                            <Text style={{ fontSize: 24, fontWeight: "900", color: "#FFFFFF" }}>
                                {total}
                            </Text>
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: "700", color: "#374151" }}>Total</Text>
                        <Text style={{ fontSize: 11, color: "#9CA3AF", fontWeight: "500" }}>Guests</Text>
                    </View>

                    {/* RSVP Rate */}
                    <View style={{ flex: 1, alignItems: "center" }}>
                        <View
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: 32,
                                backgroundColor: "#10B981",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 8,
                            }}
                        >
                            <Text style={{ fontSize: 20, fontWeight: "900", color: "#FFFFFF" }}>
                                {total > 0 ? Math.round(confirmedPercentage) : 0}%
                            </Text>
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: "700", color: "#374151" }}>RSVP</Text>
                        <Text style={{ fontSize: 11, color: "#9CA3AF", fontWeight: "500" }}>Rate</Text>
                    </View>
                </View>

                {/* Stats Pipeline */}
                <View style={{ gap: 12 }}>
                    {/* Row 1: Not Invited & Invited */}
                    <View style={{ flexDirection: "row", gap: 12 }}>
                        {/* Not Invited - Waiting */}
                        <View
                            style={{
                                flex: 1,
                                backgroundColor: stats.added > 0 ? "#FEF2F2" : "#F9FAFB",
                                borderRadius: 20,
                                padding: 16,
                                flexDirection: "row",
                                alignItems: "center",
                            }}
                        >
                            <View
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 24,
                                    backgroundColor: stats.added > 0 ? "#FEE2E2" : "#E5E7EB",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Text style={{ fontSize: 22 }}>⏳</Text>
                            </View>
                            <View style={{ marginLeft: 12, flex: 1 }}>
                                <Text style={{ fontSize: 24, fontWeight: "900", color: stats.added > 0 ? "#DC2626" : "#9CA3AF" }}>
                                    {stats.added}
                                </Text>
                                <Text style={{ fontSize: 12, fontWeight: "600", color: stats.added > 0 ? "#EF4444" : "#9CA3AF" }}>
                                    Waiting
                                </Text>
                            </View>
                            {stats.added > 0 && (
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444" }} />
                            )}
                        </View>

                        {/* Invited - Sent */}
                        <View
                            style={{
                                flex: 1,
                                backgroundColor: stats.invited > 0 ? "#EFF6FF" : "#F9FAFB",
                                borderRadius: 20,
                                padding: 16,
                                flexDirection: "row",
                                alignItems: "center",
                            }}
                        >
                            <View
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 24,
                                    backgroundColor: stats.invited > 0 ? "#DBEAFE" : "#E5E7EB",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Text style={{ fontSize: 22 }}>📤</Text>
                            </View>
                            <View style={{ marginLeft: 12, flex: 1 }}>
                                <Text style={{ fontSize: 24, fontWeight: "900", color: stats.invited > 0 ? "#1D4ED8" : "#9CA3AF" }}>
                                    {stats.invited}
                                </Text>
                                <Text style={{ fontSize: 12, fontWeight: "600", color: stats.invited > 0 ? "#3B82F6" : "#9CA3AF" }}>
                                    Sent
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Row 2: Confirmed & Paid */}
                    <View style={{ flexDirection: "row", gap: 12 }}>
                        {/* Confirmed - Coming */}
                        <View
                            style={{
                                flex: 1,
                                backgroundColor: stats.confirmed > 0 ? "#ECFDF5" : "#F9FAFB",
                                borderRadius: 20,
                                padding: 16,
                                flexDirection: "row",
                                alignItems: "center",
                            }}
                        >
                            <View
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 24,
                                    backgroundColor: stats.confirmed > 0 ? "#D1FAE5" : "#E5E7EB",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Text style={{ fontSize: 22 }}>🎉</Text>
                            </View>
                            <View style={{ marginLeft: 12, flex: 1 }}>
                                <Text style={{ fontSize: 24, fontWeight: "900", color: stats.confirmed > 0 ? "#059669" : "#9CA3AF" }}>
                                    {stats.confirmed}
                                </Text>
                                <Text style={{ fontSize: 12, fontWeight: "600", color: stats.confirmed > 0 ? "#10B981" : "#9CA3AF" }}>
                                    Coming
                                </Text>
                            </View>
                            {stats.confirmed > 0 && (
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981" }} />
                            )}
                        </View>

                        {/* Paid - Gifted */}
                        <View
                            style={{
                                flex: 1,
                                backgroundColor: stats.paid > 0 ? "#FFFBEB" : "#F9FAFB",
                                borderRadius: 20,
                                padding: 16,
                                flexDirection: "row",
                                alignItems: "center",
                            }}
                        >
                            <View
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 24,
                                    backgroundColor: stats.paid > 0 ? "#FEF3C7" : "#E5E7EB",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Text style={{ fontSize: 22 }}>🎁</Text>
                            </View>
                            <View style={{ marginLeft: 12, flex: 1 }}>
                                <Text style={{ fontSize: 24, fontWeight: "900", color: stats.paid > 0 ? "#D97706" : "#9CA3AF" }}>
                                    {stats.paid}
                                </Text>
                                <Text style={{ fontSize: 12, fontWeight: "600", color: stats.paid > 0 ? "#F59E0B" : "#9CA3AF" }}>
                                    Gifted
                                </Text>
                            </View>
                            {stats.paid > 0 && (
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#F59E0B" }} />
                            )}
                        </View>
                    </View>
                </View>

                {/* Total Received (if any payments) */}
                {stats.totalPaid > 0 && (
                    <View
                        style={{
                            marginTop: 16,
                            backgroundColor: "#FEF3C7",
                            borderRadius: 16,
                            padding: 16,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Text style={{ fontSize: 28, marginRight: 12 }}>🎁</Text>
                            <View>
                                <Text style={{ fontSize: 13, fontWeight: "600", color: "#92400E" }}>
                                    Total Gifts Received
                                </Text>
                                <Text style={{ fontSize: 11, color: "#B45309", marginTop: 2 }}>
                                    From {stats.paid} guest{stats.paid !== 1 ? "s" : ""}
                                </Text>
                            </View>
                        </View>
                        <Text style={{ fontSize: 24, fontWeight: "900", color: "#D97706" }}>
                            ${(stats.totalPaid / 100).toFixed(0)}
                        </Text>
                    </View>
                )}
            </View>
        </Animated.View>
    );
}

