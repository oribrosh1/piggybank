import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Calendar, Users, MapPin, ChevronRight } from "lucide-react-native";
import type { EventSummary } from "@/types/events";

interface HomeEventCardProps {
  event: EventSummary;
  getEventEmoji: (eventType: string) => string;
  formatDate: (dateString: string) => string;
  onPress: () => void;
}

export default function HomeEventCard({
  event,
  getEventEmoji,
  formatDate,
  onPress,
}: HomeEventCardProps) {
  const { added, invited, confirmed, paid } = event.guestStats;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        borderLeftWidth: 5,
        borderLeftColor: "#06D6A0",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text style={{ fontSize: 28, marginRight: 10 }}>
              {getEventEmoji(event.eventType)}
            </Text>
            <View
              style={{
                backgroundColor: "#D1FAE5",
                borderRadius: 8,
                paddingVertical: 4,
                paddingHorizontal: 10,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: "#059669",
                  textTransform: "uppercase",
                }}
              >
                {event.status}
              </Text>
            </View>
          </View>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "900",
              color: "#1F2937",
              marginBottom: 12,
            }}
          >
            {event.eventName}
          </Text>
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Calendar size={16} color="#6B7280" strokeWidth={2} />
              <Text
                style={{
                  fontSize: 14,
                  color: "#6B7280",
                  marginLeft: 8,
                  fontWeight: "600",
                }}
              >
                {formatDate(event.date)} at {event.time}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Users size={16} color="#6B7280" strokeWidth={2} />
              <Text
                style={{
                  fontSize: 14,
                  color: "#6B7280",
                  marginLeft: 8,
                  fontWeight: "600",
                }}
              >
                {event.totalGuests} guest{event.totalGuests !== 1 ? "s" : ""}{" "}
                added
              </Text>
            </View>
            {event.address1 && (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MapPin size={16} color="#6B7280" strokeWidth={2} />
                <Text
                  style={{
                    fontSize: 14,
                    color: "#6B7280",
                    marginLeft: 8,
                    fontWeight: "600",
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {event.address1}
                </Text>
              </View>
            )}
          </View>
        </View>
        <ChevronRight size={24} color="#D1D5DB" />
      </View>
      <View
        style={{
          flexDirection: "row",
          marginTop: 16,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: "#F3F4F6",
          justifyContent: "space-around",
        }}
      >
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: "900", color: "#6B7280" }}>
            {added}
          </Text>
          <Text style={{ fontSize: 10, color: "#9CA3AF", fontWeight: "600" }}>
            Added
          </Text>
        </View>
        <View style={{ width: 1, backgroundColor: "#E5E7EB" }} />
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: "900", color: "#3B82F6" }}>
            {invited}
          </Text>
          <Text style={{ fontSize: 10, color: "#9CA3AF", fontWeight: "600" }}>
            Invited
          </Text>
        </View>
        <View style={{ width: 1, backgroundColor: "#E5E7EB" }} />
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: "900", color: "#10B981" }}>
            {confirmed}
          </Text>
          <Text style={{ fontSize: 10, color: "#9CA3AF", fontWeight: "600" }}>
            Confirmed
          </Text>
        </View>
        <View style={{ width: 1, backgroundColor: "#E5E7EB" }} />
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: "900", color: "#F59E0B" }}>
            {paid}
          </Text>
          <Text style={{ fontSize: 10, color: "#9CA3AF", fontWeight: "600" }}>
            Paid
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
