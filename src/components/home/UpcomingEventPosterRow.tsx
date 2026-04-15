import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Calendar, Image as ImageIcon, Wallet, Users } from "lucide-react-native";
import type { EventSummary } from "@/types/events";
import { GlassCardDark } from "@/src/components/common/GlassCardDark";
import { colors, spacing, fontFamily, radius } from "@/src/theme";

/** Mini teal sphere — HTML `bg-[#10B981]/5` */
const EVENT_CARD_FLOAT_SPHERE = "rgba(16, 185, 129, 0.05)";

interface Props {
  event: EventSummary;
  formattedDate: string;
  onPress: () => void;
}

function eventStatusLabel(status: EventSummary["status"]): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "active":
      return "Active";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return "Active";
  }
}

export default function UpcomingEventPosterRow({ event, formattedDate, onPress }: Props) {
  const guests = event.guestStats?.total ?? event.totalGuests ?? 0;
  const raisedUsd = (event.guestStats?.totalPaid ?? 0) / 100;
  const statusLabel = eventStatusLabel(event.status);

  const cardInner = (
    <View style={styles.cardInnerRoot}>
      <View style={styles.eventCardFloatSphere} pointerEvents="none" />
      <View style={styles.cardContentAboveSphere}>
        <View style={styles.thumb}>
          {event.posterUrl ? (
            <Image source={{ uri: event.posterUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <ImageIcon size={30} color={colors.muted} strokeWidth={1.8} />
            </View>
          )}
        </View>

        <View style={styles.centerCol}>
          <Text style={styles.eventName} numberOfLines={2}>
            {event.eventName}
          </Text>
          <View style={styles.dateRow}>
            <Calendar size={14} color={colors.onSurfaceVariant} strokeWidth={2} />
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
          <View style={styles.raisedRow}>
            <Wallet size={16} color={colors.primary} strokeWidth={2.2} />
            <Text style={styles.raisedText}>
              ${raisedUsd.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} Raised
            </Text>
          </View>
        </View>

        <View style={styles.rightCol}>
          <View style={[styles.statusPill, event.status === "draft" && styles.statusPillDraft]}>
            <Text style={[styles.statusText, event.status === "draft" && styles.statusTextDraft]}>{statusLabel}</Text>
          </View>
          <View style={styles.guestsRow}>
            <Users size={15} color={colors.onSurfaceVariant} strokeWidth={2.2} />
            <Text style={styles.guestsText}>
              {guests} Guest{guests === 1 ? "" : "s"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.92}
      accessibilityRole="button"
      accessibilityLabel={`${event.eventName}, ${formattedDate}`}
    >
      <GlassCardDark style={styles.cardGlassOuter}>{cardInner}</GlassCardDark>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardGlassOuter: {
    marginBottom: spacing[2],
  },
  cardInnerRoot: {
    position: "relative",
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing[4],
  },
  cardContentAboveSphere: {
    flex: 1,
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing[4],
    zIndex: 1,
  },
  /** HTML: `-top-2 right-12 w-6 h-6 bg-[#10B981]/5` — behind copy; `top` inset so `overflow:hidden` on wrap doesn’t clip */
  eventCardFloatSphere: {
    position: "absolute",
    top: spacing[2],
    right: 48,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: EVENT_CARD_FLOAT_SPHERE,
    zIndex: 0,
  },
  thumb: {
    width: 88,
    height: 88,
    borderRadius: radius.sm + 4,
    overflow: "hidden",
    backgroundColor: colors.surfaceContainerHigh,
  },
  thumbPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[2],
  },
  centerCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    gap: 6,
  },
  eventName: {
    fontFamily: fontFamily.headline,
    fontSize: 16,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.2,
    lineHeight: 21,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dateText: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    fontWeight: "600",
    color: colors.onSurfaceVariant,
  },
  raisedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  raisedText: {
    fontFamily: fontFamily.title,
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  rightCol: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    minHeight: 96,
    paddingLeft: spacing[1],
  },
  statusPill: {
    backgroundColor: "rgba(107, 56, 212, 0.12)",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "rgba(107, 56, 212, 0.2)",
  },
  statusPillDraft: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: "rgba(16, 185, 129, 0.35)",
  },
  statusText: {
    fontFamily: fontFamily.label,
    fontSize: 9,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  statusTextDraft: {
    color: "#047857",
  },
  guestsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  guestsText: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    fontWeight: "600",
    color: colors.onSurfaceVariant,
  },
});
