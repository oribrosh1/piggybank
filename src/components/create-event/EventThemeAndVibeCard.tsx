import { useCallback, useEffect, useRef } from "react";
import { colors, spacing } from "@/src/theme";
import { radius } from "@/src/theme";
import { GlassCardDark } from "../common/GlassCardDark";
import { ChevronRight, Sparkles, WandSparkles } from "lucide-react-native";
import { Text } from "react-native";
import { View } from "react-native";
import { ScrollView } from "react-native";
import { Pressable } from "react-native";
import { TouchableOpacity } from "react-native";
import { TextInput } from "react-native";
import { Image, Platform } from "react-native";
import { StyleSheet } from "react-native";
import { fontFamily } from "@/src/theme";
import { EventFormData } from "@/types/events";
import { LinearGradient } from "expo-linear-gradient";
import HonoreeFavoriteColorPicker from "./HonoreeFavoriteColorPicker";
import { PARTY_TYPE_OPTIONS as partyTypeOptions } from "@/src/constants/partyTypeOptions";

/** Idle (unselected) pill backgrounds — always “designed”, not plain grey */
const PARTY_CHIP_IDLE: Record<string, readonly [string, string]> = {
  "bounce-house": ["#fdf2f8", "#fce7f3"],
  trampoline: ["#eff6ff", "#dbeafe"],
  "wall-climbing": ["#ecfdf5", "#d1fae5"],
  "indoor-soccer": ["#fff7ed", "#ffedd5"],
  basketball: ["#fef3c7", "#fde68a"],
  "girls-beauty-day": ["#fdf4ff", "#fae8ff"],
  "pool-party": ["#e0f2fe", "#bae6fd"],
  "yacht-party": ["#eef2ff", "#e0e7ff"],
};

const PARTY_THEME_CUSTOM_SCROLL = {
  value: "__custom__",
  label: "✨",
  name: "Custom",
} as const;

const THEME_ROW_NUDGE_MS = 1000;
const THEME_ROW_NUDGE_PX = 56;

function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

type EventDetailsOptionalCardCopyProps = {
  isPartyMode: boolean;
  formData: EventFormData;
  onInputChange: (field: string, value: string | boolean) => void;
  themeInputRef: React.RefObject<TextInput | null>;
  focusedField: string | null;
  setFocusedField: (field: string | null) => void;
};

export default function EventThemeAndVibeCard(
  props: EventDetailsOptionalCardCopyProps,
) {
  const {
    isPartyMode,
    formData,
    onInputChange,
    themeInputRef,
    focusedField,
    setFocusedField,
  } = props;

  const themeScrollRef = useRef<ScrollView>(null);
  const scrollXRef = useRef(0);
  const contentWidthRef = useRef(0);
  const layoutWidthRef = useRef(0);
  const nudgeFrameRef = useRef<number | null>(null);
  const nudgeAnimatingRef = useRef(false);
  const lastHintNudgeGestureAt = useRef(0);

  const stopThemeRowNudge = useCallback(() => {
    if (nudgeFrameRef.current != null) {
      cancelAnimationFrame(nudgeFrameRef.current);
      nudgeFrameRef.current = null;
    }
    nudgeAnimatingRef.current = false;
  }, []);

  useEffect(() => () => stopThemeRowNudge(), [stopThemeRowNudge]);

  const nudgeThemeRowAfterHint = useCallback(() => {
    const sv = themeScrollRef.current;
    if (!sv || nudgeAnimatingRef.current) return;

    const maxX = Math.max(
      0,
      contentWidthRef.current - layoutWidthRef.current,
    );
    const startX = scrollXRef.current;
    const endX = Math.min(startX + THEME_ROW_NUDGE_PX, maxX);
    if (endX <= startX + 0.5) return;

    stopThemeRowNudge();
    nudgeAnimatingRef.current = true;
    const t0 =
      typeof performance !== "undefined" && performance.now
        ? performance.now()
        : Date.now();

    const step = (now: number) => {
      const live = themeScrollRef.current;
      if (!live) {
        nudgeFrameRef.current = null;
        nudgeAnimatingRef.current = false;
        return;
      }
      const elapsed = now - t0;
      const u = Math.min(1, elapsed / THEME_ROW_NUDGE_MS);
      const x = startX + (endX - startX) * easeInOutQuad(u);
      live.scrollTo({ x, animated: false });
      if (u < 1) {
        nudgeFrameRef.current = requestAnimationFrame(step);
      } else {
        scrollXRef.current = endX;
        nudgeFrameRef.current = null;
        nudgeAnimatingRef.current = false;
      }
    };
    nudgeFrameRef.current = requestAnimationFrame(step);
  }, [stopThemeRowNudge]);

  /** Coalesce onPress + onPressOut (same physical tap) and satisfy a11y activate → onPress. */
  const onHintNudgeGesture = useCallback(() => {
    const now = Date.now();
    if (now - lastHintNudgeGestureAt.current < 450) return;
    lastHintNudgeGestureAt.current = now;
    nudgeThemeRowAfterHint();
  }, [nudgeThemeRowAfterHint]);

  return (
    isPartyMode && (
  <GlassCardDark
    style={{ marginBottom: 16 }}
    padding={0}
    borderRadius={radius.lg}
    borderColor="rgba(107, 56, 212, 0.12)"
    blurIntensity={24}
    contentStyle={{
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[4],
    }}
  >
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginBottom: spacing[3],
      }}
    >
      <WandSparkles
        size={20}
        color={colors.primary}
        strokeWidth={2.2}
      />
      <Text
        style={{
          fontSize: 10,
          fontWeight: "800",
          color: "#1e3a5f",
          letterSpacing: 1.15,
          textTransform: "uppercase",
        }}
      >
        Customize your poster
      </Text>
      <Sparkles size={16} color={colors.primary} strokeWidth={2.2} />

    </View>

    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: "rgba(107, 56, 212, 0.14)",
        marginBottom: spacing[3],
      }}
    />
    <Text
      style={{
        fontFamily: fontFamily.headline,
        fontSize: 22,
        fontWeight: "800",
        color: colors.onSurface,
        textAlign: "center",
        letterSpacing: -0.4,
        marginBottom: spacing[2],
      }}
    >
      Theme & Vibe
    </Text>
    <View style={{ marginBottom: spacing[3] }}>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "500",
          color: colors.onSurfaceVariant,
          textAlign: "center",
          lineHeight: 20,
          marginBottom: spacing[4],
          paddingHorizontal: spacing[2],
        }}
      >
        Pick a party theme, vibe & colors to help us create a unique
        AI-generated invitation poster
      </Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing[2],
          marginBottom: 10,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: "800",
            color: colors.primary,
            letterSpacing: 1,
          }}
        >
          PARTY THEME
        </Text>
        <Pressable
          onPress={onHintNudgeGesture}
          onPressOut={onHintNudgeGesture}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            flexShrink: 0,
            opacity: pressed ? 1 : 0.85,
          })}
          hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Peek more party themes"
          accessibilityHint="Releases a slow scroll to show more themes to the right"
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: colors.onSurfaceVariant,
              letterSpacing: 0.15,
            }}
          >
            Swipe right for more
          </Text>
          <ChevronRight
            size={14}
            color={colors.onSurfaceVariant}
            strokeWidth={2.25}
            style={{ marginLeft: 1, marginTop: 0.5 }}
          />
        </Pressable>
      </View>
      {/**
       * Narrow the scroll viewport with paddingRight so the next chip peeks —
       * avoids a “false floor” when exactly N themes fit the row.
       */}
      <View style={{ paddingRight: 0, marginBottom: spacing[2] }}>
        <ScrollView
          ref={themeScrollRef}
          horizontal
          showsHorizontalScrollIndicator
          keyboardShouldPersistTaps="handled"
          accessibilityLabel="Party theme presets"
          accessibilityHint="Scroll sideways to see more theme options"
          scrollEventThrottle={16}
          onScroll={(e) => {
            scrollXRef.current = e.nativeEvent.contentOffset.x;
          }}
          onContentSizeChange={(w) => {
            contentWidthRef.current = w;
          }}
          onLayout={(e) => {
            layoutWidthRef.current = e.nativeEvent.layout.width;
          }}
          contentContainerStyle={{
            gap: 12,
            paddingRight: spacing[4],
            alignItems: "flex-start",
          }}
        >
        {[...partyTypeOptions, PARTY_THEME_CUSTOM_SCROLL].map(
          (opt) => {
            const isCustomChip = opt.value === "__custom__";
            const chipIcon =
              !isCustomChip && "iconImage" in opt && opt.iconImage ? (
                <Image
                  source={opt.iconImage}
                  style={{ width: 44, height: 44 }}
                  resizeMode="contain"
                />
              ) : (
                <Text style={{ fontSize: 36 }}>{opt.label}</Text>
              );
            const presetSelected =
              !isCustomChip && formData.partyType === opt.value;
            const customSelected =
              isCustomChip &&
              !formData.partyType?.trim() &&
              !!formData.theme?.trim();
            const sel = presetSelected || customSelected;
            const idlePair = isCustomChip
              ? (["#faf5ff", "#f3e8ff"] as const)
              : (PARTY_CHIP_IDLE[opt.value] ??
                (["#f5f3ff", "#ede9fe"] as const));
            return (
              <TouchableOpacity
                key={isCustomChip ? "__custom__" : opt.value}
                onPress={() => {
                  if (isCustomChip) {
                    onInputChange("partyType", "");
                    themeInputRef.current?.focus();
                  } else {
                    onInputChange("partyType", opt.value);
                    onInputChange("theme", "");
                  }
                }}
                activeOpacity={0.88}
                style={{
                  alignItems: "center",
                  minWidth: 80,
                  paddingBottom: 10,
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: sel }}
                accessibilityLabel={
                  isCustomChip
                    ? "Custom theme — type your own"
                    : `Party theme ${opt.name}`
                }
              >
                {sel ? (
                  <View
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: 36,
                      backgroundColor: colors.primary,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 3,
                      borderColor: "rgba(255, 255, 255, 0.92)",
                    }}
                  >
                    {chipIcon}
                  </View>
                ) : (
                  <LinearGradient
                    colors={[idlePair[0], idlePair[1]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: 36,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1.5,
                      borderColor: "rgba(107, 56, 212, 0.22)",
                    }}
                  >
                    {chipIcon}
                  </LinearGradient>
                )}
                <Text
                  style={{
                    marginTop: 10,
                    fontSize: 11,
                    fontWeight: "800",
                    color: sel ? colors.primary : "#4b2d7a",
                    textAlign: "center",
                    lineHeight: 14,
                    maxWidth: 80,
                  }}
                  numberOfLines={3}
                >
                  {opt.name}
                </Text>
              </TouchableOpacity>
            );
          },
        )}
        </ScrollView>
      </View>
      {formData.partyType === "other" && (
        <TextInput
          style={{
            marginTop: 12,
            backgroundColor: colors.surfaceContainerLowest,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 15,
            fontWeight: "600",
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
          placeholder="Describe your party type..."
          placeholderTextColor="#9CA3AF"
          value={formData.otherPartyType ?? ""}
          onChangeText={(v) => onInputChange("otherPartyType", v)}
        />
      )}

      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: colors.onSurfaceVariant,
          // marginTop: spacing[2],
          marginBottom: 8,
        }}
      >
        Or describe your own theme
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.surfaceContainerLowest,
          borderRadius: radius.full,
          borderWidth: focusedField === "theme" ? 2 : 1,
          borderColor:
            focusedField === "theme"
              ? colors.primary
              : "rgba(147, 197, 253, 0.45)",
          paddingLeft: spacing[4],
          paddingRight: spacing[2],
          minHeight: 48,
          marginBottom: spacing[3],
          ...Platform.select({
            ios: {
              shadowColor: "#0c1c2a",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
            },
            android: { elevation: 1 },
          }),
        }}
      >
        <TextInput
          ref={themeInputRef}
          style={{
            flex: 1,
            fontSize: 15,
            fontWeight: "600",
            color: colors.onSurface,
            paddingVertical: 12,
            paddingRight: spacing[2],
          }}
          placeholder="Princess, Space, Dinosaurs…"
          placeholderTextColor={colors.muted}
          value={formData.theme}
          onChangeText={(v) => {
            if (v.trim() && formData.partyType) {
              onInputChange("partyType", "");
            }
            onInputChange("theme", v);
          }}
          onFocus={() => setFocusedField("theme")}
          onBlur={() => setFocusedField(null)}
          returnKeyType="done"
        />
        <TouchableOpacity
          onPress={() => themeInputRef.current?.focus()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Focus custom theme field"
        >
          <WandSparkles
            size={20}
            color={colors.primary}
            strokeWidth={2.2}
          />
        </TouchableOpacity>
      </View>
    </View>

    <View style={{ marginTop: spacing[1] }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "800",
          color: colors.primary,
          letterSpacing: 1,
          marginBottom: 6,
        }}
      >
        PARTY VIBE
      </Text>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "500",
          color: colors.onSurfaceVariant,
          lineHeight: 18,
        }}
      >
        A few words on the mood, music, or what kids will do 
      </Text>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "500",
          color: colors.onSurfaceVariant,
          lineHeight: 18,
          marginBottom: spacing[3],
        }}
      >
        this will help the Gen-AI create a unique invitation poster.
      </Text>
      <View
        style={{
          backgroundColor: colors.surfaceContainerLowest,
          borderRadius: radius.lg,
          borderWidth: focusedField === "partyVibe" ? 2 : 1,
          borderColor:
            focusedField === "partyVibe"
              ? colors.primary
              : "rgba(147, 197, 253, 0.45)",
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[3],
          minHeight: 88,
          ...Platform.select({
            ios: {
              shadowColor: "#0c1c2a",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
            },
            android: { elevation: 1 },
          }),
        }}
      >
        <TextInput
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: colors.onSurface,
            lineHeight: 22,
            minHeight: 72,
            paddingVertical: 0,
            textAlignVertical: "top",
          }}
          placeholder="e.g. Glow sticks and a DJ, pizza then dance contest, relaxed backyard hang…"
          placeholderTextColor={colors.muted}
          value={formData.partyVibe ?? ""}
          onChangeText={(v) => onInputChange("partyVibe", v)}
          onFocus={() => setFocusedField("partyVibe")}
          onBlur={() => setFocusedField(null)}
          multiline
          numberOfLines={3}
          maxLength={400}
          returnKeyType="default"
          accessibilityLabel="Party vibe details for the poster"
        />
      </View>
    </View>

    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: "rgba(107, 56, 212, 0.14)",
        marginBottom: spacing[3],
        marginTop: spacing[4],
      }}
    />
    <HonoreeFavoriteColorPicker
      embedded
      value={formData.honoreeFavoriteColor}
      onSelect={(hex) => {
        const cur =
          formData.honoreeFavoriteColor?.toLowerCase() ?? "";
        onInputChange(
          "honoreeFavoriteColor",
          cur === hex.toLowerCase() ? "" : hex,
        );
      }}
    />
  </GlassCardDark>
))}