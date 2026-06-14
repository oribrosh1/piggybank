import { Alert } from "react-native";
import {
  createEvent,
  updateEvent,
  generateEventPoster,
  subscribeEventPosterGenerationProgress,
  type EventPosterGenerationSnapshot,
} from "@/src/lib/eventService";
import { uploadHonoreePhotoToEvent } from "@/src/lib/honoreePhotoUpload";
import {
  captureQuickPosterImage,
  uploadQuickPosterToEvent,
} from "@/src/lib/quickPosterUpload";
import type {
  CreateEventData,
  EventFormData,
  EventType,
  PosterStyleChoice,
} from "@/types/events";
import type { RefObject } from "react";
import type { View } from "react-native";

function celebrationFromRoute(routeType: string | undefined) {
  if (routeType === "barMitzvah") return "barMitzvah" as const;
  if (routeType === "batMitzvah") return "batMitzvah" as const;
  return "birthday" as const;
}

export type PosterGenLiveState = { eventId: string } & EventPosterGenerationSnapshot;

export function resolveCreateFlowEventType(
  formData: EventFormData,
  routeEventType?: string,
): EventType {
  return (formData.celebrationType ??
    celebrationFromRoute(routeEventType)) as EventType;
}

/**
 * Creates the Firestore event, uploads honoree photo if needed, calls `generatePoster`,
 * and mirrors poster-generation snapshots so the UI can show progressive previews.
 */
export async function submitNewEventWithPosterFlow(params: {
  formData: EventFormData;
  resolvedEventType: EventType;
  posterStyle?: PosterStyleChoice;
  quickPosterCaptureRef?: RefObject<View | null>;
  onPosterGenLiveChange: (state: PosterGenLiveState | null) => void;
}): Promise<{ ok: boolean; eventId?: string }> {
  const {
    formData,
    resolvedEventType,
    posterStyle,
    quickPosterCaptureRef,
    onPosterGenLiveChange,
  } = params;

  const eventData: CreateEventData = {
    eventType: resolvedEventType,
    formData,
    guests: [],
  };

  const result = await createEvent(eventData);
  if (!result.success || !result.eventId) {
    Alert.alert(
      "Error",
      result.error || "Could not create event. Please try again.",
    );
    return { ok: false };
  }

  const eventId = result.eventId;
  const localPhoto = formData.honoreePhotoUri?.trim();

  if (localPhoto) {
    try {
      const honoreePhotoUrl = await uploadHonoreePhotoToEvent(
        eventId,
        localPhoto,
      );
      const up = await updateEvent(eventId, { honoreePhotoUrl });
      if (!up.success) {
        throw new Error(up.error || "Update failed");
      }
    } catch (uploadErr) {
      console.error(uploadErr);
      Alert.alert(
        "Photo upload",
        "Your event was saved, but the honoree photo could not be uploaded. You can add one when editing the event; the AI poster may not match their face until then.",
      );
    }
  }

  if (posterStyle === "quick") {
    try {
      if (!quickPosterCaptureRef) {
        throw new Error("Poster preview is not ready");
      }
      const localUri = await captureQuickPosterImage(quickPosterCaptureRef);
      await uploadQuickPosterToEvent(eventId, localUri);
    } catch (posterErr) {
      console.error("Error saving quick poster:", posterErr);
      Alert.alert(
        "Poster save",
        "Your event was created, but we couldn't save your poster image. Open your event dashboard to try again.",
      );
    }
    return { ok: true, eventId };
  }

  const posterRes = await (async () => {
    onPosterGenLiveChange({
      eventId,
      posterUrl: null,
      skeletonPosterUrl: null,
      posterStreamingPreviewUrl: null,
      visualTeaser: null,
      skeletonProgress: null,
    });
    const unsub = subscribeEventPosterGenerationProgress(eventId, (snap) => {
      onPosterGenLiveChange({
        eventId,
        posterUrl: snap.posterUrl,
        skeletonPosterUrl: snap.skeletonPosterUrl,
        posterStreamingPreviewUrl: snap.posterStreamingPreviewUrl,
        visualTeaser: snap.visualTeaser ?? null,
        skeletonProgress: snap.skeletonProgress ?? null,
      });
    });
    try {
      return await generateEventPoster(eventId);
    } finally {
      unsub();
      onPosterGenLiveChange(null);
    }
  })();

  if (posterRes.success) {
    if (!posterRes.posterUrl) {
      Alert.alert(
        "Poster image",
        "We saved your invitation text. The image may still be processing—or you can generate it again from your event dashboard.",
      );
    }
  } else {
    Alert.alert(
      "Couldn't generate poster",
      posterRes.error ||
        "Your event was created. Open your event dashboard to try generating the poster again.",
    );
  }

  return { ok: true, eventId };
}
