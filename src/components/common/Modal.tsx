import React from "react";
import {
  Modal as RNModal,
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from "react-native";

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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  content: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
});
