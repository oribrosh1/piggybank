import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Calendar } from "lucide-react-native";

type EventDetailsDateTimeCardProps = {
  dateValue: string;
  timeValue: string;
  dateError?: string;
  timeError?: string;
  dateFocused: boolean;
  timeFocused: boolean;
  formatDateDisplay: (dateString: string) => string;
  onDatePress: () => void;
  onTimePress: () => void;
};

export default function EventDetailsDateTimeCard(props: EventDetailsDateTimeCardProps) {
  const p = props;
  return (
    <View
      style={{
        marginBottom: 24,
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        borderWidth: 2,
        borderColor: "#F3F4F6",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#E0F7F2", alignItems: "center", justifyContent: "center" }}>
          <Calendar size={22} color="#06D6A0" strokeWidth={2.5} />
        </View>
        <Text style={{ fontSize: 17, fontWeight: "800", color: "#111827", marginLeft: 14 }}>When is it happening?</Text>
      </View>

      <TouchableOpacity
        onPress={p.onDatePress}
        style={{
          marginBottom: 18,
          backgroundColor: p.dateFocused ? "#F0FDFA" : "#F9FAFB",
          borderRadius: 16,
          padding: 18,
          borderWidth: 2,
          borderColor: p.dateFocused ? "#06D6A0" : p.dateError ? "#EF4444" : "#E5E7EB",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#6B7280", marginBottom: 8, textTransform: "uppercase" }}>📅 DATE</Text>
            <Text style={{ fontSize: 18, fontWeight: "700", color: p.dateValue ? "#111827" : "#9CA3AF" }}>
              {p.dateValue ? p.formatDateDisplay(p.dateValue) : "Select event date"}
            </Text>
          </View>
          <View style={{ backgroundColor: "#E0F7F2", borderRadius: 12, width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 20 }}>📆</Text>
          </View>
        </View>
        {p.dateError && <Text style={{ fontSize: 11, color: "#EF4444", marginTop: 10, fontWeight: "600" }}>{p.dateError}</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={p.onTimePress}
        style={{
          marginBottom: 20,
          backgroundColor: p.timeFocused ? "#F0FDFA" : "#F9FAFB",
          borderRadius: 16,
          padding: 18,
          borderWidth: 2,
          borderColor: p.timeFocused ? "#06D6A0" : p.timeError ? "#EF4444" : "#E5E7EB",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#6B7280", marginBottom: 8, textTransform: "uppercase" }}>⏰ TIME</Text>
            <Text style={{ fontSize: 18, fontWeight: "700", color: p.timeValue ? "#111827" : "#9CA3AF" }}>{p.timeValue || "Select event time"}</Text>
          </View>
          <View style={{ backgroundColor: "#E0F7F2", borderRadius: 12, width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 20 }}>🕐</Text>
          </View>
        </View>
        {p.timeError && <Text style={{ fontSize: 11, color: "#EF4444", marginTop: 10, fontWeight: "600" }}>{p.timeError}</Text>}
      </TouchableOpacity>

      <View style={{ backgroundColor: "#F0FDFA", borderRadius: 14, padding: 16, borderLeftWidth: 4, borderLeftColor: "#06D6A0" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ backgroundColor: "#06D6A0", borderRadius: 18, width: 32, height: 32, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 16 }}>💡</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: "#047857", lineHeight: 19, fontWeight: "700", marginBottom: 4 }}>You can change the date and time later</Text>
            <Text style={{ fontSize: 13, color: "#059669", fontWeight: "600", lineHeight: 18 }}>All guests will be notified via SMS automatically</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
