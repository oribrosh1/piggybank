import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { ChildIssuingTransaction } from "@/src/lib/api";

type ChildTransactionListProps = {
  transactions: ChildIssuingTransaction[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
};

const CATEGORY_EMOJIS: Record<string, string> = {
  eating_places_restaurants: "🍕",
  fast_food_restaurants: "🍔",
  grocery_stores_supermarkets: "🛒",
  digital_goods_media: "📱",
  game_toy_and_hobby_shops: "🎮",
  book_stores: "📚",
  clothing_stores: "👕",
  shoe_stores: "👟",
  department_stores: "🏬",
  drug_stores_and_pharmacies: "💊",
  gas_stations: "⛽",
  transportation_services: "🚗",
  miscellaneous_food_stores: "🍎",
};

function getCategoryEmoji(category: string): string {
  return CATEGORY_EMOJIS[category] || "💳";
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ChildTransactionList({
  transactions,
  hasMore,
  loadingMore,
  onLoadMore,
}: ChildTransactionListProps) {
  if (transactions.length === 0) {
    return (
      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: 24,
          marginBottom: 16,
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <Text style={{ fontSize: 36, marginBottom: 8 }}>💳</Text>
        <Text style={{ fontSize: 14, color: "#9CA3AF", fontWeight: "600" }}>
          No transactions yet
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: "#D1D5DB",
            marginTop: 4,
            textAlign: "center",
          }}
        >
          Transactions will appear here once the card is used.
        </Text>
      </View>
    );
  }

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
      <Text
        style={{
          fontSize: 15,
          fontWeight: "700",
          color: "#1F2937",
          marginBottom: 12,
        }}
      >
        Recent Transactions
      </Text>

      {transactions.map((txn, i) => {
        const isRefund = txn.amount > 0;
        const amountStr = `${isRefund ? "+" : "-"}$${(Math.abs(txn.amount) / 100).toFixed(2)}`;

        return (
          <View
            key={txn.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              borderTopWidth: i > 0 ? 1 : 0,
              borderTopColor: "#F3F4F6",
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: "#F3F4F6",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Text style={{ fontSize: 20 }}>
                {getCategoryEmoji(txn.merchantCategory)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#1F2937",
                }}
                numberOfLines={1}
              >
                {txn.merchantName}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: "#9CA3AF",
                  marginTop: 2,
                }}
              >
                {formatDate(txn.created)}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: isRefund ? "#10B981" : "#1F2937",
              }}
            >
              {amountStr}
            </Text>
          </View>
        );
      })}

      {hasMore && (
        <TouchableOpacity
          onPress={onLoadMore}
          disabled={loadingMore}
          style={{
            paddingVertical: 12,
            alignItems: "center",
            borderTopWidth: 1,
            borderTopColor: "#F3F4F6",
            marginTop: 4,
          }}
        >
          {loadingMore ? (
            <ActivityIndicator size="small" color="#6B3AA0" />
          ) : (
            <Text
              style={{ fontSize: 13, fontWeight: "600", color: "#6B3AA0" }}
            >
              Load More
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}
