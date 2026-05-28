import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { colors, fontFamily, spacing } from "@/src/theme/designTokens";

/**
 * iOS-spinner-style age picker. The wheel is a `ScrollView` with one row
 * per age value, snap-to-interval set to the row height, and a fixed
 * "selection band" overlaid on the middle row so the centered value reads
 * as the chosen one. Padding above/below the list makes it possible to
 * scroll the first/last value into the center row.
 */

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const CENTER_OFFSET_ITEMS = Math.floor(VISIBLE_ITEMS / 2);
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const WHEEL_PADDING = ITEM_HEIGHT * CENTER_OFFSET_ITEMS;

type EventAgePickerModalProps = {
  visible: boolean;
  /** Stored value — string so it integrates with `formData.age`. */
  value: string;
  /** Inclusive bounds for the wheel; defaults to the kids-party range. */
  minAge?: number;
  maxAge?: number;
  onConfirm: (age: string) => void;
  onCancel: () => void;
};

export default function EventAgePickerModal({
  visible,
  value,
  minAge = 4,
  maxAge = 18,
  onConfirm,
  onCancel,
}: EventAgePickerModalProps) {
  const ages = useMemo(() => {
    const list: number[] = [];
    for (let n = minAge; n <= maxAge; n += 1) list.push(n);
    return list;
  }, [minAge, maxAge]);

  const initialAge = useMemo(() => {
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed) && parsed >= minAge && parsed <= maxAge) {
      return parsed;
    }
    /** Sensible default lands the wheel near the middle of the range. */
    return Math.round((minAge + maxAge) / 2);
  }, [value, minAge, maxAge]);

  const [selectedAge, setSelectedAge] = useState<number>(initialAge);
  const scrollRef = useRef<ScrollView>(null);

  /**
   * When the modal becomes visible, reset the wheel position to whatever the
   * stored value is. Tiny `setTimeout` because iOS sometimes ignores a
   * `scrollTo` issued in the same frame the Modal mounts.
   */
  useEffect(() => {
    if (!visible) return;
    setSelectedAge(initialAge);
    const idx = ages.indexOf(initialAge);
    if (idx < 0) return;
    const target = idx * ITEM_HEIGHT;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: target, animated: false });
    });
  }, [visible, initialAge, ages]);

  const handleMomentumEnd = (offsetY: number) => {
    const idx = Math.round(offsetY / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(ages.length - 1, idx));
    const next = ages[clamped];
    if (next != null && next !== selectedAge) setSelectedAge(next);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>🎂  Turning age</Text>
          <Text style={styles.subtitle}>
            Pick the age your guest of honor is turning
          </Text>

          <View style={styles.wheelWrap}>
            <View style={styles.selectionBand} pointerEvents="none" />
            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              contentContainerStyle={styles.wheelContent}
              onMomentumScrollEnd={(e) =>
                handleMomentumEnd(e.nativeEvent.contentOffset.y)
              }
              onScrollEndDrag={(e) =>
                handleMomentumEnd(e.nativeEvent.contentOffset.y)
              }
            >
              {ages.map((age) => {
                const isSelected = age === selectedAge;
                return (
                  <View key={age} style={styles.wheelItem}>
                    <Text
                      style={[
                        styles.wheelItemText,
                        isSelected && styles.wheelItemTextSelected,
                      ]}
                    >
                      {age}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => onConfirm(String(selectedAge))}
              style={styles.primaryBtn}
              accessibilityRole="button"
              accessibilityLabel="Confirm age"
            >
              <Text style={styles.primaryBtnText}>Confirm Age</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onCancel}
              style={styles.secondaryBtn}
              accessibilityRole="button"
              accessibilityLabel="Cancel age picker"
            >
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: "85%",
    maxWidth: 350,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: { elevation: 24 },
    }),
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
    marginBottom: 6,
    fontFamily: fontFamily.headline,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.onSurfaceVariant,
    textAlign: "center",
    marginBottom: spacing[4],
    fontFamily: fontFamily.body,
  },
  wheelWrap: {
    height: WHEEL_HEIGHT,
    position: "relative",
    alignSelf: "stretch",
    /** Soft purple gradient bowl behind the wheel for the spinner look. */
    backgroundColor: "rgba(107, 56, 212, 0.04)",
    borderRadius: 16,
    overflow: "hidden",
  },
  /**
   * Highlight strip in the center of the wheel — purely visual; the
   * selected value is whichever row's y is closest to the band.
   */
  selectionBand: {
    position: "absolute",
    top: WHEEL_PADDING,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(107, 56, 212, 0.32)",
    backgroundColor: "rgba(107, 56, 212, 0.08)",
  },
  wheelContent: {
    paddingTop: WHEEL_PADDING,
    paddingBottom: WHEEL_PADDING,
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  wheelItemText: {
    fontSize: 22,
    fontWeight: "500",
    color: colors.onSurfaceVariant,
    fontFamily: fontFamily.headline,
  },
  wheelItemTextSelected: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.primary,
  },
  actions: {
    marginTop: spacing[4],
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.onPrimary,
    fontFamily: fontFamily.headline,
  },
  secondaryBtn: {
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.onSurfaceVariant,
    fontFamily: fontFamily.body,
  },
});
