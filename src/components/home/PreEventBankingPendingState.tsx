import { View, Text, TouchableOpacity } from "react-native";
import type { EventSummary } from "@/types/events";
import BankingSetupRequiredCard from "./BankingSetupRequiredCard";
import UpcomingEventPosterRow from "./UpcomingEventPosterRow";
import LockedNextStepsSection from "./LockedNextStepsSection";

interface Props {
  greeting: string;
  firstName: string;
  event: EventSummary;
  formattedEventDate: string;
  onCompleteBanking: () => void;
  onViewEvent: () => void;
  onViewAllEvents: () => void;
}

export default function PreEventBankingPendingState({
  greeting,
  firstName,
  event,
  formattedEventDate,
  onCompleteBanking,
  onViewEvent,
  onViewAllEvents,
}: Props) {
  return (
    <View>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "800",
          color: "#7C3AED",
          letterSpacing: 1.2,
          marginBottom: 6,
        }}
      >
        DASHBOARD
      </Text>
      <Text
        style={{
          fontSize: 24,
          fontWeight: "800",
          color: "#1F2937",
          marginBottom: 18,
        }}
      >
        {greeting}, {firstName}
      </Text>

      <BankingSetupRequiredCard onCompleteSetup={onCompleteBanking} />

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "900", color: "#111827" }}>Upcoming Events</Text>
        <TouchableOpacity onPress={onViewAllEvents} hitSlop={8}>
          <Text style={{ fontSize: 14, fontWeight: "800", color: "#7C3AED" }}>View All</Text>
        </TouchableOpacity>
      </View>

      <UpcomingEventPosterRow event={event} formattedDate={formattedEventDate} onPress={onViewEvent} />

      <LockedNextStepsSection />
    </View>
  );
}
