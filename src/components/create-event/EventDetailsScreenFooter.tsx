import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles } from "lucide-react-native";
import { colors, spacing, fontFamily, primaryGradient } from "@/src/theme";

interface EventDetailsScreenFooterProps {
  onContinue: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export default function EventDetailsScreenFooter({
  onContinue,
  loading,
  disabled,
}: EventDetailsScreenFooterProps) {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(spacing[4], insets.bottom + spacing[2]);
  const isInactive = disabled || loading;

  return (
    <View style={[styles.bar, { paddingBottom }]}>
      <TouchableOpacity
        onPress={onContinue}
        disabled={isInactive}
        activeOpacity={0.92}
        accessibilityRole="button"
        accessibilityLabel="Create event with AI poster invitation"
        style={[styles.ctaOuter, disabled && !loading && styles.ctaOuterDisabled]}
      >
        <LinearGradient
          colors={primaryGradient.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaGradient}
        >
          {loading ? (
            <View style={styles.ctaLoadingWrap}>
              <ActivityIndicator color={colors.onPrimary} />
            </View>
          ) : (
            <View style={styles.ctaInner}>
              <View style={styles.ctaIconBadge} accessible={false}>
                <Sparkles size={20} color="#FFFFFF" strokeWidth={2.25} />
              </View>
              <View style={styles.ctaCopy}>
                <Text style={styles.ctaTitle} maxFontSizeMultiplier={1.35}>
                  Create Event & AI Poster
                </Text>
                {/* <Text style={styles.ctaSubtitle} maxFontSizeMultiplier={1.3}>
                 & AI poster invitation
                </Text> */}
              </View>
              <View style={styles.ctaIconBadge} accessible={false}>
                <Sparkles size={20} color="#FFFFFF" strokeWidth={2.25} />
              </View>
            </View>
          )}
        </LinearGradient>
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
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(107, 56, 212, 0.12)",
    ...Platform.select({
      ios: {
        shadowColor: "#1e1b4b",
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  ctaOuter: {
    borderRadius: 18,
    overflow: "hidden",
    alignSelf: "stretch",
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.38,
        shadowRadius: 18,
      },
      android: { elevation: 6 },
    }),
  },
  ctaOuterDisabled: {
    opacity: 0.52,
  },
  ctaGradient: {
    paddingVertical: 16,
    paddingHorizontal: spacing[4],
    minHeight: 58,
    justifyContent: "center",
  },
  ctaInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    gap: spacing[2],
  },
  ctaLoadingWrap: {
    width: "100%",
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
    flexShrink: 0,
  },
  ctaCopy: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[2],
  },
  ctaTitle: {
    fontFamily: fontFamily.title,
    fontSize: 20,
    fontWeight: "800",
    color: colors.onPrimary,
    letterSpacing: -0.25,
    lineHeight: 23,
    textAlign: "center",
  },
  ctaSubtitle: {
    fontFamily: fontFamily.title,
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.92)",
    letterSpacing: -0.1,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 2,
  },
});
