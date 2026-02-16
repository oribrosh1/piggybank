import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ChevronRight } from "lucide-react-native";
import { routes } from "@/types/routes";

export default function EventTypeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleContinue = () => {
    if (selectedType) {
      router.push({
        pathname: routes.createEvent.eventDetails,
        params: { eventType: selectedType },
      });
    }
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: "#F0FFFE" }}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 20,
          backgroundColor: "#FBBF24",
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginBottom: 12 }}
        >
          <Text style={{ fontSize: 20 }}>← BACK</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 28, fontWeight: "900", color: "#FFFFFF" }}>
          STEP 1️⃣
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: "rgba(255,255,255,0.9)",
            marginTop: 4,
          }}
        >
          Pick your event type
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "900",
            color: "#6B3AA0",
            marginBottom: 16,
            letterSpacing: 0.3,
          }}
        >
          WHAT ARE WE CELEBRATING? 🎊
        </Text>

        {/* Birthday Option */}
        <TouchableOpacity
          onPress={() => setSelectedType("birthday")}
          activeOpacity={0.8}
          style={{
            backgroundColor:
              selectedType === "birthday" ? "#FEF3C7" : "#FFFFFF",
            borderRadius: 20,
            padding: 20,
            marginBottom: 14,
            borderWidth: 3,
            borderColor: selectedType === "birthday" ? "#FBBF24" : "#E5E7EB",
            shadowColor: "#000",
            shadowOpacity: selectedType === "birthday" ? 0.12 : 0.04,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: selectedType === "birthday" ? 4 : 1,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 60 }}>🎂</Text>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "900",
                  color: selectedType === "birthday" ? "#FBBF24" : "#1F2937",
                }}
              >
                Birthday
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: "#9CA3AF",
                  fontWeight: "600",
                  marginTop: 4,
                }}
              >
                Celebrate another year of awesomeness! 🎉
              </Text>
            </View>
            {selectedType === "birthday" && (
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: "#FBBF24",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "bold", color: "#FFFFFF" }}
                >
                  ✓
                </Text>
              </View>
            )}
          </View>

          <View
            style={{
              backgroundColor:
                selectedType === "birthday"
                  ? "rgba(255,255,255,0.6)"
                  : "#F3F4F6",
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 12,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                color: selectedType === "birthday" ? "#B45309" : "#6B7280",
                fontWeight: "600",
              }}
            >
              ✨ Get a customized invitation with age, cake theme, and party
              details
            </Text>
          </View>
        </TouchableOpacity>

        {/* Bar Mitzvah Option */}
        <TouchableOpacity
          onPress={() => setSelectedType("barMitzvah")}
          activeOpacity={0.8}
          style={{
            backgroundColor:
              selectedType === "barMitzvah" ? "#F3E8FF" : "#FFFFFF",
            borderRadius: 20,
            padding: 20,
            marginBottom: 28,
            borderWidth: 3,
            borderColor: selectedType === "barMitzvah" ? "#6B3AA0" : "#E5E7EB",
            shadowColor: "#000",
            shadowOpacity: selectedType === "barMitzvah" ? 0.12 : 0.04,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: selectedType === "barMitzvah" ? 4 : 1,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 60 }}>📖</Text>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "900",
                  color: selectedType === "barMitzvah" ? "#6B3AA0" : "#1F2937",
                }}
              >
                Bar Mitzvah
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: "#9CA3AF",
                  fontWeight: "600",
                  marginTop: 4,
                }}
              >
                A coming-of-age milestone! 🕎
              </Text>
            </View>
            {selectedType === "barMitzvah" && (
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: "#6B3AA0",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "bold", color: "#FFFFFF" }}
                >
                  ✓
                </Text>
              </View>
            )}
          </View>

          <View
            style={{
              backgroundColor:
                selectedType === "barMitzvah"
                  ? "rgba(255,255,255,0.6)"
                  : "#F3F4F6",
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 12,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                color: selectedType === "barMitzvah" ? "#7C3AED" : "#6B7280",
                fontWeight: "600",
              }}
            >
              ✨ Include ceremony details, dress code, and spiritual
              significance
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer with Continue Button */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 20,
          backgroundColor: "rgba(0, 0, 0, 0.02)",
        }}
      >
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!selectedType}
          activeOpacity={0.85}
          style={{
            backgroundColor: selectedType ? "#FBBF24" : "#D1D5DB",
            borderRadius: 16,
            paddingVertical: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            opacity: selectedType ? 1 : 0.5,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "900",
              color: "#FFFFFF",
              letterSpacing: 0.5,
            }}
          >
            CONTINUE 🚀
          </Text>
          <ChevronRight size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
