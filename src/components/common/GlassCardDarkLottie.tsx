import type { ReactNode } from "react";
import { View, StyleSheet, Platform, type StyleProp, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { radius, spacing } from "@/src/theme";

/**
 * Lighter glass than {@link GlassCardDark}: lower tint alpha so mesh / backgrounds read through
 * behind Lottie and other full-bleed media (`GlassCardDark` uses 0.6 / 0.8).
 */
export const GLASS_CARD_DARK_LOTTIE_FILL_IOS = "rgba(239, 244, 255, 0.32)";
export const GLASS_CARD_DARK_LOTTIE_FILL_ANDROID = "rgba(239, 244, 255, 0.52)";
/** Slightly softer than `GLASS_CARD_DARK_BORDER_DEFAULT` so the shell feels airier */
export const GLASS_CARD_DARK_LOTTIE_BORDER_DEFAULT = "rgba(255, 255, 255, 0.22)";

const BLUR_INTENSITY = 1;

export type GlassCardDarkLottieProps = {
  children: ReactNode;
  /** Merged onto outer shadow wrapper (e.g. `marginBottom`, `flex`) */
  style?: StyleProp<ViewStyle>;
  /** Inner content: padding + blur tint layer */
  contentStyle?: StyleProp<ViewStyle>;
  padding?: number;
  borderRadius?: number;
  borderColor?: string;
  /**
   * Glass shell clip. Default `hidden` (rounded mask). Use `visible` when a child
   * (e.g. a rotated thumb) must paint past the card bounds without being cut off.
   */
  shellOverflow?: "hidden" | "visible";
};

/**
 * Glass shell for Lottie heroes: same structure as `GlassCardDark`, but more transparent fill and
 * a touch less blur so animation and `AppMeshBackground` stay visible.
 */
export function GlassCardDarkLottie({
  children,
  style,
  contentStyle,
  padding = spacing[3],
  borderRadius = radius.md,
  borderColor = GLASS_CARD_DARK_LOTTIE_BORDER_DEFAULT,
  shellOverflow = "hidden",
}: GlassCardDarkLottieProps) {
  const shellStyle: ViewStyle = {
    borderRadius,
    overflow: shellOverflow,
    borderWidth: 1,
    borderColor,
  };

  const innerBase: ViewStyle = {
    padding,
    position: "relative",
    backgroundColor:
      Platform.OS === "ios" ? GLASS_CARD_DARK_LOTTIE_FILL_IOS : GLASS_CARD_DARK_LOTTIE_FILL_ANDROID,
    ...(shellOverflow === "visible" ? { overflow: "visible" as const } : {}),
  };

  return (
    <View style={[styles.outer, { borderRadius }, style]}>
      <View style={shellStyle}>
        {Platform.OS === "ios" ? (
          <BlurView intensity={BLUR_INTENSITY} tint="light" style={[innerBase, contentStyle]}>
            {children}
          </BlurView>
        ) : (
          <View style={[innerBase, contentStyle]}>{children}</View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignSelf: "stretch",
    shadowColor: "#0c1c2a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 28,
    ...Platform.select({
      android: { elevation: 5 },
    }),
  },
});
