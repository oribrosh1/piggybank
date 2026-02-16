import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function GiftCardsSection() {
  return (
    <View style={{ marginTop: 28 }}>
      <LinearGradient
        colors={["#0F172A", "#1E293B", "#334155"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 28, padding: 24, marginBottom: 16, overflow: "hidden" }}
      >
        <View style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(239, 68, 68, 0.15)" }} />
        <View style={{ position: "absolute", bottom: -30, left: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(251, 191, 36, 0.1)" }} />
        <View style={{ alignItems: "center" }}>
          <View style={{ backgroundColor: "rgba(239, 68, 68, 0.2)", borderRadius: 30, paddingVertical: 6, paddingHorizontal: 14, marginBottom: 12, borderWidth: 1, borderColor: "rgba(239, 68, 68, 0.3)" }}>
            <Text style={{ fontSize: 11, color: "#FCA5A5", fontWeight: "700", letterSpacing: 1.5 }}>💀 R.I.P. GIFT CARDS</Text>
          </View>
          <Text style={{ fontSize: 28, fontWeight: "900", color: "#FFFFFF", textAlign: "center", marginBottom: 8 }}>The End of an Era</Text>
          <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", textAlign: "center", fontWeight: "500" }}>Gift cards had their time.</Text>
        </View>
      </LinearGradient>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ textAlign: "center", fontSize: 13, fontWeight: "700", color: "#6B7280", marginBottom: 12, letterSpacing: 0.5 }}>📊 THE SHOCKING TRUTH</Text>
        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 24, padding: 24, marginBottom: 12, borderWidth: 1, borderColor: "#F3F4F6", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 48, fontWeight: "900", color: "#DC2626", marginBottom: 4 }}>$27B</Text>
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#1F2937" }}>in gift cards sit unused</Text>
              <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>in American drawers right now</Text>
            </View>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 40 }}>🗑️</Text>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: "#FEF3C7", borderRadius: 20, padding: 16 }}>
            <Text style={{ fontSize: 28, fontWeight: "900", color: "#B45309" }}>43%</Text>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#92400E", marginTop: 4 }}>have unused cards</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: "#DBEAFE", borderRadius: 20, padding: 16 }}>
            <Text style={{ fontSize: 28, fontWeight: "900", color: "#1D4ED8" }}>$244</Text>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#1E40AF", marginTop: 4 }}>avg. wasted balance</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: "#FCE7F3", borderRadius: 20, padding: 16 }}>
            <Text style={{ fontSize: 28, fontWeight: "900", color: "#BE185D" }}>56%</Text>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#9D174D", marginTop: 4 }}>used in 6 months</Text>
          </View>
        </View>
      </View>

      <View style={{ backgroundColor: "#1F2937", borderRadius: 16, padding: 16, marginBottom: 16, flexDirection: "row", alignItems: "center" }}>
        <Text style={{ fontSize: 28, marginRight: 12 }}>💬</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF", fontStyle: "italic" }}>"I have $50 in Target cards I'll never use..."</Text>
          <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>— Everyone, at some point</Text>
        </View>
      </View>

      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: "#FEF2F2", borderRadius: 20, padding: 16, borderWidth: 2, borderColor: "#FECACA" }}>
            <View style={{ alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 32 }}>🎁</Text>
              <View style={{ position: "absolute", top: 8, right: -8, width: 24, height: 24, borderRadius: 12, backgroundColor: "#DC2626", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 12, color: "#FFFFFF" }}>✕</Text>
              </View>
            </View>
            <Text style={{ fontSize: 14, fontWeight: "800", color: "#991B1B", textAlign: "center", marginBottom: 8 }}>Gift Cards</Text>
            {["1 store only", "~5% fee", "Often forgotten", "Can expire"].map((text, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: "#FECACA", alignItems: "center", justifyContent: "center", marginRight: 6 }}>
                  <Text style={{ fontSize: 9, color: "#DC2626" }}>✕</Text>
                </View>
                <Text style={{ fontSize: 12, color: "#991B1B", fontWeight: "500" }}>{text}</Text>
              </View>
            ))}
          </View>
          <View style={{ flex: 1, backgroundColor: "#ECFDF5", borderRadius: 20, padding: 16, borderWidth: 2, borderColor: "#A7F3D0" }}>
            <View style={{ alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 32 }}>💳</Text>
              <View style={{ position: "absolute", top: 8, right: -8, width: 24, height: 24, borderRadius: 12, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 10, color: "#FFFFFF" }}>✓</Text>
              </View>
            </View>
            <Text style={{ fontSize: 14, fontWeight: "800", color: "#065F46", textAlign: "center", marginBottom: 8 }}>CreditKid</Text>
            {["Use anywhere", "Only 3% fee", "Apple Pay ready", "Never expires"].map((text, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: "#A7F3D0", alignItems: "center", justifyContent: "center", marginRight: 6 }}>
                  <Text style={{ fontSize: 10, color: "#065F46" }}>✓</Text>
                </View>
                <Text style={{ fontSize: 12, color: "#065F46", fontWeight: "500" }}>{text}</Text>
              </View>
            ))}
          </View>
        </View>

        <LinearGradient colors={["#10B981", "#059669"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: 16, padding: 16, marginTop: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 20, marginRight: 10 }}>💡</Text>
            <View>
              <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF", textAlign: "center" }}>Give $25 of real freedom</Text>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", textAlign: "center" }}>Not $25 locked to one store</Text>
            </View>
          </View>
        </LinearGradient>

        <LinearGradient colors={["#7C3AED", "#5B21B6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 24, padding: 24, marginTop: 16, overflow: "hidden" }}>
          <View style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.1)" }} />
          <View style={{ position: "absolute", bottom: -20, left: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(255,255,255,0.05)" }} />
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <View style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, alignSelf: "flex-start", marginBottom: 10 }}>
                <Text style={{ fontSize: 10, fontWeight: "800", color: "#FFFFFF", letterSpacing: 1 }}>NOW THAT YOU KNOW 💡</Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: "900", color: "#FFFFFF", marginBottom: 6 }}>Save Your Loved Ones !</Text>
              <Text style={{ marginTop: 6, fontSize: 15, color: "rgba(255,255,255,0.8)", lineHeight: 18 }}>Every gift deserves to be used !</Text>
              <Text style={{ marginTop: 4, fontSize: 15, color: "rgba(255,255,255,0.8)", lineHeight: 18 }}>Not forgotten in a drawer...</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 36 }}>💜</Text>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
            <TouchableOpacity style={{ flex: 1, backgroundColor: "#FFFFFF", borderRadius: 14, paddingVertical: 14, alignItems: "center", flexDirection: "row", justifyContent: "center" }}>
              <Text style={{ fontSize: 16, marginRight: 8 }}>📱</Text>
              <Text style={{ fontSize: 14, fontWeight: "800", color: "#5B21B6" }}>Share App</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 14, paddingVertical: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" }}>
              <Text style={{ fontSize: 16, marginRight: 8 }}>💬</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>Tell a Friend</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}
