import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import type { ExternalPathString } from "expo-router";

export const authKey = `${process.env.EXPO_PUBLIC_PROJECT_GROUP_ID || 'piggybank'}-jwt`;

interface AuthStoreState {
  isReady: boolean;
  auth: any | null;
  pendingChildToken: string | null;
  setAuth: (auth: any | null) => void;
  setPendingChildToken: (token: string | null) => void;
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
  pendingChildToken: null,
  setAuth: (auth: AuthStoreState['auth'] | null) => {
    if (auth) {
      SecureStore.setItemAsync(authKey, JSON.stringify(auth));
    } else {
      SecureStore.deleteItemAsync(authKey);
    }
    set({ auth });
  },
  setPendingChildToken: (token: string | null) => set({ pendingChildToken: token }),
}));

/**
 * Returns the route to navigate to after login/signup.
 * If a pending child invite token exists, consumes it and returns the /child route.
 * Otherwise returns the home tab route.
 */
export function getPostLoginRoute(): ExternalPathString {
  const { pendingChildToken } = useAuthStore.getState();
  if (pendingChildToken) {
    useAuthStore.setState({ pendingChildToken: null });
    return `/child?token=${encodeURIComponent(pendingChildToken)}` as ExternalPathString;
  }
  return "/(tabs)/home" as ExternalPathString;
}

/**
 * This store manages the state of the authentication modal.
 */
export const useAuthModal = create<AuthModalState>((set) => ({
  isOpen: false,
  mode: "signup",
  open: (options: { mode: "signup" | "login" }) => set({ isOpen: true, mode: options?.mode || "signup" }),
  close: () => set({ isOpen: false }),
}));
