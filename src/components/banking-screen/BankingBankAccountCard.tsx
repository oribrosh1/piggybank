import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { CreditCard } from "lucide-react-native";
import type { ExternalBankAccount } from "@/src/lib/api";

type BankingBankAccountCardProps = {
  externalAccounts: ExternalBankAccount[];
  onAddBank: () => void;
};

export default function BankingBankAccountCard({ externalAccounts, onAddBank }: BankingBankAccountCardProps) {
  const hasAccounts = externalAccounts && externalAccounts.length > 0;

  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 20,
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: "800", color: "#6B3AA0", marginBottom: 16 }}>🏦 LINKED BANK ACCOUNT</Text>
      {hasAccounts ? (
        externalAccounts.map((bank) => (
          <View
            key={bank.id}
            style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", borderRadius: 12, padding: 16 }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "#E0E7FF",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
              }}
            >
              <CreditCard size={24} color="#6366F1" strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827" }}>{bank.bank_name || "Bank Account"}</Text>
              <Text style={{ fontSize: 13, color: "#6B7280", fontWeight: "500", marginTop: 2 }}>
                ••••{bank.last4} • {bank.currency.toUpperCase()}
              </Text>
            </View>
            {bank.default_for_currency && (
              <View style={{ backgroundColor: "#D1FAE5", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: "#059669" }}>DEFAULT</Text>
              </View>
            )}
          </View>
        ))
      ) : (
        <View style={{ alignItems: "center", paddingVertical: 20 }}>
          <CreditCard size={36} color="#D1D5DB" strokeWidth={1.5} />
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#9CA3AF", marginTop: 10 }}>No bank account linked</Text>
          <Text style={{ fontSize: 11, color: "#D1D5DB", marginTop: 4, textAlign: "center" }}>Add a bank account to withdraw funds</Text>
          <TouchableOpacity
            onPress={onAddBank}
            style={{ backgroundColor: "#6B3AA0", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20, marginTop: 14 }}
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>Add Bank Account</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
