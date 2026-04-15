import { useId, useLayoutEffect, useMemo } from "react";
import { View, Text, ScrollView, useWindowDimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from "react-native-svg";
import Animated, { FadeInDown } from "react-native-reanimated";

import { colors, typography, spacing, fontFamily } from "@/src/theme";
import PartyPlannerEmptyContent from "@/src/components/home/PartyPlannerEmptyContent";
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
import { defaultTabBarStyle, hiddenTabBarStyle } from "@/src/navigation/defaultTabBarStyle";
import AppTabFooter from "@/src/components/AppTabFooter";
import AppTabHeader from "@/src/components/AppTabHeader";
import { Sparkles } from "lucide-react-native";

/** Second line only — black → violet gradient (first line stays solid body text). */
function EmptyHomeCaptionGradientLine({ width }: { width: number }) {
  const rawId = useId();
  const gradId = useMemo(() => `home-empty-cap-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`, [rawId]);
  const fs = 17;
  const lh = 28;
  const h = lh + 4;

  return (
    <Svg width={width} height={h}>
      <Defs>
        <SvgLinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#0a0610" />
          <Stop offset="48%" stopColor="#5b21b6" />
          <Stop offset="100%" stopColor={colors.primaryContainer} />
        </SvgLinearGradient>
      </Defs>
      <SvgText
        fill={`url(#${gradId})`}
        fontFamily={fontFamily.body}
        fontSize={fs}
        fontWeight="400"
        x={0}
        y={fs * 0.88}
      >
        receiving gifts and blessings.
      </SvgText>
    </Svg>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width: windowW } = useWindowDimensions();
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
    getGreeting,
    getFormattedEventDate,
  } = useHomeScreen();

  /** Full white loading: hide mesh (opaque root) + bottom tab bar; no Stripe footer strip */
  useLayoutEffect(() => {
    navigation.setOptions({
      tabBarStyle: loading ? hiddenTabBarStyle : defaultTabBarStyle,
    });
  }, [loading, navigation]);

  /** Scroll padding + row: Sparkles (22) + gap (12) + inner paddingRight on row */
  const emptyCaptionWidth = Math.max(160, windowW - spacing[8] - spacing[6] - 22 - 12 - spacing[2]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <LoadingLogoLottie />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <ScrollView
        style={{ backgroundColor: "transparent" }}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: 100,
          paddingLeft: spacing[8],
          paddingRight: spacing[6],
        }}
        showsVerticalScrollIndicator={false}
      >
        <AppTabHeader />

        {/* Conditional State Rendering */}
        {homeState === "empty" && (
          <View>
            <Text style={[typography.headlineLg, { marginBottom: spacing[2] }]}>
              Hey {getFirstName()}!
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 12,
                marginBottom: spacing[6],
                paddingRight: spacing[2],
              }}
            >
              <Animated.View style={{ flex: 1 }} entering={FadeInDown.duration(520).delay(80).springify()}>
                <Text
                  style={[
                    typography.bodyLg,
                    {
                      color: colors.onSurfaceVariant,
                      lineHeight: 28,
                      fontSize: 17,
                      marginBottom: 2,
                    },
                  ]}
                >
                  Create your child&apos;s birthday event to start
                </Text>
                <EmptyHomeCaptionGradientLine width={emptyCaptionWidth} />
              </Animated.View>
              <Animated.View entering={FadeInDown.duration(520).delay(160).springify()}>
                <Sparkles size={22} color={colors.primary} strokeWidth={2.4} style={{ marginTop: 4 }} />
              </Animated.View>
            </View>
            <PartyPlannerEmptyContent onCreateEvent={goToCreateEvent} />
          </View>
        )}

        {homeState === "pre-event-pending-banking" && event && (
          <PreEventBankingPendingState

            
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

        <AppTabFooter />
      </ScrollView>
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
