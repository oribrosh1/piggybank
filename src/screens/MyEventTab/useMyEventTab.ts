import { useCallback, useState } from "react";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { getUserEventsStats } from "@/src/lib/eventService";
import { getUserProfile } from "@/src/lib/userService";
import firebase from "@/src/firebase";

export function useMyEventTab() {
  const { eventId: routeEventId } = useLocalSearchParams<{ eventId?: string }>();
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

      const preferredId = routeEventId;
      if (preferredId && userEvents.some((event) => event.id === preferredId)) {
        setEventId(preferredId);
      } else {
        userEvents.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
        setEventId(userEvents[0]?.id ?? null);
      }

      setFirstName(profile?.fullName?.split(" ")[0]);
    } catch (e) {
      console.error("[MyEventTab] load events:", e);
      setEventId(null);
    } finally {
      setLoading(false);
    }
  }, [routeEventId]);

  const reload = useCallback(() => {
    setLoading(true);
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  return {
    eventId,
    firstName,
    loading,
    reload,
  };
}
