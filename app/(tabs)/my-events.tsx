import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronRight, Plus, Calendar, Users, MapPin } from "lucide-react-native";
import { routes } from "../../types/routes";
import { useEffect, useState, useCallback } from "react";
import { getUserEventsStats } from "../../src/lib/eventService";
import { EventSummary } from "../../types/events";

export default function MyEventsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      // Fetch event stats only (no full guest data)
      const userEvents = await getUserEventsStats();
      // Sort by date (newest first)
      userEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEvents(userEvents);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadEvents();
  }, [loadEvents]);

  const handleEventPress = (eventId: string) => {
    router.push(routes.eventDashboard(eventId));
  };

  const getEventEmoji = (eventType: string) => {
    switch (eventType) {
      case "birthday": return "🎂";
      case "barMitzvah": return "📖";
      case "batMitzvah": return "📖";
      default: return "🎉";
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    switch (eventType) {
      case "birthday": return "Birthday";
      case "barMitzvah": return "Bar Mitzvah";
      case "batMitzvah": return "Bat Mitzvah";
      default: return "Event";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "#06D6A0";
      case "draft": return "#F59E0B";
      case "completed": return "#6B7280";
      case "cancelled": return "#EF4444";
      default: return "#6B7280";
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F0FFFE", paddingTop: insets.top }}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 24,
            backgroundColor: "#6B3AA0",
            borderBottomLeftRadius: 30,
            borderBottomRightRadius: 30,
          }}
        >
          <Text style={{ fontSize: 32, fontWeight: "900", color: "#FFFFFF", marginBottom: 4 }}>
            MY EVENTS 📅
          </Text>
          <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.9)", fontWeight: "600" }}>
            All your celebrations in one place
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#6B3AA0" />
          <Text style={{ marginTop: 16, fontSize: 16, color: "#6B7280" }}>Loading events...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F0FFFE", paddingTop: insets.top }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 24,
          backgroundColor: "#6B3AA0",
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ fontSize: 32, fontWeight: "900", color: "#FFFFFF", marginBottom: 4 }}>
              MY EVENTS 📅
            </Text>
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.9)", fontWeight: "600" }}>
              {events.length === 0
                ? "Create your first event"
                : `${events.length} event${events.length > 1 ? "s" : ""}`}
            </Text>
          </View>
          {events.length > 0 && (
            <TouchableOpacity
              onPress={() => router.push(routes.tabs.createEvent)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6B3AA0" />
        }
      >
        {events.length === 0 ? (
          // Empty State
          <View style={{ alignItems: "center", marginTop: 60 }}>
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
              No Events Yet!
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
              Create your first amazing event and start inviting people
            </Text>
            <TouchableOpacity
              onPress={() => router.push(routes.tabs.createEvent)}
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
                CREATE EVENT NOW 🚀
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {events.map((event) => (
              <TouchableOpacity
                key={event.id}
                onPress={() => handleEventPress(event.id)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 20,
                  padding: 16,
                  borderLeftWidth: 5,
                  borderLeftColor: getStatusColor(event.status),
                  shadowColor: "#000",
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 3,
                }}
              >
                {/* Header Row */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                      <Text style={{ fontSize: 24, marginRight: 8 }}>
                        {getEventEmoji(event.eventType)}
                      </Text>
                      <View
                        style={{
                          backgroundColor: getStatusColor(event.status) + "20",
                          borderRadius: 8,
                          paddingVertical: 2,
                          paddingHorizontal: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "700",
                            color: getStatusColor(event.status),
                            textTransform: "uppercase",
                          }}
                        >
                          {event.status}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "900",
                        color: "#1F2937",
                        marginBottom: 2,
                      }}
                    >
                      {event.eventName}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#6B7280",
                        fontWeight: "600",
                      }}
                    >
                      {getEventTypeLabel(event.eventType)}
                      {event.age && ` • Turning ${event.age}`}
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#D1D5DB" />
                </View>

                {/* Details Row */}
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 12,
                    marginBottom: 12,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: "#F3F4F6",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Calendar size={14} color="#6B7280" strokeWidth={2} />
                    <Text style={{ fontSize: 13, color: "#6B7280", marginLeft: 6, fontWeight: "600" }}>
                      {formatDate(event.date)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Users size={14} color="#6B7280" strokeWidth={2} />
                    <Text style={{ fontSize: 13, color: "#6B7280", marginLeft: 6, fontWeight: "600" }}>
                      {event.totalGuests} guest{event.totalGuests !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>

                {/* Location */}
                {event.address1 && (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <MapPin size={14} color="#9CA3AF" strokeWidth={2} />
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#9CA3AF",
                        marginLeft: 6,
                        fontWeight: "500",
                        flex: 1,
                      }}
                      numberOfLines={1}
                    >
                      {event.address1}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {/* Create More Events Button */}
            <TouchableOpacity
              onPress={() => router.push(routes.tabs.createEvent)}
              style={{
                backgroundColor: "#F3F4F6",
                borderRadius: 16,
                padding: 16,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                marginTop: 8,
                borderWidth: 2,
                borderStyle: "dashed",
                borderColor: "#D1D5DB",
              }}
            >
              <Plus size={20} color="#6B7280" strokeWidth={2.5} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#6B7280", marginLeft: 8 }}>
                Create Another Event
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
