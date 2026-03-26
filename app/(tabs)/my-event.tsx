import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { getUserEventsStats } from "@/src/lib/eventService";
import { routes } from "@/types/routes";
import { EventDashboardScreen } from "@/src/screens/EventDashboardScreen/EventDashboardScreen";

/**
 * Single-event tab: shows the full event dashboard (same UI as /event-dashboard/[id])
 * for the user's primary event, or an empty state to create one.
 */
export default function MyEventTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [eventId, setEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const userEvents = await getUserEventsStats();
      userEvents.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setEventId(userEvents[0]?.id ?? null);
    } catch (e) {
      console.error("[MyEventTab] load events:", e);
      setEventId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#F0FFFE",
          paddingTop: insets.top,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color="#6B3AA0" />
        <Text style={{ marginTop: 16, fontSize: 16, color: "#6B7280" }}>
          Loading your event...
        </Text>
      </View>
    );
  }

  if (!eventId) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F0FFFE", paddingTop: insets.top }}>
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 24,
            backgroundColor: "#6B3AA0",
            borderBottomLeftRadius: 30,
            borderBottomRightRadius: 30,
          }}
        >
          <Text
            style={{
              fontSize: 32,
              fontWeight: "900",
              color: "#FFFFFF",
              marginBottom: 4,
            }}
          >
            MY EVENT 📅
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.9)",
              fontWeight: "600",
            }}
          >
            Create your celebration — one event per family
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            paddingHorizontal: 20,
            paddingTop: 48,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 64, marginBottom: 16 }}>🎪</Text>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "900",
              color: "#6B3AA0",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            No event yet
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#9CA3AF",
              textAlign: "center",
              marginBottom: 24,
              lineHeight: 20,
            }}
          >
            CreditKid supports one event — create yours to invite guests and collect gifts.
          </Text>
          <TouchableOpacity
            onPress={() => router.push(routes.createEvent.eventType)}
            style={{
              backgroundColor: "#06D6A0",
              borderRadius: 16,
              paddingVertical: 14,
              paddingHorizontal: 28,
              shadowColor: "#06D6A0",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#FFFFFF" }}>
              CREATE YOUR EVENT 🚀
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <EventDashboardScreen eventId={eventId} />;
}
