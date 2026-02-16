import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Calendar, CreditCard } from "lucide-react-native";

interface QuickActionsProps {
  eventsCount: number;
  creditLabel: string;
  loading: boolean;
  onMyEvents: () => void;
  onBanking: () => void;
}

const cardStyle = {
  flex: 1 as const,
  backgroundColor: "#FFFFFF",
  borderRadius: 20,
  padding: 20,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
  elevation: 4,
};

export default function QuickActions({
  eventsCount,
  creditLabel,
  loading,
  onMyEvents,
  onBanking,
}: QuickActionsProps) {
  return (
    <View style={{ flexDirection: "row", gap: 16, marginBottom: 24 }}>
      <TouchableOpacity onPress={onMyEvents} style={cardStyle}>
        <View style={{ backgroundColor: "#F3F4F6", borderRadius: 12, padding: 10, alignSelf: "flex-start", marginBottom: 12 }}>
          <Calendar color="#FBBF24" size={24} strokeWidth={2.5} />
        </View>
        <Text style={{ fontSize: 16, fontWeight: "800", color: "#1F2937", marginBottom: 4 }}>My Events</Text>
        <Text style={{ fontSize: 13, color: "#6B7280", fontWeight: "500" }}>
          {loading ? "..." : `${eventsCount} event${eventsCount !== 1 ? "s" : ""}`}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onBanking} style={cardStyle}>
        <View style={{ backgroundColor: "#F3F4F6", borderRadius: 12, padding: 10, alignSelf: "flex-start", marginBottom: 12 }}>
          <CreditCard color="#FBBF24" size={24} strokeWidth={2.5} />
        </View>
        <Text style={{ fontSize: 16, fontWeight: "800", color: "#1F2937", marginBottom: 4 }}>Credit</Text>
        <Text style={{ fontSize: 13, color: "#6B7280", fontWeight: "500" }}>{creditLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}
