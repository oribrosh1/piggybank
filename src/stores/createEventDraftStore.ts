import { create } from "zustand";
import type { EventFormData, EventType } from "@/types/events";

export type CreateEventDraftPayload = {
  formData: EventFormData;
  resolvedEventType: EventType;
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
