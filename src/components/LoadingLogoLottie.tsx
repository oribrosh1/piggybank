import Constants, { ExecutionEnvironment } from "expo-constants";
import LottieView from "lottie-react-native";
import { useEffect, useMemo } from "react";
import {
  Image,
  ImageStyle,
  Platform,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";

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
};

function canUseNativeLottie(): boolean {
  if (Platform.OS === "web") return false;
  // Expo Go (Store Client) does not ship custom native modules like lottie-react-native.
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

export function LoadingLogoLottie({ style, size = 400 }: Props) {
  const flat = StyleSheet.flatten([{ width: size, height: size }, style]);
  const useNative = useMemo(() => canUseNativeLottie(), []);

  useEffect(() => {
    logLoadingLogoDiagnostics(useNative);
  }, [useNative]);

  if (!useNative) {
    return (
      <Image
        source={GIF_FALLBACK}
        style={flat as StyleProp<ImageStyle>}
        resizeMode="contain"
      />
    );
  }

  return <LottieView source={LOADING_LOGO} style={flat} autoPlay loop />;
}
