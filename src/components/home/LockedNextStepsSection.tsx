import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { Lock } from "lucide-react-native";
import { GlassCardDark } from "@/src/components/common/GlassCardDark";
import { colors, spacing, fontFamily, radius, glassCardBorderLocked } from "@/src/theme";
import LottieView from "lottie-react-native";

const CREDITKID_LOTTIE = require("../../../assets/lotties/creditkid-lottiejson.json");
const SMS_PREVIEW_LOTTIE = require("../../../assets/lotties/sms-preview.json");

interface LockedRowProps {
  icon: "send" | "card";
  title: string;
  style?: StyleProp<ViewStyle>;
}

function LockedRow({ icon, title, style }: LockedRowProps) {

  return (
    <GlassCardDark
      borderRadius={radius.md}
      borderColor={glassCardBorderLocked}
      contentStyle={styles.lockedCardContent}
      style={[styles.lockedCardOuter, style]}
    >
      <View style={styles.lockedCardInner}>
        <View style={styles.lockedBgLayer} pointerEvents="none">
          <View style={styles.decoSquare} />
          <View style={styles.decoBlob} />
          <View style={styles.blurredLockCluster}>
            <Lock size={100} color="rgba(82, 84, 94, 0.62)" strokeWidth={1.35} style={styles.blurredLockGlyph} />
          </View>
        </View>

        <View style={styles.lockedForeground}>
            {icon === "card" ? (
          <View style={{...styles.iconCircle, marginLeft:-15}}>
              <LottieView source={CREDITKID_LOTTIE} autoPlay loop style={styles.iconLottieCreditKid} />
          </View>
            ) : (
            <View style={styles.iconCircle}>
              <LottieView source={SMS_PREVIEW_LOTTIE} autoPlay loop style={styles.iconLottieSMS} />
          </View>
        )}
          <Text style={styles.lockedTitle}>{title}</Text>
          <View style={styles.unlockRow}>
            <Lock size={12} color={colors.primary} strokeWidth={2.4} />
            <Text style={styles.unlockText}>Unlock after setup</Text>
          </View>
        </View>
      </View>
    </GlassCardDark>
  );
}

/**
 * Invitations & reminders locked until Stripe banking is complete.
 */
export default function LockedNextStepsSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Next Steps</Text>

      <View style={styles.row}>
        <LockedRow icon="send" title="Schedule Automated Invitations & Reminders" style={{ flex: 1, marginBottom: 0 }} />
        <LockedRow icon="card" title="Get Gifts From Guests Into Your CreditKid Card" style={{ flex: 1, marginBottom: 0 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    position: "relative",
    overflow: "visible",
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
  lockedCardContent: {
    minHeight: 136,
    padding: 0,
    overflow: "hidden",
  },
  lockedCardInner: {
    flex: 1,
    minHeight: 136,
    position: "relative",
  },
  lockedBgLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  /** Faint purple rounded square — left */
  decoSquare: {
    position: "absolute",
    left: -6,
    top: 28,
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(107, 56, 212, 0.06)",
  },
  /** Soft purple blob — top right */
  decoBlob: {
    position: "absolute",
    right: -24,
    top: -18,
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(107, 56, 212, 0.05)",
  },
  /** Large lock watermark — top-right, clipped by card; pairs with glass blur on the shell */
  blurredLockCluster: {
    position: "absolute",
    top: -6,
    right: -32,
    width: 128,
    height: 128,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-10deg" }],
  },
  /** Watermark lock — slightly higher contrast than before (reads less “blurred”) */
  blurredLockGlyph: {
    opacity: 0.58,
  },
  lockedForeground: {
    // flex: 1,
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
    paddingLeft: spacing[3],
    zIndex: 2,
  },
  iconCircle: {
    width: 100,
    height: 80,
    borderRadius: 40,
    marginLeft:-20,
    marginTop:-20,
    marginBottom:-10,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  iconLottieCreditKid: {
    width: 120,
    height: 120,
    backgroundColor: "transparent",
  },
  iconLottieSMS: {
    width: 65,
    height: 65,
    backgroundColor: "transparent",
  },
  lockedTitle: {
    fontFamily: fontFamily.headline,
    fontSize: 14,
    fontWeight: "800",
    color: colors.onSurface,
    // letterSpacing: -0.2,
    lineHeight: 20,
    marginBottom: spacing[3],
  },
  unlockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexWrap: "wrap",
  },
  unlockText: {
    fontFamily: fontFamily.label,
    fontSize: 10,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});
