import React from "react";
import { View, Text } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

interface TipCardProps {
    title: string;
    message: string;
    delay?: number;
}

export default function TipCard({ title, message, delay = 700 }: TipCardProps) {
    return (
        <Animated.View
            entering={FadeInDown.delay(delay).duration(400)}
            style={{
                marginHorizontal: 24,
                marginTop: 16,
                backgroundColor: "#FFFBEB",
                borderRadius: 16,
                padding: 16,
                borderLeftWidth: 4,
                borderLeftColor: "#F59E0B",
                flexDirection: "row",
                alignItems: "center",
            }}
        >
            <Text style={{ fontSize: 20, marginRight: 12 }}>💡</Text>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#92400E" }}>{title}</Text>
                <Text style={{ fontSize: 13, color: "#B45309", marginTop: 2 }}>
                    {message}
                </Text>
            </View>
        </Animated.View>
    );
}

