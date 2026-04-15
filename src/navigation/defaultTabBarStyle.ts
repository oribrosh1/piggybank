import { Platform, type ViewStyle } from "react-native";
import { colors, radius } from "@/src/theme";

/** Shared with `app/(tabs)/_layout.tsx` — restore when leaving full-screen loading on a tab */
export const defaultTabBarStyle: ViewStyle = {
  position: "absolute",
  backgroundColor: colors.surfaceContainerLowest,
  borderTopWidth: 1,
  borderTopColor: "rgba(203, 195, 215, 0.2)",
  height: Platform.OS === "ios" ? 90 : 70,
  paddingBottom: Platform.OS === "ios" ? 20 : 8,
  paddingTop: 8,
  borderTopLeftRadius: radius.md,
  borderTopRightRadius: radius.md,
  ...Platform.select({
    ios: {
      shadowColor: colors.onSurface,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
    },
    android: {
      elevation: 12,
    },
  }),
};

/** Hide bottom tabs (e.g. home bootstrap loading — full white screen) */
export const hiddenTabBarStyle: ViewStyle = {
  height: 0,
  overflow: "hidden",
  borderTopWidth: 0,
  opacity: 0,
};
