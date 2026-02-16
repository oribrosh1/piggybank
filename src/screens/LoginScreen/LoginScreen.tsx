import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  Modal,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as LocalAuthentication from "expo-local-authentication";
import * as AppleAuthentication from "expo-apple-authentication";
import { LinearGradient } from "expo-linear-gradient";
import { useLoginScreen } from "./useLoginScreen";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const {
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
  } = useLoginScreen();

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF" }}>
      <LinearGradient
        colors={["#FBBF24", "#F59E0B"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
      />

      {/* Floating decorative elements */}
      <Animated.View
        style={{
          position: "absolute",
          top: 60,
          left: 30,
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: "#FCD34D",
          opacity: 0.9,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 8,
        }}
      >
        <View
          style={{
            position: "absolute",
            top: 5,
            left: 8,
            width: 15,
            height: 15,
            borderRadius: 7.5,
            backgroundColor: "rgba(255,255,255,0.4)",
          }}
        />
      </Animated.View>

      <Animated.View
        style={{
          position: "absolute",
          top: 80,
          right: 80,
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: "#60A5FA",
          opacity: 0.95,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 6,
        }}
      >
        <View
          style={{
            position: "absolute",
            top: 3,
            left: 5,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: "rgba(255,255,255,0.35)",
          }}
        />
      </Animated.View>

      <View style={{ position: "absolute", top: 120, right: 40 }}>
        <Text style={{ fontSize: 40 }}>⭐</Text>
      </View>

      <Animated.View
        style={{
          position: "absolute",
          top: 200,
          left: 20,
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: "#FCD34D",
          opacity: 0.85,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 5,
        }}
      >
        <View
          style={{
            position: "absolute",
            top: 2,
            left: 4,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: "rgba(255,255,255,0.3)",
          }}
        />
      </Animated.View>

      <View style={{ position: "absolute", top: 240, right: 50 }}>
        <Text style={{ fontSize: 32 }}>⭐</Text>
      </View>

      <Animated.View
        style={{
          position: "absolute",
          bottom: 220,
          left: 40,
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: "#FCD34D",
          opacity: 0.8,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 6,
        }}
      >
        <View
          style={{
            position: "absolute",
            top: 3,
            left: 6,
            width: 11,
            height: 11,
            borderRadius: 5.5,
            backgroundColor: "rgba(255,255,255,0.35)",
          }}
        />
      </Animated.View>

      <Animated.View
        style={{
          position: "absolute",
          bottom: 140,
          right: 20,
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: "#FCD34D",
          opacity: 0.9,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 8,
        }}
      >
        <View
          style={{
            position: "absolute",
            top: 4,
            left: 7,
            width: 13,
            height: 13,
            borderRadius: 6.5,
            backgroundColor: "rgba(255,255,255,0.4)",
          }}
        />
      </Animated.View>

      <Animated.View
        style={{
          position: "absolute",
          top: 160,
          right: 20,
          transform: [{ translateY: floatTranslate1 }],
        }}
      >
        <Text style={{ fontSize: 60 }}>🎈</Text>
      </Animated.View>

      <Animated.View
        style={{
          position: "absolute",
          top: 250,
          left: 30,
          transform: [{ translateY: floatTranslate2 }],
        }}
      >
        <Text style={{ fontSize: 50 }}>✨</Text>
      </Animated.View>

      <Animated.View style={{ position: "absolute", top: 150, left: 40, opacity: 0.6 }}>
        <Text style={{ fontSize: 40 }}>🎊</Text>
      </Animated.View>

      <Animated.View style={{ position: "absolute", bottom: 200, right: 30, opacity: 0.5 }}>
        <Text style={{ fontSize: 45 }}>🎉</Text>
      </Animated.View>

      <ScrollView
        style={{ flex: 1, zIndex: 10 }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: "center", marginBottom: 20, marginTop: 40 }}>
          <Animated.View style={{ transform: [{ translateY: bounceTranslate }] }}>
            <Text style={{ fontSize: 80, marginBottom: 20, marginTop: 40, textAlign: "center" }}>
              🎉
            </Text>
          </Animated.View>

          <Text
            style={{
              fontSize: 48,
              fontWeight: "900",
              color: "#FFFFFF",
              marginBottom: 8,
              textAlign: "center",
              letterSpacing: -1,
            }}
          >
            EVENT
          </Text>
          <Text
            style={{
              fontSize: 48,
              fontWeight: "900",
              color: "#FFFFFF",
              marginBottom: 20,
              textAlign: "center",
              letterSpacing: -1,
            }}
          >
            CREATOR
          </Text>

          <View
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.25)",
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 20,
              marginBottom: 24,
              borderWidth: 2,
              borderColor: "rgba(255, 255, 255, 0.4)",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: "#FFFFFF",
                fontWeight: "700",
                textAlign: "center",
                letterSpacing: 0.5,
              }}
            >
              ✨ MAKE MAGIC HAPPEN ✨
            </Text>
          </View>

          <Text
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,0.95)",
              fontWeight: "600",
              textAlign: "center",
              lineHeight: 26,
            }}
          >
            Create unforgettable events and invite your closest friends
          </Text>
        </View>

        <View style={{ marginBottom: 20, gap: 12 }}>
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: 16,
              padding: 14,
              gap: 12,
              borderWidth: 1.5,
              borderColor: "rgba(255, 255, 255, 0.3)",
            }}
          >
            <Text style={{ fontSize: 26 }}>🎂</Text>
            <View style={{ flex: 1, justifyContent: "center" }}>
              <Text style={{ fontSize: 13, fontWeight: "800", color: "#FFFFFF", marginBottom: 2 }}>
                Birthdays & Bar Mitzvahs
              </Text>
              <Text style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.8)", fontWeight: "500" }}>
                Pick your vibe
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: 16,
              padding: 14,
              gap: 12,
              borderWidth: 1.5,
              borderColor: "rgba(255, 255, 255, 0.3)",
            }}
          >
            <Text style={{ fontSize: 26 }}>👥</Text>
            <View style={{ flex: 1, justifyContent: "center" }}>
              <Text style={{ fontSize: 13, fontWeight: "800", color: "#FFFFFF", marginBottom: 2 }}>
                Invite Everyone
              </Text>
              <Text style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.8)", fontWeight: "500" }}>
                All your contacts at once
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: 16,
              padding: 14,
              gap: 12,
              borderWidth: 1.5,
              borderColor: "rgba(255, 255, 255, 0.3)",
            }}
          >
            <Text style={{ fontSize: 26 }}>📍</Text>
            <View style={{ flex: 1, justifyContent: "center" }}>
              <Text style={{ fontSize: 13, fontWeight: "800", color: "#FFFFFF", marginBottom: 2 }}>
                Share Your Location
              </Text>
              <Text style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.8)", fontWeight: "500" }}>
                Everyone knows where to go
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: 16,
              padding: 14,
              gap: 12,
              borderWidth: 1.5,
              borderColor: "rgba(255, 255, 255, 0.3)",
            }}
          >
            <Text style={{ fontSize: 26 }}>✅</Text>
            <View style={{ flex: 1, justifyContent: "center" }}>
              <Text style={{ fontSize: 13, fontWeight: "800", color: "#FFFFFF", marginBottom: 2 }}>
                Track Who&apos;s Coming
              </Text>
              <Text style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.8)", fontWeight: "500" }}>
                See yes or no instantly
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          backgroundColor: "transparent",
        }}
      >
        <TouchableOpacity
          onPress={() => setShowAuthModal(true)}
          activeOpacity={0.85}
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 20,
            paddingVertical: 18,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 6,
            marginBottom: 10,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "800",
              color: "#F59E0B",
              letterSpacing: 0.5,
            }}
          >
            Get Started ✨
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 10,
            color: "rgba(0, 0, 0, 0.5)",
            textAlign: "center",
            fontWeight: "500",
            lineHeight: 14,
          }}
        >
          By continuing, you agree to our <Text style={{ fontWeight: "700" }}>Terms & Privacy Policy</Text>
        </Text>
      </View>

      <Modal
        visible={showAuthModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAuthModal(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setShowAuthModal(false)}
          />

          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 20,
              paddingBottom: insets.bottom + 20,
              paddingHorizontal: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 20,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 24 }}>
              <View
                style={{
                  width: 40,
                  height: 4,
                  backgroundColor: "#E5E7EB",
                  borderRadius: 2,
                  marginBottom: 16,
                }}
              />
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: "#1F2937",
                  marginBottom: 4,
                }}
              >
                Choose Sign In Method
              </Text>
              <Text style={{ fontSize: 14, color: "#6B7280", fontWeight: "500" }}>
                Select how you&apos;d like to continue
              </Text>
            </View>

            {Platform.OS === "ios" && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={16}
                style={{ height: 54, marginBottom: 12 }}
                onPress={() => {
                  setShowAuthModal(false);
                  handleAppleSignIn();
                }}
              />
            )}

            <TouchableOpacity
              onPress={() => {
                setShowAuthModal(false);
                handleGoogleSignIn();
              }}
              activeOpacity={0.85}
              disabled={isAuthenticating}
              style={{
                backgroundColor: isAuthenticating ? "#CCCCCC" : "#4285F4",
                borderRadius: 16,
                height: 54,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                marginBottom: 12,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Ionicons name="logo-google" size={22} color="white" />
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>
                Continue with Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowAuthModal(false);
                handleEmailSignIn();
              }}
              activeOpacity={0.85}
              style={{
                backgroundColor: "#F59E0B",
                borderRadius: 16,
                height: 54,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                marginBottom: 12,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Ionicons name="mail-outline" size={22} color="white" />
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>
                Continue with Email
              </Text>
            </TouchableOpacity>

            {hasBiometrics && (
              <TouchableOpacity
                onPress={() => {
                  setShowAuthModal(false);
                  handleSignIn();
                }}
                activeOpacity={0.85}
                disabled={isAuthenticating}
                style={{
                  backgroundColor: "#1F2937",
                  borderRadius: 16,
                  height: 54,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  marginBottom: 12,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Ionicons
                  name={
                    biometricType === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
                      ? "scan"
                      : "finger-print"
                  }
                  size={22}
                  color="white"
                />
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>
                  {biometricType === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
                    ? "Use Face ID"
                    : "Use Touch ID"}
                </Text>
              </TouchableOpacity>
            )}

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginVertical: 16,
              }}
            >
              <View style={{ flex: 1, height: 1, backgroundColor: "#E5E7EB" }} />
              <Text style={{ marginHorizontal: 12, fontSize: 12, color: "#9CA3AF", fontWeight: "600" }}>
                OR
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: "#E5E7EB" }} />
            </View>

            <TouchableOpacity
              onPress={() => {
                setShowAuthModal(false);
                handleSignUp();
              }}
              activeOpacity={0.85}
              style={{
                backgroundColor: "#F3F4F6",
                borderRadius: 16,
                height: 54,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#F59E0B" }}>
                Create New Account
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowAuthModal(false)}
              activeOpacity={0.7}
              style={{ alignItems: "center", paddingVertical: 8 }}
            >
              <Text style={{ fontSize: 14, color: "#6B7280", fontWeight: "600" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
