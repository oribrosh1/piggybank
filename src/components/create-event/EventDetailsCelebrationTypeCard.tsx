import React from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BookOpen,
  Cake,
  PartyPopper,
  Sparkles,
  Star,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import type {
  CelebrationPickerType,
  MitzvahCelebrationFocus,
} from "@/types/events";
import { GlassCardDark } from "@/src/components/common/GlassCardDark";
import { colors, fontFamily, radius, spacing } from "@/src/theme";

/**
 * Celebration type options. Icons are intentionally preserved from the
 * previous version of this component (Cake / Star / Sparkles) so the user's
 * visual association with each tile carries over.
 */
const CELEBRATION_OPTIONS: ReadonlyArray<{
  value: CelebrationPickerType;
  label: string;
  Icon: typeof Cake;
}> = [
  { value: "birthday", label: "Birthday", Icon: Cake },
  { value: "barMitzvah", label: "Bar mitzvah", Icon: Star },
  { value: "batMitzvah", label: "Bat mitzvah", Icon: Sparkles },
];

/** Mitzvah-focus options (Party vs Ceremony). PartyPopper / BookOpen icons retained. */
const FOCUS_OPTIONS: ReadonlyArray<{
  value: MitzvahCelebrationFocus;
  label: string;
  Icon: typeof PartyPopper;
}> = [
  { value: "party", label: "Party", Icon: PartyPopper },
  { value: "ceremony", label: "Ceremony", Icon: BookOpen },
];

/**
 * Pre-rendered purple "glowing button" art (`assets/.../btn1.png`) used as
 * the background of a selected tile — its center starburst + glassy bevel
 * matches the reference design exactly. We bake the image into the tile
 * instead of layering shadows / gradients in code because the bloom effect
 * isn't reproducible with React Native's shadow + LinearGradient combo.
 */
const SELECTED_TILE_BG = require("../../../assets/images/create-event/btn1.png");

/** Soft white-to-lavender gradient used by idle tiles to keep them "designed". */
const IDLE_GRADIENT_FROM = "#FFFFFF";
const IDLE_GRADIENT_TO = "#F3EAFF";

type EventDetailsCelebrationTypeCardProps = {
  celebrationType: CelebrationPickerType;
  mitzvahCelebrationFocus?: MitzvahCelebrationFocus;
  mitzvahFocusError?: string;
  onCelebrationTypeChange: (value: CelebrationPickerType) => void;
  onMitzvahFocusChange: (value: MitzvahCelebrationFocus) => void;
};

/**
 * "What are we celebrating?" card — header strip (party-popper bubble +
 * title + subtitle) followed by a 3-up tile row of celebration types and,
 * when a Mitzvah is selected, a 2-up Party / Ceremony focus row.
 *
 * Each tile reuses the same `<CelebrationTile>` so the selected state
 * (purple gradient + check badge) and the idle state (soft white-to-lavender
 * gradient) stay in lockstep across both rows.
 */
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
    <GlassCardDark
      style={styles.card}
      padding={0}
      borderRadius={radius.lg}
      borderColor="rgba(107, 56, 212, 0.12)"
      blurIntensity={24}
      contentStyle={styles.cardContent}
    >
      <View style={styles.header}>
        <View style={styles.headerIconBubble}>
          <PartyPopper size={22} color="#D97706" strokeWidth={2.4} />
        </View>
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>WHAT ARE WE CELEBRATING?</Text>
          <Text style={styles.headerSubtitle}>Choose the type of event</Text>
        </View>
      </View>

      <View style={styles.tileRow}>
        {CELEBRATION_OPTIONS.map((opt) => (
          <CelebrationTile
            key={opt.value}
            label={opt.label}
            Icon={opt.Icon}
            selected={celebrationType === opt.value}
            onPress={() => onCelebrationTypeChange(opt.value)}
          />
        ))}
      </View>

      {showMitzvahFocus ? (
        <View style={styles.tileRow}>
          {FOCUS_OPTIONS.map((opt) => (
            <CelebrationTile
              key={opt.value}
              label={opt.label}
              Icon={opt.Icon}
              selected={mitzvahCelebrationFocus === opt.value}
              onPress={() => onMitzvahFocusChange(opt.value)}
            />
          ))}
        </View>
      ) : null}

      {mitzvahFocusError ? (
        <Text style={styles.errorText}>{mitzvahFocusError}</Text>
      ) : null}
    </GlassCardDark>
  );
}

type CelebrationTileProps = {
  label: string;
  Icon: typeof Cake;
  selected: boolean;
  onPress: () => void;
};

/**
 * Square-ish tile with the option's icon centered and a label below. Selected
 * tiles light up with the brand purple gradient and a check badge in the
 * top-right corner; idle tiles use a soft white→lavender gradient with a
 * faint translucent purple border.
 */
function CelebrationTile({
  label,
  Icon,
  selected,
  onPress,
}: CelebrationTileProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`${label}${selected ? ", selected" : ""}`}
      accessibilityState={{ selected }}
      style={[styles.tileShadow, selected && styles.tileShadowSelected]}
    >
      {selected ? (
        <View style={[styles.tile]}>
          {/*
            The btn1 art carries both the purple glow and the glass bevel,
            so we let it fill the tile (cover) and lay the icon + label on
            top. `pointerEvents="none"` keeps taps falling through to the
            wrapping TouchableOpacity.
          */}
          <Image
            source={SELECTED_TILE_BG}
            style={styles.tileSelectedImage}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
          <View style={styles.tileContent}>
            <Icon size={32} color={colors.onPrimary} strokeWidth={2.2} />
            <Text
              style={[styles.tileLabel, styles.tileLabelSelected]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {label}
            </Text>
          </View>
        </View>
      ) : (
        <LinearGradient
          colors={[IDLE_GRADIENT_FROM, IDLE_GRADIENT_TO]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.tile, styles.tileIdle]}
        >
          <Icon size={32} color={colors.primary} strokeWidth={2.2} />
          <Text
            style={[styles.tileLabel, styles.tileLabelIdle]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {label}
          </Text>
        </LinearGradient>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    overflow: "hidden",
  },
  cardContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  /**
   * Warm yellow rounded square wrapping the party popper — matches the
   * reference's "celebration vibes" cue. Stays warm regardless of theme
   * since it's a fixed brand accent for this section header.
   */
  headerIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(251, 191, 36, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontFamily: fontFamily.headline,
    fontSize: 15,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  headerSubtitle: {
    marginTop: 2,
    fontFamily: fontFamily.body,
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  /**
   * Tile row uses `flex: 1` children so it adapts to whichever row it is:
   * 3 children for the celebration row, 2 children for the focus row.
   */
  tileRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  /**
   * Outer shadow wrapper — keep shadow OUT of the LinearGradient layer
   * because iOS clips shadows to the gradient's painted bounds otherwise.
   */
  tileShadow: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: "transparent",
    ...Platform.select({
      ios: {
        shadowColor: "#0c1c2a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  /**
   * Selected tile floods the surrounding card with a bright brand-purple
   * halo — centered offset (0/0) + large radius + high opacity matches the
   * "glowing" treatment in the reference design where the selected option
   * visibly bleeds purple light onto the neighboring tiles.
   */
  tileShadowSelected: {
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 24,
      },
      android: { elevation: 16 },
    }),
  },
  tile: {
    flex: 1,
    minHeight: 116,
    borderRadius: 20,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[3],
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    overflow: "hidden",
  },
  tileIdle: {
    borderWidth: 1,
    borderColor: "rgba(107, 56, 212, 0.18)",
  },
  tileSelected: {
    borderWidth: 0,
    /**
     * Solid purple fallback in case the image takes a moment to decode —
     * masked by the btn1 art once it paints. Kept dim (60%) so it doesn't
     * tint the bottom edge of the image after it lands.
     */
    backgroundColor: "rgba(107, 56, 212, 0.6)",
  },
  /**
   * Fills the tile so the btn1 art covers the entire surface edge-to-edge.
   *
   * `btn1.png` carries both a dark outer margin and a glassy button-edge
   * bevel near its perimeter, so a plain `resizeMode: "cover"` lets that
   * bevel slip into view — most visibly on the wider Party/Ceremony tiles
   * (≈ 2:1 aspect) where the crop window is shallower than on the square
   * 3-up tiles. Sizing the image to 200% and shifting it back -50% on
   * both axes keeps the visible region pinned to the central bloom of the
   * asset regardless of tile aspect; the tile's `overflow: hidden` clips
   * the rest off the corners.
   */
  tileSelectedImage: {
    position: "absolute",
    top: "-50%",
    left: "-80%",
    width: "260%",
    height: "260%",
  },
  /** Icon + label sit on top of the background image. */
  tileContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
  },
  tileLabel: {
    fontFamily: fontFamily.title,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
    textAlign: "center",
  },
  tileLabelIdle: {
    color: colors.onSurface,
  },
  tileLabelSelected: {
    color: colors.onPrimary,
  },
  errorText: {
    marginTop: spacing[2],
    fontFamily: fontFamily.label,
    fontSize: 12,
    fontWeight: "600",
    color: "#EF4444",
  },
});
