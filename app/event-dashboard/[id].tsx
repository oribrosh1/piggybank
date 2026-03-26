import { useLocalSearchParams } from "expo-router";
import { EventDashboardScreen } from "@/src/screens/EventDashboardScreen/EventDashboardScreen";

export default function EventDashboardRoute() {
    const { id } = useLocalSearchParams<{ id: string }>();
  if (!id) return null;
  return <EventDashboardScreen eventId={id} />;
}
