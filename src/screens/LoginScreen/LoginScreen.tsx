import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  type StyleProp,
  type ViewStyle,
  type ImageSourcePropType,
  View,
  Text,
  Image,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Platform,
  Linking,
  useWindowDimensions,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from "react-native-svg";
import Animated, {
  Easing,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  ZoomInUp,
} from "react-native-reanimated";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { useLoginScreen } from "./useLoginScreen";
import { colors, typography, primaryGradient, fontFamily, ambientShadow } from "@/src/theme";
import LottieView from "lottie-react-native";

const PAY_EVERYWHERE_LOTTIE = require("../../../assets/lotties/pay-everywhere-creditkid.json");
const STRIPE_TICKER_WORDMARK = require("../../../assets/images/stripe-icon.png") as ImageSourcePropType;

const TERMS_URL = "https://creditkid.vercel.app/terms";
const PRIVACY_URL = "https://creditkid.vercel.app/privacy";

/** Shimmer band width inside Get Started (px) — travel is full screen via measureInWindow */
const GET_STARTED_SHIMMER_BAND_W = 100;

/** Gift card problem block */
const GIFT_CARD_SECTION = {
  statMint: "#7ED9A4",
  balanceBg: "#151d2b",
  balanceBorder: "rgba(148, 163, 184, 0.18)",
  balanceSample: "$142.50",
  /** Demo card — masked PAN + expiry (decorative) */
  panMasked: "**** **** **** 1234",
  expiry: "10/32",
} as const;

const GIFT_CARD_ELEVATED_SHADOW = {
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 10 } as const,
  shadowOpacity: 0.35,
  shadowRadius: 24,
  elevation: 10,
} as const;

const HERO_TAGLINE_TEXT = "Birthday money they can spend anywhere";

const TAGLINE_FS_MAX = 16;
const TAGLINE_FS_MIN = 9;
/** Bold headline Latin: approximate width ≈ len × fs × ratio (tuned so one SVG line fits the capsule). */
const TAGLINE_WIDTH_RATIO = 0.56;

function heroTaglineFontSizeForWidth(innerWidth: number): number {
  if (innerWidth <= 0) return TAGLINE_FS_MIN;
  const available = Math.max(0, innerWidth - 12);
  let fs = TAGLINE_FS_MAX;
  while (fs >= TAGLINE_FS_MIN) {
    const estW = HERO_TAGLINE_TEXT.length * fs * TAGLINE_WIDTH_RATIO;
    if (estW <= available) return fs;
    fs -= 1;
  }
  return TAGLINE_FS_MIN;
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowW } = useWindowDimensions();
  const heroTextW = Math.max(0, windowW - 48);
  /** Capsule uses paddingHorizontal 10 — SVG must match to avoid clipping */
  const heroTaglineInnerW = Math.max(0, heroTextW - 20);
  const taglineFontSize = useMemo(() => heroTaglineFontSizeForWidth(heroTaglineInnerW), [heroTaglineInnerW]);
  const taglineLineHeight = taglineFontSize + 6;
  const taglineBodyItems = useMemo(() => {
    const shared = {
      gradientStops: HERO_TAGLINE_BODY_GRADIENT,
      fontSize: taglineFontSize,
      lineHeight: taglineLineHeight,
    };
    return [{ text: HERO_TAGLINE_TEXT, ...shared }];
  }, [taglineFontSize, taglineLineHeight]);
  const {
    isAuthenticating,
    handleAppleSignIn,
    handleEmailSignIn,
    handleSignUp,
    handleGoogleSignIn,
  } = useLoginScreen();

  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(520).delay(40)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: insets.top + 12,
            paddingBottom: 8,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <LinearGradient
              {...primaryGradient}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="wallet" size={16} color={colors.onPrimary} />
            </LinearGradient>
            <GradientBrandWord text="CreditKid" width={112} height={22} fontSize={18} anchor="start" x={0} italic />
          </View>
          <TouchableOpacity
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{ alignItems: "center", justifyContent: "center" }}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </Animated.View>

        {/* Hero Section */}
        <Animated.View
          style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16, alignItems: "center" }}
          entering={FadeInDown.duration(520).delay(120)}
        >
          <LoginHeroGradientHeadline width={heroTextW} />
          <View
            style={{
              marginTop: 8,
              width: "100%",
              maxWidth: "100%",
              borderRadius: 20,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: "rgba(107, 56, 212, 0.14)",
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.14,
              shadowRadius: 16,
              elevation: 3,
            }}
          >
            <LinearGradient
              colors={["rgba(107, 56, 212, 0.12)", "rgba(255, 255, 255, 0.96)", "rgba(107, 56, 212, 0.06)"]}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 10,
                alignItems: "center",
              }}
            >
              {/* One line; font scales down on narrow widths so the full sentence fits */}
              <GradientBodyLines
                items={taglineBodyItems}
                width={heroTaglineInnerW}
                fontSize={taglineFontSize}
                lineHeight={taglineLineHeight}
                fontWeight="700"
                svgFontFamily={fontFamily.headline}
              />
            </LinearGradient>
          </View>
          <View style={{ marginTop: 8, alignItems: "center", width: "100%" }}>
            <GradientBodyLines
              items={[
                { text: "blessing cards they'll remember forever", gradientStops: HERO_BLESSING_LINE1_GRADIENT },
                {
                  text: "all in one app",
                  gradientStops: HERO_BLESSING_LINE2_GRADIENT,
                  fontSize: 17,
                  lineHeight: 24,
                },
              ]}
              width={heroTextW}
              fontSize={16}
              lineHeight={25}
              fontWeight="600"
              svgFontFamily={fontFamily.title}
            />
          </View>
        </Animated.View>

        {/* 1) Video — first after "all in one app" */}
        <Animated.View style={{ paddingHorizontal: 24, marginBottom: 20 }} entering={FadeInDown.duration(520).delay(180)}>
          <View
            style={{
              backgroundColor: "#E5E7EB",
              borderRadius: 16,
              height: 200,
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "rgba(255,255,255,0.9)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIcons name="play-arrow" size={32} color="#374151" />
            </View>
          </View>
        </Animated.View>

        {/* 2) Trust ticker + floating decor (stichloginpage.html) */}
        <Animated.View
          entering={FadeInDown.duration(520).delay(230)}
          style={{ paddingHorizontal: 0, marginBottom: 0 }}
        >
          <LoginTrustTicker />
          <LoginFloatingDecor handleSignUp={handleSignUp} />
        </Animated.View>

        {/* 3) Every gift — gradient headline */}
        <View style={{ paddingHorizontal: 24, marginBottom: 12, alignItems: "center" }}>
          <Animated.View
            entering={ZoomInUp.duration(780).delay(48).springify()}
            style={{ width: "100%", alignItems: "center" }}
          >
            <EveryGiftGradientTitle
              width={heroTextW}
              fontSize={windowW < 360 ? 17 : windowW < 400 ? 19 : 21}
            />
          </Animated.View>
        </View>

        {/* 4) Pay everywhere Lottie — no layout entering wrapper (FadeIn on child can keep Lottie invisible) */}
        <View style={{ paddingHorizontal: 24, marginBottom: 12, width: "100%", alignItems: "stretch" }}>
          <PayEverywhereLottie />
        </View>

        {/* 5) See How It Works */}
        <View style={{ paddingHorizontal: 24, marginBottom: 20, alignItems: "center" }}>
          <TouchableOpacity style={{ alignItems: "center" }}>
            <GradientLinkLine text="See How It Works" width={heroTextW} fontSize={15} />
          </TouchableOpacity>
        </View>
        
        {/* Safety First - Parental Controls */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <Text style={[typography.labelMd, { color: colors.primary, marginBottom: 4 }]}>
            SAFETY FIRST
          </Text>
          <Text style={[typography.titleLg, { fontSize: 22, marginBottom: 16 }]}>
            {"You\u2019re Always in Control"}
          </Text>

          <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
            <ControlCard
              icon="account-balance-wallet"
              label="Freeze Card"
              description="Instantly lock any card from your phone."
              color={colors.primary}
            />
            <ControlCard
              icon="payments"
              label="Spending Limits"
              description="Daily or weekly caps that you manage."
              color={colors.primary}
            />
          </View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <ControlCard
              icon="block"
              label="Block Types"
              description="Restrict specific merchant categories."
              color={colors.primary}
            />
            <ControlCard
              icon="bolt"
              label="Live Activity"
              description="Real-time alerts for every transaction."
              color={colors.primary}
            />
          </View>
        </View>

        {/* Gift card stats — primary card, stat rows + child balance */}
        <View style={{ paddingHorizontal: 24, marginBottom: 28 }}>
          <View
            style={{
              backgroundColor: colors.primary,
              borderRadius: 40,
              paddingHorizontal: 24,
              paddingVertical: 28,
              ...GIFT_CARD_ELEVATED_SHADOW,
            }}
          >
            <Text
              style={{
                fontFamily: fontFamily.headline,
                fontSize: 24,
                fontWeight: "800",
                color: "#FFFFFF",
                lineHeight: 30,
                marginBottom: 22,
              }}
            >
              {`The Gift Card\nProblem`}
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                marginBottom: 18,
              }}
            >
              <Text
                style={{
                  fontSize: 40,
                  fontWeight: "900",
                  color: GIFT_CARD_SECTION.statMint,
                  fontVariant: ["tabular-nums"],
                }}
              >
                $27B
              </Text>
              <Text
                style={{
                  flex: 1,
                  fontFamily: fontFamily.body,
                  fontSize: 14,
                  fontWeight: "500",
                  color: "rgba(255,255,255,0.92)",
                  lineHeight: 20,
                }}
              >
                Left unused on gift cards every year. Money gone forever.
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 22 }}>
              <Text
                style={{
                  fontSize: 40,
                  fontWeight: "900",
                  color: GIFT_CARD_SECTION.statMint,
                  fontVariant: ["tabular-nums"],
                }}
              >
                $44
              </Text>
              <Text
                style={{
                  flex: 1,
                  fontFamily: fontFamily.body,
                  fontSize: 14,
                  fontWeight: "500",
                  color: "rgba(255,255,255,0.92)",
                  lineHeight: 20,
                }}
              >
                Average amount wasted per household on forgotten credit.
              </Text>
            </View>

            <View
              style={{
                backgroundColor: GIFT_CARD_SECTION.balanceBg,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: GIFT_CARD_SECTION.balanceBorder,
                paddingHorizontal: 18,
                paddingVertical: 18,
                ...GIFT_CARD_ELEVATED_SHADOW,
              }}
            >
              {/* Credit-card chrome: issuer + contactless (wifi) */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
         
                <GradientBrandWord text="CreditKid" width={112} height={22} fontSize={18} anchor="start" x={0} italic />
                <Ionicons name="wifi" size={26} color={GIFT_CARD_SECTION.statMint} accessibilityLabel="Contactless" />
              </View>

              <Text
                style={{
                  fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                  fontSize: 17,
                  fontWeight: "600",
                  letterSpacing: 1.25,
                  color: "rgba(255,255,255,0.95)",
                  marginBottom: 18,
                  fontVariant: ["tabular-nums"],
                }}
                selectable={false}
              >
                {GIFT_CARD_SECTION.panMasked}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <View>
                  <Text
                    style={{
                      fontFamily: fontFamily.label,
                      fontSize: 10,
                      letterSpacing: 0.8,
                      fontWeight: "600",
                      color: "rgba(255,255,255,0.42)",
                      marginBottom: 4,
                    }}
                  >
                    AVAILABLE BALANCE
                  </Text>
                  <Text
                    style={{
                      fontFamily: fontFamily.headline,
                      fontSize: 32,
                      fontWeight: "800",
                      color: "#FFFFFF",
                      fontVariant: ["tabular-nums"],
                    }}
                  >
                    {GIFT_CARD_SECTION.balanceSample}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", paddingBottom: 2 }}>
                  <Text
                    style={{
                      fontFamily: fontFamily.label,
                      fontSize: 9,
                      letterSpacing: 0.6,
                      fontWeight: "600",
                      color: "rgba(255,255,255,0.38)",
                      marginBottom: 4,
                    }}
                  >
                    VALID THRU
                  </Text>
                  <Text
                    style={{
                      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                      fontSize: 15,
                      fontWeight: "600",
                      color: "rgba(255,255,255,0.92)",
                      fontVariant: ["tabular-nums"],
                    }}
                  >
                    {GIFT_CARD_SECTION.expiry}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="trending-up" size={18} color={GIFT_CARD_SECTION.statMint} />
                <Text
                  style={{
                    fontFamily: fontFamily.title,
                    fontSize: 14,
                    fontWeight: "600",
                    color: GIFT_CARD_SECTION.statMint,
                  }}
                >
                  Ready to spend anywhere
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Auth Buttons */}
        <View style={{ paddingHorizontal: 24, gap: 12 }}>
          {Platform.OS === "ios" && (
            <TouchableOpacity
              onPress={handleAppleSignIn}
              activeOpacity={0.85}
              disabled={isAuthenticating}
              style={{
                backgroundColor: colors.surfaceContainerLowest,
                borderRadius: 14,
                height: 52,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            >
              <Ionicons name="logo-apple" size={20} color={colors.onSurface} />
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.onSurface }}>
                Continue with Apple
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleGoogleSignIn}
            activeOpacity={0.85}
            disabled={isAuthenticating}
            style={{
              backgroundColor: colors.surfaceContainerLowest,
              borderRadius: 14,
              height: 52,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            <Ionicons name="logo-google" size={18} color="#4285F4" />
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.onSurface }}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSignUp}
            activeOpacity={0.85}
            style={{
              backgroundColor: "#F59E0B",
              borderRadius: 14,
              height: 52,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Ionicons name="mail-outline" size={18} color={colors.onPrimary} />
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFF" }}>
              Sign up with Email
            </Text>
          </TouchableOpacity>
        </View>

        {/* Login Link */}
        <View style={{ alignItems: "center", marginTop: 16, marginBottom: 24 }}>
          <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant }]}>
            Already have an account?{" "}
            <Text onPress={handleEmailSignIn} style={{ fontFamily: fontFamily.title, color: colors.primary }}>
              Log in
            </Text>
          </Text>
        </View>

        {/* Footer Links */}
        <View style={{ paddingHorizontal: 24, marginTop: 8 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 20,
              marginBottom: 8,
            }}
          >
            <Text
              onPress={() => Linking.openURL(PRIVACY_URL)}
              style={[typography.bodyMd, { fontSize: 12, color: colors.muted }]}
            >
              Privacy Policy
            </Text>
            <Text
              onPress={() => Linking.openURL(TERMS_URL)}
              style={[typography.bodyMd, { fontSize: 12, color: colors.muted }]}
            >
              Terms of Service
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 20,
              marginBottom: 12,
            }}
          >
            <Text style={[typography.bodyMd, { fontSize: 12, color: colors.muted }]}>
              Contact Us
            </Text>
            <Text style={[typography.bodyMd, { fontSize: 12, color: colors.muted }]}>
              Cookie Policy
            </Text>
          </View>
          <Text
            style={{
              fontSize: 11,
              color: colors.muted,
              textAlign: "center",
              lineHeight: 16,
            }}
          >
            © 2026 CreditKid, Inc. All rights reserved. Banking services provided
            by our partner banks. Member FDIC.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const LOGIN_TEXT_GRADIENT_STOPS: { offset: string; color: string }[] = [
  { offset: "0%", color: colors.primary },
  { offset: "45%", color: colors.primaryContainer },
  { offset: "100%", color: colors.secondary },
];

/** Hero subline — near-black to soft primary wash (horizontal) */
const HERO_TAGLINE_BODY_GRADIENT: { offset: string; color: string }[] = [
  { offset: "0%", color: "#000000" },
  { offset: "100%", color: "rgba(107, 56, 212, 0.1)" },
];

/** Hero line 1 — slate → indigo → violet (distinct from “Gift of Choice.” below) */
const HERO_HEADLINE_LINE1_GRADIENT: { offset: string; color: string }[] = [
  { offset: "0%", color: "#0f172a" },
  { offset: "48%", color: "#4f46e5" },
  { offset: "100%", color: "#a78bfa" },
];

/** Blessing subcopy — purple emphasis */
const HERO_BLESSING_LINE1_GRADIENT: { offset: string; color: string }[] = [
  { offset: "0%", color: "#4c1d95" },
  { offset: "50%", color: colors.primary },
  { offset: "100%", color: colors.primaryContainer },
];

/** Blessing subcopy — teal / growth */
const HERO_BLESSING_LINE2_GRADIENT: { offset: string; color: string }[] = [
  { offset: "0%", color: "#065f46" },
  { offset: "100%", color: colors.onPrimaryFixedVariant },
];

function GradientBrandWord({
  text,
  width,
  height,
  fontSize,
  anchor,
  x,
  italic = false,
}: {
  text: string;
  width: number;
  height: number;
  fontSize: number;
  anchor: "start" | "middle" | "end";
  x: number;
  italic?: boolean;
}) {
  const rawId = useId();
  const gradId = useMemo(() => `login-g-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`, [rawId]);
  const y = fontSize * 0.88;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <SvgLinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          {LOGIN_TEXT_GRADIENT_STOPS.map((s) => (
            <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </SvgLinearGradient>
      </Defs>
      <SvgText
        fill={`url(#${gradId})`}
        fontFamily={fontFamily.title}
        fontSize={fontSize}
        fontWeight="600"
        fontStyle={italic ? "italic" : "normal"}
        x={x}
        y={y}
        textAnchor={anchor}
      >
        {text}
      </SvgText>
    </Svg>
  );
}

function LoginHeroGradientHeadline({ width }: { width: number }) {
  const rawId = useId();
  const gradLine1Id = useMemo(() => `login-h1-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`, [rawId]);
  const gradLine2Id = useMemo(() => `login-h2-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`, [rawId]);
  const fs = 31;
  const line = 36;
  const h = line * 2 + 6;

  return (
    <Svg width={width} height={h}>
      <Defs>
        <SvgLinearGradient id={gradLine1Id} x1="0%" y1="0%" x2="100%" y2="100%">
          {HERO_HEADLINE_LINE1_GRADIENT.map((s) => (
            <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </SvgLinearGradient>
        <SvgLinearGradient id={gradLine2Id} x1="0%" y1="0%" x2="100%" y2="100%">
          {LOGIN_TEXT_GRADIENT_STOPS.map((s) => (
            <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </SvgLinearGradient>
      </Defs>
      <SvgText
        fill={`url(#${gradLine1Id})`}
        fontFamily={fontFamily.headline}
        fontSize={fs}
        fontWeight="700"
        x={width / 2}
        y={fs * 0.92}
        textAnchor="middle"
      >
        Give Your Child 
      </SvgText>
      <SvgText
        fill={`url(#${gradLine2Id})`}
        fontFamily={fontFamily.headline}
        fontSize={fs}
        fontWeight="700"
        fontStyle="italic"
        x={width / 2}
        y={fs * 0.92 + line}
        textAnchor="middle"
      >
        the Gift of Choice
      </SvgText>
    </Svg>
  );
}

function GradientBodyLines({
  items,
  width,
  fontSize: defaultFontSize,
  lineHeight: defaultLineHeight,
  fontWeight = "600",
  svgFontFamily = fontFamily.title,
}: {
  items: {
    text: string;
    gradientStops: { offset: string; color: string }[];
    fontSize?: number;
    lineHeight?: number;
  }[];
  width: number;
  fontSize: number;
  lineHeight: number;
  fontWeight?: string;
  svgFontFamily?: string;
}) {
  const rawId = useId();
  const base = useMemo(() => rawId.replace(/[^a-zA-Z0-9_-]/g, ""), [rawId]);
  const gradIds = useMemo(() => items.map((_, i) => `login-bl-${base}-${i}`), [items, base]);
  const rowMetrics = useMemo(
    () =>
      items.map((item) => ({
        fontSize: item.fontSize ?? defaultFontSize,
        lineHeight: item.lineHeight ?? defaultLineHeight,
      })),
    [items, defaultFontSize, defaultLineHeight]
  );
  const { h, yByLine } = useMemo(() => {
    let acc = 0;
    const ys: number[] = [];
    for (const r of rowMetrics) {
      ys.push(acc + r.fontSize * 0.88);
      acc += r.lineHeight;
    }
    return { h: acc, yByLine: ys };
  }, [rowMetrics]);

  return (
    <Svg width={width} height={h}>
      <Defs>
        {items.map((item, i) => (
          <SvgLinearGradient key={gradIds[i]} id={gradIds[i]} x1="0%" y1="0%" x2="100%" y2="0%">
            {item.gradientStops.map((s) => (
              <Stop key={`${gradIds[i]}-${s.offset}`} offset={s.offset} stopColor={s.color} />
            ))}
          </SvgLinearGradient>
        ))}
      </Defs>
      {items.map((item, i) => (
        <SvgText
          key={gradIds[i]}
          fill={`url(#${gradIds[i]})`}
          fontFamily={svgFontFamily}
          fontSize={rowMetrics[i].fontSize}
          fontWeight={fontWeight}
          x={width / 2}
          y={yByLine[i]}
          textAnchor="middle"
        >
          {item.text}
        </SvgText>
      ))}
    </Svg>
  );
}

function GradientLinkLine({
  text,
  width,
  fontSize,
}: {
  text: string;
  width: number;
  fontSize: number;
}) {
  const rawId = useId();
  const gradId = useMemo(() => `login-l-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`, [rawId]);
  const lh = Math.round(fontSize * 1.35);
  const h = lh;

  return (
    <Svg width={width} height={h}>
      <Defs>
        <SvgLinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          {LOGIN_TEXT_GRADIENT_STOPS.map((s) => (
            <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </SvgLinearGradient>
      </Defs>
      <SvgText
        fill={`url(#${gradId})`}
        fontFamily={fontFamily.title}
        fontSize={fontSize}
        fontWeight="600"
        x={width / 2}
        y={fontSize * 0.9}
        textAnchor="middle"
      >
        {text}
      </SvgText>
    </Svg>
  );
}

function EveryGiftGradientTitle({ width, fontSize }: { width: number; fontSize: number }) {
  const rawId = useId();
  const gradId = useMemo(() => `evg-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`, [rawId]);
  const lh = Math.round(fontSize * 1.3);
  const h = lh * 2 + 8;

  return (
    <Svg width={width} height={h}>
      <Defs>
        <SvgLinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          {LOGIN_TEXT_GRADIENT_STOPS.map((s) => (
            <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </SvgLinearGradient>
      </Defs>
      <SvgText
        fill={`url(#${gradId})`}
        fontFamily={fontFamily.headline}
        fontSize={fontSize}
        fontWeight="800"
        x={width / 2}
        y={fontSize * 0.92}
        textAnchor="middle"
      >
        Every Gift Deserves to Be Used
      </SvgText>
      <SvgText
        fill={`url(#${gradId})`}
        fontFamily={fontFamily.headline}
        fontSize={fontSize}
        fontWeight="800"
        fontStyle="italic"
        x={width / 2}
        y={fontSize * 0.92 + lh}
        textAnchor="middle"
      >
        Not Forgotten in a Drawer
      </SvgText>
    </Svg>
  );
}

function payEverywhereLottieCanRunNatively(): boolean {
  if (Platform.OS === "web") return false;
  return Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
}

const PAY_EVERYWHERE_LOTTIE_HEIGHT = 210;

/** Native Lottie in dev/production builds; visible fallback in Expo Go / web so the slot is never an empty gap. */
function PayEverywhereLottie() {
  const useNative = useMemo(() => payEverywhereLottieCanRunNatively(), []);

  const slotStyle = {
    width: "100%" as const,
    height: PAY_EVERYWHERE_LOTTIE_HEIGHT,
    borderRadius: 16,
    overflow: "hidden" as const,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(203, 195, 215, 0.4)",
  };

  if (!useNative) {
    return (
      <View style={[slotStyle, { alignItems: "center", justifyContent: "center", paddingHorizontal: 16 }]}>
        <MaterialIcons name="payments" size={48} color={colors.primary} />
        <Text
          style={{
            marginTop: 10,
            fontSize: 13,
            color: colors.onSurfaceVariant,
            textAlign: "center",
            fontFamily: fontFamily.body,
            lineHeight: 18,
          }}
        >
          Preview: open in a dev build (npx expo run:ios) to play the Pay Everywhere animation. Expo Go cannot run native Lottie.
        </Text>
      </View>
    );
  }

  return (
    <View style={slotStyle} collapsable={false}>
      <LottieView
        source={PAY_EVERYWHERE_LOTTIE}
        style={{ width: "100%", height: PAY_EVERYWHERE_LOTTIE_HEIGHT }}
        autoPlay
        loop
        resizeMode="contain"
        renderMode="AUTOMATIC"
      />
    </View>
  );
}

const TICKER_TRUST_ITEMS: (
  | {
      label: string;
      icon: React.ComponentProps<typeof MaterialIcons>["name"];
      iconColor: string;
    }
  | {
      label: string;
      stripeWordmark: true;
    }
)[] = [
  // { icon: "favorite", label: "Loved by 50k+ Parents", iconColor: colors.primary },
  { label: "Secured by", stripeWordmark: true },
  // { icon: "star", label: "4.9 App Store Rating", iconColor: "#FBBF24" },
  // { icon: "shield", label: "Bank-Level Safety", iconColor: colors.primary },
  { icon: "restaurant", label: "Kosher Catering Discounts", iconColor: colors.secondary },
  { icon: "apple", label: "Apple Pay", iconColor: "#1D1D1F" },
];

function LoginTrustTicker() {
  const [stripW, setStripW] = useState(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (stripW <= 0) return;
    translateX.value = 0;
    translateX.value = withRepeat(
      withTiming(-stripW, { duration: 25_000, easing: Easing.linear }),
      -1,
      false
    );
  }, [stripW, translateX]);

  const rowAnimated = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const renderPills = (suffix: string) =>
    TICKER_TRUST_ITEMS.map((item) => (
      <View
        key={`${suffix}-${item.label}`}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginHorizontal: 8,
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 999,
          backgroundColor: colors.surfaceContainerHigh,
          borderWidth: 1,
          borderColor: "rgba(203, 195, 215, 0.35)",
          marginBottom: 10,
        }}
      >
        {"stripeWordmark" in item && item.stripeWordmark ? (
          <>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 0.6,
                textTransform: "uppercase",
                color: colors.onSurfaceVariant,
                fontFamily: fontFamily.label,
              }}
              numberOfLines={1}
            >
              {item.label}
            </Text>
            <Image
              source={STRIPE_TICKER_WORDMARK}
              resizeMode="contain"
              accessibilityLabel="Stripe"
              style={{ width: 56, height: 18 }}
            />
          </>
        ) : (
          <>
            {"icon" in item && (
              <MaterialIcons name={item.icon} size={20} color={item.iconColor} />
            )}
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 0.6,
                textTransform: "uppercase",
                color: colors.onSurfaceVariant,
                fontFamily: fontFamily.label,
              }}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </>
        )}
      </View>
    ));

  return (
    <View style={{ overflow: "hidden", marginBottom: 4 }}>
      <Animated.View style={[{ flexDirection: "row" }, rowAnimated]}>
        <View
          style={{ flexDirection: "row" }}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            if (w > 0) setStripW(w);
          }}
        >
          {renderPills("a")}
        </View>
        <View style={{ flexDirection: "row" }}>{renderPills("b")}</View>
      </Animated.View>
    </View>
  );
}

function FloatingDecorTile({
  delayMs,
  rotation,
  gradient,
  icon,
  iconColor,
  size,
  borderRadius,
  style,
}: {
  delayMs: number;
  rotation: string;
  gradient: [string, string];
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  iconColor: string;
  size: number;
  borderRadius: number;
  style: StyleProp<ViewStyle>;
}) {
  const y = useSharedValue(0);

  useEffect(() => {
    y.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
  }, [delayMs, y]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
  }));

  return (
    <Animated.View style={[style, floatStyle]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: size,
          height: size,
          borderRadius,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.95)",
          transform: [{ rotate: rotation }],
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 14,
          elevation: 8,
        }}
      >
        <MaterialIcons name={icon} size={Math.round(size * 0.48)} color={iconColor} />
      </LinearGradient>
    </Animated.View>
  );
}

function LoginFloatingDecor({ handleSignUp }: { handleSignUp: () => void }) {
  return (
    <View style={{ height: 75, marginTop: 12, width: "100%", position: "relative" }}>
      <FloatingDecorTile
        delayMs={0}
        rotation="-12deg"
        gradient={["#ede9fe", "#ddd6fe"]}
        icon="card-giftcard"
        iconColor={colors.primary}
        size={56}
        borderRadius={16}
        style={{ position: "absolute", left: 8, top: 10, zIndex: 1 }}
      />
      <FloatingDecorTile
        delayMs={1500}
        rotation="15deg"
        gradient={["#d1fae5", "#a7f3d0"]}
        icon="payments"
        iconColor={colors.secondary}
        size={56}
        borderRadius={16}
        style={{ position: "absolute", right: 8, top: 10, zIndex: 1 }}
      />
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: -6,
          alignItems: "center",
          zIndex: 2,
        }}
      >
     {/* Get Started — pill gradient, shimmer + press spring */}
     <Animated.View
          style={{
            paddingHorizontal: 24,
            marginBottom: 22,
            width: "70%",
            alignSelf: "center",
          }}
          entering={FadeInDown.duration(520).delay(260)}
        >
          <GetStartedCta onPress={handleSignUp} />
        </Animated.View>
      </View>
    </View>
  );
}

function GetStartedCta({ onPress }: { onPress: () => void }) {
  const { width: screenW } = useWindowDimensions();
  const measureRef = useRef<View>(null);
  const pressScale = useSharedValue(1);
  const shimmerPhase = useSharedValue(0);
  const buttonLeftInWindow = useSharedValue(0);
  const windowWidthSv = useSharedValue(screenW);

  const remeasure = useCallback(() => {
    measureRef.current?.measureInWindow((x, _y, _w, _h) => {
      buttonLeftInWindow.value = x;
    });
  }, [buttonLeftInWindow]);

  useEffect(() => {
    windowWidthSv.value = screenW;
  }, [screenW, windowWidthSv]);

  useEffect(() => {
    const id = requestAnimationFrame(() => remeasure());
    return () => cancelAnimationFrame(id);
  }, [screenW, remeasure]);

  useEffect(() => {
    shimmerPhase.value = withRepeat(
      withTiming(1, { duration: Math.min(9000, Math.max(3200, Math.round(screenW * 4.2))), easing: Easing.linear }),
      -1,
      false
    );
  }, [shimmerPhase, screenW]);

  const shellStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => {
    const startX = -buttonLeftInWindow.value;
    const endX = windowWidthSv.value - buttonLeftInWindow.value - GET_STARTED_SHIMMER_BAND_W;
    return {
      transform: [
        {
          translateX: interpolate(shimmerPhase.value, [0, 1], [startX, endX]),
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        shellStyle,
        {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 14 },
          shadowOpacity: 0.4,
          shadowRadius: 24,
          elevation: 14,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          pressScale.value = withSpring(0.96, { damping: 15, stiffness: 260 });
        }}
        onPressOut={() => {
          pressScale.value = withSpring(1, { damping: 14, stiffness: 200 });
        }}
        accessibilityRole="button"
        accessibilityLabel="Get started"
        android_ripple={{ color: "rgba(255,255,255,0.22)" }}
      >
        <View ref={measureRef} onLayout={remeasure} collapsable={false}>
          <LinearGradient
            colors={[colors.primary, colors.primaryContainer, "#9d74f2"]}
            locations={[0, 0.42, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 999,
              paddingVertical: 18,
              paddingHorizontal: 32,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.28)",
            }}
          >
          <View style={[StyleSheet.absoluteFillObject, { overflow: "hidden" }]} pointerEvents="none">
            <Animated.View
              style={[
                {
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  width: GET_STARTED_SHIMMER_BAND_W,
                },
                shimmerStyle,
              ]}
            >
              <LinearGradient
                colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.55)", "rgba(255,255,255,0)"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              zIndex: 2,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: colors.onPrimary,
                fontFamily: fontFamily.title,
                letterSpacing: 0.4,
              }}
            >
              Get Started
            </Text>
            {/* <Ionicons name="arrow-forward-circle" size={28} color={colors.onPrimary} /> */}
          </View>
        </LinearGradient>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function ControlCard({
  icon,
  label,
  description,
  color,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  label: string;
  description: string;
  color: string;
}) {
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: colors.surfaceContainerLowest,
          borderRadius: 14,
          padding: 16,
        },
        ambientShadow,
      ]}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: colors.surfaceContainerLow,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <Text style={[typography.bodyLg, { fontSize: 14, fontFamily: fontFamily.title, marginBottom: 4 }]}>
        {label}
      </Text>
      <Text style={[typography.bodyMd, { fontSize: 12, color: colors.muted, lineHeight: 16 }]}>
        {description}
      </Text>
    </View>
  );
}
