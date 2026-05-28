import React from "react";
import {
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Sprout, Star, UtensilsCrossed } from "lucide-react-native";

import type { EventFormData } from "@/types/events";
import { colors, fontFamily, radius, spacing } from "@/src/theme";

const KOSHER_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "kosher-style", label: "Kosher Style" },
  { value: "kosher", label: "Kosher" },
  { value: "glatt-kosher", label: "Glatt" },
  { value: "not-kosher", label: "Not Kosher" },
];

type MealOption = {
  value: string;
  label: string;
  emoji: string;
  bubbleColor: string;
};

const MEAL_OPTIONS: ReadonlyArray<MealOption> = [
  { value: "dairy", label: "Dairy", emoji: "🥛", bubbleColor: "#DBEAFE" },
  { value: "meat", label: "Meat", emoji: "🥩", bubbleColor: "#FECDD3" },
  { value: "pareve", label: "Pareve", emoji: "🌿", bubbleColor: "#D1FAE5" },
];

type VegetarianOption = MealOption;

const VEGETARIAN_OPTIONS: ReadonlyArray<VegetarianOption> = [
  { value: "none", label: "None", emoji: "🍴", bubbleColor: "#EDE9FE" },
  {
    value: "vegetarian",
    label: "Vegetarian",
    emoji: "🥗",
    bubbleColor: "#D1FAE5",
  },
  { value: "vegan", label: "Vegan", emoji: "🌱", bubbleColor: "#D1FAE5" },
];

export type CateringPreferencesBlockProps = {
  formData: EventFormData;
  onInputChange: (field: string, value: string | boolean) => void;
  /** @deprecated Kept for API compatibility; ignored by the new layout. */
  topSpacing?: boolean;
};

/**
 * Catering preferences — Kosher type / Meal type / Vegetarian options +
 * a "Guests can request" toggle at the bottom.
 *
 * The toggle drives the existing single-field model (`vegetarianType`)
 * because we keep "by_request" as one of its possible values. Selecting a
 * real diet (None/Vegetarian/Vegan) clears the toggle; turning the toggle
 * on forces the value to "by_request" so downstream code keeps working.
 */
export default function CateringPreferencesBlock({
  formData,
  onInputChange,
}: CateringPreferencesBlockProps) {
  /** Falls back to "none" for both `undefined` and `""` legacy values. */
  const vegetarianType = formData.vegetarianType || "none";
  const guestsCanRequest = vegetarianType === "by_request";
  /** When the toggle is on, none of the diet tiles are individually selected. */
  const selectedDietForTiles = guestsCanRequest ? null : vegetarianType;

  const handleVegetarianTileSelect = (value: string) => {
    onInputChange("vegetarianType", value);
  };

  const handleGuestsCanRequestToggle = (nextOn: boolean) => {
    onInputChange("vegetarianType", nextOn ? "by_request" : "none");
  };

  const handleMealSelect = (value: string) => {
    /** Chalav Yisrael is only meaningful when dairy is selected. */
    if (value !== "dairy") onInputChange("chalavYisrael", false);
    onInputChange("mealType", value);
  };

  return (
    <View style={styles.block}>
      {/* ── Kosher Type ────────────────────────────────────────── */}
      <SectionHeader Icon={Star} label="Kosher Type" />
      <View style={styles.kosherRow}>
        {KOSHER_OPTIONS.map((opt) => {
          const selected = formData.kosherType === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onInputChange("kosherType", opt.value)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[
                styles.kosherPill,
                selected && styles.kosherPillSelected,
              ]}
            >
              <Text
                style={[
                  styles.kosherPillLabel,
                  selected && styles.kosherPillLabelSelected,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Meal Type ──────────────────────────────────────────── */}
      <SectionHeader Icon={UtensilsCrossed} label="Meal Type" />
      <View style={styles.tileRow}>
        {MEAL_OPTIONS.map((opt) => (
          <DietaryTile
            key={opt.value}
            label={opt.label}
            emoji={opt.emoji}
            bubbleColor={opt.bubbleColor}
            selected={formData.mealType === opt.value}
            onPress={() => handleMealSelect(opt.value)}
          />
        ))}
      </View>

      {formData.mealType === "dairy" ? (
        <View style={styles.chalavRow}>
          <ChalavOption
            label="Regular dairy"
            selected={formData.chalavYisrael !== true}
            onPress={() => onInputChange("chalavYisrael", false)}
          />
          <ChalavOption
            label="Chalav Yisrael"
            selected={formData.chalavYisrael === true}
            onPress={() => onInputChange("chalavYisrael", true)}
          />
        </View>
      ) : null}

      {/* ── Vegetarian Options ─────────────────────────────────── */}
      <SectionHeader Icon={Sprout} label="Vegetarian Options" />
      <View style={styles.tileRow}>
        {VEGETARIAN_OPTIONS.map((opt) => (
          <DietaryTile
            key={opt.value}
            label={opt.label}
            emoji={opt.emoji}
            bubbleColor={opt.bubbleColor}
            selected={selectedDietForTiles === opt.value}
            onPress={() => handleVegetarianTileSelect(opt.value)}
          />
        ))}
      </View>

      {/* ── Guests can request toggle ──────────────────────────── */}
      <View style={styles.requestRow}>
        <View style={styles.requestIconBubble}>
          <Text style={styles.requestEmoji}>👋</Text>
        </View>
        <View style={styles.requestTextBlock}>
          <Text style={styles.requestTitle}>Guests can request</Text>
          <Text style={styles.requestSubtitle}>
            Guests will be able to request for vegan/vegetarian options.
          </Text>
        </View>
        <Switch
          value={guestsCanRequest}
          onValueChange={handleGuestsCanRequestToggle}
          trackColor={{ false: "#E5E7EB", true: colors.primary }}
          thumbColor="#FFFFFF"
          ios_backgroundColor="#E5E7EB"
          accessibilityLabel="Allow guests to request dietary options"
        />
      </View>
    </View>
  );
}

type SectionHeaderProps = {
  Icon: typeof Star;
  label: string;
};

/**
 * Compact section header with a small soft-purple circle wrapping a lucide
 * glyph on the left and the section label on the right. Used for Kosher
 * Type / Meal Type / Vegetarian Options headers.
 */
function SectionHeader({ Icon, label }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderBubble}>
        <Icon size={14} color={colors.primary} strokeWidth={2.4} />
      </View>
      <Text style={styles.sectionHeaderLabel}>{label}</Text>
    </View>
  );
}

type DietaryTileProps = {
  label: string;
  emoji: string;
  bubbleColor: string;
  selected: boolean;
  onPress: () => void;
};

/**
 * White card tile with a colored circular emoji bubble on the left and the
 * option label on the right. Selected state lights up the tile with a
 * purple border and a soft purple wash.
 */
function DietaryTile({
  label,
  emoji,
  bubbleColor,
  selected,
  onPress,
}: DietaryTileProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.dietaryTile, selected && styles.dietaryTileSelected]}
    >
      <View
        style={[
          styles.dietaryTileBubble,
          { backgroundColor: selected ? colors.primary : bubbleColor },
        ]}
      >
        <Text style={styles.dietaryTileEmoji}>{emoji}</Text>
      </View>
      <Text
        style={[
          styles.dietaryTileLabel,
          selected && styles.dietaryTileLabelSelected,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

type ChalavOptionProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

/**
 * Compact dual-state segmented option for Regular dairy / Chalav Yisrael.
 * Re-uses the kosher-pill aesthetic so the dairy sub-question reads as a
 * follow-up to "Meal Type" rather than a brand-new section.
 */
function ChalavOption({ label, selected, onPress }: ChalavOptionProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chalavPill, selected && styles.chalavPillSelected]}
    >
      <Text
        style={[
          styles.chalavLabel,
          selected && styles.chalavLabelSelected,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  block: {
    marginTop: -spacing[2],
    marginBottom: 100,
  },
  /* ── Section header ───────────────────────────────────────── */
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing[2],
    marginTop: spacing[3],
  },
  sectionHeaderBubble: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: "rgba(107, 56, 212, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeaderLabel: {
    fontFamily: fontFamily.headline,
    fontSize: 14,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.1,
  },
  /* ── Kosher pills ─────────────────────────────────────────── */
  kosherRow: {
    flexDirection: "row",
    gap: 8,
  },
  kosherPill: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1.5,
    borderColor: "rgba(107, 56, 212, 0.10)",
  },
  kosherPillSelected: {
    backgroundColor: "rgba(107, 56, 212, 0.10)",
    borderColor: colors.primary,
  },
  kosherPillLabel: {
    fontFamily: fontFamily.title,
    fontSize: 13,
    fontWeight: "700",
    color: colors.onSurfaceVariant,
    textAlign: "center",
  },
  kosherPillLabelSelected: {
    color: colors.primary,
    fontWeight: "800",
  },
  /* ── Meal / vegetarian tile row ───────────────────────────── */
  tileRow: {
    flexDirection: "row",
    gap: 8,
  },
  dietaryTile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1.5,
    borderColor: "rgba(107, 56, 212, 0.08)",
    ...Platform.select({
      ios: {
        shadowColor: "#0c1c2a",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: { elevation: 1 },
    }),
  },
  dietaryTileSelected: {
    backgroundColor: "rgba(107, 56, 212, 0.08)",
    borderColor: colors.primary,
  },
  dietaryTileBubble: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  dietaryTileEmoji: {
    fontSize: 18,
  },
  dietaryTileLabel: {
    flexShrink: 1,
    fontFamily: fontFamily.title,
    fontSize: 13,
    fontWeight: "700",
    color: colors.onSurface,
  },
  dietaryTileLabelSelected: {
    color: colors.primary,
    fontWeight: "800",
  },
  /* ── Chalav Yisrael sub-row (only when dairy) ─────────────── */
  chalavRow: {
    marginTop: 8,
    flexDirection: "row",
    gap: 8,
  },
  chalavPill: {
    flex: 1,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[2],
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1.5,
    borderColor: "rgba(107, 56, 212, 0.10)",
  },
  chalavPillSelected: {
    backgroundColor: "rgba(107, 56, 212, 0.10)",
    borderColor: colors.primary,
  },
  chalavLabel: {
    fontFamily: fontFamily.title,
    fontSize: 12,
    fontWeight: "700",
    color: colors.onSurfaceVariant,
  },
  chalavLabelSelected: {
    color: colors.primary,
    fontWeight: "800",
  },
  /* ── Guests-can-request toggle row ────────────────────────── */
  requestRow: {
    marginTop: spacing[4],
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: "rgba(107, 56, 212, 0.10)",
  },
  requestIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "rgba(251, 191, 36, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  requestEmoji: {
    fontSize: 20,
  },
  requestTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  requestTitle: {
    fontFamily: fontFamily.headline,
    fontSize: 14,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.1,
  },
  requestSubtitle: {
    marginTop: 2,
    fontFamily: fontFamily.body,
    fontSize: 11,
    color: colors.onSurfaceVariant,
    lineHeight: 15,
  },
});
