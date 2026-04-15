import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { getUserEventsStats } from "@/src/lib/eventService";
import { routes } from "@/types/routes";
import { EventDashboardScreen } from "@/src/screens/EventDashboardScreen/EventDashboardScreen";
import AppTabFooter from "@/src/components/AppTabFooter";
import AppTabHeader from "@/src/components/AppTabHeader";
import PartyPlannerEmptyContent from "@/src/components/home/PartyPlannerEmptyContent";
import { colors, spacing, typography } from "@/src/theme";

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
      <View style={{ flex: 1, backgroundColor: "transparent", paddingTop: insets.top }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[typography.bodyLg, { marginTop: 16, color: colors.onSurfaceVariant }]}>
            Loading your event...
          </Text>
        </View>
        <AppTabFooter style={{ paddingBottom: Math.max(insets.bottom, 12) }} />
      </View>
    );
  }

  if (!eventId) {
    return (
      <View style={{ flex: 1, backgroundColor: "transparent" }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: spacing[5],
            paddingTop: insets.top + 12,
            paddingBottom: Math.max(insets.bottom, 16) + 100,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AppTabHeader />
          <PartyPlannerEmptyContent
            onCreateEvent={() =>
              router.push({
                pathname: routes.createEvent.eventDetails,
                params: { eventType: "birthday" },
              })
            }
          />
          <AppTabFooter
            style={{
              marginTop: spacing[6],
              paddingBottom: Math.max(insets.bottom, 12),
            }}
          />
        </ScrollView>
      </View>
    );
  }

  return <EventDashboardScreen eventId={eventId} />;
}
