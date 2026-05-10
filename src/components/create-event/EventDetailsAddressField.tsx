import React, { useState, useMemo, useCallback } from "react";
import { View, Text, Platform, StyleSheet, TextInput } from "react-native";
import { BlurView } from "expo-blur";
import { MapPin, ParkingCircle, Car } from "lucide-react-native";
import GooglePlacesTextInput from "@/src/components/create-event/places/GooglePlacesTextInput";
import {
  GlassCardDark,
  GLASS_CARD_DARK_BORDER_DEFAULT,
} from "@/src/components/common/GlassCardDark";
import { colors, spacing, radius, fontFamily } from "@/src/theme";
import { FontAwesome6 } from "@expo/vector-icons";

const GOOGLE_PLACES_API_KEY = "AIzaSyA5YGDeZpa2bcYGeZQ7XJOSVPTQCh-HrG8";

const US_ONLY_REGIONS = ["US"] as const;

/** Same values as `GlassCardDark` — inlined so this file does not import that component. */
const GLASS_FILL_IOS = "rgba(239, 244, 255, 0.6)";
const GLASS_FILL_ANDROID = "rgba(239, 244, 255, 0.8)";
const ADDRESS_SHELL_BORDER_IDLE = "rgba(255, 255, 255, 0.32)";
const NOTES_FIELD_FOCUS = "rgba(107, 56, 212, 0.07)";
const NOTES_ICON_BG = "rgba(107, 56, 212, 0.11)";
const GLASS_BLUR_INTENSITY = 14;
/** Pin column width = icon + gutter (compact row) */
const ICON_COLUMN = 44 + spacing[2];
const ICON_HOLE = "rgba(107, 56, 212, 0.1)";

type EventDetailsAddressFieldProps = {
  addressError?: string;
  addressFocused: boolean;
  onAddressSelect: (address1: string, address2: string) => void;
  onAddressFocus: () => void;
  onAddressBlur: () => void;
  /** Optional — directions for finding the venue (gate, elevator, buzzer). */
  locationNotes: string;
  parking: string;
  locationNotesFocused: boolean;
  parkingFocused: boolean;
  onLocationNotesChange: (value: string) => void;
  onParkingChange: (value: string) => void;
  onLocationNotesFocus: () => void;
  onLocationNotesBlur: () => void;
  onParkingFocus: () => void;
  onParkingBlur: () => void;
};

export default function EventDetailsAddressField({
  addressError,
  addressFocused,
  onAddressSelect,
  onAddressFocus,
  onAddressBlur,
  locationNotes,
  parking,
  locationNotesFocused,
  parkingFocused,
  onLocationNotesChange,
  onParkingChange,
  onLocationNotesFocus,
  onLocationNotesBlur,
  onParkingFocus,
  onParkingBlur,
}: EventDetailsAddressFieldProps) {
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  /** Full width of icon + body row (inside card padding) — expands Places so suggestions aren’t clipped by negative `left`. */
  const [cardRowWidth, setCardRowWidth] = useState(0);

  const onSuggestionsOpenChange = useCallback((open: boolean) => {
    setSuggestionsOpen(open);
  }, []);

  const shellBorderColor = addressFocused
    ? "rgba(107, 56, 212, 0.35)"
    : addressError
      ? "#EF4444"
      : ADDRESS_SHELL_BORDER_IDLE;

  const notesBorderColor =
    locationNotesFocused || parkingFocused
      ? "rgba(107, 56, 212, 0.32)"
      : GLASS_CARD_DARK_BORDER_DEFAULT;

  const panelBorderColor =
    suggestionsOpen && addressError
      ? "#EF4444"
      : suggestionsOpen && addressFocused
        ? shellBorderColor
        : colors.outlineVariant;

  const placesStyles = useMemo(
    () => ({
      container: {
        position: "relative" as const,
        overflow: "hidden" as const,
        width: "100%" as const,
        alignSelf: "stretch" as const,
      },
      inputRow: {
        paddingStart: ICON_COLUMN,
      },
      input: {
        borderWidth: 0,
        borderRadius: radius.sm,
        backgroundColor: "transparent",
        paddingLeft: 0,
        paddingRight: 10,
        paddingVertical: 2,
        minHeight: 56,
        fontSize: 15,
        fontFamily: fontFamily.body,
        fontWeight: "500" as const,
        color: colors.onSurface,
      },
      /** Inline list: single shell border from parent; only a top divider + tint inside rounded card */
      suggestionsContainer: {
        marginTop: suggestionsOpen ? 0 : 6,
        maxHeight: 220,
        width: "100%" as const,
        alignSelf: "stretch" as const,
        backgroundColor: Platform.OS === "ios" ? "transparent" : GLASS_FILL_ANDROID,
        borderTopWidth: suggestionsOpen ? StyleSheet.hairlineWidth : 0,
        borderTopColor: suggestionsOpen ? panelBorderColor : "transparent",
        borderLeftWidth: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderRadius: 0,
        overflow: "hidden" as const,
      },
      suggestionsList: {
        backgroundColor: "transparent",
        borderWidth: 0,
        maxHeight: 220,
      },
      suggestionItem: {
        backgroundColor: suggestionsOpen ? "transparent" : Platform.OS === "ios" ? GLASS_FILL_IOS : GLASS_FILL_ANDROID,
        borderWidth: 0,
        borderRadius: 0,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 0,
      },
    }),
    [suggestionsOpen, panelBorderColor]
  );

  const notesParkingInputs = (
    <View style={styles.notesFieldsStack}>
      <View
        style={[
          styles.notesFieldSlot,
          locationNotesFocused && styles.notesFieldSlotFocused,
        ]}
      >
        <Text style={styles.notesModernLabel}>Venue notes</Text>
        <TextInput
          style={styles.notesModernInput}
          placeholder="Gate, entry…"
          placeholderTextColor={colors.muted}
          value={locationNotes}
          onChangeText={onLocationNotesChange}
          onFocus={onLocationNotesFocus}
          onBlur={onLocationNotesBlur}
          multiline
          maxLength={280}
          textAlignVertical="top"
          underlineColorAndroid="transparent"
          selectionColor={colors.primary}
        />
      </View>
      <View style={styles.notesInsetDivider} />
      <View
        style={[
          styles.notesFieldSlot,
          parkingFocused && styles.notesFieldSlotFocused,
        ]}
      >
        <View style={styles.notesParkingLabelRow}>
          <ParkingCircle size={16} color={colors.primary} strokeWidth={1.8} />
          <Text style={styles.notesModernLabelParking}>Parking</Text>
        </View>
        <TextInput
          style={styles.notesModernInput}
          placeholder="Valet, street…"
          placeholderTextColor={colors.muted}
          value={parking}
          onChangeText={onParkingChange}
          onFocus={onParkingFocus}
          onBlur={onParkingBlur}
          multiline
          maxLength={280}
          textAlignVertical="top"
          underlineColorAndroid="transparent"
          selectionColor={colors.primary}
        />
      </View>
    </View>
  );

  const cardBody = (
    <View
      style={styles.cardContent}
      onLayout={({ nativeEvent }) => {
        const w = nativeEvent.layout.width;
        if (w > 0) {
          setCardRowWidth(w);
        }
      }}
    >
      <View style={styles.inputRowWithIcon}>
        <View style={styles.iconWrap}>
          <MapPin size={24} color={colors.primary} strokeWidth={2.2} />
        </View>
        <View style={styles.body}>
          <View style={styles.inputShell}>
            <View
              style={[
                styles.placesWrap,
                cardRowWidth > 0
                  ? {
                      width: cardRowWidth + 28,
                      marginStart: -ICON_COLUMN - 14,
                    }
                  : styles.placesWrapBleedFallback,
              ]}
            >
              <GooglePlacesTextInput
                suggestionsGlassBlur
                suggestionsInline
                scrollEnabled
                nestedScrollEnabled
                onSuggestionsOpenChange={onSuggestionsOpenChange}
                includedRegionCodes={[...US_ONLY_REGIONS]}
                languageCode="en"
                placeHolderText="Search for an address"
                onFocus={onAddressFocus}
                onTouchStart={onAddressFocus}
                style={placesStyles}
                fetchDetails={true}
                apiKey={GOOGLE_PLACES_API_KEY}
                onPlaceSelect={(place) => {
                  const main = place.structuredFormat?.mainText?.text ?? "";
                  const secondary = place.structuredFormat?.secondaryText?.text ?? "";
                  onAddressSelect(main, secondary);
                  onAddressBlur();
                }}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.wrap, { zIndex: 40, elevation: 40 }]}>
      <View style={styles.glassOuter}>
        <View style={styles.addrSectionHeader}>
          <View style={styles.addrHeaderIconRotate}>
            <FontAwesome6
              name="map-location-dot"
              size={22}
              color={colors.primary}
            />
          </View>
          <Text style={styles.addrHeaderTitle}>Event location</Text>
        </View>
        <View style={[styles.glassShell, { borderColor: shellBorderColor }]}>
          {Platform.OS === "ios" ? (
            <BlurView
              intensity={GLASS_BLUR_INTENSITY}
              tint="light"
              style={[styles.glassInnerDense, styles.glassFillIos]}
            >
              {cardBody}
            </BlurView>
          ) : (
            <View style={[styles.glassInnerDense, styles.glassFillAndroid]}>
              {cardBody}
            </View>
          )}
        </View>
      </View>

      <View style={styles.notesSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.notesHeadIconWrap}>
            <Car size={18} color={colors.primary} strokeWidth={2} />
          </View>
          <Text style={styles.notesCompactTitle}>
            Venue & parking
            <Text style={styles.notesMutedSuffix}> · optional</Text>
          </Text>
        </View>
        <GlassCardDark
          padding={0}
          borderRadius={20}
          borderColor={notesBorderColor}
          contentStyle={styles.notesGlassCardContent}
        >
          {notesParkingInputs}
        </GlassCardDark>
      </View>

      {addressError ? <Text style={styles.err}>{addressError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing[4],
  },
  glassOuter: {
    alignSelf: "stretch",
    borderRadius: 20,
    shadowColor: "#0c1c2a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    ...Platform.select({
      android: { elevation: 4 },
    }),
  },
  glassShell: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  glassInnerDense: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    position: "relative",
  },
  glassFillIos: {
    backgroundColor: GLASS_FILL_IOS,
  },
  glassFillAndroid: {
    backgroundColor: GLASS_FILL_ANDROID,
  },
  addrSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing[1],
    marginBottom: spacing[2],
    marginLeft: spacing[1],
    gap: spacing[2],
  },
  addrHeaderIconRotate: {
    transform: [{ rotate: "8deg" }],
  },
  addrHeaderTitle: {
    fontFamily: fontFamily.headline,
    fontSize: 14,
    marginTop: spacing[2],
    textTransform: "uppercase",
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: 0.85,
    opacity: 0.92,
  },
  notesSection: {
    marginTop: spacing[3],
    alignSelf: "stretch",
  },
  notesGlassCardContent: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
    position: "relative",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginBottom: spacing[2],
    marginLeft: spacing[1],
    paddingRight: spacing[1],
  },
  notesHeadIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: NOTES_ICON_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  notesCompactTitle: {
    flex: 1,
    minWidth: 0,
    fontFamily: fontFamily.title,
    fontSize: 15,
    fontWeight: "600",
    color: colors.onSurface,
    letterSpacing: -0.28,
    lineHeight: 20,
  },
  notesMutedSuffix: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.onSurfaceVariant,
    letterSpacing: -0.1,
  },
  notesFieldsStack: {
    alignSelf: "stretch",
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  notesFieldSlot: {
    paddingHorizontal: spacing[2],
    paddingTop: spacing[2],
    paddingBottom: 6,
  },
  notesFieldSlotFocused: {
    backgroundColor: NOTES_FIELD_FOCUS,
  },
  notesInsetDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(107, 56, 212, 0.1)",
    marginHorizontal: spacing[2],
  },
  notesModernLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.onSurfaceVariant,
    letterSpacing: -0.05,
    marginBottom: 4,
    opacity: 0.95,
  },
  notesParkingLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  notesModernLabelParking: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.onSurfaceVariant,
    letterSpacing: -0.05,
    opacity: 0.95,
  },
  notesModernInput: {
    borderWidth: 0,
    padding: 0,
    margin: 0,
    minHeight: 38,
    fontSize: 14,
    fontFamily: fontFamily.body,
    fontWeight: "500",
    lineHeight: 20,
    color: colors.onSurface,
    backgroundColor: "transparent",
  },
  cardContent: {
    flexDirection: "column",
    alignItems: "stretch",
    width: "100%",
    minWidth: 0,
  },
  /** Icon stays top-aligned with the input row; suggestions grow below without shifting the pin */
  inputRowWithIcon: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
    minWidth: 0,
  },
  /** Until row width is measured, still shift left so first layout is close. */
  placesWrapBleedFallback: {
    width: "100%" as const,
    marginStart: -ICON_COLUMN,
  },
  iconWrap: {
    width: 44,
    marginRight: spacing[2],
    marginTop: spacing[2],
    height: 44,
    borderRadius: 13,
    backgroundColor: ICON_HOLE,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontFamily: fontFamily.label,
    fontSize: 10,
    fontWeight: "700",
    color: colors.onSurfaceVariant,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    marginBottom: spacing[2],
  },
  inputShell: {
    position: "relative",
    minHeight: 52,
    overflow: "visible",
  },
  placesWrap: {
    width: "100%",
    minHeight: 52,
    overflow: "visible",
  },
  err: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: spacing[2],
    fontWeight: "600",
  },
});
