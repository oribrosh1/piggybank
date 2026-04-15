import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { colors, radius, spacing } from "@/src/theme";

export interface CardProps {
  children: React.ReactNode;
  /** Use "low" when nesting on surface_container_low */
  elevation?: "default" | "low";
  style?: ViewStyle;
}

/**
 * Tonal layering — no hard borders; depth via surface_container_lowest on parent section.
 */
export default function Card({ children, elevation = "default", style }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        elevation === "low" && styles.cardLow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: spacing[5],
  },
  cardLow: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing[4],
  },
});
