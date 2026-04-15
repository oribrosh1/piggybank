import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from "react-native";
import { colors, typography, radius, fontFamily } from "@/src/theme";

export interface InputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextInputProps["style"];
}

export default function Input({
  label,
  error,
  containerStyle,
  inputStyle,
  ...rest
}: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, error ? styles.inputError : null, inputStyle]}
        placeholderTextColor={colors.muted}
        {...rest}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    ...typography.bodyMd,
    fontFamily: fontFamily.title,
    color: colors.onSurface,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: fontFamily.body,
    color: colors.onSurface,
    borderWidth: 0,
  },
  inputError: {
    borderWidth: 2,
    borderColor: "rgba(239, 68, 68, 0.45)",
  },
  errorText: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: "#EF4444",
    marginTop: 4,
  },
});
