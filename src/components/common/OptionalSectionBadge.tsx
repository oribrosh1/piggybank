import React from "react";
import { Platform, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles } from "lucide-react-native";
import { colors, primaryGradient } from "@/src/theme";

/**
 * Compact label for optional create-flow sections (catering, photo, etc.).
 */
export default function OptionalSectionBadge() {
  return (
    <View
      style={{
        borderRadius: 999,
        overflow: "hidden",
        ...Platform.select({
          ios: {
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.18,
            shadowRadius: 6,
          },
          android: { elevation: 3 },
        }),
      }}
    >
      <LinearGradient
        colors={primaryGradient.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          paddingHorizontal: 11,
          paddingVertical: 5,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.45)",
        }}
      >
        <Sparkles size={13} color="#FFFFFF" strokeWidth={2.4} />
        <Text
          style={{
            fontSize: 8,
            fontWeight: "800",
            // letterSpacing: 1.25,
            color: "#FFFFFF",
            textTransform: "uppercase",
            textShadowColor: "rgba(107, 56, 212, 0.35)",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}
        >
          Optional
        </Text>
      </LinearGradient>
    </View>
  );
}
