import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface IdentityVerificationFooterProps {
  hasDocument: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

export default function IdentityVerificationFooter({
  hasDocument,
  onSubmit,
  onBack,
}: IdentityVerificationFooterProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: insets.bottom + 16,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
      }}
    >
      <TouchableOpacity
        onPress={onSubmit}
        style={{
          backgroundColor: "#8B5CF6",
          borderRadius: 16,
          paddingVertical: 18,
          alignItems: "center",
          shadowColor: "#8B5CF6",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
          elevation: 8,
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 17, fontWeight: "800", color: "#FFFFFF", letterSpacing: 0.5 }}>
            {hasDocument ? "Submit & Continue" : "Complete Setup"}
          </Text>
          <View
            style={{
              marginLeft: 8,
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: 12,
              padding: 4,
            }}
          >
            <Text style={{ fontSize: 16 }}>→</Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onBack}
        style={{
          backgroundColor: "#F9FAFB",
          borderRadius: 16,
          paddingVertical: 16,
          alignItems: "center",
          borderWidth: 1.5,
          borderColor: "#E5E7EB",
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#6B7280", letterSpacing: 0.3 }}>
          ← Go Back
        </Text>
      </TouchableOpacity>
    </View>
  );
}
