/**
 * CreditKid — "The Fluid Financialist" design system tokens.
 * No hard black (#000); surfaces use tonal layering instead of 1px borders.
 */

import type { TextStyle, ViewStyle } from "react-native";

export const colors = {
  /** Base canvas */
  surface: "#f8f9ff",
  /** Grouping minor items */
  surfaceContainerLow: "#eff4ff",
  /** Highest pop — main cards */
  surfaceContainerLowest: "#ffffff",
  /** Inset areas: search, code-like blocks */
  surfaceContainerHigh: "#dee9fc",
  /** Glass / frosted overlays (pair with BlurView) */
  surfaceVariant: "rgba(239, 244, 255, 0.6)",
  /** Gradient endpoints — primary CTA */
  primary: "#6b38d4",
  primaryContainer: "#8455ef",
  /** Text — never pure black */
  onSurface: "#121c2a",
  onSurfaceVariant: "#5c6470",
  /** Ghost border / outline (15% max in UI) */
  outlineVariant: "#cbc3d7",
  /** Secondary button label on surface_container_high */
  onPrimaryFixedVariant: "#4a3d6a",
  /** Growth / positive chip */
  secondary: "#047857",
  secondaryContainer: "#6cf8bb",
  /** Primary on white */
  onPrimary: "#ffffff",
  /** Muted chrome */
  muted: "#9ca3af",
} as const;

/** 15% opacity outline_variant — use when accessibility requires an edge */
export const borderGhostOutline: ViewStyle = {
  borderWidth: 1,
  borderColor: "rgba(203, 195, 215, 0.15)",
};

/** Focus ring: primary @ 30% + subtle lift */
export const inputFocusRing: ViewStyle = {
  borderWidth: 2,
  borderColor: "rgba(107, 56, 212, 0.3)",
  shadowColor: colors.primary,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.12,
  shadowRadius: 4,
  elevation: 2,
};

/** Ambient float shadow — tinted on_surface, never pure black */
export const ambientShadow: ViewStyle = {
  shadowColor: colors.onSurface,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 32,
  elevation: 12,
};

/** Growth chip — secondary_container + glow */
export const growthChipShadow: ViewStyle = {
  shadowColor: colors.secondary,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
};

/**
 * Glass cards — match `src/screens/LoginScreen/cards.html`
 * (.glass-card / .glass-card-dark; backdrop blur approximated via expo-blur on iOS).
 */
export const glassCardFill = "rgba(255, 255, 255, 0.7)";
export const glassCardBorder = "rgba(255, 255, 255, 0.4)";
/** CSS blur(12px) → expo-blur intensity (approximate) */
export const glassCardBlurIntensity = 38;

export const glassCardFillDark = "rgba(239, 244, 255, 0.6)";
export const glassCardBorderDark = "rgba(255, 255, 255, 0.3)";
/** CSS blur(16px) */
export const glassCardBlurIntensityDark = 52;

/** Locked cards: `border-white/40` on top of glass-card-dark */
export const glassCardBorderLocked = "rgba(255, 255, 255, 0.4)";

/** @deprecated Use `glassCardBorder` — kept for older imports */
export const glassCardBorderColor = glassCardBorder;

/**
 * `src/screens/LoginScreen/cards.html` — `.animate-slide-up` + `.stagger-*`
 * slideUpFade: 0.8s cubic-bezier(0.22, 1, 0.36, 1)
 */
export const cardsHtmlSlideUpMs = 800;
export const cardsHtmlSlideUpBezier = [0.22, 1, 0.36, 1] as const;
export const cardsHtmlStagger1Ms = 100;
export const cardsHtmlStagger2Ms = 250;
export const cardsHtmlStagger3Ms = 400;
/** `.animate-glow-pulse` — card-glow keyframes */
export const cardsHtmlCardGlowPulseMs = 4000;
/** `.animate-reveal-check` */
export const cardsHtmlRevealCheckDelayMs = 1200;
export const cardsHtmlRevealCheckDurationMs = 600;

/** Soft white halo hugging the rounded edge (outer wrapper; do not clip overflow) */
export const glassCardOuterGlow: ViewStyle = {
  shadowColor: "rgba(255, 255, 255, 0.98)",
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.58,
  shadowRadius: 8,
  /** Helps white rim read on Android (iOS ignores elevation) */
  elevation: 4,
};

/** Lift + separation from mesh (inner shell with border) */
export const glassCardDepthShadow: ViewStyle = {
  shadowColor: "rgba(18, 28, 42, 0.28)",
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.38,
  shadowRadius: 26,
  elevation: 12,
};

/** 4px = 1rem base; spec uses rem — mapped to logical px for RN */
export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

/** Minimum corner radius — nothing sharper than sm */
export const radius = {
  sm: 8,
  md: 24,
  lg: 32,
  full: 9999,
} as const;

/** Primary CTA gradient — 135° */
export const primaryGradient = {
  colors: [colors.primary, colors.primaryContainer] as [string, string],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
};

/** Tonal section fade (optional section boundaries) */
export const surfaceFadeGradient = {
  colors: [colors.surfaceContainerLow, colors.surface] as [string, string],
  start: { x: 0, y: 0 },
  end: { x: 0, y: 1 },
};

export const fontFamily = {
  display: "PlusJakartaSans_800ExtraBold",
  headline: "PlusJakartaSans_700Bold",
  title: "Inter_600SemiBold",
  body: "Inter_400Regular",
  label: "Inter_500Medium",
} as const;

/** Typography scale — sizes in px (rem approx at 16px root) */
export const typography = {
  displayLg: {
    fontFamily: fontFamily.display,
    fontSize: 56,
    lineHeight: 60,
    color: colors.onSurface,
  },
  headlineLg: {
    fontFamily: fontFamily.headline,
    fontSize: 32,
    lineHeight: 38,
    color: colors.onSurface,
  },
  headlineSm: {
    fontFamily: fontFamily.headline,
    fontSize: 16,
    lineHeight: 22,
  },
  titleLg: {
    fontFamily: fontFamily.title,
    fontSize: 22,
    lineHeight: 28,
    color: colors.onSurface,
  },
  bodyLg: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.onSurface,
  },
  bodyMd: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.onSurface,
  },
  labelMd: {
    fontFamily: fontFamily.label,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.8,
    color: colors.onSurfaceVariant,
    textTransform: "uppercase" as TextStyle["textTransform"],
  },
} as const;

export type Colors = typeof colors;
