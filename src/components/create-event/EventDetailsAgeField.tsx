import React from "react";
import { View, Text, TextInput } from "react-native";

type EventDetailsAgeFieldProps = {
  value: string;
  error?: string;
  focused: boolean;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
};

export default function EventDetailsAgeField(p: EventDetailsAgeFieldProps) {
  const borderColor = p.focused ? "#06D6A0" : p.error ? "#EF4444" : "#E5E7EB";
  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, paddingHorizontal: 4 }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#E0F7F2", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 20 }}>🎉</Text>
        </View>
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#6B7280", marginLeft: 12, letterSpacing: 0.5, textTransform: "uppercase" }}>
          Turning Age
        </Text>
      </View>
      <View style={{ backgroundColor: "#FFFFFF", borderRadius: 20, padding: 20, borderWidth: 2, borderColor }}>
        <TextInput
          style={{ fontSize: 28, fontWeight: "800", color: "#06D6A0", textAlign: "center", paddingVertical: 8 }}
          placeholder="16"
          placeholderTextColor="#D1D5DB"
          value={p.value}
          onChangeText={p.onChange}
          onFocus={p.onFocus}
          onBlur={p.onBlur}
          keyboardType="number-pad"
          maxLength={3}
        />
      </View>
      {p.error && (
        <Text style={{ fontSize: 12, color: "#EF4444", marginTop: 8, fontWeight: "600", paddingHorizontal: 4 }}>⚠️ {p.error}</Text>
      )}
    </View>
  );
}
