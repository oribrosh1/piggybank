import { View, Text } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, typography, radius, spacing, ambientShadow, fontFamily } from "@/src/theme";

interface Props {
  unlockDate: string;
}

export default function BirthdayWalletCard({ unlockDate }: Props) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.surfaceContainerLowest,
          borderRadius: radius.md,
          padding: spacing[5],
          alignItems: "center",
          marginBottom: spacing[4],
        },
        ambientShadow,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 12 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: radius.sm,
            backgroundColor: colors.surfaceContainerLow,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="lock-closed" size={20} color={colors.muted} />
        </View>
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            gap: 8,
          }}
        >
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={{
                width: 24,
                height: 16,
                borderRadius: 4,
                backgroundColor: colors.surfaceContainerHigh,
              }}
            />
          ))}
        </View>
      </View>

      <Text style={[typography.titleLg, { marginBottom: spacing[2] }]}>Birthday Wallet</Text>
      <Text
        style={[
          typography.bodyMd,
          {
            color: colors.muted,
            textAlign: "center",
            marginBottom: spacing[2],
          },
        ]}
      >
        Your child's total gifts will be{"\n"}available here on the big day!
      </Text>
      <Text style={[typography.bodyLg, { fontFamily: fontFamily.title }]}>
        Unlocks on{" "}
        <Text style={{ color: colors.primary }}>{unlockDate}</Text>
      </Text>
    </View>
  );
}
