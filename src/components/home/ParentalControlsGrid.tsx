import { View, Text, Switch } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ChildCardResponse } from "@/src/lib/api";

interface Props {
  card: ChildCardResponse | null;
  onToggleFreeze?: () => void;
}

export default function ParentalControlsGrid({ card, onToggleFreeze }: Props) {
  const isActive = card?.card?.status === "active";
  const limits = card?.card?.spendingControls?.spending_limits || [];
  const blockedCount =
    card?.card?.spendingControls?.blocked_categories?.length || 0;

  const dailyLimit = limits.find((l) => l.interval === "daily");
  const weeklyLimit = limits.find((l) => l.interval === "weekly");
  const monthlyLimit = limits.find((l) => l.interval === "monthly");

  const limitsDisplay = [
    dailyLimit ? `$${dailyLimit.amount / 100}` : null,
    weeklyLimit ? `$${weeklyLimit.amount / 100}` : null,
    monthlyLimit ? `$${monthlyLimit.amount / 100}` : null,
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <View style={{ marginBottom: 24 }}>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "800",
          color: "#1F2937",
          marginBottom: 12,
        }}
      >
        Parental Controls
      </Text>

      <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
        {/* Card Status */}
        <View
          style={{
            flex: 1,
            backgroundColor: "#FFF",
            borderRadius: 16,
            padding: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: "#F3F4F6",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 10,
            }}
          >
            <Ionicons name="lock-closed" size={18} color="#6B7280" />
          </View>
          <Text
            style={{
              fontSize: 10,
              fontWeight: "700",
              color: "#9CA3AF",
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            CARD STATUS
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: isActive ? "#10B981" : "#EF4444",
              }}
            >
              {isActive ? "Active" : "Frozen"}
            </Text>
            <Switch
              value={isActive}
              onValueChange={onToggleFreeze}
              trackColor={{ false: "#E5E7EB", true: "#10B981" }}
              thumbColor="#FFF"
              style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
            />
          </View>
        </View>

        {/* Limits */}
        <View
          style={{
            flex: 1,
            backgroundColor: "#FFF",
            borderRadius: 16,
            padding: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: "#F3F4F6",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 10,
            }}
          >
            <MaterialIcons name="speed" size={18} color="#6B7280" />
          </View>
          <Text
            style={{
              fontSize: 10,
              fontWeight: "700",
              color: "#9CA3AF",
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            LIMITS
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: "#1F2937",
            }}
            numberOfLines={1}
          >
            {limitsDisplay || "Not set"}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        {/* Blocked Categories */}
        <View
          style={{
            flex: 1,
            backgroundColor: "#FFF",
            borderRadius: 16,
            padding: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: "#FEE2E2",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 10,
            }}
          >
            <MaterialIcons name="block" size={18} color="#EF4444" />
          </View>
          <Text
            style={{
              fontSize: 10,
              fontWeight: "700",
              color: "#9CA3AF",
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            BLOCKED
          </Text>
          <Text
            style={{ fontSize: 13, fontWeight: "700", color: "#1F2937" }}
          >
            {blockedCount} Categories
          </Text>
        </View>

        {/* Live Updates */}
        <View
          style={{
            flex: 1,
            backgroundColor: "#FFF",
            borderRadius: 16,
            padding: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: "#DBEAFE",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 10,
            }}
          >
            <Ionicons name="flash" size={18} color="#2563EB" />
          </View>
          <Text
            style={{
              fontSize: 10,
              fontWeight: "700",
              color: "#9CA3AF",
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            LIVE UPDATES
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: "#10B981",
              }}
            />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: "#1F2937",
              }}
            >
              ON
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
