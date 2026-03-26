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
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import Ionicons from "@expo/vector-icons/Ionicons";
import firebase from "@/src/firebase";
import { routes } from "@/types/routes";
import { getPostLoginRoute } from "@/src/utils/auth/store";
import {
  configureGoogleSignIn,
  handleAppleSignIn as appleSignIn,
  handleGoogleSignIn as googleSignIn,
} from "@/src/utils/auth/socialAuth";

export default function EmailSignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      await firebase.auth().signInWithEmailAndPassword(email, password);
      await SecureStore.setItemAsync("userEmail", email);
      await SecureStore.setItemAsync("userPassword", password);
      router.replace(getPostLoginRoute());
    } catch (error: any) {
      let errorMessage = "Authentication failed";
      if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "No account found. Please sign up first.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password";
      }
      Alert.alert("Error", errorMessage);
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
    <View style={{ flex: 1, backgroundColor: "#F5F0FF" }}>
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
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "#7C3AED",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="wallet" size={16} color="#FFF" />
            </View>
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
          </View>
          <TouchableOpacity
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "#E5E7EB",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="help" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 40,
            paddingBottom: insets.bottom + 40,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <Text
            style={{
              fontSize: 32,
              fontWeight: "900",
              color: "#1F2937",
              marginBottom: 8,
            }}
          >
            Welcome Back
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: "#6B7280",
              lineHeight: 24,
              marginBottom: 36,
            }}
          >
            Log in to manage your child's celebration.
          </Text>

          {/* Email Field */}
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
            placeholder="hello@example.com"
            placeholderTextColor="#D1D5DB"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={!loading}
          />

          {/* Password Field */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: "#374151",
                letterSpacing: 1,
              }}
            >
              PASSWORD
            </Text>
            <TouchableOpacity>
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: "#7C3AED" }}
              >
                Forgot?
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ position: "relative", marginBottom: 32 }}>
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
              placeholder="••••••••"
              placeholderTextColor="#D1D5DB"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoComplete="password"
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

          {/* Log In Button */}
          <TouchableOpacity
            onPress={handleLogin}
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
                Log In
              </Text>
            )}
          </TouchableOpacity>

          {/* OR Divider */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 24,
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

          {/* Social Buttons (side-by-side) */}
          <View
            style={{ flexDirection: "row", gap: 12, marginBottom: 32 }}
          >
            {Platform.OS === "ios" && (
              <TouchableOpacity
                onPress={handleApple}
                disabled={loading}
                activeOpacity={0.85}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  backgroundColor: "#FFF",
                  borderRadius: 14,
                  height: 48,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                }}
              >
                <Ionicons name="logo-apple" size={18} color="#000" />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#1F2937",
                  }}
                >
                  Apple
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleGoogle}
              disabled={loading}
              activeOpacity={0.85}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: "#FFF",
                borderRadius: 14,
                height: 48,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            >
              <Ionicons name="logo-google" size={16} color="#4285F4" />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#1F2937",
                }}
              >
                Google
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 14, color: "#6B7280" }}>
              Don't have an account?{" "}
              <Text
                onPress={() => router.push(routes.auth.signup)}
                style={{ fontWeight: "700", color: "#7C3AED" }}
              >
                Sign Up
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
