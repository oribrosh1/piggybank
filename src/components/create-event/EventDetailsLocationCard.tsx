import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { MapPin } from "lucide-react-native";
import { colors, spacing, radius, typography, fontFamily, borderGhostOutline } from "@/src/theme";

type EventDetailsLocationCardProps = {
  address1: string;
  address2: string;
  parking: string;
  parkingFocused: boolean;
  onParkingChange: (value: string) => void;
  onParkingFocus: () => void;
  onParkingBlur: () => void;
  onRequestParkingNotes?: () => void;
};

export default function EventDetailsLocationCard(props: EventDetailsLocationCardProps) {
  const {
    address1,
    address2,
    parking,
    parkingFocused,
    onParkingChange,
    onParkingFocus,
    onParkingBlur,
    onRequestParkingNotes,
  } = props;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <MapPin size={20} color={colors.onSurfaceVariant} strokeWidth={2} />
        <Text style={styles.title}>Location & parking</Text>
      </View>

      {address1 ? (
        <View style={styles.addressBlock}>
          <Text style={styles.addressPrimary}>{address1}</Text>
          {address2 ? <Text style={styles.addressSecondary}>{address2}</Text> : null}
        </View>
      ) : (
        <Text style={styles.hint}>Map preview will use the address you enter above.</Text>
      )}

      <View style={styles.divider} />

      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>Parking notes</Text>
        <TouchableOpacity
          onPress={() => {
            onRequestParkingNotes?.();
            onParkingFocus();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
        </TouchableOpacity>
      </View>

      <TextInput
        style={[styles.input, parkingFocused && styles.inputFocused]}
        placeholder="Valet, garage entrance, shuttle…"
        placeholderTextColor={colors.muted}
        value={parking}
        onChangeText={onParkingChange}
        onFocus={onParkingFocus}
        onBlur={onParkingBlur}
        multiline
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[6],
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.sm + 8,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    paddingBottom: spacing[5],
    ...borderGhostOutline,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  title: {
    fontFamily: fontFamily.title,
    fontSize: 17,
    fontWeight: "700",
    color: colors.onSurface,
    letterSpacing: -0.2,
  },
  addressBlock: {
    marginBottom: 0,
  },
  addressPrimary: {
    ...typography.bodyMd,
    fontWeight: "600",
    color: colors.onSurface,
    lineHeight: 22,
  },
  addressSecondary: {
    ...typography.bodyMd,
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginTop: spacing[1],
    lineHeight: 20,
  },
  hint: {
    ...typography.bodyMd,
    fontSize: 13,
    color: colors.onSurfaceVariant,
    lineHeight: 20,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(203, 195, 215, 0.35)",
    marginVertical: spacing[4],
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: spacing[2],
  },
  fieldLabel: {
    fontFamily: fontFamily.label,
    fontSize: 13,
    fontWeight: "600",
    color: colors.onSurfaceVariant,
  },
  fieldAction: {
    fontFamily: fontFamily.label,
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  input: {
    minHeight: 96,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "rgba(203, 195, 215, 0.45)",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: 15,
    fontFamily: fontFamily.body,
    fontWeight: "400",
    color: colors.onSurface,
    textAlignVertical: "top",
  },
  inputFocused: {
    borderColor: "rgba(107, 56, 212, 0.45)",
    backgroundColor: colors.surfaceContainerLowest,
  },
});
