import Constants, { ExecutionEnvironment } from "expo-constants";
import LottieView from "lottie-react-native";
import { useEffect, useMemo } from "react";
import {
  Image,
  ImageStyle,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { colors, typography, fontFamily, spacing, radius, borderGhostOutline } from "@/src/theme";

/**
 * JSON Lottie — requires a dev build that includes `lottie-react-native` (run `npx expo run:ios`
 * / `run:android` after install). Expo Go cannot load native Lottie; we fall back to GIF there.
 */
const LOADING_LOGO = require("../../assets/lotties/creditkid-lottiejson.json");
const GIF_FALLBACK = require("../../assets/gifs/loading-creditkid-logo.gif");

type Props = {
  style?: StyleProp<ViewStyle>;
  /** Default width/height of the animation (square). */
  size?: number;
  /** Title, subtitle, and footer around the animation (default true). */
  showBranding?: boolean;
};

function canUseNativeLottie(): boolean {
  if (Platform.OS === "web") return false;
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return false;
  }
  return true;
}

/** Log once per mount — grep Metro / Xcode console for `[LoadingLogoLottie]`. */
function logLoadingLogoDiagnostics(useNative: boolean) {
  if (!__DEV__) return;

  const env = Constants.executionEnvironment;
  const payload = {
    platform: Platform.OS,
    executionEnvironment: env,
    isExpoGo: env === ExecutionEnvironment.StoreClient,
    expoVersion: Constants.expoVersion,
    canUseNativeLottie: useNative,
    renderBranch: useNative ? "LottieView (native)" : "Image GIF fallback",
  };

  console.log("[LoadingLogoLottie] diagnostics", payload);

  if (useNative) {
    console.warn(
      "[LoadingLogoLottie] Using LottieView — requires native lottie-react-native in this binary. " +
        "If you see Unimplemented component: LottieAnimationView, rebuild with `npx expo run:ios` " +
        "(simulator; no signing) or fix code signing for device; Expo Go cannot load this."
    );
  } else {
    console.log(
      "[LoadingLogoLottie] Skipping native Lottie (Expo Go / web). GIF fallback is expected."
    );
  }
}

export function LoadingLogoLottie({
  style,
  size = 400,
  showBranding = true,
}: Props) {
  const flat = StyleSheet.flatten([{ width: size, height: size }, style]);
  const useNative = useMemo(() => canUseNativeLottie(), []);

  useEffect(() => {
    logLoadingLogoDiagnostics(useNative);
  }, [useNative]);

  const animation = !useNative ? (
    <Image
      source={GIF_FALLBACK}
      style={flat as StyleProp<ImageStyle>}
      resizeMode="contain"
    />
  ) : (
    <LottieView source={LOADING_LOGO} style={flat} autoPlay loop />
  );

  if (!showBranding) {
    return animation;
  }

  return (
    <View style={styles.brandBlock}>
      <View style={styles.topSection}>
        <Text style={styles.title}>CreditKid</Text>
        <View style={{}}>
          <Text style={styles.subtitle}> gifts they will love, not gift cards
            in the drawer.
          </Text>
        </View>
      </View>

      <View style={styles.divider} accessibilityRole="none" />

      <View style={styles.lottieWrap}>{animation}</View>

      <View style={styles.footerRow}>
        <View style={styles.footerDot} />
        <Text style={styles.footer}>Preparing your experience</Text>
        <View style={styles.footerDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brandBlock: {
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    maxWidth: 400,
    width: "100%",
  },
  topSection: {
    alignItems: "center",
    width: "100%",
    marginBottom: spacing[2],
  },
  eyebrow: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    marginBottom: spacing[2],
    letterSpacing: 1,
  },
  title: {
    fontFamily: fontFamily.display,
    fontSize: 34,
    lineHeight: 40,
    color: colors.primary,
    textAlign: "center",
    letterSpacing: -1,
    marginBottom: spacing[4],
  },
  subtitleCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderRadius: radius.md,
    ...borderGhostOutline,
  },
  subtitle: {
    fontFamily: fontFamily.body,
    fontSize: 15,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 23,
  },
  divider: {
    width: 48,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(107, 56, 212, 0.2)",
    marginTop: spacing[2],
    marginBottom: spacing[3],
  },
  lottieWrap: {
    marginVertical: spacing[2],
    alignItems: "center",
    justifyContent: "center",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
    marginTop: spacing[4],
    paddingHorizontal: spacing[2],
  },
  footerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outlineVariant,
    opacity: 0.6,
  },
  footer: {
    fontFamily: fontFamily.label,
    fontSize: 18,
    letterSpacing: 0.4,
    color: colors.muted,
  },
});
