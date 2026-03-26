import { View, Text, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

interface Props {
  childName: string;
  onManageCard: () => void;
  onViewGifts: () => void;
}

export default function QuickActionsChildActive({
  childName,
  onManageCard,
  onViewGifts,
}: Props) {
  return (
    <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
      <TouchableOpacity
        onPress={onManageCard}
        activeOpacity={0.85}
        style={{
          flex: 1,
          backgroundColor: "#7C3AED",
          borderRadius: 16,
          padding: 16,
          shadowColor: "#7C3AED",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 3,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: "rgba(255,255,255,0.2)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10,
          }}
        >
          <Ionicons name="person" size={20} color="#FFF" />
        </View>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: "#FFF",
            lineHeight: 18,
          }}
        >
          Link {childName}'s{"\n"}Account
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onViewGifts}
        activeOpacity={0.85}
        style={{
          flex: 1,
          backgroundColor: "#FFC107",
          borderRadius: 16,
          padding: 16,
          shadowColor: "#FFC107",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 3,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: "rgba(0,0,0,0.08)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10,
          }}
        >
          <Ionicons name="gift" size={20} color="#1F2937" />
        </View>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: "#1F2937",
            lineHeight: 18,
          }}
        >
          View All{"\n"}Gifts
        </Text>
      </TouchableOpacity>
    </View>
  );
}
