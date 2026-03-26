import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  ScrollView,
  Pressable,
} from "react-native";
import { Sparkles, ChevronUp, ChevronDown, Utensils } from "lucide-react-native";
import type { EventFormData } from "@/types/events";
import { FOREST, INPUT_BG, MINT_PANEL, MINT_PANEL_BORDER } from "./designInviteTheme";

type EventDetailsOptionalCardProps = {
  formData: EventFormData;
  showEventDetails: boolean;
  optionalDetailsLater: boolean;
  onOptionalDetailsLaterChange: (value: boolean) => void;
  focusedField: string | null;
  isBarBatMitzvah: boolean;
  isPartyMode: boolean;
  onToggleDetails: () => void;
  onInputChange: (field: string, value: string) => void;
  setFocusedField: (field: string | null) => void;
};

const partyTypeOptions = [
  { value: "pool", label: "🏊", name: "POOL" },
  { value: "beach", label: "🏖️", name: "BEACH" },
  { value: "club", label: "🍸", name: "CLUB" },
  { value: "garden", label: "🌳", name: "GARDEN" },
  { value: "indoor", label: "🏠", name: "INDOOR" },
  { value: "restaurant", label: "🍽️", name: "RESTAURANT" },
  { value: "rooftop", label: "🌆", name: "ROOFTOP" },
  { value: "other", label: "✏️", name: "OTHER" },
];

const attirePickerOptions = [
  { value: "casual", label: "Casual" },
  { value: "semi-formal", label: "Semi-Formal" },
  { value: "formal", label: "Formal" },
  { value: "swimwear", label: "Swimwear" },
  { value: "costume", label: "Costume" },
];

const footwearPickerOptions = [
  { value: "sneakers", label: "Sneakers" },
  { value: "slides", label: "Slides" },
  { value: "comfortable", label: "Comfortable" },
  { value: "any", label: "Any" },
];

const kosherOptions = [
  { value: "kosher-style", label: "STANDARD", sub: "Kosher style" },
  { value: "kosher", label: "KOSHER", sub: "" },
  { value: "glatt-kosher", label: "GLATT", sub: "" },
  { value: "not-kosher", label: "NOT KOSHER", sub: "" },
];

const mealOptions = [
  { value: "dairy", label: "DAIRY" },
  { value: "meat", label: "MEAT" },
  { value: "pareve", label: "PAREVE" },
];

const themeChips = ["NEON GLOW", "VINTAGE", "MINIMALIST", "FANTASY"];

const vegetarianOptions = [
  { value: "none", label: "🍴", name: "None", desc: "Regular menu" },
  { value: "vegetarian", label: "🥗", name: "Vegetarian", desc: "No meat" },
  { value: "vegan", label: "🌱", name: "Vegan", desc: "Plant-based" },
];

function attireDisplay(v: string | undefined) {
  if (!v) return "Semi-Formal";
  const o = attirePickerOptions.find((x) => x.value === v);
  return o?.label ?? v;
}

function footwearDisplay(v: string | undefined) {
  if (!v) return "Comfortable";
  const o = footwearPickerOptions.find((x) => x.value === v);
  return o?.label ?? v;
}

function PickerModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }} onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            paddingBottom: 36,
            maxHeight: "50%",
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: "800", color: FOREST, marginBottom: 16 }}>{title}</Text>
          <ScrollView>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => {
                  onSelect(opt.value);
                  onClose();
                }}
                style={{
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: "#F3F4F6",
                  backgroundColor: selected === opt.value ? "#F0FDF4" : "transparent",
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  marginBottom: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: selected === opt.value ? "800" : "600",
                    color: selected === opt.value ? FOREST : "#374151",
                  }}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function EventDetailsOptionalCard(props: EventDetailsOptionalCardProps) {
  const {
    formData,
    showEventDetails,
    optionalDetailsLater,
    onOptionalDetailsLaterChange,
    focusedField,
    isBarBatMitzvah,
    isPartyMode,
    onToggleDetails,
    onInputChange,
    setFocusedField,
  } = props;

  const [attireOpen, setAttireOpen] = useState(false);
  const [footwearOpen, setFootwearOpen] = useState(false);

  const hideAttireFootwear = formData.partyType === "restaurant";

  return (
    <View
      style={{
        marginBottom: 24,
        backgroundColor: MINT_PANEL,
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: MINT_PANEL_BORDER,
      }}
    >
      <TouchableOpacity
        onPress={onToggleDetails}
        activeOpacity={0.85}
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}
      >
        <Sparkles size={22} color={FOREST} strokeWidth={2.2} />
        <Text style={{ fontSize: 17, fontWeight: "800", color: FOREST, marginLeft: 10, flex: 1 }}>More details</Text>
        {showEventDetails ? <ChevronUp size={22} color={FOREST} /> : <ChevronDown size={22} color={FOREST} />}
      </TouchableOpacity>

      <View style={{ gap: 10, marginBottom: showEventDetails ? 14 : 0 }}>
        <TouchableOpacity
          onPress={() => onOptionalDetailsLaterChange(false)}
          activeOpacity={0.88}
          style={{
            borderRadius: 14,
            padding: 14,
            borderWidth: 2,
            borderColor: !optionalDetailsLater ? FOREST : "#D1D5DB",
            backgroundColor: INPUT_BG,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "800", color: FOREST }}>Add details now</Text>
          <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 4, lineHeight: 18 }}>
            Theme, party mode & catering — used for an AI-generated poster.
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onOptionalDetailsLaterChange(true)}
          activeOpacity={0.88}
          style={{
            borderRadius: 14,
            padding: 14,
            borderWidth: 2,
            borderColor: optionalDetailsLater ? FOREST : "#D1D5DB",
            backgroundColor: INPUT_BG,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "800", color: FOREST }}>I&apos;ll fill this in later</Text>
          <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 4, lineHeight: 18 }}>
            Standard invitation look — not AI-generated. Add details anytime in Edit event.
          </Text>
        </TouchableOpacity>
      </View>

      {showEventDetails && optionalDetailsLater && (
        <View style={{ paddingBottom: 4 }}>
          <Text style={{ fontSize: 13, color: "#4B5563", lineHeight: 20 }}>
            You&apos;ll see a simple, classic invitation preview on your dashboard. Optional fields stay empty until you edit the event.
          </Text>
        </View>
      )}

      {showEventDetails && !optionalDetailsLater && (
        <>
          {isBarBatMitzvah && (
            <View style={{ marginBottom: 18 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <Text style={{ fontSize: 16 }}>🎪</Text>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#4B5563", marginLeft: 8 }}>What are you planning?</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={() => onInputChange("eventCategory", "formal")}
                  style={{
                    flex: 1,
                    backgroundColor: formData.eventCategory === "formal" ? FOREST : INPUT_BG,
                    borderRadius: 14,
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: formData.eventCategory === "formal" ? FOREST : "#E5E7EB",
                  }}
                >
                  <Text style={{ fontSize: 22, marginBottom: 4 }}>🕎</Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "800",
                      color: formData.eventCategory === "formal" ? "#FFFFFF" : "#374151",
                      textAlign: "center",
                    }}
                  >
                    The Ceremony
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onInputChange("eventCategory", "party")}
                  style={{
                    flex: 1,
                    backgroundColor: formData.eventCategory === "party" ? FOREST : INPUT_BG,
                    borderRadius: 14,
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: formData.eventCategory === "party" ? FOREST : "#E5E7EB",
                  }}
                >
                  <Text style={{ fontSize: 22, marginBottom: 4 }}>🎉</Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "800",
                      color: formData.eventCategory === "party" ? "#FFFFFF" : "#374151",
                      textAlign: "center",
                    }}
                  >
                    The Party
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {isPartyMode && (
            <>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 11, fontWeight: "800", color: FOREST, letterSpacing: 1, marginBottom: 12 }}>PARTY MODE</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 8 }}>
                  {partyTypeOptions.map((opt) => {
                    const sel = formData.partyType === opt.value;
                    return (
                      <TouchableOpacity key={opt.value} onPress={() => onInputChange("partyType", opt.value)} style={{ alignItems: "center", width: 72 }}>
                        <View
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: 32,
                            backgroundColor: sel ? FOREST : INPUT_BG,
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: sel ? 0 : 1,
                            borderColor: "#E5E7EB",
                          }}
                        >
                          <Text style={{ fontSize: 28 }}>{opt.label}</Text>
                        </View>
                        <Text
                          style={{
                            marginTop: 6,
                            fontSize: 10,
                            fontWeight: "800",
                            color: sel ? FOREST : "#6B7280",
                            textAlign: "center",
                          }}
                        >
                          {opt.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                {formData.partyType === "other" && (
                  <TextInput
                    style={{
                      marginTop: 12,
                      backgroundColor: INPUT_BG,
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      fontSize: 15,
                      fontWeight: "600",
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                    }}
                    placeholder="Describe your party type..."
                    placeholderTextColor="#9CA3AF"
                    value={formData.otherPartyType ?? ""}
                    onChangeText={(v) => onInputChange("otherPartyType", v)}
                  />
                )}
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: "800", color: FOREST, letterSpacing: 1, marginBottom: 6 }}>THEME & VIBE</Text>
                <Text style={{ fontSize: 12, color: "#4B5563", marginBottom: 10, lineHeight: 18 }}>
                  Describe the look and feel you want—this helps us create your AI poster (colors, style, characters, etc.)
                </Text>
                <TextInput
                  style={{
                    backgroundColor: INPUT_BG,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: 15,
                    fontWeight: "600",
                    borderWidth: 1,
                    borderColor: focusedField === "theme" ? FOREST : "#E5E7EB",
                    minHeight: 96,
                    textAlignVertical: "top",
                  }}
                  placeholder="e.g. A neon-lit futuristic disco with purple and blue accents..."
                  placeholderTextColor="#9CA3AF"
                  value={formData.theme}
                  onChangeText={(v) => onInputChange("theme", v)}
                  onFocus={() => setFocusedField("theme")}
                  onBlur={() => setFocusedField(null)}
                  multiline
                />
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                  {themeChips.map((chip) => {
                    const active = formData.theme === chip;
                    return (
                      <TouchableOpacity
                        key={chip}
                        onPress={() => onInputChange("theme", chip)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 20,
                          backgroundColor: active ? FOREST : INPUT_BG,
                          borderWidth: active ? 0 : 1,
                          borderColor: "#E5E7EB",
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: "800", color: active ? "#FFFFFF" : "#6B7280" }}>{chip}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    onPress={() => setFocusedField("theme")}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: INPUT_BG,
                      borderWidth: 1,
                      borderColor: FOREST,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "800", color: FOREST }}>+ CUSTOM</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {!hideAttireFootwear && (
                <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, fontWeight: "800", color: FOREST, marginBottom: 6 }}>ATTIRE</Text>
                    <TouchableOpacity
                      onPress={() => setAttireOpen(true)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        backgroundColor: INPUT_BG,
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 14,
                        borderWidth: 1,
                        borderColor: "#E5E7EB",
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827" }}>{attireDisplay(formData.attireType)}</Text>
                      <ChevronDown size={18} color={FOREST} />
                    </TouchableOpacity>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, fontWeight: "800", color: FOREST, marginBottom: 6 }}>FOOTWEAR</Text>
                    <TouchableOpacity
                      onPress={() => setFootwearOpen(true)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        backgroundColor: INPUT_BG,
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 14,
                        borderWidth: 1,
                        borderColor: "#E5E7EB",
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827" }}>{footwearDisplay(formData.footwearType)}</Text>
                      <ChevronDown size={18} color={FOREST} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}

          {isBarBatMitzvah && formData.eventCategory === "formal" && (
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", marginBottom: 8 }}>Dress Code</Text>
              <TextInput
                style={{
                  backgroundColor: INPUT_BG,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 15,
                  fontWeight: "600",
                  color: "#111827",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                }}
                placeholder="e.g. Black tie, Cocktail, Business casual..."
                placeholderTextColor="#9CA3AF"
                value={formData.attireType ?? ""}
                onChangeText={(v) => onInputChange("attireType", v)}
                onFocus={() => setFocusedField("dressCode")}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          )}

          <View style={{ marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Utensils size={18} color={FOREST} strokeWidth={2.2} />
            <Text style={{ fontSize: 14, fontWeight: "800", color: FOREST }}>CATERING PREFERENCES</Text>
          </View>

          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {kosherOptions.map((opt) => {
                const sel = formData.kosherType === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => onInputChange("kosherType", opt.value)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: sel ? "#F0FDF4" : INPUT_BG,
                      borderWidth: 2,
                      borderColor: sel ? FOREST : "transparent",
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "800", color: sel ? FOREST : "#6B7280" }}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
              {mealOptions.map((opt) => {
                const sel = formData.mealType === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => {
                      if (opt.value === "meat") onInputChange("vegetarianType", "");
                      onInputChange("mealType", opt.value);
                    }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: sel ? "#F0FDF4" : INPUT_BG,
                      borderWidth: 2,
                      borderColor: sel ? FOREST : "transparent",
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "800", color: sel ? FOREST : "#6B7280" }}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {formData.mealType === "meat" ? (
            <View style={{ marginBottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#374151" }}>Vegetarian options</Text>
                <Text style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>Guests can request a vegetarian meal in advance.</Text>
              </View>
              <Switch
                value={formData.vegetarianType === "by_request"}
                onValueChange={(v) => onInputChange("vegetarianType", v ? "by_request" : "")}
                trackColor={{ false: "#E5E7EB", true: "#BBF7D0" }}
                thumbColor={formData.vegetarianType === "by_request" ? FOREST : "#9CA3AF"}
              />
            </View>
          ) : (
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#6B7280", marginBottom: 8 }}>Vegetarian options</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {vegetarianOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => onInputChange("vegetarianType", opt.value)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: formData.vegetarianType === opt.value ? FOREST : INPUT_BG,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "800",
                        color: formData.vegetarianType === opt.value ? "#FFFFFF" : "#374151",
                      }}
                    >
                      {opt.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </>
      )}

      <PickerModal
        visible={attireOpen}
        title="Attire"
        options={attirePickerOptions}
        selected={formData.attireType ?? ""}
        onSelect={(v) => onInputChange("attireType", v)}
        onClose={() => setAttireOpen(false)}
      />
      <PickerModal
        visible={footwearOpen}
        title="Footwear"
        options={footwearPickerOptions}
        selected={formData.footwearType ?? ""}
        onSelect={(v) => onInputChange("footwearType", v)}
        onClose={() => setFootwearOpen(false)}
      />
    </View>
  );
}
