import React from "react";
import { Text, TouchableOpacity } from "react-native";

type BankingApplePayButtonProps = { onPress?: () => void };

export default function BankingApplePayButton({ onPress }: BankingApplePayButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress ?? (() => alert("Add to Apple Pay Wallet"))}
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
  );
}
