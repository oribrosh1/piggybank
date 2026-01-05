import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { MessageSquare, UserPlus, Share2 } from "lucide-react-native";

interface QuickActionsProps {
    delay?: number;
    onSendInvites?: () => void;
    onAddGuests?: () => void;
    onShare?: () => void;
}

export default function QuickActions({
    delay = 200,
    onSendInvites,
    onAddGuests,
    onShare,
}: QuickActionsProps) {
    return (
        <Animated.View
            entering={FadeInDown.delay(delay).duration(400)}
            style={{ marginHorizontal: 24, marginTop: 20 }}
        >
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#9CA3AF", marginBottom: 12, letterSpacing: 1 }}>
                QUICK ACTIONS
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                    onPress={onSendInvites}
                    style={{
                        flex: 1,
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
            </View>
        </Animated.View>
    );
}

