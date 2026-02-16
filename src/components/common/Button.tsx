import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";

export type ButtonVariant = "primary" | "outline" | "ghost";

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

const variantStyles: Record<
  ButtonVariant,
  { container: ViewStyle; text: TextStyle }
> = {
  primary: {
    container: {
      backgroundColor: "#8B5CF6",
      borderWidth: 0,
      shadowColor: "#8B5CF6",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
    },
    text: { color: "#FFFFFF", fontWeight: "800" },
  },
  outline: {
    container: {
      backgroundColor: "transparent",
      borderWidth: 2,
      borderColor: "#8B5CF6",
    },
    text: { color: "#8B5CF6", fontWeight: "700" },
  },
  ghost: {
    container: {
      backgroundColor: "#F3F4F6",
      borderWidth: 0,
    },
    text: { color: "#6B7280", fontWeight: "700" },
  },
};

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
  const v = variantStyles[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={[
        styles.base,
        v.container,
        disabled && styles.disabled,
        style,
      ]}
    >
      {leftIcon}
      <Text style={[styles.text, v.text, textStyle]}>{label}</Text>
      {rightIcon}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  text: {
    fontSize: 16,
  },
  disabled: {
    opacity: 0.6,
  },
});
