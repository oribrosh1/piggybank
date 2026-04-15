import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  TextInput,
  Platform,
  StyleSheet,
  Pressable,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Lock, Wallet, Sparkles, Calendar } from "lucide-react-native";
import { getEvent, getUserEventsStats } from "@/src/lib/eventService";
import { PayoutSetupBanner } from "@/src/components/events";
import { getGiftTemplate } from "@/src/lib/giftCardTemplates";
import type { Event, Guest } from "@/types/events";
import { routes } from "@/types/routes";
import AppTabFooter from "@/src/components/AppTabFooter";
import AppTabHeader from "@/src/components/AppTabHeader";
import {
  colors,
  typography,
  radius,
  spacing,
  primaryGradient,
  fontFamily,
  ambientShadow,
} from "@/src/theme";

function centsToUsd(cents: number): number {
  return (cents || 0) / 100;
}

export default function GiftsTabScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: screenW } = useWindowDimensions();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      const userEvents = await getUserEventsStats();
      userEvents.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const first = userEvents[0];
      if (!first) {
        setEvent(null);
        return;
      }
      const full = await getEvent(first.id);
      setEvent(full);
    } catch (e) {
      console.error("[GiftsTab] load:", e);
      setEvent(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const paidGuests: Guest[] = useMemo(
    () =>
      event?.guests?.filter(
        (g) => g.status === "paid" && (g.paymentAmount ?? 0) > 0
      ) ?? [],
    [event?.guests]
  );

  const filteredGuests = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return paidGuests;
    return paidGuests.filter((g) => g.name.toLowerCase().includes(q));
  }, [paidGuests, query]);

  const totalCents =
    event?.guestStats?.totalPaid ??
    paidGuests.reduce((s, g) => s + (g.paymentAmount ?? 0), 0);

  const totalUsd = centsToUsd(totalCents);

  /** A4 portrait width in carousel — show peek of next card */
  const cardWidth = Math.min(screenW * 0.72, 300);
  const cardGap = 14;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "transparent", paddingTop: insets.top }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[typography.bodyLg, { marginTop: 16, color: colors.onSurfaceVariant }]}>
            Loading gifts…
          </Text>
        </View>
        <AppTabFooter />
      </View>
    );
  }

  if (!event) {
    return (
      <GiftsTabNoEventView
        insetsTop={insets.top}
        insetsBottom={insets.bottom}
        screenW={screenW}
        router={router}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing[5],
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <AppTabHeader />

        <PayoutSetupBanner event={event} />

        <Text style={[typography.headlineLg, { fontSize: 24, marginBottom: 4 }]}>
          Gifts Received ({paidGuests.length})
        </Text>
        <Text
          style={[
            typography.bodyLg,
            { fontFamily: fontFamily.title, color: colors.primary, marginBottom: 20 },
          ]}
        >
          {event.eventName}
        </Text>

        {/* Total — primary gradient */}
        <LinearGradient
          {...primaryGradient}
          style={{
            borderRadius: radius.md,
            padding: 22,
            marginBottom: 22,
            ...ambientShadow,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "800",
              color: "rgba(255,255,255,0.85)",
              letterSpacing: 1.2,
              marginBottom: 10,
            }}
          >
            VAULT BALANCE ELEVATION
          </Text>
          <Text style={{ fontSize: 38, fontFamily: fontFamily.display, color: colors.onPrimary, letterSpacing: -0.5 }}>
            {totalUsd.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 2,
            })}
          </Text>
          <View style={{ alignItems: "center", marginTop: 16 }}>
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.22)",
                paddingVertical: 8,
                paddingHorizontal: 18,
                borderRadius: 999,
              }}
            >
              <Text style={{ fontSize: 12, fontFamily: fontFamily.title, color: colors.onPrimary, letterSpacing: 0.4 }}>
                Total Gifts Collected
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Birthday Cards + search */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <Text style={[typography.titleLg, { fontSize: 18 }]}>Birthday Cards</Text>
          <View style={{ flexDirection: "row", gap: 5 }}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i === 0 ? colors.primary : colors.surfaceContainerHigh,
                }}
              />
            ))}
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surfaceContainerLowest,
            borderRadius: radius.sm,
            paddingHorizontal: 14,
            paddingVertical: 12,
            marginBottom: 18,
          }}
        >
          <Ionicons name="search" size={20} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search senders..."
            placeholderTextColor={colors.muted}
            style={{
              flex: 1,
              marginLeft: 10,
              fontSize: 15,
              fontFamily: fontFamily.body,
              color: colors.onSurface,
              paddingVertical: 0,
            }}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>

        {paidGuests.length === 0 ? (
          <View
            style={{
              alignItems: "center",
              paddingVertical: 28,
              paddingHorizontal: 16,
              backgroundColor: colors.surfaceContainerLow,
              borderRadius: radius.md,
            }}
          >
            <Text style={{ fontSize: 40, marginBottom: 12 }}>💌</Text>
            <Text style={[typography.bodyLg, { fontFamily: fontFamily.title, color: colors.onSurfaceVariant, textAlign: "center" }]}>
              No gifts yet
            </Text>
            <Text
              style={[
                typography.bodyMd,
                {
                  marginTop: 8,
                  color: colors.muted,
                  textAlign: "center",
                  lineHeight: 20,
                },
              ]}
            >
              Share your invite link — guest gift cards with blessings will appear here.
            </Text>
          </View>
        ) : filteredGuests.length === 0 ? (
          <Text style={[typography.bodyMd, { color: colors.muted, textAlign: "center", paddingVertical: 24 }]}>
            No senders match “{query.trim()}”.
          </Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={cardWidth + cardGap}
            snapToAlignment="start"
            contentContainerStyle={{
              paddingRight: 20,
              paddingBottom: 8,
            }}
          >
            {filteredGuests.map((guest, index) => (
              <View
                key={guest.id}
                style={{ marginRight: index < filteredGuests.length - 1 ? cardGap : 0 }}
              >
                <BlessingGiftCard guest={guest} cardWidth={cardWidth} />
              </View>
            ))}
          </ScrollView>
        )}

        <AppTabFooter />
      </ScrollView>
    </View>
  );
}

function GiftsTabNoEventView({
  insetsTop,
  insetsBottom,
  screenW,
  router,
}: {
  insetsTop: number;
  insetsBottom: number;
  screenW: number;
  router: ReturnType<typeof useRouter>;
}) {
  const cardWidth = Math.min(screenW * 0.72, 300);
  const cardGap = 14;

  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing[5],
          paddingTop: insetsTop + 12,
          paddingBottom: insetsBottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <AppTabHeader />

        <Text
          style={{
            fontFamily: fontFamily.display,
            fontSize: 24,
            lineHeight: 30,
            letterSpacing: -0.4,
            color: colors.onSurface,
            marginBottom: spacing[5],
          }}
        >
          Your gift vault unlocks here
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: spacing[3],
          }}
        >
          <Text style={[typography.titleLg, { fontSize: 17 }]}>Digital Gift Cards</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: "800",
                letterSpacing: 0.8,
                color: colors.primary,
                fontFamily: fontFamily.title,
              }}
            >
              LOCKED
            </Text>
            <Lock size={14} color={colors.primary} strokeWidth={2.5} />
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surfaceContainerLow,
            borderRadius: radius.sm,
            paddingHorizontal: 14,
            paddingVertical: 12,
            marginBottom: spacing[5],
            ...borderGhostMuted,
          }}
        >
          <Ionicons name="search" size={20} color={colors.muted} />
          <TextInput
            editable={false}
            placeholder="Search for senders..."
            placeholderTextColor={colors.muted}
            style={{
              flex: 1,
              marginLeft: 10,
              fontSize: 15,
              fontFamily: fontFamily.body,
              color: colors.onSurface,
              paddingVertical: 0,
            }}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={cardWidth + cardGap}
          snapToAlignment="start"
          contentContainerStyle={{ paddingRight: spacing[5], paddingBottom: spacing[2] }}
        >
          <View style={{ marginRight: cardGap }}>
            <LockedDigitalGiftCard
              cardWidth={cardWidth}
              onCreateEvent={() =>
                router.push({
                  pathname: routes.createEvent.eventDetails,
                  params: { eventType: "birthday" },
                })
              }
            />
          </View>
           <View style={{ marginRight: cardGap }}>
            <LockedDigitalGiftCard
              cardWidth={cardWidth}
              onCreateEvent={() =>
                router.push({
                  pathname: routes.createEvent.eventDetails,
                  params: { eventType: "birthday" },
                })
              }
            />
          </View>
          <View style={{ marginRight: cardGap }}>
            <LockedDigitalGiftCard
              cardWidth={cardWidth}
              onCreateEvent={() =>
                router.push({
                  pathname: routes.createEvent.eventDetails,
                  params: { eventType: "birthday" },
                })
              }
            />
          </View>
        </ScrollView>

        <HowDigitalGiftsWork />

        <AppTabFooter style={{ marginTop: spacing[3] }} />
      </ScrollView>
    </View>
  );
}

const borderGhostMuted: ViewStyle = {
  borderWidth: 1,
  borderColor: "rgba(203, 195, 215, 0.12)",
};

function LockedDigitalGiftCard({
  cardWidth,
  onCreateEvent,
}: {
  cardWidth: number;
  onCreateEvent: () => void;
}) {
  return (
    <View style={{ width: cardWidth }}>
      <View
        style={{
          width: cardWidth,
          aspectRatio: 210 / 260,
          borderRadius: radius.sm,
          overflow: "hidden",
          backgroundColor: "#1a0f18",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <LinearGradient
          colors={["#0f0608", "#2a1a0f", "#1a1210"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View
            style={{
              position: "absolute",
              top: 40,
              left: -20,
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: "rgba(255, 200, 120, 0.12)",
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: 80,
              right: -30,
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: "rgba(255, 220, 160, 0.1)",
            }}
          />
          <View
            style={{
              position: "absolute",
              top: 120,
              right: 20,
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: "rgba(255, 200, 100, 0.15)",
            }}
          />
        </View>

        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: spacing[3],
          }}
        >
          <BlurView
            intensity={Platform.OS === "ios" ? 55 : 40}
            tint="light"
            style={{
              width: "88%",
              borderRadius: radius.md,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.35)",
            }}
          >
            <View
              style={{
                paddingVertical: spacing[5],
                paddingHorizontal: spacing[4],
                alignItems: "center",
                backgroundColor: Platform.OS === "android" ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.65)",
              }}
            >
              <LinearGradient
                {...primaryGradient}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: spacing[3],
                }}
              >
                <Lock size={24} color={colors.onPrimary} strokeWidth={2.5} />
              </LinearGradient>
              <Text
                style={[
                  typography.titleLg,
                  { fontSize: 17, textAlign: "center", marginBottom: spacing[2] },
                ]}
              >
                Unlock on the big day!
              </Text>
              <Text
                style={[
                  typography.bodyMd,
                  {
                    fontSize: 13,
                    color: colors.onSurfaceVariant,
                    textAlign: "center",
                    lineHeight: 19,
                    marginBottom: spacing[4],
                  },
                ]}
              >
                Create the birthday event to reveal unique AI blessing cards from your child's friends.
              </Text>
              <Pressable
                onPress={onCreateEvent}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.9 : 1,
                  borderRadius: radius.full,
                  overflow: "hidden",
                  alignSelf: "stretch",
                })}
              >
                <LinearGradient
                  {...primaryGradient}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: spacing[5],
                    alignItems: "center",
                    borderRadius: radius.full,
                  }}
                >
                  <Text style={[typography.bodyMd, { fontWeight: "800", color: colors.onPrimary }]}>Create Event</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </BlurView>
        </View>
      </View>
    </View>
  );
}

function HowDigitalGiftsWork() {
  const rows = [
    {
      key: "direct",
      Icon: Wallet,
      title: "Direct Gifting",
      body: "Money goes straight to your child's vault card, earning interest instantly while locked.",
      circleBg: "rgba(59, 130, 246, 0.15)",
      iconColor: "#1D4ED8",
    },
    {
      key: "ai",
      Icon: Sparkles,
      title: "AI Blessing Cards",
      body: "Every gift comes with a unique AI-generated keepsake based on the sender's personalized message.",
      circleBg: "rgba(16, 185, 129, 0.15)",
      iconColor: "#047857",
    },
    {
      key: "locked",
      Icon: Calendar,
      title: "Locked for Excitement",
      body: "Visuals and messages unlock on the event date to maximize the birthday morning surprise.",
      circleBg: "rgba(249, 115, 22, 0.18)",
      iconColor: "#C2410C",
    },
  ];

  return (
    <View
      style={{
        marginTop: spacing[6],
        padding: spacing[5],
        borderRadius: radius.md,
        backgroundColor: colors.surfaceContainerLow,
        ...borderGhostMuted,
      }}
    >
      <Text style={[typography.titleLg, { fontSize: 18, marginBottom: spacing[5], fontFamily: fontFamily.display }]}>
        How Digital Gifts Work
      </Text>
      {rows.map((row) => {
        const Icon = row.Icon;
        return (
          <View
            key={row.key}
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: spacing[4],
              marginBottom: spacing[5],
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: row.circleBg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon size={22} color={row.iconColor} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyMd, { fontWeight: "800", marginBottom: 4 }]}>{row.title}</Text>
              <Text style={[typography.bodyMd, { fontSize: 13, color: colors.onSurfaceVariant, lineHeight: 19 }]}>
                {row.body}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function BlessingGiftCard({ guest, cardWidth }: { guest: Guest; cardWidth: number }) {
  const tmpl = getGiftTemplate(guest.templateId);
  const amountUsd = centsToUsd(guest.paymentAmount ?? 0);
  const amountLabel = amountUsd.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
  const blessing =
    guest.blessing?.trim() ||
    "Warm wishes for a wonderful celebration — thank you for being part of this special day.";

  return (
    <View style={{ width: cardWidth }}>
      <LinearGradient
        colors={tmpl.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: cardWidth,
          aspectRatio: 210 / 297,
          borderRadius: radius.sm,
          overflow: "hidden",
          shadowColor: colors.onSurface,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 24,
          elevation: 8,
        }}
      >
        {/* Decorative circles (watercolor-style border feel) */}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View
            style={{
              position: "absolute",
              top: 12,
              left: 10,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "rgba(255,255,255,0.25)",
            }}
          />
          <View
            style={{
              position: "absolute",
              top: 28,
              right: 16,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(255,255,255,0.18)",
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: 100,
              left: 20,
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: "rgba(255,255,255,0.2)",
            }}
          />
        </View>

        <View
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            backgroundColor: "rgba(255,255,255,0.28)",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
          }}
        >
          <Text style={{ fontSize: 9, fontWeight: "800", color: "#FFFFFF", letterSpacing: 0.3 }}>
            VAULT COLLECTIBLE
          </Text>
        </View>

        <View style={{ flex: 1, padding: 18, justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontSize: 36, marginBottom: 6 }}>{tmpl.emoji}</Text>
            <Text
              style={[
                {
                  fontSize: 15,
                  fontWeight: "500",
                  color: "rgba(255,255,255,0.95)",
                  lineHeight: 22,
                  fontStyle: "italic",
                },
                Platform.select({
                  ios: { fontFamily: "Georgia" },
                  android: { fontFamily: "serif" },
                  default: {},
                }),
              ]}
            >
              &ldquo;{blessing}&rdquo;
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: "rgba(255,255,255,0.25)",
            }}
          >
            <Text style={{ flex: 1, marginRight: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.75)" }}>
                FROM{" "}
              </Text>
              <Text style={{ fontSize: 14, fontWeight: "900", color: "#FFFFFF" }}>{guest.name}</Text>
            </Text>
            <Text style={{ fontSize: 16, fontWeight: "900", color: "#BBF7D0" }}>{amountLabel}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
