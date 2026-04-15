import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import Svg, { Circle } from "react-native-svg";
import { colors, primaryGradient, radius, typography, fontFamily } from "@/src/theme";

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
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
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
      <Text
        style={{
          fontSize: 16,
          fontFamily: fontFamily.display,
          color: colors.onPrimary,
        }}
      >
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
      {...primaryGradient}
      style={{ borderRadius: radius.md, padding: 20, marginBottom: 16 }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <Text style={[typography.labelMd, { color: "rgba(255,255,255,0.85)" }]}>
          UPCOMING EVENT
        </Text>
        <TouchableOpacity
          onPress={onViewEvent}
          style={{
            backgroundColor: "rgba(255,255,255,0.2)",
            borderRadius: radius.sm,
            paddingHorizontal: 14,
            paddingVertical: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Text style={[typography.bodyMd, { color: colors.onPrimary, fontFamily: fontFamily.title }]}>
            View Event
          </Text>
          <Ionicons name="arrow-forward" size={12} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>

      <Text
        style={{
          fontFamily: fontFamily.display,
          fontSize: 26,
          lineHeight: 32,
          color: colors.onPrimary,
          marginBottom: 6,
        }}
      >
        {eventName} in {daysUntil} {daysUntil === 1 ? "Day" : "Days"}
      </Text>
      <Text
        style={[
          typography.bodyMd,
          { color: "rgba(255,255,255,0.8)", marginBottom: 20 },
        ]}
      >
        {subtitle}
      </Text>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <RsvpRing percentage={rsvpPercentage} />
        <View>
          <Text style={[typography.titleLg, { color: colors.onPrimary, fontSize: 15 }]}>
            {confirmedGuests}/{totalGuests} Guests
          </Text>
          <Text style={[typography.bodyMd, { color: "rgba(255,255,255,0.75)", fontSize: 12 }]}>
            Confirmed
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}
