import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SlidersHorizontal, ChevronRight } from "lucide-react-native";

type LimitItem = {
  label: string;
  interval: string;
  amount: number;
};

type SpendingLimitsCardProps = {
  spendingLimits: Array<{ amount: number; interval: string }>;
  onEdit: () => void;
};

function intervalLabel(interval: string): string {
  const map: Record<string, string> = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    per_authorization: "Per Transaction",
    all_time: "All Time",
  };
  return map[interval] || interval;
}

export default function SpendingLimitsCard({
  spendingLimits,
  onEdit,
}: SpendingLimitsCardProps) {
  const limits: LimitItem[] = spendingLimits.map((l) => ({
    label: intervalLabel(l.interval),
    interval: l.interval,
    amount: l.amount,
  }));

  return (
    <TouchableOpacity
      onPress={onEdit}
      activeOpacity={0.7}
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
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: "#EDE9FE",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SlidersHorizontal size={16} color="#6B3AA0" strokeWidth={2.5} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#1F2937" }}>
            Spending Limits
          </Text>
        </View>
        <ChevronRight size={18} color="#9CA3AF" />
      </View>

      {limits.length === 0 ? (
        <Text style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 18 }}>
          No custom limits set. Stripe applies a default $500/day limit.
          Tap to add your own limits.
        </Text>
      ) : (
        limits.map((limit) => (
          <View
            key={limit.interval}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 8,
              borderTopWidth: 1,
              borderTopColor: "#F3F4F6",
            }}
          >
            <Text
              style={{ fontSize: 14, color: "#6B7280", fontWeight: "500" }}
            >
              {limit.label}
            </Text>
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#1F2937" }}>
              ${(limit.amount / 100).toFixed(2)}
            </Text>
          </View>
        ))
      )}
    </TouchableOpacity>
  );
}
