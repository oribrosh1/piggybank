import { View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

import { useHomeScreen } from "./useHomeScreen";
import EventHeroCard from "@/src/components/home/EventHeroCard";
import BirthdayWalletCard from "@/src/components/home/BirthdayWalletCard";
import QuickActionsPreEvent from "@/src/components/home/QuickActionsPreEvent";
import RecentRSVPsList, {
  type RSVPItem,
} from "@/src/components/home/RecentRSVPsList";
import UnlockedBalanceCard from "@/src/components/home/UnlockedBalanceCard";
import QuickActionsPostEvent from "@/src/components/home/QuickActionsPostEvent";
import GiftRevealList from "@/src/components/home/GiftRevealList";
import QuickActionsChildActive from "@/src/components/home/QuickActionsChildActive";
import ChildTransactionFeed from "@/src/components/home/ChildTransactionFeed";
import ParentalControlsGrid from "@/src/components/home/ParentalControlsGrid";
import PreEventBankingPendingState from "@/src/components/home/PreEventBankingPendingState";
import { LoadingLogoLottie } from "@/src/components/LoadingLogoLottie";

const TERMS_URL = "https://creditkid.vercel.app/terms";
const PRIVACY_URL = "https://creditkid.vercel.app/privacy";
const HELP_URL = "https://creditkid.vercel.app";

function TrustBadge({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <Ionicons name={icon} size={15} color="#9CA3AF" />
      <Text style={{ fontSize: 11, fontWeight: "600", color: "#9CA3AF" }}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    loading,
    homeState,
    userProfile,
    event,
    childName,
    card,
    transactions,
    getFirstName,
    getChildFirstName,
    getDaysUntilEvent,
    getRsvpPercentage,
    getTotalGifts,
    getBalance,
    goToEventDashboard,
    goToCreateEvent,
    goToKids,
    goToMyEvents,
    goToBankingSetup,
    goToProfile,
    getGreeting,
    getFormattedEventDate,
  } = useHomeScreen();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#FFFFFF",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LoadingLogoLottie />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#FAFAFA" }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: 100,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header — parent dashboard */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "800",
                color: "#7C3AED",
                fontStyle: "italic",
                letterSpacing: -0.3,
              }}
            >
              CreditKid
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <TouchableOpacity
              onPress={() => {}}
              hitSlop={10}
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications-outline" size={24} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => void Linking.openURL(HELP_URL)}
              hitSlop={10}
              accessibilityLabel="Help"
            >
              <Ionicons name="help-circle-outline" size={24} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={goToProfile}
              hitSlop={10}
              accessibilityLabel="Profile"
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#E5E7EB",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                }}
              >
                <Ionicons name="person" size={20} color="#6B7280" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Conditional State Rendering */}
        {homeState === "empty" && (
          <EmptyState
            firstName={getFirstName()}
            onCreateEvent={goToCreateEvent}
          />
        )}

        {homeState === "pre-event-pending-banking" && event && (
          <PreEventBankingPendingState
            greeting={getGreeting()}
            firstName={getFirstName()}
            event={event}
            formattedEventDate={getFormattedEventDate()}
            onCompleteBanking={goToBankingSetup}
            onViewEvent={goToEventDashboard}
            onViewAllEvents={goToMyEvents}
          />
        )}

        {homeState === "pre-event" && event && (
          <PreEventState
            event={event}
            daysUntil={getDaysUntilEvent()}
            rsvpPercentage={getRsvpPercentage()}
            onViewEvent={goToEventDashboard}
            onViewGuestList={goToEventDashboard}
            onSendReminder={goToEventDashboard}
            onSeeAllRsvps={goToEventDashboard}
          />
        )}

        {homeState === "post-event" && (
          <PostEventState
            childName={getChildFirstName()}
            totalGifts={getTotalGifts()}
            event={event}
            onLinkChild={goToKids}
            onViewGifts={goToEventDashboard}
            onSeeAllGifts={goToEventDashboard}
          />
        )}

        {homeState === "child-active" && (
          <ChildActiveState
            childName={getChildFirstName()}
            balance={getBalance()}
            card={card}
            transactions={transactions}
            onManageCard={goToKids}
            onViewGifts={goToEventDashboard}
            onSeeAllActivity={goToKids}
          />
        )}

        {/* Footer — trust + legal */}
        <View style={{ marginTop: 24, paddingBottom: 8 }}>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "center",
              gap: 6,
              marginBottom: 16,
            }}
          >
            <TrustBadge icon="shield-checkmark-outline" label="Bank-level Encryption" />
            <TrustBadge icon="shield-checkmark-outline" label="Secured by Stripe" />
            <TrustBadge icon="shield-checkmark-outline" label="GDPR Compliant" />
          </View>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 20,
            }}
          >
            <TouchableOpacity onPress={() => void Linking.openURL(TERMS_URL)}>
              <Text style={{ fontSize: 12, color: "#6B7280", fontWeight: "500" }}>Terms of Service</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => void Linking.openURL(PRIVACY_URL)}>
              <Text style={{ fontSize: 12, color: "#6B7280", fontWeight: "500" }}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function EmptyState({
  firstName,
  onCreateEvent,
}: {
  firstName: string;
  onCreateEvent: () => void;
}) {
  return (
    <View>
      <Text
        style={{
          fontSize: 24,
          fontWeight: "800",
          color: "#1F2937",
          marginBottom: 8,
        }}
      >
        Hey {firstName}!
      </Text>
      <Text
        style={{
          fontSize: 15,
          color: "#6B7280",
          lineHeight: 22,
          marginBottom: 32,
        }}
      >
        Create your child's birthday event to start receiving gifts and
        blessings.
      </Text>

      <View
        style={{
          backgroundColor: "#FFF",
          borderRadius: 20,
          padding: 32,
          alignItems: "center",
          marginBottom: 24,
          borderWidth: 2,
          borderStyle: "dashed",
          borderColor: "#E5E7EB",
        }}
      >
        <Ionicons
          name="add-circle-outline"
          size={48}
          color="#7C3AED"
          style={{ marginBottom: 16 }}
        />
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: "#1F2937",
            marginBottom: 6,
          }}
        >
          No Event Yet
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: "#9CA3AF",
            textAlign: "center",
            lineHeight: 20,
            marginBottom: 20,
          }}
        >
          Create your first birthday event and invite guests to send gifts
          your child can spend anywhere.
        </Text>
        <TouchableOpacity
          onPress={onCreateEvent}
          activeOpacity={0.85}
          style={{
            backgroundColor: "#7C3AED",
            borderRadius: 14,
            paddingHorizontal: 32,
            paddingVertical: 14,
            shadowColor: "#7C3AED",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text
            style={{ fontSize: 15, fontWeight: "700", color: "#FFF" }}
          >
            Create Event
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PreEventState({
  event,
  daysUntil,
  rsvpPercentage,
  onViewEvent,
  onViewGuestList,
  onSendReminder,
  onSeeAllRsvps,
}: {
  event: any;
  daysUntil: number;
  rsvpPercentage: number;
  onViewEvent: () => void;
  onViewGuestList: () => void;
  onSendReminder: () => void;
  onSeeAllRsvps: () => void;
}) {
  const stats = event.guestStats;
  const confirmed = (stats?.confirmed || 0) + (stats?.paid || 0);
  const total = stats?.total || 0;

  const unlockDate = new Date(event.date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  const mockRsvps: RSVPItem[] = [];

  return (
    <View>
      <EventHeroCard
        eventName={event.eventName}
        daysUntil={daysUntil}
        rsvpPercentage={rsvpPercentage}
        confirmedGuests={confirmed}
        totalGuests={total}
        onViewEvent={onViewEvent}
      />

      <BirthdayWalletCard unlockDate={unlockDate} />

      <QuickActionsPreEvent
        onViewGuestList={onViewGuestList}
        onSendReminder={onSendReminder}
      />

      {mockRsvps.length > 0 && (
        <RecentRSVPsList rsvps={mockRsvps} onSeeAll={onSeeAllRsvps} />
      )}
    </View>
  );
}

function PostEventState({
  childName,
  totalGifts,
  event,
  onLinkChild,
  onViewGifts,
  onSeeAllGifts,
}: {
  childName: string;
  totalGifts: number;
  event: any;
  onLinkChild: () => void;
  onViewGifts: () => void;
  onSeeAllGifts: () => void;
}) {
  return (
    <View>
      <UnlockedBalanceCard
        childName={childName}
        balance={totalGifts}
      />

      <QuickActionsPostEvent
        childName={childName}
        onLinkChild={onLinkChild}
        onViewGifts={onViewGifts}
      />

      <GiftRevealList
        gifts={[]}
        totalGifts={event?.guestStats?.paid || 0}
        onSeeAll={onSeeAllGifts}
      />
    </View>
  );
}

function ChildActiveState({
  childName,
  balance,
  card,
  transactions,
  onManageCard,
  onViewGifts,
  onSeeAllActivity,
}: {
  childName: string;
  balance: number;
  card: any;
  transactions: any[];
  onManageCard: () => void;
  onViewGifts: () => void;
  onSeeAllActivity: () => void;
}) {
  return (
    <View>
      <UnlockedBalanceCard
        childName={card?.childName || childName}
        balance={balance}
        last4={card?.card?.last4}
        brand={card?.card?.brand}
      />

      <QuickActionsChildActive
        childName={childName}
        onManageCard={onManageCard}
        onViewGifts={onViewGifts}
      />

      <ChildTransactionFeed
        childName={childName}
        transactions={transactions}
        onSeeAll={onSeeAllActivity}
      />

      <ParentalControlsGrid card={card} />
    </View>
  );
}
