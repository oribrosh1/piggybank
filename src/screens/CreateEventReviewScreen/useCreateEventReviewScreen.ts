import { useCallback, useEffect, useState, type RefObject } from "react";
import { Alert, type View } from "react-native";
import { useRouter } from "expo-router";
import { routes } from "@/types/routes";
import { useCreateEventDraftStore } from "@/src/stores/createEventDraftStore";
import {
  submitNewEventWithPosterFlow,
  type PosterGenLiveState,
} from "@/src/lib/createEventFlowSubmit";

export function useCreateEventReviewScreen(
  quickPosterCaptureRef?: RefObject<View | null>,
) {
  const router = useRouter();
  const draft = useCreateEventDraftStore((s) => s.draft);
  const clearDraft = useCreateEventDraftStore((s) => s.clearDraft);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [posterGenLive, setPosterGenLive] = useState<PosterGenLiveState | null>(
    null,
  );

  useEffect(() => {
    if (!draft) {
      router.replace({
        pathname: routes.createEvent.posterStyle,
        params: { eventType: "birthday" },
      });
    }
  }, [draft, router]);

  const handleConfirmCreate = useCallback(async () => {
    if (!draft) {
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await submitNewEventWithPosterFlow({
        formData: draft.formData,
        resolvedEventType: draft.resolvedEventType,
        posterStyle: draft.posterStyle,
        quickPosterCaptureRef:
          draft.posterStyle === "quick" ? quickPosterCaptureRef : undefined,
        onPosterGenLiveChange: setPosterGenLive,
      });
      if (res.ok && res.eventId) {
        clearDraft();
        router.replace({
          pathname: routes.tabs.myEvent,
          params: { eventId: res.eventId },
        });
      }
    } catch (e: unknown) {
      Alert.alert(
        "Error",
        (e as Error).message || "Something went wrong while creating your event.",
      );
    } finally {
      setIsSubmitting(false);
      setPosterGenLive(null);
    }
  }, [draft, clearDraft, router, quickPosterCaptureRef]);

  return {
    draft,
    isSubmitting,
    posterGenLive,
    handleConfirmCreate,
  };
}
