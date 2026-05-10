import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Sparkles,
  ChevronUp,
  ChevronDown,
  WandSparkles,
  Clock,
  Utensils,
} from "lucide-react-native";
import { GlassCardDark } from "@/src/components/common/GlassCardDark";
import OptionalSectionBadge from "@/src/components/common/OptionalSectionBadge";
import CateringPreferencesBlock from "@/src/components/create-event/CateringPreferencesBlock";
import HonoreeFavoriteColorPicker from "@/src/components/create-event/HonoreeFavoriteColorPicker";
import type { EventFormData } from "@/types/events";
import { PARTY_TYPE_OPTIONS as partyTypeOptions } from "@/src/constants/partyTypeOptions";
import { colors, fontFamily, radius, spacing } from "@/src/theme";

type EventDetailsOptionalCardProps = {
  formData: EventFormData;
  showEventDetails: boolean;
  optionalDetailsLater: boolean;
  onOptionalDetailsLaterChange: (value: boolean) => void;
  focusedField: string | null;
  setFocusedField: (field: string | null) => void;

  isBarBatMitzvah: boolean;
  isPartyMode: boolean;
  onToggleDetails: () => void;
  onInputChange: (field: string, value: string | boolean) => void;
};


export default function EventDetailsOptionalCard(
  props: EventDetailsOptionalCardProps,
) {
  const {
    formData,
    showEventDetails,
    optionalDetailsLater,
    onOptionalDetailsLaterChange,
    focusedField,
    isBarBatMitzvah,
    isPartyMode,
    onToggleDetails,
    onInputChange,
    setFocusedField,
  } = props;

  const themeInputRef = useRef<TextInput>(null);

  return (
    <View
      style={{
        marginBottom: 24,
        borderRadius: 22,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(107, 56, 212, 0.18)",
        ...Platform.select({
          ios: {
            shadowColor: "#4C1D95",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.08,
            shadowRadius: 20,
          },
          android: { elevation: 4 },
        }),
      }}
    >
      <LinearGradient
        colors={["rgba(139, 92, 246, 0.09)", colors.surfaceContainerLow]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 18 }}
      >
      <TouchableOpacity
        onPress={onToggleDetails}
        activeOpacity={0.85}
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}
      >
    <View style={{transform: [{ rotate: "10deg" }]}}>
        <Utensils size={18} color={colors.primary} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
            <Text
              style={{
                fontSize: 17,
                fontWeight: "800",
                color: colors.primary,
              }}
            >
              Catering Preferences
            </Text>
            <OptionalSectionBadge />
          </View>
        </View>
        {showEventDetails ? (
          <ChevronUp size={22} color={colors.primary} />
        ) : (
          <ChevronDown size={22} color={colors.primary} />
        )}
      </TouchableOpacity>

      {/* <View
        style={{
          flexDirection: "row",
          gap: 10,
          marginBottom: showEventDetails ? 14 : 0,
        }}
      >
        <TouchableOpacity
          onPress={() => onOptionalDetailsLaterChange(false)}
          activeOpacity={0.88}
          style={{
            flex: 1,
            minWidth: 0,
            borderRadius: radius.lg,
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[4],
            borderWidth: !optionalDetailsLater ? 2 : 1,
            borderColor: !optionalDetailsLater
              ? colors.primary
              : colors.outlineVariant,
            backgroundColor: !optionalDetailsLater
              ? "rgba(107, 56, 212, 0.09)"
              : colors.surfaceContainerLowest,
            ...Platform.select({
              ios: {
                shadowColor: "#1e1b4b",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: !optionalDetailsLater ? 0.1 : 0.05,
                shadowRadius: 10,
              },
              android: { elevation: !optionalDetailsLater ? 3 : 1 },
            }),
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: !optionalDetailsLater
                ? colors.primary
                : "rgba(107, 56, 212, 0.14)",
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "center",
              marginBottom: 10,
            }}
          >
            <Sparkles
              size={22}
              color={!optionalDetailsLater ? "#FFFFFF" : colors.primary}
              strokeWidth={2.2}
            />
          </View>
          <Text
            style={{
              fontFamily: fontFamily.title,
              fontSize: 13,
              fontWeight: "600",
              color: colors.onSurface,
              textAlign: "center",
              marginBottom: 6,
              letterSpacing: -0.15,
            }}
            numberOfLines={2}
          >
            Add details now
          </Text>
          <Text
            style={{
              fontFamily: fontFamily.body,
              fontSize: 11,
              fontWeight: "400",
              color: colors.onSurfaceVariant,
              textAlign: "center",
              lineHeight: 16,
            }}
            numberOfLines={4}
          >
            Theme & vibe shape your AI poster — quick and fun.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onOptionalDetailsLaterChange(true)}
          activeOpacity={0.88}
          style={{
            flex: 1,
            minWidth: 0,
            borderRadius: radius.lg,
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[4],
            borderWidth: optionalDetailsLater ? 2 : 1,
            borderColor: optionalDetailsLater
              ? colors.primary
              : colors.outlineVariant,
            backgroundColor: optionalDetailsLater
              ? "rgba(107, 56, 212, 0.09)"
              : colors.surfaceContainerLowest,
            ...Platform.select({
              ios: {
                shadowColor: "#1e1b4b",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: optionalDetailsLater ? 0.1 : 0.05,
                shadowRadius: 10,
              },
              android: { elevation: optionalDetailsLater ? 3 : 1 },
            }),
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: optionalDetailsLater
                ? colors.primary
                : "rgba(107, 56, 212, 0.14)",
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "center",
              marginBottom: 10,
            }}
          >
            <Clock
              size={22}
              color={optionalDetailsLater ? "#FFFFFF" : colors.primary}
              strokeWidth={2.2}
            />
          </View>
          <Text
            style={{
              fontFamily: fontFamily.title,
              fontSize: 13,
              fontWeight: "600",
              color: colors.onSurface,
              textAlign: "center",
              marginBottom: 6,
              letterSpacing: -0.15,
            }}
            numberOfLines={2}
          >
            I&apos;ll fill this in later
          </Text>
          <Text
            style={{
              fontFamily: fontFamily.body,
              fontSize: 11,
              fontWeight: "400",
              color: colors.onSurfaceVariant,
              textAlign: "center",
              lineHeight: 16,
            }}
            numberOfLines={4}
          >
            Classic look for now — add AI poster details anytime.
          </Text>
        </TouchableOpacity>
      </View> */}

      {showEventDetails && (
           <CateringPreferencesBlock
           formData={formData}
           onInputChange={onInputChange}
           topSpacing={!!optionalDetailsLater}
         />
      )}
      </LinearGradient>
    </View>
  );
}
