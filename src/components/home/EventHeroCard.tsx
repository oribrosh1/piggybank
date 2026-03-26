import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import Svg, { Circle } from "react-native-svg";

interface Props {
  eventName: string;
  daysUntil: number;
  rsvpPercentage: number;
  confirmedGuests: number;
  totalGuests: number;
  childName?: string;
  onViewEvent: () => void;
}

function RsvpRing({
  percentage,
  size = 72,
}: {
  percentage: number;
  size?: number;
}) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#FFF"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={{ fontSize: 16, fontWeight: "900", color: "#FFF" }}>
        {percentage}%
      </Text>
    </View>
  );
}

export default function EventHeroCard({
  eventName,
  daysUntil,
  rsvpPercentage,
  confirmedGuests,
  totalGuests,
  childName,
  onViewEvent,
}: Props) {
  const subtitle = childName
    ? `Preparing the magic for ${childName}'s big day`
    : "Getting ready for the big day";

  return (
    <LinearGradient
      colors={["#7C3AED", "#6D28D9"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 20, padding: 20, marginBottom: 16 }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: "rgba(255,255,255,0.7)",
            letterSpacing: 1,
          }}
        >
          UPCOMING EVENT
        </Text>
        <TouchableOpacity
          onPress={onViewEvent}
          style={{
            backgroundColor: "rgba(255,255,255,0.2)",
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#FFF" }}>
            View Event
          </Text>
          <Ionicons name="arrow-forward" size={12} color="#FFF" />
        </TouchableOpacity>
      </View>

      <Text
        style={{
          fontSize: 26,
          fontWeight: "900",
          color: "#FFF",
          lineHeight: 32,
          marginBottom: 6,
        }}
      >
        {eventName} in {daysUntil} {daysUntil === 1 ? "Day" : "Days"}
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.75)",
          marginBottom: 20,
        }}
      >
        {subtitle}
      </Text>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <RsvpRing percentage={rsvpPercentage} />
        <View>
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFF" }}>
            {confirmedGuests}/{totalGuests} Guests
          </Text>
          <Text
            style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}
          >
            Confirmed
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}
