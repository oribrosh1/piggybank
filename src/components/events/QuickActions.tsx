import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { MessageSquare, UserPlus, Share2, Gift, Edit3, Users, Sparkles, Bell, Zap } from "lucide-react-native";

interface QuickActionsProps {
  delay?: number;
  onSendInvites?: () => void;
  onAddGuests?: () => void;
  onShare?: () => void;
  onSendChildLink?: () => void;
  childLinkLoading?: boolean;
  onEditEvent?: () => void;
  onViewGuestStats?: () => void;
  onOpenFeatures?: () => void;
  onOpenNotifications?: () => void;
}

const rowStyle = { flexDirection: "row" as const, gap: 8 };
const baseBtn = {
  flex: 1,
  borderRadius: 12,
  paddingVertical: 10,
  paddingHorizontal: 8,
  alignItems: "center" as const,
  justifyContent: "center" as const,
};
const primaryBtn = {
  ...baseBtn,
  backgroundColor: "#8B5CF6",
  shadowColor: "#8B5CF6",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 6,
  elevation: 3,
};
const secondaryBtn = {
  ...baseBtn,
  backgroundColor: "#FFFFFF",
  borderWidth: 1.5,
  borderColor: "#E5E7EB",
};
const tealBtn = {
  ...baseBtn,
  backgroundColor: "#0D9488",
  shadowColor: "#0D9488",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.22,
  shadowRadius: 5,
  elevation: 2,
};

export default function QuickActions({
  delay = 200,
  onSendInvites,
  onAddGuests,
  onShare,
  onSendChildLink,
  childLinkLoading = false,
  onEditEvent,
  onViewGuestStats,
  onOpenFeatures,
  onOpenNotifications,
}: QuickActionsProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      style={{ marginHorizontal: 24, marginTop: 12 }}
    >
      <Text style={{ fontSize: 11, fontWeight: "700", color: "#9CA3AF", marginBottom: 8, letterSpacing: 0.8 }}>
        QUICK ACTIONS
      </Text>
      <View style={rowStyle}>
        <TouchableOpacity onPress={onSendInvites} style={primaryBtn}>
          <MessageSquare size={18} color="#FFFFFF" strokeWidth={2} />
          <Text style={{ fontSize: 12, fontWeight: "700", color: "#FFFFFF", marginTop: 4 }} numberOfLines={1}>
            Send Invites
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onAddGuests} style={secondaryBtn}>
          <UserPlus size={18} color="#8B5CF6" strokeWidth={2} />
          <Text style={{ fontSize: 12, fontWeight: "700", color: "#374151", marginTop: 4 }} numberOfLines={1}>
            Add Guests
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onShare} style={secondaryBtn}>
          <Share2 size={18} color="#8B5CF6" strokeWidth={2} />
          <Text style={{ fontSize: 12, fontWeight: "700", color: "#374151", marginTop: 4 }} numberOfLines={1}>
            Share
          </Text>
        </TouchableOpacity>
      </View>
      <View style={[rowStyle, { marginTop: 8 }]}>
        {onViewGuestStats != null && (
          <TouchableOpacity onPress={onViewGuestStats} style={secondaryBtn}>
            <Users size={18} color="#8B5CF6" strokeWidth={2} />
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#374151", marginTop: 4 }} numberOfLines={1}>
              Guests stats
            </Text>
          </TouchableOpacity>
        )}
        {onOpenFeatures != null && (
          <TouchableOpacity onPress={onOpenFeatures} style={secondaryBtn}>
            <Zap size={18} color="#8B5CF6" strokeWidth={2} />
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#374151", marginTop: 4 }} numberOfLines={1}>
              Features
            </Text>
          </TouchableOpacity>
        )}
        {onOpenNotifications != null && (
          <TouchableOpacity onPress={onOpenNotifications} style={secondaryBtn}>
            <Bell size={18} color="#8B5CF6" strokeWidth={2} />
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#374151", marginTop: 4 }} numberOfLines={1}>
              Notifications
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}
