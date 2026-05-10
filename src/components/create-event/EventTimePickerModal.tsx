import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { colors, spacing } from "@/src/theme/designTokens";

interface EventTimePickerModalProps {
  visible: boolean;
  selectedTime: Date;
  onTimeChange: (time: Date) => void;
  onConfirm: (time: Date) => void;
  onCancel: () => void;
}

export default function EventTimePickerModal({
  visible,
  selectedTime,
  onTimeChange,
  onConfirm,
  onCancel,
}: EventTimePickerModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.6)" }}>
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 24,
            padding: 24,
            width: "85%",
            maxWidth: 350,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 24,
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.primary, marginBottom: 20, textAlign: "center" }}>
            ⏰  Select Event Time
          </Text>
          <View style={{ alignItems: "center" }}>
            <DateTimePicker
              testID="timePicker"
              value={selectedTime}
              mode="time"
              display="spinner"
              minuteInterval={5}
              onChange={(_, time) => time && onTimeChange(time)}
            />
          </View>
          <View style={{ marginTop: 20, gap: 12 }}>
            <TouchableOpacity
              onPress={() => onConfirm(selectedTime)}
              style={{ backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: "center" }}
            >
              <Text style={{ fontSize: 16, fontWeight: "800", color: colors.onPrimary }}>Confirm Time</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onCancel}
              style={{ backgroundColor: "#F3F4F6", borderRadius: 16, paddingVertical: 14, alignItems: "center" }}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.onSurfaceVariant }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
