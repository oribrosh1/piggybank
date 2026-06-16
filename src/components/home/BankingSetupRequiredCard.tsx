import { useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import LottieView from "lottie-react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { AlertTriangle, Building2, Check, ChevronsRightIcon, CreditCard, FileUp, ScanFace } from "lucide-react-native";
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
import DigitalGiftsBlessingPreviewSection from "./DigitalGiftsBlessingPreviewSection";

const VERIFY_CREDITKID_LOTTIE = require("../../../assets/lotties/verify-creditkid.json");

function canUseNativeLottie(): boolean {
  if (Platform.OS === "web") return false;
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return false;
  }
  return true;
}

const SETUP_STEP_CIRCLE = 28;
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
          <View style={styles.setupColFirst}>
            <View style={styles.stepCircleDone}>
              <FileUp size={13} color={colors.onPrimary} strokeWidth={2} />
            </View>
          </View>
          <View style={styles.setupColSecond}>
            <View style={styles.stepCircleDone}>
              <ScanFace size={13} color={colors.onPrimary} strokeWidth={2} />
            </View>
          </View>
          <View style={styles.setupColLast}>
            <View style={styles.stepCircleDone}>
              <CreditCard size={13} color={colors.onPrimary} strokeWidth={2} />
            </View>
          </View>
        </View>
      </View>
      <View style={styles.setupProgressLabelsRow}>
        <View style={styles.setupColFirst}>
          <Text style={[styles.setupLabelActive, styles.setupLabelFirst]}>Upload Documents</Text>
        </View>
        <View style={styles.setupColSecond}>
          <Text style={[styles.setupLabelActive, styles.setupLabelSecond]}>Biometric Check</Text>
        </View>
        <View style={styles.setupColLast}>
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
  /** When false, omits the bundled blessing preview (e.g. when shown separately above). */
  showBlessingPreview?: boolean;
  title?: string;
  subtitle?: string;
}

/**
 * Action Required hero — matches dashboard HTML (`glass-card`, gradient halo, decorative graphic,
 * `animate-glow-pulse`, `animate-reveal-check` on verify badge).
 */
export default function BankingSetupRequiredCard({
  onCompleteSetup,
  showBlessingPreview = true,
  title = "Verify & Get A CreditKid Card",
  subtitle = "To send SMS invitations and start collecting digital gifts, you need to verify your identity.",
}: Props) {
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
                    <CreditCard size={42} color={colors.onPrimary} strokeWidth={2} />
                  </View>
                )}
              </View>
            </LinearGradient>
            <Animated.View style={[styles.verifyBubble, checkBubbleStyle]}>
              <Check size={16} color="#006c49" strokeWidth={3} />
            </Animated.View>
          </View>
        </View>
      </View>

      <View style={styles.copyBlock}>
        {/* <View style={styles.actionBadge}>
          <AlertTriangle size={14} color={colors.primary} strokeWidth={2.4} />
          <Text style={styles.actionBadgeText}>Action Required</Text>
        </View> */}
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={[styles.body, styles.bodyBelowCopy]}>
        {subtitle}
      </Text>

      <View style={styles.setupProgressWithCtaRow}>
        <BankingSetupProgressBar />
        <TouchableOpacity onPress={onCompleteSetup} activeOpacity={0.92} style={styles.verifyNowTouch}>
          <LinearGradient
            colors={primaryGradient.colors}
            start={primaryGradient.start}
            end={primaryGradient.end}
            style={styles.verifyNowGradient}
          >
            <Text style={styles.verifyNowLabel}>Verify Identity Now</Text>
            <ChevronsRightIcon size={14} color={colors.onPrimary} strokeWidth={3} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.ctaBlock}>
        <View style={styles.trustRow}>
          <Text style={styles.trustMuted}>Verified by</Text>
          {/* image of stripe icon */}
          <Image source={require("../../../assets/images/stripe-icon.png")} style={{width: 50, height: 25}} resizeMode="contain" />
        </View>
      </View>
    </>
  );

  return (
    <View style={styles.rootWrap}>
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
      {showBlessingPreview ? (
        <DigitalGiftsBlessingPreviewSection onVerifyPress={onCompleteSetup} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  rootWrap: {
    gap: spacing[3],
    overflow: "visible",
  },
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
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
    paddingBottom: spacing[1],
    overflow: "visible",
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
    top: -32,
    right: -32,
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  graphicCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(107, 56, 212, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  graphicCardTilt: {
    transform: [{ rotate: "12deg" }],
    position: "relative",
  },
  graphicCardFace: {
    width: 90,
    height: 90,
    borderRadius: 12,
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
    bottom: -6,
    right: -6,
    width: 34,
    height: 34,
    borderRadius: 17,
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
    width: "80%",
    marginTop: -spacing[3],
    zIndex: 3,
    gap: spacing[1],
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
    fontSize: 20,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.4,
    lineHeight: 24,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    fontWeight: "400",
    color: "rgba(18, 28, 42, 0.7)",
    lineHeight: 16,
  },
  bodyBelowCopy: {
    width: "80%",
    alignSelf: "stretch",
    marginTop: spacing[1],
    marginBottom: -spacing[2],
  },
  setupProgressWithCtaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing[4],
    marginBottom: spacing[2],
    zIndex: 3,
  },
  setupProgress: {
    flex: 1,
    minWidth: 0,
  },
  setupProgressTrack: {
    position: "relative",
    minHeight: SETUP_STEP_CIRCLE,
    justifyContent: "center",
  },
  setupProgressLines: {
    position: "absolute",
    left: SETUP_STEP_CIRCLE / 2,
    right: "20%",
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
  setupColFirst: {
    flex: 1,
    alignItems: "flex-start",
    paddingRight: 2,
  },
  setupColSecond: {
    flex: 0.75,
    alignItems: "flex-start",
    paddingRight: 2,
  },
  setupColLast: {
    flex: 1.25,
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
    marginTop: spacing[1],
  },
  setupLabelActive: {
    fontFamily: fontFamily.headline,
    fontSize: 9,
    width: "90%",
    fontWeight: "700",
    color: colors.onSurface,
    textAlign: "center",
    lineHeight: 11,
  },
  setupLabelFirst: {
    textAlign: "center",
    width: "100%",
    marginLeft: -20,
  },
  setupLabelSecond: {
    textAlign: "center",
    width: "100%",
    marginLeft: -10,
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
    gap: spacing[2],
    zIndex: 3,
  },
  verifyNowTouch: {
    borderRadius: radius.full,
    overflow: "hidden",
    flexShrink: 0,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  verifyNowGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: spacing[3],
    justifyContent: "center",
  },
  verifyNowLabel: {
    fontFamily: fontFamily.headline,
    fontSize: 12,
    fontWeight: "700",
    color: colors.onPrimary,
    textAlign: "center",
    marginRight: -4,
  },
  trustRow: {
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
    marginTop: 1,
    marginRight: -7,
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
