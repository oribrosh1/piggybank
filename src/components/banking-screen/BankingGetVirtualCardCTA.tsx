import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { CreditCard, ArrowRight } from "lucide-react-native";

type P = { onPress: () => void };

export default function BankingGetVirtualCardCTA({ onPress }: P) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: "#8B5CF6",
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        shadowColor: "#8B5CF6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: "rgba(255,255,255,0.2)",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 14,
          }}
        >
          <CreditCard size={24} color="#FFFFFF" strokeWidth={2.5} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "800", color: "#FFFFFF", marginBottom: 4 }}>
            Get your virtual card
          </Text>
          <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", fontWeight: "500" }}>
            Create a virtual credit card to spend from your balance
          </Text>
        </View>
      </View>
      <ArrowRight size={22} color="#FFFFFF" strokeWidth={2.5} />
    </TouchableOpacity>
  );
}
