import { getApp } from "@react-native-firebase/app";

const DEBUG_TOKEN = process.env.EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN;

/**
 * Test / staging: skip App Check entirely (no token, no native init) — aligns with
 * Cloud Functions relaxing App Check when Stripe is in test mode.
 * Set EXPO_PUBLIC_STRIPE_TEST_MODE=true or EXPO_PUBLIC_SKIP_APP_CHECK=true.
 */
export const isAppCheckSkippedForTest =
  process.env.EXPO_PUBLIC_SKIP_APP_CHECK === "true" ||
  process.env.EXPO_PUBLIC_STRIPE_TEST_MODE === "true";

/**
 * App Check is off in __DEV__ so dev clients without the native module linked
 * do not crash. Set EXPO_PUBLIC_APP_CHECK_IN_DEV=true when using a dev build
 * with @react-native-firebase/app-check and a Firebase debug token.
 * Disabled when {@link isAppCheckSkippedForTest} is true.
 */
export const isAppCheckEnabled =
  !isAppCheckSkippedForTest &&
  (process.env.EXPO_PUBLIC_APP_CHECK_IN_DEV === "true" || !__DEV__);

type AppCheckModule =
  import("@react-native-firebase/app-check").FirebaseAppCheckTypes.Module;

function createAppCheckReady(): Promise<AppCheckModule | null> {
  if (!isAppCheckEnabled) {
    return Promise.resolve(null);
  }

  const {
    initializeAppCheck,
    ReactNativeFirebaseAppCheckProvider,
  } = require("@react-native-firebase/app-check") as typeof import("@react-native-firebase/app-check");

  const provider = new ReactNativeFirebaseAppCheckProvider();
  provider.configure({
    android: {
      provider: __DEV__ ? "debug" : "playIntegrity",
      debugToken: DEBUG_TOKEN,
    },
    apple: {
      provider: __DEV__ ? "debug" : "appAttestWithDeviceCheckFallback",
      debugToken: DEBUG_TOKEN,
    },
    web: {
      provider: "reCaptchaV3",
      siteKey: "unused",
    },
  });

  return initializeAppCheck(getApp(), {
    provider,
    isTokenAutoRefreshEnabled: true,
  });
}

export const appCheckReady = createAppCheckReady();
