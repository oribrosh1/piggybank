import {
  View,
  Text,
  Image,
  useWindowDimensions,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { CalendarPlus, ChevronRight } from "lucide-react-native";
import AppTabHeader from "@/src/components/AppTabHeader";
import {
  colors,
  radius,
  spacing,
  typography,
  fontFamily,
  ambientShadow,
  primaryGradient,
} from "@/src/theme";
import { Ionicons } from "@expo/vector-icons";

const FEATURE_MODERN_GIFTS_BG = require("../../../assets/images/create-event/giftwallet.png");
const FEATURE_PAY_EVERYWHERE_BG = require("../../../assets/images/create-event/apay.png");
const FEATURE_SAFE_SPENDING = require("../../../assets/images/create-event/safe-spending-parents.png");
const HERO_IMAGE = require("../../../assets/images/create-event/page-header.png");
const TOOLS_IMAGE = require("../../../assets/images/home-page/create-event-tools.png");

const CREATE_EVENT_SUBTITLE =
"Start Receiving Gifts and Blessings Directly to your CreditKid Wallet";/** Corner radius on feature PNGs (clip + overflow hidden for clean masks). */
const FEATURE_IMAGE_RADIUS = radius.md;
/** Horizontal gap between the two tiles in the top feature row. */
const FEATURE_PAIR_GAP = spacing[2];

/** Source image is 1774 × 887 px (2:1). */
const HERO_ASPECT_RATIO = 1774 / 887;
/** Source tools image is 1536 × 1024 px (3:2). */
const TOOLS_ASPECT_RATIO = 1536 / 1024;
/** Matches the lavender background sampled from the source image (≈ rgb(225,223,252)). */
const HERO_BG_COLOR = "#E1DFFC";
type CreateEventCtaProps = {
  onPress: () => void;
};



function CreateEventBanner({ onPress }: CreateEventCtaProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.92}
      accessibilityRole="button"
      accessibilityLabel="Create event"
      accessibilityHint={CREATE_EVENT_SUBTITLE}
      style={styles.bannerOuter}
    >
      <LinearGradient
        colors={["#4f2db8", colors.primary, colors.primaryContainer]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.bannerGradient}
      >
        <View style={styles.bannerIconWrap}>
          <CalendarPlus size={28} color={colors.onPrimary} strokeWidth={2} />
        </View>
        <View style={styles.bannerCopy}>
          <Text style={styles.bannerTitle}>Create Event</Text>
          <Text style={styles.bannerSubtitle} numberOfLines={2}>
            {CREATE_EVENT_SUBTITLE}
          </Text>
        </View>
        <View style={styles.bannerPill}>
          <Text style={styles.bannerPillText}>Create</Text>
          <ChevronRight size={16} color={colors.primary} strokeWidth={2.8} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export type PartyPlannerEmptyContentProps = {
  onCreateEvent: () => void;
  /** Greeting name shown over the hero (e.g. "Sarah"). Falls back to "there". */
  firstName?: string;
  /** Top safe-area inset of the parent screen — used to push overlay below the status bar. */
  topInset?: number;
  /** Left padding the parent ScrollView applies — used so the hero image can bleed to the screen edge. */
  leftInset?: number;
  /** Right padding the parent ScrollView applies — used so the hero image can bleed to the screen edge. */
  rightInset?: number;
  /** Top padding the parent ScrollView applies on top of the safe area — used so the hero image starts at the screen top. */
  topContentPadding?: number;
  onPressNotifications?: () => void;
  showNotificationDot?: boolean;
};

/**
 * Shared “Party Planner” marketing block: hero image with overlaid app header, feature image rows, tools grid, SMS preview.
 * Use inside a parent ScrollView (Home, My Event empty state).
 *
 * The hero image bleeds to the screen edges, so pass `leftInset`/`rightInset` equal to the
 * parent ScrollView's horizontal padding, and `topInset` + `topContentPadding` to lift the
 * image up under the status bar.
 */
export default function PartyPlannerEmptyContent({
  onCreateEvent,
  firstName,
  topInset = 0,
  leftInset = 0,
  rightInset = 0,
  topContentPadding = 0,
  onPressNotifications,
  showNotificationDot,
}: PartyPlannerEmptyContentProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const greetingName = firstName ?? "there";

  /** Two-up feature row scales with window height (clamped for SE / Pro Max). */
  const featureRowHeight = Math.min(
    Math.max(Math.round(screenHeight * 0.19), 160),
    280,
  );
  /** Full-width banner slightly taller than the pair row, same height basis. */
  const featureSafeRowHeight = Math.min(
    Math.max(Math.round(screenHeight * 0.22), 176),
    300,
  );

  /** Hero is full screen width; height derives from source aspect ratio so nothing is cropped. */
  const heroHeight = screenWidth / HERO_ASPECT_RATIO;
  const toolsHeight = screenWidth / TOOLS_ASPECT_RATIO;

  /**
   * Pull the white feature stack over the hero by a distance tied to **hero height** (not raw
   * screen height) so SE / Pro Max keep similar proportions.
   */
  const featureStackOverlap = Math.min(
    Math.max(Math.round(heroHeight * 0.35), 36),
    150,
  );

  /** SMS preview: cap absolute design height on tall phones, shrink on short ones. */
  const smsPreviewHeight = Math.min(475, Math.round(screenHeight * 0.34));

  return (
    <View>
      <View
        style={{
          width: screenWidth,
          marginLeft: -leftInset,
          marginRight: -rightInset,
          marginTop: -(topInset + topContentPadding+5),
          paddingTop: topInset,
          backgroundColor: "#EBE9FE",
          zIndex: 2,
        }}
      >
        <View
          style={{
            paddingLeft: leftInset - 10,
            paddingRight: rightInset,
            marginBottom: -spacing[20],
            zIndex: 1,
          }}
        >
          <AppTabHeader
            onPressNotifications={onPressNotifications}
            showNotificationDot={showNotificationDot}
            // style={{ marginTop: -spacing[4], marginBottom: spacing[4] }}
          />
          <Text
            style={[
              typography.headlineLg,
              {
            // marginLeft: 5,
            marginTop: 5,

                color: colors.onSurface,
                fontSize: 28,
                lineHeight: 34,
                maxWidth: Math.max(
                  160,
                  screenWidth - leftInset - rightInset - 108,
                ),
              },
            ]}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            Hey {greetingName}!
          </Text>
        
        </View>

        <View style={{ position: "relative", width: "100%", height: heroHeight }}>
          <Image
            source={HERO_IMAGE}
            resizeMode="cover"
            style={{
              width: "100%",
              height: heroHeight,
            }}
          />
          <TouchableOpacity
            onPress={onCreateEvent}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Create event"
            accessibilityHint="Start planning your child's special day"
            style={{
              position: "absolute",
              left: leftInset - 15,
              top: heroHeight * 0.67,
              borderRadius: radius.full,
              overflow: "hidden",
              maxWidth: Math.min(screenWidth * 0.46, 196),
            }}
          >
            <LinearGradient
              colors={primaryGradient.colors}
              start={primaryGradient.start}
              end={primaryGradient.end}
              style={{
                paddingVertical: spacing[2],
                paddingHorizontal: spacing[4],
                alignItems: "center",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Text style={{ fontFamily: fontFamily.title, fontSize: 14, fontWeight: "800", color: colors.onPrimary }}>Create Event</Text>
                <View style={{ marginLeft:-5}}>
                <Ionicons name="chevron-forward" size={16} color={colors.onPrimary} />
              </View>
                            <View style={{ marginLeft:-15}}>
                <Ionicons name="chevron-forward" size={16} color={colors.onPrimary} />
              </View>
                 <View style={{ marginLeft:-15}}>
                <Ionicons name="chevron-forward" size={16} color={colors.onPrimary} />
              </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <View
          style={{
            marginTop: -spacing[6],
            backgroundColor: "#EBE9FE",
            marginBottom: spacing[4],
            gap: spacing[3],
            paddingHorizontal: spacing[2],
            borderBottomRightRadius: 35,
            borderBottomLeftRadius: 35,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "stretch",
              height: featureRowHeight,
              gap: FEATURE_PAIR_GAP,
              marginTop: spacing[2],

            }}
          >
            <View
              style={{
                flex: 1,
                minWidth: 0,
                height: featureRowHeight,
                borderRadius: FEATURE_IMAGE_RADIUS,
                overflow: "hidden",
                backgroundColor: colors.secondaryCard,
              }}
            >
              <Image
                source={FEATURE_MODERN_GIFTS_BG}
                resizeMode="cover"
                accessibilityLabel="The Modern Gift Wallet"
                style={{
                  position: "absolute",
                  left: 5,
                  top: 5,
                  width: "100%",
                  height: "100%",
                }}        
                />
            </View>
            <View
              accessibilityRole="text"
              accessibilityLabel="Pay Everywhere. Spend birthday gifts with Apple Pay."
              style={{
                flex: 1,
                minWidth: 0,
                height: featureRowHeight,
                borderRadius: FEATURE_IMAGE_RADIUS,
                overflow: "hidden",
                backgroundColor: "#EBE9FE",
              }}
            >
              <Image
                source={FEATURE_PAY_EVERYWHERE_BG}
                resizeMode="cover"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: "100%",
                }}
              />
              <View
                style={{
                  flex: 1,
                  // paddingHorizontal: spacing[2],
                  paddingLeft: spacing[2],
                  paddingTop: spacing[3],
                  paddingBottom: spacing[2],
                  justifyContent: "flex-start",
                  alignItems: "flex-start",
                  maxWidth: "42%",
                }}
              >
                <Text
                  style={[
                    typography.headlineSm,
                    {
                      color: colors.onSurface,
                      marginBottom: spacing[1],
                      fontSize: 13,
                      lineHeight: 18,

                    },
                  ]}
                >
                  Pay Everywhere
                </Text>
                <Text
                  style={[
                    typography.bodyMd,
                    {
                      color: colors.onSurface,
                      fontSize: 9,
                      lineHeight: 16,
                    },
                  ]}
                  numberOfLines={4}
                >
                  Spend birthday gifts with Apple Pay
                </Text>
              </View>
            </View>
          </View>

          <View
            style={{
              marginTop: spacing[1],
              borderRadius: FEATURE_IMAGE_RADIUS,
              overflow: "hidden",
              height: featureSafeRowHeight,
              backgroundColor: "#EBE9FE",
            }}
          >
            <Image
              source={FEATURE_SAFE_SPENDING}
              resizeMode="cover"
              accessibilityLabel="Safe spending for kids"
              style={{
                width: "100%",
                height: "100%",
              }}
            />
          </View>
        </View>

    
      </View>
      <View
          style={{
            marginTop: spacing[2],
            marginBottom: spacing[1],
            width: screenWidth - 15,
            marginLeft: -leftInset + 5,
            // paddingHorizontal: spacing[2],
          }}
        >
          <CreateEventBanner onPress={onCreateEvent} />
        </View>
      <Text
        style={[
          typography.labelMd,
          {
            fontSize: 12,
            color: colors.onSurface,
            marginBottom: spacing[2],
            width: screenWidth - 15,
            marginLeft: -leftInset + 10,
            letterSpacing: 1,
            fontWeight: "700",
          },
        ]}
      >
        INCLUDED TOOLS
      </Text>
      <View
        style={{
          width: screenWidth,
          marginLeft: -leftInset,
          marginRight: -rightInset,
          marginBottom: spacing[8],
        }}
      >
        <Image
          source={TOOLS_IMAGE}
          resizeMode="cover"
          style={{
            width: screenWidth,
            height: Math.min(toolsHeight + 24, screenHeight * 0.32),
          }}
        />
      </View>

      <Text
        style={[
          typography.labelMd,
          {
            fontSize: 12,
            fontWeight: "700",
            color: colors.onSurfaceVariant,
            marginBottom: spacing[4],
            letterSpacing: 1,
          },
        ]}
      >
        SMS MESSAGE PREVIEW
      </Text>
      <View
        style={[
          {
            borderRadius: radius.md,
            overflow: "hidden",
            backgroundColor: colors.surfaceContainerLow,
            marginBottom: spacing[4],
          },
          ambientShadow,
        ]}
      >
        <Image
          source={require("../../../assets/images/creditkid-demo-message-removebg-preview.png")}
          resizeMode="cover"
          style={{
            width: "100%",
            height: smsPreviewHeight,
            borderRadius: radius.md,
          }}
        />
      </View>
      <Text
        style={[
          typography.bodyMd,
          {
            fontSize: 15,
            color: colors.onSurfaceVariant,
            textAlign: "center",
            lineHeight: 24,
            paddingHorizontal: spacing[3],
            fontFamily: fontFamily.body,
          },
        ]}
      >
        Guests get a polished invite graphic and a text with your gift link similar to iMessage.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    gap: spacing[3],
    ...Platform.select({
      ios: {
        shadowColor: colors.onSurface,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: { elevation: 4 },
    }),
  },
  heroCardIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  heroCardCopy: {
    flex: 1,
    minWidth: 0,
  },
  heroCardTitle: {
    fontFamily: fontFamily.title,
    fontSize: 16,
    fontWeight: "800",
    color: colors.onSurface,
    marginBottom: 2,
  },
  heroCardSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    lineHeight: 15,
    color: colors.onSurfaceVariant,
  },
  heroCardArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(107, 56, 212, 0.12)",
    flexShrink: 0,
    ...Platform.select({
      ios: {
        shadowColor: colors.onSurface,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  bannerOuter: {
    borderRadius: radius.md,
    overflow: "hidden",
    marginBottom: spacing[2],
  },
  bannerGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  bannerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bannerCopy: {
    flex: 1,
    minWidth: 0,
  },
  bannerTitle: {
    fontFamily: fontFamily.title,
    fontSize: 17,
    fontWeight: "800",
    color: colors.onPrimary,
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    lineHeight: 15,
    color: "rgba(255, 255, 255, 0.88)",
  },
  bannerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.full,
    paddingVertical: spacing[2],
    paddingLeft: spacing[4],
    paddingRight: spacing[3],
    flexShrink: 0,
  },
  bannerPillText: {
    fontFamily: fontFamily.title,
    fontSize: 14,
    fontWeight: "800",
    color: colors.primary,
  },
});
