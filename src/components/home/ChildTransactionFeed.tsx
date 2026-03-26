import { View, Text, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { ChildIssuingTransaction } from "@/src/lib/api";

interface Props {
  childName: string;
  transactions: ChildIssuingTransaction[];
  onSeeAll: () => void;
}

const CATEGORY_ICONS: Record<
  string,
  { icon: React.ComponentProps<typeof Ionicons>["name"]; bg: string; color: string }
> = {
  eating_places_restaurants: { icon: "restaurant", bg: "#FEF3C7", color: "#D97706" },
  fast_food_restaurants: { icon: "fast-food", bg: "#FEF3C7", color: "#D97706" },
  grocery_stores_supermarkets: { icon: "cart", bg: "#D1FAE5", color: "#059669" },
  digital_goods_games: { icon: "game-controller", bg: "#EDE9FE", color: "#7C3AED" },
  department_stores: { icon: "bag-handle", bg: "#DBEAFE", color: "#2563EB" },
  clothing_stores: { icon: "shirt", bg: "#FCE7F3", color: "#DB2777" },
};

const DEFAULT_ICON = { icon: "card" as const, bg: "#F3F4F6", color: "#6B7280" };

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    eating_places_restaurants: "Food",
    fast_food_restaurants: "Fast Food",
    grocery_stores_supermarkets: "Grocery",
    digital_goods_games: "Gaming",
    department_stores: "Retail",
    clothing_stores: "Clothing",
  };
  return labels[category] || category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ChildTransactionFeed({
  childName,
  transactions,
  onSeeAll,
}: Props) {
  return (
    <View style={{ marginBottom: 24 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#1F2937" }}>
          {childName}'s Recent Activity
        </Text>
        <TouchableOpacity onPress={onSeeAll}>
          <Text
            style={{ fontSize: 13, fontWeight: "600", color: "#7C3AED" }}
          >
            SEE ALL
          </Text>
        </TouchableOpacity>
      </View>

      {transactions.length === 0 && (
        <View
          style={{
            backgroundColor: "#FFF",
            borderRadius: 14,
            padding: 20,
            alignItems: "center",
          }}
        >
          <Ionicons
            name="receipt-outline"
            size={32}
            color="#D1D5DB"
            style={{ marginBottom: 8 }}
          />
          <Text style={{ fontSize: 14, color: "#9CA3AF" }}>
            No transactions yet
          </Text>
        </View>
      )}

      {transactions.map((txn) => {
        const catConfig =
          CATEGORY_ICONS[txn.merchantCategory] || DEFAULT_ICON;
        const amountDisplay = `${txn.amount < 0 ? "-" : ""}$${(
          Math.abs(txn.amount) / 100
        ).toFixed(2)}`;

        return (
          <View
            key={txn.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#FFF",
              borderRadius: 14,
              padding: 14,
              marginBottom: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.03,
              shadowRadius: 4,
              elevation: 1,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: catConfig.bg,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Ionicons
                name={catConfig.icon}
                size={20}
                color={catConfig.color}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: "#1F2937",
                }}
              >
                {txn.merchantName}
              </Text>
              <Text style={{ fontSize: 12, color: "#9CA3AF" }}>
                {getCategoryLabel(txn.merchantCategory)} •{" "}
                {formatDate(txn.created)}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: "#1F2937",
              }}
            >
              {amountDisplay}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
