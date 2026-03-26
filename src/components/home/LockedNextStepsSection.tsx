import { View, Text, type ViewStyle } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

/**
 * Invitations & reminders locked until Stripe banking is complete.
 */
export default function LockedNextStepsSection() {
  return (
    <View style={{ marginTop: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "900", color: "#111827" }}>Next Steps</Text>
        <View
          style={{
            backgroundColor: "#E0F2FE",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: "800", color: "#0369A1", letterSpacing: 0.3 }}>
            UNLOCK AFTER BANKING SETUP
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10, alignItems: "stretch" }}>
        <LockedRow
          icon="paper-plane-outline"
          title="Send Invitations"
          subtitle="Notify friends via SMS & track RSVPs in real-time."
          style={{ flex: 1, marginBottom: 0 }}
        />
        <LockedRow
          icon="notifications-outline"
          title="Set Reminder Schedule"
          subtitle="Automate follow-ups for gift contributions."
          style={{ flex: 1, marginBottom: 0 }}
        />
      </View>
    </View>
  );
}

function LockedRow({
  icon,
  title,
  subtitle,
  style,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: "#F3F4F6",
          borderRadius: 16,
          padding: 12,
          marginBottom: 12,
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 10,
          opacity: 0.95,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: "#E5E7EB",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={22} color="#9CA3AF" />
      </View>
      <View style={{ width: "100%" }}>
        <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4, marginBottom: 4 }}>
          <Text style={{ fontSize: 13, fontWeight: "800", color: "#6B7280" }}>{title}</Text>
          <Ionicons name="lock-closed" size={14} color="#9CA3AF" />
        </View>
        <Text style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 15, fontWeight: "500" }}>{subtitle}</Text>
      </View>
    </View>
  );
}
