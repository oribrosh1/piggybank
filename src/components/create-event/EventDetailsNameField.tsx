import React from "react";
import { View, Text, TextInput } from "react-native";
import { Sparkles } from "lucide-react-native";

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
  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, paddingHorizontal: 4 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#E0F7F2",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Sparkles size={18} color="#06D6A0" strokeWidth={2.5} />
        </View>
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#6B7280", marginLeft: 12, letterSpacing: 0.5, textTransform: "uppercase" }}>
          Event Name
        </Text>
      </View>
      <View
        style={{
          borderRadius: 20,
          paddingHorizontal: 20,
          paddingVertical: 18,
          borderWidth: 2,
          backgroundColor: "#F9FAFB",
          borderColor: focused ? "#06D6A0" : error ? "#EF4444" : "#E5E7EB",
          shadowColor: focused ? "#06D6A0" : "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: focused ? 0.15 : 0.05,
          shadowRadius: 8,
          elevation: focused ? 4 : 2,
        }}
      >
        <TextInput
          style={{ fontSize: 20, fontWeight: "700", color: "#111827", paddingVertical: 6 }}
          placeholder={placeholder}
          placeholderTextColor="#D1D5DB"
          value={value}
          onChangeText={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </View>
      {error && (
        <Text style={{ fontSize: 12, color: "#EF4444", marginTop: 8, fontWeight: "600", paddingHorizontal: 4 }}>
          ⚠️ {error}
        </Text>
      )}
    </View>
  );
}
