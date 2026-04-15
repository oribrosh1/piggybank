import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Dimensions,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronRight, ShoppingBag, ArrowLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { POSTER_THEME_OPTIONS } from "@/src/lib/posterThemes";
import type { PosterThemeId } from "@/types/events";
import { useEventPosterScreen } from "./useEventPosterScreen";

const BG = "#0f172a";
const ACCENT = "#a78bfa";
const A4 = 210 / 297;
const CARD_W = Math.min(Dimensions.get("window").width - 48, 340);

export default function EventPosterScreen() {
  const insets = useSafeAreaInsets();
  const {
    generatingTheme,
    isGenerating,
    selectTheme,
    goBack,
    fadeAnim,
    progressWidth,
    eventId,
    celebrationLine,
    displayPosterUrl,
    posterReady,
    continueToGuests,
    latestVersionNumber,
    skipPosterAndGoToMyEvent,
  } = useEventPosterScreen();

  if (!eventId) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <TouchableOpacity onPress={goBack} hitSlop={12} style={{ padding: 8, width: 56 }}>
          <ArrowLeft size={22} color="#94a3b8" strokeWidth={2.2} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 17, fontWeight: "800", color: "#f8fafc", textAlign: "center" }}>
          Event Poster
        </Text>
        <View style={{ width: 56, alignItems: "flex-end" }}>
          <View style={{ position: "relative" }}>
            <ShoppingBag size={22} color="#94a3b8" strokeWidth={2} />
            <View
              style={{
                position: "absolute",
                top: -4,
                right: -6,
                backgroundColor: "#64748b",
                borderRadius: 8,
                minWidth: 16,
                height: 16,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "800", color: "#fff" }}>0</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
          <Text style={{ fontSize: 11, fontWeight: "800", color: ACCENT, letterSpacing: 1.2 }}>STEP 2 OF 3</Text>
          <Text style={{ fontSize: 11, fontWeight: "800", color: ACCENT }}>PICK YOUR DESIGN</Text>
        </View>
        <View style={{ height: 6, backgroundColor: "#1e293b", borderRadius: 3, overflow: "hidden", marginBottom: 20 }}>
          <Animated.View
            style={{ height: "100%", backgroundColor: ACCENT, width: progressWidth, borderRadius: 3 }}
          />
        </View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={{ fontSize: 28, fontWeight: "900", color: "#f8fafc", letterSpacing: -0.5 }}>Choose Your Poster</Text>
          <Text style={{ fontSize: 12, fontWeight: "800", color: "#94a3b8", marginTop: 10, letterSpacing: 0.8, lineHeight: 18 }}>
            {celebrationLine}
          </Text>
        </Animated.View>

        {isGenerating ? (
          <View
            style={{
              marginTop: 14,
              padding: 14,
              backgroundColor: "#1e293b",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "rgba(167,139,250,0.35)",
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <ActivityIndicator size="small" color={ACCENT} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "800", color: "#f8fafc" }}>Creating your poster…</Text>
              <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, fontWeight: "600", lineHeight: 17 }}>
                AI is generating your image. This often takes 1–2 minutes — keep this screen open.
              </Text>
            </View>
          </View>
        ) : null}

        {displayPosterUrl ? (
          <View style={{ marginTop: 16, padding: 12, backgroundColor: "#1e293b", borderRadius: 16, borderWidth: 1, borderColor: "rgba(148,163,184,0.2)" }}>
            <Text style={{ fontSize: 11, fontWeight: "800", color: ACCENT, letterSpacing: 0.8, marginBottom: 8 }}>
              YOUR POSTER{latestVersionNumber != null ? ` · VERSION ${latestVersionNumber}` : ""}
            </Text>
            <View style={{ borderRadius: 12, overflow: "hidden", alignSelf: "center", width: Math.min(CARD_W, 280) }}>
              <Image
                source={{ uri: displayPosterUrl }}
                style={{ width: "100%", aspectRatio: A4, backgroundColor: "#0f172a" }}
                resizeMode="cover"
              />
            </View>
          </View>
        ) : null}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {POSTER_THEME_OPTIONS.map((opt) => {
          const busy = generatingTheme === opt.id;
          return (
            <View key={opt.id} style={{ marginBottom: 20 }}>
              <View
                style={{
                  borderRadius: 24,
                  overflow: "hidden",
                  width: CARD_W,
                  alignSelf: "center",
                  borderWidth: 1,
                  borderColor: "rgba(148,163,184,0.25)",
                }}
              >
                <View style={{ width: "100%", aspectRatio: A4 }}>
                  <LinearGradient colors={opt.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
                    <View style={{ flex: 1, padding: 16, justifyContent: "space-between" }}>
                      <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                        <View
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: "rgba(34,197,94,0.9)",
                          }}
                        />
                      </View>
                      <Text style={{ fontSize: 42, textAlign: "center" }}>{opt.emoji}</Text>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "800",
                          color: "rgba(255,255,255,0.9)",
                          textAlign: "center",
                          textShadowColor: "rgba(0,0,0,0.4)",
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 4,
                        }}
                      >
                        Preview — AI will personalize with your event details
                      </Text>
                    </View>
                  </LinearGradient>
                </View>

                <TouchableOpacity
                  onPress={() => selectTheme(opt.id as PosterThemeId)}
                  disabled={!!generatingTheme}
                  activeOpacity={0.92}
                  style={{
                    backgroundColor: "#fbbf24",
                    paddingVertical: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {busy ? (
                    <ActivityIndicator color="#111827" />
                  ) : (
                    <>
                      <Text style={{ fontSize: 15, fontWeight: "900", color: "#111827" }}>Select &amp; Create Event</Text>
                      <ChevronRight size={20} color="#111827" strokeWidth={2.5} />
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={{ marginTop: 10, paddingHorizontal: 4 }}>
                <Text style={{ fontSize: 17, fontWeight: "900", color: "#f8fafc" }}>{opt.title}</Text>
                <Text style={{ fontSize: 13, color: "#94a3b8", marginTop: 4, fontWeight: "600" }}>{opt.description}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 16,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: "rgba(148,163,184,0.15)",
          backgroundColor: BG,
          gap: 12,
        }}
      >
        {posterReady && displayPosterUrl ? (
          <TouchableOpacity
            onPress={continueToGuests}
            activeOpacity={0.92}
            style={{
              backgroundColor: ACCENT,
              paddingVertical: 16,
              borderRadius: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "900", color: "#0f172a" }}>Continue to guests</Text>
            <ChevronRight size={22} color="#0f172a" strokeWidth={2.5} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          onPress={skipPosterAndGoToMyEvent}
          disabled={isGenerating}
          activeOpacity={0.88}
          style={{
            paddingVertical: 16,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "rgba(148,163,184,0.45)",
            alignItems: "center",
            justifyContent: "center",
            opacity: isGenerating ? 0.45 : 1,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "800", color: "#e2e8f0" }}>Skip and create event</Text>
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#94a3b8", marginTop: 4, textAlign: "center" }}>
            No poster — go to My event
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
