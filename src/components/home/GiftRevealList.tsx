import { View, Text, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

interface GiftEntry {
  id: string;
  guestName: string;
  amount: number;
  blessing?: string;
}

interface Props {
  gifts: GiftEntry[];
  totalGifts: number;
  onSeeAll: () => void;
}

export default function GiftRevealList({
  gifts,
  totalGifts,
  onSeeAll,
}: Props) {
  return (
    <View style={{ marginBottom: 24 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#1F2937" }}>
          All Gifts ({totalGifts})
        </Text>
        <TouchableOpacity onPress={onSeeAll}>
          <Text
            style={{ fontSize: 13, fontWeight: "600", color: "#7C3AED" }}
          >
            SEE ALL
          </Text>
        </TouchableOpacity>
      </View>

      {gifts.length === 0 && (
        <View
          style={{
            backgroundColor: "#FFF",
            borderRadius: 14,
            padding: 20,
            alignItems: "center",
          }}
        >
          <Ionicons
            name="gift-outline"
            size={32}
            color="#D1D5DB"
            style={{ marginBottom: 8 }}
          />
          <Text style={{ fontSize: 14, color: "#9CA3AF" }}>
            No gifts received yet
          </Text>
        </View>
      )}

      {gifts.map((gift) => (
        <View
          key={gift.id}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#FFF",
            borderRadius: 14,
            padding: 14,
            marginBottom: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.03,
            shadowRadius: 4,
            elevation: 1,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#EDE9FE",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Ionicons name="gift" size={18} color="#7C3AED" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: "#1F2937",
              }}
            >
              {gift.guestName}
            </Text>
            {gift.blessing && (
              <Text
                style={{ fontSize: 12, color: "#9CA3AF" }}
                numberOfLines={1}
              >
                "{gift.blessing}"
              </Text>
            )}
          </View>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: "#10B981",
            }}
          >
            +${(gift.amount / 100).toFixed(0)}
          </Text>
        </View>
      ))}
    </View>
  );
}
