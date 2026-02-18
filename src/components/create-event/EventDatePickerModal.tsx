import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

interface EventDatePickerModalProps {
  visible: boolean;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

export default function EventDatePickerModal({
  visible,
  selectedDate,
  onDateChange,
  onConfirm,
  onCancel,
}: EventDatePickerModalProps) {
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
          <Text style={{ fontSize: 22, fontWeight: "800", color: "#06D6A0", marginBottom: 20, textAlign: "center" }}>
            📅 Select Event Date
          </Text>
          <View style={{ alignItems: "center" }}>
            <DateTimePicker
              testID="datePicker"
              value={selectedDate}
              mode="date"
              display="spinner"
              minimumDate={new Date()}
              onChange={(_, date) => date && onDateChange(date)}
            />
          </View>
          <View style={{ marginTop: 20, gap: 12 }}>
            <TouchableOpacity
              onPress={() => onConfirm(selectedDate)}
              style={{ backgroundColor: "#06D6A0", borderRadius: 16, paddingVertical: 16, alignItems: "center" }}
            >
              <Text style={{ fontSize: 16, fontWeight: "800", color: "#FFFFFF" }}>Confirm Date</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onCancel}
              style={{ backgroundColor: "#F3F4F6", borderRadius: 16, paddingVertical: 14, alignItems: "center" }}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#6B7280" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
