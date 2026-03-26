import React from "react";
import { View, Text, Animated } from "react-native";
import CreateEventTopBar from "./CreateEventTopBar";
import { FOREST, INPUT_BG, TRACK } from "./designInviteTheme";

type EventDetailsScreenHeaderProps = {
  progressWidth: Animated.AnimatedInterpolation<string | number>;
  progressPercentLabel: string;
  stepLabel?: string;
  onBack: () => void;
};

export default function EventDetailsScreenHeader(props: EventDetailsScreenHeaderProps) {
  const { progressWidth, progressPercentLabel, stepLabel = "STEP 2 OF 4", onBack } = props;
  return (
    <View style={{ backgroundColor: INPUT_BG, paddingBottom: 8 }}>
      <CreateEventTopBar onBack={onBack} />
      <View style={{ paddingHorizontal: 20, paddingTop: 4 }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: "800",
            color: FOREST,
            letterSpacing: 1.2,
            marginBottom: 6,
          }}
        >
          {stepLabel}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ fontSize: 26, fontWeight: "800", color: FOREST, letterSpacing: -0.5 }}>Design your invitation</Text>
            <Text style={{ fontSize: 14, fontWeight: "500", color: "#4B5563", marginTop: 8, lineHeight: 20 }}>
              We&apos;ll use your answers to generate a unique poster and fill in your event.
            </Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: "800", color: FOREST }}>{progressPercentLabel}</Text>
        </View>
        <View
          style={{
            height: 8,
            backgroundColor: TRACK,
            borderRadius: 4,
            overflow: "hidden",
            marginBottom: 8,
          }}
        >
          <Animated.View
            style={{
              height: "100%",
              backgroundColor: FOREST,
              width: progressWidth,
              borderRadius: 4,
            }}
          />
        </View>
      </View>
    </View>
  );
}
