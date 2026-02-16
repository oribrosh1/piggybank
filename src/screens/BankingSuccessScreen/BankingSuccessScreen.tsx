import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CheckCircle,
  Clock,
  Shield,
  FileCheck,
  ArrowRight,
} from "lucide-react-native";
import { useBankingSuccessScreen } from "./useBankingSuccessScreen";

const VERIFICATION_STEPS = [
  { icon: "✅", text: "Personal information submitted", done: true },
  { icon: "✅", text: "Terms of Service accepted", done: true },
  { icon: "⏳", text: "Identity verification", done: false },
  { icon: "⏳", text: "Account approval", done: false },
];

export default function BankingSuccessScreen() {
  const insets = useSafeAreaInsets();
  const {
    scaleAnim,
    fadeAnim,
    pulseAnim,
    handleGoToCredit,
    handleGetVirtualCard,
  } = useBankingSuccessScreen();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#FFFFFF",
        paddingTop: insets.top,
      }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            alignItems: "center",
            marginBottom: 32,
            transform: [{ scale: scaleAnim }],
          }}
        >
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: "#E0F2FE",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#0EA5E9",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <CheckCircle size={64} color="#0EA5E9" strokeWidth={2.5} />
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "900",
              color: "#111827",
              textAlign: "center",
              marginBottom: 12,
              letterSpacing: -0.5,
            }}
          >
            Information Submitted! ✅
          </Text>

          <Text
            style={{
              fontSize: 16,
              color: "#6B7280",
              textAlign: "center",
              marginBottom: 40,
              lineHeight: 24,
              paddingHorizontal: 20,
            }}
          >
            Your information has been securely submitted to Stripe for
            verification.
          </Text>

          <View
            style={{
              backgroundColor: "#FEF3C7",
              borderRadius: 20,
              padding: 24,
              marginBottom: 24,
              borderWidth: 2,
              borderColor: "#FDE68A",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                marginBottom: 16,
              }}
            >
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: "#FBBF24",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Clock size={24} color="#FFFFFF" strokeWidth={2.5} />
                </View>
              </Animated.View>

              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "800",
                    color: "#92400E",
                    marginBottom: 6,
                  }}
                >
                  Verification In Progress
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#B45309",
                    lineHeight: 20,
                  }}
                >
                  Stripe is verifying your identity. This usually takes 1–3
                  business days.
                </Text>
              </View>
            </View>

            <View style={{ gap: 12 }}>
              {VERIFICATION_STEPS.map((step, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 8,
                  }}
                >
                  <Text style={{ fontSize: 16, marginRight: 12 }}>
                    {step.icon}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: step.done ? "600" : "500",
                      color: step.done ? "#92400E" : "#B45309",
                    }}
                  >
                    {step.text}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ gap: 16, marginBottom: 32 }}>
            <View
              style={{
                backgroundColor: "#F0F9FF",
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: "#DBEAFE",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Shield size={20} color="#0EA5E9" strokeWidth={2.5} />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: "#0C4A6E",
                    marginLeft: 10,
                  }}
                >
                  What Happens Next?
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 14,
                  color: "#075985",
                  lineHeight: 22,
                }}
              >
                Stripe will verify your identity. Once approved, you can receive
                payments to your balance and use your virtual card (CreditKid)
                when available.
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "#FEF2F2",
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: "#FECACA",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <FileCheck size={20} color="#EF4444" strokeWidth={2.5} />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: "#7F1D1D",
                    marginLeft: 10,
                  }}
                >
                  Why is KYC Required?
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 14,
                  color: "#991B1B",
                  lineHeight: 22,
                }}
              >
                Federal law requires identity verification for anyone receiving
                payments or using payment cards. This protects you and ensures
                compliance with financial regulations.
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: "#F9FAFB",
              borderRadius: 12,
              padding: 16,
              borderLeftWidth: 4,
              borderLeftColor: "#8B5CF6",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                color: "#4B5563",
                lineHeight: 20,
              }}
            >
              💡 <Text style={{ fontWeight: "700" }}>Tip:</Text> You can check
              your verification status anytime in the Credit tab. We'll notify
              you once your account is approved!
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: insets.bottom + 16,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#F3F4F6",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 10,
        }}
      >
        <TouchableOpacity
          onPress={handleGetVirtualCard}
          style={{
            backgroundColor: "#8B5CF6",
            borderRadius: 16,
            paddingVertical: 18,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
            shadowColor: "#8B5CF6",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <Text
            style={{
              fontSize: 17,
              fontWeight: "800",
              color: "#FFFFFF",
              marginRight: 8,
            }}
          >
            Get your virtual card
          </Text>
          <ArrowRight size={20} color="#FFFFFF" strokeWidth={3} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleGoToCredit}
          style={{
            backgroundColor: "transparent",
            borderRadius: 16,
            paddingVertical: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: "#8B5CF6",
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: "#8B5CF6",
              marginRight: 8,
            }}
          >
            Go to Credit
          </Text>
          <ArrowRight size={18} color="#8B5CF6" strokeWidth={3} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
