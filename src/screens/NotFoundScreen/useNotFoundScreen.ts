import { useCallback } from "react";
import { useRouter, useGlobalSearchParams } from "expo-router";
import { routes } from "@/types/routes";

export interface RouteOption {
  name: string;
  path: string;
}

const AVAILABLE_ROUTES: RouteOption[] = [
  { name: "Credit", path: routes.tabs.banking },
  { name: "Create Event", path: routes.tabs.createEvent },
  { name: "Events", path: routes.tabs.myEvents },
  { name: "Profile", path: routes.tabs.profile },
  { name: "Login", path: routes.auth.login },
];

export function useNotFoundScreen() {
  const router = useRouter();
  const params = useGlobalSearchParams();
  const missingPath = (params["not-found"] as string[])?.[0] ?? "";

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(routes.tabs.home);
    }
  }, [router]);

  const handleNavigate = useCallback(
    (url: string) => {
      try {
        if (url) {
          router.push(url as Parameters<typeof router.push>[0]);
        }
      } catch (error: unknown) {
        console.error("Navigation error:", error);
      }
    },
    [router]
  );

  const handleCreatePage = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      window.parent &&
      window.parent !== window
    ) {
      window.parent.postMessage(
        {
          type: "sandbox:web:create",
          path: missingPath,
          view: "mobile",
        },
        "*"
      );
    }
  }, [missingPath]);

  const showCreatePage =
    typeof window !== "undefined" &&
    window.parent &&
    window.parent !== window;

  return {
    missingPath,
    availableRoutes: AVAILABLE_ROUTES,
    handleBack,
    handleNavigate,
    handleCreatePage,
    showCreatePage,
  };
}
