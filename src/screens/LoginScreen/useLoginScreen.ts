import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import * as AppleAuthentication from "expo-apple-authentication";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import firebase from "@/src/firebase";
import { routes } from "@/types/routes";
import { initializeUserProfile } from "@/src/lib/userService";

const GoogleAuthProvider =
  Platform.OS === "web"
    ? require("firebase/auth").GoogleAuthProvider
    : require("@react-native-firebase/auth").firebase.auth.GoogleAuthProvider;

const AppleAuthProvider =
  Platform.OS === "web"
    ? require("firebase/auth").OAuthProvider
    : require("@react-native-firebase/auth").firebase.auth.AppleAuthProvider;

export function useLoginScreen() {
  const router = useRouter();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [biometricType, setBiometricType] = useState<LocalAuthentication.AuthenticationType | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const bounceAnim = useRef(new Animated.Value(0)).current;
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkBiometricSupport();
    configureGoogleSignIn();
  }, []);

  async function configureGoogleSignIn() {
    try {
      GoogleSignin.configure({
        webClientId:
          "507312069438-vbv4is81o3kn1qbcljabtg56vbvn4mdd.apps.googleusercontent.com",
        offlineAccess: true,
      });
    } catch (error) {
      console.log("Error configuring Google Sign-In:", error);
    }
  }

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim1, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim2, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [bounceAnim, floatAnim1, floatAnim2]);

  async function checkBiometricSupport() {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      setHasBiometrics(compatible && enrolled);

      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType(LocalAuthentication.AuthenticationType.FINGERPRINT);
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
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
        Alert.alert("First Time Sign In", "Please sign in with email and password first to enable biometric authentication.", [
          { text: "Sign In with Email", onPress: () => router.push(routes.auth.emailSignin) },
        ]);
        setIsAuthenticating(false);
        return;
      }

      if (!hasBiometrics) {
        Alert.alert(
          "Biometric Not Available",
          "Please set up Face ID or Touch ID in your device settings, or sign in with email and password.",
          [{ text: "Sign In with Email", onPress: () => router.push(routes.auth.emailSignin) }]
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
        try {
          await firebase.auth().signInWithEmailAndPassword(savedEmail, savedPassword);
          router.replace(routes.tabs.home);
        } catch (firebaseErr: unknown) {
          console.log("❌ Login: Firebase sign in error:", firebaseErr);
          Alert.alert("Sign In Failed", "Your credentials may have expired. Please sign in again.", [
            { text: "Sign In with Email", onPress: () => router.push(routes.auth.emailSignin) },
          ]);
        }
      } else {
        Alert.alert(
          "Authentication Failed",
          result.error || "Please try again or sign in with email and password.",
          [
            { text: "Try Again", onPress: handleBiometricAuth },
            { text: "Use Email", onPress: () => router.push(routes.auth.emailSignin) },
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
    if (Platform.OS !== "ios") {
      Alert.alert("Not Available", "Apple Sign In is only available on iOS devices");
      return;
    }

    setIsAuthenticating(true);
    try {
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("Not Available", "Apple Sign In is not available on this device");
        setIsAuthenticating(false);
        return;
      }

      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const { identityToken, fullName, email } = appleCredential;

      if (!identityToken) {
        throw new Error("No identity token received from Apple");
      }

      const firebaseCredential =
        Platform.OS === "ios"
          ? AppleAuthProvider.credential(identityToken)
          : new AppleAuthProvider().credential({ idToken: identityToken });

      const userCredential = await firebase.auth().signInWithCredential(firebaseCredential);

      if (userCredential.additionalUserInfo?.isNewUser) {
        await initializeUserProfile(userCredential, {
          fullName: fullName
            ? `${fullName.givenName || ""} ${fullName.familyName || ""}`.trim()
            : email?.split("@")[0] || "Apple User",
        });
      }

      router.replace(routes.tabs.home);
    } catch (error: unknown) {
      console.log("❌ Apple Sign In error:", error);
      const code = (error as { code?: string }).code;
      if (code !== "ERR_REQUEST_CANCELED" && code !== "ERR_CANCELED") {
        Alert.alert("Sign In Failed", (error as Error).message || "Failed to sign in with Apple. Please try again.");
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignIn = () => {
    const isDevMode = process.env.EXPO_PUBLIC_ENV === "dev";
    if (isDevMode) {
      router.replace(routes.tabs.home);
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

  async function handleGoogleSignIn() {
    setIsAuthenticating(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const { data } = await GoogleSignin.signIn();
      const idToken = data?.idToken;
      if (!idToken) {
        throw new Error("No ID token found");
      }

      const googleCredential = GoogleAuthProvider.credential(idToken);
      await firebase.auth().signInWithCredential(googleCredential);

      router.replace(routes.tabs.home);
    } catch (err: unknown) {
      console.log("❌ Google Sign-In error:", err);

      const code = (err as { code?: string }).code;
      if (code === "sign_in_cancelled") {
        Alert.alert("Cancelled", "Google Sign-In was cancelled");
      } else if (code === "in_progress") {
        Alert.alert("In Progress", "Sign in already in progress");
      } else if (code === "play_services_not_available") {
        Alert.alert("Error", "Google Play Services not available");
      } else {
        Alert.alert("Sign In Failed", (err as Error).message || "Something went wrong");
      }
    } finally {
      setIsAuthenticating(false);
    }
  }

  const bounceTranslate = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const floatTranslate1 = floatAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 15],
  });

  const floatTranslate2 = floatAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  return {
    isAuthenticating,
    hasBiometrics,
    biometricType,
    showAuthModal,
    setShowAuthModal,
    bounceTranslate,
    floatTranslate1,
    floatTranslate2,
    handleSignIn,
    handleAppleSignIn,
    handleEmailSignIn,
    handleSignUp,
    handleGoogleSignIn,
  };
}
