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
                marginTop: -12,
                backgroundColor: "#ECFDF5",
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderLeftWidth: 3,
                borderLeftColor: "#10B981",
                flexDirection: "row",
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 2,
            }}
        >
            <View
                style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "#10B981",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                }}
            >
                <Check size={16} color="#FFFFFF" strokeWidth={3} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#065F46" }}>
                    You're all set! 🎉
                </Text>
                <Text style={{ fontSize: 12, color: "#047857", marginTop: 1 }}>
                    Event created. Ready to invite guests!
                </Text>
            </View>
        </Animated.View>
    );
}

