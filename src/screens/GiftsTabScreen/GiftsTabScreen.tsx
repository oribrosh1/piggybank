import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  TextInput,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { getEvent, getUserEventsStats } from "@/src/lib/eventService";
import { PayoutSetupBanner } from "@/src/components/events";
import { getGiftTemplate } from "@/src/lib/giftCardTemplates";
import type { Event, Guest } from "@/types/events";
import { routes } from "@/types/routes";

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
      <View
        style={{
          flex: 1,
          backgroundColor: "#F5F0FF",
          paddingTop: insets.top,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={{ marginTop: 16, fontSize: 16, color: "#6B7280" }}>
          Loading gifts…
        </Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F5F0FF", paddingTop: insets.top }}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <HomeStyleHeader />
          <Text
            style={{
              fontSize: 24,
              fontWeight: "900",
              color: "#111827",
              marginBottom: 4,
            }}
          >
            Gifts Received (0)
          </Text>
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#7C3AED", marginBottom: 24 }}>
            No event yet
          </Text>
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ fontSize: 52, marginBottom: 12 }}>🎁</Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "800",
                color: "#374151",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              Create an event first
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#9CA3AF",
                textAlign: "center",
                lineHeight: 20,
                marginBottom: 20,
              }}
            >
              When guests send gifts with a blessing, their gift cards appear here.
            </Text>
            <TouchableOpacity onPress={() => router.push(routes.createEvent.eventType)}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: "#7C3AED" }}>
                Create event →
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F0FF", paddingTop: insets.top }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />
        }
      >
        <HomeStyleHeader />

        <PayoutSetupBanner event={event} />

        <Text
          style={{
            fontSize: 24,
            fontWeight: "900",
            color: "#111827",
            marginBottom: 4,
          }}
        >
          Gifts Received ({paidGuests.length})
        </Text>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: "#7C3AED",
            marginBottom: 20,
          }}
        >
          {event.eventName}
        </Text>

        {/* Total — vault-style gradient (purple → indigo) */}
        <LinearGradient
          colors={["#6366F1", "#7C3AED", "#5B21B6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 22,
            padding: 22,
            marginBottom: 22,
            shadowColor: "#5B21B6",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 14,
            elevation: 6,
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
          <Text style={{ fontSize: 38, fontWeight: "900", color: "#FFFFFF", letterSpacing: -0.5 }}>
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
              <Text style={{ fontSize: 12, fontWeight: "800", color: "#FFFFFF", letterSpacing: 0.4 }}>
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
          <Text style={{ fontSize: 18, fontWeight: "900", color: "#111827" }}>Birthday Cards</Text>
          <View style={{ flexDirection: "row", gap: 5 }}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i === 0 ? "#7C3AED" : "#E5E7EB",
                }}
              />
            ))}
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 12,
            marginBottom: 18,
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
        >
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search senders..."
            placeholderTextColor="#9CA3AF"
            style={{
              flex: 1,
              marginLeft: 10,
              fontSize: 15,
              fontWeight: "500",
              color: "#111827",
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
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
            }}
          >
            <Text style={{ fontSize: 40, marginBottom: 12 }}>💌</Text>
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#6B7280", textAlign: "center" }}>
              No gifts yet
            </Text>
            <Text
              style={{
                marginTop: 8,
                fontSize: 14,
                color: "#9CA3AF",
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              Share your invite link — guest gift cards with blessings will appear here.
            </Text>
          </View>
        ) : filteredGuests.length === 0 ? (
          <Text style={{ fontSize: 14, color: "#9CA3AF", textAlign: "center", paddingVertical: 24 }}>
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
      </ScrollView>
    </View>
  );
}

function HomeStyleHeader() {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#FED7AA",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="gift" size={18} color="#C2410C" />
        </View>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: "#7C3AED",
            fontStyle: "italic",
          }}
        >
          CreditKid
        </Text>
      </View>
      <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="notifications-outline" size={22} color="#374151" />
      </TouchableOpacity>
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
          borderRadius: 16,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.18,
          shadowRadius: 14,
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
