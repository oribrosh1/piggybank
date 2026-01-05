import { Redirect } from "expo-router";
import { useAuthStore } from "../src/utils/auth/store";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { routes } from "../types/routes";

export default function Index() {
  const { isReady, auth } = useAuthStore();
  const [canRedirect, setCanRedirect] = useState(false);

  console.log('📍 Index: isReady =', isReady, ', auth =', auth);

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

  // Redirect based on auth status
  console.log('📍 Index: Redirecting...', auth ? 'to tabs' : 'to login');

  if (auth) {
    return <SafeAreaView><Redirect href={routes.tabs.home} /></SafeAreaView>;
  }

  return <SafeAreaView><Redirect href={routes.auth.login} /></SafeAreaView>;
}
