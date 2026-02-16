import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

type P = {
  onTestVerify: () => void;
  onTestAddBalance: (cents: number) => void;
  onTestCreateTransaction: () => void;
};

export default function BankingApprovedDevTest(p: P) {
  if (!__DEV__) return null;

  return (
    <View style={{ backgroundColor: "#FDF4FF", borderRadius: 16, padding: 20, marginTop: 20, borderWidth: 2, borderColor: "#E879F9", borderStyle: "dashed" }}>
      <Text style={{ fontSize: 14, fontWeight: "800", color: "#A21CAF", marginBottom: 12 }}>TEST MODE (Dev Only)</Text>
      <Text style={{ fontSize: 12, color: "#86198F", marginBottom: 16, fontWeight: "500" }}>
        If you see "transfers capability" errors, tap "Verify Account" first!
      </Text>
      <View style={{ gap: 10 }}>
        <TouchableOpacity onPress={p.onTestVerify} style={{ backgroundColor: "#059669", borderRadius: 10, paddingVertical: 12, alignItems: "center" }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>Verify Account for Testing</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={p.onTestCreateTransaction} style={{ backgroundColor: "#A21CAF", borderRadius: 10, paddingVertical: 12, alignItems: "center" }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>+ Add $25 Test Payment</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => p.onTestAddBalance(5000)} style={{ backgroundColor: "#7C3AED", borderRadius: 10, paddingVertical: 12, alignItems: "center" }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>+ Add $50 Test Balance</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => p.onTestAddBalance(10000)} style={{ backgroundColor: "#6366F1", borderRadius: 10, paddingVertical: 12, alignItems: "center" }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>+ Add $100 Test Balance</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
