import { View, Text } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

interface Props {
  unlockDate: string;
}

export default function BirthdayWalletCard({ unlockDate }: Props) {
  return (
    <View
      style={{
        backgroundColor: "#FFF",
        borderRadius: 20,
        padding: 20,
        alignItems: "center",
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 12 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: "#F3F4F6",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
        </View>
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            gap: 8,
          }}
        >
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={{
                width: 24,
                height: 16,
                borderRadius: 4,
                backgroundColor: "#E5E7EB",
              }}
            />
          ))}
        </View>
      </View>

      <Text
        style={{
          fontSize: 17,
          fontWeight: "800",
          color: "#1F2937",
          marginBottom: 6,
        }}
      >
        Birthday Wallet
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: "#9CA3AF",
          textAlign: "center",
          lineHeight: 18,
          marginBottom: 8,
        }}
      >
        Your child's total gifts will be{"\n"}available here on the big day!
      </Text>
      <Text style={{ fontSize: 14, fontWeight: "600", color: "#1F2937" }}>
        Unlocks on{" "}
        <Text style={{ color: "#10B981", fontWeight: "700" }}>
          {unlockDate}
        </Text>
      </Text>
    </View>
  );
}
