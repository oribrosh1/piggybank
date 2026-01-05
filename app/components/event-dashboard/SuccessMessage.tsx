import React from "react";
import { View, Text } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Check } from "lucide-react-native";

interface SuccessMessageProps {
    delay?: number;
}

export default function SuccessMessage({ delay = 100 }: SuccessMessageProps) {
    return (
        <Animated.View
            entering={FadeInDown.delay(delay).duration(400)}
            style={{
                marginHorizontal: 24,
                marginTop: -16,
                backgroundColor: "#ECFDF5",
                borderRadius: 16,
                padding: 16,
                borderLeftWidth: 4,
                borderLeftColor: "#10B981",
                flexDirection: "row",
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 4,
            }}
        >
            <View
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "#10B981",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                }}
            >
                <Check size={22} color="#FFFFFF" strokeWidth={3} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "800", color: "#065F46" }}>
                    You're all set! 🎉
                </Text>
                <Text style={{ fontSize: 13, color: "#047857", marginTop: 2 }}>
                    Event created successfully. Ready to invite guests!
                </Text>
            </View>
        </Animated.View>
    );
}

