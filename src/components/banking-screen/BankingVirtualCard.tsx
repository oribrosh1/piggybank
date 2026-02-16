import React from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { CreditCard, Eye, EyeOff, Copy } from "lucide-react-native";

type BankingVirtualCardProps = {
  cardScale: Animated.Value;
  cardOpacity: Animated.Value;
  cardVisible: boolean;
  availableBalance: string;
  onToggleVisibility: () => void;
  onCopyNumber: () => void;
};

export default function BankingVirtualCard(p: BankingVirtualCardProps) {
  return (
    <Animated.View style={{ transform: [{ scale: p.cardScale }], opacity: p.cardOpacity, marginBottom: 20 }}>
      <View
        style={{
          backgroundColor: "#06D6A0",
          borderRadius: 20,
          padding: 22,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 18,
          elevation: 10,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 32 }}>
          <Text style={{ fontSize: 17, fontWeight: "800", color: "#6B3AA0" }}>CreditKid Card</Text>
          <CreditCard size={22} color="#6B3AA0" strokeWidth={2.5} />
        </View>
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 11, color: "#4D2875", marginBottom: 8, fontWeight: "700" }}>CARD NUMBER</Text>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#6B3AA0", letterSpacing: 2 }}>
              {p.cardVisible ? "4242 4242 4242 4242" : "**** **** **** 4242"}
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity onPress={p.onToggleVisibility}>
                {p.cardVisible ? <EyeOff size={18} color="#6B3AA0" /> : <Eye size={18} color="#6B3AA0" />}
              </TouchableOpacity>
              <TouchableOpacity onPress={p.onCopyNumber}>
                <Copy size={18} color="#6B3AA0" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontSize: 11, color: "#4D2875", marginBottom: 4, fontWeight: "700" }}>VALID THRU</Text>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#6B3AA0" }}>{p.cardVisible ? "12/28" : "**/**"}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 11, color: "#4D2875", marginBottom: 4, fontWeight: "700" }}>CVV</Text>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#6B3AA0" }}>{p.cardVisible ? "123" : "***"}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 11, color: "#4D2875", marginBottom: 4, fontWeight: "700" }}>BALANCE</Text>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#6B3AA0" }}>${p.availableBalance}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
