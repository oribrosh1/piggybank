import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { MapPin, Car } from "lucide-react-native";
import { GlassCardDark } from "@/src/components/common/GlassCardDark";
import { colors, spacing, radius, typography, fontFamily } from "@/src/theme";

const ADDRESS_BG = Platform.select({
  ios: "rgba(255, 255, 255, 0.5)",
  default: "rgba(255, 255, 255, 0.72)",
});
const ADDRESS_BORDER = "rgba(107, 56, 212, 0.1)";
const EXTRA_BG = Platform.select({
  ios: "rgba(255, 255, 255, 0.42)",
  default: "rgba(255, 255, 255, 0.62)",
});
const EXTRA_BORDER = "rgba(107, 56, 212, 0.09)";

type EventDetailsLocationCardProps = {
  address1: string;
  address2: string;
  locationNotes?: string;
  parking?: string;
};

export default function EventDetailsLocationCard(props: EventDetailsLocationCardProps) {
  const { address1, address2, locationNotes, parking } = props;
  const notesTrim = locationNotes?.trim();
  const parkingTrim = parking?.trim();
  const hasExtras = !!(notesTrim || parkingTrim);

  return (
    <GlassCardDark
      style={{ marginBottom: spacing[6] }}
      padding={0}
      borderRadius={radius.md}
      borderColor="rgba(107, 56, 212, 0.1)"
      contentStyle={styles.cardInner}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <MapPin size={17} color={colors.primary} strokeWidth={2} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>
            Where you’ll meet<Text style={styles.headerHintInline}> · preview</Text>
          </Text>
        </View>
      </View>

      {address1 ? (
        <View style={[styles.surfaceBlock, styles.addressBlock]}>
          <Text style={styles.addressPrimary}>{address1}</Text>
          {address2 ? (
            <Text style={styles.addressSecondary}>{address2}</Text>
          ) : null}
        </View>
      ) : null}

      {hasExtras ? (
        <View
          style={[
            styles.surfaceBlock,
            styles.extrasBlock,
            address1 ? { marginTop: spacing[3] } : undefined,
          ]}
        >
          {notesTrim ? (
            <>
              <Text style={styles.miniLabel}>Venue notes</Text>
              <Text style={styles.previewBody}>{notesTrim}</Text>
            </>
          ) : null}
          {notesTrim && parkingTrim ? <View style={styles.inlineDivider} /> : null}
          {parkingTrim ? (
            <>
              <View style={styles.parkingHeader}>
                <Car size={12} color={colors.primary} strokeWidth={2.25} />
                <Text style={styles.miniLabelInline}>Parking</Text>
              </View>
              <Text style={styles.previewBody}>{parkingTrim}</Text>
            </>
          ) : null}
        </View>
      ) : null}

      {!address1 && !hasExtras ? (
        <Text style={styles.placeholder}>
          Add an address above to see your preview here.
        </Text>
      ) : null}
    </GlassCardDark>
  );
}

const styles = StyleSheet.create({
  cardInner: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(107, 56, 212, 0.11)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  title: {
    fontFamily: fontFamily.title,
    fontSize: 15,
    fontWeight: "600",
    color: colors.onSurface,
    letterSpacing: -0.28,
    lineHeight: 20,
  },
  headerHintInline: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.onSurfaceVariant,
    letterSpacing: -0.1,
  },
  placeholder: {
    ...typography.bodyMd,
    fontSize: 14,
    fontWeight: "500",
    color: colors.onSurfaceVariant,
    lineHeight: 21,
  },
  surfaceBlock: {
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  addressBlock: {
    backgroundColor: ADDRESS_BG,
    borderColor: ADDRESS_BORDER,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
  },
  extrasBlock: {
    backgroundColor: EXTRA_BG,
    borderColor: EXTRA_BORDER,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },
  addressPrimary: {
    ...typography.bodyMd,
    fontSize: 15,
    fontWeight: "600",
    color: colors.onSurface,
    lineHeight: 21,
    letterSpacing: -0.18,
  },
  addressSecondary: {
    ...typography.bodyMd,
    fontSize: 13,
    fontWeight: "500",
    color: colors.onSurfaceVariant,
    marginTop: spacing[1],
    lineHeight: 20,
  },
  inlineDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(107, 56, 212, 0.12)",
    marginVertical: spacing[3],
  },
  miniLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.onSurfaceVariant,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: spacing[1],
    opacity: 0.92,
  },
  miniLabelInline: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.onSurfaceVariant,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    opacity: 0.92,
  },
  parkingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 3,
  },
  previewBody: {
    ...typography.bodyMd,
    fontSize: 15,
    fontWeight: "500",
    color: colors.onSurface,
    lineHeight: 22,
    letterSpacing: -0.15,
  },
});
