import React from "react";
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles, CreditCard, Smartphone, Wallet, Zap } from "lucide-react-native";

export default function VirtualCardFeature() {
  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
        <Sparkles size={20} color="#8B5CF6" strokeWidth={2.5} />
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#1F2937", marginLeft: 8 }}>
          What You Can Do
        </Text>
      </View>
      <View style={{ gap: 12 }}>
        <LinearGradient
          colors={["#1F2937", "#111827"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 24, padding: 24, overflow: "hidden" }}
        >
          <View style={{ position: "absolute", top: -30, right: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(139, 92, 246, 0.15)" }} />
          <View style={{ position: "absolute", bottom: -20, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(251, 191, 36, 0.1)" }} />
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <LinearGradient colors={["#8B5CF6", "#6D28D9"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, flexDirection: "row", alignItems: "center" }}>
              <Zap size={12} color="#FFFFFF" strokeWidth={3} />
              <Text style={{ fontSize: 11, fontWeight: "800", color: "#FFFFFF", marginLeft: 4 }}>MAIN FEATURE</Text>
            </LinearGradient>
          </View>
          <View style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.1)" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <View>
                <Text style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.6)", fontWeight: "600", letterSpacing: 1 }}>VIRTUAL CARD</Text>
                <Text style={{ fontSize: 20, fontWeight: "900", color: "#FFFFFF", marginTop: 4 }}>CreditKid</Text>
              </View>
              <View style={{ width: 44, height: 28, backgroundColor: "#FBBF24", borderRadius: 6, alignItems: "center", justifyContent: "center" }}>
                <CreditCard size={18} color="#1F2937" strokeWidth={2.5} />
              </View>
            </View>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#FFFFFF", letterSpacing: 3, marginBottom: 16 }}>•••• •••• •••• 4289</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View>
                <Text style={{ fontSize: 9, color: "rgba(255, 255, 255, 0.5)", fontWeight: "600" }}>BALANCE</Text>
                <Text style={{ fontSize: 14, color: "#10B981", fontWeight: "800" }}>$150.00</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 9, color: "rgba(255, 255, 255, 0.5)", fontWeight: "600" }}>VALID THRU</Text>
                <Text style={{ fontSize: 14, color: "#FFFFFF", fontWeight: "700" }}>12/28</Text>
              </View>
            </View>
          </View>
          <Text style={{ fontSize: 22, fontWeight: "900", color: "#FFFFFF", marginBottom: 8 }}>Your Virtual Debit Card</Text>
          <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.7)", fontWeight: "500", lineHeight: 20, marginBottom: 20 }}>
            Spend your gifts anywhere! Get a virtual card instantly and add it to Apple Pay for contactless payments.
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1, backgroundColor: "rgba(255, 255, 255, 0.1)", borderRadius: 12, padding: 12, alignItems: "center" }}>
              <Smartphone size={20} color="#FBBF24" strokeWidth={2.5} />
              <Text style={{ fontSize: 11, color: "#FFFFFF", fontWeight: "700", marginTop: 6, textAlign: "center" }}>Apple Pay</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: "rgba(255, 255, 255, 0.1)", borderRadius: 12, padding: 12, alignItems: "center" }}>
              <Wallet size={20} color="#10B981" strokeWidth={2.5} />
              <Text style={{ fontSize: 11, color: "#FFFFFF", fontWeight: "700", marginTop: 6, textAlign: "center" }}>Instant Access</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: "rgba(255, 255, 255, 0.1)", borderRadius: 12, padding: 12, alignItems: "center" }}>
              <Zap size={20} color="#8B5CF6" strokeWidth={2.5} />
              <Text style={{ fontSize: 11, color: "#FFFFFF", fontWeight: "700", marginTop: 6, textAlign: "center" }}>Pay Anywhere</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}
