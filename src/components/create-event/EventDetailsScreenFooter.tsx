import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface EventDetailsScreenFooterProps {
  onContinue: () => void;
}

export default function EventDetailsScreenFooter({ onContinue }: EventDetailsScreenFooterProps) {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(16, insets.bottom + 4);
  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 12,
      }}
    >
      <TouchableOpacity
        onPress={onContinue}
        style={{
          backgroundColor: "#06D6A0",
          borderRadius: 20,
          paddingVertical: 20,
          alignItems: "center",
          shadowColor: "#06D6A0",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 20,
          elevation: 10,
          marginBottom: 14,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: "#FFFFFF", letterSpacing: 0.5 }}>
            Manage Your Guest List
          </Text>
          <View
            style={{
              marginLeft: 10,
              backgroundColor: "rgba(255, 255, 255, 0.3)",
              borderRadius: 14,
              width: 32,
              height: 32,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 18, color: "#FFFFFF" }}>→</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}
