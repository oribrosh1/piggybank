import { Redirect } from "expo-router";
import { useAuthStore } from "../src/utils/auth/store";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Linking } from "react-native";
import { routes } from "../types/routes";

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

export default function Index() {
  const { isReady, auth } = useAuthStore();
  const [canRedirect, setCanRedirect] = useState(false);
  const [childToken, setChildToken] = useState<string | null>(null);

  console.log('📍 Index: isReady =', isReady, ', auth =', auth);

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      const token = parseChildDeepLink(url);
      if (token) setChildToken(token);
    });
  }, []);

  // Wait a moment before redirecting
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanRedirect(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Don't render anything until we can redirect
  if (!canRedirect) {
    return null;
  }

  // Child invite link: send to child screen (claim + dashboard)
  if (childToken) {
    return <SafeAreaView><Redirect href={`/child?token=${encodeURIComponent(childToken)}`} /></SafeAreaView>;
  }

  // Redirect based on auth status
  console.log('📍 Index: Redirecting...', auth ? 'to tabs' : 'to login');

  if (auth) {
    return <SafeAreaView><Redirect href={routes.tabs.home} /></SafeAreaView>;
  }

  return <SafeAreaView><Redirect href={routes.auth.login} /></SafeAreaView>;
}
