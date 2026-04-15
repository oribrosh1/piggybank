import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { Send, Bell, Lock } from "lucide-react-native";
import { GlassCardDark } from "@/src/components/common/GlassCardDark";
import { colors, spacing, fontFamily, radius, glassCardBorderLocked } from "@/src/theme";

interface LockedRowProps {
  icon: "send" | "bell";
  title: string;
  style?: StyleProp<ViewStyle>;
}

function LockedRow({ icon, title, style }: LockedRowProps) {
  const Icon = icon === "send" ? Send : Bell;
  const inner = (
    <>
      <View style={styles.iconCircle}>
        <Icon size={20} color={colors.primary} strokeWidth={2.2} />
      </View>
      <Text style={styles.lockedTitle}>{title}</Text>
      <View style={styles.unlockRow}>
        <Lock size={12} color={colors.primary} strokeWidth={2.4} />
        <Text style={styles.unlockText}>Unlock after setup</Text>
      </View>
    </>
  );

  return (
    <GlassCardDark
      borderRadius={radius.sm + 6}
      borderColor={glassCardBorderLocked}
      contentStyle={{ minHeight: 124 }}
      style={[styles.lockedCardOuter, style]}
    >
      {inner}
    </GlassCardDark>
  );
}

/**
 * Invitations & reminders locked until Stripe banking is complete.
 */
export default function LockedNextStepsSection() {
  return (
    <View style={styles.section}>
      <View style={styles.padlockWrap} pointerEvents="none">
        <Lock size={140} color={colors.primary} strokeWidth={1.2} style={styles.padlockWatermark} />
      </View>

      <Text style={styles.sectionTitle}>Next Steps</Text>

      <View style={styles.row}>
        <LockedRow icon="send" title="Send Invitations" style={{ flex: 1, marginBottom: 0 }} />
        <LockedRow icon="bell" title="Set Reminders" style={{ flex: 1, marginBottom: 0 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    position: "relative",
    overflow: "hidden",
    paddingBottom: spacing[2],
  },
  padlockWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing[8],
  },
  padlockWatermark: {
    opacity: 0.06,
  },
  sectionTitle: {
    fontFamily: fontFamily.headline,
    fontSize: 20,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.3,
    marginBottom: spacing[3],
    paddingHorizontal: spacing[2],
    zIndex: 1,
  },
  row: {
    flexDirection: "row",
    gap: spacing[2],
    alignItems: "stretch",
    zIndex: 1,
  },
  lockedCardOuter: {
    marginBottom: spacing[3],
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[2],
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  lockedTitle: {
    fontFamily: fontFamily.title,
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(18, 28, 42, 0.5)",
    marginBottom: spacing[2],
  },
  unlockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexWrap: "wrap",
  },
  unlockText: {
    fontFamily: fontFamily.label,
    fontSize: 9,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.6,
  },
});
