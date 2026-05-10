import React from "react";
import { View, TouchableOpacity, Animated, StyleSheet } from "react-native";
import { ArrowLeft, Sparkles } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, radius } from "@/src/theme";

type CreateEventTopBarProps = {
  onBack: () => void;
  onSparklesPress?: () => void;
  /** When set, a slim progress bar fills the space between back and sparkles (top row). */
  progressWidth?: Animated.AnimatedInterpolation<string | number>;
};

export default function CreateEventTopBar({
  onBack,
  onSparklesPress,
  progressWidth,
}: CreateEventTopBarProps) {
  const insets = useSafeAreaInsets();
  const showProgress = progressWidth != null;

  return (
    <View
      style={{
        paddingTop: insets.top + spacing[1],
        paddingHorizontal: spacing[2],
        paddingBottom: spacing[2],
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <TouchableOpacity
        onPress={onBack}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={{ padding: 8 }}
      >
        <ArrowLeft size={22} color={colors.onSurface} strokeWidth={2.2} />
      </TouchableOpacity>

      {showProgress ? (
        <View style={styles.progressSlot}>
          <View style={styles.track}>
            <Animated.View style={[styles.trackFill, { width: progressWidth }]} />
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }} />
      )}

      <TouchableOpacity
        onPress={onSparklesPress}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={{ padding: 8 }}
        disabled={!onSparklesPress}
      >
        <Sparkles size={22} color={colors.primary} strokeWidth={2.2} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  progressSlot: {
    flex: 1,
    marginHorizontal: spacing[2],
    justifyContent: "center",
    minHeight: 36,
  },
  track: {
    height: spacing[2],
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  trackFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
  },
});
