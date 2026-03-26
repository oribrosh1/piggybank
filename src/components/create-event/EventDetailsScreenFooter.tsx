import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronRight } from "lucide-react-native";
import { FOREST_DEEP } from "./designInviteTheme";

interface EventDetailsScreenFooterProps {
  onContinue: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export default function EventDetailsScreenFooter({ onContinue, loading, disabled }: EventDetailsScreenFooterProps) {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(16, insets.bottom + 8);
  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 10,
      }}
    >
      <TouchableOpacity
        onPress={onContinue}
        disabled={disabled || loading}
        style={{
          backgroundColor: FOREST_DEEP,
          borderRadius: 28,
          paddingVertical: 18,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
          gap: 8,
          opacity: disabled || loading ? 0.6 : 1,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Text style={{ fontSize: 17, fontWeight: "800", color: "#FFFFFF", letterSpacing: 0.3 }}>Next: Choose poster</Text>
            <ChevronRight size={22} color="#FFFFFF" strokeWidth={2.5} />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}
