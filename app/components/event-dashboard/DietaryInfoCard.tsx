import React from "react";
import { View, Text } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Utensils } from "lucide-react-native";
import { Event } from "../../../types/events";
import { getKosherLabel, getMealTypeLabel, getVegetarianLabel } from "./utils";

interface DietaryInfoCardProps {
    event: Event;
    delay?: number;
}

export default function DietaryInfoCard({ event, delay = 500 }: DietaryInfoCardProps) {
    // Don't render if no dietary info
    if (!event.kosherType && !event.vegetarianType) {
        return null;
    }

    return (
        <Animated.View
            entering={FadeInDown.delay(delay).duration(400)}
            style={{
                marginHorizontal: 24,
                marginTop: 16,
                backgroundColor: "#FFFFFF",
                borderRadius: 20,
                padding: 20,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
                elevation: 3,
            }}
        >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <Utensils size={20} color="#10B981" strokeWidth={2} />
                <Text style={{ fontSize: 18, fontWeight: "800", color: "#111827", marginLeft: 10 }}>
                    Dietary Info
                </Text>
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {getKosherLabel(event.kosherType) && (
                    <View style={{ backgroundColor: "#FEF3C7", borderRadius: 12, paddingVertical: 8, paddingHorizontal: 14 }}>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: "#92400E" }}>
                            {getKosherLabel(event.kosherType)}
                        </Text>
                    </View>
                )}
                {getMealTypeLabel(event.mealType) && (
                    <View style={{ backgroundColor: "#D1FAE5", borderRadius: 12, paddingVertical: 8, paddingHorizontal: 14 }}>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: "#065F46" }}>
                            {getMealTypeLabel(event.mealType)}
                        </Text>
                    </View>
                )}
                {getVegetarianLabel(event.vegetarianType) && (
                    <View style={{ backgroundColor: "#ECFDF5", borderRadius: 12, paddingVertical: 8, paddingHorizontal: 14 }}>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: "#047857" }}>
                            {getVegetarianLabel(event.vegetarianType)}
                        </Text>
                    </View>
                )}
            </View>
        </Animated.View>
    );
}

