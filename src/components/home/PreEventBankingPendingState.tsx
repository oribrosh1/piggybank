import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Animated, { Easing, FadeInUp } from "react-native-reanimated";
import type { EventSummary } from "@/types/events";
import {
  colors,
  spacing,
  fontFamily,
  cardsHtmlSlideUpMs,
  cardsHtmlSlideUpBezier,
  cardsHtmlStagger1Ms,
  cardsHtmlStagger2Ms,
  cardsHtmlStagger3Ms,
} from "@/src/theme";
import BankingSetupRequiredCard from "./BankingSetupRequiredCard";
import UpcomingEventPosterRow from "./UpcomingEventPosterRow";
import LockedNextStepsSection from "./LockedNextStepsSection";

const slideUpEasing = Easing.bezier(
  cardsHtmlSlideUpBezier[0],
  cardsHtmlSlideUpBezier[1],
  cardsHtmlSlideUpBezier[2],
  cardsHtmlSlideUpBezier[3]
);

interface Props {
  event: EventSummary;
  formattedEventDate: string;
  onCompleteBanking: () => void;
  onViewEvent: () => void;
  onViewAllEvents: () => void;
}

/**
 * Pre–banking dashboard — HTML `main` uses `space-y-8`; column `gap` tightened slightly vs full 32px
 * (`animate-slide-up stagger-1`); greeting lives in app header, not duplicated here.
 */
export default function PreEventBankingPendingState({
  event,
  formattedEventDate,
  onCompleteBanking,
  onViewEvent,
  onViewAllEvents,
}: Props) {
  return (
    <View style={styles.column}>
      <Animated.View
        entering={FadeInUp.duration(cardsHtmlSlideUpMs).delay(cardsHtmlStagger1Ms).easing(slideUpEasing)}
      >
        <BankingSetupRequiredCard onCompleteSetup={onCompleteBanking} />
      </Animated.View>

      <Animated.View
        entering={FadeInUp.duration(cardsHtmlSlideUpMs).delay(cardsHtmlStagger2Ms).easing(slideUpEasing)}
        style={styles.sectionBlock}
      >
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Upcoming Event</Text>
          <TouchableOpacity onPress={onViewAllEvents} hitSlop={8}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <UpcomingEventPosterRow event={event} formattedDate={formattedEventDate} onPress={onViewEvent} />
      </Animated.View>

      <Animated.View
        entering={FadeInUp.duration(cardsHtmlSlideUpMs).delay(cardsHtmlStagger3Ms).easing(slideUpEasing)}
        style={styles.sectionBlock}
      >
        <LockedNextStepsSection />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    gap: spacing[2],
  },
  sectionBlock: {
    marginBottom: 0,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[3],
    paddingHorizontal: spacing[2],
  },
  sectionTitle: {
    fontFamily: fontFamily.headline,
    fontSize: 20,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  viewAll: {
    fontFamily: fontFamily.title,
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
});
