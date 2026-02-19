import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Check } from "lucide-react-native";
import { Event } from "@/types/events";
import { routes } from "@/types/routes";
import { getEventTypeLabel, getEventCategoryLabel } from "./utils";

interface EventHeaderProps {
  event: Event;
  topInset: number;
}

export default function EventHeader({ event, topInset }: EventHeaderProps) {
  const router = useRouter();

  return (
    <View
      style={{
        backgroundColor: "#8B5CF6",
        paddingTop: topInset,
        paddingHorizontal: 24,
        paddingBottom: 30,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
      }}
    >
      <TouchableOpacity
        onPress={() => router.push(routes.tabs.myEvents)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 20,
          marginTop: 8,
        }}
      >
        <ChevronLeft size={24} color="#FFFFFF" strokeWidth={2.5} />
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF", marginLeft: 4 }}>
          My Events
        </Text>
      </TouchableOpacity>

      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.8)" }}>
          {getEventTypeLabel(event.eventType)}
        </Text>
        {event.eventCategory && (
          <>
            <Text style={{ color: "rgba(255,255,255,0.5)", marginHorizontal: 8 }}>•</Text>
            <Text style={{ fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.8)" }}>
              {getEventCategoryLabel(event.eventCategory)}
            </Text>
          </>
        )}
      </View>
      <Text style={{ fontSize: 28, fontWeight: "800", color: "#FFFFFF", marginBottom: 4 }}>
        {event.eventName}
      </Text>
      {event.age && (
        <Text style={{ fontSize: 18, fontWeight: "600", color: "rgba(255,255,255,0.9)" }}>
          Turning {event.age} 🎉
        </Text>
      )}
    </View>
  );
}
