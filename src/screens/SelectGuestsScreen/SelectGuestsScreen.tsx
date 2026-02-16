import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Animated,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Plus,
  X,
  Users,
  Search,
  UserPlus,
  Sparkles,
  ChevronRight,
  RefreshCw,
} from "lucide-react-native";
import { useSelectGuestsScreen } from "./useSelectGuestsScreen";

export default function SelectGuestsScreen() {
  const insets = useSafeAreaInsets();
  const {
    guests,
    searchQuery,
    setSearchQuery,
    phoneContacts,
    isLoadingContacts,
    hasPermission,
    isCreatingEvent,
    fadeAnim,
    progressWidth,
    filteredContacts,
    addGuest,
    removeGuest,
    handleContinue,
    loadContacts,
    goBack,
  } = useSelectGuestsScreen();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
    >
      <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        <Animated.ScrollView
          style={{ flex: 1, opacity: fadeAnim, backgroundColor: "#FFFFFF" }}
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View
            style={{
              backgroundColor: "#8B5CF6",
              paddingTop: insets.top,
              paddingBottom: 24,
              borderBottomLeftRadius: 32,
              borderBottomRightRadius: 32,
              shadowColor: "#8B5CF6",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
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
                onPress={goBack}
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
                  STEP 3 OF 3
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
                <Users size={28} color="#FFFFFF" strokeWidth={2.5} />
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: "900",
                    color: "#FFFFFF",
                    marginLeft: 12,
                    letterSpacing: -0.5,
                  }}
                >
                  Manage Guests
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
                Build your guest list now, invite them when you're ready! 🎉
              </Text>
            </View>
          </View>

          {/* Info Card */}
          <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
            <View
              style={{
                backgroundColor: "#F5F3FF",
                borderRadius: 16,
                padding: 16,
                borderLeftWidth: 4,
                borderLeftColor: "#8B5CF6",
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <Text style={{ fontSize: 18 }}>💡</Text>
                <Text style={{ fontSize: 15, fontWeight: "800", color: "#6D28D9", marginLeft: 8 }}>
                  How it works
                </Text>
              </View>
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#8B5CF6", alignItems: "center", justifyContent: "center", marginRight: 10, marginTop: 2 }}>
                    <Text style={{ fontSize: 11, fontWeight: "800", color: "#FFFFFF" }}>1</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: "#6B7280", fontWeight: "600", flex: 1 }}>
                    <Text style={{ fontWeight: "700", color: "#374151" }}>Select contacts</Text> - Add friends & family from your phone
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#8B5CF6", alignItems: "center", justifyContent: "center", marginRight: 10, marginTop: 2 }}>
                    <Text style={{ fontSize: 11, fontWeight: "800", color: "#FFFFFF" }}>2</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: "#6B7280", fontWeight: "600", flex: 1 }}>
                    <Text style={{ fontWeight: "700", color: "#374151" }}>Create your event</Text> - Finish setup & save event details
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#8B5CF6", alignItems: "center", justifyContent: "center", marginRight: 10, marginTop: 2 }}>
                    <Text style={{ fontSize: 11, fontWeight: "800", color: "#FFFFFF" }}>3</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: "#6B7280", fontWeight: "600", flex: 1 }}>
                    <Text style={{ fontWeight: "700", color: "#374151" }}>Send invites later</Text> - When you're ready, invite everyone via SMS! 📱
                  </Text>
                </View>
              </View>
            </View>

            {/* Tip */}
            <View
              style={{
                backgroundColor: "#FEF3C7",
                borderRadius: 12,
                padding: 12,
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 16, marginRight: 10 }}>✨</Text>
              <Text style={{ fontSize: 13, color: "#92400E", fontWeight: "600", flex: 1 }}>
                <Text style={{ fontWeight: "700" }}>Tip:</Text> You can always add more guests later from your event dashboard!
              </Text>
            </View>
          </View>

          {/* Form Content */}
          <View style={{ backgroundColor: "#FFFFFF", paddingHorizontal: 24 }}>
            {/* Add Guests Card */}
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 24,
                padding: 20,
                marginBottom: 20,
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
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "#EDE9FE",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <UserPlus size={22} color="#8B5CF6" strokeWidth={2.5} />
                </View>
                <View style={{ marginLeft: 14, flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: "800", color: "#111827" }}>
                    Add Guests
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: "500", color: "#9CA3AF", marginTop: 2 }}>
                    {phoneContacts.length > 0
                      ? `${phoneContacts.length} contacts available`
                      : "Select from your contacts"}
                  </Text>
                </View>
                {phoneContacts.length > 0 && (
                  <TouchableOpacity
                    onPress={loadContacts}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: "#F3F4F6",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <RefreshCw size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Search Input */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#F9FAFB",
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  borderWidth: 2,
                  borderColor: "#E5E7EB",
                  marginBottom: 16,
                }}
              >
                <Search size={18} color="#9CA3AF" />
                <TextInput
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    paddingHorizontal: 10,
                    fontSize: 15,
                    fontWeight: "600",
                    color: "#111827",
                  }}
                  placeholder="Search contacts..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <X size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Contact List */}
              <View style={{ maxHeight: 280 }}>
                {isLoadingContacts ? (
                  <View style={{ paddingVertical: 40, alignItems: "center" }}>
                    <ActivityIndicator size="large" color="#8B5CF6" />
                    <Text style={{ fontSize: 14, color: "#9CA3AF", fontWeight: "600", marginTop: 12 }}>
                      Loading contacts...
                    </Text>
                  </View>
                ) : hasPermission === false ? (
                  <View style={{ paddingVertical: 30, alignItems: "center" }}>
                    <Text style={{ fontSize: 40, marginBottom: 12 }}>🔒</Text>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: "#6B7280", marginBottom: 8 }}>
                      Permission Required
                    </Text>
                    <Text style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", marginBottom: 16 }}>
                      Allow access to contacts to add guests
                    </Text>
                    <TouchableOpacity
                      onPress={loadContacts}
                      style={{
                        backgroundColor: "#8B5CF6",
                        borderRadius: 12,
                        paddingVertical: 12,
                        paddingHorizontal: 20,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <RefreshCw size={16} color="#FFFFFF" />
                      <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF", marginLeft: 8 }}>
                        Try Again
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                    {filteredContacts.slice(0, 50).map((contact, index) => (
                      <TouchableOpacity
                        key={contact.id}
                        onPress={() => addGuest(contact)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: 12,
                          borderBottomWidth: index < Math.min(filteredContacts.length, 50) - 1 ? 1 : 0,
                          borderBottomColor: "#F3F4F6",
                        }}
                      >
                        <View
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 21,
                            backgroundColor: "#EDE9FE",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text style={{ fontSize: 18, fontWeight: "700", color: "#8B5CF6" }}>
                            {contact.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827" }}>
                            {contact.name}
                          </Text>
                          <Text style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>
                            {contact.phone}
                          </Text>
                        </View>
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: "#8B5CF6",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Plus size={18} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      </TouchableOpacity>
                    ))}
                    {filteredContacts.length === 0 && phoneContacts.length > 0 && (
                      <View style={{ paddingVertical: 20, alignItems: "center" }}>
                        <Text style={{ fontSize: 14, color: "#9CA3AF", fontWeight: "600" }}>
                          {searchQuery ? "No contacts match your search" : "All contacts added! 🎉"}
                        </Text>
                      </View>
                    )}
                    {phoneContacts.length === 0 && !isLoadingContacts && (
                      <View style={{ paddingVertical: 20, alignItems: "center" }}>
                        <Text style={{ fontSize: 14, color: "#9CA3AF", fontWeight: "600" }}>
                          No contacts found on your device
                        </Text>
                      </View>
                    )}
                    {filteredContacts.length > 50 && (
                      <View style={{ paddingVertical: 12, alignItems: "center" }}>
                        <Text style={{ fontSize: 12, color: "#9CA3AF", fontWeight: "600" }}>
                          Showing 50 of {filteredContacts.length} contacts • Use search to find more
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                )}
              </View>
            </View>

            {/* Selected Guests Card */}
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 24,
                padding: 20,
                marginBottom: 20,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 3,
                borderWidth: 2,
                borderColor: guests.length > 0 ? "#8B5CF6" : "#F3F4F6",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: guests.length > 0 ? "#8B5CF6" : "#F3F4F6",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 20 }}>🎉</Text>
                </View>
                <View style={{ marginLeft: 14, flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: "800", color: "#111827" }}>
                    Your Guest List
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: "500", color: "#9CA3AF", marginTop: 2 }}>
                    {guests.length === 0 ? "No guests added yet" : `${guests.length} guest${guests.length > 1 ? "s" : ""} ready to invite`}
                  </Text>
                </View>
                {guests.length > 0 && (
                  <View
                    style={{
                      backgroundColor: "#8B5CF6",
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF" }}>
                      {guests.length}
                    </Text>
                  </View>
                )}
              </View>

              {guests.length === 0 ? (
                <View
                  style={{
                    backgroundColor: "#F9FAFB",
                    borderRadius: 16,
                    padding: 24,
                    alignItems: "center",
                    borderWidth: 2,
                    borderStyle: "dashed",
                    borderColor: "#E5E7EB",
                    minHeight: 150,
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 40, marginBottom: 12 }}>👥</Text>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#6B7280", marginBottom: 4 }}>
                    No Guests Yet
                  </Text>
                  <Text style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center" }}>
                    Search and add contacts above
                  </Text>
                </View>
              ) : (
                <View style={{ maxHeight: 280 }}>
                  <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                    <View style={{ gap: 10 }}>
                      {guests.map((guest) => (
                        <View
                          key={guest.id}
                          style={{
                            backgroundColor: "#FAF5FF",
                            borderRadius: 16,
                            padding: 14,
                            flexDirection: "row",
                            alignItems: "center",
                          }}
                        >
                          <View
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 22,
                              backgroundColor: "#EDE9FE",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text style={{ fontSize: 18, fontWeight: "700", color: "#8B5CF6" }}>
                              {guest.name.charAt(0)}
                            </Text>
                          </View>
                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827" }}>
                              {guest.name}
                            </Text>
                            <Text style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>
                              {guest.phone}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => removeGuest(guest.id)}
                            style={{
                              width: 32,
                              height: 32,
                              backgroundColor: "#FEE2E2",
                              borderRadius: 16,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <X size={16} color="#EF4444" strokeWidth={3} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        </Animated.ScrollView>

        {/* Floating Buttons */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: insets.bottom - 10,
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
          {/* Main Continue Button */}
          <TouchableOpacity
            onPress={() => handleContinue(false)}
            disabled={guests.length === 0 || isCreatingEvent}
            style={{
              backgroundColor: guests.length > 0 && !isCreatingEvent ? "#8B5CF6" : "#E5E7EB",
              borderRadius: 18,
              paddingVertical: 16,
              alignItems: "center",
              shadowColor: guests.length > 0 && !isCreatingEvent ? "#8B5CF6" : "transparent",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: guests.length > 0 && !isCreatingEvent ? 8 : 0,
              marginBottom: 10,
            }}
          >
            {isCreatingEvent ? (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 10 }} />
                <Text style={{ fontSize: 16, fontWeight: "800", color: "#FFFFFF" }}>
                  Creating Event...
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "800",
                    color: guests.length > 0 ? "#FFFFFF" : "#9CA3AF",
                    marginRight: 8,
                  }}
                >
                  Create Event & Review
                </Text>
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: guests.length > 0 ? "rgba(255, 255, 255, 0.25)" : "#D1D5DB",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ChevronRight size={14} color={guests.length > 0 ? "#FFFFFF" : "#9CA3AF"} strokeWidth={3} />
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* Skip Button */}
          <TouchableOpacity
            onPress={() => handleContinue(true)}
            disabled={isCreatingEvent}
            style={{
              backgroundColor: isCreatingEvent ? "#F3F4F6" : "#F9FAFB",
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: "center",
              borderWidth: 2,
              borderColor: "#E5E7EB",
              opacity: isCreatingEvent ? 0.6 : 1,
            }}
          >
            {isCreatingEvent ? (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ActivityIndicator size="small" color="#6B7280" style={{ marginRight: 10 }} />
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#6B7280" }}>
                  Creating Event...
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 14, marginRight: 8 }}>⏭️</Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: "#6B7280",
                  }}
                >
                  Skip for now, add guests later
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}
