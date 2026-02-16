import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { AlertCircle, RefreshCw } from "lucide-react-native";

type P = { onTryAgain: () => void };

export default function BankingRejectedSection(p: P) {
  return (
    <View>
      <View style={{ backgroundColor: "#FEE2E2", borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 2, borderColor: "#FCA5A5" }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center" }}>
            <AlertCircle size={22} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#7F1D1D", marginBottom: 4 }}>Verification Failed</Text>
            <Text style={{ fontSize: 13, color: "#991B1B", fontWeight: "600" }}>We couldn't verify your info</Text>
          </View>
        </View>
        <Text style={{ fontSize: 13, color: "#991B1B", lineHeight: 20, marginBottom: 16, fontWeight: "500" }}>
          Verification unsuccessful. Try again with updated documents.
        </Text>
        <TouchableOpacity onPress={p.onTryAgain} style={{ backgroundColor: "#EF4444", borderRadius: 12, paddingVertical: 13, alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <RefreshCw size={17} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF", marginLeft: 8 }}>Try Again</Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={{ backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 16, padding: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#6B3AA0", marginBottom: 10 }}>Common Issues:</Text>
        <Text style={{ fontSize: 12, color: "#4D2875", lineHeight: 18, fontWeight: "500" }}>• Blurry or unclear ID photos</Text>
        <Text style={{ fontSize: 12, color: "#4D2875", lineHeight: 18, fontWeight: "500" }}>• Name doesn't match ID exactly</Text>
        <Text style={{ fontSize: 12, color: "#4D2875", lineHeight: 18, fontWeight: "500" }}>• Incorrect date of birth</Text>
        <Text style={{ fontSize: 12, color: "#4D2875", lineHeight: 18, fontWeight: "500" }}>• Invalid or expired ID</Text>
      </View>
    </View>
  );
}
