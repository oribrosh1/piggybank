import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { FileText, Check } from "lucide-react-native";

const ID_OPTIONS = [
  { value: "license", label: "Driver's License", icon: "🚗" },
  { value: "passport", label: "Passport", icon: "🛂" },
];

interface IdTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function IdTypeSelector({ value, onChange }: IdTypeSelectorProps) {
  return (
    <View
      style={{
        marginBottom: 24,
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 2,
        borderColor: "#F3F4F6",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#EDE9FE",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FileText size={18} color="#8B5CF6" strokeWidth={2.5} />
        </View>
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827", marginLeft: 12, letterSpacing: 0.3 }}>
          Document Type
        </Text>
      </View>
      <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 16, lineHeight: 18 }}>
        Select the type of ID you'll be uploading
      </Text>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {ID_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => onChange(option.value)}
            style={{
              flex: 1,
              borderWidth: 2,
              borderColor: value === option.value ? "#8B5CF6" : "#E5E7EB",
              backgroundColor: value === option.value ? "#F5F3FF" : "#FFFFFF",
              borderRadius: 12,
              paddingVertical: 16,
              paddingHorizontal: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 28, marginBottom: 8 }}>{option.icon}</Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: value === option.value ? "#8B5CF6" : "#6B7280",
                textAlign: "center",
              }}
            >
              {option.label}
            </Text>
            {value === option.value && (
              <View
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  backgroundColor: "#8B5CF6",
                  borderRadius: 10,
                  width: 20,
                  height: 20,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Check size={14} color="#FFFFFF" strokeWidth={3} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
