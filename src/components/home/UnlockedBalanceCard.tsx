import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";

interface Props {
  childName: string;
  balance: number;
  last4?: string;
  brand?: string;
}

export default function UnlockedBalanceCard({
  childName,
  balance,
  last4,
  brand,
}: Props) {
  const formattedBalance = balance.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

  return (
    <LinearGradient
      colors={["#10B981", "#059669"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 20, padding: 20, marginBottom: 16 }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 4,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: "rgba(255,255,255,0.7)",
            letterSpacing: 1,
          }}
        >
          BIRTHDAY BALANCE UNLOCKED
        </Text>
        <Ionicons name="wifi" size={18} color="rgba(255,255,255,0.7)" />
      </View>

      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: "rgba(255,255,255,0.9)",
          marginBottom: 8,
        
        }}
      >
        {childName}
      </Text>

      <Text
        style={{
          fontSize: 36,
          fontWeight: "900",
          color: "#FFF",
          marginBottom: 12,
          marginLeft: 6,
          paddingLeft: 6,
        }}
      >
        {formattedBalance}
      </Text>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontWeight: "600",
            flex: 1,
            marginRight: 8,
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: "600",
              letterSpacing: 0.5,
              color: "rgba(255,255,255,0.75)",
            }}
          >
            ****{"   "}****{"   "}****{"  "}
          </Text>
          <Text
            style={{
              fontSize: 24,
              color: "#FFF",
              fontWeight: "700",
            }}
          >
            {last4 ?? "----"}
          </Text>
        </Text>
        {last4 ? (
          <View
            style={{
              width: 36,
              height: 24,
              borderRadius: 4,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "700", color: "#FFF" }}>
              {(brand || "VISA").toUpperCase()}
            </Text>
          </View>
        ) : null}
      </View>
    </LinearGradient>
  );
}
