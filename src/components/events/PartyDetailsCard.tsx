import React from "react";
import { View, Text } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { PartyPopper, Sparkles } from "lucide-react-native";
import { Event } from "@/types/events";
import { getPartyTypeDisplayLabel } from "@/src/constants/partyTypeOptions";

interface PartyDetailsCardProps {
  event: Event;
  delay?: number;
}

export default function PartyDetailsCard({
  event,
  delay = 400,
}: PartyDetailsCardProps) {
  // Don't render if no party details
  if (!event.partyType && !event.dressCode?.trim() && !event.theme) {
    return null;
  }

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
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}
      >
        <PartyPopper size={20} color="#F59E0B" strokeWidth={2} />
        <Text
          style={{
            fontSize: 18,
            fontWeight: "800",
            color: "#111827",
            marginLeft: 10,
          }}
        >
          Party Details
        </Text>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {(event.partyType || event.theme?.trim()) && (
          <View
            style={{
              backgroundColor: "#FEF3C7",
              borderRadius: 12,
              paddingVertical: 8,
              paddingHorizontal: 14,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#92400E" }}>
              🎊{" "}
              {getPartyTypeDisplayLabel(
                event.partyType,
                event.otherPartyType,
                event.theme,
              )}
            </Text>
          </View>
        )}
        {event.dressCode?.trim() ? (
          <View
            style={{
              backgroundColor: "#EDE9FE",
              borderRadius: 12,
              paddingVertical: 8,
              paddingHorizontal: 14,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#6D28D9" }}>
              👔 {event.dressCode}
            </Text>
          </View>
        ) : null}
      </View>

      {event.theme?.trim() && event.partyType ? (
        <View style={{ marginTop: 16 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <Sparkles size={16} color="#EC4899" strokeWidth={2} />
            <Text
              style={{
                fontSize: 12,
                color: "#9CA3AF",
                fontWeight: "600",
                marginLeft: 6,
              }}
            >
              Theme
            </Text>
          </View>
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827" }}>
            {event.theme}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}
