import { useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import LottieView from "lottie-react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { AlertTriangle, Building2, Check, CreditCard, FileUp, ScanFace } from "lucide-react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  colors,
  spacing,
  radius,
  fontFamily,
  primaryGradient,
  glassCardFill,
  glassCardBorder,
  glassCardBlurIntensity,
  glassCardDepthShadow,
  cardsHtmlCardGlowPulseMs,
  cardsHtmlRevealCheckDelayMs,
} from "@/src/theme";

const VERIFY_CREDITKID_LOTTIE = require("../../../assets/lotties/verify-creditkid.json");

function canUseNativeLottie(): boolean {
  if (Platform.OS === "web") return false;
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return false;
  }
  return true;
}

const SETUP_STEP_CIRCLE = 44;
const SETUP_LINE_PULSE_MS = 1600;
const SETUP_LINE_SHIMMER_MS = 2800;

function BankingSetupProgressBar() {
  const linePulse = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    linePulse.value = withRepeat(
      withTiming(1, { duration: SETUP_LINE_PULSE_MS, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    shimmer.value = withRepeat(withTiming(1, { duration: SETUP_LINE_SHIMMER_MS, easing: Easing.linear }), -1, false);
  }, [linePulse, shimmer]);

  const seg1PulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(linePulse.value, [0, 1], [0.65, 1]),
  }));

  const seg2PurplePulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(linePulse.value, [0, 1], [0.65, 1]),
  }));

  const seg2GrayPulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(linePulse.value, [0, 1], [0.45, 0.82]),
  }));

  const lineShimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-72, 320]) }],
    opacity: interpolate(shimmer.value, [0, 0.15, 0.45, 0.75, 1], [0, 0.55, 0.75, 0.45, 0]),
  }));

  return (
    <View style={styles.setupProgress} accessibilityRole="progressbar" accessibilityLabel="Bank setup progress">
      <View style={styles.setupProgressTrack}>
        <View style={styles.setupProgressLines} pointerEvents="none">
          <View style={styles.setupProgressLinesInner}>
            <Animated.View style={[styles.setupLineSegmentFull, seg1PulseStyle]} />
            <View style={styles.setupLineSegmentPartial}>
              <Animated.View style={[styles.setupConnectorPartialPurple, seg2PurplePulseStyle]} />
              <Animated.View style={[styles.setupConnectorPartialGray, seg2GrayPulseStyle]} />
            </View>
          </View>
          <Animated.View style={[styles.setupLineShimmer, lineShimmerStyle]} />
        </View>
        <View style={styles.setupProgressRow}>
          <View style={styles.setupColEqual}>
            <View style={styles.stepCircleDone}>
              <FileUp size={20} color={colors.onPrimary} strokeWidth={2} />
            </View>
          </View>
          <View style={styles.setupColEqual}>
            <View style={styles.stepCircleDone}>
              <ScanFace size={20} color={colors.onPrimary} strokeWidth={2} />
            </View>
          </View>
          <View style={styles.setupColEqual}>
            <View style={styles.stepCircleDone}>
              <CreditCard size={20} color={colors.onPrimary} strokeWidth={2} />
            </View>
          </View>
        </View>
      </View>
      <View style={styles.setupProgressLabelsRow}>
        <View style={styles.setupColEqual}>
          <Text style={styles.setupLabelActive}>Upload Documents</Text>
        </View>
        <View style={styles.setupColEqual}>
          <Text style={styles.setupLabelActive}>Biometric Check</Text>
        </View>
        <View style={styles.setupColEqual}>
          <Text style={styles.setupLabelActive}>Get Credit Card</Text>
        </View>
      </View>
    </View>
  );
}

const HALO_GRADIENT: [string, string, string] = [
  "rgba(107, 56, 212, 0.35)",
  "rgba(78, 222, 163, 0.22)",
  "rgba(255, 223, 159, 0.28)",
];

const FLOAT_ALT_MS = 12000;

/** Mini gold sphere — float-ambient-alt (12s) */
function useGoldSphereFloat() {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: FLOAT_ALT_MS, easing: Easing.linear }),
      -1,
      true
    );
  }, [t]);
  return useAnimatedStyle(() => {
    const s = Math.sin(t.value * Math.PI);
    return {
      transform: [{ translateY: 15 * s }, { rotate: `${-8 * s}deg` }, { scale: 1 + 0.05 * s }],
    };
  });
}

interface Props {
  onCompleteSetup: () => void;
}

/**
 * Action Required hero — matches dashboard HTML (`glass-card`, gradient halo, decorative graphic,
 * `animate-glow-pulse`, `animate-reveal-check` on verify badge).
 */
export default function BankingSetupRequiredCard({ onCompleteSetup }: Props) {
  const useNativeLottie = useMemo(() => canUseNativeLottie(), []);
  const goldMotion = useGoldSphereFloat();

  const glowPulse = useSharedValue(0);
  useEffect(() => {
    glowPulse.value = withRepeat(
      withTiming(1, { duration: cardsHtmlCardGlowPulseMs, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [glowPulse]);
  const cardGlowPulseStyle = useAnimatedStyle(() => ({
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: interpolate(glowPulse.value, [0, 1], [0.08, 0.18]),
    shadowRadius: interpolate(glowPulse.value, [0, 1], [32, 48]),
    elevation: interpolate(glowPulse.value, [0, 1], [6, 12]),
  }));

  const checkScale = useSharedValue(0);
  const checkRotate = useSharedValue(-45);
  useEffect(() => {
    const d = cardsHtmlRevealCheckDelayMs;
    checkScale.value = withDelay(
      d,
      withSequence(
        withTiming(1.2, { duration: 360, easing: Easing.bezier(0.34, 1.56, 0.64, 1) }),
        withTiming(1, { duration: 240, easing: Easing.out(Easing.ease) })
      )
    );
    checkRotate.value = withDelay(
      d,
      withTiming(0, { duration: 600, easing: Easing.bezier(0.34, 1.56, 0.64, 1) })
    );
  }, [checkRotate, checkScale]);

  const checkBubbleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${checkRotate.value}deg` }, { scale: checkScale.value }],
    opacity: interpolate(checkScale.value, [0, 0.02, 1.2], [0, 1, 1]),
  }));

  const cardContent = (
    <>
      <Animated.View style={[styles.goldSphere, goldMotion]} pointerEvents="none" />

      <View style={styles.graphicCluster} pointerEvents="none">
        <View style={styles.graphicCircle}>
          <View style={styles.graphicCardTilt}>
            <LinearGradient
              colors={[colors.primary, colors.primaryContainer]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.graphicCardFace}
            >
              <View style={styles.graphicLottieWrap} pointerEvents="none">
                {useNativeLottie ? (
                  <LottieView
                    source={VERIFY_CREDITKID_LOTTIE}
                    autoPlay
                    loop
                    style={styles.graphicLottie}
                  />
                ) : (
                  <View style={styles.graphicIconFallback}>
                    <CreditCard size={60} color={colors.onPrimary} strokeWidth={2} />
                  </View>
                )}
              </View>
            </LinearGradient>
            <Animated.View style={[styles.verifyBubble, checkBubbleStyle]}>
              <Check size={22} color="#006c49" strokeWidth={3} />
            </Animated.View>
          </View>
        </View>
      </View>

      <View style={styles.copyBlock}>
        <View style={styles.actionBadge}>
          <AlertTriangle size={14} color={colors.primary} strokeWidth={2.4} />
          <Text style={styles.actionBadgeText}>Action Required</Text>
        </View>
        <Text style={styles.title}>Verify & Get A CreditKid Card</Text>
      </View>
      <Text style={[styles.body, styles.bodyBelowCopy]}>
        To send SMS invitations and start collecting digital gifts, you need to verify your identity.
      </Text>

      <BankingSetupProgressBar />

      <View style={styles.ctaBlock}>
        <TouchableOpacity onPress={onCompleteSetup} activeOpacity={0.92} style={styles.ctaTouch}>
          <LinearGradient
            colors={primaryGradient.colors}
            start={primaryGradient.start}
            end={primaryGradient.end}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaLabel}>Start Identity Verification</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.trustRow}>
          <Text style={styles.trustMuted}>Verified by</Text>
          {/* image of stripe icon */}
          <Image source={require("../../../assets/images/stripe-icon.png")} style={{width: 50, height: 25}} resizeMode="contain" />
        </View>
      </View>
    </>
  );

  return (
    <View style={styles.sectionWrap}>
      <View style={styles.haloBlur} pointerEvents="none">
        {Platform.OS === "ios" ? (
          <BlurView intensity={28} tint="light" style={StyleSheet.absoluteFill}>
            <LinearGradient colors={HALO_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          </BlurView>
        ) : (
          <LinearGradient colors={HALO_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        )}
      </View>

      <Animated.View style={[styles.cardOuter, cardGlowPulseStyle]}>
        {Platform.OS === "ios" ? (
          <View style={styles.cardShell}>
            <BlurView intensity={glassCardBlurIntensity} tint="light" style={styles.cardBlur}>
              <View style={styles.cardPad}>{cardContent}</View>
            </BlurView>
          </View>
        ) : (
          <View style={[styles.cardShell, styles.cardGlassAndroid]}>
            <View style={styles.cardPad}>{cardContent}</View>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionWrap: {
    position: "relative",
    borderRadius: radius.lg,
    marginBottom: 0,
  },
  /** -inset-0.5 + blur-2xl halo */
  haloBlur: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: radius.lg + 4,
    overflow: "hidden",
    opacity: 0.45,
  },
  cardOuter: {
    borderRadius: radius.lg,
  },
  cardShell: {
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: glassCardBorder,
    ...glassCardDepthShadow,
  },
  cardBlur: {
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: glassCardFill,
  },
  cardGlassAndroid: {
    backgroundColor: glassCardFill,
    borderRadius: radius.lg,
  },
  cardPad: {
    padding: spacing[6],
    overflow: "visible",
    minHeight: 280,
  },
  goldSphere: {
    position: "absolute",
    bottom: -16,
    left: -16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(251, 191, 36, 0.1)",
  },
  graphicCluster: {
    position: "absolute",
    top: -48,
    right: -48,
    width: 192,
    height: 192,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  graphicCircle: {
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: "rgba(107, 56, 212, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  graphicCardTilt: {
    transform: [{ rotate: "12deg" }],
    position: "relative",
  },
  graphicCardFace: {
    width: 128,
    height: 128,
    borderRadius: 16,
    position: "relative",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  graphicLottieWrap: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    overflow: "hidden",
  },
  graphicLottie: {
    width: "100%",
    height: "80%",
    marginTop:10,
  },
  graphicIconFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  verifyBubble: {
    position: "absolute",
    bottom: -8,
    right: -8,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondaryContainer,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.9)",
    shadowColor: "#15803d",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  copyBlock: {
    width: "70%",
    zIndex: 3,
    gap: spacing[3],
  },
  actionBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: "rgba(107, 56, 212, 0.1)",
  },
  actionBadgeText: {
    fontFamily: fontFamily.label,
    fontSize: 10,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: fontFamily.headline,
    fontSize: 24,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    fontWeight: "400",
    color: "rgba(18, 28, 42, 0.7)",
    lineHeight: 22,
  },
  bodyBelowCopy: {
    width: "100%",
    alignSelf: "stretch",
    marginTop: spacing[3],
  },
  setupProgress: {
    width: "100%",
    alignSelf: "stretch",
    marginTop: spacing[4],
    marginBottom: spacing[2],
    zIndex: 3,
  },
  setupProgressTrack: {
    position: "relative",
    minHeight: SETUP_STEP_CIRCLE,
    justifyContent: "center",
  },
  setupProgressLines: {
    position: "absolute",
    left: "16.66%",
    right: "16.66%",
    top: SETUP_STEP_CIRCLE / 2 - 1,
    height: 4,
    overflow: "hidden",
    zIndex: 0,
    justifyContent: "center",
  },
  setupProgressLinesInner: {
    flexDirection: "row",
    width: "100%",
    height: 2,
    alignSelf: "center",
  },
  setupLineShimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
  },
  setupLineSegmentFull: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.primary,
  },
  setupLineSegmentPartial: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 2,
  },
  setupConnectorPartialPurple: {
    width: "25%",
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.primary,
  },
  setupConnectorPartialGray: {
    flex: 1,
    height: 1,
    borderRadius: 0.5,
    backgroundColor: "rgba(203, 195, 215, 0.95)",
  },
  setupProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    zIndex: 1,
  },
  setupColEqual: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 2,
  },
  stepCircleDone: {
    width: SETUP_STEP_CIRCLE,
    height: SETUP_STEP_CIRCLE,
    borderRadius: SETUP_STEP_CIRCLE / 2,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCirclePending: {
    width: SETUP_STEP_CIRCLE,
    height: SETUP_STEP_CIRCLE,
    borderRadius: SETUP_STEP_CIRCLE / 2,
    backgroundColor: "rgba(239, 244, 255, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderStyle: "dashed",
  },
  setupProgressLabelsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
    marginTop: spacing[3],
  },
  setupLabelActive: {
    fontFamily: fontFamily.headline,
    fontSize: 13,
    width:"80%",

    fontWeight: "700",
    color: colors.onSurface,
    textAlign: "center",
    lineHeight: 14,
  },
  setupLabelPending: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    width:"80%",
    fontWeight: "500",
    color: colors.muted,
    textAlign: "center",
    lineHeight: 14,
  },
  ctaBlock: {
    marginTop: spacing[3],
    gap: spacing[2],
    zIndex: 3,
  },
  ctaTouch: {
    borderRadius: radius.full,
    overflow: "hidden",
    alignSelf: "stretch",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  ctaGradient: {
    paddingVertical: 16,
    paddingHorizontal: spacing[6],
    alignItems: "center",
    justifyContent: "center",
  },
  ctaLabel: {
    fontFamily: fontFamily.headline,
    fontSize: 18,
    fontWeight: "700",
    color: colors.onPrimary,
  },
  trustRow: {
    marginBottom: -spacing[3],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
  },
  trustMuted: {
    fontFamily: fontFamily.label,
    fontSize: 12,
    fontWeight: "bold",
    color: colors.onSurfaceVariant,
    letterSpacing: 1.2,
    marginTop: 2,
    marginRight: -6,
    textTransform: "uppercase",
  },
  stripeChip: {
    backgroundColor: "rgba(222, 233, 252, 0.5)",
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: 6,
  },
  stripeText: {
    fontFamily: fontFamily.headline,
    fontSize: 12,
    fontWeight: "800",
    color: "#635BFF",
  },
});
