import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { CreditCard, Plus } from "lucide-react-native";

type BankingNoAccountSectionProps = {
  onSetupCredit: () => void;
  onTestVerify: () => void;
  onTestAddBalance: (cents: number) => void;
};

export default function BankingNoAccountSection({
  onSetupCredit,
  onTestVerify,
  onTestAddBalance,
}: BankingNoAccountSectionProps) {
  return (
    <View>
      <View style={{ marginBottom: 24 }}>
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: 16,
            padding: 20,
            alignItems: "center",
            borderWidth: 2,
            borderColor: "#06D6A0",
            borderStyle: "dashed",
          }}
        >
          <CreditCard size={48} color="#06D6A0" strokeWidth={2} />
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF", marginTop: 16, marginBottom: 8, textAlign: "center" }}>
            No credit yet
          </Text>
          <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", textAlign: "center" }}>
            Create your first virtual credit card to start earning! 💰
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={onSetupCredit}
        style={{
          backgroundColor: "#06D6A0",
          borderRadius: 16,
          paddingVertical: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <Plus size={24} color="#6B3AA0" strokeWidth={3} />
        <Text style={{ fontSize: 16, fontWeight: "800", color: "#6B3AA0" }}>SET UP CREDIT</Text>
      </TouchableOpacity>

      {__DEV__ && (
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: 16,
            padding: 20,
            marginTop: 10,
            borderWidth: 2,
            borderColor: "#E879F9",
            borderStyle: "dashed",
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF", marginBottom: 12 }}>
            🧪 TEST MODE (Dev Only)
          </Text>
          <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 16, fontWeight: "500" }}>
            {`1. Tap "SET UP CREDIT" to set up your Stripe account\n2. Tap "Verify for Testing" to enable transfers\n3. Then add test money!`}
          </Text>
          <View style={{ gap: 10 }}>
            <TouchableOpacity
              onPress={onTestVerify}
              style={{ backgroundColor: "#059669", borderRadius: 10, paddingVertical: 12, alignItems: "center" }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>✅ Step 2: Verify for Testing</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onTestAddBalance(5000)}
              style={{ backgroundColor: "#A21CAF", borderRadius: 10, paddingVertical: 12, alignItems: "center" }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>💰 Step 3: Add $50 Test Balance</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
