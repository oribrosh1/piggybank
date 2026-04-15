import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, X, ChevronRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import CreateEventTopBar from "@/src/components/create-event/CreateEventTopBar";
import { ContactAvatar } from "@/src/components/common/ContactAvatar";
import { useSelectGuestsScreen } from "./useSelectGuestsScreen";

const PURPLE = "#8A63E5";
const BG = "transparent";

export default function SelectGuestsScreen() {
  const insets = useSafeAreaInsets();
  const {
    guests,
    searchQuery,
    setSearchQuery,
    phoneContacts,
    isLoadingContacts,
    hasPermission,
    isSavingGuests,
    eventId,
    fadeAnim,
    progressWidth,
    filteredContacts,
    addGuest,
    removeGuest,
    handleContinue,
    loadContacts,
    goBack,
  } = useSelectGuestsScreen();

  if (!eventId) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: BG }}>
        <View style={{ flex: 1, backgroundColor: BG }}>
          <CreateEventTopBar onBack={goBack} />
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: BG }}
    >
      <View style={{ flex: 1, backgroundColor: BG }}>
        <CreateEventTopBar onBack={goBack} />

        <Animated.ScrollView
          style={{ flex: 1, opacity: fadeAnim, backgroundColor: BG }}
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ paddingHorizontal: 20, paddingTop: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: "800", color: PURPLE, letterSpacing: 1.2, marginBottom: 8 }}>STEP 3 OF 3</Text>
            <Text style={{ fontSize: 26, fontWeight: "800", color: PURPLE, marginBottom: 16, letterSpacing: -0.3 }}>Invite your guests</Text>

            <View style={{ height: 6, backgroundColor: "#E5E7EB", borderRadius: 3, overflow: "hidden", marginBottom: 16 }}>
              <Animated.View
                style={{
                  height: "100%",
                  backgroundColor: PURPLE,
                  width: progressWidth,
                  borderRadius: 3,
                }}
              />
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#F3F4F6",
                borderRadius: 16,
                paddingHorizontal: 14,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                marginBottom: 22,
              }}
            >
              <Search size={20} color="#9CA3AF" strokeWidth={2} />
              <TextInput
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  paddingHorizontal: 10,
                  fontSize: 15,
                  fontWeight: "600",
                  color: "#111827",
                }}
                placeholder="Search name or phone number..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={8}>
                  <X size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={{ fontSize: 17, fontWeight: "800", color: "#111827" }}>Selected Guests</Text>
              {guests.length > 0 && (
                <View style={{ backgroundColor: "#34D399", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: "800", color: "#FFFFFF" }}>{guests.length} ADDED</Text>
                </View>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
              style={{ marginBottom: 8 }}
            >
              {guests.map((guest) => (
                <View
                  key={guest.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#FFFFFF",
                    borderRadius: 20,
                    paddingVertical: 8,
                    paddingLeft: 8,
                    paddingRight: 10,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    gap: 8,
                  }}
                >
                  <ContactAvatar name={guest.name} imageUri={guest.imageUri} size={36} backgroundColor="#EDE9FE" textColor={PURPLE} />
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827", maxWidth: 100 }} numberOfLines={1}>
                    {guest.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeGuest(guest.id)}
                    hitSlop={8}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: "#FEE2E2",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <X size={12} color="#EF4444" strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <Text style={{ fontSize: 17, fontWeight: "800", color: "#111827", marginBottom: 12, marginTop: 8 }}>Contacts</Text>

            {isLoadingContacts ? (
              <View style={{ paddingVertical: 40, alignItems: "center" }}>
                <ActivityIndicator size="large" color={PURPLE} />
                <Text style={{ fontSize: 14, color: "#9CA3AF", fontWeight: "600", marginTop: 12 }}>Loading contacts...</Text>
              </View>
            ) : hasPermission === false ? (
              <View style={{ paddingVertical: 24, alignItems: "center" }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#6B7280", marginBottom: 8 }}>Permission required</Text>
                <Text style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", marginBottom: 16 }}>
                  Allow contacts to add guests from your phone.
                </Text>
                <TouchableOpacity
                  onPress={loadContacts}
                  style={{ backgroundColor: PURPLE, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 20 }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>Try again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {filteredContacts.slice(0, 50).map((contact) => (
                  <View
                    key={contact.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#F8FAFC",
                      borderRadius: 16,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: "#EEF2F6",
                    }}
                  >
                    <ContactAvatar
                      name={contact.name}
                      imageUri={contact.imageUri}
                      size={44}
                      backgroundColor="#EDE9FE"
                      textColor={PURPLE}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827" }}>{contact.name}</Text>
                      <Text style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>{contact.phone}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => addGuest(contact)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: PURPLE,
                        backgroundColor: "#FFFFFF",
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "800", color: PURPLE }}>Add</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {filteredContacts.length === 0 && phoneContacts.length > 0 && (
                  <Text style={{ textAlign: "center", color: "#9CA3AF", paddingVertical: 16 }}>No matches</Text>
                )}
                {phoneContacts.length === 0 && !isLoadingContacts && (
                  <Text style={{ textAlign: "center", color: "#9CA3AF", paddingVertical: 16 }}>No contacts found</Text>
                )}
              </View>
            )}
          </View>
        </Animated.ScrollView>

        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: Math.max(insets.bottom, 16),
            backgroundColor: BG,
            borderTopWidth: 1,
            borderTopColor: "#E5E7EB",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => handleContinue(false)}
            disabled={guests.length === 0 || isSavingGuests}
            activeOpacity={0.9}
            style={{ borderRadius: 20, overflow: "hidden", marginBottom: 12, opacity: guests.length > 0 && !isSavingGuests ? 1 : 0.45 }}
          >
            <LinearGradient
              colors={guests.length > 0 && !isSavingGuests ? ["#FFB72B", "#FBBF24"] : ["#D1D5DB", "#D1D5DB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 16,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {isSavingGuests ? (
                <ActivityIndicator color="#111827" />
              ) : (
                <>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: "#111827" }}>Go to event</Text>
                  <ChevronRight size={18} color="#111827" strokeWidth={2.5} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleContinue(true)}
            disabled={isSavingGuests}
            style={{ alignItems: "center", paddingVertical: 8 }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#6B7280" }}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
