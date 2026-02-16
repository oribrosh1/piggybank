import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { DollarSign, Clock, ArrowUpRight } from "lucide-react-native";

type P = { available: string; pending: string; hasBalance: boolean; requestingPayout: boolean; onRequestPayout: () => void };

export default function BankingBalanceBreakdownCard(p: P) {
  return (
    <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>
      <Text style={{ fontSize: 14, fontWeight: "800", color: "#6B3AA0", marginBottom: 16 }}>💰 BALANCE BREAKDOWN</Text>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#D1FAE5", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
            <DollarSign size={18} color="#10B981" strokeWidth={2.5} />
          </View>
          <View>
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827" }}>Available</Text>
            <Text style={{ fontSize: 11, color: "#6B7280", fontWeight: "500" }}>Ready to spend or withdraw</Text>
          </View>
        </View>
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#10B981" }}>${p.available}</Text>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#FEF3C7", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
            <Clock size={18} color="#F59E0B" strokeWidth={2.5} />
          </View>
          <View>
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827" }}>Pending</Text>
            <Text style={{ fontSize: 11, color: "#6B7280", fontWeight: "500" }}>Processing (1-2 business days)</Text>
          </View>
        </View>
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#F59E0B" }}>${p.pending}</Text>
      </View>
      {p.hasBalance && (
        <TouchableOpacity onPress={p.onRequestPayout} disabled={p.requestingPayout} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: p.requestingPayout ? "#9CA3AF" : "#10B981", borderRadius: 12, paddingVertical: 14, marginTop: 16 }}>
          {p.requestingPayout ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <ArrowUpRight size={18} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF", marginLeft: 8 }}>Withdraw to Bank</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}
