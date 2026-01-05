import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { routes } from "../../types/routes";

export default function CreateEventScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Floating animation
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Float animation for chatbot
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Pulse animation for ring
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [floatAnim, pulseAnim]);

  const floatTranslate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });

  return (
    <View
      style={{ flex: 1, backgroundColor: "#F0FFFE" }}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 24,
          backgroundColor: "#FBBF24",
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
        }}
      >
        <Text
          style={{
            fontSize: 32,
            fontWeight: "900",
            color: "#FFFFFF",
            marginBottom: 4,
          }}
        >
          CREATE EVENT 🎉
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.9)",
            fontWeight: "600",
          }}
        >
          Let AI help you create the perfect celebration
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* AI ChatBot Card - Main CTA */}
        <TouchableOpacity
          onPress={() => router.push(routes.createEvent.eventType)}
          activeOpacity={0.9}
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 28,
            padding: 32,
            marginBottom: 32,
            shadowColor: "#FBBF24",
            shadowOpacity: 0.2,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 12 },
            elevation: 8,
            borderWidth: 2,
            borderColor: "rgba(251, 191, 36, 0.15)",
            alignItems: "center",
          }}
        >
          <Animated.Text
            style={{
              fontSize: 80,
              marginBottom: 20,
              transform: [{ translateY: floatTranslate }],
            }}
          >
            🤖
          </Animated.Text>

          <Text
            style={{
              fontSize: 24,
              fontWeight: "900",
              color: "#FBBF24",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            SMART ASSISTANT
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: "#9CA3AF",
              textAlign: "center",
              marginBottom: 20,
              lineHeight: 18,
            }}
          >
            I'll guide you through creating an amazing event. Let's start now!
            🚀
          </Text>

          <View
            style={{
              backgroundColor: "#FBBF24",
              borderRadius: 16,
              paddingVertical: 14,
              paddingHorizontal: 24,
              width: "100%",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "900",
                color: "#FFFFFF",
                letterSpacing: 0.5,
              }}
            >
              START CREATING →
            </Text>
          </View>
        </TouchableOpacity>

        {/* What You'll Do Section */}
        <View style={{ marginBottom: 30 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "900",
              color: "#6B3AA0",
              marginBottom: 16,
              letterSpacing: 0.3,
            }}
          >
            THE MAGIC STEPS ✨
          </Text>

          <View style={{ gap: 12 }}>
            {/* Step 1 */}
            <View
              style={{
                flexDirection: "row",
                backgroundColor: "#FEF3C7",
                borderRadius: 18,
                padding: 16,
                gap: 14,
                borderLeftWidth: 5,
                borderLeftColor: "#FBBF24",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 28 }}>1️⃣</Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "900",
                    color: "#FBBF24",
                    marginBottom: 2,
                  }}
                >
                  PICK YOUR EVENT
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: "#B45309",
                    fontWeight: "500",
                  }}
                >
                  Bar Mitzvah or Birthday?
                </Text>
              </View>
            </View>

            {/* Step 2 */}
            <View
              style={{
                flexDirection: "row",
                backgroundColor: "#F3E8FF",
                borderRadius: 18,
                padding: 16,
                gap: 14,
                borderLeftWidth: 5,
                borderLeftColor: "#6B3AA0",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 28 }}>2️⃣</Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "900",
                    color: "#6B3AA0",
                    marginBottom: 2,
                  }}
                >
                  ADD THE DETAILS
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: "#7C3AED",
                    fontWeight: "500",
                  }}
                >
                  Age, date, time & location
                </Text>
              </View>
            </View>

            {/* Step 3 */}
            <View
              style={{
                flexDirection: "row",
                backgroundColor: "#FEF3C7",
                borderRadius: 18,
                padding: 16,
                gap: 14,
                borderLeftWidth: 5,
                borderLeftColor: "#FBBF24",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 28 }}>3️⃣</Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "900",
                    color: "#D97706",
                    marginBottom: 2,
                  }}
                >
                  INVITE YOUR CREW
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: "#B45309",
                    fontWeight: "500",
                  }}
                >
                  Add contacts & family
                </Text>
              </View>
            </View>

            {/* Step 4 */}
            <View
              style={{
                flexDirection: "row",
                backgroundColor: "#DBEAFE",
                borderRadius: 18,
                padding: 16,
                gap: 14,
                borderLeftWidth: 5,
                borderLeftColor: "#3B82F6",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 28 }}>4️⃣</Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "900",
                    color: "#1E40AF",
                    marginBottom: 2,
                  }}
                >
                  SEND & CELEBRATE
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: "#1E3A8A",
                    fontWeight: "500",
                  }}
                >
                  See who's coming in real time
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Fun Features */}
        <View style={{ marginBottom: 70 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "900",
              color: "#6B3AA0",
              marginBottom: 12,
              letterSpacing: 0.3,
            }}
          >
            WHY YOU'LL LOVE IT 💛
          </Text>

          <View style={{ gap: 10 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Text style={{ fontSize: 20 }}>⚡</Text>
              <Text
                style={{
                  fontSize: 13,
                  color: "#374151",
                  fontWeight: "600",
                  flex: 1,
                }}
              >
                Super fast - Create an event in 2 minutes
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Text style={{ fontSize: 20 }}>📱</Text>
              <Text
                style={{
                  fontSize: 13,
                  color: "#374151",
                  fontWeight: "600",
                  flex: 1,
                }}
              >
                Invite everyone at once, no one-by-one
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Text style={{ fontSize: 20 }}>✅</Text>
              <Text
                style={{
                  fontSize: 13,
                  color: "#374151",
                  fontWeight: "600",
                  flex: 1,
                }}
              >
                Know exactly who's coming instantly
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
