import React from "react";
import { View, Text, TouchableOpacity, TextInput, Switch } from "react-native";
import { Notebook } from "lucide-react-native";
import type { EventFormData } from "@/types/events";

type EventDetailsOptionalCardProps = {
  formData: EventFormData;
  showEventDetails: boolean;
  focusedField: string | null;
  isBarBatMitzvah: boolean;
  isPartyMode: boolean;
  onToggleDetails: () => void;
  onInputChange: (field: string, value: string) => void;
  setFocusedField: (field: string | null) => void;
};

const partyTypeOptions = [
  { value: "pool", label: "🏊", name: "Pool Party" },
  { value: "beach", label: "🏖️", name: "Beach Party" },
  { value: "garden", label: "🌳", name: "Garden Party" },
  { value: "indoor", label: "🏠", name: "Indoor Party" },
  { value: "restaurant", label: "🍽️", name: "Restaurant" },
  { value: "rooftop", label: "🌆", name: "Rooftop" },
];

const attireOptions = [
  { value: "casual", label: "👕 Casual", desc: "Everyday wear" },
  { value: "swimwear", label: "🩱 Swimwear", desc: "Pool/Beach" },
  { value: "costume", label: "🎭 Costume", desc: "Themed outfit" },
];

const footwearOptions = [
  { value: "sneakers", label: "👟", name: "Sneakers" },
  { value: "slides", label: "🩴", name: "Slides" },
  { value: "any", label: "✨", name: "Any" },
];

const kosherOptions = [
  { value: "kosher-style", label: "🍴", name: "Kosher Style" },
  { value: "kosher", label: "✡️", name: "Kosher" },
  { value: "glatt-kosher", label: "Ⓤ", name: "Glatt Kosher" },
  { value: "not-kosher", label: "🍽️", name: "Not Kosher" },
];

const mealOptions = [
  { value: "dairy", label: "🧀", name: "Dairy", desc: "Dairy" },
  { value: "meat", label: "🥩", name: "Meat", desc: "Meat" },
  { value: "pareve", label: "🥗", name: "Pareve", desc: "Pareve" },
];

const vegetarianOptions = [
  { value: "none", label: "🍴", name: "None", desc: "Regular menu" },
  { value: "vegetarian", label: "🥗", name: "Vegetarian", desc: "No meat" },
  { value: "vegan", label: "🌱", name: "Vegan", desc: "Plant-based" },
];

const themeSuggestions = ["🏆 Sports", "🏰 Inflatables", "🏊 Pool", "🎭 Costumes", "🦸 Superheroes"];

export default function EventDetailsOptionalCard(props: EventDetailsOptionalCardProps) {
  const {
    formData,
    showEventDetails,
    focusedField,
    isBarBatMitzvah,
    isPartyMode,
    onToggleDetails,
    onInputChange,
    setFocusedField,
  } = props;

  const showMealType =
    formData.kosherType === "kosher" ||
    formData.kosherType === "glatt-kosher" ||
    formData.kosherType === "kosher-style";

  return (
    <View
      style={{
        marginBottom: 24,
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 2,
        borderColor: "#F3F4F6",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#E0F7F2", alignItems: "center", justifyContent: "center" }}>
          <Notebook size={20} color="#06D6A0" strokeWidth={2.5} />
        </View>
        <View style={{ marginLeft: 14, flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "800", color: "#111827" }}>Event Details</Text>
          <Text style={{ fontSize: 12, fontWeight: "500", color: "#9CA3AF", marginTop: 2 }}>Optional • Will be shown on invitation</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={onToggleDetails}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: showEventDetails ? "#F9FAFB" : "#FEF3C7",
          borderRadius: 12,
          padding: 14,
          marginBottom: showEventDetails ? 20 : 0,
          borderWidth: 2,
          borderColor: showEventDetails ? "#E5E7EB" : "#F59E0B",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <Text style={{ fontSize: 18, marginRight: 10 }}>{showEventDetails ? "📝" : "⏰"}</Text>
          <View>
            <Text style={{ fontSize: 14, fontWeight: "700", color: showEventDetails ? "#374151" : "#92400E" }}>
              {showEventDetails ? "Fill in details now" : "I'll add details later"}
            </Text>
            <Text style={{ fontSize: 11, color: showEventDetails ? "#9CA3AF" : "#B45309", marginTop: 2 }}>
              {showEventDetails ? "Customize your invitation" : "You can edit these anytime"}
            </Text>
          </View>
        </View>
        <View style={{ width: 50, height: 28, borderRadius: 14, backgroundColor: showEventDetails ? "#06D6A0" : "#D1D5DB", padding: 2, justifyContent: "center" }}>
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: "#FFFFFF",
              alignSelf: showEventDetails ? "flex-end" : "flex-start",
            }}
          />
        </View>
      </TouchableOpacity>

      {showEventDetails && (
        <>
          {isBarBatMitzvah && (
            <View style={{ marginBottom: 18 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <Text style={{ fontSize: 16 }}>🎪</Text>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", marginLeft: 8 }}>What are you planning?</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={() => onInputChange("eventCategory", "formal")}
                  style={{
                    flex: 1,
                    backgroundColor: formData.eventCategory === "formal" ? "#06D6A0" : "#F9FAFB",
                    borderRadius: 14,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: formData.eventCategory === "formal" ? "#06D6A0" : "#E5E7EB",
                  }}
                >
                  <Text style={{ fontSize: 24, marginBottom: 6 }}>🕎</Text>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: formData.eventCategory === "formal" ? "#FFFFFF" : "#374151" }}>The Ceremony</Text>
                  <Text style={{ fontSize: 11, fontWeight: "500", color: formData.eventCategory === "formal" ? "rgba(255,255,255,0.8)" : "#9CA3AF", marginTop: 2 }}>Synagogue, Formal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onInputChange("eventCategory", "party")}
                  style={{
                    flex: 1,
                    backgroundColor: formData.eventCategory === "party" ? "#06D6A0" : "#F9FAFB",
                    borderRadius: 14,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: formData.eventCategory === "party" ? "#06D6A0" : "#E5E7EB",
                  }}
                >
                  <Text style={{ fontSize: 24, marginBottom: 6 }}>🎉</Text>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: formData.eventCategory === "party" ? "#FFFFFF" : "#374151" }}>The Party</Text>
                  <Text style={{ fontSize: 11, fontWeight: "500", color: formData.eventCategory === "party" ? "rgba(255,255,255,0.8)" : "#9CA3AF", marginTop: 2 }}>Celebration, Fun!</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {isPartyMode && (
            <>
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                  <Text style={{ fontSize: 16 }}>🎊</Text>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", marginLeft: 8 }}>Party Type</Text>
                  <Text style={{ fontSize: 11, fontWeight: "500", color: "#9CA3AF", marginLeft: 6 }}>(select one)</Text>
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                  {partyTypeOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => onInputChange("partyType", opt.value)}
                      style={{
                        width: "31%",
                        backgroundColor: formData.partyType === opt.value ? "#06D6A0" : "#F9FAFB",
                        borderRadius: 14,
                        paddingVertical: 12,
                        paddingHorizontal: 8,
                        alignItems: "center",
                        borderWidth: 2,
                        borderColor: formData.partyType === opt.value ? "#06D6A0" : "#E5E7EB",
                      }}
                    >
                      <Text style={{ fontSize: 24, marginBottom: 4 }}>{opt.label}</Text>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: formData.partyType === opt.value ? "#FFFFFF" : "#374151", textAlign: "center" }}>{opt.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  onPress={() => onInputChange("partyType", "other")}
                  style={{
                    marginTop: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: formData.partyType === "other" ? "#06D6A0" : "#F9FAFB",
                    borderRadius: 12,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    width: "75%",
                    borderWidth: 2,
                    borderColor: formData.partyType === "other" ? "#06D6A0" : "#E5E7EB",
                    alignSelf: "center",
                  }}
                >
                  <Text style={{ fontSize: 16, marginRight: 6 }}>✏️</Text>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: formData.partyType === "other" ? "#FFFFFF" : "#374151" }}>Other</Text>
                </TouchableOpacity>
                {formData.partyType === "other" && (
                  <View style={{ marginTop: 12 }}>
                    <TextInput
                      style={{
                        backgroundColor: focusedField === "otherPartyType" ? "#F0FDFA" : "#F9FAFB",
                        borderRadius: 12,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 15,
                        fontWeight: "600",
                        color: "#111827",
                        borderWidth: 2,
                        borderColor: focusedField === "otherPartyType" ? "#06D6A0" : "#E5E7EB",
                      }}
                      placeholder="Describe your party type..."
                      placeholderTextColor="#D1D5DB"
                      value={formData.otherPartyType ?? ""}
                      onChangeText={(v) => onInputChange("otherPartyType", v)}
                      onFocus={() => setFocusedField("otherPartyType")}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                )}
              </View>

              {formData.partyType !== "restaurant" && (
                <>
                  <View style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                      <Text style={{ fontSize: 16 }}>👕</Text>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", marginLeft: 8 }}>Attire Type</Text>
                      <Text style={{ fontSize: 11, fontWeight: "500", color: "#9CA3AF", marginLeft: 6 }}>(select one)</Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      {attireOptions.map((opt) => (
                        <TouchableOpacity
                          key={opt.value}
                          onPress={() => onInputChange("attireType", opt.value)}
                          style={{
                            flex: 1,
                            backgroundColor: formData.attireType === opt.value ? "#06D6A0" : "#F9FAFB",
                            borderRadius: 14,
                            paddingVertical: 14,
                            paddingHorizontal: 10,
                            alignItems: "center",
                            borderWidth: 2,
                            borderColor: formData.attireType === opt.value ? "#06D6A0" : "#E5E7EB",
                          }}
                        >
                          <Text style={{ fontSize: 22, marginBottom: 4 }}>{opt.label.split(" ")[0]}</Text>
                          <Text style={{ fontSize: 12, fontWeight: "700", color: formData.attireType === opt.value ? "#FFFFFF" : "#374151", textAlign: "center" }}>{opt.label.split(" ")[1]}</Text>
                          <Text style={{ fontSize: 10, color: formData.attireType === opt.value ? "rgba(255,255,255,0.8)" : "#9CA3AF", marginTop: 2, textAlign: "center" }}>{opt.desc}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View style={{ marginBottom: 14 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                      <Text style={{ fontSize: 16 }}>👟</Text>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", marginLeft: 8 }}>Footwear</Text>
                      <Text style={{ fontSize: 11, fontWeight: "500", color: "#9CA3AF", marginLeft: 6 }}>(select one)</Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      {footwearOptions.map((opt) => (
                        <TouchableOpacity
                          key={opt.value}
                          onPress={() => onInputChange("footwearType", opt.value)}
                          style={{
                            flex: 1,
                            backgroundColor: formData.footwearType === opt.value ? "#06D6A0" : "#F9FAFB",
                            borderRadius: 14,
                            paddingVertical: 14,
                            paddingHorizontal: 10,
                            alignItems: "center",
                            borderWidth: 2,
                            borderColor: formData.footwearType === opt.value ? "#06D6A0" : "#E5E7EB",
                          }}
                        >
                          <Text style={{ fontSize: 24, marginBottom: 4 }}>{opt.label}</Text>
                          <Text style={{ fontSize: 12, fontWeight: "700", color: formData.footwearType === opt.value ? "#FFFFFF" : "#374151", textAlign: "center" }}>{opt.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              )}
            </>
          )}

          {isBarBatMitzvah && formData.eventCategory === "formal" && (
            <View style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <Text style={{ fontSize: 16 }}>👗</Text>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", marginLeft: 8 }}>Dress Code</Text>
              </View>
              <TextInput
                style={{
                  backgroundColor: focusedField === "dressCode" ? "#F0FDFA" : "#F9FAFB",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 15,
                  fontWeight: "600",
                  color: "#111827",
                  borderWidth: 1.5,
                  borderColor: focusedField === "dressCode" ? "#06D6A0" : "transparent",
                }}
                placeholder="e.g. Black tie, Cocktail, Business casual..."
                placeholderTextColor="#D1D5DB"
                value={formData.attireType ?? ""}
                onChangeText={(v) => onInputChange("attireType", v)}
                onFocus={() => setFocusedField("dressCode")}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          )}

          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <Text style={{ fontSize: 16 }}>🎭</Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", marginLeft: 8 }}>Party Theme</Text>
              <Text style={{ fontSize: 11, fontWeight: "500", color: "#9CA3AF", marginLeft: 6 }}>(optional)</Text>
            </View>
            <TextInput
              style={{
                backgroundColor: focusedField === "theme" ? "#F0FDFA" : "#F9FAFB",
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                fontWeight: "600",
                color: "#111827",
                borderWidth: 2,
                borderColor: focusedField === "theme" ? "#06D6A0" : "#E5E7EB",
              }}
              placeholder="What's the vibe?"
              placeholderTextColor="#D1D5DB"
              value={formData.theme ?? ""}
              onChangeText={(v) => onInputChange("theme", v)}
              onFocus={() => setFocusedField("theme")}
              onBlur={() => setFocusedField(null)}
            />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {themeSuggestions.map((s) => (
                <TouchableOpacity key={s} onPress={() => onInputChange("theme", s)} style={{ backgroundColor: "#F3F4F6", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 }}>
                  <Text style={{ fontSize: 12, color: "#6B7280", fontWeight: "600" }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <Text style={{ fontSize: 16 }}>✡️</Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", marginLeft: 8 }}>Kosher Type</Text>
              <Text style={{ fontSize: 11, fontWeight: "500", color: "#9CA3AF", marginLeft: 6 }}>(select one)</Text>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {kosherOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => onInputChange("kosherType", opt.value)}
                  style={{
                    width: "47%",
                    backgroundColor: formData.kosherType === opt.value ? "#06D6A0" : "#F9FAFB",
                    borderRadius: 14,
                    paddingVertical: 12,
                    paddingHorizontal: 8,
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: formData.kosherType === opt.value ? "#06D6A0" : "#E5E7EB",
                  }}
                >
                  <Text style={{ fontSize: 20, marginBottom: 4 }}>{opt.label}</Text>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: formData.kosherType === opt.value ? "#FFFFFF" : "#374151", textAlign: "center" }}>{opt.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {showMealType && (
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <Text style={{ fontSize: 16 }}>🍽️</Text>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", marginLeft: 8 }}>Meal Type</Text>
                <Text style={{ fontSize: 11, fontWeight: "500", color: "#9CA3AF", marginLeft: 6 }}>(select one)</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {mealOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => {
                      if (opt.value === "meat") onInputChange("vegetarianType", "");
                      onInputChange("mealType", opt.value);
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: formData.mealType === opt.value ? "#06D6A0" : "#F9FAFB",
                      borderRadius: 14,
                      paddingVertical: 12,
                      paddingHorizontal: 8,
                      alignItems: "center",
                      borderWidth: 2,
                      borderColor: formData.mealType === opt.value ? "#06D6A0" : "#E5E7EB",
                    }}
                  >
                    <Text style={{ fontSize: 20, marginBottom: 4 }}>{opt.label}</Text>
                    <Text style={{ fontSize: 13, fontWeight: "800", color: formData.mealType === opt.value ? "#FFFFFF" : "#374151", textAlign: "center" }}>{opt.name}</Text>
                    <Text style={{ fontSize: 10, fontWeight: "500", color: formData.mealType === opt.value ? "rgba(255,255,255,0.8)" : "#9CA3AF", textAlign: "center" }}>{opt.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {formData.mealType === "meat" ? (
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16 }}>🌱</Text>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#374151", marginTop: 4 }}>Offer vegetarian meals (guests can request)</Text>
                  <Text style={{ fontSize: 12, fontWeight: "500", color: "#9CA3AF", marginTop: 4 }}>Guests can choose if they want a vegetarian option; you'll know to prepare it.</Text>
                </View>
                <Switch
                  value={formData.vegetarianType === "by_request"}
                  onValueChange={(v) => onInputChange("vegetarianType", v ? "by_request" : "")}
                  trackColor={{ false: "#E5E7EB", true: "#A7F3D0" }}
                  thumbColor={formData.vegetarianType === "by_request" ? "#06D6A0" : "#9CA3AF"}
                />
              </View>
            </View>
          ) : (
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <Text style={{ fontSize: 16 }}>🌱</Text>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", marginLeft: 8 }}>Vegetarian Options</Text>
                <Text style={{ fontSize: 11, fontWeight: "500", color: "#9CA3AF", marginLeft: 6 }}>(select one)</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {vegetarianOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => onInputChange("vegetarianType", opt.value)}
                    style={{
                      flex: 1,
                      backgroundColor: formData.vegetarianType === opt.value ? "#06D6A0" : "#F9FAFB",
                      borderRadius: 14,
                      paddingVertical: 12,
                      paddingHorizontal: 8,
                      alignItems: "center",
                      borderWidth: 2,
                      borderColor: formData.vegetarianType === opt.value ? "#06D6A0" : "#E5E7EB",
                    }}
                  >
                    <Text style={{ fontSize: 20, marginBottom: 4 }}>{opt.label}</Text>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: formData.vegetarianType === opt.value ? "#FFFFFF" : "#374151", textAlign: "center" }}>{opt.name}</Text>
                    <Text style={{ fontSize: 10, fontWeight: "500", color: formData.vegetarianType === opt.value ? "rgba(255,255,255,0.8)" : "#9CA3AF", textAlign: "center" }}>{opt.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}
