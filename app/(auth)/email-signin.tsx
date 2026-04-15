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
  type TextStyle,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import firebase from "@/src/firebase";
import { routes } from "@/types/routes";
import { getPostLoginRoute } from "@/src/utils/auth/store";
import {
  configureGoogleSignIn,
  handleAppleSignIn as appleSignIn,
  handleGoogleSignIn as googleSignIn,
} from "@/src/utils/auth/socialAuth";
import {
  colors,
  primaryGradient,
  radius,
  spacing,
  typography,
  fontFamily,
  ambientShadow,
  borderGhostOutline,
} from "@/src/theme";

const ghostBorder = {
  borderWidth: 1,
  borderColor: "rgba(203, 195, 215, 0.15)",
} as const satisfies TextStyle;

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

  const inputStyle: TextStyle = {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.sm,
    paddingHorizontal: spacing[4],
    paddingVertical: 14,
    fontSize: 16,
    color: colors.onSurface,
    ...ghostBorder,
  };

  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: spacing[5],
            paddingTop: insets.top + 12,
            paddingBottom: spacing[2],
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[2] }}>
            <LinearGradient
              {...primaryGradient}
              style={{
                width: 32,
                height: 32,
                borderRadius: radius.full,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="wallet" size={16} color={colors.onPrimary} />
            </LinearGradient>
            <Text
              style={[
                typography.titleLg,
                { fontSize: 18, color: colors.primary, fontStyle: "italic", fontFamily: fontFamily.title },
              ]}
            >
              CreditKid
            </Text>
          </View>
          <TouchableOpacity
            style={{
              width: 32,
              height: 32,
              borderRadius: radius.full,
              backgroundColor: colors.surfaceContainerHigh,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="help" size={16} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: spacing[6],
            paddingTop: 40,
            paddingBottom: insets.bottom + 40,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[typography.headlineLg, { color: colors.onSurface, marginBottom: spacing[2] }]}>
            Welcome Back
          </Text>
          <Text
            style={[
              typography.bodyMd,
              { color: colors.onSurfaceVariant, lineHeight: 24, marginBottom: spacing[8] },
            ]}
          >
            Log in to manage your child's celebration.
          </Text>

          <Text
            style={[
              typography.labelMd,
              {
                fontSize: 11,
                color: colors.onSurface,
                letterSpacing: 1,
                marginBottom: spacing[2],
                fontFamily: fontFamily.title,
              },
            ]}
          >
            EMAIL ADDRESS
          </Text>
          <TextInput
            style={{ ...inputStyle, marginBottom: spacing[5] }}
            placeholder="hello@example.com"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={!loading}
          />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: spacing[2],
            }}
          >
            <Text
              style={[
                typography.labelMd,
                {
                  fontSize: 11,
                  color: colors.onSurface,
                  letterSpacing: 1,
                  fontFamily: fontFamily.title,
                },
              ]}
            >
              PASSWORD
            </Text>
            <TouchableOpacity>
              <Text style={[typography.bodyMd, { fontSize: 13, fontWeight: "600", color: colors.primary }]}>
                Forgot?
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ position: "relative", marginBottom: spacing[8] }}>
            <TextInput
              style={{
                ...inputStyle,
                paddingRight: 48,
              }}
              placeholder="••••••••"
              placeholderTextColor={colors.muted}
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
              <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
            style={[
              {
                borderRadius: radius.sm,
                overflow: "hidden",
                marginBottom: spacing[6],
                opacity: loading ? 0.85 : 1,
                ...ambientShadow,
                shadowOpacity: 0.12,
                shadowRadius: 12,
              },
            ]}
          >
            <LinearGradient
              {...primaryGradient}
              style={{
                paddingVertical: spacing[4],
                alignItems: "center",
                justifyContent: "center",
                minHeight: 52,
              }}
            >
              {loading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={[typography.bodyLg, { fontWeight: "700", color: colors.onPrimary }]}>
                  Log In
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: spacing[6],
            }}
          >
            <View style={{ flex: 1, height: 1, backgroundColor: colors.outlineVariant }} />
            <Text
              style={[
                typography.labelMd,
                {
                  marginHorizontal: spacing[4],
                  color: colors.muted,
                  fontWeight: "600",
                },
              ]}
            >
              OR
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.outlineVariant }} />
          </View>

          <View style={{ flexDirection: "row", gap: spacing[3], marginBottom: spacing[8] }}>
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
                  gap: spacing[2],
                  backgroundColor: colors.surfaceContainerLowest,
                  borderRadius: radius.sm,
                  height: 48,
                  ...borderGhostOutline,
                }}
              >
                <Ionicons name="logo-apple" size={18} color={colors.onSurface} />
                <Text style={[typography.bodyMd, { fontWeight: "600", color: colors.onSurface }]}>
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
                gap: spacing[2],
                backgroundColor: colors.surfaceContainerLowest,
                borderRadius: radius.sm,
                height: 48,
                ...borderGhostOutline,
              }}
            >
              <Ionicons name="logo-google" size={16} color="#4285F4" />
              <Text style={[typography.bodyMd, { fontWeight: "600", color: colors.onSurface }]}>
                Google
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ alignItems: "center" }}>
            <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant }]}>
              Don't have an account?{" "}
              <Text
                onPress={() => router.push(routes.auth.signup)}
                style={{ fontWeight: "700", color: colors.primary }}
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
