import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import Ionicons from "@expo/vector-icons/Ionicons";
import firebase from "@/src/firebase";
import { routes } from "@/types/routes";
import { getPostLoginRoute } from "@/src/utils/auth/store";
import { initializeUserProfile } from "@/src/lib/userService";
import {
  configureGoogleSignIn,
  handleAppleSignIn as appleSignIn,
  handleGoogleSignIn as googleSignIn,
} from "@/src/utils/auth/socialAuth";

const TERMS_URL = "https://creditkid.vercel.app/terms";
const PRIVACY_URL = "https://creditkid.vercel.app/privacy";

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  async function handleSignUp() {
    const trimmed = fullName.trim();
    if (!trimmed) {
      Alert.alert("Error", "Please enter your full name");
      return;
    }
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    const parts = trimmed.split(" ");
    const legalFirstName = parts[0];
    const legalLastName = parts.slice(1).join(" ") || parts[0];

    setLoading(true);
    try {
      const userCredential = await firebase
        .auth()
        .createUserWithEmailAndPassword(email, password);

      await SecureStore.setItemAsync("userEmail", email);
      await SecureStore.setItemAsync("userPassword", password);

      await initializeUserProfile(userCredential, {
        legalFirstName: legalFirstName.trim(),
        legalLastName: legalLastName.trim(),
      });

      router.replace(getPostLoginRoute());
    } catch (error: any) {
      let errorMessage = "Failed to create account";
      if (error.code === "auth/email-already-in-use") {
        errorMessage =
          "This email is already registered. Please sign in instead.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Use at least 6 characters.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      Alert.alert("Sign Up Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleApple() {
    setLoading(true);
    try {
      const success = await appleSignIn();
      if (success) router.replace(getPostLoginRoute());
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      const success = await googleSignIn();
      if (success) router.replace(getPostLoginRoute());
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#FAFAFA" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: insets.top + 12,
            paddingBottom: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ padding: 4 }}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: "#7C3AED",
              fontStyle: "italic",
            }}
          >
            CreditKid
          </Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: insets.bottom + 40,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <Text
            style={{
              fontSize: 30,
              fontWeight: "900",
              color: "#1F2937",
              lineHeight: 38,
              marginBottom: 8,
            }}
          >
            Welcome to{"\n"}
            <Text style={{ color: "#7C3AED" }}>CreditKid</Text>.
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: "#6B7280",
              lineHeight: 22,
              marginBottom: 32,
            }}
          >
            The smartest way to manage your child's celebration gifts.
          </Text>

          {/* Full Name */}
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: "#374151",
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            FULL NAME
          </Text>
          <TextInput
            style={{
              backgroundColor: "#FFF",
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 16,
              color: "#1F2937",
              borderWidth: 1,
              borderColor: "#E5E7EB",
              marginBottom: 20,
            }}
            placeholder="Alex Johnson"
            placeholderTextColor="#D1D5DB"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            autoComplete="name"
            editable={!loading}
          />

          {/* Email */}
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: "#374151",
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            EMAIL ADDRESS
          </Text>
          <TextInput
            style={{
              backgroundColor: "#FFF",
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 16,
              color: "#1F2937",
              borderWidth: 1,
              borderColor: "#E5E7EB",
              marginBottom: 20,
            }}
            placeholder="alex@example.com"
            placeholderTextColor="#D1D5DB"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={!loading}
          />

          {/* Password */}
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: "#374151",
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            PASSWORD
          </Text>
          <View style={{ position: "relative", marginBottom: 28 }}>
            <TextInput
              style={{
                backgroundColor: "#FFF",
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                paddingRight: 48,
                fontSize: 16,
                color: "#1F2937",
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
              placeholder="At least 6 characters"
              placeholderTextColor="#D1D5DB"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoComplete="password-new"
              editable={!loading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: 14,
                top: 0,
                bottom: 0,
                justifyContent: "center",
              }}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>

          {/* Create Account Button */}
          <TouchableOpacity
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.85}
            style={{
              backgroundColor: loading ? "#C4B5FD" : "#7C3AED",
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
              shadowColor: "#7C3AED",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text
                style={{ fontSize: 17, fontWeight: "700", color: "#FFF" }}
              >
                Create Your Account
              </Text>
            )}
          </TouchableOpacity>

          {/* OR Divider */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <View
              style={{ flex: 1, height: 1, backgroundColor: "#E5E7EB" }}
            />
            <Text
              style={{
                marginHorizontal: 16,
                fontSize: 12,
                color: "#9CA3AF",
                fontWeight: "600",
              }}
            >
              OR
            </Text>
            <View
              style={{ flex: 1, height: 1, backgroundColor: "#E5E7EB" }}
            />
          </View>

          {/* Apple Sign In */}
          {Platform.OS === "ios" && (
            <TouchableOpacity
              onPress={handleApple}
              disabled={loading}
              activeOpacity={0.85}
              style={{
                backgroundColor: "#1F2937",
                borderRadius: 14,
                height: 52,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <Ionicons name="logo-apple" size={20} color="#FFF" />
              <Text
                style={{ fontSize: 15, fontWeight: "600", color: "#FFF" }}
              >
                Continue with Apple
              </Text>
            </TouchableOpacity>
          )}

          {/* Google Sign In */}
          <TouchableOpacity
            onPress={handleGoogle}
            disabled={loading}
            activeOpacity={0.85}
            style={{
              backgroundColor: "#FFF",
              borderRadius: 14,
              height: 52,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            <Ionicons name="logo-google" size={18} color="#4285F4" />
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: "#1F2937",
              }}
            >
              Continue with Google
            </Text>
          </TouchableOpacity>

          {/* Trust Badge */}
          <View
            style={{
              backgroundColor: "#F3EAFF",
              borderRadius: 16,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              marginBottom: 28,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#7C3AED",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="shield-checkmark" size={20} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: "#1F2937",
                  marginBottom: 2,
                }}
              >
                Secure & Simple
              </Text>
              <Text
                style={{ fontSize: 12, color: "#6B7280", lineHeight: 16 }}
              >
                Military-grade encryption for your family's financial
                security.
              </Text>
            </View>
          </View>

          {/* Login Link */}
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <Text style={{ fontSize: 14, color: "#6B7280" }}>
              Already have an account?{" "}
              <Text
                onPress={() => router.push(routes.auth.emailSignin)}
                style={{ fontWeight: "700", color: "#7C3AED" }}
              >
                Log In
              </Text>
            </Text>
          </View>

          {/* Footer Links */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 24,
            }}
          >
            <Text
              onPress={() => Linking.openURL(PRIVACY_URL)}
              style={{
                fontSize: 11,
                color: "#9CA3AF",
                fontWeight: "600",
                letterSpacing: 0.5,
              }}
            >
              PRIVACY POLICY
            </Text>
            <Text
              onPress={() => Linking.openURL(TERMS_URL)}
              style={{
                fontSize: 11,
                color: "#9CA3AF",
                fontWeight: "600",
                letterSpacing: 0.5,
              }}
            >
              TERMS OF SERVICE
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
