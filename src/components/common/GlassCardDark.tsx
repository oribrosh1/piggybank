import type { ReactNode } from "react";
import { View, StyleSheet, Platform, type StyleProp, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { radius, spacing } from "@/src/theme";

/** `.glass-card-dark` — cards.html `background: rgba(239, 244, 255, 0.6); backdrop-filter: blur(16px)` */
export const GLASS_CARD_DARK_FILL_IOS = "rgba(239, 244, 255, 0.6)";
export const GLASS_CARD_DARK_FILL_ANDROID = "rgba(239, 244, 255, 0.8)";
export const GLASS_CARD_DARK_BORDER_DEFAULT = "rgba(255, 255, 255, 0.3)";

const BLUR_INTENSITY = 16;

export type GlassCardDarkProps = {
  children: ReactNode;
  /** Merged onto outer shadow wrapper (e.g. `marginBottom`, `flex`) */
  style?: StyleProp<ViewStyle>;
  /** Inner content: padding + blur tint layer */
  contentStyle?: StyleProp<ViewStyle>;
  padding?: number;
  borderRadius?: number;
  /** Default: white 30% — use `glassCardBorderLocked` from theme for locked tiles (`border-white/40`) */
  borderColor?: string;
};

/**
 * Shared glassmorphism shell: soft diffuse shadow, 1px light border, iOS `BlurView` + tinted fill,
 * Android translucent fill (no native blur).
 */
export function GlassCardDark({
  children,
  style,
  contentStyle,
  padding = spacing[3],
  borderRadius = radius.md,
  borderColor = GLASS_CARD_DARK_BORDER_DEFAULT,
}: GlassCardDarkProps) {
  const shellStyle: ViewStyle = {
    borderRadius,
    overflow: "hidden",
    borderWidth: 1,
    borderColor,
  };

  const innerBase: ViewStyle = {
    padding,
    position: "relative",
    backgroundColor: Platform.OS === "ios" ? GLASS_CARD_DARK_FILL_IOS : GLASS_CARD_DARK_FILL_ANDROID,
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
    shadowOpacity: 0.08,
    shadowRadius: 32,
    ...Platform.select({
      android: { elevation: 6 },
    }),
  },
});
