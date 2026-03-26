import React from "react";
import { View, Text, TextInput } from "react-native";
import { FOREST, INPUT_BG, MUTED } from "./designInviteTheme";

interface EventDetailsNameFieldProps {
  value: string;
  error?: string;
  focused: boolean;
  placeholder: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
}

export default function EventDetailsNameField({
  value,
  error,
  focused,
  placeholder,
  onChange,
  onFocus,
  onBlur,
}: EventDetailsNameFieldProps) {
  const borderColor = focused ? FOREST : error ? "#EF4444" : "#E5E7EB";
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
        WHO IS THIS CELEBRATION FOR?
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
          style={{ fontSize: 17, fontWeight: "700", color: "#111827", paddingVertical: 2 }}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>
      <Text style={{ fontSize: 12, fontWeight: "500", color: MUTED, marginTop: 8, lineHeight: 18 }}>
        This name appears on the poster and invitations.
      </Text>
      {error ? (
        <Text style={{ fontSize: 12, color: "#EF4444", marginTop: 6, fontWeight: "600" }}>{error}</Text>
      ) : null}
    </View>
  );
}
