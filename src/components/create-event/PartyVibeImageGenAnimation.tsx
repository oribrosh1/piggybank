import { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Sparkles } from "lucide-react-native";
import { spacing, fontFamily } from "@/src/theme";

const SPARKLE_COUNT = 5;

type SparkleOrbProps = {
  delayMs: number;
};

function SparkleOrb({ delayMs }: SparkleOrbProps) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      delayMs,
      withRepeat(
        withTiming(1, {
          duration: 950,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      ),
    );
  }, [delayMs, t]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 1], [0.35, 1]),
    transform: [
      { scale: interpolate(t.value, [0, 1], [0.82, 1.18]) },
      {
        rotate: `${interpolate(t.value, [0, 1], [-8, 8])}deg`,
      },
    ],
  }));

  return (
    <Animated.View style={style}>
      <Sparkles size={19} color="#ffffff" strokeWidth={2.35} />
    </Animated.View>
  );
}

type PartyVibeImageGenAnimationProps = {
  partyVibe: string;
};

/**
 * “Generating” motion above the avatar: shimmer over the vibe text + floating sparkles.
 */
export function PartyVibeImageGenAnimation({
  partyVibe,
}: PartyVibeImageGenAnimationProps) {
  const shimmer = useSharedValue(0);
  const breathe = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, {
        duration: 2600,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );
    breathe.value = withRepeat(
      withTiming(1, {
        duration: 1800,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [shimmer, breathe]);

  const shimmerMove = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(shimmer.value, [0, 1], [-140, 220]) },
    ],
  }));

  const framePulse = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(breathe.value, [0, 1], [1, 1.02]),
      },
    ],
  }));

  const trimmed = partyVibe.trim();
  const snippet =
    trimmed.length > 72 ? `${trimmed.slice(0, 72)}…` : trimmed;

  return (
    <View style={styles.wrap}>
      <View
        style={styles.generatingBanner}
        accessibilityRole="progressbar"
        accessibilityLiveRegion="polite"
        accessibilityLabel={
          snippet
            ? "Generating invitation image now, using your party vibe"
            : "Generating invitation image now from your event details"
        }
      >
        <ActivityIndicator color="#ffffff" size="small" />
        <View style={styles.bannerTextCol}>
          <Text style={styles.generatingTitle}>Generating Your Poster</Text>
          <Text style={styles.generatingSub}>
            {snippet
              ? "Painting your poster from this vibe"
              : "Painting your poster from your details"}
          </Text>
        </View>
      </View>

      <Animated.View style={[styles.canvasOuter, framePulse]}>
        <View style={styles.canvas}>
          <View style={styles.canvasTextBlock}>
            {snippet ? (
              <Text style={styles.vibeSnippet} numberOfLines={3}>
                {snippet}
              </Text>
            ) : (
              <Text style={styles.vibePlaceholder} numberOfLines={2}>
                Add a party vibe on the previous screen to steer the image
              </Text>
            )}
          </View>

          <View style={styles.shimmerMask} pointerEvents="none">
            <Animated.View style={[styles.shimmerBand, shimmerMove]}>
              <LinearGradient
                colors={[
                  "transparent",
                  "rgba(255,255,255,0.08)",
                  "rgba(255,255,255,0.55)",
                  "rgba(255,255,255,0.08)",
                  "transparent",
                ]}
                locations={[0, 0.35, 0.5, 0.65, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.shimmerGradient}
              />
            </Animated.View>
          </View>
        </View>
      </Animated.View>

      <View style={styles.sparkleRow}>
        {Array.from({ length: SPARKLE_COUNT }, (_, i) => (
          <SparkleOrb key={i} delayMs={i * 130} />
        ))}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    alignItems: "center",
    marginBottom: spacing[2],
    paddingHorizontal: spacing[1],
    flexGrow: 0,
    flexShrink: 1,
  },
  generatingBanner: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    marginBottom: spacing[3],
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.45)",
  },
  bannerTextCol: {
    flex: 1,
    minWidth: 0,
  },
  generatingTitle: {
    fontFamily: fontFamily.title,
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.35,
    lineHeight: 21,
  },
  generatingSub: {
    marginTop: 3,
    fontFamily: fontFamily.body,
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.88)",
    lineHeight: 18,
  },
  /** Keep intrinsic height — do not grow in flex parents (avoids a stretched “bar” glitch). */
  canvasOuter: {
    alignSelf: "stretch",
    width: "100%",
    flexGrow: 0,
    flexShrink: 0,
    borderRadius: 16,
    overflow: "hidden",
  },
  canvas: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.35)",
    minHeight: 56,
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  canvasTextBlock: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    zIndex: 1,
  },
  vibeSnippet: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    fontWeight: "600",
    fontStyle: "italic",
    color: "rgba(255,255,255,0.96)",
    lineHeight: 18,
    textAlign: "center",
  },
  vibePlaceholder: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.52)",
    lineHeight: 17,
    textAlign: "center",
  },
  shimmerMask: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    borderRadius: 16,
  },
  shimmerBand: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 140,
  },
  shimmerGradient: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  sparkleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: spacing[2],
    marginBottom: 0,
  },
  caption: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.1,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
    lineHeight: 15,
    marginTop: spacing[1],
    paddingHorizontal: spacing[1],
  },
});
