import { useAuth } from "../src/utils/auth/useAuth";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      // cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const { initiate, isReady } = useAuth();

  console.log('🎨 RootLayout: isReady =', isReady);

  useEffect(() => {
    console.log('🎨 RootLayout: Calling initiate()');
    const unsubscribe = initiate();

    // Safety timeout: If auth doesn't become ready in 3 seconds, force it
    const timeoutId = setTimeout(() => {
      console.log('⚠️ RootLayout: Auth timeout - forcing isReady to true');
      // Import useAuthStore to force update (don't call useAuth hook here!)
      const { useAuthStore } = require('../src/utils/auth/store');
      const currentState = useAuthStore.getState();
      if (!currentState.isReady) {
        useAuthStore.setState({ isReady: true, auth: null });
      }
    }, 3000);

    // Cleanup auth listener on unmount
    return () => {
      clearTimeout(timeoutId);
      if (unsubscribe && typeof unsubscribe === 'function') {
        console.log('🎨 RootLayout: Cleaning up auth listener');
        unsubscribe();
      }
    };
  }, [initiate]);

  useEffect(() => {
    // Always hide splash screen after a short delay, don't wait for auth
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
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
