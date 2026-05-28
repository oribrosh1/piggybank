import { useMemo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import {
  View,
  Text,
  StyleSheet,
  Image,
  useWindowDimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type {
  EventFormData,
  CelebrationPickerType,
  PosterThemeId,
} from "@/types/events";
import { POSTER_THEME_OPTIONS } from "@/src/lib/posterThemes";
import { PartyVibeImageGenAnimation } from "@/src/components/create-event/PartyVibeImageGenAnimation";
import { colors, spacing, fontFamily, radius } from "@/src/theme";

function celebrationTypeDisplay(
  type: CelebrationPickerType | undefined,
): string {
  switch (type) {
    case "barMitzvah":
      return "Bar Mitzvah";
    case "batMitzvah":
      return "Bat Mitzvah";
    default:
      return "Birthday";
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.trim();
  if (!/^#[0-9A-Fa-f]{6}$/.test(h)) return null;
  return {
    r: parseInt(h.slice(1, 3), 16),
    g: parseInt(h.slice(3, 5), 16),
    b: parseInt(h.slice(5, 7), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function adjustHex(hex: string, delta: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(rgb.r + delta, rgb.g + delta, rgb.b + delta);
}

function gradientFromForm(formData: EventFormData): [string, string, string] {
  const themeId = formData.theme?.trim() as PosterThemeId | undefined;
  const match = themeId
    ? POSTER_THEME_OPTIONS.find((t) => t.id === themeId)
    : undefined;
  if (match) return match.gradient;

  const hex = formData.honoreeFavoriteColor?.trim();
  if (hex && hexToRgb(hex)) {
    return [
      adjustHex(hex, 35),
      hex,
      adjustHex(hex, -55),
    ] as [string, string, string];
  }

  return ["#5b21b6", "#7c3aed", "#4c1d95"];
}

function formatDateDisplay(dateString: string): string {
  const parts = dateString.split("-");
  if (parts.length !== 3) return dateString;
  const [year, month, day] = parts.map((p) => parseInt(p, 10));
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return dateString;
  }
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type PosterSummarySkeletonPreviewProps = {
  formData: EventFormData;
  /** “Poster sketch…” labels above the card. @default true */
  showSectionHeader?: boolean;
  /** Party vibe generation strip above the avatar. @default true */
  showPartyVibeAnimation?: boolean;
  /** Honoree circle (or placeholder). @default true */
  showAvatar?: boolean;
  /** @default true — turn off in modal so the poster floats on a clear backdrop */
  elevated?: boolean;
  /** Horizontal inset from screen edges used to compute card width (each side). @default spacing[6] */
  horizontalInset?: number;
  style?: StyleProp<ViewStyle>;
};

const AVATAR_SIZE = 152;

/**
 * Read-only “sketch” of how the invitation poster will be composed — layout, typography,
 * and palette derived only from the review summary (no AI image yet).
 */
export default function PosterSummarySkeletonPreview({
  formData,
  showSectionHeader = true,
  showPartyVibeAnimation = true,
  showAvatar = true,
  elevated = true,
  style,
  horizontalInset,
}: PosterSummarySkeletonPreviewProps) {
  const { width: windowWidth } = useWindowDimensions();
  const inset = horizontalInset ?? spacing[6];
  const cardWidth = Math.min(windowWidth - inset * 2, 420);

  const gradient = useMemo(() => gradientFromForm(formData), [formData]);

  const name = formData.childName.trim() || "Name";
  const age = formData.age.trim() || "—";
  const occasionTitle = `${name}'s ${celebrationTypeDisplay(formData.celebrationType)}`;

  const dateStr = formData.date.trim();
  const timeStr = formData.time.trim();
  const datePretty = dateStr ? formatDateDisplay(dateStr) : "Date";

  const addressRaw = [formData.address1, formData.address2]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(", ");
  const locationLine = addressRaw || "Location";

  const photoUri = formData.honoreePhotoUri?.trim();
  const partyVibe = formData.partyVibe?.trim() ?? "";

  const showMiddle = showPartyVibeAnimation || showAvatar;

  return (
    <View
      style={[styles.wrap, style]}
      accessibilityRole="image"
      accessibilityLabel="Skeleton preview of your invitation layout from the details you entered"
    >
      {showSectionHeader ? (
        <>
          <Text style={styles.sectionLabel}>Poster sketch from your details</Text>
          <Text style={styles.sectionHint}>
            Layout and colors only — the final AI art fills in after you create the
            event.
          </Text>
        </>
      ) : null}

      <View
        style={[
          styles.posterOuter,
          elevated && styles.posterOuterElevated,
          { width: cardWidth },
        ]}
      >
        <LinearGradient
          colors={gradient}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.gradient, !showMiddle && styles.gradientTextOnly]}
        >
          <View style={styles.noiseOverlay} pointerEvents="none" />
          <View style={styles.dimVeil} pointerEvents="none" />

          <View
            style={[styles.posterInner, !showMiddle && styles.posterInnerTextOnly]}
          >
            <View style={styles.topBlock}>
              <Text style={styles.titleLine} numberOfLines={2}>
                {occasionTitle}
              </Text>
              <Text style={styles.turningLine} numberOfLines={1}>
                turning {age}
              </Text>
            </View>

            {showMiddle ? (
              <View style={styles.avatarSection}>
                {showPartyVibeAnimation ? (
                  <PartyVibeImageGenAnimation partyVibe={partyVibe} />
                ) : null}
                {showAvatar ? (
                  photoUri ? (
                    <Image
                      source={{ uri: photoUri }}
                      style={styles.avatarImage}
                      accessibilityIgnoresInvertColors
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarPlaceholderLabel}>Photo</Text>
                    </View>
                  )
                ) : null}
              </View>
            ) : 
            <View style={styles.blankBlock}>
             {/* loading spinner */}
             <ActivityIndicator size="large" color={colors.primary} />
            </View>
            }

            <View
              style={[styles.footerBlock, !showMiddle && styles.footerBlockTight]}
            >
              <Text style={styles.footerLocation} numberOfLines={4}>
                {locationLine}
              </Text>
              <Text style={styles.footerDate}>{datePretty}</Text>
              <Text style={styles.footerTime}>{timeStr || "Time"}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing[4],
    alignSelf: "stretch",
  },
  sectionLabel: {
    fontFamily: fontFamily.headline,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: colors.primary,
    marginBottom: spacing[1],
  },
  sectionHint: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
    color: colors.onSurfaceVariant,
    marginBottom: spacing[3],
  },
  posterOuter: {
    alignSelf: "center",
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  posterOuterElevated: {
    ...Platform.select({
      ios: {
        shadowColor: "#1e1b4b",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
      },
      android: { elevation: 10 },
    }),
  },
  gradient: {
    aspectRatio: 3 / 4,
    width: "100%",
    position: "relative",
  },
  /** Top + footer text only — tight height, no empty middle band */
  gradientTextOnly: {
    aspectRatio: undefined,
    alignSelf: "stretch",
    width: "100%",
    position: "relative",
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  dimVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.14)",
  },
  posterInner: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[5],
    paddingBottom: spacing[4],
    justifyContent: "space-between",
  },
  posterInnerTextOnly: {
    flexGrow: 0,
    flexShrink: 0,
    justifyContent: "flex-start",
    paddingTop: spacing[5],
    paddingBottom: spacing[4],
  },
  topBlock: {
    alignItems: "center",
    paddingHorizontal: spacing[1],
  },
  titleLine: {
    fontFamily: fontFamily.title,
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
    letterSpacing: -0.35,
    lineHeight: 24,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  turningLine: {
    marginTop: spacing[2],
    fontFamily: fontFamily.display,
    fontSize: 36,
    fontWeight: "900",
    color: "#ffffff",
    textAlign: "center",
    letterSpacing: -1.2,
    lineHeight: 40,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  blankBlock: {
    flex: 1,
    minHeight: 200,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  avatarSection: {
    flex: 1,
    minHeight: 0,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    gap: spacing[2],
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.65)",
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.4)",
    borderStyle: "dashed",
    backgroundColor: "rgba(0,0,0,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPlaceholderLabel: {
    fontFamily: fontFamily.label,
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.55)",
  },
  footerBlock: {
    alignItems: "center",
    paddingTop: spacing[2],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.28)",
  },
  footerBlockTight: {
    marginTop: spacing[5],
    paddingTop: spacing[3],
  },
  footerLocation: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.92)",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: spacing[2],
  },
  footerDate: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.95)",
    textAlign: "center",
    lineHeight: 20,
  },
  footerTime: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.95)",
    textAlign: "center",
    lineHeight: 20,
    marginTop: spacing[1],
  },
});
