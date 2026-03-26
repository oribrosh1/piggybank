import React from "react";
import { View, Text } from "react-native";
import { ChildSpendingSummaryResponse } from "@/src/lib/api";
import { TrendingUp } from "lucide-react-native";

type ChildSpendingSummaryProps = {
  summary: ChildSpendingSummaryResponse | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  eating_places_restaurants: "Restaurants",
  fast_food_restaurants: "Fast Food",
  grocery_stores_supermarkets: "Groceries",
  digital_goods_media: "Digital",
  game_toy_and_hobby_shops: "Games & Toys",
  book_stores: "Books",
  clothing_stores: "Clothing",
  department_stores: "Department Stores",
  drug_stores_and_pharmacies: "Pharmacy",
  miscellaneous_food_stores: "Food Stores",
};

const BAR_COLORS = [
  "#6B3AA0",
  "#06D6A0",
  "#FBBF24",
  "#3B82F6",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
];

function categoryLabel(key: string): string {
  return (
    CATEGORY_LABELS[key] ||
    key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .slice(0, 20)
  );
}

export default function ChildSpendingSummary({
  summary,
}: ChildSpendingSummaryProps) {
  if (!summary || summary.totalSpent === 0) {
    return null;
  }

  const sortedCategories = Object.entries(summary.byCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: "#FEF3C7",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TrendingUp size={16} color="#F59E0B" strokeWidth={2.5} />
        </View>
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#1F2937" }}>
          Spending Summary
        </Text>
        <Text style={{ fontSize: 12, color: "#9CA3AF", marginLeft: "auto" }}>
          This {summary.period}
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 16,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#F3F4F6",
        }}
      >
        <View>
          <Text style={{ fontSize: 11, color: "#9CA3AF", fontWeight: "600" }}>
            TOTAL SPENT
          </Text>
          <Text style={{ fontSize: 22, fontWeight: "800", color: "#1F2937" }}>
            ${(summary.totalSpent / 100).toFixed(2)}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 11, color: "#9CA3AF", fontWeight: "600" }}>
            TRANSACTIONS
          </Text>
          <Text style={{ fontSize: 22, fontWeight: "800", color: "#1F2937" }}>
            {summary.transactionCount}
          </Text>
        </View>
      </View>

      {sortedCategories.map(([cat, amount], idx) => {
        const pct =
          summary.totalSpent > 0 ? (amount / summary.totalSpent) * 100 : 0;
        return (
          <View key={cat} style={{ marginBottom: 10 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text
                style={{ fontSize: 12, color: "#6B7280", fontWeight: "500" }}
              >
                {categoryLabel(cat)}
              </Text>
              <Text
                style={{ fontSize: 12, fontWeight: "700", color: "#1F2937" }}
              >
                ${(amount / 100).toFixed(2)}
              </Text>
            </View>
            <View
              style={{
                height: 6,
                backgroundColor: "#F3F4F6",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: 6,
                  borderRadius: 3,
                  width: `${Math.max(pct, 2)}%`,
                  backgroundColor:
                    BAR_COLORS[idx % BAR_COLORS.length],
                }}
              />
            </View>
          </View>
        );
      })}

      {summary.topMerchants.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: "#9CA3AF",
              marginBottom: 8,
            }}
          >
            TOP MERCHANTS
          </Text>
          {summary.topMerchants.slice(0, 3).map((m) => (
            <View
              key={m.name}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 4,
              }}
            >
              <Text
                style={{ fontSize: 13, color: "#374151", fontWeight: "500" }}
              >
                {m.name}
              </Text>
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: "#1F2937" }}
              >
                ${(m.amount / 100).toFixed(2)} ({m.count}x)
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
