import React from "react";
import { View, Text, Switch } from "react-native";
import { ShieldAlert } from "lucide-react-native";

type BlockedCategoriesCardProps = {
  blockedCategories: string[];
  onToggleCategory: (category: string, blocked: boolean) => void;
  updating: boolean;
};

const CATEGORY_DISPLAY: Record<string, { label: string; emoji: string }> = {
  drinking_places: { label: "Bars & Pubs", emoji: "🍺" },
  package_stores_beer_wine_and_liquor: { label: "Liquor Stores", emoji: "🍷" },
  cigar_stores_and_stands: { label: "Tobacco", emoji: "🚬" },
  betting_casino_gambling: { label: "Gambling", emoji: "🎰" },
  government_licensed_online_casions_online_gambling_us_region_only: {
    label: "Online Gambling",
    emoji: "🎲",
  },
  government_licensed_horse_dog_racing_us_region_only: {
    label: "Horse & Dog Racing",
    emoji: "🏇",
  },
  dating_escort_services: { label: "Dating Services", emoji: "💔" },
  wires_money_orders: { label: "Wire Transfers", emoji: "💸" },
  pawn_shops: { label: "Pawn Shops", emoji: "🏪" },
  fast_food_restaurants: { label: "Fast Food", emoji: "🍔" },
  video_game_arcades: { label: "Video Game Arcades", emoji: "🎮" },
  digital_goods_media: { label: "Digital Goods", emoji: "📱" },
};

const ALL_RESTRICTABLE = Object.keys(CATEGORY_DISPLAY);

export default function BlockedCategoriesCard({
  blockedCategories,
  onToggleCategory,
  updating,
}: BlockedCategoriesCardProps) {
  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: "#FEE2E2",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ShieldAlert size={16} color="#EF4444" strokeWidth={2.5} />
        </View>
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#1F2937" }}>
          Blocked Categories
        </Text>
      </View>

      {ALL_RESTRICTABLE.map((cat) => {
        const display = CATEGORY_DISPLAY[cat];
        const isBlocked = blockedCategories.includes(cat);
        return (
          <View
            key={cat}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 10,
              borderTopWidth: 1,
              borderTopColor: "#F3F4F6",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 18 }}>{display.emoji}</Text>
              <Text
                style={{ fontSize: 14, color: "#374151", fontWeight: "500" }}
              >
                {display.label}
              </Text>
            </View>
            <Switch
              value={isBlocked}
              onValueChange={(val) => onToggleCategory(cat, val)}
              disabled={updating}
              trackColor={{ false: "#D1D5DB", true: "#EF4444" }}
              thumbColor="#FFFFFF"
            />
          </View>
        );
      })}
    </View>
  );
}
