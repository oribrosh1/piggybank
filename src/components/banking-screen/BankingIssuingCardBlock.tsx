import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { CreditCard } from "lucide-react-native";
import type { GetIssuingBalanceResponse } from "@/src/lib/api";

type BankingIssuingCardBlockProps = {
  issuingBalance: GetIssuingBalanceResponse | null;
  toppingUp: boolean;
  creatingCard: boolean;
  onTopUp: (cents: number) => void;
  onCreateCard: () => void;
};

export default function BankingIssuingCardBlock(p: BankingIssuingCardBlockProps) {
  return (
    <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>
      <Text style={{ fontSize: 14, fontWeight: "800", color: "#6B3AA0", marginBottom: 12 }}>💳 CARD BALANCE (Issuing)</Text>
      <Text style={{ fontSize: 24, fontWeight: "800", color: "#111827", marginBottom: 16 }}>
        {p.issuingBalance != null ? p.issuingBalance.issuingAvailableFormatted : "—"}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        {[1000, 2500, 5000].map((cents) => (
          <TouchableOpacity
            key={cents}
            onPress={() => p.onTopUp(cents)}
            disabled={p.toppingUp}
            style={{ backgroundColor: p.toppingUp ? "#D1D5DB" : "#8B5CF6", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>+${(cents / 100).toFixed(0)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        onPress={p.onCreateCard}
        disabled={!p.issuingBalance?.canCreateCard || p.creatingCard}
        style={{
          backgroundColor: p.issuingBalance?.canCreateCard && !p.creatingCard ? "#06D6A0" : "#D1D5DB",
          borderRadius: 12,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {p.creatingCard ? <ActivityIndicator size="small" color="#FFFFFF" /> : <CreditCard size={18} color="#FFFFFF" strokeWidth={2.5} />}
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>
          {p.issuingBalance?.canCreateCard ? "Create virtual card" : "Add funds above to create card"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
