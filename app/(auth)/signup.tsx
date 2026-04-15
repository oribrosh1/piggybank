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
  type TextStyle,
  StyleSheet,
  Image,
  type ImageSourcePropType,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import firebase from "@/src/firebase";
import { routes } from "@/types/routes";
import { getPostLoginRoute } from "@/src/utils/auth/store";
import { initializeUserProfile } from "@/src/lib/userService";
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

const TERMS_URL = "https://creditkid.vercel.app/terms";
const PRIVACY_URL = "https://creditkid.vercel.app/privacy";

const STRIPE_WORDMARK = require("../../assets/images/stripe-icon.png") as ImageSourcePropType;

const ghostBorder: TextStyle = {
  borderWidth: 1,
  borderColor: "rgba(203, 195, 215, 0.2)",
};

const CARD_PREVIEW = {
  bg: "#151d2b",
  border: "rgba(148, 163, 184, 0.22)",
  mint: "#7ED9A4",
  pan: "**** **** **** 1234",
  exp: "10/32",
} as const;

function SignUpBackgroundMesh() {
  return (
    <>
      <LinearGradient
        colors={["#eef2ff", "#f8f9ff", "#f0f4ff"]}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { overflow: "hidden" }]} pointerEvents="none">
        <LinearGradient
          colors={["rgba(107, 56, 212, 0.22)", "rgba(132, 85, 239, 0.06)", "transparent"]}
          style={{
            position: "absolute",
            top: -100,
            right: -80,
            width: 320,
            height: 320,
            borderRadius: 160,
          }}
        />
        <LinearGradient
          colors={["transparent", "rgba(4, 120, 87, 0.08)", "rgba(4, 120, 87, 0.14)"]}
          style={{
            position: "absolute",
            bottom: -40,
            left: -60,
            width: 260,
            height: 260,
            borderRadius: 130,
          }}
        />
      </View>
    </>
  );
}

function SignUpCardPreview() {
  return (
    <View
      style={{
        backgroundColor: CARD_PREVIEW.bg,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: CARD_PREVIEW.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 8,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <Text
          style={{
            fontFamily: fontFamily.label,
            fontSize: 9,
            letterSpacing: 2,
            fontWeight: "700",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          CREDITKID
        </Text>
        <Ionicons name="wifi" size={22} color={CARD_PREVIEW.mint} accessibilityLabel="Contactless" />
      </View>
      <Text
        style={{
          fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
          fontSize: 14,
          fontWeight: "600",
          letterSpacing: 1,
          color: "rgba(255,255,255,0.94)",
          marginBottom: 12,
          fontVariant: ["tabular-nums"],
        }}
      >
        {CARD_PREVIEW.pan}
      </Text>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
        <View>
          <Text style={{ fontFamily: fontFamily.label, fontSize: 8, color: "rgba(255,255,255,0.38)", marginBottom: 2 }}>
            BALANCE
          </Text>
          <Text
            style={{
              fontFamily: fontFamily.headline,
              fontSize: 20,
              fontWeight: "800",
              color: "#fff",
              fontVariant: ["tabular-nums"],
            }}
          >
            $142.50
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontFamily: fontFamily.label, fontSize: 8, color: "rgba(255,255,255,0.38)", marginBottom: 2 }}>
            VALID THRU
          </Text>
          <Text
            style={{
              fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
              fontSize: 13,
              fontWeight: "600",
              color: "rgba(255,255,255,0.9)",
              fontVariant: ["tabular-nums"],
            }}
          >
            {CARD_PREVIEW.exp}
          </Text>
        </View>
      </View>
    </View>
  );
}

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
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);

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
        errorMessage = "This email is already registered. Please sign in instead.";
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

  const inputStyle: TextStyle = {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 14,
    paddingHorizontal: spacing[4],
    paddingVertical: 14,
    fontSize: 16,
    color: colors.onSurface,
    ...ghostBorder,
  };

  const labelStyle = [
    typography.labelMd,
    {
      fontSize: 11,
      color: colors.primary,
      letterSpacing: 1.2,
      marginBottom: spacing[2],
      fontFamily: fontFamily.title,
      fontWeight: "700" as const,
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <SignUpBackgroundMesh />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <Animated.View entering={FadeIn.duration(420)} style={{ zIndex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: spacing[5],
              paddingTop: insets.top + 10,
              paddingBottom: spacing[2],
            }}
          >
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }} hitSlop={12}>
              <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
            </TouchableOpacity>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <LinearGradient
                {...primaryGradient}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="wallet" size={16} color={colors.onPrimary} />
              </LinearGradient>
              <Text
                style={[
                  typography.titleLg,
                  {
                    fontSize: 18,
                    color: colors.primary,
                    fontStyle: "italic",
                    fontFamily: fontFamily.title,
                    fontWeight: "700",
                  },
                ]}
              >
                CreditKid
              </Text>
            </View>
            <View style={{ width: 32 }} />
          </View>
        </Animated.View>

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: spacing[6],
            paddingTop: spacing[2],
            paddingBottom: insets.bottom + 36,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.duration(520).delay(60)}>
            <Text style={[typography.headlineLg, { lineHeight: 38, marginBottom: spacing[2] }]}>
              Welcome to{"\n"}
              <Text style={{ color: colors.primary }}>CreditKid</Text>
              <Text style={{ color: colors.onSurface }}>.</Text>
            </Text>
            <Text
              style={[
                typography.bodyMd,
                { fontSize: 15, color: colors.onSurfaceVariant, lineHeight: 22, marginBottom: spacing[5] },
              ]}
            >
              {"The smartest way to manage your child's celebration gifts."}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(520).delay(120)} style={{ marginBottom: spacing[6] }}>
            <SignUpCardPreview />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(520).delay(160)}
            style={{
              borderRadius: radius.md,
              padding: spacing[5],
              marginBottom: spacing[2],
              backgroundColor: "rgba(255,255,255,0.55)",
              borderWidth: 1,
              borderColor: "rgba(107, 56, 212, 0.12)",
              ...ambientShadow,
              shadowOpacity: 0.06,
              shadowRadius: 24,
            }}
          >
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(107, 56, 212, 0.06)", "rgba(255,255,255,0.4)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                borderRadius: radius.md,
              }}
            />
            <View style={{ zIndex: 1 }}>
              <Text style={labelStyle}>FULL NAME</Text>
              <TextInput
                style={{ ...inputStyle, marginBottom: spacing[4] }}
                placeholder="Alex Johnson"
                placeholderTextColor={colors.muted}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoComplete="name"
                editable={!loading}
              />

              <Text style={labelStyle}>EMAIL ADDRESS</Text>
              <TextInput
                style={{ ...inputStyle, marginBottom: spacing[4] }}
                placeholder="alex@example.com"
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!loading}
              />

              <Text style={labelStyle}>PASSWORD</Text>
              <View style={{ position: "relative", marginBottom: 4 }}>
                <TextInput
                  style={{
                    ...inputStyle,
                    paddingRight: 48,
                  }}
                  placeholder="At least 6 characters"
                  placeholderTextColor={colors.muted}
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
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color={colors.muted} />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(520).delay(200)}>
            <TouchableOpacity
              onPress={handleSignUp}
              disabled={loading}
              activeOpacity={0.88}
              style={[
                {
                  borderRadius: 16,
                  overflow: "hidden",
                  marginTop: spacing[4],
                  marginBottom: spacing[6],
                  opacity: loading ? 0.85 : 1,
                  ...ambientShadow,
                  shadowOpacity: 0.18,
                  shadowRadius: 16,
                  shadowColor: colors.primary,
                },
              ]}
            >
              <LinearGradient
                {...primaryGradient}
                style={{
                  paddingVertical: spacing[4],
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 54,
                }}
              >
                {loading ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={[typography.bodyLg, { fontWeight: "800", color: colors.onPrimary, letterSpacing: 0.3 }]}>
                    Create Your Account
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(520).delay(240)} style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing[5] }}>
            <LinearGradient
              colors={["transparent", "rgba(203, 195, 215, 0.6)", "transparent"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ flex: 1, height: 1 }}
            />
            <Text style={[typography.labelMd, { marginHorizontal: spacing[4], color: colors.muted, fontWeight: "700" }]}>
              OR
            </Text>
            <LinearGradient
              colors={["transparent", "rgba(203, 195, 215, 0.6)", "transparent"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ flex: 1, height: 1 }}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(520).delay(280)}>
            {Platform.OS === "ios" && (
              <TouchableOpacity
                onPress={handleApple}
                disabled={loading}
                activeOpacity={0.85}
                style={{
                  backgroundColor: "#0a0a0c",
                  borderRadius: 14,
                  height: 52,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  marginBottom: spacing[3],
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.08)",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Ionicons name="logo-apple" size={20} color="#fff" />
                <Text style={[typography.bodyMd, { fontSize: 15, fontWeight: "600", color: "#fff" }]}>
                  Continue with Apple
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleGoogle}
              disabled={loading}
              activeOpacity={0.85}
              style={{
                backgroundColor: "rgba(255,255,255,0.95)",
                borderRadius: 14,
                height: 52,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                marginBottom: spacing[5],
                ...borderGhostOutline,
                borderColor: "rgba(203, 195, 215, 0.35)",
              }}
            >
              <Ionicons name="logo-google" size={18} color="#4285F4" />
              <Text style={[typography.bodyMd, { fontSize: 15, fontWeight: "600", color: colors.onSurface }]}>
                Continue with Google
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(520).delay(320)}
            style={{
              borderRadius: radius.md,
              overflow: "hidden",
              marginBottom: spacing[5],
              borderWidth: 1,
              borderColor: "rgba(107, 56, 212, 0.14)",
            }}
          >
            <LinearGradient
              colors={["rgba(239, 244, 255, 0.95)", "rgba(255,255,255,0.88)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                padding: spacing[4],
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
              }}
            >
              <LinearGradient
                {...primaryGradient}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radius.full,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="shield-checkmark" size={22} color={colors.onPrimary} />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyMd, { fontWeight: "800", marginBottom: 2 }]}>Secure & Simple</Text>
                <Text style={[typography.bodyMd, { fontSize: 12, color: colors.onSurfaceVariant, lineHeight: 17 }]}>
                  {"Military-grade encryption for your family's financial security."}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(520).delay(340)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              marginBottom: spacing[5],
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.65)",
              alignSelf: "center",
              borderWidth: 1,
              borderColor: "rgba(203, 195, 215, 0.35)",
            }}
          >
            <Text style={[typography.labelMd, { fontSize: 10, color: colors.onSurfaceVariant, fontWeight: "700" }]}>
              SECURED BY
            </Text>
            <Image source={STRIPE_WORDMARK} resizeMode="contain" accessibilityLabel="Stripe" style={{ width: 52, height: 16 }} />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(520).delay(360)} style={{ alignItems: "center", marginBottom: spacing[5] }}>
            <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant }]}>
              Already have an account?{" "}
              <Text onPress={() => router.push(routes.auth.emailSignin)} style={{ fontWeight: "800", color: colors.primary }}>
                Log In
              </Text>
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(520).delay(380)}
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: spacing[6],
            }}
          >
            <Text
              onPress={() => Linking.openURL(PRIVACY_URL)}
              style={[
                typography.labelMd,
                {
                  fontSize: 11,
                  color: colors.muted,
                  fontWeight: "700",
                  letterSpacing: 0.5,
                },
              ]}
            >
              PRIVACY POLICY
            </Text>
            <Text
              onPress={() => Linking.openURL(TERMS_URL)}
              style={[
                typography.labelMd,
                {
                  fontSize: 11,
                  color: colors.muted,
                  fontWeight: "700",
                  letterSpacing: 0.5,
                },
              ]}
            >
              TERMS OF SERVICE
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
