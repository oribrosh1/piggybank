import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Clock, CheckCircle, Shield } from "lucide-react-native";

const STEPS = [
  { label: "Personal info received", done: true, emoji: "📝" },
  { label: "ID document uploaded", done: true, emoji: "🆔" },
  { label: "Identity verification", done: false, emoji: "🔍" },
  { label: "Account approval", done: false, emoji: "✅" },
];

type BankingPendingSectionProps = { onRefresh: () => void };

export default function BankingPendingSection({ onRefresh }: BankingPendingSectionProps) {
  return (
    <View>
      <View style={{ backgroundColor: "#FFFFFF", borderRadius: 24, padding: 24, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 }}>
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 6, borderColor: "#10B981" }}>
            <Clock size={48} color="#10B981" strokeWidth={2} />
          </View>
          <Text style={{ fontSize: 22, fontWeight: "900", color: "#111827", marginBottom: 8, textAlign: "center" }}>Verification in progress</Text>
          <Text style={{ fontSize: 14, color: "#6B7280", fontWeight: "600", textAlign: "center", lineHeight: 20, marginBottom: 16 }}>
            Stripe is verifying your account. Pull to refresh to check status.
          </Text>
          <TouchableOpacity onPress={onRefresh} style={{ paddingVertical: 12, paddingHorizontal: 24, backgroundColor: "#10B981", borderRadius: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>Check status</Text>
          </TouchableOpacity>
        </View>
        <View style={{ backgroundColor: "#F9FAFB", borderRadius: 16, padding: 18, marginBottom: 20 }}>
          <Text style={{ fontSize: 13, fontWeight: "800", color: "#111827", marginBottom: 14, letterSpacing: 0.5 }}>VERIFICATION PROGRESS</Text>
          <View style={{ gap: 14 }}>
            {STEPS.map((step, index) => (
              <View key={index} style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: step.done ? "#10B981" : "#E5E7EB",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  {step.done ? <CheckCircle size={18} color="#FFFFFF" strokeWidth={3} /> : <Text style={{ fontSize: 16 }}>{step.emoji}</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: step.done ? "700" : "600", color: step.done ? "#059669" : "#6B7280" }}>{step.label}</Text>
                </View>
                {step.done && (
                  <View style={{ backgroundColor: "#D1FAE5", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: "#059669" }}>DONE</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
        <View style={{ backgroundColor: "#ECFDF5", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", borderWidth: 2, borderColor: "#A7F3D0" }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
            <Text style={{ fontSize: 20 }}>⚡</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "800", color: "#065F46", marginBottom: 4 }}>Fast Verification! ⚡</Text>
            <Text style={{ fontSize: 12, color: "#047857", fontWeight: "600" }}>Your account will be ready in just ~5 minutes!</Text>
          </View>
        </View>
      </View>
      <View style={{ backgroundColor: "rgba(139, 92, 246, 0.1)", borderRadius: 20, padding: 20, marginBottom: 30, borderWidth: 2, borderColor: "rgba(139, 92, 246, 0.2)" }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#8B5CF6", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
            <Shield size={20} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#FFFFFF", marginBottom: 8 }}>Why KYC is Required? 🔐</Text>
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.95)", lineHeight: 20, fontWeight: "500", marginBottom: 14 }}>
              Federal law requires identity verification for anyone receiving a payment card. This protects you and ensures compliance.
            </Text>
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 16, marginRight: 8 }}>✅</Text>
                <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: "600" }}>Secure Stripe verification</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 16, marginRight: 8 }}>🔒</Text>
                <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: "600" }}>Your data is encrypted</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 16, marginRight: 8 }}>⚡</Text>
                <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: "600" }}>One-time verification only</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
