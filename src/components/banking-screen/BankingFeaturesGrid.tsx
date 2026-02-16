import React from "react";
import { View, Text } from "react-native";

const FEATURES = [
  { emoji: "💵", title: "GET YOUR GIFTS", subtitle: "Friends pay you instantly!" },
  { emoji: "🎮", title: "SPEND ANYWHERE", subtitle: "Use your money worldwide!" },
  { emoji: "🔒", title: "SUPER SAFE", subtitle: "Your money protected!" },
];

export default function BankingFeaturesGrid() {
  return (
    <>
      <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF", marginBottom: 12 }}>WHAT YOU CAN DO ✨</Text>
      <View style={{ gap: 12 }}>
        {FEATURES.map((f, i) => (
          <View key={i} style={{ flexDirection: "row", backgroundColor: "#06D6A0", borderRadius: 12, padding: 12, gap: 12 }}>
            <Text style={{ fontSize: 28 }}>{f.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#6B3AA0" }}>{f.title}</Text>
              <Text style={{ fontSize: 11, color: "#4D2875", marginTop: 2, fontWeight: "500" }}>{f.subtitle}</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}
