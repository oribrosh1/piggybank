import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Snowflake, SlidersHorizontal } from "lucide-react-native";

type QuickActionsRowProps = {
  isFrozen: boolean;
  freezing: boolean;
  onToggleFreeze: () => void;
  onSetLimits: () => void;
};

export default function QuickActionsRow({
  isFrozen,
  freezing,
  onToggleFreeze,
  onSetLimits,
}: QuickActionsRowProps) {
  const actions = [
    {
      label: isFrozen ? "Unfreeze" : "Freeze",
      icon: Snowflake,
      color: isFrozen ? "#10B981" : "#EF4444",
      bg: isFrozen ? "#D1FAE5" : "#FEE2E2",
      onPress: onToggleFreeze,
      loading: freezing,
    },
    {
      label: "Limits",
      icon: SlidersHorizontal,
      color: "#6B3AA0",
      bg: "#EDE9FE",
      onPress: onSetLimits,
      loading: false,
    },
  ];

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
        gap: 10,
      }}
    >
      {actions.map((action) => (
        <TouchableOpacity
          key={action.label}
          onPress={action.onPress}
          disabled={action.loading}
          style={{
            flex: 1,
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: action.bg,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 8,
            }}
          >
            {action.loading ? (
              <ActivityIndicator size="small" color={action.color} />
            ) : (
              <action.icon size={22} color={action.color} strokeWidth={2} />
            )}
          </View>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: "#374151",
            }}
          >
            {action.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
