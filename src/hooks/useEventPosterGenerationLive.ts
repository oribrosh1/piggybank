import { useEffect, useState } from "react";
import {
  subscribeEventPosterGenerationProgress,
  type EventPosterGenerationSnapshot,
} from "@/src/lib/eventService";

/**
 * Live `posterUrl` / `skeletonPosterUrl` from Firestore while poster generation is in progress.
 * Enable only during an active generate call (`active === true`).
 */
export function useEventPosterGenerationLive(
  eventId: string | null,
  active: boolean,
): EventPosterGenerationSnapshot {
  const [snap, setSnap] = useState<EventPosterGenerationSnapshot>({
    posterUrl: null,
    skeletonPosterUrl: null,
    posterStreamingPreviewUrl: null,
    visualTeaser: null,
    skeletonProgress: null,
  });

  useEffect(() => {
    if (!eventId || !active) {
      setSnap({
        posterUrl: null,
        skeletonPosterUrl: null,
        posterStreamingPreviewUrl: null,
        visualTeaser: null,
        skeletonProgress: null,
      });
      return;
    }
    const unsub = subscribeEventPosterGenerationProgress(eventId, setSnap);
    return () => unsub();
  }, [eventId, active]);

  return snap;
}
