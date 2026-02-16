import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { MessageSquare, UserPlus, Share2, Gift } from "lucide-react-native";

interface QuickActionsProps {
    delay?: number;
    onSendInvites?: () => void;
    onAddGuests?: () => void;
    onShare?: () => void;
    onSendChildLink?: () => void;
    childLinkLoading?: boolean;
}

export default function QuickActions({
    delay = 200,
    onSendInvites,
    onAddGuests,
    onShare,
    onSendChildLink,
    childLinkLoading = false,
}: QuickActionsProps) {
    return (
        <Animated.View
            entering={FadeInDown.delay(delay).duration(400)}
            style={{ marginHorizontal: 24, marginTop: 20 }}
        >
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#9CA3AF", marginBottom: 12, letterSpacing: 1 }}>
                QUICK ACTIONS
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                <TouchableOpacity
                    onPress={onSendInvites}
                    style={{
                        flex: 1,
                        minWidth: "30%",
                        backgroundColor: "#8B5CF6",
                        borderRadius: 16,
                        padding: 16,
                        alignItems: "center",
                        shadowColor: "#8B5CF6",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 4,
                    }}
                >
                    <MessageSquare size={24} color="#FFFFFF" strokeWidth={2} />
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF", marginTop: 8 }}>
                        Send Invites
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={onAddGuests}
                    style={{
                        flex: 1,
                        minWidth: "30%",
                        backgroundColor: "#FFFFFF",
                        borderRadius: 16,
                        padding: 16,
                        alignItems: "center",
                        borderWidth: 2,
                        borderColor: "#E5E7EB",
                    }}
                >
                    <UserPlus size={24} color="#8B5CF6" strokeWidth={2} />
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#374151", marginTop: 8 }}>
                        Add Guests
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={onShare}
                    style={{
                        flex: 1,
                        minWidth: "30%",
                        backgroundColor: "#FFFFFF",
                        borderRadius: 16,
                        padding: 16,
                        alignItems: "center",
                        borderWidth: 2,
                        borderColor: "#E5E7EB",
                    }}
                >
                    <Share2 size={24} color="#8B5CF6" strokeWidth={2} />
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#374151", marginTop: 8 }}>
                        Share
                    </Text>
                </TouchableOpacity>
                {onSendChildLink && (
                    <TouchableOpacity
                        onPress={onSendChildLink}
                        disabled={childLinkLoading}
                        style={{
                            flex: 1,
                            minWidth: "30%",
                            backgroundColor: "#06D6A0",
                            borderRadius: 16,
                            padding: 16,
                            alignItems: "center",
                            borderWidth: 0,
                        }}
                    >
                        {childLinkLoading ? (
                            <ActivityIndicator size="small" color="#065F46" />
                        ) : (
                            <Gift size={24} color="#065F46" strokeWidth={2} />
                        )}
                        <Text style={{ fontSize: 14, fontWeight: "700", color: "#065F46", marginTop: 8 }}>
                            Child link
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </Animated.View>
    );
}

