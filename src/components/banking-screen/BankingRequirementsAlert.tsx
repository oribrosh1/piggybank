import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { AlertCircle } from "lucide-react-native";

type P = { currentlyDue: string[]; onCompleteVerification: () => void };

export default function BankingRequirementsAlert({ currentlyDue, onCompleteVerification }: P) {
  if (!currentlyDue || currentlyDue.length === 0) return null;

  return (
    <View style={{ backgroundColor: "#FEF3C7", borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 2, borderColor: "#FCD34D" }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <AlertCircle size={20} color="#F59E0B" strokeWidth={2.5} />
        <Text style={{ fontSize: 14, fontWeight: "800", color: "#92400E", marginLeft: 10 }}>Action Required</Text>
      </View>
      <Text style={{ fontSize: 12, color: "#92400E", lineHeight: 18, fontWeight: "500", marginBottom: 12 }}>
        Complete the following to enable full account features:
      </Text>
      {currentlyDue.map((req, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#F59E0B", marginRight: 8 }} />
          <Text style={{ fontSize: 12, color: "#92400E", fontWeight: "500" }}>{req.replace(/_/g, " ").replace(/\./g, " > ")}</Text>
        </View>
      ))}
      <TouchableOpacity onPress={onCompleteVerification} style={{ backgroundColor: "#F59E0B", borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>Complete Verification</Text>
      </TouchableOpacity>
    </View>
  );
}
