import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import firebase from "@/src/firebase";
import { routes } from "@/types/routes";
import { getPostLoginRoute } from "@/src/utils/auth/store";
import {
  configureGoogleSignIn,
  handleAppleSignIn as appleSignIn,
  handleGoogleSignIn as googleSignIn,
} from "@/src/utils/auth/socialAuth";

export function useLoginScreen() {
  const router = useRouter();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [biometricType, setBiometricType] =
    useState<LocalAuthentication.AuthenticationType | null>(null);

  useEffect(() => {
    checkBiometricSupport();
    configureGoogleSignIn();
  }, []);

  async function checkBiometricSupport() {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types =
        await LocalAuthentication.supportedAuthenticationTypesAsync();

      setHasBiometrics(compatible && enrolled);

      if (
        types.includes(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
        )
      ) {
        setBiometricType(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
        );
      } else if (
        types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
      ) {
        setBiometricType(LocalAuthentication.AuthenticationType.FINGERPRINT);
      } else if (
        types.includes(LocalAuthentication.AuthenticationType.IRIS)
      ) {
        setBiometricType(LocalAuthentication.AuthenticationType.IRIS);
      }
    } catch (error) {
      console.log("Error checking biometric support:", error);
    }
  }

  async function handleBiometricAuth() {
    setIsAuthenticating(true);
    try {
      const savedEmail = await SecureStore.getItemAsync("userEmail");
      const savedPassword = await SecureStore.getItemAsync("userPassword");

      if (!savedEmail || !savedPassword) {
        Alert.alert(
          "First Time Sign In",
          "Please sign in with email and password first to enable biometric authentication.",
          [
            {
              text: "Sign In with Email",
              onPress: () => router.push(routes.auth.emailSignin),
            },
          ]
        );
        setIsAuthenticating(false);
        return;
      }

      if (!hasBiometrics) {
        Alert.alert(
          "Biometric Not Available",
          "Please set up Face ID or Touch ID in your device settings.",
          [
            {
              text: "Sign In with Email",
              onPress: () => router.push(routes.auth.emailSignin),
            },
          ]
        );
        setIsAuthenticating(false);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to sign in",
        fallbackLabel: "Use Email & Password",
        cancelLabel: "Cancel",
      });

      if (result.success) {
        await firebase
          .auth()
          .signInWithEmailAndPassword(savedEmail, savedPassword);
        router.replace(getPostLoginRoute());
      } else {
        Alert.alert(
          "Authentication Failed",
          result.error || "Please try again.",
          [
            { text: "Try Again", onPress: handleBiometricAuth },
            {
              text: "Use Email",
              onPress: () => router.push(routes.auth.emailSignin),
            },
          ]
        );
      }
    } catch (error) {
      console.log("Authentication error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsAuthenticating(false);
    }
  }

  const handleAppleSignIn = async () => {
    setIsAuthenticating(true);
    try {
      const success = await appleSignIn();
      if (success) router.replace(getPostLoginRoute());
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    try {
      const success = await googleSignIn();
      if (success) router.replace(getPostLoginRoute());
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignIn = () => {
    const isDevMode = process.env.EXPO_PUBLIC_ENV === "dev";
    if (isDevMode) {
      router.replace(getPostLoginRoute());
    } else {
      handleBiometricAuth();
    }
  };

  const handleEmailSignIn = () => {
    router.push(routes.auth.emailSignin);
  };

  const handleSignUp = () => {
    router.push(routes.auth.signup);
  };

  return {
    isAuthenticating,
    hasBiometrics,
    biometricType,
    handleSignIn,
    handleAppleSignIn,
    handleEmailSignIn,
    handleSignUp,
    handleGoogleSignIn,
  };
}
