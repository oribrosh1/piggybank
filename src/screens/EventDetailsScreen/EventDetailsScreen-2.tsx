import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Building2,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  MapPin,
  ParkingCircle,
  Search,
  Sparkles,
  WandSparkles,
} from "lucide-react-native";
import GooglePlacesTextInput from "@/src/components/create-event/places/GooglePlacesTextInput";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Circle as SvgCircle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from "react-native-svg";

import {
  EventDetailsCelebrationCard,
  EventDetailsCelebrationTypeCard,
  EventDetailsOptionalCard,
  EventDetailsScreenFooter,
  EventDatePickerModal,
  EventTimePickerModal,
  EventAgePickerModal,
} from "@/src/components/create-event";
import InvitationExamplesModal from "@/src/components/create-event/InvitationExamplesModal";
import EventThemeAndVibeCard from "@/src/components/create-event/EventThemeAndVibeCard";
import { AppMeshBackground } from "@/src/components/AppMeshBackground";
import { GlassCardDark } from "@/src/components/common/GlassCardDark";
import { colors, fontFamily, radius, spacing } from "@/src/theme";
import { PARTY_TYPE_OPTIONS } from "@/src/constants/partyTypeOptions";
import { useEventDetailsScreen } from "./useEventDetailsScreen";

const SCREEN_WIDTH = Dimensions.get("window").width;

/** Fan of 3 invitation thumbnails. Outward tilt mirrors the reference layout. */
const FAN_ASSETS = [
  require("../../../assets/images/invitation-examples/example-01.png"),
  require("../../../assets/images/invitation-examples/example-02.png"),
  require("../../../assets/images/invitation-examples/example-03.png"),
] as const;
const FAN_CARD_W = 132;
const FAN_CARD_H = 168;
/**
 * Back-to-front render order (left → right → center) for correct z-stacking.
 * First image (left) is static — no fly-in. Second (center) and third (right)
 * slide up with a short stagger.
 */
const FAN_DRAW = [
  {
    src: FAN_ASSETS[0],
    rotate: -10,
    dx: -130,
    dy: 12,
    scale: 1,
    z: 1,
    animateFlyIn: false,
  },
  {
    src: FAN_ASSETS[2],
    rotate: 10,
    dx: 130,
    dy: -8,
    scale: 1.05,
    z: 2,
    animateFlyIn: true,
    /** Starts after center card fly-in (~520ms) + short pause so two and three don’t overlap. */
    flyInDelay: 860,
  },
  {
    src: FAN_ASSETS[1],
    rotate: 0,
    dx: 0,
    dy: -4,
    scale: 1.05,
    z: 3,
    animateFlyIn: true,
    flyInDelay: 220,
  },
] as const;

/** Purple → cyan brand gradient stops used by the SVG text + underline. */
const GRADIENT_PURPLE = "#6b38d4";
const GRADIENT_CYAN = "#06b6d4";

/** Width / height of the "invitation" SVG box (and visual font size). */
const INVITATION_W = 220;
const INVITATION_H = 60;
const INVITATION_FONT_SIZE = 48;

/**
 * "invitation" rendered as SVG so we can paint the glyphs with a horizontal
 * purple→cyan gradient. Uses the Caveat Brush handwritten script font to
 * match the reference (RN <Text> can't do gradient fills natively).
 */
function InvitationGradientWord() {
  return (
    <Svg
      width={INVITATION_W}
      height={INVITATION_H}
      viewBox={`0 0 ${INVITATION_W} ${INVITATION_H}`}
      fill="none"
    >
      <Defs>
        <SvgLinearGradient
          id="invitationFill"
          x1="0"
          y1="0"
          x2="1"
          y2="0"
        >
          <Stop offset="0" stopColor={GRADIENT_PURPLE} />
          <Stop offset="0.55" stopColor={colors.primaryContainer} />
          <Stop offset="1" stopColor={GRADIENT_CYAN} />
        </SvgLinearGradient>
      </Defs>
      <SvgText
        x="0"
        y={INVITATION_FONT_SIZE}
        fontSize={INVITATION_FONT_SIZE}
        fontFamily={fontFamily.display}
        fontWeight="800"
        fontStyle="italic"
        fill="url(#invitationFill)"
      >
        invitation
      </SvgText>
    </Svg>
  );
}

/** Brush underline drawn under "invitation" with the same gradient. */
function InvitationUnderline() {
  return (
    <Svg width={INVITATION_W} height={14} viewBox={`0 0 ${INVITATION_W} 14`} fill="none">
      <Defs>
        <SvgLinearGradient
          id="underlineFill"
          x1="0"
          y1="0"
          x2="1"
          y2="0"
        >
          <Stop offset="0" stopColor={GRADIENT_PURPLE} />
          <Stop offset="0.55" stopColor={colors.primaryContainer} />
          <Stop offset="1" stopColor={GRADIENT_CYAN} />
        </SvgLinearGradient>
      </Defs>
      <Path
        d={`M4 9 C 70 2, 170 2, ${INVITATION_W - 6} 8`}
        stroke="url(#underlineFill)"
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

/**
 * Three doodled spark flicks rendered straight from the design PNG asset
 * (assets/pages/design-invitation-page/title-drawing.png) — keeps the exact
 * brushy look from the reference without re-drawing it in SVG.
 */
function InvitationSparkMarks() {
  return (
    <Image
      source={require("../../../assets/pages/design-invitation-page/title-drawing.png")}
      style={styles.sparkImage}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  );
}

/** Faint dotted/circle motifs behind the hero — purely decorative. */
function HeroBackgroundDecor() {
  return (
    <Svg
      width={SCREEN_WIDTH}
      height={320}
      viewBox={`0 0 ${SCREEN_WIDTH} 320`}
      fill="none"
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <SvgCircle cx={28} cy={70} r={26} fill="rgba(132, 85, 239, 0.07)" />
      <SvgCircle cx={12} cy={170} r={48} fill="rgba(132, 85, 239, 0.05)" />
      <SvgCircle
        cx={SCREEN_WIDTH - 30}
        cy={250}
        r={36}
        fill="rgba(107, 56, 212, 0.05)"
      />
      {Array.from({ length: 18 }).map((_, i) => (
        <SvgCircle
          key={`dot-${i}`}
          cx={SCREEN_WIDTH - 14 - (i % 6) * 6}
          cy={20 + Math.floor(i / 6) * 6}
          r={1.4}
          fill="rgba(107, 56, 212, 0.25)"
        />
      ))}
    </Svg>
  );
}

/** Quick-fill chips for the "Describe the vibe" section. */
const VIBE_CHIPS = PARTY_TYPE_OPTIONS;

/** Brush underline drawn under "DESCRIBE THE VIBE" with the brand purple→cyan gradient. */
function VibeTitleUnderline({ width = 210 }: { width?: number }) {
  return (
    <Svg width={width} height={10} viewBox={`0 0 ${width} 10`} fill="none">
      <Defs>
        <SvgLinearGradient
          id="vibeUnderlineFill"
          x1="0"
          y1="0"
          x2="1"
          y2="0"
        >
          <Stop offset="0" stopColor={GRADIENT_PURPLE} />
          <Stop offset="0.55" stopColor={colors.primaryContainer} />
          <Stop offset="1" stopColor={GRADIENT_CYAN} />
        </SvgLinearGradient>
      </Defs>
      <Path
        d={`M3 6 C ${width * 0.3} 1, ${width * 0.7} 1, ${width - 4} 5`}
        stroke="url(#vibeUnderlineFill)"
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

type DescribeVibeSectionProps = {
  value: string;
  focused: boolean;
  onChange: (next: string) => void;
  onFocus: () => void;
  onBlur: () => void;
};

/**
 * "Describe the vibe" section — companion to "Customize your poster".
 * Renders the numbered step badge, brush-underlined title, the writing-robot
 * mascot beside a multiline input, and a wrap of suggestion chips that append
 * to the input on tap.
 */
function DescribeVibeSection({
  value,
  focused,
  onChange,
  onFocus,
  onBlur,
}: DescribeVibeSectionProps) {
  /**
   * Append the chip phrase to the current vibe text, comma-separating it from
   * any existing content so taps build up a list rather than clobbering it.
   * Trailing whitespace from the user's last edit is normalised so we always
   * land on ", chip" instead of doubling separators.
   */
  const appendChip = useCallback(
    (chip: string) => {
      const trimmed = (value ?? "").trimEnd().replace(/[,\s]+$/, "");
      const next = trimmed.length === 0 ? chip : `${trimmed}, ${chip}`;
      onChange(next);
    },
    [value, onChange],
  );

  return (
    <GlassCardDark
      style={vibeStyles.card}
      padding={0}
      borderRadius={radius.lg}
      borderColor="rgba(107, 56, 212, 0.12)"
      blurIntensity={24}
      contentStyle={vibeStyles.cardContent}
    >
      <Image
        source={require("../../../assets/images/create-event/crown-drowing.png")}
        style={vibeStyles.headphones}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />

      <View style={vibeStyles.headerRow}>
        <View style={vibeStyles.headerTextBlock}>
          <Text style={vibeStyles.title}>DESCRIBE THE VIBE</Text>
          <View style={vibeStyles.titleUnderline} pointerEvents="none">
            <VibeTitleUnderline />
          </View>
          <View style={vibeStyles.subtitleRow}>
            <Text style={vibeStyles.subtitle}>
              Tell us the energy, music, activities and anything that makes this
              party epic!
            </Text>
          </View>
        </View>
      </View>

      <View style={vibeStyles.inputRow}>
        <Image
          source={require("../../../assets/images/create-event/drawing-robot.png")}
          style={vibeStyles.robot}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
        <View
          style={[
            vibeStyles.inputBubble,
            focused && vibeStyles.inputBubbleFocused,
          ]}
        >
          <TextInput
            style={vibeStyles.input}
            placeholder={
              "e.g. Glow sticks and a DJ, pizza then dance contest, relaxed backyard hang…"
            }
            placeholderTextColor={colors.muted}
            value={value}
            onChangeText={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            multiline
            numberOfLines={3}
            maxLength={400}
            returnKeyType="default"
            accessibilityLabel="Party vibe details for the poster"
            textAlignVertical="top"
          />
          <View style={vibeStyles.wandWrap} pointerEvents="none">
            <WandSparkles
              size={18}
              color={colors.primary}
              strokeWidth={2.2}
            />
          </View>
        </View>
      </View>

      <View style={vibeStyles.chipsWrap}>
        {VIBE_CHIPS.map((chip) => (
          <TouchableOpacity
            key={chip.value}
            onPress={() => appendChip(chip.name)}
            activeOpacity={0.85}
            style={vibeStyles.chip}
            accessibilityRole="button"
            accessibilityLabel={`Add ${chip.name} to the vibe`}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            {chip.iconImage ? (
              <Image
                source={chip.iconImage}
                style={vibeStyles.chipIconImage}
                resizeMode="contain"
              />
            ) : (
              <Text style={vibeStyles.chipIcon}>{chip.label}</Text>
            )}
            <Text
              style={vibeStyles.chipLabel}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {chip.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </GlassCardDark>
  );
}

function parseTimeToDate(timeStr: string): Date | null {
  const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!timeMatch) return null;
  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const period = timeMatch[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  else if (period === "AM" && hours === 12) hours = 0;
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

const WEEKDAY_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/** Reads YYYY-MM-DD and returns the full weekday name, or empty if parse fails. */
function getWeekdayFromIso(dateIso: string): string {
  if (!dateIso) return "";
  const [y, m, d] = dateIso.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return "";
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return "";
  return WEEKDAY_LONG[date.getDay()] ?? "";
}

/**
 * Parse either a 12h ("7:04 PM") or 24h ("19:04") time string into
 * `{ hours24, minutes }`. Returns `null` if the input can't be understood.
 */
function parseTimeString(
  timeStr: string,
): { hours24: number; minutes: number } | null {
  if (!timeStr) return null;
  const twelveHour = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (twelveHour) {
    let hours = parseInt(twelveHour[1], 10);
    const minutes = parseInt(twelveHour[2], 10);
    const period = twelveHour[3].toUpperCase();
    if (period === "PM" && hours !== 12) hours += 12;
    else if (period === "AM" && hours === 12) hours = 0;
    return { hours24: hours, minutes };
  }
  const twentyFour = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFour) {
    return {
      hours24: parseInt(twentyFour[1], 10),
      minutes: parseInt(twentyFour[2], 10),
    };
  }
  return null;
}

/** Converts any supported time string into 24h "HH:MM". */
function formatTimeTo24h(timeStr: string): string {
  const parsed = parseTimeString(timeStr);
  if (!parsed) return "";
  return `${String(parsed.hours24).padStart(2, "0")}:${String(
    parsed.minutes,
  ).padStart(2, "0")}`;
}

/** Converts any supported time string into 12h "h:MM AM/PM". */
function formatTimeTo12h(timeStr: string): string {
  const parsed = parseTimeString(timeStr);
  if (!parsed) return "";
  const period = parsed.hours24 >= 12 ? "PM" : "AM";
  const hour12 = parsed.hours24 % 12 || 12;
  return `${hour12}:${String(parsed.minutes).padStart(2, "0")} ${period}`;
}

type DateTimeSectionProps = {
  dateValue: string;
  timeValue: string;
  dateError?: string;
  timeError?: string;
  dateFocused: boolean;
  timeFocused: boolean;
  formatDateDisplay: (dateString: string) => string;
  onDatePress: () => void;
  onTimePress: () => void;
};

/**
 * DATE & TIME card — reference: assets/images/create-event/date-location-section.png.
 *
 * Two halves of a single rounded pill: left shows the calendar value with the
 * weekday underneath; right shows the 24h time with the 12h echo underneath.
 * Tapping either half opens its existing modal picker through the screen's
 * `onDatePress` / `onTimePress` callbacks (so we don't touch picker logic).
 */
function DateTimeSection({
  dateValue,
  timeValue,
  dateError,
  timeError,
  dateFocused,
  timeFocused,
  formatDateDisplay,
  onDatePress,
  onTimePress,
}: DateTimeSectionProps) {
  const hasError = !!(dateError || timeError);
  const dateLine = dateValue ? formatDateDisplay(dateValue) : "Pick a date";
  const dateSub = dateValue ? getWeekdayFromIso(dateValue) : " ";
  const timeLine = timeValue
    ? formatTimeTo24h(timeValue) || timeValue
    : "--:--";
  /**
   * The secondary line is the 12h echo of the primary 24h. We re-derive it from
   * the canonical parsed value so the two lines never desync, even if the
   * upstream `formData.time` is stored as 24h ("19:38") instead of 12h.
   */
  const timeSub = timeValue
    ? formatTimeTo12h(timeValue) || timeValue
    : " ";

  return (
    <GlassCardDark
      style={cardSectionStyles.card}
      padding={0}
      borderRadius={radius.lg}
      borderColor="rgba(107, 56, 212, 0.12)"
      blurIntensity={24}
      contentStyle={cardSectionStyles.cardContent}
    >
      <View style={cardSectionStyles.headerRow}>
        <View style={cardSectionStyles.headerIconBubble}>
          <ClockIcon size={22} color={colors.primary} strokeWidth={2.2} />
        </View>
        <View style={cardSectionStyles.headerTextBlock}>
          <Text style={cardSectionStyles.headerTitle}>DATE & TIME</Text>
          <Text style={cardSectionStyles.headerSubtitle}>When is the event?</Text>
        </View>
        <Image
          source={require("../../../assets/images/create-event/calander.png")}
          style={cardSectionStyles.headerArtDate}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </View>

      <GlassCardDark
        style={[
          dateTimeStyles.pillOuter,
          (dateFocused || timeFocused) && dateTimeStyles.pillOuterFocused,
          hasError && dateTimeStyles.pillOuterError,
        ]}
        padding={0}
        borderRadius={22}
        borderColor={
          hasError
            ? "#EF4444"
            : dateFocused || timeFocused
              ? colors.primary
              : "rgba(107, 56, 212, 0.28)"
        }
        blurIntensity={20}
        contentStyle={dateTimeStyles.pillInner}
      >
        <TouchableOpacity
          style={dateTimeStyles.dateHalf}
          onPress={onDatePress}
          activeOpacity={0.78}
          accessibilityRole="button"
          accessibilityLabel="Pick event date"
        >
          <View style={dateTimeStyles.miniIconBubble}>
            <CalendarIcon size={18} color={colors.primary} strokeWidth={2.2} />
          </View>
          <View style={dateTimeStyles.valueStack}>
            <Text
              style={[
                dateTimeStyles.valuePrimary,
                !dateValue && dateTimeStyles.valuePlaceholder,
              ]}
              numberOfLines={1}
            >
              {dateLine}
            </Text>
            <Text style={dateTimeStyles.valueSecondary} numberOfLines={1}>
              {dateSub}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={dateTimeStyles.divider} />

        <TouchableOpacity
          style={dateTimeStyles.timeHalf}
          onPress={onTimePress}
          activeOpacity={0.78}
          accessibilityRole="button"
          accessibilityLabel="Pick event start time"
        >
          <View style={dateTimeStyles.miniIconBubble}>
            <ClockIcon size={18} color={colors.primary} strokeWidth={2.2} />
          </View>
          <View style={dateTimeStyles.valueStack}>
            <Text
              style={[
                dateTimeStyles.valuePrimary,
                !timeValue && dateTimeStyles.valuePlaceholder,
              ]}
              numberOfLines={1}
            >
              {timeLine}
            </Text>
            <Text style={dateTimeStyles.valueSecondary} numberOfLines={1}>
              {timeSub}
            </Text>
          </View>
        </TouchableOpacity>
      </GlassCardDark>

      {hasError ? (
        <Text style={cardSectionStyles.errorText}>
          {dateError || timeError}
        </Text>
      ) : null}
    </GlassCardDark>
  );
}

const GOOGLE_PLACES_API_KEY = "AIzaSyA5YGDeZpa2bcYGeZQ7XJOSVPTQCh-HrG8";
const US_ONLY_REGIONS = ["US"] as const;

type EventLocationSectionProps = {
  addressError?: string;
  addressFocused: boolean;
  onAddressSelect: (address1: string, address2: string) => void;
  onAddressFocus: () => void;
  onAddressBlur: () => void;
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

/**
 * EVENT LOCATION card — reference: assets/images/create-event/date-location-section.png.
 *
 * Header strip + a rounded search pill that wraps `GooglePlacesTextInput`.
 * `suggestionsInline` keeps the prediction list inside the rounded shell so the
 * card's corner radius is preserved, and `suggestionPanelLayout` shifts the
 * panel left under the search icon column for clean alignment.
 */
function EventLocationSection({
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
}: EventLocationSectionProps) {
  const placesStyles = {
    container: {
      flex: 1,
      backgroundColor: "transparent",
    },
    /**
     * The icon is absolutely positioned at the top-left of the pill. Padding
     * the input ROW (instead of the input itself) is what actually pushes
     * the visible text + placeholder past the icon — `input.paddingLeft`
     * gets ignored by GooglePlacesTextInput in favor of its internal row
     * padding. `paddingStart` keeps the layout RTL-correct.
     */
    inputRow: {
      paddingStart: 44,
    },
    input: {
      borderWidth: 0,
      backgroundColor: "transparent",
      paddingHorizontal: 0,
      paddingVertical: 0,
      minHeight: 44,
      fontSize: 15,
      fontFamily: fontFamily.body,
      fontWeight: "500" as const,
      color: colors.onSurface,
    },
    /**
     * Transparent so the parent `GlassCardDark` blur/tint shows through —
     * suggestions read as part of the same frosted pill instead of an opaque
     * white card stacked on top. A top hairline divider sets it off from the
     * input row without breaking the visual continuity.
     */
    suggestionsContainer: {
      marginTop: 8,
      maxHeight: 220,
      backgroundColor: "transparent",
      borderRadius: 0,
      borderWidth: 0,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: "rgba(107, 56, 212, 0.18)",
      overflow: "hidden" as const,
    },
    suggestionItem: {
      paddingVertical: 12,
      paddingHorizontal: 4,
      backgroundColor: "transparent",
      borderWidth: 0,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "rgba(107, 56, 212, 0.1)",
    },
  };

  return (
    <GlassCardDark
      style={[cardSectionStyles.card, { zIndex: 40, elevation: 40 }]}
      padding={0}
      borderRadius={radius.lg}
      borderColor={
        addressError
          ? "#EF4444"
          : addressFocused
            ? "rgba(107, 56, 212, 0.32)"
            : "rgba(107, 56, 212, 0.12)"
      }
      blurIntensity={24}
      contentStyle={cardSectionStyles.cardContent}
    >
      <View style={cardSectionStyles.headerRow}>
        <View style={cardSectionStyles.headerIconBubble}>
          <MapPin size={22} color={colors.primary} strokeWidth={2.2} />
        </View>
        <View style={cardSectionStyles.headerTextBlock}>
          <Text style={cardSectionStyles.headerTitle}>EVENT LOCATION</Text>
          <Text style={cardSectionStyles.headerSubtitle}>
            Where is the party?
          </Text>
        </View>
        <Image
          source={require("../../../assets/images/create-event/map-pin.png")}
          style={cardSectionStyles.headerArtMap}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </View>

      <GlassCardDark
        style={[
          locationStyles.searchPillOuter,
          addressFocused && locationStyles.searchPillOuterFocused,
          addressError && locationStyles.searchPillOuterError,
        ]}
        padding={0}
        borderRadius={22}
        borderColor={
          addressError
            ? "#EF4444"
            : addressFocused
              ? colors.primary
              : "rgba(107, 56, 212, 0.28)"
        }
        blurIntensity={20}
        contentStyle={locationStyles.searchPillInner}
      >
        {/*
          The icon lives in an absolutely-positioned wrapper sized exactly
          like the input row (44px tall), with the 36px bubble centered
          inside it. Sharing the input's vertical box guarantees the icon
          and the input text share a vertical center no matter how iOS or
          Android decides to baseline the input. Absolute positioning also
          keeps the icon glued to the top-left when `GooglePlacesTextInput`
          grows downward to render its inline suggestions panel.
        */}
        <View style={locationStyles.searchIconSlot} pointerEvents="none">
          <View style={locationStyles.searchIconBubble}>
            <Search size={18} color={colors.primary} strokeWidth={2.2} />
          </View>
        </View>
        <GooglePlacesTextInput
          suggestionsInline
          suggestionsGlassBlur={false}
          scrollEnabled
          nestedScrollEnabled
          includedRegionCodes={[...US_ONLY_REGIONS]}
          languageCode="en"
          placeHolderText="Search for an address"
          onFocus={onAddressFocus}
          onTouchStart={onAddressFocus}
          apiKey={GOOGLE_PLACES_API_KEY}
          fetchDetails
          style={placesStyles}
          onPlaceSelect={(place) => {
            const main = place.structuredFormat?.mainText?.text ?? "";
            const secondary =
              place.structuredFormat?.secondaryText?.text ?? "";
            onAddressSelect(main, secondary);
            onAddressBlur();
          }}
        />
      </GlassCardDark>

      <View style={locationStyles.venueParkingSection}>
        <Text style={locationStyles.venueSectionEyebrow}>Optional</Text>
        <Text style={locationStyles.venueSectionTitle}>Venue & parking</Text>
        <Text style={locationStyles.venueSectionHint}>
          A few words help guests find the door and know what to expect.
        </Text>

        <View style={locationStyles.venuePillsStack}>
          <GlassCardDark
            style={[
              locationStyles.searchPillOuter,
              locationNotesFocused && locationStyles.searchPillOuterFocused,
            ]}
            padding={0}
            borderRadius={18}
            borderColor={
              locationNotesFocused
                ? colors.primary
                : "rgba(107, 56, 212, 0.28)"
            }
            blurIntensity={20}
            contentStyle={locationStyles.venuePillInner}
          >
            <View style={locationStyles.venuePillIconTile}>
              <Building2 size={20} color={colors.primary} strokeWidth={2.1} />
            </View>
            <View style={locationStyles.venuePillBody}>
              <Text style={locationStyles.venuePillLabel}>Venue directions</Text>
              <TextInput
                style={locationStyles.venuePillInput}
                placeholder="Side entrance, gate code, floor…"
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
          </GlassCardDark>

          <GlassCardDark
            style={[
              locationStyles.searchPillOuter,
              parkingFocused && locationStyles.searchPillOuterFocused,
            ]}
            padding={0}
            borderRadius={18}
            borderColor={
              parkingFocused ? colors.primary : "rgba(107, 56, 212, 0.28)"
            }
            blurIntensity={20}
            contentStyle={locationStyles.venuePillInner}
          >
            <View style={locationStyles.venuePillIconTile}>
              <ParkingCircle size={20} color={colors.primary} strokeWidth={2.1} />
            </View>
            <View style={locationStyles.venuePillBody}>
              <Text style={locationStyles.venuePillLabel}>Parking</Text>
              <TextInput
                style={locationStyles.venuePillInput}
                placeholder="Street, valet, garage name…"
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
          </GlassCardDark>
        </View>
      </View>

      {addressError ? (
        <Text style={cardSectionStyles.errorText}>{addressError}</Text>
      ) : null}
    </GlassCardDark>
  );
}

export default function EventDetailsScreen2() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const scrollToTopOnError = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);
  const insets = useSafeAreaInsets();

  const {
    formData,
    errors,
    focusedField,
    setFocusedField,
    showDatePicker,
    setShowDatePicker,
    showTimePicker,
    setShowTimePicker,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    showEventDetails,
    setShowEventDetails,
    fadeAnim,
    handleContinue,
    handleInputChange,
    setCelebrationType,
    setMitzvahCelebrationFocus,
    setAddressFromPlace,
    formatDateDisplay,
    handleDateConfirm,
    handleTimeConfirm,
    isBarBatMitzvah,
    isPartyMode,
    showCelebrationTypeSection,
    setOptionalDetailsLater,
    pickHonoreePhoto,
    clearHonoreePhoto,
  } = useEventDetailsScreen({ scrollToTopOnError });

  const themeInputRef = useRef<TextInput>(null);
  /** Modal-driven age picker (replaces the inline numeric keyboard). */
  const [showAgePicker, setShowAgePicker] = useState(false);
  const openAgePicker = () => {
    setShowAgePicker(true);
    setFocusedField("age");
  };

  const openDatePicker = () => {
    if (formData.date) {
      const [y, m, d] = formData.date.split("-").map(Number);
      setSelectedDate(new Date(y!, m! - 1, d!));
    } else {
      setSelectedDate(new Date());
    }
    setShowDatePicker(true);
    setFocusedField("date");
  };

  const openTimePicker = () => {
    if (formData.time) {
      const parsed = parseTimeToDate(formData.time);
      setSelectedTime(parsed ?? new Date());
    } else {
      setSelectedTime(new Date());
    }
    setShowTimePicker(true);
    setFocusedField("time");
  };

  const clearFocus = () => setFocusedField(null);

  const [examplesOpen, setExamplesOpen] = useState(false);
  const cardFlyIn = useRef(
    FAN_DRAW.map((c) => new Animated.Value(c.animateFlyIn ? 0 : 1)),
  ).current;
  useEffect(() => {
    const timings = FAN_DRAW.map((card, i) => {
      if (!card.animateFlyIn) return null;
      return Animated.timing(cardFlyIn[i], {
        toValue: 1,
        duration: 520,
        delay: card.flyInDelay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
    }).filter((t): t is Animated.CompositeAnimation => t != null);
    Animated.parallel(timings).start();
  }, [cardFlyIn]);

  const nameError = errors.childName;
  const ageError = errors.age;
  const genderError = errors.honoreeGender;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.screen}
    >
      <View style={styles.screen}>
        <AppMeshBackground />
        <Animated.ScrollView
          ref={scrollRef}
          // style={[styles.scroll, { opacity: fadeAnim }]}
          // contentContainerStyle={[
          //   styles.scrollContent,
          //   /**
          //    * Respect the device's top safe area (notch / Dynamic Island /
          //    * status bar) plus a small visual buffer so the first card never
          //    * collides with the system clock or camera cut-out.
          //    */
          //   // { paddingTop: insets.top - spacing[3] },
          // ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          {/* ─── Hero ──────────────────────────────────────────── */}
          <GlassCardDark
              padding={spacing[5]}
              borderRadius={radius.md}
              borderColor="rgba(107, 56, 212, 0.1)"
            >
              <HeroBackgroundDecor />
          
            <View style={styles.heroTopRow}>
              <TouchableOpacity
                onPress={() => router.back()}
                activeOpacity={0.88}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                style={styles.backChip}
              >
                <ArrowLeft size={20} color={colors.onSurface} strokeWidth={2.2} />
              </TouchableOpacity>
              <View style={styles.heroSparkleWrap}>
                <Sparkles size={26} color={colors.primary} strokeWidth={2.2} />
              </View>
            </View>

           
              <View style={styles.heroBody}>
                <View style={styles.titleBlock}>
                  <Text style={styles.titleLine1}>Design your</Text>
                  <View style={styles.titleLine2Row}>
                    <InvitationGradientWord />
                    <View style={styles.titleSparks} pointerEvents="none">
                      <InvitationSparkMarks />
                    </View>
                  </View>
                  <View style={styles.titleUnderlineWrap} pointerEvents="none">
                    <InvitationUnderline />
                  </View>
                  <Text style={styles.subtitle}>
                    We'll use your answers to generate a unique poster and fill
                    in your event.
                  </Text>
                </View>

                {/*
                  "See examples" sticker is absolutely positioned over the right
                  side so it can overlap the title vertically without stealing
                  horizontal space from the big script word.
                */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setExamplesOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel="See invitation examples"
                  style={styles.seeExamplesWrap}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.seeExamplesText}>{`See\nexamples`}</Text>
                </TouchableOpacity>
              </View>
            </GlassCardDark>

            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => setExamplesOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Open invitation examples gallery"
              style={styles.fanHit}
            >
              <View style={styles.fan} pointerEvents="box-none">
                {FAN_DRAW.map((card, i) => {
                  const translateY = cardFlyIn[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [40 + card.dy, card.dy],
                  });
                  return (
                    <Animated.View
                      key={`fan-${i}`}
                      style={[
                        styles.fanCardShadow,
                        {
                          zIndex: card.z,
                          elevation:
                            Platform.OS === "android" ? 6 + card.z * 2 : undefined,
                          opacity: cardFlyIn[i],
                          transform: [
                            { translateX: card.dx },
                            { translateY },
                            { rotate: `${card.rotate}deg` },
                            { scale: card.scale },
                          ],
                        },
                      ]}
                    >
                      <View style={styles.fanCardClip}>
                        <Image
                          source={card.src}
                          style={styles.fanImage}
                          resizeMode="cover"
                        />
                      </View>
                    </Animated.View>
                  );
                })}
              </View>
            </TouchableOpacity>

          {/* ─── Form cards ────────────────────────────────────── */}
          <View style={styles.formBlock}>
            <EventDetailsCelebrationCard
              childName={formData.childName}
              age={formData.age}
              honoreePhotoUri={formData.honoreePhotoUri}
              nameError={nameError}
              ageError={ageError}
              nameFocused={focusedField === "childName"}
              ageFocused={focusedField === "age"}
              onNameChange={(v) => handleInputChange("childName", v)}
              onAgeChange={(v) => handleInputChange("age", v)}
              onNameFocus={() => setFocusedField("childName")}
              onNameBlur={clearFocus}
              onAgeFocus={() => setFocusedField("age")}
              onAgeBlur={clearFocus}
              onAgePress={openAgePicker}
              onPickHonoreePhoto={pickHonoreePhoto}
              onClearHonoreePhoto={clearHonoreePhoto}
              honoreeGender={formData.honoreeGender}
              honoreeGenderError={genderError}
              onHonoreeGenderChange={(g) => handleInputChange("honoreeGender", g)}
            />

            {showCelebrationTypeSection ? (
              <EventDetailsCelebrationTypeCard
                celebrationType={formData.celebrationType ?? "birthday"}
                mitzvahCelebrationFocus={formData.mitzvahCelebrationFocus}
                mitzvahFocusError={errors.mitzvahCelebrationFocus}
                onCelebrationTypeChange={setCelebrationType}
                onMitzvahFocusChange={setMitzvahCelebrationFocus}
              />
            ) : null}

            <DateTimeSection
              dateValue={formData.date}
              timeValue={formData.time}
              dateError={errors.date}
              timeError={errors.time}
              dateFocused={focusedField === "date"}
              timeFocused={focusedField === "time"}
              formatDateDisplay={formatDateDisplay}
              onDatePress={openDatePicker}
              onTimePress={openTimePicker}
            />

            <EventLocationSection
              addressError={errors.address1}
              addressFocused={focusedField === "address1"}
              onAddressSelect={setAddressFromPlace}
              onAddressFocus={() => setFocusedField("address1")}
              onAddressBlur={clearFocus}
              locationNotes={formData.locationNotes ?? ""}
              parking={formData.parking ?? ""}
              locationNotesFocused={focusedField === "locationNotes"}
              parkingFocused={focusedField === "parking"}
              onLocationNotesChange={(v) => handleInputChange("locationNotes", v)}
              onParkingChange={(v) => handleInputChange("parking", v)}
              onLocationNotesFocus={() => setFocusedField("locationNotes")}
              onLocationNotesBlur={clearFocus}
              onParkingFocus={() => setFocusedField("parking")}
              onParkingBlur={clearFocus}
            />

            {/* <EventThemeAndVibeCard
              formData={formData}
              focusedField={focusedField}
              setFocusedField={setFocusedField}
              isPartyMode={!!isPartyMode}
              onInputChange={handleInputChange}
              themeInputRef={themeInputRef}
            /> */}

            {!!isPartyMode && (
              <DescribeVibeSection
                value={formData.partyVibe ?? ""}
                focused={focusedField === "partyVibe"}
                onChange={(v) => handleInputChange("partyVibe", v)}
                onFocus={() => setFocusedField("partyVibe")}
                onBlur={clearFocus}
              />
            )}

            <EventDetailsOptionalCard
              formData={formData}
              showEventDetails={showEventDetails}
              optionalDetailsLater={formData.optionalDetailsLater ?? false}
              onOptionalDetailsLaterChange={setOptionalDetailsLater}
              focusedField={focusedField}
              setFocusedField={setFocusedField}
              isBarBatMitzvah={!!isBarBatMitzvah}
              isPartyMode={!!isPartyMode}
              onToggleDetails={() => setShowEventDetails(!showEventDetails)}
              onInputChange={handleInputChange}
            />
          </View>
        </Animated.ScrollView>

        <EventDetailsScreenFooter
          onContinue={handleContinue}
          ctaTitle="Create Event & AI Poster"
        />
      </View>

      <InvitationExamplesModal
        visible={examplesOpen}
        onClose={() => setExamplesOpen(false)}
      />

      <EventDatePickerModal
        visible={showDatePicker}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onConfirm={(date: Date) => {
          handleDateConfirm(date);
          clearFocus();
        }}
        onCancel={() => {
          setShowDatePicker(false);
          clearFocus();
        }}
      />

      <EventTimePickerModal
        visible={showTimePicker}
        selectedTime={selectedTime}
        onTimeChange={setSelectedTime}
        onConfirm={(time) => {
          handleTimeConfirm(time);
          clearFocus();
        }}
        onCancel={() => {
          setShowTimePicker(false);
          clearFocus();
        }}
      />

      <EventAgePickerModal
        visible={showAgePicker}
        value={formData.age}
        minAge={4}
        maxAge={18}
        onConfirm={(age) => {
          handleInputChange("age", age);
          setShowAgePicker(false);
          clearFocus();
        }}
        onCancel={() => {
          setShowAgePicker(false);
          clearFocus();
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scroll: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: {
    paddingBottom: spacing[6] * 6,
  },
  
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[3],
    marginTop: spacing[10],
  },
  backChip: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(107, 56, 212, 0.10)",
    ...Platform.select({
      ios: {
        shadowColor: "#0c1c2a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  heroSparkleWrap: {
    padding: spacing[2],
    transform: [{ rotate: "10deg" }],
  },
  /** Glass card that frames the hero title + "See examples" sticker. */
  heroBody: {
    position: "relative",
  },
  titleBlock: {
    width: "100%",
  },
  titleLine1: {
    fontFamily: fontFamily.display,
    fontSize: 34,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  /**
   * Shrinks to fit "invitation" so the slash-mark accents sit immediately
   * to the right of the word instead of drifting to the column's right edge.
   */
  titleLine2Row: {
    transform: [{ rotate: "-1.5deg" }],
    flexDirection: "row",
    alignItems: "flex-start",
    alignSelf: "flex-start",
    marginTop: -spacing[3],
    marginBottom: spacing[1],
  },
  /**
   * Spark flicks float to the upper-right of "invitation": positive left
   * margin gives air after the word, negative top margin lifts them above
   * the word's cap line so the cluster reads as a top-right accent.
   */
  titleSparks: {
    marginLeft: spacing[2],
    marginTop: -spacing[4],
  },
  sparkImage: {
    width: 56,
    height: 60,
  },
  /** Pull the brush underline up tight under the gradient word. */
  titleUnderlineWrap: {
    marginTop: -14,
    marginLeft: 2,
    alignSelf: "flex-start",
  },
  subtitle: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.onSurfaceVariant,
    marginTop: spacing[3],
    maxWidth: 280,
  },
  /**
   * Positioned so its arrow tip lands directly above the top of the third
   * (right-most) invitation card in the fan. Centered over that card by
   * pulling the wrap ~16 px in from the hero's right edge.
   */
  seeExamplesWrap: {
    position: "absolute",
    right: spacing[4],
    top: 100,
    width: 70,
    alignItems: "center",
  },
  seeExamplesText: {
    transform: [{ rotate: "-5deg" }],
    fontFamily: fontFamily.script,
    fontSize: 20,
    color: colors.primary,
    textAlign: "center",
    lineHeight: 24,
  },
  fanHit: {
    height: 200,
    top: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  fan: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    position: "relative",
  },
  /**
   * Outer shadow layer — holds the purple-tinted halo and the transforms.
   * Crucially, NO overflow: hidden here, otherwise iOS clips the shadow
   * to the card's own bounds and the glow disappears.
   */
  fanCardShadow: {
    position: "absolute",
    width: FAN_CARD_W,
    height: FAN_CARD_H,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLowest,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.55,
        shadowRadius: 24,
      },
    }),
  },
  /** Inner clipping layer — rounded corners + white border + image. */
  fanCardClip: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.9)",
  },
  fanImage: {
    width: "100%",
    height: "100%",
  },
  formBlock: {
    backgroundColor: "transparent",
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
});

const vibeStyles = StyleSheet.create({
  card: {
    marginBottom: 16,
    overflow: "hidden",
  },
  cardContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  /**
   * Headphones sit absolutely in the top-right corner so they can overlap the
   * card padding (mirrors the reference where the sparkle music notes bleed
   * slightly outside the card's content rect).
   */
  headphones: {
    position: "absolute",
    top: -spacing[10],
    right: spacing[2],
    width: 80,
    height: 160,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    /**
     * Reserve symmetric horizontal padding so the centered title block sits
     * visually centered relative to the card, not the leftover space beside
     * the absolutely-positioned headphones in the top-right corner.
     */
    paddingHorizontal: 48,
    marginTop: spacing[3],
    // marginBottom: spacing[3],
  },
  headerTextBlock: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontFamily: fontFamily.display,
    fontSize: 20,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: 1.1,
    textAlign: "center",
  },
  titleUnderline: {
    marginTop: -2,
    alignSelf: "center",
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    marginTop: spacing[2],
    gap: 6,
  },
  subtitle: {
    flexShrink: 1,
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 18,
    color: colors.onSurfaceVariant,
    textAlign: "center",
  },
  subtitleSparkle: {
    marginTop: 2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginTop: -spacing[3],
  },
  robot: {
    width: 120,
    height: 170,
    marginLeft: -spacing[5],
  },
  inputBubble: {
    flex: 1,
    minHeight: 110,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(147, 197, 253, 0.55)",
    backgroundColor: "rgba(245, 243, 255, 0.92)",
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
    paddingLeft: spacing[3],
    paddingRight: spacing[5],
    marginLeft: -spacing[6],
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  inputBubbleFocused: {
    borderWidth: 2,
    borderColor: colors.primary,
    marginLeft: -spacing[6]
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 18,
    fontStyle: "italic",
    color: colors.onSurface,
    paddingVertical: 0,
    paddingRight: spacing[2],
  },
  wandWrap: {
    position: "absolute",
    right: spacing[3],
    bottom: spacing[3],
  },
  /**
   * Three chips per row. We use width:"31%" + a 6px columnGap so the math
   * (3 × 31% + 2 × 6px) always lands well under the card's inner width on
   * any phone size — flexBasis was being overridden by chip content size.
   */
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 6,
    rowGap: 8,
    marginTop: -spacing[3],
  },
  chip: {
    width: "31%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: spacing[1],
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: "rgba(107, 56, 212, 0.22)",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#0c1c2a",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: { elevation: 1 },
    }),
  },
  chipIcon: {
    fontSize: 13,
  },
  chipIconImage: {
    width: 16,
    height: 16,
  },
  chipLabel: {
    flexShrink: 1,
    fontFamily: fontFamily.label,
    fontSize: 11,
    fontWeight: "700",
    color: "#4b2d7a",
  },
});

/**
 * Shared shell for the new "DATE & TIME" / "EVENT LOCATION" cards — they have
 * identical header strips (icon bubble + title + subtitle + corner art), so we
 * keep that part in one stylesheet and let each card's body live next door.
 */
const cardSectionStyles = StyleSheet.create({
  card: {
    marginBottom: 16,
    overflow: "hidden",
  },
  cardContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  /** Soft-purple rounded square wrapping the leading lucide glyph. */
  headerIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(107, 56, 212, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontFamily: fontFamily.headline,
    fontSize: 15,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  headerSubtitle: {
    marginTop: 2,
    fontFamily: fontFamily.body,
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  /**
   * Decorative illustration in the top-right corner (calendar.png / map-pin.png).
   * Sized similarly to the reference so the art "peeks" at the card edge without
   * stealing room from the title text.
   */
  headerArtMap: {
    width: 76,
    height: 56,
    marginRight: spacing[2],
    marginBottom: -spacing[5],
    transform: [{ rotate: "4deg" }],
  },
  headerArtDate: {
    width: 76,
    height: 56,
    marginRight: spacing[2],
    marginBottom: -spacing[3],
  },
  errorText: {
    marginTop: spacing[2],
    fontFamily: fontFamily.label,
    fontSize: 12,
    fontWeight: "600",
    color: "#EF4444",
  },
});

const dateTimeStyles = StyleSheet.create({
  /**
   * Outer wrapper merged onto `GlassCardDark` — overrides its default dark-blue
   * drop shadow with the brand-purple halo (0/0 offset + big radius = glow on
   * all four sides). The shell border + frosted fill live inside GlassCardDark
   * (borderColor + BlurView). Android can't render colored shadows reliably,
   * so we bump `elevation` to retain the lifted feel without the purple tint.
   */
  pillOuter: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    ...Platform.select({
      android: { elevation: 8 },
    }),
  },
  pillOuterFocused: {
    shadowOpacity: 0.5,
  },
  pillOuterError: {
    shadowColor: "#EF4444",
    shadowOpacity: 0.3,
  },
  /** Flex layout for the date half + divider + time half inside the glass shell. */
  pillInner: {
    flexDirection: "row",
    alignItems: "stretch",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[4],
  },
  /**
   * Date half is a touch narrower than the time half — the date copy fits
   * comfortably and the visual weight matches the reference more closely
   * when the time side has slightly more room.
   */
  dateHalf: {
    flex: 0.6,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[2],
  },
  timeHalf: {
    flex: 0.5,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    backgroundColor: "rgba(107, 56, 212, 0.22)",
    marginHorizontal: spacing[2],
  },
  miniIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "rgba(107, 56, 212, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  valueStack: {
    flex: 1,
    minWidth: 0,
  },
  valuePrimary: {
    fontFamily: fontFamily.headline,
    fontSize: 17,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.2,
  },
  valuePlaceholder: {
    color: colors.onSurfaceVariant,
  },
  valueSecondary: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    fontWeight: "500",
    color: colors.onSurfaceVariant,
    marginTop: 1,
  },
});

const locationStyles = StyleSheet.create({
  /**
   * Outer wrapper merged onto `GlassCardDark` — overrides its default dark-blue
   * drop shadow with the brand-purple halo so the search pill matches the
   * date/time pill. See `dateTimeStyles.pillOuter` for the layering rationale.
   */
  searchPillOuter: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    ...Platform.select({
      android: { elevation: 8 },
    }),
  },
  searchPillOuterFocused: {
    shadowOpacity: 0.5,
  },
  searchPillOuterError: {
    shadowColor: "#EF4444",
    shadowOpacity: 0.3,
  },
  /**
   * No flex row here — the icon is absolutely positioned inside this content
   * box so it doesn't track the suggestion panel's vertical growth. The input
   * fills the box and just leaves enough left padding to clear the icon.
   */
  searchPillInner: {
    paddingHorizontal: spacing[3],
    paddingTop: spacing[2],
    // paddingVertical: spacing[2],
  },
  /**
   * Absolute wrapper whose box matches the input row exactly (44px tall,
   * aligned with the row's `top` after the pill's vertical padding). The
   * icon bubble centers inside it via `alignItems`/`justifyContent`, so
   * the bubble and the input text share a vertical center regardless of
   * TextInput baseline behavior on iOS/Android.
   */
  searchIconSlot: {
    position: "absolute",
    top: spacing[2],
    left: spacing[3],
    width: 36,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  searchIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "rgba(107, 56, 212, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  venueParkingSection: {
    marginTop: spacing[4],
    alignSelf: "stretch",
  },
  venueSectionEyebrow: {
    fontFamily: fontFamily.headline,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: colors.primaryContainer,
    opacity: 0.95,
    marginBottom: 4,
  },
  venueSectionTitle: {
    fontFamily: fontFamily.headline,
    fontSize: 18,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.35,
    marginBottom: 6,
  },
  venueSectionHint: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    color: colors.onSurfaceVariant,
    marginBottom: spacing[3],
    paddingRight: spacing[2],
  },
  venuePillsStack: {
    gap: spacing[3],
    alignSelf: "stretch",
  },
  /**
   * Row inside each mini-pill: icon tile + label/input stack (rhymes with the
   * date/time row layout, but vertical text for multiline notes).
   */
  venuePillInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    // paddingVertical: spacing[3],
    marginBottom: -spacing[2],
  },
  venuePillIconTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(107, 56, 212, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  venuePillBody: {
    flex: 1,
    minWidth: 0,
  },
  venuePillLabel: {
    fontFamily: fontFamily.headline,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.65,
    textTransform: "uppercase",
    color: colors.onSurfaceVariant,
    marginBottom: 6,
  },
  venuePillInput: {
    borderWidth: 0,
    padding: 0,
    margin: 0,
    minHeight: 48,
    fontSize: 15,
    fontFamily: fontFamily.body,
    fontWeight: "500",
    lineHeight: 22,
    color: colors.onSurface,
    backgroundColor: "transparent",
  },
});
