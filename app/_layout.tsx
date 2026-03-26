import "@/src/firebase/appCheck";
import { useAuth } from "@/src/utils/auth/useAuth";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";
import { Linking } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/src/utils/auth/store";
import { FirstLaunchLottieOverlay } from "@/src/components/FirstLaunchLottieOverlay";
import { LoadingLogoLottie } from "@/src/components/LoadingLogoLottie";
import { BRANDED_LOTTIE_DISPLAY_MS } from "@/src/constants/loading";
import { View, StyleSheet } from "react-native";

SplashScreen.preventAutoHideAsync();

function parseChildDeepLink(url: string | null): string | null {
  if (!url) return null;
  try {
    if (url.includes("/child") || url.includes("creditkidapp://child")) {
      const parsed = new URL(url.replace("creditkidapp://", "https://dummy/"));
      return parsed.searchParams.get("token");
    }
  } catch (_) {}
  return null;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const { initiate, isReady } = useAuth();
  const router = useRouter();
  const prevAuth = useRef<any>(null);
  const [minBootstrapLottieDone, setMinBootstrapLottieDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinBootstrapLottieDone(true), BRANDED_LOTTIE_DISPLAY_MS);
    return () => clearTimeout(t);
  }, []);

  console.log('🎨 RootLayout: isReady =', isReady);

  useEffect(() => {
    console.log('🎨 RootLayout: Calling initiate()');
    const unsubscribe = initiate();

    const timeoutId = setTimeout(() => {
      console.log('⚠️ RootLayout: Auth timeout - forcing isReady to true');
      const { useAuthStore } = require('../src/utils/auth/store');
      const currentState = useAuthStore.getState();
      if (!currentState.isReady) {
        useAuthStore.setState({ isReady: true, auth: null });
      }
    }, 3000);

    return () => {
      clearTimeout(timeoutId);
      if (unsubscribe && typeof unsubscribe === 'function') {
        console.log('🎨 RootLayout: Cleaning up auth listener');
        unsubscribe();
      }
    };
  }, [initiate]);

  // Handle deep links arriving while the app is in the foreground
  useEffect(() => {
    const subscription = Linking.addEventListener("url", ({ url }) => {
      const token = parseChildDeepLink(url);
      if (!token) return;

      const { auth } = useAuthStore.getState();
      if (auth) {
        router.replace(`/child?token=${encodeURIComponent(token)}` as any);
      } else {
        useAuthStore.getState().setPendingChildToken(token);
      }
    });
    return () => subscription.remove();
  }, [router]);

  // After login/signup, redirect to /child if a pending token is waiting
  const auth = useAuthStore((s) => s.auth);
  const pendingChildToken = useAuthStore((s) => s.pendingChildToken);

  useEffect(() => {
    const justLoggedIn = auth && !prevAuth.current;
    prevAuth.current = auth;

    if (justLoggedIn && pendingChildToken) {
      const token = pendingChildToken;
      useAuthStore.getState().setPendingChildToken(null);
      router.replace(`/child?token=${encodeURIComponent(token)}` as any);
    }
  }, [auth, pendingChildToken, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('🎨 RootLayout: Hiding splash screen');
      SplashScreen.hideAsync();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  console.log('🎨 RootLayout: Rendering Stack');

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Expo Router auto-discovers routes from file system */}
        </Stack>
        {(!isReady || !minBootstrapLottieDone) && (
          <View style={styles.authLoadingOverlay} pointerEvents="auto">
            <LoadingLogoLottie />
          </View>
        )}
        <FirstLaunchLottieOverlay />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  authLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99998,
    elevation: 99998,
  },
});
