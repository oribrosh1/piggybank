import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectStorageEmulator, getStorage } from "firebase/storage";
import {
  getCloudApiBaseUrl,
  resolveEmulatorHost,
  useFirebaseEmulators,
} from "@/src/lib/backendConfig";
import { firebaseApp } from "./firebaseWeb";

declare global {
  // eslint-disable-next-line no-var
  var __creditkidEmulatorsConfigured: boolean | undefined;
  // eslint-disable-next-line no-var
  var __creditkidEmulatorsSkippedLogged: boolean | undefined;
}

function configureFirebaseEmulators(): void {
  if (!__DEV__) return;
  if (!useFirebaseEmulators()) {
    if (!globalThis.__creditkidEmulatorsSkippedLogged) {
      console.warn(
        "[dev] Firebase emulators off — use npm run start:dev and EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true",
      );
      globalThis.__creditkidEmulatorsSkippedLogged = true;
    }
    return;
  }
  if (globalThis.__creditkidEmulatorsConfigured) return;

  const host = resolveEmulatorHost();

  try {
    firestore().useEmulator(host, 8080);
    auth().useEmulator(`http://${host}:9099`);
  } catch (error) {
    console.warn("[dev] Native Firebase emulator connect failed:", error);
  }

  try {
    connectAuthEmulator(getAuth(firebaseApp), `http://${host}:9099`, {
      disableWarnings: true,
    });
    connectFirestoreEmulator(getFirestore(firebaseApp), host, 8080);
    connectStorageEmulator(getStorage(firebaseApp), host, 9199);
  } catch {
    // Fast refresh can call connect* twice.
  }

  globalThis.__creditkidEmulatorsConfigured = true;

  console.log("[dev] Firebase emulators", {
    host,
    api: getCloudApiBaseUrl(),
    storage: `http://${host}:9199`,
  });
}

configureFirebaseEmulators();
