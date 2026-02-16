import React from "react";
import { View, Text } from "react-native";
import { CheckCircle } from "lucide-react-native";

export default function BankingVerifiedMessage() {
  return (
    <View
      style={{
        backgroundColor: "rgba(16, 185, 129, 0.15)",
        borderRadius: 14,
        padding: 16,
        borderWidth: 2,
        borderColor: "rgba(16, 185, 129, 0.3)",
        marginBottom: 20,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
        <CheckCircle size={18} color="#10B981" strokeWidth={2.5} />
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF", marginLeft: 10 }}>
          Account Verified! 🎉
        </Text>
      </View>
      <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.95)", lineHeight: 18, fontWeight: "500" }}>
        Your identity is verified by Stripe. You can now receive payments and use your card anywhere!
      </Text>
    </View>
  );
}
