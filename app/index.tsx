import { Redirect } from "expo-router";
import { useAuthStore } from "@/src/utils/auth/store";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Linking } from "react-native";
import { routes } from "@/types/routes";

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
  const { isReady, auth, pendingChildToken, setPendingChildToken } = useAuthStore();
  const [canRedirect, setCanRedirect] = useState(false);
  const [childToken, setChildToken] = useState<string | null>(null);

  console.log('📍 Index: isReady =', isReady, ', auth =', auth);

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      const token = parseChildDeepLink(url);
      if (token) {
        setPendingChildToken(token);
        setChildToken(token);
      }
    });
  }, []);

  // Wait a moment before redirecting
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanRedirect(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (!canRedirect) {
    return null;
  }

  const tokenToUse = childToken || pendingChildToken;

  if (tokenToUse && auth) {
    setPendingChildToken(null);
    return <SafeAreaView><Redirect href={`/child?token=${encodeURIComponent(tokenToUse)}`} /></SafeAreaView>;
  }

  if (tokenToUse && !auth) {
    return <SafeAreaView><Redirect href={routes.auth.login} /></SafeAreaView>;
  }

  console.log('📍 Index: Redirecting...', auth ? 'to tabs' : 'to login');

  if (auth) {
    return <SafeAreaView><Redirect href={routes.tabs.home} /></SafeAreaView>;
  }

  return <SafeAreaView><Redirect href={routes.auth.login} /></SafeAreaView>;
}
