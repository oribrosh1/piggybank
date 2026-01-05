import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MessageSquare } from "lucide-react-native";

interface BottomActionButtonProps {
    bottomInset: number;
    onPress?: () => void;
    label?: string;
}

export default function BottomActionButton({ 
    bottomInset, 
    onPress,
    label = "Send Invites via SMS",
}: BottomActionButtonProps) {
    return (
        <View
            style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                paddingHorizontal: 24,
                paddingTop: 16,
                paddingBottom: bottomInset + 16,
                backgroundColor: "#FFFFFF",
                borderTopWidth: 1,
                borderTopColor: "#E5E7EB",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -6 },
                shadowOpacity: 0.1,
                shadowRadius: 16,
                elevation: 12,
            }}
        >
            <TouchableOpacity
                onPress={onPress}
                style={{
                    backgroundColor: "#8B5CF6",
                    borderRadius: 18,
                    paddingVertical: 18,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    shadowColor: "#8B5CF6",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.35,
                    shadowRadius: 16,
                    elevation: 8,
                }}
            >
                <MessageSquare size={20} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={{ fontSize: 17, fontWeight: "800", color: "#FFFFFF", marginLeft: 10 }}>
                    {label}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

