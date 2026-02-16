import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import {
  CreditCard,
  CheckCircle,
  ArrowRight,
  Wallet,
  RefreshCw,
  Banknote,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Clock,
  AlertCircle,
} from "lucide-react-native";
import type { Router } from "expo-router";
import { routes } from "@/types/routes";
import type { GetBalanceResponse, GetAccountDetailsResponse, GetIssuingBalanceResponse } from "@/src/lib/api";
import type { Transaction, Payout } from "@/src/lib/api";

type BankingApprovedContentProps = {
  router: Router;
  accountDetails: GetAccountDetailsResponse | null;
  balanceData: GetBalanceResponse | null;
  issuingBalance: GetIssuingBalanceResponse | null;
  transactions: Transaction[];
  payouts: Payout[];
  loadingTransactions: boolean;
  requestingPayout: boolean;
  toppingUp: boolean;
  creatingCard: boolean;
  onRefresh: () => void;
  onTopUp: (cents: number) => void;
  onCreateCard: () => void;
  onRequestPayout: () => void;
  onTestVerify: () => void;
  onTestAddBalance: (cents: number) => void;
  onTestCreateTransaction: () => void;
};

function formatBalance(balanceData: GetBalanceResponse | null, key: "available" | "pending"): string {
  const arr = balanceData?.[key];
  return arr?.[0] ? (arr[0].amount / 100).toFixed(2) : "0.00";
}

function txnTypeLabel(type: string): string {
  if (type === "charge") return "Payment";
  if (type === "payout") return "Withdrawal";
  if (type === "transfer") return "Transfer";
  return type?.charAt(0).toUpperCase() + (type?.slice(1) || "");
}

export default function BankingApprovedContent(p: BankingApprovedContentProps) {
  const available = formatBalance(p.balanceData, "available");
  const pending = formatBalance(p.balanceData, "pending");
  const hasBalance = (p.balanceData?.available?.[0]?.amount ?? 0) > 0;

  return (
    <View>
      <TouchableOpacity
        onPress={() => alert("Add to Apple Pay Wallet")}
        style={{
          backgroundColor: "#000000",
          borderRadius: 14,
          paddingVertical: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "800", color: "#FFFFFF", marginRight: 8 }}>Add to{"\n"}Apple Pay</Text>
        <Text style={{ fontSize: 24, marginLeft: 6 }}>📱</Text>
      </TouchableOpacity>

      <View style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", borderRadius: 14, padding: 16, borderWidth: 2, borderColor: "rgba(16, 185, 129, 0.3)", marginBottom: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <CheckCircle size={18} color="#10B981" strokeWidth={2.5} />
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF", marginLeft: 10 }}>Account Verified! 🎉</Text>
        </View>
        <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.95)", lineHeight: 18, fontWeight: "500" }}>
          Your identity is verified by Stripe. You can now receive payments and use your card anywhere!
        </Text>
      </View>

      {!p.accountDetails?.virtualCardId && (
        <TouchableOpacity
          onPress={() => p.router.push(routes.banking.setup.issuingCard)}
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
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
              <CreditCard size={24} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: "#FFFFFF", marginBottom: 4 }}>Get your virtual card</Text>
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", fontWeight: "500" }}>Create a virtual credit card to spend from your balance</Text>
            </View>
          </View>
          <ArrowRight size={22} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      )}

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
            <TouchableOpacity onPress={p.onRefresh}>
              <RefreshCw size={16} color="#6B3AA0" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          {p.loadingTransactions ? (
            <ActivityIndicator size="small" color="#6B3AA0" style={{ marginVertical: 20 }} />
          ) : p.transactions.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <Banknote size={36} color="#D1D5DB" strokeWidth={1.5} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#9CA3AF", marginTop: 10 }}>No transactions yet</Text>
              <Text style={{ fontSize: 11, color: "#D1D5DB", marginTop: 4 }}>Payments and transfers will appear here</Text>
            </View>
          ) : (
            <View style={{ gap: 0 }}>
              {p.transactions.slice(0, 10).map((txn, index) => (
                <View
                  key={txn.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    borderBottomWidth: index < Math.min(p.transactions.length, 10) - 1 ? 1 : 0,
                    borderBottomColor: "#F3F4F6",
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: txn.amount >= 0 ? "#D1FAE5" : "#FEE2E2",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    {txn.amount >= 0 ? <ArrowDownLeft size={18} color="#10B981" strokeWidth={2.5} /> : <ArrowUpRight size={18} color="#EF4444" strokeWidth={2.5} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#111827" }}>{txnTypeLabel(txn.type)}</Text>
                    <Text style={{ fontSize: 11, color: "#6B7280", fontWeight: "500" }}>
                      {new Date(txn.created * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: "800", color: txn.amount >= 0 ? "#10B981" : "#EF4444" }}>
                    {txn.amount >= 0 ? "+" : ""}${(Math.abs(txn.amount) / 100).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

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
          <Text style={{ fontSize: 18, fontWeight: "800", color: "#10B981" }}>${available}</Text>
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
          <Text style={{ fontSize: 18, fontWeight: "800", color: "#F59E0B" }}>${pending}</Text>
        </View>
        {hasBalance && (
          <TouchableOpacity
            onPress={p.onRequestPayout}
            disabled={p.requestingPayout}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: p.requestingPayout ? "#9CA3AF" : "#10B981",
              borderRadius: 12,
              paddingVertical: 14,
              marginTop: 16,
            }}
          >
            {p.requestingPayout ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ArrowUpRight size={18} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF", marginLeft: 8 }}>Withdraw to Bank</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, marginBottom: 20 }}>
        <Text style={{ fontSize: 14, fontWeight: "800", color: "#6B3AA0", marginBottom: 16 }}>🏦 LINKED BANK ACCOUNT</Text>
        {p.accountDetails?.external_accounts && p.accountDetails.external_accounts.length > 0 ? (
          p.accountDetails.external_accounts.map((bank) => (
            <View key={bank.id} style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", borderRadius: 12, padding: 16 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#E0E7FF", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                <CreditCard size={24} color="#6366F1" strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827" }}>{bank.bank_name || "Bank Account"}</Text>
                <Text style={{ fontSize: 13, color: "#6B7280", fontWeight: "500", marginTop: 2 }}>••••{bank.last4} • {bank.currency.toUpperCase()}</Text>
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
              onPress={() => p.router.push(routes.banking.setup.personalInfo)}
              style={{ backgroundColor: "#6B3AA0", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20, marginTop: 14 }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>Add Bank Account</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {p.accountDetails?.requirements?.currently_due && p.accountDetails.requirements.currently_due.length > 0 && (
        <View style={{ backgroundColor: "#FEF3C7", borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 2, borderColor: "#FCD34D" }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <AlertCircle size={20} color="#F59E0B" strokeWidth={2.5} />
            <Text style={{ fontSize: 14, fontWeight: "800", color: "#92400E", marginLeft: 10 }}>Action Required</Text>
          </View>
          <Text style={{ fontSize: 12, color: "#92400E", lineHeight: 18, fontWeight: "500", marginBottom: 12 }}>
            Complete the following to enable full account features:
          </Text>
          {p.accountDetails.requirements.currently_due.map((req, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#F59E0B", marginRight: 8 }} />
              <Text style={{ fontSize: 12, color: "#92400E", fontWeight: "500" }}>{req.replace(/_/g, " ").replace(/\./g, " > ")}</Text>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => p.router.push(routes.banking.setup.personalInfo)}
            style={{ backgroundColor: "#F59E0B", borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 12 }}
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>Complete Verification</Text>
          </TouchableOpacity>
        </View>
      )}

      {p.payouts.length > 0 && (
        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: "800", color: "#6B3AA0", marginBottom: 16 }}>💸 PAYOUT HISTORY</Text>
          <View style={{ gap: 10 }}>
            {p.payouts.map((payout, index) => (
              <View
                key={payout.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 10,
                  borderBottomWidth: index < p.payouts.length - 1 ? 1 : 0,
                  borderBottomColor: "#F3F4F6",
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor:
                      payout.status === "paid" ? "#D1FAE5" : payout.status === "pending" ? "#FEF3C7" : payout.status === "failed" ? "#FEE2E2" : "#F3F4F6",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <ArrowUpRight
                    size={16}
                    color={
                      payout.status === "paid" ? "#10B981" : payout.status === "pending" ? "#F59E0B" : payout.status === "failed" ? "#EF4444" : "#6B7280"
                    }
                    strokeWidth={2.5}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#111827" }}>Withdrawal to Bank</Text>
                  <Text style={{ fontSize: 11, color: "#6B7280", fontWeight: "500" }}>
                    {payout.status === "paid" ? "Completed" : payout.status === "pending" ? "Processing" : payout.status === "in_transit" ? "In Transit" : payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                    {" • "}
                    {new Date(payout.created * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "800",
                    color: payout.status === "paid" ? "#10B981" : payout.status === "pending" ? "#F59E0B" : "#111827",
                  }}
                >
                  ${(payout.amount / 100).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {__DEV__ && (
        <View style={{ backgroundColor: "#FDF4FF", borderRadius: 16, padding: 20, marginTop: 20, borderWidth: 2, borderColor: "#E879F9", borderStyle: "dashed" }}>
          <Text style={{ fontSize: 14, fontWeight: "800", color: "#A21CAF", marginBottom: 12 }}>🧪 TEST MODE (Dev Only)</Text>
          <Text style={{ fontSize: 12, color: "#86198F", marginBottom: 16, fontWeight: "500" }}>
            If you see "transfers capability" errors, tap "Verify Account" first!
          </Text>
          <View style={{ gap: 10 }}>
            <TouchableOpacity onPress={p.onTestVerify} style={{ backgroundColor: "#059669", borderRadius: 10, paddingVertical: 12, alignItems: "center" }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>✅ Verify Account for Testing</Text>
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
      )}
    </View>
  );
}
