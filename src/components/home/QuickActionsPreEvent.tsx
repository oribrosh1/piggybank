import { View, Text, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

interface Props {
  onViewGuestList: () => void;
  onSendReminder: () => void;
}

export default function QuickActionsPreEvent({
  onViewGuestList,
  onSendReminder,
}: Props) {
  return (
    <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
      <TouchableOpacity
        onPress={onViewGuestList}
        activeOpacity={0.85}
        style={{
          flex: 1,
          backgroundColor: "#FFF",
          borderRadius: 16,
          padding: 16,
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: "#F3EAFF",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10,
          }}
        >
          <Ionicons name="list" size={22} color="#7C3AED" />
        </View>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: "#1F2937",
            marginBottom: 2,
          }}
        >
          View Guest List
        </Text>
        <Text style={{ fontSize: 12, color: "#9CA3AF" }}>
          Manage all invites
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onSendReminder}
        activeOpacity={0.85}
        style={{
          flex: 1,
          backgroundColor: "#FFF",
          borderRadius: 16,
          padding: 16,
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: "#F3EAFF",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10,
          }}
        >
          <Ionicons name="send" size={20} color="#7C3AED" />
        </View>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: "#1F2937",
            marginBottom: 2,
          }}
        >
          Send Reminder
        </Text>
        <Text style={{ fontSize: 12, color: "#9CA3AF" }}>
          SMS pending guests
        </Text>
      </TouchableOpacity>
    </View>
  );
}
