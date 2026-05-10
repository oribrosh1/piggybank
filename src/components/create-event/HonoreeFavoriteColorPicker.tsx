import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import { Plus } from "lucide-react-native";
import { colors, fontFamily, radius, spacing } from "@/src/theme";

export const FAVORITE_COLOR_SWATCHES: {
  hex: string;
  label: string;
  light?: boolean;
}[] = [
  { hex: "#dc2626", label: "Red" },
  { hex: "#ea580c", label: "Orange" },
  { hex: "#ca8a04", label: "Amber" },
  { hex: "#eab308", label: "Yellow" },
  { hex: "#84cc16", label: "Lime" },
  { hex: "#22c55e", label: "Green" },
  { hex: "#14b8a6", label: "Teal" },
  { hex: "#06b6d4", label: "Cyan" },
  { hex: "#3b82f6", label: "Blue" },
  { hex: "#6366f1", label: "Indigo" },
  { hex: "#8b5cf6", label: "Violet" },
  { hex: "#d946ef", label: "Fuchsia" },
  { hex: "#ec4899", label: "Pink" },
  { hex: "#78716c", label: "Stone" },
  { hex: "#171717", label: "Black" },
  { hex: "#ffffff", label: "White", light: true },
];

/** Top picks for the quick row (blue, pink, red, purple, yellow). */
const POPULAR_HEX = [
  "#3b82f6",
  "#ec4899",
  "#dc2626",
  "#8b5cf6",
  "#eab308",
] as const;

function hexNorm(h: string) {
  return h.trim().toLowerCase();
}

function isPopularHex(hex: string | undefined) {
  if (!hex) return false;
  const n = hexNorm(hex);
  return POPULAR_HEX.some((p) => hexNorm(p) === n);
}

function swatchMeta(hex: string) {
  return FAVORITE_COLOR_SWATCHES.find((s) => hexNorm(s.hex) === hexNorm(hex));
}

type HonoreeFavoriteColorPickerProps = {
  value?: string;
  onSelect: (hex: string) => void;
  title?: string;
  subtitle?: string;
  /** Tighter spacing when nested inside another card (e.g. “Customize your poster”). */
  embedded?: boolean;
};

export default function HonoreeFavoriteColorPicker({
  value,
  onSelect,
  title = "Favorite color",
  subtitle = "Pick the color that feels most like your child — we’ll lean on it for the poster.",
  embedded,
}: HonoreeFavoriteColorPickerProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const popularSwatches = useMemo(
    () =>
      POPULAR_HEX.map((hex) =>
        FAVORITE_COLOR_SWATCHES.find((s) => hexNorm(s.hex) === hexNorm(hex)),
      ).filter((s): s is (typeof FAVORITE_COLOR_SWATCHES)[number] =>
        Boolean(s),
      ),
    [],
  );

  const customFromPicker = Boolean(value && !isPopularHex(value));
  const valNorm = value ? hexNorm(value) : "";

  const pickFromModal = (hex: string) => {
    const cur = valNorm;
    onSelect(cur === hexNorm(hex) ? "" : hex);
    setModalOpen(false);
  };

  return (
    <View style={[styles.wrap, embedded && styles.wrapEmbedded]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.subtitle, embedded && styles.subtitleEmbedded]}>
        {subtitle}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        style={styles.scroll}
      >
        {popularSwatches.map((sw) => {
          const selected = valNorm === hexNorm(sw.hex);
          return (
            <TouchableOpacity
              key={sw.hex}
              onPress={() => {
                const cur = valNorm;
                onSelect(cur === hexNorm(sw.hex) ? "" : sw.hex);
              }}
              activeOpacity={0.85}
              style={[
                styles.swatchOuter,
                selected && styles.swatchOuterSelected,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${sw.label} — favorite color`}
              accessibilityState={{ selected }}
            >
              <View
                style={[
                  styles.swatchInner,
                  { backgroundColor: sw.hex },
                  sw.light && styles.swatchInnerLight,
                ]}
              />
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          onPress={() => setModalOpen(true)}
          activeOpacity={0.85}
          style={[
            styles.swatchOuter,
            customFromPicker && styles.swatchOuterSelected,
          ]}
          accessibilityRole="button"
          accessibilityLabel="More colors"
          accessibilityHint="Opens a list of every color"
        >
          <View style={styles.moreInner}>
            {customFromPicker && value ? (
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { borderRadius: SWATCH / 2, backgroundColor: value },
                  swatchMeta(value)?.light && styles.swatchInnerLight,
                ]}
              />
            ) : null}
            <Plus
              size={20}
              color={colors.primary}
              strokeWidth={2.6}
              style={{ zIndex: 1 }}
            />
          </View>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModalOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setModalOpen(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>All colors</Text>
            <Text style={styles.modalSub}>
              Tap a color to choose it for the poster.
            </Text>
            <ScrollView
              style={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalGrid}>
                {FAVORITE_COLOR_SWATCHES.map((sw) => {
                  const selected = valNorm === hexNorm(sw.hex);
                  return (
                    <TouchableOpacity
                      key={sw.hex}
                      onPress={() => pickFromModal(sw.hex)}
                      activeOpacity={0.85}
                      style={[
                        styles.modalSwatchOuter,
                        selected && styles.swatchOuterSelected,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={sw.label}
                      accessibilityState={{ selected }}
                    >
                      <View
                        style={[
                          styles.modalSwatchInner,
                          { backgroundColor: sw.hex },
                          sw.light && styles.swatchInnerLight,
                        ]}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <TouchableOpacity
              onPress={() => setModalOpen(false)}
              style={styles.modalClose}
              activeOpacity={0.88}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const SWATCH = 30;
const OUTER = 36;
const MODAL_SWATCH = 34;
const MODAL_OUTER = 40;

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing[4],
  },
  wrapEmbedded: {
    marginBottom: spacing[2],
  },
  title: {
    fontFamily: fontFamily.headline,
    fontSize: 13,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: 0.4,
    marginBottom: spacing[1],
  },
  subtitle: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    fontWeight: "500",
    color: colors.onSurfaceVariant,
    lineHeight: 17,
    marginBottom: spacing[3],
  },
  subtitleEmbedded: {
    marginBottom: spacing[2],
  },
  scroll: {
    marginHorizontal: -2,
    borderRadius: 10,
  },
  scrollContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 2,
    paddingRight: spacing[4],
    borderRadius: 10,
  },
  swatchOuter: {
    width: OUTER,
    height: OUTER,
    borderRadius: OUTER / 2,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(15, 23, 42, 0.06)",
    backgroundColor: "rgba(255, 255, 255, 0.55)",
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.14,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  swatchOuterSelected: {
    borderColor: colors.primary,
    backgroundColor: "rgba(107, 56, 212, 0.06)",
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.42,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  swatchInner: {
    width: SWATCH,
    height: SWATCH,
    borderRadius: SWATCH / 2,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.18,
        shadowRadius: 2,
      },
      android: { elevation: 1 },
      default: {},
    }),
  },
  swatchInnerLight: {
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.55)",
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  moreInner: {
    width: SWATCH,
    height: SWATCH,
    borderRadius: SWATCH / 2,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(107, 56, 212, 0.2)",
    ...Platform.select({
      ios: {
        shadowColor: "#4c1d95",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 5,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
    paddingBottom: spacing[6],
  },
  modalCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    maxHeight: "72%",
    borderTopWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.65)",
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.22,
        shadowRadius: 24,
      },
      android: { elevation: 24 },
      default: {},
    }),
  },
  modalTitle: {
    fontFamily: fontFamily.headline,
    fontSize: 18,
    fontWeight: "800",
    color: colors.onSurface,
    marginBottom: spacing[1],
  },
  modalSub: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginBottom: spacing[3],
  },
  modalScroll: {
    maxHeight: 320,
  },
  modalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingBottom: spacing[3],
  },
  modalSwatchOuter: {
    width: MODAL_OUTER,
    height: MODAL_OUTER,
    borderRadius: MODAL_OUTER / 2,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(15, 23, 42, 0.06)",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 5,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  modalSwatchInner: {
    width: MODAL_SWATCH,
    height: MODAL_SWATCH,
    borderRadius: MODAL_SWATCH / 2,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.16,
        shadowRadius: 2,
      },
      android: { elevation: 1 },
      default: {},
    }),
  },
  modalClose: {
    alignSelf: "center",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    marginBottom: spacing[2],
  },
  modalCloseText: {
    fontFamily: fontFamily.title,
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
});
