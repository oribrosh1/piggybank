import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronRight } from "lucide-react-native";
import { colors, spacing, fontFamily, radius } from "@/src/theme";

interface EventDetailsScreenFooterProps {
  onContinue: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export default function EventDetailsScreenFooter({ onContinue, loading, disabled }: EventDetailsScreenFooterProps) {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(spacing[4], insets.bottom + spacing[2]);
  return (
    <View style={[styles.bar, { paddingBottom }]}>
      <TouchableOpacity
        onPress={onContinue}
        disabled={disabled || loading}
        style={[styles.cta, (disabled || loading) && styles.ctaDisabled]}
      >
        {loading ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <>
            <Text style={styles.ctaLabel}>Next: Choose poster</Text>
            <ChevronRight size={22} color={colors.onPrimary} strokeWidth={2.5} />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 10,
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 18,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing[2],
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  ctaLabel: {
    fontFamily: fontFamily.title,
    fontSize: 17,
    fontWeight: "800",
    color: colors.onPrimary,
    letterSpacing: 0.3,
  },
});
