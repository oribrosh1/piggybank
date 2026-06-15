import Constants from "expo-constants";
import { Platform } from "react-native";

const PROD_API_BASE =
  "https://us-central1-piggybank-a0011.cloudfunctions.net/api";
const FIREBASE_PROJECT_ID = "piggybank-a0011";

function readEnv(key: string): string | undefined {
  const fromProcess = process.env[key];
  if (fromProcess) return fromProcess;
  const extra = Constants.expoConfig?.extra as
    | Record<string, string | undefined>
    | undefined;
  return extra?.[key];
}

/** True when `.env.dev` (or extra) enables local Firebase emulators in a dev build. */
export function useFirebaseEmulators(): boolean {
  return readEnv("EXPO_PUBLIC_USE_FIREBASE_EMULATORS") === "true" && __DEV__;
}

/**
 * Host for Auth / Firestore / Functions emulators.
 * Physical devices must use the Mac LAN IP from Metro (`hostUri`), not 127.0.0.1.
 */
export function resolveEmulatorHost(): string {
  const configured = readEnv("EXPO_PUBLIC_FIREBASE_EMULATOR_HOST");
  const metroHost = Constants.expoConfig?.hostUri?.split(":")[0];

  if (Platform.OS === "android") {
    if (
      configured &&
      configured !== "127.0.0.1" &&
      configured !== "localhost"
    ) {
      return configured;
    }
    return "10.0.2.2";
  }

  if (
    metroHost &&
    metroHost !== "localhost" &&
    metroHost !== "127.0.0.1"
  ) {
    return metroHost;
  }
  if (configured) return configured;
  return "127.0.0.1";
}

/** Cloud Functions HTTP base URL (local emulator or production). */
export function getCloudApiBaseUrl(): string {
  const envUrl = readEnv("EXPO_PUBLIC_API_BASE_URL");

  if (!useFirebaseEmulators()) {
    return envUrl || PROD_API_BASE;
  }

  const host = resolveEmulatorHost();

  if (envUrl?.includes("cloudfunctions.net")) {
    return envUrl;
  }

  if (envUrl) {
    return envUrl
      .replace("127.0.0.1", host)
      .replace("localhost", host);
  }

  return `http://${host}:5101/${FIREBASE_PROJECT_ID}/us-central1/api`;
}
