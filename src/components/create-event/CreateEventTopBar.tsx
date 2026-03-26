import React from "react";
import { View, TouchableOpacity } from "react-native";
import { ArrowLeft, Sparkles } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FOREST } from "./designInviteTheme";

type CreateEventTopBarProps = {
  onBack: () => void;
  onSparklesPress?: () => void;
};

export default function CreateEventTopBar({ onBack, onSparklesPress }: CreateEventTopBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingTop: insets.top + 4,
        paddingHorizontal: 8,
        paddingBottom: 8,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View style={{ flex: 1, alignItems: "flex-start" }}>
        <TouchableOpacity
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{ padding: 8 }}
        >
          <ArrowLeft size={22} color={FOREST} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ flex: 1, alignItems: "flex-end" }}>
        <TouchableOpacity
          onPress={onSparklesPress}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{ padding: 8 }}
          disabled={!onSparklesPress}
        >
          <Sparkles size={22} color={FOREST} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
