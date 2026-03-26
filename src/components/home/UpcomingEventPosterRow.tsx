import { View, Text, TouchableOpacity, Image } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { EventSummary } from "@/types/events";

interface Props {
  event: EventSummary;
  formattedDate: string;
  onPress: () => void;
}

function eventStatusLabel(status: EventSummary["status"]): string {
  switch (status) {
    case "draft":
      return "DRAFT";
    case "active":
      return "ACTIVE";
    case "completed":
      return "COMPLETED";
    case "cancelled":
      return "CANCELLED";
    default:
      return "ACTIVE";
  }
}

/**
 * Horizontal event row with poster thumbnail (matches parent dashboard mock).
 */
export default function UpcomingEventPosterRow({ event, formattedDate, onPress }: Props) {
  const guests = event.guestStats?.total ?? event.totalGuests ?? 0;
  const giftsUsd = (event.guestStats?.totalPaid ?? 0) / 100;
  const statusUpper = eventStatusLabel(event.status);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.92}
      style={{
        backgroundColor: "#FFF",
        borderRadius: 18,
        padding: 14,
        flexDirection: "row",
        gap: 14,
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View
        style={{
          width: 100,
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: "#F3F4F6",
          aspectRatio: 210 / 297,
        }}
      >
        {event.posterUrl ? (
          <Image source={{ uri: event.posterUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 8 }}>
            <Ionicons name="image-outline" size={28} color="#9CA3AF" />
          </View>
        )}
      </View>

      <View style={{ flex: 1, justifyContent: "space-between", minHeight: 130 }}>
        <View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                flex: 1,
                fontSize: 17,
                fontWeight: "900",
                color: "#111827",
              }}
              numberOfLines={2}
            >
              {event.eventName}
            </Text>
            <View
              style={{
                backgroundColor: "#E0F2FE",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "800",
                  color: "#0369A1",
                  letterSpacing: 0.3,
                }}
              >
                STATUS: {statusUpper}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#4B5563" }}>{formattedDate}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#F3F4F6",
                paddingVertical: 8,
                paddingHorizontal: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#111827" }}>{guests}</Text>
              <Text style={{ fontSize: 10, fontWeight: "800", color: "#9CA3AF", letterSpacing: 0.4 }}>GUESTS</Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#F3F4F6",
                paddingVertical: 8,
                paddingHorizontal: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#111827" }}>
                ${giftsUsd.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </Text>
              <Text style={{ fontSize: 10, fontWeight: "800", color: "#9CA3AF", letterSpacing: 0.4 }}>GIFTS</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
