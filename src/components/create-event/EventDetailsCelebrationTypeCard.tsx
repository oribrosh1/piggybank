import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Cake, Star, Sparkles, PartyPopper, BookOpen } from "lucide-react-native";
import type { CelebrationPickerType, MitzvahCelebrationFocus } from "@/types/events";
import { colors, spacing, radius, fontFamily, borderGhostOutline } from "@/src/theme";

const CARD_FILL = colors.surfaceContainerLowest;
const ICON_HOLE = "rgba(107, 56, 212, 0.14)";
/** Inset track behind the three celebration segments */
const SEGMENT_TRACK = "rgba(107, 56, 212, 0.08)";

const CELEBRATION_OPTIONS: {
  value: CelebrationPickerType;
  label: string;
  Icon: typeof Cake;
}[] = [
  { value: "birthday", label: "Birthday", Icon: Cake },
  { value: "barMitzvah", label: "Bar mitzvah", Icon: Star },
  { value: "batMitzvah", label: "Bat mitzvah", Icon: Sparkles },
];

const FOCUS_OPTIONS: {
  value: MitzvahCelebrationFocus;
  label: string;
  sub: string;
  Icon: typeof PartyPopper;
}[] = [
  { value: "party", label: "Party", sub: "Reception & celebration", Icon: PartyPopper },
  { value: "ceremony", label: "Ceremony", sub: "Service & Torah", Icon: BookOpen },
];

type EventDetailsCelebrationTypeCardProps = {
  celebrationType: CelebrationPickerType;
  mitzvahCelebrationFocus?: MitzvahCelebrationFocus;
  mitzvahFocusError?: string;
  onCelebrationTypeChange: (value: CelebrationPickerType) => void;
  onMitzvahFocusChange: (value: MitzvahCelebrationFocus) => void;
};

export default function EventDetailsCelebrationTypeCard({
  celebrationType,
  mitzvahCelebrationFocus,
  mitzvahFocusError,
  onCelebrationTypeChange,
  onMitzvahFocusChange,
}: EventDetailsCelebrationTypeCardProps) {
  const showMitzvahFocus =
    celebrationType === "barMitzvah" || celebrationType === "batMitzvah";

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>What are we celebrating?</Text>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Cake size={22} color={colors.primary} strokeWidth={2.2} />
        </View>
        <View style={styles.body}>
          <Text style={styles.label}>Celebration type</Text>
          <View style={styles.celebrationTrack}>
            {CELEBRATION_OPTIONS.map((opt) => {
              const selected = celebrationType === opt.value;
              const Icon = opt.Icon;
              const a11y = `${opt.label}${selected ? ", selected" : ""}`;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => onCelebrationTypeChange(opt.value)}
                  activeOpacity={0.88}
                  style={[
                    styles.celebrationSegment,
                    selected && styles.celebrationSegmentSelected,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={a11y}
                  accessibilityState={{ selected }}
                >
                  <Icon
                    size={24}
                    color={selected ? colors.onPrimary : colors.primary}
                    strokeWidth={2.4}
                  />
                  <Text
                    style={[styles.celebrationLabel, selected && styles.celebrationLabelSelected]}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {showMitzvahFocus ? (
            <View style={styles.focusBlock}>
              <Text style={styles.focusSectionLabel}>This celebration is for:</Text>
              <View style={styles.focusTrack}>
                {FOCUS_OPTIONS.map((opt) => {
                  const selected = mitzvahCelebrationFocus === opt.value;
                  const Icon = opt.Icon;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => onMitzvahFocusChange(opt.value)}
                      activeOpacity={0.88}
                      style={[styles.focusSegment, selected && styles.focusSegmentSelected]}
                    >
                      <Icon
                        size={24}
                        color={selected ? colors.onPrimary : colors.primary}
                        strokeWidth={2.4}
                      />
                      <Text
                        style={[styles.focusSegmentTitle, selected && styles.focusSegmentTitleSelected]}
                        numberOfLines={1}
                      >
                        {opt.label}
                      </Text>
                      <Text
                        style={[styles.focusSegmentSub, selected && styles.focusSegmentSubSelected]}
                        numberOfLines={2}
                      >
                        {opt.sub}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}
        </View>
      </View>
      {mitzvahFocusError ? <Text style={styles.err}>{mitzvahFocusError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing[5],
  },
  sectionLabel: {
    fontFamily: fontFamily.label,
    fontSize: 11,
    fontWeight: "700",
    color: colors.onSurfaceVariant,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: spacing[2],
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: CARD_FILL,
    borderRadius: radius.md,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[3],
    ...borderGhostOutline,
  },
  iconWrap: {
    width: 48,
    marginRight: spacing[3],
    height: 48,
    borderRadius: 24,
    backgroundColor: ICON_HOLE,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing[1],
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontFamily: fontFamily.label,
    fontSize: 10,
    fontWeight: "700",
    color: colors.onSurfaceVariant,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    marginBottom: spacing[3],
  },
  /** Full-width segmented control */
  celebrationTrack: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: SEGMENT_TRACK,
    borderRadius: radius.lg,
    padding: spacing[1],
    gap: spacing[1],
  },
  celebrationSegment: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[2],
    borderRadius: radius.md - 4,
    backgroundColor: "transparent",
  },
  celebrationSegmentSelected: {
    backgroundColor: colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  celebrationLabel: {
    marginTop: spacing[2],
    fontFamily: fontFamily.title,
    fontSize: 15,
    fontWeight: "700",
    color: colors.onSurface,
    letterSpacing: -0.3,
    textAlign: "center",
    lineHeight: 19,
  },
  celebrationLabelSelected: {
    color: colors.onPrimary,
  },
  focusTrack: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: SEGMENT_TRACK,
    borderRadius: radius.lg,
    padding: spacing[1],
    gap: spacing[1],
  },
  focusSegment: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderRadius: radius.md - 4,
    backgroundColor: "transparent",
  },
  focusSegmentSelected: {
    backgroundColor: colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  focusSegmentTitle: {
    marginTop: spacing[2],
    fontFamily: fontFamily.title,
    fontSize: 15,
    fontWeight: "700",
    color: colors.onSurface,
    textAlign: "center",
    letterSpacing: -0.2,
  },
  focusSegmentTitleSelected: {
    color: colors.onPrimary,
  },
  focusSegmentSub: {
    marginTop: spacing[1],
    fontFamily: fontFamily.body,
    fontSize: 11,
    fontWeight: "600",
    color: colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 14,
  },
  focusSegmentSubSelected: {
    color: "rgba(255, 255, 255, 0.88)",
  },
  focusBlock: {
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(203, 195, 215, 0.45)",
  },
  focusSectionLabel: {
    fontFamily: fontFamily.label,
    fontSize: 10,
    fontWeight: "700",
    color: colors.onSurfaceVariant,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: spacing[2],
  },
  err: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: spacing[2],
    fontWeight: "600",
  },
});
