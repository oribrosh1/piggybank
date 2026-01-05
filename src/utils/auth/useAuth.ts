import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect } from "react";
import { Platform } from "react-native";
import { useAuthModal, useAuthStore, authKey } from "./store";
import firebase from '../../firebase';

/**
 * This hook provides authentication functionality.
 * It may be easier to use the `useAuthModal` or `useRequireAuth` hooks
 * instead as those will also handle showing authentication to the user
 * directly.
 */
export const useAuth = () => {
  const { isReady, auth: authData, setAuth } = useAuthStore();
  const { isOpen, close, open } = useAuthModal();

  const initiate = useCallback(() => {
    console.log('🔐 useAuth: Initiating auth listener...');

    try {
      // Listen to Firebase auth state changes
      const firebaseAuth = firebase.auth();
      const unsubscribe = firebaseAuth.onAuthStateChanged((user: any) => {
        console.log('🔐 useAuth: Auth state changed:', user ? `User: ${user.email}` : 'No user');

        try {
          if (user) {
            // User is signed in
            const authData = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
            };
            useAuthStore.setState({
              auth: authData,
              isReady: true,
            });
            // SecureStore only works on native platforms (iOS/Android), not web
            if (Platform.OS !== 'web') {
              try {
                SecureStore.setItemAsync(authKey, JSON.stringify(authData));
              } catch (e) {
                console.log('⚠️ SecureStore error:', (e as Error).message);
              }
            }
          } else {
            // User is signed out
            useAuthStore.setState({
              auth: null,
              isReady: true,
            });
            // SecureStore only works on native platforms (iOS/Android), not web
            if (Platform.OS !== 'web') {
              try {
                SecureStore.deleteItemAsync(authKey);
              } catch (e) {
                console.log('⚠️ SecureStore error:', (e as Error).message);
              }
            }
          }
        } catch (error) {
          console.error('🔐 useAuth: Auth listener error:', error);
          // Even on error, set isReady to true so app doesn't hang
          useAuthStore.setState({
            auth: null,
            isReady: true,
          });
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('🔐 useAuth: Failed to set up auth listener:', error);
      // Set isReady to true so app doesn't hang
      useAuthStore.setState({
        auth: null,
        isReady: true,
      });
      return undefined;
    }
  }, []);

  useEffect(() => { }, []);

  const signIn = useCallback(() => {
    open({ mode: "login" });
  }, [open]);
  const signUp = useCallback(() => {
    open({ mode: "signup" });
  }, [open]);

  const signOut = useCallback(() => {
    setAuth(null);
    close();
  }, [close]);

  return {
    isReady,
    isAuthenticated: isReady ? !!authData : null,
    signIn,
    signOut,
    signUp,
    auth: authData,
    setAuth,
    initiate,
  };
};

/**
 * This hook will automatically open the authentication modal if the user is not authenticated.
 */
export const useRequireAuth = (options: { mode?: "signup" | "login" }) => {
  const { isAuthenticated, isReady } = useAuth();
  const { open } = useAuthModal();

  useEffect(() => {
    if (!isAuthenticated && isReady) {
      open({ mode: options?.mode || "signup" });
    }
  }, [isAuthenticated, open, options?.mode, isReady]);
};

export default useAuth;
