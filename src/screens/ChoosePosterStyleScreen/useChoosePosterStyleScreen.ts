import { useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { routes } from "@/types/routes";
import type { PosterStyleChoice } from "@/types/events";

function resolveEventType(raw?: string): string {
  if (raw === "barMitzvah" || raw === "batMitzvah") return raw;
  return "birthday";
}

export function useChoosePosterStyleScreen() {
  const router = useRouter();
  const { eventType: eventTypeParam } = useLocalSearchParams<{
    eventType?: string;
  }>();
  const eventType = resolveEventType(eventTypeParam);

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  const choosePosterStyle = useCallback(
    (posterStyle: PosterStyleChoice) => {
      router.push({
        pathname: routes.createEvent.eventDetails,
        params: { eventType, posterStyle },
      });
    },
    [eventType, router],
  );

  return {
    eventType,
    goBack,
    chooseQuickPoster: () => choosePosterStyle("quick"),
    choosePremiumPoster: () => choosePosterStyle("premium"),
  };
}
