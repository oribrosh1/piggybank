import { useId, useMemo } from "react";
import { View, Text, Image, useWindowDimensions } from "react-native";
import LottieView from "lottie-react-native";
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from "react-native-svg";
import { Sparkles, Contact, Send, BellRing, type LucideIcon } from "lucide-react-native";
import Button from "@/src/components/common/Button";
import {
  colors,
  radius,
  spacing,
  typography,
  fontFamily,
  ambientShadow,
} from "@/src/theme";

const SMS_PREVIEW_LOTTIE = require("../../../assets/lotties/pay-everywhere-creditkid.json");

const PARTY_TOOLS: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  iconBg: string;
  iconColor: string;
}[] = [
  {
    icon: Sparkles,
    title: "AI invitation poster",
    subtitle: "Party-ready artwork you can share in one tap.",
    iconBg: "rgba(107, 56, 212, 0.12)",
    iconColor: colors.primary,
  },
  {
    icon: Contact,
    title: "Guests from phone contacts",
    subtitle: "Import contacts from your phone & invite them to the party.",
    iconBg: "rgba(4, 120, 87, 0.12)",
    iconColor: colors.secondary,
  },
  {
    icon: Send,
    title: "SMS invites & reminders",
    subtitle: "Automatic texts before and after the big day.",
    iconBg: "rgba(180, 83, 9, 0.12)",
    iconColor: "#B45309",
  },
  {
    icon: BellRing,
    title: "Live RSVP",
    subtitle: "Get notified when a guest accepts invitation & when he sent a gift through the app",
    iconBg: "rgba(107, 56, 212, 0.1)",
    iconColor: colors.primaryContainer,
  },
];

export type PartyPlannerEmptyContentProps = {
  onCreateEvent: () => void;
};

/**
 * Shared “Party Planner” marketing block: step badge, hero, tools grid, SMS preview.
 * Use inside a parent ScrollView (Home, My Event empty state).
 */
function PlanYourPartyHeading({ contentWidth }: { contentWidth: number }) {
  const rawId = useId();
  const gradId = useMemo(() => `pty-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`, [rawId]);
  const fontSize = 34;
  const svgH = 44;

  return (
    <View style={{ alignItems: "center", marginBottom: spacing[4] }}>
      <Text
        style={{
          fontFamily: fontFamily.display,
          fontSize,
          lineHeight: 42,
          textAlign: "center",
          color: colors.onSurface,
          marginBottom: 8,
        }}
      >
        {`Let's`}
      </Text>
      <Svg width={contentWidth} height={svgH}>
        <Defs>
          <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={colors.primary} />
            <Stop offset="100%" stopColor={colors.secondary} />
          </LinearGradient>
        </Defs>
        <SvgText
          fill={`url(#${gradId})`}
          fontFamily={fontFamily.display}
          fontSize={fontSize}
          fontWeight="800"
          x={contentWidth / 2}
          y={fontSize * 0.92}
          textAnchor="middle"
        >
          Plan Your Party
        </SvgText>
      </Svg>
    </View>
  );
}

export default function PartyPlannerEmptyContent({ onCreateEvent }: PartyPlannerEmptyContentProps) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.max(0, width - spacing[5] * 2);

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        {/* <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[2], flex: 1 }}>
          <Sparkles size={22} color={colors.primary} strokeWidth={2.4} />
         
        </View> */}
        {/* <View style={{ alignItems: "flex-end", minWidth: 112 }}>
          <Text
            style={[
              typography.labelMd,
              {
                fontSize: 11,
                color: colors.primary,
                fontFamily: fontFamily.title,
                marginBottom: 6,
              },
            ]}
          >
            STEP 1 OF 3
          </Text>
          <View
            style={{
              height: 4,
              width: 100,
              borderRadius: 2,
              backgroundColor: colors.surfaceContainerHigh,
              overflow: "hidden",
            }}
          >
            <View style={{ width: "33.33%", height: "100%", backgroundColor: colors.primary }} />
          </View>
        </View> */}
      </View>

      <PlanYourPartyHeading contentWidth={contentWidth} />
      <Text
        style={[
          typography.bodyMd,
          {
            textAlign: "center",
            color: colors.onSurfaceVariant,
            lineHeight: 26,
            marginBottom: spacing[6],
            paddingHorizontal: spacing[4],
            fontSize: 17,
            fontFamily: fontFamily.body,
          },
        ]}
      >
        {"Your invite should feel as special as the day itself."}
      </Text>
      

      {/* <View
        style={[
          {
            borderRadius: radius.md,
            overflow: "hidden",
            marginBottom: spacing[5],
            backgroundColor: colors.surfaceContainerLow,
          },
          ambientShadow,
        ]}
      >
        <Image
          source={{ uri: PARTY_HERO_URI }}
          resizeMode="cover"
          style={{ width: "100%", height: heroHeight }}
        />
        <View
          style={{
            position: "absolute",
            bottom: spacing[4],
            left: spacing[4],
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: spacing[3],
            paddingVertical: 6,
            borderRadius: radius.full,
            backgroundColor: "rgba(255,255,255,0.92)",
          }}
        >
          <Sparkles size={14} color={colors.primary} strokeWidth={2.2} />
          <Text
            style={[
              typography.labelMd,
              { fontSize: 10, color: colors.onSurface, fontFamily: fontFamily.title },
            ]}
          >
            AI GENERATED ART
          </Text>
        </View>
      </View> */}

      <View
        style={[
          {
            height: 250,
            borderRadius: radius.md,
            overflow: "hidden",
            marginBottom: spacing[6],
            backgroundColor: colors.surfaceContainerLow,
          },
          ambientShadow,
        ]}
      >
        <View
          style={{
            width: contentWidth,
            height: 250,
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LottieView
            source={SMS_PREVIEW_LOTTIE}
            style={{
              width: contentWidth,
              height: 250,
            }}
            autoPlay
            loop
            resizeMode="cover"
          />
        </View>
      </View>
      <Button
        label="Create Event"
        onPress={onCreateEvent}
        variant="primary"
        style={{ marginBottom: spacing[8] }}
      />

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
      <View style={{ gap: spacing[4], marginBottom: spacing[8] }}>
        {PARTY_TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <View
              key={tool.title}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing[4],
                backgroundColor: colors.surfaceContainerLowest,
                borderRadius: radius.md,
                paddingVertical: spacing[4],
                paddingHorizontal: spacing[4],
                borderWidth: 1,
                borderColor: "rgba(107, 56, 212, 0.1)",
                ...ambientShadow,
                shadowOpacity: 0.06,
                shadowRadius: 16,
                elevation: 2,
              }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: tool.iconBg,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={24} color={tool.iconColor} strokeWidth={2.1} />
              </View>
              <View style={{ flex: 1, minWidth: 0, paddingRight: spacing[1] }}>
                <Text
                  style={{
                    fontFamily: fontFamily.headline,
                    fontSize: 16,
                    lineHeight: 24,
                    fontWeight: "700",
                    marginBottom: 6,
                    color: colors.onSurface,
                  }}
                >
                  {tool.title}
                </Text>
                <Text
                  style={{
                    fontFamily: fontFamily.body,
                    fontSize: 15,
                    lineHeight: 22,
                    color: colors.onSurfaceVariant,
                  }}
                >
                  {tool.subtitle}
                </Text>
              </View>
            </View>
          );
        })}
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
            height: 475,
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
            marginBottom: spacing[6],
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
