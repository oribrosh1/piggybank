import React from "react";
import { View, TouchableOpacity } from "react-native";
import { ArrowLeft, Sparkles } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "@/src/theme";

type CreateEventTopBarProps = {
  onBack: () => void;
  onSparklesPress?: () => void;
};

export default function CreateEventTopBar({ onBack, onSparklesPress }: CreateEventTopBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingTop: insets.top + spacing[1],
        paddingHorizontal: spacing[2],
        paddingBottom: spacing[2],
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
          <ArrowLeft size={22} color={colors.onSurface} strokeWidth={2.2} />
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
          <Sparkles size={22} color={colors.primary} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
