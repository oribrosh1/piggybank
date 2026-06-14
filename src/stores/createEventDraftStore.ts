import { create } from "zustand";
import type {
  EventFormData,
  EventType,
  HonoreeGender,
  PosterStyleChoice,
} from "@/types/events";

export type QuickPosterCover = Extract<HonoreeGender, "boy" | "girl">;

export type CreateEventDraftPayload = {
  formData: EventFormData;
  resolvedEventType: EventType;
  posterStyle: PosterStyleChoice;
  /** Quick poster template — defaults from honoree gender when unset. */
  quickPosterCover?: QuickPosterCover;
  /** Optional short line shown in the center of the quick poster. */
  quickPosterEventWords?: string;
  /** When false, poster center stays empty (no placeholder). */
  quickPosterShowMessage?: boolean;
};

type CreateEventDraftState = {
  draft: CreateEventDraftPayload | null;
  setDraft: (payload: CreateEventDraftPayload) => void;
  clearDraft: () => void;
};

export const useCreateEventDraftStore = create<CreateEventDraftState>((set) => ({
  draft: null,
  setDraft: (payload) => set({ draft: payload }),
  clearDraft: () => set({ draft: null }),
}));
