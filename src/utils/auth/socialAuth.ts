import { Alert, Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import firebase from "@/src/firebase";
import { initializeUserProfile } from "@/src/lib/userService";

const GoogleAuthProvider =
  Platform.OS === "web"
    ? require("firebase/auth").GoogleAuthProvider
    : require("@react-native-firebase/auth").firebase.auth.GoogleAuthProvider;

const AppleAuthProvider =
  Platform.OS === "web"
    ? require("firebase/auth").OAuthProvider
    : require("@react-native-firebase/auth").firebase.auth.AppleAuthProvider;

let googleConfigured = false;

export function configureGoogleSignIn() {
  if (googleConfigured) return;
  try {
    GoogleSignin.configure({
      webClientId:
        "507312069438-vbv4is81o3kn1qbcljabtg56vbvn4mdd.apps.googleusercontent.com",
      offlineAccess: true,
    });
    googleConfigured = true;
  } catch (error) {
    console.log("Error configuring Google Sign-In:", error);
  }
}

export async function handleAppleSignIn(): Promise<boolean> {
  if (Platform.OS !== "ios") {
    Alert.alert("Not Available", "Apple Sign In is only available on iOS devices");
    return false;
  }

  try {
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert("Not Available", "Apple Sign In is not available on this device");
      return false;
    }

    const appleCredential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    const { identityToken, fullName, email } = appleCredential;
    if (!identityToken) throw new Error("No identity token received from Apple");

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

    return true;
  } catch (error: unknown) {
    console.log("Apple Sign In error:", error);
    const code = (error as { code?: string }).code;
    if (code !== "ERR_REQUEST_CANCELED" && code !== "ERR_CANCELED") {
      Alert.alert("Sign In Failed", (error as Error).message || "Failed to sign in with Apple.");
    }
    return false;
  }
}

export async function handleGoogleSignIn(): Promise<boolean> {
  try {
    configureGoogleSignIn();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const { data } = await GoogleSignin.signIn();
    const idToken = data?.idToken;
    if (!idToken) throw new Error("No ID token found");

    const googleCredential = GoogleAuthProvider.credential(idToken);
    await firebase.auth().signInWithCredential(googleCredential);

    return true;
  } catch (err: unknown) {
    console.log("Google Sign-In error:", err);
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
    return false;
  }
}
