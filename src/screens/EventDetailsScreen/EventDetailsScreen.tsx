import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Modal,
  Keyboard,
  FlatList,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  MapPinned,
  Building2,
  Sparkles,
  Notebook,
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import GooglePlacesTextInput from "react-native-google-places-textinput";
import { useEventDetailsScreen } from "./useEventDetailsScreen";

export default function EventDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    eventType,
    formData,
    errors,
    focusedField,
    setFocusedField,
    showDatePicker,
    setShowDatePicker,
    showTimePicker,
    setShowTimePicker,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    showEventDetails,
    setShowEventDetails,
    fadeAnim,
    progressWidth,
    handleContinue,
    handleInputChange,
    formatDateDisplay,
    handleDateConfirm,
    handleTimeConfirm,
    isBirthday,
    isBarBatMitzvah,
    isPartyMode,
  } = useEventDetailsScreen();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
    >
      <View
        style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      >
        <Animated.ScrollView
          style={{ flex: 1, opacity: fadeAnim, backgroundColor: "#FFFFFF" }}
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        >
          {/* Header with gradient background */}
          <View
            style={{
              backgroundColor: "#06D6A0",
              paddingTop: insets.top,
              paddingBottom: 24,
              borderBottomLeftRadius: 32,
              borderBottomRightRadius: 32,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            {/* Top bar */}
            <View
              style={{
                paddingHorizontal: 20,
                paddingBottom: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <TouchableOpacity
                onPress={() => router.back()}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>

              <View style={{ alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: "rgba(255, 255, 255, 0.8)",
                    letterSpacing: 1,
                  }}
                >
                  STEP 2 OF 3
                </Text>
              </View>

              <View style={{ width: 40 }} />
            </View>

            {/* Progress bar */}
            <View
              style={{
                marginHorizontal: 20,
                height: 6,
                backgroundColor: "rgba(255, 255, 255, 0.25)",
                borderRadius: 3,
                overflow: "hidden",
                marginBottom: 20,
              }}
            >
              <Animated.View
                style={{
                  height: "100%",
                  backgroundColor: "#FFFFFF",
                  width: progressWidth,
                  borderRadius: 3,
                }}
              />
            </View>

            {/* Title section */}
            <View style={{ paddingHorizontal: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <Sparkles size={28} color="#FFFFFF" strokeWidth={2.5} />
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: "900",
                    color: "#FFFFFF",
                    marginLeft: 12,
                    letterSpacing: -0.5,
                  }}
                >
                  {isBirthday ? "Tell us more" : "Event Details"}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 15,
                  color: "rgba(255, 255, 255, 0.9)",
                  fontWeight: "500",
                  lineHeight: 22,
                }}
              >
                {isBirthday
                  ? "Share the special details for this birthday celebration 🎂"
                  : "Fill in the key information about your event 🕎"
                }
              </Text>
            </View>
          </View>

          {/* Form Content */}
          <View style={{ backgroundColor: "#FFFFFF", paddingHorizontal: 24, paddingTop: 28 }}>
            {/* Age Field (only for birthdays) */}
            {isBirthday && (
              <View
                style={{
                  marginBottom: 24,
                }}
              >
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
                    <Text style={{ fontSize: 20 }}>🎉</Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: "#6B7280",
                      marginLeft: 12,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                    }}
                  >
                    Turning Age
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 20,
                    padding: 20,
                    borderWidth: 2,
                    borderColor: focusedField === "age" ? "#06D6A0" : errors.age ? "#E5E7EB" : "#E5E7EB",
                    shadowColor: focusedField === "age" ? "#06D6A0" : "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: focusedField === "age" ? 0.15 : 0.05,
                    shadowRadius: 8,
                    elevation: focusedField === "age" ? 4 : 2,
                  }}
                >
                  <TextInput
                    style={{
                      fontSize: 28,
                      fontWeight: "800",
                      color: "#06D6A0",
                      textAlign: "center",
                      paddingVertical: 8,
                    }}
                    placeholder="16"
                    placeholderTextColor="#D1D5DB"
                    value={formData.age}
                    onChangeText={(value) => handleInputChange("age", value)}
                    onFocus={() => setFocusedField("age")}
                    onBlur={() => setFocusedField(null)}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                </View>
                {errors.age && (
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#EF4444",
                      marginTop: 8,
                      fontWeight: "600",
                      paddingHorizontal: 4,
                    }}
                  >
                    ⚠️ {errors.age}
                  </Text>
                )}
              </View>
            )}

            {/* Event Name */}
            <View
              style={{
                marginBottom: 24,
              }}
            >
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
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: "#6B7280",
                    marginLeft: 12,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                  }}
                >
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
                  borderColor: focusedField === "eventName" ? "#06D6A0" : errors.eventName ? "#E5E7EB" : "#E5E7EB",
                  shadowColor: focusedField === "eventName" ? "#06D6A0" : "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: focusedField === "eventName" ? 0.15 : 0.05,
                  shadowRadius: 8,
                  elevation: focusedField === "eventName" ? 4 : 2,
                }}
              >
                <TextInput
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: "#111827",
                    paddingVertical: 6,
                  }}
                  placeholder={
                    isBirthday
                      ? "Emma's Sweet 16 Birthday"
                      : "Sarah's Bat Mitzvah"
                  }
                  placeholderTextColor="#D1D5DB"
                  value={formData.eventName}
                  onChangeText={(value) => handleInputChange("eventName", value)}
                  onFocus={() => setFocusedField("eventName")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              {errors.eventName && (
                <Text
                  style={{
                    fontSize: 12,
                    color: "#EF4444",
                    marginTop: 8,
                    fontWeight: "600",
                    paddingHorizontal: 4,
                  }}
                >
                  ⚠️ {errors.eventName}
                </Text>
              )}
            </View>

            {/* Event Details (Optional) */}
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
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "#E0F7F2",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Notebook size={20} color="#06D6A0" strokeWidth={2.5} />
                </View>
                <View style={{ marginLeft: 14, flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "800",
                      color: "#111827",
                      letterSpacing: 0.3,
                    }}
                  >
                    Event Details
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "500",
                      color: "#9CA3AF",
                      marginTop: 2,
                    }}
                  >
                    Optional • Will be shown on invitation
                  </Text>
                </View>
              </View>

              {/* Add Details Later Toggle */}
              <TouchableOpacity
                onPress={() => setShowEventDetails(!showEventDetails)}
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
                <View style={{
                  width: 50,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: showEventDetails ? "#06D6A0" : "#D1D5DB",
                  padding: 2,
                  justifyContent: "center",
                }}>
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: "#FFFFFF",
                    alignSelf: showEventDetails ? "flex-end" : "flex-start",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.2,
                    shadowRadius: 2,
                  }} />
                </View>
              </TouchableOpacity>

              {/* All Event Details Fields - Hidden when "Add details later" is selected */}
              {showEventDetails && (
                <>
                  {/* Event Type Selector - Only for Bar/Bat Mitzvah */}
                  {isBarBatMitzvah && (
                    <View style={{ marginBottom: 18 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                        <Text style={{ fontSize: 16 }}>🎪</Text>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", marginLeft: 8 }}>What are you planning?</Text>
                      </View>
                      <View style={{ flexDirection: "row", gap: 10 }}>
                        <TouchableOpacity
                          onPress={() => handleInputChange("eventCategory", "formal")}
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
                          <Text style={{
                            fontSize: 14,
                            fontWeight: "700",
                            color: formData.eventCategory === "formal" ? "#FFFFFF" : "#374151"
                          }}>The Ceremony</Text>
                          <Text style={{
                            fontSize: 11,
                            fontWeight: "500",
                            color: formData.eventCategory === "formal" ? "rgba(255,255,255,0.8)" : "#9CA3AF",
                            marginTop: 2,
                          }}>Synagogue, Formal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleInputChange("eventCategory", "party")}
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
                          <Text style={{
                            fontSize: 14,
                            fontWeight: "700",
                            color: formData.eventCategory === "party" ? "#FFFFFF" : "#374151"
                          }}>The Party</Text>
                          <Text style={{
                            fontSize: 11,
                            fontWeight: "500",
                            color: formData.eventCategory === "party" ? "rgba(255,255,255,0.8)" : "#9CA3AF",
                            marginTop: 2,
                          }}>Celebration, Fun!</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Party Attire Options - Shows for birthdays OR when party is selected for Bar/Bat Mitzvah */}
                  {isPartyMode && (
                    <>
                      {/* Party Type - Single Select */}
                      <View style={{ marginBottom: 16 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                          <Text style={{ fontSize: 16 }}>🎊</Text>
                          <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", marginLeft: 8 }}>Party Type</Text>
                          <Text style={{ fontSize: 11, fontWeight: "500", color: "#9CA3AF", marginLeft: 6 }}>(select one)</Text>
                        </View>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                          {[
                            { value: "pool", label: "🏊", name: "Pool Party" },
                            { value: "beach", label: "🏖️", name: "Beach Party" },
                            { value: "garden", label: "🌳", name: "Garden Party" },
                            { value: "indoor", label: "🏠", name: "Indoor Party" },
                            { value: "restaurant", label: "🍽️", name: "Restaurant" },
                            { value: "rooftop", label: "🌆", name: "Rooftop" },
                          ].map((option) => (
                            <TouchableOpacity
                              key={option.value}
                              onPress={() => handleInputChange("partyType", option.value)}
                              style={{
                                width: "31%",
                                backgroundColor: formData.partyType === option.value ? "#06D6A0" : "#F9FAFB",
                                borderRadius: 14,
                                paddingVertical: 12,
                                paddingHorizontal: 8,
                                alignItems: "center",
                                borderWidth: 2,
                                borderColor: formData.partyType === option.value ? "#06D6A0" : "#E5E7EB",
                              }}
                            >
                              <Text style={{ fontSize: 24, marginBottom: 4 }}>{option.label}</Text>
                              <Text style={{
                                fontSize: 11,
                                fontWeight: "700",
                                color: formData.partyType === option.value ? "#FFFFFF" : "#374151",
                                textAlign: "center",
                              }}>{option.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        {/* Other Button - Separate Row */}
                        <TouchableOpacity
                          onPress={() => handleInputChange("partyType", "other")}
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
                          <Text style={{
                            fontSize: 14,
                            fontWeight: "700",
                            color: formData.partyType === "other" ? "#FFFFFF" : "#374151",
                          }}>Other</Text>
                        </TouchableOpacity>

                        {/* Other Party Type Input */}
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
                              value={formData.otherPartyType}
                              onChangeText={(value) => handleInputChange("otherPartyType", value)}
                              onFocus={() => setFocusedField("otherPartyType")}
                              onBlur={() => setFocusedField(null)}
                            />
                          </View>
                        )}
                      </View>

                      {/* Attire Type & Footwear – hidden for Restaurant */}
                      {formData.partyType !== "restaurant" && (
                        <>
                          {/* Attire Type - Single Select */}
                          <View style={{ marginBottom: 16 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                              <Text style={{ fontSize: 16 }}>👕</Text>
                              <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", marginLeft: 8 }}>Attire Type</Text>
                              <Text style={{ fontSize: 11, fontWeight: "500", color: "#9CA3AF", marginLeft: 6 }}>(select one)</Text>
                            </View>
                            <View style={{ flexDirection: "row", gap: 10 }}>
                              {[
                                { value: "casual", label: "👕 Casual", desc: "Everyday wear" },
                                { value: "swimwear", label: "🩱 Swimwear", desc: "Pool/Beach" },
                                { value: "costume", label: "🎭 Costume", desc: "Themed outfit" },
                              ].map((option) => (
                                <TouchableOpacity
                                  key={option.value}
                                  onPress={() => handleInputChange("attireType", option.value)}
                                  style={{
                                    flex: 1,
                                    backgroundColor: formData.attireType === option.value ? "#06D6A0" : "#F9FAFB",
                                    borderRadius: 14,
                                    paddingVertical: 14,
                                    paddingHorizontal: 10,
                                    alignItems: "center",
                                    borderWidth: 2,
                                    borderColor: formData.attireType === option.value ? "#06D6A0" : "#E5E7EB",
                                  }}
                                >
                                  <Text style={{ fontSize: 22, marginBottom: 4 }}>{option.label.split(" ")[0]}</Text>
                                  <Text style={{
                                    fontSize: 12,
                                    fontWeight: "700",
                                    color: formData.attireType === option.value ? "#FFFFFF" : "#374151",
                                    textAlign: "center",
                                  }}>{option.label.split(" ")[1]}</Text>
                                  <Text style={{
                                    fontSize: 10,
                                    color: formData.attireType === option.value ? "rgba(255,255,255,0.8)" : "#9CA3AF",
                                    marginTop: 2,
                                    textAlign: "center",
                                  }}>{option.desc}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>

                          {/* Footwear Type - Single Select */}
                          <View style={{ marginBottom: 14 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                              <Text style={{ fontSize: 16 }}>👟</Text>
                              <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", marginLeft: 8 }}>Footwear</Text>
                              <Text style={{ fontSize: 11, fontWeight: "500", color: "#9CA3AF", marginLeft: 6 }}>(select one)</Text>
                            </View>
                            <View style={{ flexDirection: "row", gap: 10 }}>
                              {[
                                { value: "sneakers", label: "👟", name: "Sneakers" },
                                { value: "slides", label: "🩴", name: "Slides" },
                                { value: "any", label: "✨", name: "Any" },
                              ].map((option) => (
                                <TouchableOpacity
                                  key={option.value}
                                  onPress={() => handleInputChange("footwearType", option.value)}
                                  style={{
                                    flex: 1,
                                    backgroundColor: formData.footwearType === option.value ? "#06D6A0" : "#F9FAFB",
                                    borderRadius: 14,
                                    paddingVertical: 14,
                                    paddingHorizontal: 10,
                                    alignItems: "center",
                                    borderWidth: 2,
                                    borderColor: formData.footwearType === option.value ? "#06D6A0" : "#E5E7EB",
                                  }}
                                >
                                  <Text style={{ fontSize: 24, marginBottom: 4 }}>{option.label}</Text>
                                  <Text style={{
                                    fontSize: 12,
                                    fontWeight: "700",
                                    color: formData.footwearType === option.value ? "#FFFFFF" : "#374151",
                                    textAlign: "center",
                                  }}>{option.name}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>
                        </>
                      )}
                    </>
                  )}

                  {/* Formal Event - Dress Code (only for Bar/Bat Mitzvah ceremony) */}
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
                        value={formData.attireType}
                        onChangeText={(value) => handleInputChange("attireType", value)}
                        onFocus={() => setFocusedField("dressCode")}
                        onBlur={() => setFocusedField(null)}
                      />
                    </View>
                  )}

                  {/* Theme */}
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
                      placeholder="What's the vibe? 🎉"
                      placeholderTextColor="#D1D5DB"
                      value={formData.theme}
                      onChangeText={(value) => handleInputChange("theme", value)}
                      onFocus={() => setFocusedField("theme")}
                      onBlur={() => setFocusedField(null)}
                    />
                    {/* Theme suggestions */}
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                      {["🏆 Sports", "🏰 Inflatables", "🏊 Pool", "🎭 Costumes", "🦸 Superheroes"].map((suggestion) => (
                        <TouchableOpacity
                          key={suggestion}
                          onPress={() => handleInputChange("theme", suggestion)}
                          style={{
                            backgroundColor: "#F3F4F6",
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 20,
                          }}
                        >
                          <Text style={{ fontSize: 12, color: "#6B7280", fontWeight: "600" }}>{suggestion}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Kosher Type - Single Select */}
                  <View style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                      <Text style={{ fontSize: 16 }}>✡️</Text>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", marginLeft: 8 }}>Kosher Type</Text>
                      <Text style={{ fontSize: 11, fontWeight: "500", color: "#9CA3AF", marginLeft: 6 }}>(select one)</Text>
                    </View>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                      {[
                        { value: "kosher-style", label: "🍴", name: "Kosher Style" },
                        { value: "kosher", label: "✡️", name: "Kosher" },
                        { value: "glatt-kosher", label: "Ⓤ", name: "Glatt Kosher" },
                        { value: "not-kosher", label: "🍽️", name: "Not Kosher" },
                      ].map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          onPress={() => handleInputChange("kosherType", option.value)}
                          style={{
                            width: "47%",
                            backgroundColor: formData.kosherType === option.value ? "#06D6A0" : "#F9FAFB",
                            borderRadius: 14,
                            paddingVertical: 12,
                            paddingHorizontal: 8,
                            alignItems: "center",
                            borderWidth: 2,
                            borderColor: formData.kosherType === option.value ? "#06D6A0" : "#E5E7EB",
                          }}
                        >
                          <Text style={{ fontSize: 20, marginBottom: 4 }}>{option.label}</Text>
                          <Text style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: formData.kosherType === option.value ? "#FFFFFF" : "#374151",
                            textAlign: "center",
                          }}>{option.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Meal Type - Only show when kosher option is selected */}
                  {(formData.kosherType === "kosher" || formData.kosherType === "glatt-kosher" || formData.kosherType === "kosher-style") && (
                    <View style={{ marginBottom: 16 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                        <Text style={{ fontSize: 16 }}>🍽️</Text>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", marginLeft: 8 }}>Meal Type</Text>
                        <Text style={{ fontSize: 11, fontWeight: "500", color: "#9CA3AF", marginLeft: 6 }}>(select one)</Text>
                      </View>
                      <View style={{ flexDirection: "row", gap: 10 }}>
                        {[
                          { value: "dairy", label: "🧀", name: "Dairy", desc: "Dairy" },
                          { value: "meat", label: "🥩", name: "Meat", desc: "Meat" },
                          { value: "pareve", label: "🥗", name: "Pareve", desc: "Pareve" },
                        ].map((option) => (
                          <TouchableOpacity
                            key={option.value}
                            onPress={() => {
                              if (option.value === "meat") {
                                handleInputChange("vegetarianType", "");
                              }
                              handleInputChange("mealType", option.value);
                            }}
                            style={{
                              flex: 1,
                              backgroundColor: formData.mealType === option.value ? "#06D6A0" : "#F9FAFB",
                              borderRadius: 14,
                              paddingVertical: 12,
                              paddingHorizontal: 8,
                              alignItems: "center",
                              borderWidth: 2,
                              borderColor: formData.mealType === option.value ? "#06D6A0" : "#E5E7EB",
                            }}
                          >
                            <Text style={{ fontSize: 20, marginBottom: 4 }}>{option.label}</Text>
                            <Text style={{
                              fontSize: 13,
                              fontWeight: "800",
                              color: formData.mealType === option.value ? "#FFFFFF" : "#374151",
                              textAlign: "center",
                            }}>{option.name}</Text>
                            <Text style={{
                              fontSize: 10,
                              fontWeight: "500",
                              color: formData.mealType === option.value ? "rgba(255,255,255,0.8)" : "#9CA3AF",
                              textAlign: "center",
                            }}>{option.desc}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Vegetarian: when Meat = "by request" toggle; when Dairy/Pareve = primary option (None/Vegetarian/Vegan) */}
                  {formData.mealType === "meat" ? (
                    <View style={{ marginBottom: 16 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 16 }}>🌱</Text>
                          <Text style={{ fontSize: 14, fontWeight: "700", color: "#374151", marginTop: 4 }}>
                            Offer vegetarian meals (guests can request)
                          </Text>
                          <Text style={{ fontSize: 12, fontWeight: "500", color: "#9CA3AF", marginTop: 4 }}>
                            Guests can choose if they want a vegetarian option; you'll know to prepare it.
                          </Text>
                        </View>
                        <Switch
                          value={formData.vegetarianType === "by_request"}
                          onValueChange={(value) => handleInputChange("vegetarianType", value ? "by_request" : "")}
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
                        {[
                          { value: "none", label: "🍴", name: "None", desc: "Regular menu" },
                          { value: "vegetarian", label: "🥗", name: "Vegetarian", desc: "No meat" },
                          { value: "vegan", label: "🌱", name: "Vegan", desc: "Plant-based" },
                        ].map((option) => (
                          <TouchableOpacity
                            key={option.value}
                            onPress={() => handleInputChange("vegetarianType", option.value)}
                            style={{
                              flex: 1,
                              backgroundColor: formData.vegetarianType === option.value ? "#06D6A0" : "#F9FAFB",
                              borderRadius: 14,
                              paddingVertical: 12,
                              paddingHorizontal: 8,
                              alignItems: "center",
                              borderWidth: 2,
                              borderColor: formData.vegetarianType === option.value ? "#06D6A0" : "#E5E7EB",
                            }}
                          >
                            <Text style={{ fontSize: 20, marginBottom: 4 }}>{option.label}</Text>
                            <Text style={{
                              fontSize: 11,
                              fontWeight: "700",
                              color: formData.vegetarianType === option.value ? "#FFFFFF" : "#374151",
                              textAlign: "center",
                            }}>{option.name}</Text>
                            <Text style={{
                              fontSize: 10,
                              fontWeight: "500",
                              color: formData.vegetarianType === option.value ? "rgba(255,255,255,0.8)" : "#9CA3AF",
                              textAlign: "center",
                            }}>{option.desc}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Date & Time Card */}
            <View
              style={{
                marginBottom: 24,
                backgroundColor: "#FFFFFF",
                borderRadius: 24,
                padding: 24,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 5,
                borderWidth: 2,
                borderColor: "#F3F4F6",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "#E0F7F2",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#06D6A0",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                  }}
                >
                  <Calendar size={22} color="#06D6A0" strokeWidth={2.5} />
                </View>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "800",
                    color: "#111827",
                    marginLeft: 14,
                    letterSpacing: 0.3,
                  }}
                >
                  When is it happening?
                </Text>
              </View>

              {/* Date Picker */}
              <TouchableOpacity
                onPress={() => {
                  // Sync selectedDate with current formData.date before opening picker
                  if (formData.date) {
                    const [year, month, day] = formData.date.split('-');
                    setSelectedDate(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)));
                  } else {
                    setSelectedDate(new Date());
                  }
                  setShowDatePicker(true);
                  setFocusedField("date");
                }}
                style={{
                  marginBottom: 18,
                  backgroundColor: focusedField === "date" ? "#F0FDFA" : "#F9FAFB",
                  borderRadius: 16,
                  padding: 18,
                  borderWidth: 2,
                  borderColor: focusedField === "date" ? "#06D6A0" : errors.date ? "#EF4444" : "#E5E7EB",
                  shadowColor: focusedField === "date" ? "#06D6A0" : "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: focusedField === "date" ? 0.15 : 0.05,
                  shadowRadius: 4,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: "#6B7280",
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      📅 DATE
                    </Text>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: formData.date ? "#111827" : "#9CA3AF",
                      }}
                    >
                      {formData.date ? formatDateDisplay(formData.date) : "Select event date"}
                    </Text>
                  </View>
                  <View style={{
                    backgroundColor: "#E0F7F2",
                    borderRadius: 12,
                    width: 40,
                    height: 40,
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <Text style={{ fontSize: 20 }}>📆</Text>
                  </View>
                </View>
                {errors.date && (
                  <Text
                    style={{
                      fontSize: 11,
                      color: "#EF4444",
                      marginTop: 10,
                      fontWeight: "600",
                    }}
                  >
                    ⚠️ {errors.date}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Time Picker */}
              <TouchableOpacity
                onPress={() => {
                  // Sync selectedTime with current formData.time before opening picker
                  if (formData.time) {
                    const timeMatch = formData.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
                    if (timeMatch) {
                      let hours = parseInt(timeMatch[1]);
                      const minutes = parseInt(timeMatch[2]);
                      const period = timeMatch[3].toUpperCase();

                      // Convert 12-hour to 24-hour format
                      if (period === 'PM' && hours !== 12) {
                        hours += 12;
                      } else if (period === 'AM' && hours === 12) {
                        hours = 0;
                      }

                      const time = new Date();
                      time.setHours(hours);
                      time.setMinutes(minutes);
                      setSelectedTime(time);
                    }
                  } else {
                    setSelectedTime(new Date());
                  }
                  setShowTimePicker(true);
                  setFocusedField("time");
                }}
                style={{
                  marginBottom: 20,
                  backgroundColor: focusedField === "time" ? "#F0FDFA" : "#F9FAFB",
                  borderRadius: 16,
                  padding: 18,
                  borderWidth: 2,
                  borderColor: focusedField === "time" ? "#06D6A0" : errors.time ? "#EF4444" : "#E5E7EB",
                  shadowColor: focusedField === "time" ? "#06D6A0" : "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: focusedField === "time" ? 0.15 : 0.05,
                  shadowRadius: 4,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: "#6B7280",
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      ⏰ TIME
                    </Text>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: formData.time ? "#111827" : "#9CA3AF",
                      }}
                    >
                      {formData.time || "Select event time"}
                    </Text>
                  </View>
                  <View style={{
                    backgroundColor: "#E0F7F2",
                    borderRadius: 12,
                    width: 40,
                    height: 40,
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <Text style={{ fontSize: 20 }}>🕐</Text>
                  </View>
                </View>
                {errors.time && (
                  <Text
                    style={{
                      fontSize: 11,
                      color: "#EF4444",
                      marginTop: 10,
                      fontWeight: "600",
                    }}
                  >
                    ⚠️ {errors.time}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Info Note */}
              <View
                style={{
                  backgroundColor: "#F0FDFA",
                  borderRadius: 14,
                  padding: 16,
                  borderLeftWidth: 4,
                  borderLeftColor: "#06D6A0",
                  shadowColor: "#06D6A0",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{
                    backgroundColor: "#06D6A0",
                    borderRadius: 18,
                    width: 32,
                    height: 32,
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 2,
                  }}>
                    <Text style={{ fontSize: 16 }}>💡</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        color: "#047857",
                        lineHeight: 19,
                        fontWeight: "700",
                        marginBottom: 4,
                      }}
                    >
                      You can change the date and time later
                    </Text>
                    <Text style={{ fontSize: 13, color: "#059669", fontWeight: "600", lineHeight: 18 }}>
                      All guests will be notified via SMS automatically 📱
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Location Card */}
            <View
              style={{
                marginBottom: 20,
                backgroundColor: "#FFFFFF",
                borderRadius: 24,
                padding: 24,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 5,
                borderWidth: 2,
                borderColor: "#F3F4F6",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "#E0F7F2",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#06D6A0",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                  }}
                >
                  <MapPinned size={22} color="#06D6A0" strokeWidth={2.5} />
                </View>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "800",
                    color: "#111827",
                    marginLeft: 14,
                    letterSpacing: 0.3,
                  }}
                >
                  Where will it be?
                </Text>
              </View>

              {/* Google Places Autocomplete */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: "#6B7280",
                    marginBottom: 12,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  📍 Event Location
                </Text>
                <GooglePlacesTextInput
                  scrollEnabled={false}
                  placeHolderText="Enter event location..."
                  onFocus={() => setFocusedField("address1")}
                  onTouchStart={() => setFocusedField("address1")}
                  style={{
                    input: {
                      borderWidth: focusedField === "address1" ? 2 : 1,
                      // make border color green on focus
                      borderColor: focusedField === "address1" ? "#06D6A0" : "#E5E7EB",
                      borderRadius: 12,
                      backgroundColor: focusedField === "address1" ? "#E0F7F2" : "#F9FAFB",
                      padding: 12,
                      marginBottom: 4,
                    },
                    suggestionsList: {
                      backgroundColor: "#FFFFFF",
                      borderRadius: 12,
                      borderWidth: 0.2,
                      borderColor: "lightgrey",
                    },
                    suggestionItem: {
                      backgroundColor: "#FFFFFF",
                      borderColor: "lightgrey",
                      borderWidth: 1,
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 4,
                    }

                  }}
                  fetchDetails={true}
                  apiKey="AIzaSyA5YGDeZpa2bcYGeZQ7XJOSVPTQCh-HrG8"
                  onPlaceSelect={(place) => {
                    const address2 = place.structuredFormat.secondaryText?.text || "";

                    setFormData({
                      ...formData,
                      address1: place.structuredFormat.mainText.text,
                      address2,
                    });
                    setErrors({
                      ...errors,
                      address1: "",
                      address2: "",
                    });
                  }}
                />

                {errors.address1 && (
                  <Text
                    style={{
                      fontSize: 11,
                      color: "#EF4444",
                      marginTop: 6,
                      fontWeight: "600",
                    }}
                  >
                    ⚠️ {errors.address1}
                  </Text>
                )}
              </View>
              {/* Selected Location Display */}
              {formData.address1 && (
                <View
                  style={{
                    backgroundColor: "#F0FDFA",
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 16,
                    borderLeftWidth: 4,
                    borderLeftColor: "#06D6A0",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: "#06D6A0",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>📍</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#06D6A0", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Selected Location
                      </Text>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 2 }}>
                        {formData.address1}
                      </Text>
                      {formData.address2 && (
                        <Text style={{ fontSize: 13, fontWeight: "500", color: "#6B7280" }}>
                          {formData.address2}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              )}
              {/* Parking Instructions */}
              <View>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                  <Text style={{ fontSize: 16 }}>🅿️</Text>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", marginLeft: 8 }}>Parking Instructions</Text>
                  <Text style={{ fontSize: 11, fontWeight: "500", color: "#9CA3AF", marginLeft: 6 }}>(optional)</Text>
                </View>
                <TextInput
                  style={{
                    backgroundColor: focusedField === "parking" ? "#F0FDFA" : "#F9FAFB",
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: 15,
                    fontWeight: "600",
                    color: "#111827",
                    borderWidth: 1.5,
                    borderColor: focusedField === "parking" ? "#06D6A0" : "#E5E7EB",
                  }}
                  placeholder="e.g. Free valet, Street parking available..."
                  placeholderTextColor="#D1D5DB"
                  value={formData.parking}
                  onChangeText={(value) => handleInputChange("parking", value)}
                  onFocus={() => setFocusedField("parking")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>
          </View>
        </Animated.ScrollView>

        {/* Floating Action Buttons */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 24,
            paddingTop: 20,
            paddingBottom: insets.bottom - 20,
            backgroundColor: "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: "#E5E7EB",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -6 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 12,
          }}
        >
          <TouchableOpacity
            onPress={handleContinue}
            style={{
              backgroundColor: "#06D6A0",
              borderRadius: 20,
              paddingVertical: 20,
              alignItems: "center",
              shadowColor: "#06D6A0",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 20,
              elevation: 10,
              marginBottom: 14,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "800",
                  color: "#FFFFFF",
                  letterSpacing: 0.5,
                }}
              >
                Manage Your Guest List
              </Text>
              <View
                style={{
                  marginLeft: 10,
                  backgroundColor: "rgba(255, 255, 255, 0.3)",
                  borderRadius: 14,
                  width: 32,
                  height: 32,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 18, color: "#FFFFFF" }}>→</Text>
              </View>
            </View>
          </TouchableOpacity>

        </View>
      </View>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowDatePicker(false);
          setFocusedField(null);
        }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
          }}
        >
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 24,
              padding: 24,
              width: "90%",
              maxWidth: 400,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 24,
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: "800",
                color: "#06D6A0",
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              📅 Select Event Date
            </Text>

            <View style={{ alignItems: "center" }}>
              <DateTimePicker
                testID="datePicker"
                value={selectedDate}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                minimumDate={new Date()}
                onChange={(event, date) => {
                  if (date) {
                    setSelectedDate(date);
                  }
                }}
              />
            </View>

            <View style={{ marginTop: 20, gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  handleDateConfirm(selectedDate);
                  setFocusedField(null);
                }}
                style={{
                  backgroundColor: "#06D6A0",
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "800",
                    color: "#FFFFFF",
                  }}
                >
                  Confirm Date
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowDatePicker(false);
                  setFocusedField(null);
                }}
                style={{
                  backgroundColor: "#F3F4F6",
                  borderRadius: 16,
                  paddingVertical: 14,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: "#6B7280",
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowTimePicker(false);
          setFocusedField(null);
        }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
          }}
        >
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 24,
              padding: 24,
              width: "85%",
              maxWidth: 350,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 24,
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: "800",
                color: "#06D6A0",
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              ⏰ Select Event Time
            </Text>

            <View style={{ alignItems: "center" }}>
              <DateTimePicker
                testID="timePicker"
                value={selectedTime}
                mode="time"
                display="spinner"
                minuteInterval={5}
                onChange={(event, time) => {
                  if (time) {
                    setSelectedTime(time);
                  }
                }}
              />
            </View>

            <View style={{ marginTop: 20, gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  handleTimeConfirm(selectedTime);
                  setFocusedField(null);
                }}
                style={{
                  backgroundColor: "#06D6A0",
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "800",
                    color: "#FFFFFF",
                  }}
                >
                  Confirm Time
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowTimePicker(false);
                  setFocusedField(null);
                }}
                style={{
                  backgroundColor: "#F3F4F6",
                  borderRadius: 16,
                  paddingVertical: 14,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: "#6B7280",
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
