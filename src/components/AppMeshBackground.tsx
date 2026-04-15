/**
 * Port of `src/screens/LoginScreen/cards.html` decorative mesh (lines 213–241).
 * - float-ambient: 8s ease-in-out infinite (translateY, rotate) — CSS ease-in-out ≈ cubic-bezier(0.42,0,0.58,1)
 * - float-ambient-alt: 12s ease-in-out infinite (+ scale)
 * - float-rotate (kinetic): linear infinite; keyframes 0/33%/66%/100%
 *
 * Pseudo-blur: RN has no filter:blur — large blobs use radial-style LinearGradient + scaled inner canvas.
 * Layering: HTML “Background (Deep Blur)” (key 2) renders first; remaining shapes in order; center 80vw glow last.
 */

import { useEffect, useMemo } from "react";
import { useWindowDimensions, StyleSheet, View, Platform, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type AnimatedStyle,
} from "react-native-reanimated";
import { colors } from "@/src/theme";

/** HTML `bg-surface` / `background` — tailwind theme */
const SURFACE = colors.surface;

/** CSS `ease-in-out` ≈ cubic-bezier(0.42, 0, 0.58, 1) */
const EASE_IN_OUT = Easing.bezier(0.42, 0, 0.58, 1);

/** Theme (cards.html tailwind-config) */
const SECONDARY = "#006c49";
const TERTIARY = "#765700";
const SECONDARY_FIXED = "#6ffbbe";
const PRIMARY_CONTAINER = "#8455ef";

const PRIMARY_10 = "rgba(107, 56, 212, 0.1)";
const PRIMARY_15 = "rgba(107, 56, 212, 0.15)";
const TERTIARY_10 = "rgba(118, 87, 0, 0.1)";

/** Seeded phase 0–1 so instances don’t share t=0 */
function useAnimSeed() {
  return useMemo(() => Math.random(), []);
}

/** float-ambient — 8s ease-in-out infinite */
function useFloatAmbient(delayMs = 0) {
  const seed = useAnimSeed();
  const t = useSharedValue(0);
  useEffect(() => {
    const id = setTimeout(() => {
      t.value = withRepeat(
        withTiming(1, { duration: 8000, easing: EASE_IN_OUT }),
        -1,
        true
      );
    }, Math.max(0, delayMs));
    return () => clearTimeout(id);
  }, [delayMs, t]);
  return useAnimatedStyle(() => {
    const phase = (t.value + seed) % 1;
    return {
      transform: [
        { translateY: interpolate(phase, [0, 0.5, 1], [0, -20, 0]) },
        { rotate: `${interpolate(phase, [0, 0.5, 1], [0, 5, 0])}deg` },
      ],
    };
  });
}

/** float-ambient-alt — 12s ease-in-out infinite */
function useFloatAmbientAlt(delayMs = 0) {
  const seed = useAnimSeed();
  const t = useSharedValue(0);
  useEffect(() => {
    const id = setTimeout(() => {
      t.value = withRepeat(
        withTiming(1, { duration: 12000, easing: EASE_IN_OUT }),
        -1,
        true
      );
    }, Math.max(0, delayMs));
    return () => clearTimeout(id);
  }, [delayMs, t]);
  return useAnimatedStyle(() => {
    const phase = (t.value + seed) % 1;
    return {
      transform: [
        { translateY: interpolate(phase, [0, 0.5, 1], [0, 15, 0]) },
        { rotate: `${interpolate(phase, [0, 0.5, 1], [0, -8, 0])}deg` },
        { scale: interpolate(phase, [0, 0.5, 1], [1, 1.05, 1]) },
      ],
    };
  });
}

/** float-rotate — linear; random phase so not synced at 0° */
function useFloatRotate(durationMs: number, delayMs = 0) {
  const phase = useAnimSeed();
  const t = useSharedValue(0);
  useEffect(() => {
    const id = setTimeout(() => {
      t.value = withRepeat(
        withTiming(1, { duration: durationMs, easing: Easing.linear }),
        -1,
        false
      );
    }, Math.max(0, delayMs));
    return () => clearTimeout(id);
  }, [durationMs, delayMs, t]);
  return useAnimatedStyle(() => {
    const u = (t.value + phase) % 1;
    return {
      transform: [
        { translateX: interpolate(u, [0, 0.33, 0.66, 1], [0, 15, -10, 0]) },
        { translateY: interpolate(u, [0, 0.33, 0.66, 1], [0, -15, 10, 0]) },
        { rotate: `${interpolate(u, [0, 0.33, 0.66, 1], [0, 120, 240, 360])}deg` },
      ],
    };
  });
}

type ShapeKind = "sphere" | "abstract" | "cube" | "torus" | "pyramid" | "ringBorder";

type ShapeSpec = {
  key: string;
  motion: "float" | "floatSlow" | "kinetic";
  kineticDurationMs?: number;
  delayMs?: number;
  top?: ViewStyle["top"];
  bottom?: ViewStyle["bottom"];
  left?: ViewStyle["left"];
  right?: ViewStyle["right"];
  width: number;
  height: number;
  kind: ShapeKind;
  backgroundColor?: string;
  gradient?: { colors: [string, string]; start?: { x: number; y: number }; end?: { x: number; y: number } };
  gradientTransparentEnd?: boolean;
  opacity?: number;
  borderWidth?: number;
  borderColor?: string;
  rotateDeg?: number;
  scale?: number;
  /** Tailwind blur-* (px) — drives pseudo-soft gradient + scale, not box-shadow */
  blurPx?: number;
};

type MotionStyle = AnimatedStyle<ViewStyle>;

/** `.shape-abstract` — horizontal radii: 40% 60% 70% 30% of width (CSS first set) */
function abstractRadiusStyle(w: number): ViewStyle {
  return {
    borderTopLeftRadius: w * 0.4,
    borderTopRightRadius: w * 0.6,
    borderBottomRightRadius: w * 0.7,
    borderBottomLeftRadius: w * 0.3,
  };
}

/** Scale inner visual 2×–3× for large blur values; slot stays w×h */
function pseudoBlurScale(blurPx: number | undefined): number {
  if (blurPx == null || blurPx < 8) return 1;
  if (blurPx >= 80) return 2.8;
  if (blurPx >= 60) return 2.5;
  if (blurPx >= 40) return 2.2;
  if (blurPx >= 12) return 1.35;
  return 1.12;
}

/** Max peak alpha for large pseudo-blur blobs — airy “steam,” not solid disks */
const SOFT_PEAK_CAP = 0.08;

const GAUSSIAN_LOCATIONS: [number, number, number, number, number] = [0, 0.2, 0.5, 0.8, 1];

/** 5-stop Gaussian-style falloff — avoids hard “ring” at mid gradient */
function gaussianFiveStopsFromRgb(
  r: number,
  g: number,
  b: number,
  peakAlpha: number
): [string, string, string, string, string] {
  const peak = Math.min(peakAlpha, SOFT_PEAK_CAP);
  return [
    `rgba(${r},${g},${b},${peak})`,
    `rgba(${r},${g},${b},${peak * 0.45})`,
    `rgba(${r},${g},${b},${peak * 0.12})`,
    "rgba(0,0,0,0)",
    "rgba(0,0,0,0)",
  ];
}

function parseRgbFromHex(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace("#", "");
  if (h.length !== 6) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbaFromHex(hex: string, a: number): string {
  const c = parseRgbFromHex(hex);
  if (!c) return hex;
  return `rgba(${c.r},${c.g},${c.b},${a})`;
}

type PseudoSoftFill =
  | { mode: "solid-soft"; core: string; peakAlpha: number }
  | { mode: "gradient-soft"; c0: string; c1: string; peakMul: number }
  | null;

function pseudoFillForSpec(spec: ShapeSpec, blurPx: number | undefined): PseudoSoftFill {
  if (blurPx == null || blurPx < 8) return null;
  if (spec.kind !== "sphere" && spec.kind !== "abstract") return null;

  if (spec.gradient && !spec.gradientTransparentEnd) {
    return { mode: "gradient-soft", c0: spec.gradient.colors[0], c1: spec.gradient.colors[1], peakMul: spec.opacity ?? 1 };
  }
  if (spec.backgroundColor?.startsWith("rgba")) {
    const m = spec.backgroundColor.match(/rgba?\(([^)]+)\)/);
    if (m) {
      const parts = m[1].split(",").map((s) => s.trim());
      if (parts.length >= 4) {
        const r = Number(parts[0]);
        const g = Number(parts[1]);
        const b = Number(parts[2]);
        const a = Number(parts[3]);
        return { mode: "solid-soft", core: `${r},${g},${b}`, peakAlpha: Math.min(a, SOFT_PEAK_CAP) };
      }
    }
  }
  if (spec.backgroundColor && spec.backgroundColor.startsWith("#")) {
    const rgb = parseRgbFromHex(spec.backgroundColor);
    if (rgb) {
      return { mode: "solid-soft", core: `${rgb.r},${rgb.g},${rgb.b}`, peakAlpha: Math.min(0.05, SOFT_PEAK_CAP) };
    }
  }
  return null;
}

function MeshPseudoSoftLayer({
  spec,
  w,
  h,
  blurPx,
  borderRadiusStyle,
  motionStyle,
}: {
  spec: ShapeSpec;
  w: number;
  h: number;
  blurPx: number;
  borderRadiusStyle: ViewStyle;
  motionStyle: MotionStyle;
}) {
  const scale = pseudoBlurScale(blurPx);
  const fill = pseudoFillForSpec(spec, blurPx);
  if (!fill) return null;

  const gradColors: [string, string, string, string, string] =
    fill.mode === "solid-soft"
      ? (() => {
          const [r, g, b] = fill.core.split(",").map(Number);
          return gaussianFiveStopsFromRgb(r, g, b, fill.peakAlpha);
        })()
      : (() => {
          const rgb = parseRgbFromHex(fill.c0);
          if (!rgb) {
            return ["rgba(0,0,0,0)", "rgba(0,0,0,0)", "rgba(0,0,0,0)", "rgba(0,0,0,0)", "rgba(0,0,0,0)"];
          }
          const peak = Math.min(SOFT_PEAK_CAP, SOFT_PEAK_CAP * fill.peakMul);
          return gaussianFiveStopsFromRgb(rgb.r, rgb.g, rgb.b, peak);
        })();

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          width: w,
          height: h,
          justifyContent: "center",
          alignItems: "center",
          overflow: "visible",
        },
        motionStyle,
      ]}
    >
      <View
        pointerEvents="none"
        style={{
          width: w,
          height: h,
          transform: [{ scale }],
          ...borderRadiusStyle,
          overflow: "hidden",
        }}
      >
        <LinearGradient
          colors={gradColors}
          locations={GAUSSIAN_LOCATIONS}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </Animated.View>
  );
}

function MeshShapeBody({ spec, motionStyle }: { spec: ShapeSpec; motionStyle: MotionStyle }) {
  const w = spec.width;
  const h = spec.height;
  const blurPx = spec.blurPx;
  const usePseudo = blurPx != null && blurPx >= 8 && (spec.kind === "sphere" || spec.kind === "abstract");
  const softScale = usePseudo ? pseudoBlurScale(blurPx) : 1;
  const opacityMul = blurPx != null && blurPx >= 40 ? 1 - Math.min(blurPx, 120) * 0.0012 : 1;

  const base: ViewStyle = {
    position: "absolute",
    width: w,
    height: h,
    top: spec.top,
    bottom: spec.bottom,
    left: spec.left,
    right: spec.right,
    opacity: (spec.opacity ?? 1) * opacityMul,
  };

  const rot = spec.rotateDeg != null ? [{ rotate: `${spec.rotateDeg}deg` }] : [];
  const sc = spec.scale != null ? [{ scale: spec.scale }] : [];
  const staticTransform = [...rot, ...sc];

  const borderRadiusStyle = (): ViewStyle => {
    if (spec.kind === "sphere" || spec.kind === "torus") {
      return { borderRadius: w / 2 };
    }
    if (spec.kind === "cube") {
      return { borderRadius: w * 0.2 };
    }
    if (spec.kind === "abstract") {
      return abstractRadiusStyle(w);
    }
    return {};
  };

  const pyramidShadow = Platform.select<ViewStyle>({
    ios: {
      shadowColor: "rgba(0,0,0,0.1)",
      shadowOffset: { width: 10, height: 18 },
      shadowOpacity: 1,
      shadowRadius: 30,
    },
    android: { elevation: 14 },
    default: {},
  });

  const inner = () => {
    if (usePseudo && blurPx != null && pseudoFillForSpec(spec, blurPx)) {
      return (
        <MeshPseudoSoftLayer
          spec={spec}
          w={w}
          h={h}
          blurPx={blurPx}
          borderRadiusStyle={borderRadiusStyle()}
          motionStyle={motionStyle}
        />
      );
    }

    if (spec.kind === "torus") {
      return (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            motionStyle,
            {
              borderWidth: spec.borderWidth ?? 20,
              borderColor: spec.borderColor ?? "rgba(107, 56, 212, 0.15)",
              borderRadius: w / 2,
              backgroundColor: "transparent",
            },
          ]}
        />
      );
    }
    if (spec.kind === "pyramid") {
      const half = w * 0.5;
      const bh = h;
      const col = spec.borderColor ?? TERTIARY_10;
      return (
        <Animated.View
          pointerEvents="none"
          style={[motionStyle, { width: w, height: h, alignItems: "center" }]}
        >
          <View style={pyramidShadow} pointerEvents="none">
            <View
              pointerEvents="none"
              style={{
                width: 0,
                height: 0,
                borderLeftWidth: half,
                borderRightWidth: half,
                borderBottomWidth: bh,
                borderLeftColor: "transparent",
                borderRightColor: "transparent",
                borderBottomColor: col,
              }}
            />
          </View>
        </Animated.View>
      );
    }
    if (spec.kind === "ringBorder") {
      return (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            motionStyle,
            {
              borderRadius: w / 2,
              borderWidth: spec.borderWidth ?? 16,
              borderColor: spec.borderColor ?? "rgba(139, 92, 246, 0.1)",
              backgroundColor: "transparent",
            },
          ]}
        />
      );
    }
    if (spec.gradient) {
      const g = spec.gradient;
      const endColors: [string, string] = spec.gradientTransparentEnd
        ? [g.colors[0], "rgba(0,0,0,0)"]
        : g.colors;
      const innerScale = softScale > 1 ? softScale : 1;
      return (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            motionStyle,
            {
              overflow: "hidden",
              ...borderRadiusStyle(),
              justifyContent: "center",
              alignItems: "center",
            },
          ]}
        >
          <View
            pointerEvents="none"
            style={{
              width: w,
              height: h,
              transform: innerScale > 1 ? [{ scale: innerScale }] : undefined,
              ...borderRadiusStyle(),
              overflow: "hidden",
            }}
          >
            <LinearGradient
              colors={endColors}
              start={g.start ?? { x: 0, y: 0 }}
              end={g.end ?? { x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
        </Animated.View>
      );
    }
    return (
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          motionStyle,
          {
            backgroundColor: spec.backgroundColor ?? "transparent",
            ...borderRadiusStyle(),
            transform: softScale > 1 ? [{ scale: softScale }] : undefined,
          },
        ]}
      />
    );
  };

  return (
    <View
      pointerEvents="none"
      style={[base, staticTransform.length ? { transform: staticTransform } : undefined]}
    >
      <View pointerEvents="none" style={{ width: w, height: h, overflow: "visible" }}>
        {inner()}
      </View>
    </View>
  );
}

function MeshShapeFloat({ spec }: { spec: ShapeSpec }) {
  const motionStyle = useFloatAmbient(spec.delayMs ?? 0);
  return <MeshShapeBody spec={spec} motionStyle={motionStyle} />;
}

function MeshShapeFloatSlow({ spec }: { spec: ShapeSpec }) {
  const motionStyle = useFloatAmbientAlt(spec.delayMs ?? 0);
  return <MeshShapeBody spec={spec} motionStyle={motionStyle} />;
}

function MeshShapeKinetic({ spec }: { spec: ShapeSpec }) {
  const motionStyle = useFloatRotate(spec.kineticDurationMs ?? 20000, spec.delayMs ?? 0);
  return <MeshShapeBody spec={spec} motionStyle={motionStyle} />;
}

function MeshShapeDispatcher({ spec }: { spec: ShapeSpec }) {
  if (spec.motion === "float") {
    return <MeshShapeFloat spec={spec} />;
  }
  if (spec.motion === "floatSlow") {
    return <MeshShapeFloatSlow spec={spec} />;
  }
  return <MeshShapeKinetic spec={spec} />;
}

/** HTML lines 214–241 — px scaled from 390pt reference */
function buildShapes(vw: number): ShapeSpec[] {
  const s = vw / 390;
  const px = (n: number) => n * s;

  return [
    {
      key: "2",
      motion: "floatSlow",
      bottom: "10%",
      left: "10%",
      width: px(320),
      height: px(320),
      kind: "abstract",
      backgroundColor: rgbaFromHex(SECONDARY, 0.1),
      blurPx: 60,
    },
    {
      key: "3",
      motion: "float",
      top: "10%",
      right: px(-48),
      width: px(192),
      height: px(192),
      kind: "sphere",
      gradient: { colors: ["#8B5CF6", "#6d3bd7"], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
      opacity: 0.2,
      blurPx: 4,
    },
    {
      key: "4",
      motion: "floatSlow",
      top: "35%",
      left: px(-24),
      width: px(96),
      height: px(96),
      kind: "cube",
      gradient: { colors: ["#10B981", SECONDARY_FIXED], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
      opacity: 0.25,
      rotateDeg: 12,
    },
    {
      key: "5",
      motion: "kinetic",
      kineticDurationMs: 25000,
      top: "50%",
      left: "80%",
      width: px(128),
      height: px(128),
      kind: "torus",
      borderWidth: 12,
      borderColor: PRIMARY_15,
    },
    {
      key: "6",
      motion: "kinetic",
      bottom: "25%",
      right: "10%",
      width: px(100),
      height: px(100),
      kind: "pyramid",
      borderColor: TERTIARY_10,
      opacity: 1,
      rotateDeg: 25,
      scale: 0.6,
    },
    {
      key: "7",
      motion: "float",
      top: "5%",
      left: "5%",
      width: px(64),
      height: px(64),
      kind: "abstract",
      gradient: { colors: ["#FBBF24", TERTIARY], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
      opacity: 0.15,
    },
    {
      key: "8",
      motion: "float",
      bottom: "20%",
      left: px(-64),
      width: px(256),
      height: px(256),
      kind: "ringBorder",
      borderWidth: 16,
      borderColor: "rgba(139, 92, 246, 0.1)",
    },
    {
      key: "9",
      motion: "floatSlow",
      top: "55%",
      right: "2%",
      width: px(48),
      height: px(48),
      kind: "sphere",
      gradient: { colors: ["#FBBF24", "#f9bd22"], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
      opacity: 0.3,
    },
    {
      key: "10",
      motion: "floatSlow",
      bottom: "15%",
      right: px(-20),
      width: px(160),
      height: px(160),
      kind: "abstract",
      gradient: { colors: ["#10B981", "transparent"], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
      gradientTransparentEnd: true,
      opacity: 0.2,
      blurPx: 12,
    },
    {
      key: "11",
      motion: "float",
      top: "75%",
      left: "10%",
      width: px(32),
      height: px(32),
      kind: "cube",
      gradient: { colors: ["#8B5CF6", "#5516be"], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
      opacity: 0.2,
      rotateDeg: 45,
    },
    {
      key: "12",
      motion: "kinetic",
      kineticDurationMs: 15000,
      top: "20%",
      left: "25%",
      width: px(24),
      height: px(24),
      kind: "sphere",
      backgroundColor: "rgba(111, 251, 190, 0.4)",
      blurPx: 2,
    },
    {
      key: "13",
      motion: "kinetic",
      kineticDurationMs: 22000,
      top: "65%",
      right: "35%",
      width: px(56),
      height: px(56),
      kind: "cube",
      backgroundColor: rgbaFromHex(PRIMARY_CONTAINER, 0.2),
      rotateDeg: -15,
      blurPx: 1,
    },
    {
      key: "14",
      motion: "kinetic",
      bottom: "5%",
      left: "45%",
      width: px(80),
      height: px(80),
      kind: "torus",
      borderWidth: 6,
      borderColor: "rgba(251, 191, 36, 0.2)",
    },
    {
      key: "15",
      motion: "floatSlow",
      top: "45%",
      left: px(-20),
      width: px(100),
      height: px(100),
      kind: "pyramid",
      borderColor: PRIMARY_10,
      opacity: 1,
      rotateDeg: -45,
      scale: 0.4,
    },
    /*
     * >>> DEBUG / 2nd LIKELY CULPRIT — large violet blob (delete to test)
     * HTML: bg-[#8B5CF6]/5 + blur-[100px]. Same pseudo-soft scaling as key "1"; strong overlap
     * with center of the screen on many devices.
     */
    {
      key: "16",
      motion: "floatSlow",
      top: "40%",
      left: px(-80),
      width: px(256),
      height: px(256),
      kind: "sphere",
      backgroundColor: "rgba(139, 92, 246, 0.05)",
      blurPx: 100,
    },
    {
      key: "17",
      motion: "kinetic",
      kineticDurationMs: 18000,
      top: "15%",
      left: "40%",
      width: px(96),
      height: px(96),
      kind: "torus",
      borderWidth: 8,
      borderColor: "rgba(16, 185, 129, 0.2)",
    },
    {
      key: "18",
      motion: "float",
      bottom: "40%",
      right: "15%",
      width: px(40),
      height: px(40),
      kind: "cube",
      backgroundColor: "rgba(251, 191, 36, 0.3)",
      rotateDeg: 12,
      blurPx: 1,
    },
    {
      key: "19",
      motion: "floatSlow",
      top: "80%",
      right: "20%",
      width: px(224),
      height: px(224),
      kind: "abstract",
      backgroundColor: "rgba(139, 92, 246, 0.1)",
      blurPx: 40,
    },
    {
      key: "20",
      motion: "float",
      bottom: "5%",
      left: "5%",
      width: px(80),
      height: px(80),
      kind: "sphere",
      gradient: { colors: ["#10B981", "transparent"], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
      gradientTransparentEnd: true,
      opacity: 0.2,
    },
    {
      key: "21",
      motion: "kinetic",
      kineticDurationMs: 30000,
      top: "60%",
      left: "70%",
      width: px(64),
      height: px(64),
      kind: "torus",
      borderWidth: 4,
      borderColor: "rgba(139, 92, 246, 0.2)",
    },
    {
      key: "22",
      motion: "floatSlow",
      top: "12%",
      left: "15%",
      width: px(24),
      height: px(24),
      kind: "cube",
      backgroundColor: "rgba(251, 191, 36, 0.4)",
      rotateDeg: 30,
    },
  ];
}

const DEEP_BLUR_KEYS = new Set(["2"]);

/** HTML 241: 80vw × 80vw centered — light wash last; #10B981 @ 0.03 alpha, 4× scale, above mesh shapes */
function CenterGlowStatic() {
  const { width, height } = useWindowDimensions();
  const size = Math.min(width, height) * 0.8;
  const scale = 4;
  const teal = parseRgbFromHex("#10B981");
  const colors5: [string, string, string, string, string] = teal
    ? gaussianFiveStopsFromRgb(teal.r, teal.g, teal.b, 0.03)
    : ["rgba(0,0,0,0)", "rgba(0,0,0,0)", "rgba(0,0,0,0)", "rgba(0,0,0,0)", "rgba(0,0,0,0)"];

  return (
    <View pointerEvents="none" style={[styles.centerGlowSlot, { zIndex: 1 }]}>
      <View style={[styles.centerGlowInner, { width: size, height: size, borderRadius: size / 2 }]}>
        <View
          pointerEvents="none"
          style={{ width: size, height: size, transform: [{ scale }], borderRadius: size / 2, overflow: "hidden" }}
        >
          <LinearGradient
            colors={colors5}
            locations={GAUSSIAN_LOCATIONS}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      </View>
    </View>
  );
}

export function AppMeshBackground() {
  const { width } = useWindowDimensions();
  const shapes = buildShapes(width);
  const deep = shapes.filter((s) => DEEP_BLUR_KEYS.has(s.key));
  const rest = shapes.filter((s) => !DEEP_BLUR_KEYS.has(s.key));

  return (
    <View style={[StyleSheet.absoluteFill, styles.root]} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, styles.surfaceBase]} />

      <View style={styles.shapesLayer} pointerEvents="none">
        {deep.map((spec) => (
          <MeshShapeDispatcher key={spec.key} spec={spec} />
        ))}
        {rest.map((spec) => (
          <MeshShapeDispatcher key={spec.key} spec={spec} />
        ))}
      </View>

      <CenterGlowStatic />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    zIndex: 0,
    overflow: "hidden",
    ...Platform.select({
      android: { elevation: 0 },
    }),
  },
  surfaceBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SURFACE,
    zIndex: 0,
  },
  shapesLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  centerGlowSlot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  centerGlowInner: {
    overflow: "visible",
    justifyContent: "center",
    alignItems: "center",
  },
});
