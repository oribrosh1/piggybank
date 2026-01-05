import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SectionList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Check, X, Clock, MapPin, Users } from "lucide-react-native";

export default function EventDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  // Mock event data
  const event = {
    id: "1",
    name: "Sarah's Bat Mitzvah",
    type: "barMitzvah",
    date: "06/15/2024",
    time: "6:00 PM",
    location: "Downtown Banquet Hall",
    address: "123 Main Street",
    city: "New York",
    totalGuests: 9,
  };

  // Mock guests with responses
  const guests = [
    {
      id: "1",
      name: "John Smith",
      phone: "+1-555-0101",
      status: "accepted",
      role: "👨 Father",
    },
    {
      id: "2",
      name: "Sarah Johnson",
      phone: "+1-555-0102",
      status: "accepted",
      role: null,
    },
    {
      id: "3",
      name: "Michael Brown",
      phone: "+1-555-0103",
      status: "declined",
      role: null,
    },
    {
      id: "4",
      name: "Emily Davis",
      phone: "+1-555-0104",
      status: "pending",
      role: null,
    },
    {
      id: "5",
      name: "David Wilson",
      phone: "+1-555-0105",
      status: "pending",
      role: null,
    },
    {
      id: "6",
      name: "Lisa Anderson",
      phone: "+1-555-0106",
      status: "accepted",
      role: null,
    },
    {
      id: "7",
      name: "James Taylor",
      phone: "+1-555-0107",
      status: "declined",
      role: null,
    },
    {
      id: "8",
      name: "Maria Rodriguez",
      phone: "+1-555-0108",
      status: "accepted",
      role: null,
    },
    {
      id: "9",
      name: "Robert Martinez",
      phone: "+1-555-0109",
      status: "pending",
      role: null,
    },
  ];

  const acceptedGuests = guests.filter((g) => g.status === "accepted");
  const pendingGuests = guests.filter((g) => g.status === "pending");
  const declinedGuests = guests.filter((g) => g.status === "declined");

  const sections = [
    {
      title: `✅ ACCEPTED (${acceptedGuests.length})`,
      data: acceptedGuests,
      bgColor: "#D1FAE5",
      statusColor: "#10B981",
    },
    {
      title: `⏳ PENDING (${pendingGuests.length})`,
      data: pendingGuests,
      bgColor: "#FEF3C7",
      statusColor: "#F59E0B",
    },
    {
      title: `❌ DECLINED (${declinedGuests.length})`,
      data: declinedGuests,
      bgColor: "#FEE2E2",
      statusColor: "#EF4444",
    },
  ];

  const GuestRow = ({ guest, statusColor }: { guest: { id: string, name: string, phone: string, status: string, role: string | null }, statusColor: string }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: statusColor,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          backgroundColor: statusColor,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {guest.status === "accepted" && <Check size={18} color="#FFFFFF" />}
        {guest.status === "declined" && <X size={18} color="#FFFFFF" />}
        {guest.status === "pending" && <Clock size={18} color="#FFFFFF" />}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            color: "#000000",
            marginBottom: 2,
          }}
        >
          {guest.name}
        </Text>
        <Text style={{ fontSize: 10, color: "#6B7280" }}>{guest.phone}</Text>
        {guest.role && (
          <Text
            style={{
              fontSize: 9,
              color: statusColor,
              fontWeight: "700",
              marginTop: 3,
            }}
          >
            {guest.role}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <View
      style={{ flex: 1, backgroundColor: "#F0FFTE", paddingTop: insets.top }}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 16,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#06D6A0",
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "800",
            color: "#FFFFFF",
            marginLeft: 12,
          }}
        >
          EVENT DETAILS
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Event Info Card */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <Text style={{ fontSize: 28, marginRight: 10 }}>
                {event.type === "barMitzvah" ? "🕎" : "🎂"}
              </Text>
              <View>
                <Text
                  style={{ fontSize: 18, fontWeight: "800", color: "#000000" }}
                >
                  {event.name}
                </Text>
              </View>
            </View>

            <View style={{ gap: 10 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Clock size={16} color="#06D6A0" />
                <Text
                  style={{ fontSize: 12, color: "#6B7280", fontWeight: "600" }}
                >
                  {event.date} • {event.time}
                </Text>
              </View>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <MapPin size={16} color="#06D6A0" />
                <View>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#6B7280",
                      fontWeight: "600",
                    }}
                  >
                    {event.location}
                  </Text>
                  <Text style={{ fontSize: 11, color: "#9CA3AF" }}>
                    {event.address}, {event.city}
                  </Text>
                </View>
              </View>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Users size={16} color="#06D6A0" />
                <Text
                  style={{ fontSize: 12, color: "#6B7280", fontWeight: "600" }}
                >
                  {event.totalGuests} guests invited
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Guest Lists */}
        <View
          style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 20 }}
        >
          {sections.map((section, index) => (
            <View key={index} style={{ marginBottom: 24 }}>
              <View
                style={{
                  backgroundColor: section.bgColor,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "800",
                    color: section.statusColor,
                  }}
                >
                  {section.title}
                </Text>
              </View>

              {section.data.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 20 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#9CA3AF",
                      fontWeight: "600",
                    }}
                  >
                    No one yet
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {section.data.map((guest) => (
                    <GuestRow
                      key={guest.id}
                      guest={guest}
                      statusColor={section.statusColor}
                    />
                  ))}
                </View>
              )}
            </View>
          ))}

          {/* Summary Card */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 14,
              padding: 14,
              marginBottom: 20,
              borderLeftWidth: 4,
              borderLeftColor: "#06D6A0",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: "#6B7280",
                marginBottom: 10,
              }}
            >
              SUMMARY
            </Text>
            <View style={{ gap: 8 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      backgroundColor: "#10B981",
                      borderRadius: 4,
                    }}
                  />
                  <Text style={{ fontSize: 11, color: "#6B7280" }}>Coming</Text>
                </View>
                <Text
                  style={{ fontSize: 12, fontWeight: "700", color: "#10B981" }}
                >
                  {acceptedGuests.length}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      backgroundColor: "#F59E0B",
                      borderRadius: 4,
                    }}
                  />
                  <Text style={{ fontSize: 11, color: "#6B7280" }}>
                    Pending
                  </Text>
                </View>
                <Text
                  style={{ fontSize: 12, fontWeight: "700", color: "#F59E0B" }}
                >
                  {pendingGuests.length}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      backgroundColor: "#EF4444",
                      borderRadius: 4,
                    }}
                  />
                  <Text style={{ fontSize: 11, color: "#6B7280" }}>
                    Declined
                  </Text>
                </View>
                <Text
                  style={{ fontSize: 12, fontWeight: "700", color: "#EF4444" }}
                >
                  {declinedGuests.length}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
