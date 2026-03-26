import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLoginScreen } from "./useLoginScreen";

const TERMS_URL = "https://creditkid.vercel.app/terms";
const PRIVACY_URL = "https://creditkid.vercel.app/privacy";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const {
    isAuthenticating,
    handleAppleSignIn,
    handleEmailSignIn,
    handleSignUp,
    handleGoogleSignIn,
  } = useLoginScreen();

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F0FF" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
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
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <Text style={{ fontSize: 14, color: "#7C3AED", fontWeight: "500" }}>
              notifications
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "800",
              color: "#1F2937",
              lineHeight: 36,
            }}
          >
            Give Your Child the{"\n"}
            <Text
              style={{
                fontStyle: "italic",
                color: "#7C3AED",
                fontWeight: "800",
              }}
            >
              Gift of Choice.
            </Text>
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: "#6B7280",
              lineHeight: 22,
              marginTop: 12,
            }}
          >
            Birthday money they can spend anywhere, blessing cards they'll
            remember forever — all in one app.
          </Text>
        </View>

        {/* Get Started Button */}
        <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
          <TouchableOpacity
            onPress={handleSignUp}
            activeOpacity={0.85}
            style={{
              backgroundColor: "#F59E0B",
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#F59E0B",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFF" }}>
              Get Started
            </Text>
          </TouchableOpacity>
        </View>

        {/* Video Section */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <View
            style={{
              backgroundColor: "#E5E7EB",
              borderRadius: 16,
              height: 200,
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "rgba(255,255,255,0.9)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIcons name="play-arrow" size={32} color="#374151" />
            </View>
          </View>
          <TouchableOpacity style={{ alignItems: "center", marginTop: 8 }}>
            <Text style={{ fontSize: 13, color: "#7C3AED", fontWeight: "600" }}>
              See How It Works
            </Text>
          </TouchableOpacity>
        </View>

        {/* Safety First - Parental Controls */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: "#7C3AED",
              letterSpacing: 1.5,
              marginBottom: 4,
            }}
          >
            SAFETY FIRST
          </Text>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "800",
              color: "#1F2937",
              marginBottom: 16,
            }}
          >
            You're Always in Control
          </Text>

          <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
            <ControlCard
              icon="account-balance-wallet"
              label="Freeze Card"
              description="Instantly lock any card from your phone."
              color="#7C3AED"
            />
            <ControlCard
              icon="payments"
              label="Spending Limits"
              description="Daily or weekly caps that you manage."
              color="#7C3AED"
            />
          </View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <ControlCard
              icon="block"
              label="Block Types"
              description="Restrict specific merchant categories."
              color="#7C3AED"
            />
            <ControlCard
              icon="bolt"
              label="Live Activity"
              description="Real-time alerts for every transaction."
              color="#7C3AED"
            />
          </View>
        </View>

        {/* Gift Card Stats */}
        <View style={{ paddingHorizontal: 24, marginBottom: 28 }}>
          <LinearGradient
            colors={["#7C3AED", "#5B21B6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, padding: 24 }}
          >
            <Text
              style={{
                fontSize: 36,
                fontWeight: "900",
                color: "#FFF",
                marginBottom: 4,
              }}
            >
              $27B
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.8)",
                marginBottom: 20,
              }}
            >
              unused in drawers across the country
            </Text>
            <Text
              style={{
                fontSize: 36,
                fontWeight: "900",
                color: "#FFF",
                marginBottom: 4,
              }}
            >
              $44
            </Text>
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>
              average wasted balance per household
            </Text>
          </LinearGradient>
        </View>

        {/* Auth Buttons */}
        <View style={{ paddingHorizontal: 24, gap: 12 }}>
          {Platform.OS === "ios" && (
            <TouchableOpacity
              onPress={handleAppleSignIn}
              activeOpacity={0.85}
              disabled={isAuthenticating}
              style={{
                backgroundColor: "#FFF",
                borderRadius: 14,
                height: 52,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            >
              <Ionicons name="logo-apple" size={20} color="#000" />
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#1F2937" }}>
                Continue with Apple
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleGoogleSignIn}
            activeOpacity={0.85}
            disabled={isAuthenticating}
            style={{
              backgroundColor: "#FFF",
              borderRadius: 14,
              height: 52,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            <Ionicons name="logo-google" size={18} color="#4285F4" />
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#1F2937" }}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSignUp}
            activeOpacity={0.85}
            style={{
              backgroundColor: "#F59E0B",
              borderRadius: 14,
              height: 52,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Ionicons name="mail-outline" size={18} color="#FFF" />
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFF" }}>
              Sign up with Email
            </Text>
          </TouchableOpacity>
        </View>

        {/* Login Link */}
        <View style={{ alignItems: "center", marginTop: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 14, color: "#6B7280" }}>
            Already have an account?{" "}
            <Text
              onPress={handleEmailSignIn}
              style={{ fontWeight: "700", color: "#7C3AED" }}
            >
              Log in
            </Text>
          </Text>
        </View>

        {/* Footer Links */}
        <View style={{ paddingHorizontal: 24, marginTop: 8 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 20,
              marginBottom: 8,
            }}
          >
            <Text
              onPress={() => Linking.openURL(PRIVACY_URL)}
              style={{ fontSize: 12, color: "#9CA3AF", fontWeight: "500" }}
            >
              Privacy Policy
            </Text>
            <Text
              onPress={() => Linking.openURL(TERMS_URL)}
              style={{ fontSize: 12, color: "#9CA3AF", fontWeight: "500" }}
            >
              Terms of Service
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 20,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 12, color: "#9CA3AF", fontWeight: "500" }}>
              Contact Us
            </Text>
            <Text style={{ fontSize: 12, color: "#9CA3AF", fontWeight: "500" }}>
              Cookie Policy
            </Text>
          </View>
          <Text
            style={{
              fontSize: 11,
              color: "#D1D5DB",
              textAlign: "center",
              lineHeight: 16,
            }}
          >
            © 2024 CreditKid, Inc. All rights reserved. Banking services provided
            by our partner banks. Member FDIC.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function ControlCard({
  icon,
  label,
  description,
  color,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  label: string;
  description: string;
  color: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#FFF",
        borderRadius: 14,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: "#F3EAFF",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "700",
          color: "#1F2937",
          marginBottom: 4,
        }}
      >
        {label}
      </Text>
      <Text style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 16 }}>
        {description}
      </Text>
    </View>
  );
}
