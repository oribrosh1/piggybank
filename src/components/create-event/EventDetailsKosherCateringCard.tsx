import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { Star, Check } from "lucide-react-native";
import type { KosherCateringPartnerChoice, KosherCateringPartnerId } from "@/types/events";
import { colors } from "@/src/theme";

const SELECTED_TINT = "rgba(107, 56, 212, 0.12)";

function SelectedCheckBadge() {
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: colors.surfaceContainerLowest,
        shadowColor: colors.onSurface,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
      }}
    >
      <Check size={15} color={colors.onPrimary} strokeWidth={3} />
    </View>
  );
}

const PARTNERS: {
  id: KosherCateringPartnerId;
  name: string;
  badge: string;
  rating: string;
  category: string;
  imageUri: string;
}[] = [
  {
    id: "glatt-bistro",
    name: "The Glatt Bistro",
    badge: "15% OFF",
    rating: "4.9",
    category: "Modern French",
    imageUri: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=640&q=80",
  },
  {
    id: "sky-high",
    name: "Sky High Kosher",
    badge: "FREE TASTING",
    rating: "4.7",
    category: "Fusion",
    imageUri: "https://images.unsplash.com/photo-1550966873-a0eb27baa1dc?w=640&q=80",
  },
  {
    id: "heritage-kitchen",
    name: "Heritage Kitchen",
    badge: "NEW",
    rating: "4.8",
    category: "Mediterranean",
    imageUri: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=640&q=80",
  },
];

type EventDetailsKosherCateringCardProps = {
  selected: KosherCateringPartnerChoice | undefined;
  onSelect: (value: KosherCateringPartnerChoice) => void;
};

export default function EventDetailsKosherCateringCard({ selected, onSelect }: EventDetailsKosherCateringCardProps) {
  const active: KosherCateringPartnerChoice = selected ?? "later";
  const laterSelected = active === "later";

  return (
    <View
      style={{
        marginBottom: 24,
        backgroundColor: colors.surfaceContainerLow,
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: colors.outlineVariant,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ fontSize: 17, fontWeight: "800", color: colors.onSurface, lineHeight: 22 }}>
            Keep it Kosher
          </Text>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.primary, marginTop: 5, lineHeight: 18 }}>
            Get discount code for Kosher catering
          </Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary }}>View All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 2 }}>
        {PARTNERS.map((item) => {
          const sel = active === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel={`Save ${item.name} order discount barcode for this event`}
              onPress={() => onSelect(item.id)}
              style={{
                width: 200,
                borderRadius: 18,
                overflow: "hidden",
                backgroundColor: colors.surfaceContainerLowest,
                borderWidth: 2,
                borderColor: sel ? colors.primary : colors.outlineVariant,
              }}
            >
              <View style={{ height: 108, position: "relative" }}>
                <Image source={{ uri: item.imageUri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                <View
                  style={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    backgroundColor: colors.secondary,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 20,
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: "800", color: colors.onPrimary, letterSpacing: 0.3 }}>{item.badge}</Text>
                </View>
                {sel ? (
                  <View style={{ position: "absolute", top: 8, right: 8 }}>
                    <SelectedCheckBadge />
                  </View>
                ) : null}
              </View>
              <View style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
                <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: "800", color: colors.onSurface }}>
                  {item.name}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6, gap: 6 }}>
                  <Star size={14} color="#C9A227" fill="#C9A227" />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.onSurface }}>{item.rating}</Text>
                  <Text style={{ fontSize: 13, color: colors.muted }}>·</Text>
                  <Text numberOfLines={1} style={{ flex: 1, fontSize: 13, fontWeight: "600", color: colors.onSurfaceVariant }}>
                    {item.category}
                  </Text>
                </View>
                <Text style={{ fontSize: 10, fontWeight: "700", color: colors.primary, marginTop: 8, lineHeight: 14 }}>
                  {sel ? "Barcode saved for orders at this spot" : "Tap to save their order barcode"}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        onPress={() => onSelect("later")}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel="Skip saving a restaurant order barcode for now; create poster first"
        style={{
          marginTop: 14,
          borderRadius: 14,
          padding: 14,
          paddingRight: laterSelected ? 48 : 14,
          borderWidth: 2,
          borderColor: laterSelected ? colors.primary : "#D1D5DB",
          backgroundColor: laterSelected ? SELECTED_TINT : colors.surfaceContainerLowest,
          position: "relative",
        }}
      >
        {laterSelected ? (
          <View style={{ position: "absolute", top: 12, right: 12 }}>
            <SelectedCheckBadge />
          </View>
        ) : null}
        <Text style={{ fontSize: 13, fontWeight: "800", color: colors.primary }}>No barcode yet — poster first</Text>
        <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 4, lineHeight: 18 }}>
          Don't save a partner dining barcode on this step. Your poster and invites still work; add a restaurant barcode later in Edit event when you know where you'll order.
        </Text>
      </TouchableOpacity>
    </View>
  );
}
