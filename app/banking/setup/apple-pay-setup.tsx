import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Check, Apple } from "lucide-react-native";
import { useState } from "react";
import { routes } from "@/types/routes";

export default function ApplePaySetupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [applePayConnected, setApplePayConnected] = useState(false);

  const handleConnectApplePay = () => {
    // Simulate Apple Pay connection
    setApplePayConnected(true);
  };

  const handleFinish = () => {
    router.push({
      pathname: routes.banking.setup.success,
      params: { applePayConnected: applePayConnected.toString() },
    });
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: "#FFFFFF", paddingTop: insets.top }}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 16,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#000000" />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: "#000000",
            marginLeft: 12,
          }}
        >
          Apple Pay Setup
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <View style={{ flexDirection: "row", gap: 6 }}>
          <View
            style={{
              flex: 1,
              height: 4,
              backgroundColor: "#10B981",
              borderRadius: 2,
            }}
          />
          <View
            style={{
              flex: 1,
              height: 4,
              backgroundColor: "#10B981",
              borderRadius: 2,
            }}
          />
          <View
            style={{
              flex: 1,
              height: 4,
              backgroundColor: "#10B981",
              borderRadius: 2,
            }}
          />
          <View
            style={{
              flex: 1,
              height: 4,
              backgroundColor: "#10B981",
              borderRadius: 2,
            }}
          />
        </View>
        <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 8 }}>
          Step 4 of 4
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Form Title */}
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            color: "#000000",
            marginBottom: 8,
          }}
        >
          Connect Apple Pay
        </Text>
        <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 32 }}>
          Use your balance instantly with Apple Pay on all your devices
        </Text>

        {/* Apple Pay Card */}
        <View
          style={{
            backgroundColor: "#000000",
            borderRadius: 16,
            padding: 24,
            marginBottom: 32,
            alignItems: "center",
          }}
        >
          <Apple size={48} color="#FFFFFF" />
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: "#FFFFFF",
              marginTop: 16,
            }}
          >
            Apple Pay
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.7)",
              marginTop: 8,
              textAlign: "center",
            }}
          >
            Secure payment with a single touch
          </Text>
        </View>

        {/* Features */}
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: "#000000",
            marginBottom: 12,
          }}
        >
          Why Connect Apple Pay?
        </Text>
        <View style={{ gap: 12, marginBottom: 32 }}>
          <View
            style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                backgroundColor: "#10B981",
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 2,
              }}
            >
              <Check size={14} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: "#000000" }}
              >
                Fast & Convenient
              </Text>
              <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                Pay with just a tap or glance on your device
              </Text>
            </View>
          </View>

          <View
            style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                backgroundColor: "#10B981",
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 2,
              }}
            >
              <Check size={14} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: "#000000" }}
              >
                Highly Secure
              </Text>
              <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                Your card details are never shared with merchants
              </Text>
            </View>
          </View>

          <View
            style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                backgroundColor: "#10B981",
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 2,
              }}
            >
              <Check size={14} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: "#000000" }}
              >
                Works Everywhere
              </Text>
              <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                Use it on millions of websites and in stores worldwide
              </Text>
            </View>
          </View>
        </View>

        {/* Connection Status */}
        {applePayConnected && (
          <View
            style={{
              backgroundColor: "#F0FDF4",
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: "#D1FAE5",
              marginBottom: 24,
              flexDirection: "row",
              gap: 12,
              alignItems: "center",
            }}
          >
            <Check size={24} color="#10B981" />
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: "#065F46" }}
              >
                Apple Pay Connected!
              </Text>
              <Text style={{ fontSize: 12, color: "#047857", marginTop: 4 }}>
                You can now use Apple Pay to spend your balance
              </Text>
            </View>
          </View>
        )}

        {/* Info Box */}
        <View
          style={{
            backgroundColor: "#F9FAFB",
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: "#000000",
              marginBottom: 8,
            }}
          >
            💡 Pro Tip
          </Text>
          <Text style={{ fontSize: 12, color: "#6B7280" }}>
            You can add multiple cards to Apple Pay and switch between them
            during checkout for maximum flexibility.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 16,
          gap: 12,
        }}
      >
        {!applePayConnected && (
          <TouchableOpacity
            onPress={handleConnectApplePay}
            style={{
              backgroundColor: "#000000",
              borderRadius: 10,
              paddingVertical: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Apple size={20} color="#FFFFFF" />
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF" }}>
              Connect Apple Pay
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={handleFinish}
          style={{
            backgroundColor: "#10B981",
            borderRadius: 10,
            paddingVertical: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF" }}>
            {applePayConnected ? "Complete Setup" : "Skip for Now"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            borderWidth: 1.5,
            borderColor: "#E5E7EB",
            borderRadius: 10,
            paddingVertical: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#000000" }}>
            Back
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
