import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Calendar } from "lucide-react-native";
import { FOREST, INPUT_BG } from "./designInviteTheme";

function formatTimeTo24h(timeStr: string): string {
  const m = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return timeStr;
  let h = parseInt(m[1], 10);
  const min = m[2];
  const ap = m[3].toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${min}`;
}

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
  const hasError = !!(p.dateError || p.timeError);
  const borderColor = p.dateFocused || p.timeFocused ? FOREST : hasError ? "#EF4444" : "#E5E7EB";

  return (
    <View style={{ marginBottom: 20 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "800",
          color: FOREST,
          letterSpacing: 1.2,
          marginBottom: 8,
        }}
      >
        DATE & TIME
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: INPUT_BG,
          borderRadius: 16,
          borderWidth: 2,
          borderColor,
          paddingHorizontal: 14,
          paddingVertical: 4,
          minHeight: 52,
        }}
      >
        <TouchableOpacity style={{ flex: 1, paddingVertical: 12 }} onPress={p.onDatePress} activeOpacity={0.85}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: p.dateValue ? "#111827" : "#9CA3AF",
            }}
            numberOfLines={1}
          >
            {p.dateValue ? p.formatDateDisplay(p.dateValue) : "Date"}
          </Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#9CA3AF", paddingHorizontal: 4 }}>•</Text>
        <TouchableOpacity style={{ flex: 1, paddingVertical: 12 }} onPress={p.onTimePress} activeOpacity={0.85}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: p.timeValue ? "#111827" : "#9CA3AF",
            }}
            numberOfLines={1}
          >
            {p.timeValue ? formatTimeTo24h(p.timeValue) : "Time"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={p.onDatePress} style={{ padding: 8 }}>
          <Calendar size={22} color={FOREST} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>
      {(p.dateError || p.timeError) && (
        <Text style={{ fontSize: 12, color: "#EF4444", marginTop: 6, fontWeight: "600" }}>
          {p.dateError || p.timeError}
        </Text>
      )}
    </View>
  );
}
