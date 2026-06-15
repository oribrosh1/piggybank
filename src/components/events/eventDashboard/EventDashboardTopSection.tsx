import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
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
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react-native";
import type { Event } from "@/types/events";
import { colors, fontFamily, radius, spacing } from "@/src/theme";
import { EventPosterIntroLine } from "./EventDashboardLayout";

const VIOLET = colors.primary;
const A4_ASPECT_RATIO = 210 / 250;

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
  { id: "banking", label: "Verify & Get CreditKid Card", Icon: CreditCard },
  {
    id: "invites",
    label: "Schedule Automatic SMS Invitation Times",
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
  style?: ViewStyle;
};

function EventSetupProgressCard({
  steps,
  onStepPress,
  style,
}: EventSetupProgressCardProps) {
  return (
    <View style={[styles.progressCard, style]}>
      <Text style={styles.progressTitle}>Event Setup Progress</Text>
      <View style={styles.progressList}>
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
                  <Text
                    style={[
                      styles.progressLabel,
                      step.state === "active" && styles.progressLabelActive,
                      step.state === "pending" && styles.progressLabelPending,
                    ]}
                  >
                    {step.label}
                  </Text>
                </View>
                {step.state === "active" ? (
                  <ChevronRight size={18} color={VIOLET} strokeWidth={2.4} />
                ) : null}
              </TouchableOpacity>
              {!isLast ? <View style={styles.progressConnector} /> : null}
            </View>
          );
        })}
      </View>
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
  style?: ViewStyle;
};

function CompactPosterCard({
  event,
  onGeneratePoster,
  style,
}: CompactPosterCardProps) {
  const basicTemplateOnly =
    event.optionalDetailsLater === true && !event.posterUrl;
  const themeLabel = basicTemplateOnly
    ? "Standard invitation"
    : event.theme?.trim() || "Custom design";
  const overlayLabel = basicTemplateOnly ? "BASIC TEMPLATE" : "Active design";

  const [posterAspect, setPosterAspect] = useState(A4_ASPECT_RATIO);

  useEffect(() => {
    const url = event.posterUrl;
    if (!url) {
      setPosterAspect(A4_ASPECT_RATIO);
      return;
    }
    Image.getSize(
      url,
      (width, height) => {
        if (width > 0 && height > 0) setPosterAspect(width / height);
      },
      () => setPosterAspect(A4_ASPECT_RATIO),
    );
  }, [event.posterUrl]);

  const frameAspect = event.posterUrl ? posterAspect : A4_ASPECT_RATIO;

  return (
    <View style={[styles.posterCompactCard, style]}>
      <View
        style={[styles.posterCompactFrame, { aspectRatio: frameAspect }]}
        accessibilityLabel="Event poster preview"
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
        <View style={styles.posterCompactOverlay} pointerEvents="none">
          <View style={styles.activeDesignPill}>
            <View style={styles.activeDesignDot} />
            <Text style={styles.activeDesignPillText}>{overlayLabel}</Text>
          </View>
          <Text style={styles.posterCompactTheme} numberOfLines={1}>
            {themeLabel}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.generatePosterBtn}
        onPress={onGeneratePoster}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel="Generate poster"
      >
        <Sparkles size={16} color={VIOLET} strokeWidth={2.2} />
        <Text style={styles.generatePosterBtnText}>Generate Poster</Text>
      </TouchableOpacity>
    </View>
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
      <EventPosterIntroLine event={event} showCelebrationEmoji />
      <View style={styles.heroRow}>
        <CompactPosterCard
          event={event}
          onGeneratePoster={onGeneratePoster}
          style={styles.heroColPoster}
        />
        <EventSetupProgressCard
          steps={steps}
          onStepPress={onSetupStepPress}
          style={styles.heroColProgress}
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
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: spacing[3],
    gap: spacing[2],
    marginTop: 4,
  },
  heroColProgress: {
    flex: 1,
    minWidth: 0,
  },
  heroColPoster: {
    flex: 1,
    minWidth: 0,
  },
  progressCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
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
    marginBottom: spacing[2],
    letterSpacing: -0.2,
  },
  progressList: {},
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 32,
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
  posterCompactCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: spacing[1],
    borderWidth: 1,
    borderColor: "rgba(107, 56, 212, 0.08)",
    shadowColor: "#0c1c2a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  posterCompactFrame: {
    width: "100%",
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.onSurface,
  },
  posterCompactImage: {
    width: "100%",
    height: "100%",
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
  posterCompactOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  activeDesignPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 5,
  },
  activeDesignDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  activeDesignPillText: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: 0.3,
    textTransform: "capitalize",
  },
  posterCompactTheme: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "800",
    color: colors.onPrimary,
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
