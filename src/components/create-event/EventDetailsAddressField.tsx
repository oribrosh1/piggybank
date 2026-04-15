import React, { useState, useMemo, useCallback } from "react";
import { View, Text, Platform, StyleSheet } from "react-native";
import { MapPin } from "lucide-react-native";
import GooglePlacesTextInput from "@/src/components/create-event/places/GooglePlacesTextInput";
import { colors, spacing, radius, fontFamily } from "@/src/theme";

const GOOGLE_PLACES_API_KEY = "AIzaSyA5YGDeZpa2bcYGeZQ7XJOSVPTQCh-HrG8";

const US_ONLY_REGIONS = ["US"] as const;
/** Card fill — white to match date/time and suggestion panel. */
const CARD_FILL = colors.surfaceContainerLowest;
const ICON_HOLE = "rgba(4, 120, 87, 0.12)";
const ICON_COLUMN = 48 + spacing[3];

type EventDetailsAddressFieldProps = {
  addressError?: string;
  addressFocused: boolean;
  onAddressSelect: (address1: string, address2: string) => void;
  onAddressFocus: () => void;
  onAddressBlur: () => void;
};

export default function EventDetailsAddressField({
  addressError,
  addressFocused,
  onAddressSelect,
  onAddressFocus,
  onAddressBlur,
}: EventDetailsAddressFieldProps) {
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  /** Full width of icon + body row (inside card padding) — expands Places so suggestions aren’t clipped by negative `left`. */
  const [cardRowWidth, setCardRowWidth] = useState(0);

  const onSuggestionsOpenChange = useCallback((open: boolean) => {
    setSuggestionsOpen(open);
  }, []);

  const borderColor = addressFocused
    ? "rgba(107, 56, 212, 0.35)"
    : addressError
      ? "#EF4444"
      : "transparent";

  const panelBorderColor =
    suggestionsOpen && addressError
      ? "#EF4444"
      : suggestionsOpen && addressFocused
        ? borderColor
        : colors.outlineVariant;

  const placesStyles = useMemo(
    () => ({
      container: {
        position: "relative" as const,
        overflow: "visible" as const,
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
        paddingRight: 12,
        paddingVertical: spacing[1],
        fontSize: 15,
        fontFamily: fontFamily.body,
        fontWeight: "500" as const,
        color: colors.onSurface,
      },
      suggestionsContainer: {
        marginTop: suggestionsOpen ? 0 : 6,
        maxHeight: 220,
        backgroundColor: CARD_FILL,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: radius.md,
        borderBottomRightRadius: radius.md,
        borderTopWidth: 0,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: panelBorderColor,
        overflow: "hidden" as const,
        ...(suggestionsOpen
          ? {}
          : Platform.select({
              ios: {
                shadowColor: colors.onSurface,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
              },
              android: { elevation: 4 },
            })),
      },
      suggestionsList: {
        backgroundColor: "transparent",
        borderWidth: 0,
        maxHeight: 220,
      },
      suggestionItem: {
        backgroundColor: suggestionsOpen ? "transparent" : CARD_FILL,
        borderWidth: 0,
        borderRadius: 0,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 0,
      },
    }),
    [suggestionsOpen, panelBorderColor]
  );

  return (
    <View style={[styles.wrap, { zIndex: 40, elevation: 40 }]}>
      <View
        style={[
          styles.card,
          { borderColor },
          suggestionsOpen && styles.cardSuggestionsOpen,
          suggestionsOpen && styles.cardOverflowVisible,
        ]}
      >
        <View
          style={styles.cardContent}
          onLayout={({ nativeEvent }) => {
            const w = nativeEvent.layout.width;
            if (w > 0) {
              setCardRowWidth(w);
            }
          }}
        >
          <View style={styles.iconWrap}>
            <MapPin size={22} color={colors.secondary} strokeWidth={2.2} />
          </View>
          <View style={[styles.body, suggestionsOpen && styles.bodyOverflowVisible]}>
            <Text style={styles.label}>Event location</Text>
            <View style={styles.inputShell}>
              <View
                style={[
                  styles.placesWrap,
                  cardRowWidth > 0
                    ? { width: cardRowWidth + 26, marginStart: -ICON_COLUMN - 13 }
                    : styles.placesWrapBleedFallback,
                ]}
              >
                <GooglePlacesTextInput
                  scrollEnabled
                  nestedScrollEnabled
                  onSuggestionsOpenChange={onSuggestionsOpenChange}
                  includedRegionCodes={[...US_ONLY_REGIONS]}
                  languageCode="en"
                  placeHolderText="Search for a venue or address"
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
      {addressError ? <Text style={styles.err}>{addressError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing[5],
  },
  card: {
    backgroundColor: CARD_FILL,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    minWidth: 0,
  },
  /** Until row width is measured, still shift left so first layout is close. */
  placesWrapBleedFallback: {
    width: "100%" as const,
    marginStart: -ICON_COLUMN,
  },
  /** Flush with suggestion list: no bottom curve or bottom border (list carries outline). */
  cardSuggestionsOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  cardOverflowVisible: {
    overflow: "visible",
  },
  iconWrap: {
    width: 48,
    marginRight: spacing[3],
    height: 48,
    borderRadius: 24,
    backgroundColor: ICON_HOLE,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  bodyOverflowVisible: {
    overflow: "visible",
  },
  label: {
    fontFamily: fontFamily.label,
    fontSize: 10,
    fontWeight: "700",
    color: colors.onSurfaceVariant,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    marginBottom: spacing[1],
  },
  inputShell: {
    position: "relative",
    minHeight: 44,
    overflow: "visible",
  },
  placesWrap: {
    width: "100%",
    minHeight: 44,
    overflow: "visible",
  },
  err: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: spacing[2],
    fontWeight: "600",
  },
});
