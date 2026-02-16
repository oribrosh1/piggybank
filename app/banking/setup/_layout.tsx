import { Stack, Redirect } from "expo-router";
import { useAuth } from "@/src/utils/auth/useAuth";
import { routes } from "@/types/routes";

export default function SetupLayout() {
  const { isAuthenticated, isReady } = useAuth();

  // Show nothing while checking auth status
  if (!isReady) {
    return null;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect href={routes.auth.login} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="personal-info" />
      <Stack.Screen name="identity-verification" />
      <Stack.Screen name="success" />
    </Stack>
  );
}
