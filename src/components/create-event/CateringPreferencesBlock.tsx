import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Utensils } from "lucide-react-native";
import type { EventFormData } from "@/types/events";
import { colors } from "@/src/theme";

const SELECTED_TINT = "rgba(107, 56, 212, 0.12)";

const kosherOptions = [
  { value: "kosher-style", label: "KOSHER STYLE", sub: "" },
  { value: "kosher", label: "KOSHER", sub: "" },
  { value: "glatt-kosher", label: "GLATT", sub: "" },
  { value: "not-kosher", label: "NOT KOSHER", sub: "" },
];

const mealOptions = [
  { value: "dairy", label: "DAIRY" },
  { value: "meat", label: "MEAT" },
  { value: "pareve", label: "PAREVE" },
];

const vegetarianOptionsPrimary = [
  { value: "none", label: "🍴", name: "None", desc: "Regular menu" },
  { value: "vegetarian", label: "🥗", name: "Vegetarian", desc: "No meat" },
  { value: "vegan", label: "🌱", name: "Vegan", desc: "Plant-based" },
];

const vegetarianByRequestOption = { value: "by_request" as const, label: "🙋", line: "Guests can request" };

export type CateringPreferencesBlockProps = {
  formData: EventFormData;
  onInputChange: (field: string, value: string | boolean) => void;
  /** Extra top margin when stacked under other sections inside a card */
  topSpacing?: boolean;
};

export default function CateringPreferencesBlock({
  formData,
  onInputChange,
  topSpacing,
}: CateringPreferencesBlockProps) {
  return (
    <View style={{ marginTop: 10 }}>
      <View style={{ marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={{ fontSize: 12, fontWeight: "800", color: colors.primary }}>Kosher Type</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 10 }}
        contentContainerStyle={{ flexDirection: "row", flexWrap: "nowrap", gap: 8, paddingRight: 4 }}
      >
        {kosherOptions.map((opt) => {
          const sel = formData.kosherType === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onInputChange("kosherType", opt.value)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: sel ? SELECTED_TINT : colors.surfaceContainerLowest,
                borderWidth: 2,
                borderColor: sel ? colors.primary : "transparent",
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "800", color: sel ? colors.primary : "#6B7280" }}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

   
      <Text style={{ fontSize: 12, fontWeight: "800", color: colors.primary, marginBottom: 8 }}>Meal Type</Text>

      <View style={{ flexDirection: "row", flexWrap: "nowrap", gap: 8, marginBottom: 16 }}>
        {mealOptions.map((opt) => {
          const sel = formData.mealType === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => {
                if (opt.value !== "dairy") onInputChange("chalavYisrael", false);
                onInputChange("mealType", opt.value);
              }}
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 8,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: sel ? SELECTED_TINT : colors.surfaceContainerLowest,
                borderWidth: 2,
                borderColor: sel ? colors.primary : "transparent",
              }}
            >
              <Text
                style={{ fontSize: 11, fontWeight: "800", color: sel ? colors.primary : "#6B7280" }}
                numberOfLines={1}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {formData.mealType === "dairy" ? (
        <View style={{ marginBottom: 14 }}>
          <Text
            style={{
              fontSize: 10,
              fontWeight: "800",
              color: colors.onSurfaceVariant,
              letterSpacing: 0.85,
              marginBottom: 8,
            }}
          >
            DAIRY MILK STANDARD
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "nowrap", gap: 8 }}>
            <TouchableOpacity
              onPress={() => onInputChange("chalavYisrael", false)}
              activeOpacity={0.88}
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 8,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor:
                  formData.chalavYisrael !== true ? SELECTED_TINT : colors.surfaceContainerLowest,
                borderWidth: 2,
                borderColor: formData.chalavYisrael !== true ? colors.primary : colors.outlineVariant,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "800",
                  color: formData.chalavYisrael !== true ? colors.primary : "#6B7280",
                  textAlign: "center",
                }}
                numberOfLines={2}
              >
                Regular dairy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onInputChange("chalavYisrael", true)}
              activeOpacity={0.88}
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 8,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor:
                  formData.chalavYisrael === true ? SELECTED_TINT : colors.surfaceContainerLowest,
                borderWidth: 2,
                borderColor: formData.chalavYisrael === true ? colors.primary : colors.outlineVariant,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "800",
                  color: formData.chalavYisrael === true ? colors.primary : "#6B7280",
                  textAlign: "center",
                }}
                numberOfLines={2}
              >
                Chalav Yisrael
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <View style={{ marginBottom: 8 }}>
        <Text style={{ fontSize: 12, fontWeight: "800", color: colors.primary, marginBottom: 8 }}>Vegetarian Options</Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
          {vegetarianOptionsPrimary.map((opt) => {
            const sel =
              opt.value === "none"
                ? !formData.vegetarianType || formData.vegetarianType === "none"
                : formData.vegetarianType === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => onInputChange("vegetarianType", opt.value)}
                activeOpacity={0.88}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: sel ? colors.primary : colors.surfaceContainerLowest,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 16, marginBottom: 2 }}>{opt.label}</Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "800",
                    color: sel ? "#FFFFFF" : "#374151",
                    textAlign: "center",
                  }}
                  numberOfLines={2}
                >
                  {opt.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity
          onPress={() => onInputChange("vegetarianType", vegetarianByRequestOption.value)}
          activeOpacity={0.88}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor:
              formData.vegetarianType === "by_request" ? colors.primary : colors.surfaceContainerLowest,
          }}
        >
          <Text style={{ fontSize: 16, marginBottom: 4 }}>{vegetarianByRequestOption.label}</Text>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "800",
              color: formData.vegetarianType === "by_request" ? "#FFFFFF" : "#374151",
              textAlign: "center",
              lineHeight: 14,
            }}
          >
            {vegetarianByRequestOption.line}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
