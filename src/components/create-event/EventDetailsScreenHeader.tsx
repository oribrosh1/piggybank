import React from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Sparkles } from "lucide-react-native";

type EventDetailsScreenHeaderProps = {
  progressWidth: Animated.AnimatedInterpolation<string | number>;
  isBirthday: boolean;
  onBack: () => void;
};

export default function EventDetailsScreenHeader(props: EventDetailsScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const { progressWidth, isBirthday, onBack } = props;
  const title = isBirthday ? "Tell us more" : "Event Details";
  const subtitle = isBirthday
    ? "Share the special details for this birthday celebration"
    : "Fill in the key information about your event";
  return (
    <View
      style={{
        backgroundColor: "#06D6A0",
        paddingTop: insets.top,
        paddingBottom: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      <View
        style={{
          paddingHorizontal: 20,
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
          <Text style={{ fontSize: 12, fontWeight: "700", color: "rgba(255, 255, 255, 0.8)", letterSpacing: 1 }}>
            STEP 2 OF 3
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
        <Animated.View style={{ height: "100%", backgroundColor: "#FFFFFF", width: progressWidth, borderRadius: 3 }} />
      </View>
      <View style={{ paddingHorizontal: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <Sparkles size={28} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={{ fontSize: 28, fontWeight: "900", color: "#FFFFFF", marginLeft: 12, letterSpacing: -0.5 }}>
            {title}
          </Text>
        </View>
        <Text style={{ fontSize: 15, color: "rgba(255, 255, 255, 0.9)", fontWeight: "500", lineHeight: 22 }}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}
