import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "@/src/utils/auth/store";
import { LoadingLogoLottie } from "@/src/components/LoadingLogoLottie";
import { BRANDED_LOTTIE_DISPLAY_MS } from "@/src/constants/loading";

const STORAGE_KEY = "@creditkid/first_launch_lottie_shown";

/**
 * On the very first app open (after auth is ready), shows a white full-screen overlay with the
 * CreditKid logo Lottie for {@link BRANDED_LOTTIE_DISPLAY_MS} before revealing the app. No-op on subsequent launches.
 */
export function FirstLaunchLottieOverlay() {
  const isReady = useAuthStore((s) => s.isReady);
  const [gate, setGate] = useState<"loading" | "intro" | "done">("loading");

  useEffect(() => {
    if (!isReady) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      try {
        const seen = await AsyncStorage.getItem(STORAGE_KEY);
        if (seen === "true") {
          setGate("done");
          return;
        }
        setGate("intro");
        timer = setTimeout(async () => {
          try {
            await AsyncStorage.setItem(STORAGE_KEY, "true");
          } catch {
            /* ignore */
          }
          setGate("done");
        }, BRANDED_LOTTIE_DISPLAY_MS);
      } catch {
        setGate("done");
      }
    })();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isReady]);

  if (!isReady || gate === "done") return null;

  return (
    <View
      pointerEvents="auto"
      style={[StyleSheet.absoluteFillObject, styles.overlay]}
    >
      <LoadingLogoLottie />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "#FFFFFF",
    zIndex: 99999,
    elevation: 99999,
    alignItems: "center",
    justifyContent: "center",
  },
});
