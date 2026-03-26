import { View, Text, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

export interface RSVPItem {
  id: string;
  name: string;
  timeAgo: string;
  status: "attending" | "sent_gift" | "maybe" | "not_coming";
  count?: number;
}

interface Props {
  rsvps: RSVPItem[];
  onSeeAll: () => void;
}

const STATUS_CONFIG = {
  attending: { label: "ATTENDING", bg: "#D1FAE5", color: "#059669" },
  sent_gift: { label: "SENT GIFT", bg: "#EDE9FE", color: "#7C3AED" },
  maybe: { label: "MAYBE COMING", bg: "#FEF3C7", color: "#D97706" },
  not_coming: { label: "NOT COMING", bg: "#FEE2E2", color: "#DC2626" },
};

const STATUS_ICON: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  attending: "checkmark-circle",
  sent_gift: "gift",
  maybe: "help-circle",
  not_coming: "close-circle",
};

export default function RecentRSVPsList({ rsvps, onSeeAll }: Props) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#1F2937" }}>
          Recent RSVPs
        </Text>
        <TouchableOpacity onPress={onSeeAll}>
          <Text
            style={{ fontSize: 13, fontWeight: "600", color: "#7C3AED" }}
          >
            SEE ALL
          </Text>
        </TouchableOpacity>
      </View>

      {rsvps.map((rsvp) => {
        const config = STATUS_CONFIG[rsvp.status];
        const icon = STATUS_ICON[rsvp.status];
        return (
          <View
            key={rsvp.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#FFF",
              borderRadius: 14,
              padding: 14,
              marginBottom: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.03,
              shadowRadius: 4,
              elevation: 1,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#F3F4F6",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Ionicons name={icon} size={20} color="#6B7280" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: "#1F2937",
                }}
              >
                {rsvp.name}
              </Text>
              <Text style={{ fontSize: 12, color: "#9CA3AF" }}>
                {rsvp.timeAgo}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: config.bg,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  color: config.color,
                  letterSpacing: 0.5,
                }}
              >
                {config.label}
                {rsvp.count && rsvp.count > 1 ? ` (${rsvp.count})` : ""}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
