import React from "react";
import { View, Text, TextInput } from "react-native";
import { FOREST, INPUT_BG, MUTED } from "./designInviteTheme";

type EventDetailsAgeFieldProps = {
  value: string;
  error?: string;
  focused: boolean;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
};

export default function EventDetailsAgeField(p: EventDetailsAgeFieldProps) {
  const borderColor = p.focused ? FOREST : p.error ? "#EF4444" : "#E5E7EB";
  return (
    <View style={{ marginBottom: 20 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "800",
          color: FOREST,
          letterSpacing: 1.2,
          marginBottom: 8,
        }}
      >
        TURNING AGE
      </Text>
      <View
        style={{
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderWidth: 2,
          backgroundColor: INPUT_BG,
          borderColor,
        }}
      >
        <TextInput
          style={{ fontSize: 20, fontWeight: "800", color: "#111827", paddingVertical: 2 }}
          placeholder="16"
          placeholderTextColor="#9CA3AF"
          value={p.value}
          onChangeText={p.onChange}
          onFocus={p.onFocus}
          onBlur={p.onBlur}
          keyboardType="number-pad"
          maxLength={3}
        />
      </View>
      <Text style={{ fontSize: 12, fontWeight: "500", color: MUTED, marginTop: 8, lineHeight: 18 }}>Shown on the poster.</Text>
      {p.error ? (
        <Text style={{ fontSize: 12, color: "#EF4444", marginTop: 6, fontWeight: "600" }}>{p.error}</Text>
      ) : null}
    </View>
  );
}
