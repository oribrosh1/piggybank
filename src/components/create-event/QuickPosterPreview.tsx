import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  useWindowDimensions,
} from "react-native";
import {
  Calendar,
  Car,
  Clock,
  MapPin,
  Signpost,
  type LucideIcon,
} from "lucide-react-native";
import type {
  CelebrationPickerType,
  EventFormData,
  HonoreeGender,
} from "@/types/events";
import { colors, spacing, fontFamily } from "@/src/theme";

const QUICK_POSTER_BACKGROUNDS = {
  boy: require("../../../assets/images/create-event/boys-poster-bg.png"),
  girl: require("../../../assets/images/create-event/girls-bg.png"),
} as const;

function celebrationTypeDisplay(
  type: CelebrationPickerType | undefined,
): string {
  switch (type) {
    case "barMitzvah":
      return "Bar Mitzvah";
    case "batMitzvah":
      return "Bat Mitzvah";
    default:
      return "Birthday";
  }
}

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

function formatTimeTo12h(timeStr: string): string {
  const parsed = parseTimeString(timeStr);
  if (!parsed) return timeStr;
  const period = parsed.hours24 >= 12 ? "PM" : "AM";
  const hour12 = parsed.hours24 % 12 || 12;
  return `${hour12}:${String(parsed.minutes).padStart(2, "0")} ${period}`;
}

function formatDateDisplay(dateString: string): string {
  const parts = dateString.split("-");
  if (parts.length !== 3) return dateString;
  const [year, month, day] = parts.map((p) => parseInt(p, 10));
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return dateString;
  }
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function backgroundForGender(gender?: HonoreeGender) {
  return gender === "girl"
    ? QUICK_POSTER_BACKGROUNDS.girl
    : QUICK_POSTER_BACKGROUNDS.boy;
}

function formatPosterLocation(address1?: string, address2?: string): string {
  const street = address1?.trim() ?? "";
  const city =
    address2
      ?.split(",")
      .map((part) => part.trim())
      .filter(Boolean)[0] ?? "";

  if (street && city) return `${street}, ${city}`;
  return street || city || "Location";
}

function PosterIconRow({
  icon: Icon,
  label,
  textStyle,
  iconColor,
  numberOfLines = 2,
  compact,
}: {
  icon: LucideIcon;
  label: string;
  textStyle: StyleProp<TextStyle>;
  iconColor: string;
  numberOfLines?: number;
  compact?: boolean;
}) {
  return (
    <View style={[styles.iconRow, compact && styles.iconRowCompact]}>
      <Icon size={16} color={iconColor} strokeWidth={2.25} />
      <Text
        style={[styles.iconRowText, textStyle]}
        numberOfLines={numberOfLines}
      >
        {label}
      </Text>
    </View>
  );
}

type QuickPosterPreviewProps = {
  formData: EventFormData;
  posterCover?: HonoreeGender;
  eventWords?: string;
  showCenterMessage?: boolean;
  horizontalInset?: number;
  style?: StyleProp<ViewStyle>;
};

export default function QuickPosterPreview({
  formData,
  posterCover,
  eventWords,
  showCenterMessage = true,
  horizontalInset,
  style,
}: QuickPosterPreviewProps) {
  const { width: windowWidth } = useWindowDimensions();
  const inset = horizontalInset ?? spacing[6];
  const cardWidth = Math.min(windowWidth - inset * 2, 420);
  const cover = posterCover ?? formData.honoreeGender;
  const isGirl = cover === "girl";

  const name = formData.childName.trim() || "Name";
  const age = formData.age.trim() || "—";
  const occasionTitle = `${name}'s ${celebrationTypeDisplay(formData.celebrationType)}`;

  const dateStr = formData.date.trim();
  const timeStr = formData.time.trim();
  const datePretty = dateStr ? formatDateDisplay(dateStr) : "Date";
  const timePretty = timeStr ? formatTimeTo12h(timeStr) : "Time";

  const locationLine = formatPosterLocation(
    formData.address1,
    formData.address2,
  );
  const venueDirections = formData.locationNotes?.trim() ?? "";
  const parking = formData.parking?.trim() ?? "";
  const centerText = showCenterMessage ? (eventWords?.trim() ?? "") : "";

  const textTheme = isGirl ? styles.textGirl : styles.textBoy;
  const accentTheme = isGirl ? styles.accentGirl : styles.accentBoy;
  const iconColor = isGirl ? colors.primary : "#ffffff";
  const placeholderBoxTheme = isGirl
    ? styles.placeholderBoxGirl
    : styles.placeholderBoxBoy;
  const placeholderTextTheme = isGirl
    ? styles.placeholderTextGirl
    : styles.placeholderTextBoy;

  return (
    <View
      style={[styles.wrap, style]}
      accessibilityRole="image"
      accessibilityLabel="Quick poster preview with your event details"
    >
      <ImageBackground
        source={backgroundForGender(cover)}
        style={[styles.poster, { width: cardWidth }]}
        imageStyle={styles.posterImage}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      >
        <View style={styles.textOverlay}>
          <View style={styles.topBlock}>
            <Text style={[styles.titleLine, accentTheme]} numberOfLines={1}>
              {occasionTitle}
            </Text>
            <Text style={[styles.turningLine, textTheme]} numberOfLines={1}>
              TURNING {age}
            </Text>
            <View style={styles.dateTimeRow}>
              <PosterIconRow
                icon={Calendar}
                label={datePretty}
                textStyle={[styles.detailLine, textTheme]}
                iconColor={iconColor}
                compact
                numberOfLines={1}
              />
              <PosterIconRow
                icon={Clock}
                label={timePretty}
                textStyle={[styles.detailLine, textTheme]}
                iconColor={iconColor}
                compact
                numberOfLines={1}
              />
            </View>
          </View>

          {showCenterMessage ? (
            centerText ? (
              <View style={styles.centerBlock}>
                <Text style={[styles.centerLine, textTheme]} numberOfLines={4}>
                  {centerText}
                </Text>
              </View>
            ) : (
              <View style={styles.centerBlock}>
                <View style={[styles.messagePlaceholder, placeholderBoxTheme]}>
                  <Text
                    style={[styles.placeholderText, placeholderTextTheme]}
                    numberOfLines={3}
                  >
                    Your message will appear here
                  </Text>
                </View>
              </View>
            )
          ) : (
            <View style={styles.centerSpacer} />
          )}

          <View style={styles.bottomBlock}>
            <PosterIconRow
              icon={MapPin}
              label={locationLine}
              textStyle={[styles.locationLine, textTheme]}
              iconColor={iconColor}
              numberOfLines={3}
            />
            {venueDirections ? (
              <PosterIconRow
                icon={Signpost}
                label={venueDirections}
                textStyle={[styles.extraLine, textTheme]}
                iconColor={iconColor}
                numberOfLines={2}
              />
            ) : null}
            {parking ? (
              <PosterIconRow
                icon={Car}
                label={`Parking: ${parking}`}
                textStyle={[styles.extraLine, textTheme]}
                iconColor={iconColor}
                numberOfLines={2}
              />
            ) : null}
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "stretch",
  },
  poster: {
    alignSelf: "center",
    aspectRatio: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  posterImage: {
    borderRadius: 16,
  },
  textOverlay: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing[5],
    paddingTop: spacing[14],
    paddingBottom: spacing[5],
  },
  topBlock: {
    alignItems: "center",
    width: "100%",
    gap: spacing[2],
  },
  titleLine: {
    fontFamily: fontFamily.title,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.35,
    lineHeight: 26,
  },
  turningLine: {
    marginTop: spacing[1],
    fontFamily: fontFamily.display,
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -1,
    lineHeight: 38,
  },
  centerBlock: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
  },
  centerSpacer: {
    flex: 1,
    minHeight: spacing[4],
  },
  messagePlaceholder: {
    width: "88%",
    minHeight: 72,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  placeholderText: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
  },
  centerLine: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 22,
    letterSpacing: -0.2,
    paddingHorizontal: spacing[2],
  },
  bottomBlock: {
    alignItems: "center",
    width: "100%",
    gap: spacing[2],
    marginBottom: spacing[5],
  },
  dateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: spacing[3],
    marginTop: spacing[1],
    width: "100%",
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  iconRowCompact: {
    alignItems: "center",
  },
  iconRowText: {
    flexShrink: 1,
    textAlign: "left",
  },
  detailLine: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 16,
  },
  locationLine: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
  },
  extraLine: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 15,
  },
  accentBoy: {
    color: "#ffffff",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  accentGirl: {
    color: colors.primary,
    textShadowColor: "rgba(255,255,255,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  textBoy: {
    color: "#ffffff",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  textGirl: {
    color: "#5b1a6e",
    textShadowColor: "rgba(255,255,255,0.65)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  placeholderBoxBoy: {
    borderColor: "rgba(255, 255, 255, 0.45)",
  },
  placeholderBoxGirl: {
    borderColor: "rgba(107, 56, 212, 0.35)",
  },
  placeholderTextBoy: {
    color: "rgba(255, 255, 255, 0.75)",
  },
  placeholderTextGirl: {
    color: "rgba(91, 26, 110, 0.65)",
  },
});
