import React from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Pencil, X, Sparkles, Camera } from "lucide-react-native";
import { colors, spacing, radius, fontFamily, borderGhostOutline } from "@/src/theme";

/** Inner circle diameter (px); gradient ring adds padding outside this. */
const HONOREE_PHOTO_AVATAR_SIZE = 100;
const AVATAR_RING_PAD = 3;
/** Kid emoji scales to fill the circle (emoji glyph metrics vary by platform). */
const PLACEHOLDER_EMOJI_FONT = Math.round(HONOREE_PHOTO_AVATAR_SIZE * 0.78);

function HonoreeAvatarRing({
  size,
  children,
}: {
  size: number;
  children: React.ReactNode;
}) {
  const outer = size + AVATAR_RING_PAD * 2;
  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryContainer]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: outer,
        height: outer,
        borderRadius: outer / 2,
        padding: AVATAR_RING_PAD,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: "hidden",
          backgroundColor: colors.surfaceContainerLowest,
        }}
      >
        {children}
      </View>
    </LinearGradient>
  );
}

type EventDetailsCelebrationCardProps = {
  childName: string;
  age: string;
  honoreePhotoUri?: string;
  nameError?: string;
  ageError?: string;
  nameFocused: boolean;
  ageFocused: boolean;
  namePlaceholder?: string;
  onNameChange: (v: string) => void;
  onAgeChange: (v: string) => void;
  onNameFocus: () => void;
  onNameBlur: () => void;
  onAgeFocus: () => void;
  onAgeBlur: () => void;
  onPickHonoreePhoto: () => void;
  onClearHonoreePhoto: () => void;
};

export default function EventDetailsCelebrationCard({
  childName,
  age,
  honoreePhotoUri,
  nameError,
  ageError,
  nameFocused,
  ageFocused,
  namePlaceholder = "Emma",
  onNameChange,
  onAgeChange,
  onNameFocus,
  onNameBlur,
  onAgeFocus,
  onAgeBlur,
  onPickHonoreePhoto,
  onClearHonoreePhoto,
}: EventDetailsCelebrationCardProps) {
  const nameUnderline = nameError ? "#EF4444" : nameFocused ? colors.primary : "transparent";
  const ageUnderline = ageError ? "#EF4444" : ageFocused ? colors.primary : "transparent";
  const hasPhoto = Boolean(honoreePhotoUri);

  return (
    <View style={styles.wrap}>
      {/* Section 1 — name & age on one line */}
      <Text style={styles.sectionLabel}>Who are we celebrating?</Text>
      <View style={styles.card}>
        <View style={styles.nameAgeRow}>
          <View
            style={[
              styles.nameCell,
              (nameFocused || nameError) && {
                borderBottomWidth: 2,
                borderBottomColor: nameUnderline,
              },
            ]}
          >
            <TextInput
              style={styles.nameInput}
              placeholder={namePlaceholder}
              placeholderTextColor={colors.muted}
              value={childName}
              onChangeText={onNameChange}
              onFocus={onNameFocus}
              onBlur={onNameBlur}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
          <View style={styles.ageColumn}>
            <Text style={styles.ageLabelAbove}>Turning age</Text>
            <View
              style={[
                styles.ageCell,
                (ageFocused || ageError) && {
                  borderBottomWidth: 2,
                  borderBottomColor: ageUnderline,
                },
              ]}
            >
              <TextInput
                style={styles.ageInput}
                placeholder="16"
                placeholderTextColor={colors.muted}
                value={age}
                onChangeText={onAgeChange}
                onFocus={onAgeFocus}
                onBlur={onAgeBlur}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
          </View>
        </View>
      </View>
      <Text style={styles.hint}>
        This name and age appear on your poster and invitations.
      </Text>

      {/* Section 2 — photo hero + AI poster copy */}
      <View style={styles.photoSectionHeader}>
        <Sparkles size={18} color={colors.primary} strokeWidth={2.2} />
        <Text style={styles.sectionLabelPhoto}>Add Your child's photo</Text>
      </View>
      <LinearGradient
        colors={["rgba(107, 56, 212, 0.1)", colors.surfaceContainerLowest]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.photoHeroCard}
      >
        <View style={styles.photoSectionRow}>
          {hasPhoto ? (
            <View style={styles.photoAvatarWrap}>
              <HonoreeAvatarRing size={HONOREE_PHOTO_AVATAR_SIZE}>
                <TouchableOpacity
                  onPress={onPickHonoreePhoto}
                  activeOpacity={0.88}
                  accessibilityRole="button"
                  accessibilityLabel="Change honoree photo"
                  style={styles.photoTapArea}
                >
                  <Image
                    source={{ uri: honoreePhotoUri }}
                    style={[styles.photoImage, { borderRadius: HONOREE_PHOTO_AVATAR_SIZE / 2 }]}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              </HonoreeAvatarRing>
              <TouchableOpacity
                onPress={onPickHonoreePhoto}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                style={styles.photoEditBadge}
                accessibilityRole="button"
                accessibilityLabel="Edit photo"
              >
                <Pencil size={14} color={colors.onPrimary} strokeWidth={2.4} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClearHonoreePhoto}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.photoRemove}
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
              >
                <X size={16} color={colors.onPrimary} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={onPickHonoreePhoto}
              activeOpacity={0.92}
              accessibilityRole="button"
              accessibilityLabel="Add honoree photo for AI poster"
              style={styles.photoEmptyColumn}
            >
              <HonoreeAvatarRing size={HONOREE_PHOTO_AVATAR_SIZE}>
                <View style={styles.emojiFill}>
                  <Text
                    style={[styles.photoPlaceholderEmoji, { fontSize: PLACEHOLDER_EMOJI_FONT, lineHeight: PLACEHOLDER_EMOJI_FONT }]}
                    accessible={false}
                  >
                    🧒
                  </Text>
                </View>
              </HonoreeAvatarRing>
              <View style={styles.addPhotoChip}>
                <Camera size={14} color={colors.primary} strokeWidth={2.4} />
                <Text style={styles.addPhotoChipText}>Add photo</Text>
              </View>
            </TouchableOpacity>
          )}
          <View style={styles.photoCopyBlock}>
            <View style={styles.aiTag}>
              <Text style={styles.aiTagText}>AI match</Text>
            </View>
            <Text style={styles.photoCopyTitle}>Make the poster feel like them</Text>
            <Text style={styles.photoCopyBody}>
              Add a clear, front-facing photo.{"\n"}
              We use it so the poster matches your child.
            </Text>
          </View>
        </View>
      </LinearGradient>

      {nameError ? <Text style={styles.err}>{nameError}</Text> : null}
      {ageError ? <Text style={styles.err}>{ageError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    marginBottom: spacing[5],
  },
  sectionLabel: {
    fontFamily: fontFamily.label,
    fontSize: 11,
    fontWeight: "700",
    color: colors.onSurfaceVariant,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: spacing[2],
  },
  photoSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginTop: spacing[5],
    marginBottom: spacing[2],
  },
  sectionLabelPhoto: {
    fontFamily: fontFamily.headline,
    fontSize: 13,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: 0.4,
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    ...borderGhostOutline,
  },
  nameAgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  nameCell: {
    flex: 1,
    minWidth: 0,
    paddingBottom: spacing[1],
  },
  nameInput: {
    fontFamily: fontFamily.headline,
    fontSize: 28,
    fontWeight: "800",
    color: colors.primary,
    paddingVertical: 0,
    letterSpacing: -0.5,
  },
  ageColumn: {
    width: 88,
    flexDirection: "column",
    alignItems: "center",
    flexShrink: 0,
    paddingBottom: spacing[1],
  },
  ageLabelAbove: {
    fontFamily: fontFamily.label,
    fontSize: 10,
    fontWeight: "700",
    color: colors.onSurfaceVariant,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: spacing[1],
    textAlign: "center",
    alignSelf: "stretch",
  },
  ageCell: {
    minWidth: 44,
    alignItems: "center",
    alignSelf: "stretch",
  },
  ageInput: {
    fontFamily: fontFamily.headline,
    fontSize: 28,
    fontWeight: "800",
    color: colors.primary,
    paddingVertical: 0,
    textAlign: "center",
    minWidth: 40,
  },
  photoHeroCard: {
    width: "100%",
    borderRadius: radius.md,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderWidth: 1,
    borderColor: "rgba(107, 56, 212, 0.14)",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 24,
    elevation: 5,
  },
  photoSectionRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[4],
  },
  photoAvatarWrap: {
    position: "relative",
    alignSelf: "flex-start",
    flexShrink: 0,
  },
  photoTapArea: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  photoEmptyColumn: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexShrink: 0,
    gap: spacing[3],
  },
  emojiFill: {
    flex: 1,
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholderEmoji: {
    textAlign: "center",
    includeFontPadding: false,
  },
  addPhotoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: "rgba(107, 56, 212, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(107, 56, 212, 0.22)",
  },
  addPhotoChipText: {
    fontFamily: fontFamily.title,
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.2,
  },
  photoCopyBlock: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    maxWidth: "100%",
    paddingTop: 2,
    gap: spacing[2],
  },
  aiTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: "rgba(107, 56, 212, 0.12)",
  },
  aiTagText: {
    fontFamily: fontFamily.label,
    fontSize: 9,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  photoCopyTitle: {
    fontFamily: fontFamily.title,
    fontSize: 16,
    fontWeight: "700",
    color: colors.onSurface,
    lineHeight: 22,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  photoCopyBody: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    fontWeight: "400",
    color: colors.onSurfaceVariant,
    lineHeight: 20,
    flexShrink: 1,
    width: "100%",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  photoEditBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surfaceContainerLowest,
  },
  photoRemove: {
    position: "absolute",
    bottom: 4,
    left: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surfaceContainerLowest,
  },
  hint: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    fontWeight: "500",
    color: colors.onSurfaceVariant,
    marginTop: spacing[2],
    lineHeight: 18,
  },
  err: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: spacing[2],
    fontWeight: "600",
  },
});
