import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

export const authKey = `${process.env.EXPO_PUBLIC_PROJECT_GROUP_ID || 'piggybank'}-jwt`;

interface AuthStoreState {
  isReady: boolean;
  auth: any | null;
  setAuth: (auth: any | null) => void;
}

interface AuthModalState {
  isOpen: boolean;
  mode: "signup" | "login";
  open: (options: { mode: "signup" | "login" }) => void;
  close: () => void;
}

/**
 * This store manages the authentication state of the application.
 */
export const useAuthStore = create<AuthStoreState>((set) => ({
  isReady: false,
  auth: null,
  setAuth: (auth: AuthStoreState['auth'] | null) => {
    if (auth) {
      SecureStore.setItemAsync(authKey, JSON.stringify(auth));
    } else {
      SecureStore.deleteItemAsync(authKey);
    }
    set({ auth });
  },
}));

/**
 * This store manages the state of the authentication modal.
 */
export const useAuthModal = create<AuthModalState>((set) => ({
  isOpen: false,
  mode: "signup",
  open: (options: { mode: "signup" | "login" }) => set({ isOpen: true, mode: options?.mode || "signup" }),
  close: () => set({ isOpen: false }),
}));
