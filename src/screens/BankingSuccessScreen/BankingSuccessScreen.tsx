import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CheckCircle,
  Clock,
  Shield,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
} from "lucide-react-native";
import { useBankingSuccessScreen } from "./useBankingSuccessScreen";

export default function BankingSuccessScreen() {
  const insets = useSafeAreaInsets();
  const {
    scaleAnim,
    fadeAnim,
    pulseAnim,
    handleGoToCredit,
    handleRetry,
    isComplete,
    isFailed,
    isProvisioning,
    provisioning,
    steps,
    loading,
  } = useBankingSuccessScreen();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "transparent",
        paddingTop: insets.top,
      }}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: "transparent" }}
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
              backgroundColor: isComplete
                ? "#D1FAE5"
                : isFailed
                ? "#FEE2E2"
                : "#E0F2FE",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: isComplete
                ? "#10B981"
                : isFailed
                ? "#EF4444"
                : "#0EA5E9",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            {isComplete ? (
              <CheckCircle size={64} color="#10B981" strokeWidth={2.5} />
            ) : isFailed ? (
              <AlertTriangle size={64} color="#EF4444" strokeWidth={2.5} />
            ) : (
              <CheckCircle size={64} color="#0EA5E9" strokeWidth={2.5} />
            )}
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
            {isComplete
              ? "Your Card is Ready!"
              : isFailed
              ? "Setup Failed"
              : "Setting Up Your Account"}
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
            {isComplete
              ? "Your virtual card has been created and is ready to use."
              : isFailed
              ? provisioning?.error || "Something went wrong during setup."
              : "Your information has been submitted. We're setting everything up automatically."}
          </Text>

          {/* Progress Steps */}
          <View
            style={{
              backgroundColor: isComplete
                ? "#ECFDF5"
                : isFailed
                ? "#FEF2F2"
                : "#FEF3C7",
              borderRadius: 20,
              padding: 24,
              marginBottom: 24,
              borderWidth: 2,
              borderColor: isComplete
                ? "#A7F3D0"
                : isFailed
                ? "#FECACA"
                : "#FDE68A",
            }}
          >
            {isProvisioning && (
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
                    Setting Up...
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#B45309",
                      lineHeight: 20,
                    }}
                  >
                    This usually takes less than a minute.
                  </Text>
                </View>
              </View>
            )}

            <View style={{ gap: 12 }}>
              {steps.map((step, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 8,
                  }}
                >
                  {step.done ? (
                    <CheckCircle
                      size={20}
                      color="#10B981"
                      strokeWidth={2.5}
                      style={{ marginRight: 12 }}
                    />
                  ) : step.active ? (
                    <ActivityIndicator
                      size="small"
                      color="#F59E0B"
                      style={{ marginRight: 12, width: 20 }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: "#D1D5DB",
                        marginRight: 12,
                      }}
                    />
                  )}
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: step.done ? "600" : step.active ? "600" : "500",
                      color: step.done
                        ? "#065F46"
                        : step.active
                        ? "#92400E"
                        : "#9CA3AF",
                    }}
                  >
                    {step.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Info cards - only show when provisioning or loading */}
          {(isProvisioning || loading) && (
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
                    What's Happening?
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#075985",
                    lineHeight: 22,
                  }}
                >
                  We're automatically setting up your financial account and
                  virtual card. You'll be able to receive gifts and make
                  purchases once complete.
                </Text>
              </View>
            </View>
          )}
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
        {isFailed && provisioning?.retryable ? (
          <TouchableOpacity
            onPress={handleRetry}
            style={{
              backgroundColor: "#EF4444",
              borderRadius: 16,
              paddingVertical: 18,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
              shadowColor: "#EF4444",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <RefreshCw size={20} color="#FFFFFF" strokeWidth={3} />
            <Text
              style={{
                fontSize: 17,
                fontWeight: "800",
                color: "#FFFFFF",
                marginLeft: 8,
              }}
            >
              Retry Setup
            </Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          onPress={handleGoToCredit}
          style={{
            backgroundColor: isComplete ? "#8B5CF6" : "transparent",
            borderRadius: 16,
            paddingVertical: 18,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: isComplete ? 0 : 12,
            borderWidth: isComplete ? 0 : 2,
            borderColor: "#8B5CF6",
            shadowColor: isComplete ? "#8B5CF6" : "transparent",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isComplete ? 0.3 : 0,
            shadowRadius: 16,
            elevation: isComplete ? 8 : 0,
          }}
        >
          <Text
            style={{
              fontSize: 17,
              fontWeight: "800",
              color: isComplete ? "#FFFFFF" : "#8B5CF6",
              marginRight: 8,
            }}
          >
            {isComplete ? "Go to Credit" : "Go to Credit Tab"}
          </Text>
          <ArrowRight
            size={20}
            color={isComplete ? "#FFFFFF" : "#8B5CF6"}
            strokeWidth={3}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
