import React from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MessageSquare } from "lucide-react-native";
import { colors, primaryGradient, radius, ambientShadow } from "@/src/theme";

interface BottomActionButtonProps {
  bottomInset: number;
  onPress?: () => void;
  label?: string;
}

export default function BottomActionButton({
  bottomInset,
  onPress,
  label = "Send Invites via SMS",
}: BottomActionButtonProps) {
  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: bottomInset + 16,
        backgroundColor: colors.surfaceContainerLowest,
        ...Platform.select({
          ios: {
            shadowColor: colors.onSurface,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.08,
            shadowRadius: 24,
          },
          android: { elevation: 12 },
        }),
      }}
    >
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
        <LinearGradient
          {...primaryGradient}
          style={[
            {
              borderRadius: radius.md,
              paddingVertical: 18,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
            },
            ambientShadow,
          ]}
        >
          <MessageSquare size={20} color={colors.onPrimary} strokeWidth={2.5} />
          <Text
            style={{
              fontSize: 17,
              fontWeight: "800",
              color: colors.onPrimary,
              marginLeft: 10,
            }}
          >
            {label}
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}
