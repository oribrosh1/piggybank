import React from "react";
import { View, Text, ActivityIndicator } from "react-native";

type BankingBalanceCardProps = {
  loading: boolean;
  balanceTotalFormatted: string;
  kycStatus: "no_account" | "pending" | "approved" | "rejected";
};

export default function BankingBalanceCard(p: BankingBalanceCardProps) {
  const subtitle =
    p.kycStatus === "approved" ? "Ready to earn! 🚀" : p.kycStatus === "pending" ? "Verification in progress ⏳" : "Set up credit to start! ";
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 24, marginBottom: 0, backgroundColor: "#F0FFFE" }}>
      <View style={{ backgroundColor: "#FFFFFF", borderRadius: 24, padding: 24, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>
        <Text style={{ fontSize: 14, color: "#06D6A0", fontWeight: "700", marginBottom: 8 }}>💎 YOUR TOTAL BALANCE</Text>
        {p.loading ? (
          <ActivityIndicator size="large" color="#06D6A0" style={{ marginVertical: 20 }} />
        ) : (
          <Text style={{ fontSize: 48, fontWeight: "800", color: "#06D6A0", marginBottom: 12 }}>${p.balanceTotalFormatted}</Text>
        )}
        <View style={{ height: 6, backgroundColor: "#E0F7F4", borderRadius: 3, overflow: "hidden" }}>
          <View style={{ height: "100%", width: "0%", backgroundColor: "#06D6A0" }} />
        </View>
        <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 8, fontWeight: "500" }}>{subtitle}</Text>
      </View>
    </View>
  );
}
