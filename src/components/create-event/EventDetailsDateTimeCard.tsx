import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Calendar } from "lucide-react-native";
import { colors, spacing, radius, fontFamily } from "@/src/theme";

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

const CARD_FILL = colors.surfaceContainerLowest;
const ICON_HOLE = "rgba(107, 56, 212, 0.14)";

export default function EventDetailsDateTimeCard(props: EventDetailsDateTimeCardProps) {
  const p = props;
  const hasError = !!(p.dateError || p.timeError);
  const bothEmpty = !p.dateValue && !p.timeValue;
  const borderColor =
    p.dateFocused || p.timeFocused ? "rgba(107, 56, 212, 0.35)" : hasError ? "#EF4444" : "transparent";

  return (
    <View style={styles.wrap}>
      <View style={[styles.card, { borderColor }]}>
        <View style={styles.iconWrap}>
          <Calendar size={22} color={colors.primary} strokeWidth={2.2} />
        </View>
        <View style={styles.body}>
          <Text style={styles.label}>Date & time</Text>
          {bothEmpty ? (
            <TouchableOpacity onPress={p.onDatePress} activeOpacity={0.75}>
              <Text style={styles.emptyPrompt}>Select date and start time</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.valueRow}>
              <TouchableOpacity style={styles.valueTouch} onPress={p.onDatePress} activeOpacity={0.75}>
                <Text style={[styles.valueText, !p.dateValue && styles.placeholder]} numberOfLines={1}>
                  {p.dateValue ? p.formatDateDisplay(p.dateValue) : "Date"}
                </Text>
              </TouchableOpacity>
              <Text style={styles.dot}>·</Text>
              <TouchableOpacity style={styles.valueTouch} onPress={p.onTimePress} activeOpacity={0.75}>
                <Text style={[styles.valueText, !p.timeValue && styles.placeholder]} numberOfLines={1}>
                  {p.timeValue ? formatTimeTo24h(p.timeValue) : "Time"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      {(p.dateError || p.timeError) && (
        <Text style={styles.err}>{p.dateError || p.timeError}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing[5],
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_FILL,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[3],
  },
  iconWrap: {
    width: 48,
    marginRight: spacing[3],
    height: 48,
    borderRadius: 24,
    backgroundColor: ICON_HOLE,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontFamily: fontFamily.label,
    fontSize: 10,
    fontWeight: "700",
    color: colors.onSurfaceVariant,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    marginBottom: spacing[1],
  },
  emptyPrompt: {
    fontFamily: fontFamily.body,
    fontSize: 15,
    fontWeight: "500",
    color: colors.onSurfaceVariant,
    lineHeight: 22,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  valueTouch: {
    flex: 1,
    minWidth: 0,
  },
  valueText: {
    fontFamily: fontFamily.title,
    fontSize: 15,
    fontWeight: "600",
    color: colors.onSurface,
  },
  placeholder: {
    color: colors.onSurfaceVariant,
  },
  dot: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.muted,
    paddingHorizontal: spacing[1],
  },
  err: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: spacing[2],
    fontWeight: "600",
  },
});
