import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  colors,
  primaryGradient,
  radius,
  typography,
  ambientShadow,
} from "@/src/theme";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "ghost";

export interface ButtonProps {
  onPress: () => void;
  label: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Button({
  onPress,
  label,
  variant = "primary",
  disabled = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
}: ButtonProps) {
  if (variant === "primary") {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.primaryWrap,
          disabled && styles.disabled,
          pressed && styles.pressedOpacity,
          style,
        ]}
      >
        <LinearGradient {...primaryGradient} style={[styles.gradientFill, ambientShadow]}>
          <View style={styles.innerRow}>
            {leftIcon}
            <Text style={[typography.headlineSm, styles.primaryText, textStyle]}>{label}</Text>
            {rightIcon}
          </View>
        </LinearGradient>
      </Pressable>
    );
  }

  if (variant === "secondary") {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.base,
          styles.secondaryContainer,
          pressed && styles.pressedOpacity,
          disabled && styles.disabled,
          style,
        ]}
      >
        <View style={styles.innerRow}>
          {leftIcon}
          <Text
            style={[
              typography.headlineSm,
              { color: colors.onPrimaryFixedVariant },
              textStyle,
            ]}
          >
            {label}
          </Text>
          {rightIcon}
        </View>
      </Pressable>
    );
  }

  if (variant === "tertiary") {
    return (
      <Pressable onPress={onPress} disabled={disabled} style={[styles.base, styles.tertiaryPad, disabled && styles.disabled, style]}>
        {({ pressed }) => (
          <View style={styles.innerRow}>
            {leftIcon}
            <Text
              style={[
                typography.bodyLg,
                {
                  color: colors.primary,
                  textDecorationLine: pressed ? "underline" : "none",
                  opacity: pressed ? 0.88 : 1,
                },
                textStyle,
              ]}
            >
              {label}
            </Text>
            {rightIcon}
          </View>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles.ghostContainer,
        pressed && styles.pressedOpacity,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.innerRow}>
        {leftIcon}
        <Text
          style={[typography.bodyLg, { color: colors.onSurfaceVariant }, textStyle]}
        >
          {label}
        </Text>
        {rightIcon}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primaryWrap: {
    borderRadius: radius.full,
    overflow: "hidden",
  },
  base: {
    borderRadius: radius.full,
    minHeight: 52,
    justifyContent: "center",
  },
  gradientFill: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: radius.full,
  },
  innerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryText: {
    color: colors.onPrimary,
  },
  secondaryContainer: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  tertiaryPad: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: "transparent",
  },
  ghostContainer: {
    backgroundColor: colors.surfaceContainerLow,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  pressedOpacity: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.5,
  },
});
