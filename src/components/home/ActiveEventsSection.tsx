import React from "react";
import { View, Text } from "react-native";
import type { EventSummary } from "@/types/events";
import HomeEventCard from "./EventCard";

interface ActiveEventsSectionProps {
  events: EventSummary[];
  getEventEmoji: (eventType: string) => string;
  formatDate: (dateString: string) => string;
  onEventPress: (eventId: string) => void;
}

export default function ActiveEventsSection({
  events,
  getEventEmoji,
  formatDate,
  onEventPress,
}: ActiveEventsSectionProps) {
  if (events.length === 0) return null;

  return (
    <View style={{ marginBottom: 24 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#1F2937" }}>
          Active Events
        </Text>
        <View
          style={{
            backgroundColor: "#D1FAE5",
            borderRadius: 12,
            paddingVertical: 4,
            paddingHorizontal: 10,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "700", color: "#059669" }}>
            {events.length}
          </Text>
        </View>
      </View>
      <View style={{ gap: 16 }}>
        {events.map((event) => (
          <HomeEventCard
            key={event.id}
            event={event}
            getEventEmoji={getEventEmoji}
            formatDate={formatDate}
            onPress={() => onEventPress(event.id)}
          />
        ))}
      </View>
    </View>
  );
}
