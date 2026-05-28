import { View, Text, Image, useWindowDimensions, TouchableOpacity } from "react-native";
import AppTabHeader from "@/src/components/AppTabHeader";
import {
  colors,
  radius,
  spacing,
  typography,
  fontFamily,
  ambientShadow,
} from "@/src/theme";

const FEATURE_MODERN_WALLET = require("../../../assets/images/create-event/modern-gift-wallet-feature.png");
const FEATURE_PAY_EVERYWHERE = require("../../../assets/images/create-event/pay-everywhere-feature.png");
const FEATURE_SAFE_SPENDING = require("../../../assets/images/create-event/Safe-spending-feature.png");
const CREATE_EVENT_BTN = require("../../../assets/images/create-event/c-btn.jpg");
const HERO_IMAGE = require("../../../assets/images/home-page/lets-plan-your-party.png");
const TOOLS_IMAGE = require("../../../assets/images/home-page/create-event-tools.png");

/** `c-btn.jpg` intrinsic aspect (width / height) — keeps CTA height consistent across phones. */
const CREATE_EVENT_BTN_ASPECT = 1419 / 306;
/** Corner radius on feature PNGs (clip + overflow hidden for clean masks). */
const FEATURE_IMAGE_RADIUS = radius.md;
/** Horizontal gap between the two tiles in the top feature row. */
const FEATURE_PAIR_GAP = spacing[2];

/** Source image is 1337 × 1176 px (≈1.137 width/height). */
const HERO_ASPECT_RATIO = 1337 / 1176;
/** Source tools image is 1536 × 1024 px (3:2). */
const TOOLS_ASPECT_RATIO = 1536 / 1024;
/** Matches the lavender background sampled from the source image (≈ rgb(225,223,252)). */
const HERO_BG_COLOR = "#E1DFFC";
/** Framed marketing blocks: brand-tinted edge so full-bleed rows don’t look “floating”. */
const MARKETING_FRAME_BORDER = "rgba(107, 56, 212, 0.38)";

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
          marginTop: -(topInset + topContentPadding),
          marginBottom: spacing[3],
          paddingTop: topInset + spacing[1],
          backgroundColor: HERO_BG_COLOR,
          zIndex: 2,
        }}
      >
        <View
          style={{
            paddingLeft: leftInset,
            paddingRight: rightInset,
            marginBottom: -spacing[20],
            zIndex: 1,
          }}
        >
          <AppTabHeader
            onPressNotifications={onPressNotifications}
            showNotificationDot={showNotificationDot}
            style={{ marginBottom: spacing[2] }}
          />
          <Text
            style={[
              typography.headlineLg,
              {
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

        <Image
          source={HERO_IMAGE}
          resizeMode="cover"
          style={{
            width: screenWidth,
            height: heroHeight,
          }}
        />
        <View
          style={{
            marginTop: -featureStackOverlap,
            backgroundColor: colors.surfaceContainerLowest,
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
            }}
          >
            <View
              style={{
                flex: 1,
                minWidth: 0,
                height: featureRowHeight,
                borderRadius: FEATURE_IMAGE_RADIUS,
                overflow: "hidden",
                backgroundColor: colors.surfaceContainerLowest,
              }}
            >
              <Image
                source={FEATURE_MODERN_WALLET}
                resizeMode="cover"
                accessibilityLabel="The modern gift wallet"
                style={{ width: "100%", height: "100%" }}
              />
            </View>
            <View
              style={{
                flex: 1,
                minWidth: 0,
                height: featureRowHeight,
                borderRadius: FEATURE_IMAGE_RADIUS,
                overflow: "hidden",
                backgroundColor: colors.surfaceContainerLowest,
              }}
            >
              <Image
                source={FEATURE_PAY_EVERYWHERE}
                resizeMode="cover"
                accessibilityLabel="Pay everywhere with Apple Pay"
                style={{ width: "100%", height: "100%" }}
              />
            </View>
          </View>

          <View
            style={{
              borderRadius: FEATURE_IMAGE_RADIUS,
              overflow: "hidden",
              height: featureSafeRowHeight,
              backgroundColor: colors.surfaceContainerLowest,
            }}
          >
            <Image
              source={FEATURE_SAFE_SPENDING}
              resizeMode="cover"
              accessibilityLabel="Safe spending for kids"
              style={{ width: "100%", height: "100%" }}
            />
          </View>
        </View>

        <View
          style={{
            marginTop: spacing[1],
            marginBottom: spacing[1],
          }}
        >
          <TouchableOpacity
            onPress={onCreateEvent}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Create event"
            accessibilityHint="Start planning your child's special day"
            style={{
              borderWidth: 2,
              borderColor: MARKETING_FRAME_BORDER,
              borderRadius: 45,
              overflow: "hidden",
              backgroundColor: colors.surfaceContainerLowest,
            }}
          >
            <Image
              source={CREATE_EVENT_BTN}
              style={{ width: "100%", height: screenHeight * 0.099 }}
              accessibilityIgnoresInvertColors
            />
          </TouchableOpacity>
        </View>
      </View>

      <Text
        style={[
          typography.labelMd,
          {
            fontSize: 12,
            color: colors.onSurfaceVariant,
            marginBottom: spacing[4],
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
