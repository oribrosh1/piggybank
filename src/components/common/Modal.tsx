import React from "react";
import {
  Modal as RNModal,
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { colors, radius, ambientShadow } from "@/src/theme";

export interface ModalProps {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
  /** Tap overlay to close (default true) */
  dismissOnOverlay?: boolean;
  contentStyle?: ViewStyle;
}

export default function Modal({
  visible,
  onRequestClose,
  children,
  dismissOnOverlay = true,
  contentStyle,
}: ModalProps) {
  return (
    <RNModal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onRequestClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={dismissOnOverlay ? onRequestClose : undefined}
        />
        <View style={[styles.content, contentStyle]}>{children}</View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(18, 28, 42, 0.45)",
  },
  content: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
    ...ambientShadow,
  },
});
