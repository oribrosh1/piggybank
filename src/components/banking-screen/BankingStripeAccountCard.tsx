import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Wallet, RefreshCw, Banknote, ArrowDownLeft, ArrowUpRight } from "lucide-react-native";
import type { Transaction } from "@/src/lib/api";

function txnTypeLabel(type: string): string {
  if (type === "charge") return "Payment";
  if (type === "payout") return "Withdrawal";
  if (type === "transfer") return "Transfer";
  return (type && type[0]) ? type[0].toUpperCase() + (type.slice(1) || "") : "";
}

type Props = {
  available: string;
  pending: string;
  transactions: Transaction[];
  loadingTransactions: boolean;
  onRefresh: () => void;
};

export default function BankingStripeAccountCard(props: Props) {
  const { available, pending, transactions, loadingTransactions, onRefresh } = props;
  const list = transactions.slice(0, 10);

  return (
    <View style={{ backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 2, borderColor: "rgba(255,255,255,0.2)" }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
        <Wallet size={22} color="#FFFFFF" strokeWidth={2.5} />
        <Text style={{ fontSize: 16, fontWeight: "800", color: "#FFFFFF", marginLeft: 10 }}>Stripe Connected Account</Text>
      </View>
      <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginBottom: 16, marginLeft: 32 }}>Balance and activity for your connected account</Text>
      <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 }}>
        <Text style={{ fontSize: 13, fontWeight: "800", color: "#6B3AA0", marginBottom: 12 }}>Balance</Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 24 }}>
          <View>
            <Text style={{ fontSize: 11, color: "#6B7280", fontWeight: "600" }}>Available</Text>
            <Text style={{ fontSize: 22, fontWeight: "800", color: "#10B981" }}>${available}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 11, color: "#6B7280", fontWeight: "600" }}>Pending</Text>
            <Text style={{ fontSize: 22, fontWeight: "800", color: "#F59E0B" }}>${pending}</Text>
          </View>
        </View>
      </View>
      <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: "800", color: "#6B3AA0" }}>All transactions</Text>
          <TouchableOpacity onPress={onRefresh}>
            <RefreshCw size={16} color="#6B3AA0" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
        {loadingTransactions ? (
          <ActivityIndicator size="small" color="#6B3AA0" style={{ marginVertical: 20 }} />
        ) : transactions.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 20 }}>
            <Banknote size={36} color="#D1D5DB" strokeWidth={1.5} />
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#9CA3AF", marginTop: 10 }}>No transactions yet</Text>
            <Text style={{ fontSize: 11, color: "#D1D5DB", marginTop: 4 }}>Payments and transfers will appear here</Text>
          </View>
        ) : (
          <View style={{ gap: 0 }}>
            {list.map((txn, index) => {
              const isLast = index === list.length - 1;
              return (
                <View key={txn.id} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: isLast ? 0 : 1, borderBottomColor: "#F3F4F6" }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: txn.amount >= 0 ? "#D1FAE5" : "#FEE2E2", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                    {txn.amount >= 0 ? <ArrowDownLeft size={18} color="#10B981" strokeWidth={2.5} /> : <ArrowUpRight size={18} color="#EF4444" strokeWidth={2.5} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#111827" }}>{txnTypeLabel(txn.type)}</Text>
                    <Text style={{ fontSize: 11, color: "#6B7280", fontWeight: "500" }}>{new Date(txn.created * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</Text>
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: "800", color: txn.amount >= 0 ? "#10B981" : "#EF4444" }}>{txn.amount >= 0 ? "+" : ""}${(Math.abs(txn.amount) / 100).toFixed(2)}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}
