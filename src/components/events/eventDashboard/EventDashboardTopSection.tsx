import React, { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Platform,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  BarChart3,
  Bell,
  CalendarClock,
  Check,
  ChevronRight,
  Contact,
  CreditCard,
  Ellipsis,
  Gift,
  LayoutTemplate,
  ArrowLeftRight,
  Pencil,
  Sparkles,
  UserCheck,
  Users,
  Wand2,
  Zap,
} from "lucide-react-native";
import type { Event } from "@/types/events";
import {
  GlassCardDark,
  GLASS_CARD_DARK_BORDER_DEFAULT,
} from "@/src/components/common/GlassCardDark";
import { colors, fontFamily, glassCardBorder, glassCardFillDark, radius, spacing } from "@/src/theme";
import { EventPosterIntroLine } from "./EventDashboardLayout";

const VIOLET = colors.primary;
/** Hero row cards — rounded corners aligned with `radius.md`. */
const HERO_CARD_RADIUS = radius.md;

/** Fixed height for poster + setup progress cards (always 320px). */
const HERO_CARD_HEIGHT = 320;

export function isQuickPosterEvent(event: Event): boolean {
  if (!event.posterUrl?.trim()) return false;
  return !(
    event.posterPrompt?.trim() ||
    event.skeletonPosterUrl ||
    event.posterThemeId ||
    event.visualTeaser?.trim()
  );
}

function getPosterOptionDisplay(
  event: Event,
  isQuickPoster: boolean,
  basicTemplateOnly: boolean,
): { title: string; Icon: StepIcon } {
  if (isQuickPoster) return { title: "Quick Poster", Icon: Zap };
  if (basicTemplateOnly) {
    return { title: "Standard Poster", Icon: LayoutTemplate };
  }
  if (
    event.posterPrompt?.trim() ||
    event.posterThemeId ||
    event.skeletonPosterUrl
  ) {
    return { title: "AI Poster", Icon: Wand2 };
  }
  return { title: "Premium Poster", Icon: Sparkles };
}

type SetupStepId =
  | "banking"
  | "invites"
  | "guests"
  | "rsvps"
  | "gifts";

type StepVisualState = "done" | "active" | "pending";

type StepIcon = React.ComponentType<{
  size: number;
  color: string;
  strokeWidth?: number;
}>;

type SetupStep = {
  id: SetupStepId;
  label: string;
  Icon: StepIcon;
  state: StepVisualState;
};

const SETUP_STEP_DEFS: { id: SetupStepId; label: string; Icon: StepIcon }[] = [
  { id: "banking", label: "Verify Identity & Link Bank Account to Get CreditKid Card", Icon: CreditCard },
  {
    id: "invites",
    label: "Schedule Automatic SMS Invitation & Reminders",
    Icon: CalendarClock,
  },
  { id: "guests", label: "Add Guests From Phone Contacts", Icon: Contact },
  { id: "rsvps", label: "Track and Manage RSVPs in Realtime", Icon: UserCheck },
  {
    id: "gifts",
    label: "Get Digital Gifts and Blessing Cards on The Big Day!",
    Icon: Gift,
  },
];

function buildSetupSteps(
  event: Event,
  bankingReady: boolean,
): SetupStep[] {
  const hasGuests = event.guests.length > 0;
  const hasInvited = event.guests.some((g) =>
    ["invited", "confirmed", "paid", "declined", "invalid_phone"].includes(
      g.status,
    ),
  );
  const hasRsvpActivity = event.guests.some((g) =>
    ["confirmed", "paid", "declined"].includes(g.status),
  );
  const hasGifts = event.guests.some((g) => g.status === "paid");

  const doneFlags = [
    bankingReady,
    bankingReady && hasInvited,
    hasGuests,
    hasRsvpActivity,
    hasGifts,
  ];

  let activeIndex = doneFlags.findIndex((d) => !d);
  if (activeIndex === -1) activeIndex = doneFlags.length;

  return SETUP_STEP_DEFS.map((def, i) => ({
    ...def,
    state: doneFlags[i]
      ? "done"
      : i === activeIndex
        ? "active"
        : "pending",
  }));
}

type EventSetupProgressCardProps = {
  steps: SetupStep[];
  onStepPress?: (id: SetupStepId) => void;
  style?: StyleProp<ViewStyle>;
};

function renderProgressStepLabel(step: SetupStep) {
  if (step.id === "banking") {
    return (
      <Text
        style={[
          styles.progressLabel,
          step.state === "pending" && styles.progressLabelPending,
        ]}
      >
        Verify Identity & Link Bank Account{" "}
        <Text
          style={[
            styles.progressLabel,
            styles.progressLabelBold,
            step.state === "pending" && styles.progressLabelPending,
          ]}
        >
          to Get a CreditKid Card
        </Text>
      </Text>
    );
  }

  return (
    <Text
      style={[
        styles.progressLabel,
        step.state === "active" && styles.progressLabelActive,
        step.state === "pending" && styles.progressLabelPending,
      ]}
    >
      {step.label}
    </Text>
  );
}

function EventSetupProgressCard({
  steps,
  onStepPress,
  style,
}: EventSetupProgressCardProps) {
  return (
    <View style={[styles.progressCard, style]}>
      <Text style={styles.progressTitle}>Event Setup Progress</Text>
      <ScrollView
        style={styles.progressListScroll}
        contentContainerStyle={styles.progressListContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <View key={step.id}>
              <TouchableOpacity
                style={styles.progressRow}
                onPress={() => onStepPress?.(step.id)}
                activeOpacity={step.state === "active" ? 0.75 : 1}
                disabled={!onStepPress}
                accessibilityRole="button"
                accessibilityLabel={step.label}
              >
                <View style={styles.progressRowLeft}>
                  <StepIndicator Icon={step.Icon} state={step.state} />
                  {renderProgressStepLabel(step)}
                </View>
                {step.state === "active" ? (
                  <ChevronRight size={18} color={VIOLET} strokeWidth={2.4} />
                ) : null}
              </TouchableOpacity>
              {!isLast ? <View style={styles.progressConnector} /> : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function StepIndicator({
  Icon,
  state,
}: {
  Icon: StepIcon;
  state: StepVisualState;
}) {
  if (state === "done") {
    return (
      <View style={[styles.stepCircle, styles.stepCircleDone]}>
        <Check size={14} color="#FFFFFF" strokeWidth={3} />
      </View>
    );
  }

  const iconColor = state === "active" ? colors.onPrimary : "#9CA3AF";

  return (
    <View
      style={[
        styles.stepCircle,
        state === "active" ? styles.stepCircleActive : styles.stepCirclePending,
      ]}
    >
      <Icon size={14} color={iconColor} strokeWidth={2.2} />
    </View>
  );
}

type CompactPosterCardProps = {
  event: Event;
  onGeneratePoster: () => void;
  onEditEvent: () => void;
  onPreviewPoster: () => void;
  style?: StyleProp<ViewStyle>;
};

function CompactPosterCard({
  event,
  onGeneratePoster,
  onEditEvent,
  onPreviewPoster,
  style,
}: CompactPosterCardProps) {
  const basicTemplateOnly =
    event.optionalDetailsLater === true && !event.posterUrl;
  const isQuickPoster = isQuickPosterEvent(event);
  const posterOption = getPosterOptionDisplay(
    event,
    isQuickPoster,
    basicTemplateOnly,
  );
  const PosterOptionIcon = posterOption.Icon;
  const overlayLabel = isQuickPoster
    ? "Active Poster"
    : basicTemplateOnly
      ? "BASIC TEMPLATE"
      : "Active design";

  return (
    <GlassCardDark
      fill
      style={style}
      contentStyle={styles.posterCardContent}
      padding={spacing[1]}
      borderRadius={HERO_CARD_RADIUS}
      borderColor={glassCardBorder}
    >
      <EventPosterIntroLine event={event} showCelebrationEmoji embedded />
      <View style={styles.posterCardBody}>
        <View style={styles.posterCompactFrameWrap}>
          <TouchableOpacity
            style={styles.posterCompactFrame}
            onPress={onPreviewPoster}
            activeOpacity={0.92}
            accessibilityRole="button"
            accessibilityLabel="Preview SMS invitation"
          >
          {event.posterUrl ? (
            <Image
              source={{ uri: event.posterUrl }}
              style={styles.posterCompactImage}
              resizeMode="cover"
            />
          ) : basicTemplateOnly ? (
            <LinearGradient
              colors={["#F9A8D4", "#C084FC", "#6366F1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={styles.posterCompactPlaceholder}>
              <Text style={styles.posterCompactPlaceholderText}>No poster yet</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.posterEditBtnOverlay}>
          <TouchableOpacity
            style={styles.posterSwitchBtn}
            onPress={onEditEvent}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Edit event"
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Pencil size={8} color={VIOLET} strokeWidth={2} />
            <Text style={styles.posterSwitchBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
        {isQuickPoster ? (
          <View style={styles.posterActivePillOverlay} pointerEvents="none">
            <GlassCardDark
              // padding={5}
              borderRadius={radius.full}
              borderColor={GLASS_CARD_DARK_BORDER_DEFAULT}
              blurIntensity={100}
              style={styles.posterOverlayGlassPill}
              contentStyle={styles.posterOverlayGlassPillContent}
            >
              <View style={styles.activeDesignDot} />
              <Text style={styles.activeDesignPillTextOnPoster}>{overlayLabel}</Text>
            </GlassCardDark>
          </View>
        ) : null}
        </View>
        <View style={styles.posterOptionFooter}>
          {/* <View style={styles.posterOptionDivider} /> */}
          <View style={styles.posterOptionRow}>
            <View style={styles.posterOptionRowLeft}>
              <View style={styles.posterOptionIconBubble}>
                <PosterOptionIcon size={10} color={VIOLET} strokeWidth={2} />
              </View>
              <Text style={styles.posterOptionTitle} numberOfLines={1}>
                {posterOption.title} Option
              </Text>
            </View>
            <View style={styles.posterOptionActions}>
              <TouchableOpacity
                style={styles.posterSwitchBtn}
                onPress={onGeneratePoster}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Switch poster option"
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <ArrowLeftRight size={8} color={VIOLET} strokeWidth={2} />
                <Text style={styles.posterSwitchBtnText}>Switch</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </GlassCardDark>
  );
}

type DashboardIconNavProps = {
  onGuests: () => void;
  onReminders: () => void;
  onAnalytics: () => void;
  onPoster: () => void;
  onMore: () => void;
  showAlertDot?: boolean;
};

function DashboardIconNav({
  onGuests,
  onReminders,
  onAnalytics,
  onPoster,
  onMore,
}: DashboardIconNavProps) {
  const items = [
    { key: "guests", label: "Guests", Icon: Users, onPress: onGuests },
    { key: "reminders", label: "Reminders", Icon: Bell, onPress: onReminders },
    {
      key: "analytics",
      label: "Analytics",
      Icon: BarChart3,
      onPress: onAnalytics,
    },
    { key: "poster", label: "Poster", Icon: Sparkles, onPress: onPoster },
    { key: "more", label: "More", Icon: Ellipsis, onPress: onMore },
  ] as const;

  return (
    <View style={styles.iconNav}>
      {items.map(({ key, label, Icon, onPress }) => (
        <TouchableOpacity
          key={key}
          style={styles.iconNavCell}
          onPress={onPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          <View style={styles.iconNavBubble}>
            <Icon size={22} color={VIOLET} strokeWidth={2} />
          </View>
          <Text style={styles.iconNavLabel}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export type EventDashboardTopSectionProps = {
  event: Event;
  bankingReady: boolean;
  onGeneratePoster: () => void;
  onEditEvent: () => void;
  onPreviewPoster: () => void;
  onGuests: () => void;
  onReminders: () => void;
  onAnalytics: () => void;
  onMore: () => void;
  onSetupStepPress?: (id: SetupStepId) => void;
};

export function EventDashboardTopSection({
  event,
  bankingReady,
  onGeneratePoster,
  onEditEvent,
  onPreviewPoster,
  onGuests,
  onReminders,
  onAnalytics,
  onMore,
  onSetupStepPress,
}: EventDashboardTopSectionProps) {
  const steps = useMemo(
    () => buildSetupSteps(event, bankingReady),
    [event, bankingReady],
  );

  return (
    <View style={styles.topSection}>
      <View style={styles.heroRow}>
        <View style={[styles.heroCol, styles.heroColLeft]}>
          <CompactPosterCard
            event={event}
            onGeneratePoster={onGeneratePoster}
            onEditEvent={onEditEvent}
            onPreviewPoster={onPreviewPoster}
            style={styles.heroPosterCard}
          />
        </View>
        <EventSetupProgressCard
          steps={steps}
          onStepPress={onSetupStepPress}
          style={[styles.heroCol, styles.heroColProgress]}
        />
      </View>
      <DashboardIconNav
        onGuests={onGuests}
        onReminders={onReminders}
        onAnalytics={onAnalytics}
        onPoster={onGeneratePoster}
        onMore={onMore}
      />
    </View>
  );
}

export type { SetupStepId };

const styles = StyleSheet.create({
  topSection: {
    paddingBottom: spacing[2],
    marginTop: spacing[2],
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: spacing[2],
    gap: spacing[2],
  },
  heroCol: {
    flex: 1,
    minWidth: 0,
  },
  heroColLeft: {
    height: HERO_CARD_HEIGHT,
  },
  heroPosterCard: {
    flex: 1,
    minHeight: 0,
    height: HERO_CARD_HEIGHT,
  },
  heroColProgress: {
    height: HERO_CARD_HEIGHT,
  },
  posterCardContent: {
    flex: 1,
    minHeight: 0,
    flexDirection: "column",
  },
  posterCardBody: {
    flex: 1,
    minHeight: 0,
  },
  progressCard: {
    height: HERO_CARD_HEIGHT,
    overflow: "hidden",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: HERO_CARD_RADIUS,
    padding: spacing[2],
    borderWidth: 1,
    borderColor: "rgba(107, 56, 212, 0.08)",
    shadowColor: "#0c1c2a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  progressTitle: {
    fontFamily: fontFamily.headline,
    fontSize: 14,
    fontWeight: "800",
    color: colors.onSurface,
    marginBottom: spacing[3],
    letterSpacing: -0.2,
    textAlign: "center",
  },
  progressListScroll: {
    flex: 1,
    minHeight: 0,
  },
  progressListContent: {
    paddingBottom: 2,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 32,
    marginTop: 3,
  },
  progressRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
    paddingRight: 2,
  },
  progressConnector: {
    width: 2,
    height: 10,
    marginLeft: 13,
    marginVertical: 2,
    borderRadius: 1,
    backgroundColor: "#E5E7EB",
  },
  progressLabel: {
    flex: 1,
    fontFamily: fontFamily.body,
    fontSize: 12,
    fontWeight: "600",
    color: colors.onSurface,
    lineHeight: 16,
  },
  progressLabelActive: {
    fontWeight: "800",
    color: colors.onSurface,
  },
  progressLabelBold: {
    fontFamily: fontFamily.headline,
    fontWeight: "900",
    fontSize: 13,
    color: colors.primary,
  },
  progressLabelPending: {
    color: colors.onSurfaceVariant,
    fontWeight: "500",
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleDone: {
    backgroundColor: "#10B981",
  },
  stepCircleActive: {
    backgroundColor: VIOLET,
  },
  stepCirclePending: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  posterCompactFrameWrap: {
    position: "relative",
    flex: 1,
    minHeight: 0,
    marginTop: spacing[2],
    marginBottom: spacing[2],
    overflow: "visible",
    zIndex: 1,
  },
  posterCompactFrame: {
    flex: 1,
    width: "100%",
    minHeight: 0,
    borderRadius: HERO_CARD_RADIUS,
    overflow: "hidden",
    backgroundColor: colors.onSurface,
  },
  posterEditBtnOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 2,
  },
  posterActivePillOverlay: {
    position: "absolute",
    left: 8,
    bottom: -8,
    zIndex: 2,
  },
  posterOverlayGlassPill: {
    alignSelf: "flex-start",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    padding:0
  },
  posterOverlayGlassPillContent: {
    flexDirection: "row",
    paddingHorizontal:3,
    paddingVertical:4,

    alignItems: "center",
    gap: 5,
    backgroundColor:
      Platform.OS === "ios" ? glassCardFillDark : "rgba(239, 244, 255, 0.96)",
  },
  posterCompactImage: {
    ...StyleSheet.absoluteFillObject,
  },
  posterCompactPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.onSurface,
  },
  posterCompactPlaceholderText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.muted,
  },
  posterCompactMeta: {
    paddingTop: spacing[1],
  },
  posterOptionFooter: {
    flexShrink: 0,
    // paddingTop: spacing[1],
  },
  posterOptionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(107, 56, 212, 0.12)",
    marginBottom: spacing[2],
  },
  posterOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
    paddingHorizontal: spacing[1],
  },
  posterOptionRowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 0,
    paddingRight: spacing[1],
  },
  posterOptionActions: {
    flexShrink: 0,
    alignItems: "flex-end",
    gap: 4,
  },
  posterOptionIconBubble: {
    width: 20,
    height: 20,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: "rgba(107, 56, 212, 0.08)",
  },
  posterOptionTitle: {
    flexShrink: 1,
    fontFamily: fontFamily.title,
    fontSize: 10,
    fontWeight: "700",
    color: colors.onSurface,
    letterSpacing: -0.2,
  },
  posterOptionTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: "rgba(107, 56, 212, 0.08)",
  },
  posterOptionTagText: {
    fontFamily: fontFamily.label,
    fontSize: 9,
    fontWeight: "700",
    color: VIOLET,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  posterSwitchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    flexShrink: 0,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: "rgba(107, 56, 212, 0.2)",
  },
  posterSwitchBtnText: {
    fontFamily: fontFamily.label,
    fontSize: 8,
    fontWeight: "700",
    color: VIOLET,
    letterSpacing: 0.2,
  },
  activeDesignPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 5,
  },
  activeDesignDot: {
    marginLeft:3,
    width: 7,
    height: 7,
    borderRadius: 4.5,
    backgroundColor: "#10B981",
  },
  activeDesignPillText: {
    marginRight:3,
    fontSize: 9,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: 0.3,
    textTransform: "capitalize",
  },
  activeDesignPillTextOnPoster: {
    marginRight:3,

    fontFamily: fontFamily.label,
    fontSize: 10,
    fontWeight: "900",
    color: colors.onSurfaceVariant,
    letterSpacing: 0.4,
  },
  generatePosterBtn: {
    marginTop: spacing[1],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1.5,
    borderColor: "rgba(107, 56, 212, 0.35)",
  },
  generatePosterBtnText: {
    fontFamily: fontFamily.title,
    fontSize: 12,
    fontWeight: "700",
    color: VIOLET,
  },
  iconNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: spacing[2],
    gap: 4,
  },
  iconNavCell: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  iconNavBubble: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(107, 56, 212, 0.08)",
  },
  iconNavLabel: {
    fontFamily: fontFamily.label,
    fontSize: 11,
    fontWeight: "700",
    color: colors.onSurface,
    textAlign: "center",
  },
});
