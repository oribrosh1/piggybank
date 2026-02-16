import React from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { ArrowLeft, FileText } from "lucide-react-native";

interface IdentityVerificationHeaderProps {
  progressWidth: Animated.AnimatedInterpolation<string | number>;
  onBack: () => void;
}

export default function IdentityVerificationHeader({
  progressWidth,
  onBack,
}: IdentityVerificationHeaderProps) {
  return (
    <View
      style={{
        backgroundColor: "#8B5CF6",
        paddingBottom: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          onPress={onBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: "rgba(255, 255, 255, 0.9)", letterSpacing: 1 }}>
            STEP 2 OF 2
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>
      <View
        style={{
          marginHorizontal: 20,
          height: 6,
          backgroundColor: "rgba(255, 255, 255, 0.25)",
          borderRadius: 3,
          overflow: "hidden",
          marginBottom: 20,
        }}
      >
        <Animated.View
          style={{
            height: "100%",
            backgroundColor: "#FFFFFF",
            width: progressWidth,
            borderRadius: 3,
          }}
        />
      </View>
      <View style={{ paddingHorizontal: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <FileText size={28} color="#FFFFFF" strokeWidth={2.5} />
          <Text
            style={{
              fontSize: 28,
              fontWeight: "900",
              color: "#FFFFFF",
              marginLeft: 12,
              letterSpacing: -0.5,
            }}
          >
            ID Verification
          </Text>
        </View>
        <Text
          style={{
            fontSize: 15,
            color: "rgba(255, 255, 255, 0.95)",
            fontWeight: "500",
            lineHeight: 22,
          }}
        >
          Upload a photo of your government-issued ID 🪪
        </Text>
      </View>
    </View>
  );
}
