import React from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Pencil, X, Sparkles, Camera, PartyPopperIcon } from "lucide-react-native";
import { GlassCardDark } from "@/src/components/common/GlassCardDark";
import OptionalSectionBadge from "@/src/components/common/OptionalSectionBadge";
import { colors, spacing, radius, fontFamily } from "@/src/theme";
import { MaterialIcons} from "@expo/vector-icons";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { HonoreeGender } from "@/types/events";
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
  /** For AI poster & copy — explicit boy / girl selection. */
  honoreeGender?: HonoreeGender;
  honoreeGenderError?: string;
  onHonoreeGenderChange: (gender: "boy" | "girl") => void;
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
  honoreeGender,
  honoreeGenderError,
  onHonoreeGenderChange,
}: EventDetailsCelebrationCardProps) {
  const nameUnderline = nameError ? "#EF4444" : nameFocused ? colors.primary : "transparent";
  const ageUnderline = ageError ? "#EF4444" : ageFocused ? colors.primary : "transparent";
  const hasPhoto = Boolean(honoreePhotoUri);
  const genderBoy = honoreeGender === "boy";
  const genderGirl = honoreeGender === "girl";

  return (
    <View style={styles.wrap}>
      {/* Section 1 — name & age on one line */}

      <View style={{...styles.photoSectionHeader, marginTop: 85}}>
        <View style={{ flexDirection: "row", alignItems: "center" , transform: [{ rotate: "10deg" }] }}>
          <PartyPopperIcon size={26} color={colors.primary} strokeWidth={2.4} />
        </View>
        <Text style={{
    fontFamily: fontFamily.headline,
    fontSize: 13,
    marginLeft: spacing[2],
    textTransform: "uppercase",
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: 1.1,
  }}>Who are we celebrating?</Text>    
    </View>


      <GlassCardDark blurIntensity={30} padding={spacing[4]} borderRadius={radius.md} borderColor="rgba(107, 56, 212, 0.1)">
        <View style={styles.nameAgeRow}>
          <View style={styles.nameColumn}>
            <Text style={styles.fieldLabelAbove}>Child's Name</Text>
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
          </View>
          <View style={styles.ageColumn}>
            <Text style={[styles.fieldLabelAbove, styles.ageFieldLabelAbove]}>
              Turning age
            </Text>
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
        <View style={styles.genderBlock}>
          <Text style={styles.genderLabel}>Boy or girl</Text>
          <View style={styles.genderChipsRow}>
            <TouchableOpacity
              onPress={() => onHonoreeGenderChange("boy")}
              activeOpacity={0.85}
              style={[
                styles.genderChip,
                genderBoy && styles.genderChipSelected,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: genderBoy }}
              accessibilityLabel="Boy"
            >
              <MaterialIcons name="male" size={22} color={genderBoy ? "#FFFFFF" : colors.primary} />
              <Text style={[styles.genderChipLabel, genderBoy && styles.genderChipLabelSelected]}>
                Boy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onHonoreeGenderChange("girl")}
              activeOpacity={0.85}
              style={[
                styles.genderChip,
                genderGirl && styles.genderChipSelected,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: genderGirl }}
              accessibilityLabel="Girl"
            >
              <MaterialIcons name="female" size={22} color={genderGirl ? "#FFFFFF" : colors.primary} />
              <Text style={[styles.genderChipLabel, genderGirl && styles.genderChipLabelSelected]}>
                Girl
              </Text>
            </TouchableOpacity>
          </View>
          {honoreeGenderError ? (
            <Text style={styles.genderErr}>{honoreeGenderError}</Text>
          ) : (
            <Text style={styles.genderHint}>Used so your poster wording and character feel right.</Text>
          )}
        </View>
      </GlassCardDark>
      <Text style={styles.hint}>
        This name and age appear on your poster and invitations.
      </Text>

      {/* Section 2 — photo hero + AI poster copy */}
      <View style={styles.photoSectionHeader}>
        <View style={{ flexDirection: "row", alignItems: "center" , transform: [{ rotate: "15deg" }] }}>
        <FontAwesome name="camera-retro" size={24} color={colors.primary}/>
        </View>
        <View style={{ flex: 1, marginLeft: spacing[2] }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
            <Text
              style={{
                fontFamily: fontFamily.headline,
                fontSize: 13,
                textTransform: "uppercase",
                fontWeight: "800",
                color: colors.onSurface,
                letterSpacing: 1.1,
              }}
            >
              Add your child&apos;s photo
            </Text>
            <OptionalSectionBadge />
          </View>
        </View>
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
              <View style={styles.photoAvatarWrap}>
                <HonoreeAvatarRing size={HONOREE_PHOTO_AVATAR_SIZE}>
                  <View style={styles.emojiFill}>
                    <Image
                      source={require("../../../assets/images/profile-pic.png")}
                      style={styles.photoImage}
                    />
                  </View>
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
              </View>
              <View style={styles.addPhotoChip}>
                <Camera size={14} color={colors.primary} strokeWidth={2.4} />
                <Text style={styles.addPhotoChipText}>Add photo</Text>
              </View>
            </TouchableOpacity>
          )}
          <View style={styles.photoCopyBlock}>
            <View style={styles.aiTag}>
              <Text style={styles.aiTagText}>AI match</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[2] , transform: [{ rotate: "15deg" }] }}>
                <Sparkles size={18} color={colors.primary} strokeWidth={2.2} />
              </View>

            </View>
            <Text style={styles.photoCopyTitle}>Make the poster feel like them</Text>
            <Text style={styles.photoCopyBody}>
              Add a clear, front-facing photo. {"\n"}
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
    marginBottom: 20,
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
    // gap: spacing[2],
    marginTop: spacing[5],
    marginBottom: spacing[2],
    marginLeft: spacing[2],

  },
  sectionLabelPhoto: {
    fontFamily: fontFamily.headline,
    fontSize: 13,
    marginLeft: spacing[2],
    textTransform: "uppercase",
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: 0.4,
  },
  nameAgeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
  },
  nameColumn: {
    flex: 1,
    minWidth: 0,
    flexDirection: "column",
    alignItems: "stretch",
    paddingBottom: spacing[1],
  },
  nameCell: {
    width: "100%",
    minWidth: 0,
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
    alignItems: "stretch",
    flexShrink: 0,
    paddingBottom: spacing[1],
  },
  fieldLabelAbove: {
    fontFamily: fontFamily.label,
    fontSize: 10,
    fontWeight: "700",
    color: colors.onSurfaceVariant,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: spacing[1],
    minHeight: 14,
  },
  ageFieldLabelAbove: {
    textAlign: "center",
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
  genderBlock: {
    // marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(107, 56, 212, 0.12)",
  },
  genderLabel: {
    fontFamily: fontFamily.headline,
    fontSize: 10,
    fontWeight: "700",
    color: colors.onSurfaceVariant,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: spacing[2],
  },
  genderChipsRow: {
    flexDirection: "row",
    gap: spacing[3],
    alignItems: "stretch",
  },
  genderChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: "rgba(107, 56, 212, 0.28)",
    backgroundColor: "rgba(107, 56, 212, 0.06)",
  },
  genderChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderChipLabel: {
    fontFamily: fontFamily.title,
    fontSize: 15,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.2,
  },
  genderChipLabelSelected: {
    color: "#FFFFFF",
  },
  genderHint: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    fontWeight: "500",
    color: colors.onSurfaceVariant,
    marginTop: spacing[2],
    lineHeight: 16,
  },
  genderErr: {
    fontSize: 12,
    fontWeight: "600",
    color: "#EF4444",
    marginTop: spacing[2],
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
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: "rgba(107, 56, 212, 0.12)",
  },
  aiTagText: {
    fontFamily: fontFamily.title,
    fontSize: 12,
    fontWeight: "bold",
    color: colors.primary,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  photoCopyTitle: {
    fontFamily: fontFamily.title,
    fontSize: 16,
    fontWeight: "700",
    color: colors.onSurface,
    lineHeight: 22,
    flexShrink: 1,
  },
  photoCopyBody: {
    fontFamily: fontFamily.title,
    fontSize: 13,
    fontWeight: "700",
    color: colors.onSurfaceVariant,
    lineHeight: 20,
    letterSpacing: -0.5,
    flexShrink: 1,
    width: "100%",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  photoEditBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 18,
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
    marginTop: spacing[1],
    marginLeft: spacing[2],
    lineHeight: 18,
  },
  err: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: spacing[2],
    fontWeight: "600",
  },
});
