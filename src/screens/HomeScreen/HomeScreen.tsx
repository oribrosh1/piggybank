import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronRight } from "lucide-react-native";
import { useHomeScreen } from "./useHomeScreen";
import {
  StepCard,
  QuickActions,
  ActiveEventsSection,
  VirtualCardFeature,
  GiftCardsSection,
} from "@/src/components/home";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    loading,
    userProfile,
    activeEvents,
    eventsCount,
    stepsConfig,
    getEventEmoji,
    formatDate,
    getUserGreeting,
    getFirstName,
    goToEventDashboard,
    goToMyEvents,
    goToBanking,
    goToCreateEvent,
  } = useHomeScreen();

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: 30,
          paddingHorizontal: 20,
        }}
      >
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 16, color: "#6B7280", fontWeight: "600", marginBottom: 4 }}>
            {getUserGreeting()} 👋
          </Text>
          <Text style={{ fontSize: 28, fontWeight: "900", color: "#1F2937" }}>
            {loading ? "..." : getFirstName()}
          </Text>
        </View>

        <QuickActions
          eventsCount={eventsCount}
          creditLabel={userProfile?.stripeAccountCreated ? "Connected" : "Set up"}
          loading={loading}
          onMyEvents={goToMyEvents}
          onBanking={goToBanking}
        />

        {activeEvents.length > 0 && (
          <ActiveEventsSection
            events={activeEvents}
            getEventEmoji={getEventEmoji}
            formatDate={formatDate}
            onEventPress={goToEventDashboard}
          />
        )}

        {activeEvents.length === 0 && (
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#1F2937" }}>Active Events</Text>
            </View>
            <View
              style={{
                backgroundColor: "#F9FAFB",
                borderRadius: 16,
                padding: 24,
                alignItems: "center",
                borderWidth: 2,
                borderStyle: "dashed",
                borderColor: "#E5E7EB",
              }}
            >
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🎉</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#6B7280", marginBottom: 4 }}>No Active Events</Text>
              <Text style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center" }}>Create your first event to get started!</Text>
            </View>
          </View>
        )}

        <VirtualCardFeature />

        {/* Getting Started Journey */}
        <View style={{ marginBottom: 0 }}>
          <View style={{ gap: 0 }}>
            {stepsConfig.map((config) => (
              <StepCard
                key={config.step}
                config={config}
                currentStep={userProfile?.onboardingStep}
              />
            ))}
          </View>
          {eventsCount === 0 && (
            <TouchableOpacity
              onPress={goToCreateEvent}
              style={{
                backgroundColor: "#FBBF24",
                borderRadius: 16,
                padding: 18,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 20,
                shadowColor: "#FBBF24",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "800", color: "#FFFFFF" }}>
                🎉 Start Your First Event
              </Text>
              <ChevronRight size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          )}
        </View>

        <GiftCardsSection />
      </ScrollView>
    </View>
  );
}
