import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ChevronRight, Gift, Star } from "lucide-react-native";
import { routes } from "@/types/routes";
import CreateEventTopBar from "@/src/components/create-event/CreateEventTopBar";

const BG = "#F4FAF5";
const PURPLE = "#8A63E5";
const ORANGE = "#FFB72B";

type EventOption = {
  id: string;
  title: string;
  description: string;
  tags: [string, string];
  iconBg: string;
  Icon: typeof Gift;
  iconColor: string;
};

const OPTIONS: EventOption[] = [
  {
    id: "birthday",
    title: "Birthday",
    description: "Celebrate another year with cake, games, and a party tailored to your child.",
    tags: ["PARTY GAMES", "CAKE DESIGN"],
    iconBg: "#8A63E5",
    Icon: Gift,
    iconColor: "#FFFFFF",
  },
  {
    id: "barMitzvah",
    title: "Bar Mitzvah",
    description: "Mark the milestone with ceremony details, tradition, and a meaningful celebration.",
    tags: ["TRADITION", "MILESTONE"],
    iconBg: "#14B8A6",
    Icon: Star,
    iconColor: "#FFFFFF",
  },
  {
    id: "batMitzvah",
    title: "Bat Mitzvah",
    description: "Honor her journey with community, joy, and a celebration to remember.",
    tags: ["HONOR", "COMMUNITY"],
    iconBg: "#FBBF24",
    Icon: Star,
    iconColor: "#FFFFFF",
  },
];

function EventTypeCard({
  option,
  selected,
  onSelect,
}: {
  option: EventOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const { Icon } = option;
  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.88}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 28,
        padding: 20,
        marginBottom: 14,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? PURPLE : "#E5E7EB",
        shadowColor: "#000",
        shadowOpacity: selected ? 0.08 : 0.04,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: selected ? 4 : 2,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 14 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: option.iconBg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={28} color={option.iconColor} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 6 }}>{option.title}</Text>
          <Text style={{ fontSize: 13, color: "#6B7280", lineHeight: 20, fontWeight: "500" }}>{option.description}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
            {option.tags.map((tag) => (
              <View
                key={tag}
                style={{
                  backgroundColor: "#EEF2FF",
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 20,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: "800", color: "#4C1D95", letterSpacing: 0.6 }}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function EventTypeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleContinue = () => {
    if (selectedType) {
      router.push({
        pathname: routes.createEvent.eventDetails,
        params: { eventType: selectedType },
      });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <CreateEventTopBar onBack={() => router.back()} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 24,
          paddingTop: 8,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontSize: 11, fontWeight: "800", color: PURPLE, letterSpacing: 1.2, marginBottom: 8 }}>STEP 1 OF 3</Text>
        <Text style={{ fontSize: 28, fontWeight: "800", color: "#111827", marginBottom: 6, letterSpacing: -0.5 }}>Pick your event type</Text>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#374151", marginBottom: 22 }}>What are we celebrating?</Text>

        {OPTIONS.map((opt) => (
          <EventTypeCard key={opt.id} option={opt} selected={selectedType === opt.id} onSelect={() => setSelectedType(opt.id)} />
        ))}
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 16,
          paddingTop: 8,
          backgroundColor: BG,
          borderTopWidth: 1,
          borderTopColor: "rgba(0,0,0,0.04)",
        }}
      >
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!selectedType}
          activeOpacity={0.9}
          style={{
            backgroundColor: selectedType ? ORANGE : "#D1D5DB",
            borderRadius: 18,
            paddingVertical: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: selectedType ? 1 : 0.65,
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: "800", color: "#111827" }}>Continue</Text>
          <ChevronRight size={20} color="#111827" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={{ fontSize: 12, color: "#9CA3AF", textAlign: "center", marginTop: 12, fontWeight: "500" }}>
          You can change this later in settings
        </Text>
      </View>
    </View>
  );
}
