import { View, Text, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

interface Props {
  onCompleteSetup: () => void;
}

/**
 * Prominent CTA when the parent must finish Stripe Connect before SMS invites and gift collection.
 */
export default function BankingSetupRequiredCard({ onCompleteSetup }: Props) {
  return (
    <View
      style={{
        backgroundColor: "#FFFBEB",
        borderRadius: 20,
        borderWidth: 2,
        borderColor: "#FDE68A",
        padding: 18,
        marginBottom: 22,
        flexDirection: "row",
        alignItems: "stretch",
        gap: 14,
        shadowColor: "#F59E0B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 3,
      }}
    >
      <View style={{ flex: 1 }}>
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: "#FDE047",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: "#EAB308",
          }}
        >
          <Text style={{ fontSize: 12 }}>⚠️</Text>
          <Text
            style={{
              fontSize: 10,
              fontWeight: "900",
              color: "#422006",
              letterSpacing: 0.6,
            }}
          >
            ACTION REQUIRED
          </Text>
        </View>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "900",
            color: "#111827",
            marginBottom: 8,
          }}
        >
          Verify & Get A CreditKid Card
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: "#57534E",
            lineHeight: 21,
            fontWeight: "600",
            marginBottom: 14,
          }}
        >
          To send SMS invitations and start collecting digital gifts in your child’s wallet, you need to verify
          your identity and link a bank account.
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <TouchableOpacity
            onPress={onCompleteSetup}
            activeOpacity={0.88}
            style={{
              backgroundColor: "#FACC15",
              paddingHorizontal: 22,
              paddingVertical: 12,
              borderRadius: 14,
              shadowColor: "#CA8A04",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "800", color: "#1C1917" }}>Complete Setup</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="checkmark-circle" size={14} color="#9CA3AF" />
            <Text style={{ fontSize: 12, color: "#9CA3AF", fontWeight: "600" }}>Verified by Stripe</Text>
          </View>
        </View>
      </View>
      <View
        style={{
          width: 84,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            backgroundColor: "#E0F2FE",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="wallet-outline" size={36} color="#0284C7" />
        </View>
      </View>
    </View>
  );
}
