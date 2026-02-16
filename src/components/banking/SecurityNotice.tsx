import React from "react";
import { View, Text } from "react-native";
import { Shield } from "lucide-react-native";

export default function SecurityNotice() {
  return (
    <View
      style={{
        backgroundColor: "#F0F9FF",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#BFDBFE",
        flexDirection: "row",
        alignItems: "flex-start",
      }}
    >
      <Shield size={20} color="#3B82F6" strokeWidth={2.5} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: "#1E40AF", marginBottom: 4 }}>
          Your Privacy Matters
        </Text>
        <Text style={{ fontSize: 12, color: "#3B82F6", lineHeight: 18 }}>
          Your document is encrypted and securely stored. We use bank-level security to protect your information.
        </Text>
      </View>
    </View>
  );
}
