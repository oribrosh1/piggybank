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
import { getUserProfile } from "@/src/lib/userService";
import firebase from "@/src/firebase";
import { routes } from "@/types/routes";
import { EventDashboardScreen } from "@/src/screens/EventDashboardScreen/EventDashboardScreen";
import AppTabFooter from "@/src/components/AppTabFooter";
import PartyPlannerEmptyContent from "@/src/components/home/PartyPlannerEmptyContent";
import { colors, spacing, typography } from "@/src/theme";

const MY_EVENT_PADDING_TOP = 12;
const MY_EVENT_PADDING_H = spacing[5];

export default function MyEventTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [eventId, setEventId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const user = firebase.auth().currentUser;
      const [userEvents, profile] = await Promise.all([
        getUserEventsStats(),
        user ? getUserProfile(user.uid) : Promise.resolve(null),
      ]);
      userEvents.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setEventId(userEvents[0]?.id ?? null);
      setFirstName(profile?.fullName?.split(" ")[0]);
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
            paddingHorizontal: MY_EVENT_PADDING_H,
            paddingTop: insets.top + MY_EVENT_PADDING_TOP,
            paddingBottom: Math.max(insets.bottom, 16) + 100,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <PartyPlannerEmptyContent
            onCreateEvent={() =>
              router.push({
                pathname: routes.createEvent.posterStyle,
                params: { eventType: "birthday" },
              })
            }
            firstName={firstName}
            topInset={insets.top}
            topContentPadding={MY_EVENT_PADDING_TOP}
            leftInset={MY_EVENT_PADDING_H}
            rightInset={MY_EVENT_PADDING_H}
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

  return (
    <EventDashboardScreen
      eventId={eventId}
      onEventDeleted={() => {
        setLoading(true);
        load();
      }}
    />
  );
}
