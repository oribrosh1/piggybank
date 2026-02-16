import React from "react";
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Check } from "lucide-react-native";
import type { StepConfig } from "@/src/screens/HomeScreen/useHomeScreen";

interface StepCardProps {
  config: StepConfig;
  currentStep?: number;
}

export default function StepCard({ config, currentStep }: StepCardProps) {
  const isCompleted = currentStep ? config.step <= currentStep : false;
  const isCurrent = currentStep ? config.step === currentStep + 1 : config.step === 1;

  return (
    <View key={String(config.step)}>
      {config.step > 1 && (
        <View style={{ alignItems: "center", height: 32 }}>
          <View
            style={{
              width: 4,
              flex: 1,
              backgroundColor: isCompleted || isCurrent ? config.gradientColors[0] : "#E5E7EB",
              borderRadius: 2,
            }}
          />
        </View>
      )}
      <View
        style={{
          borderRadius: 24,
          overflow: "hidden",
          borderWidth: 2,
          borderColor: config.gradientColors[0],
          shadowColor: config.gradientColors[0],
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.25,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        <View style={{ backgroundColor: "#FFFFFF" }}>
          <LinearGradient
            colors={isCompleted ? ["#6B7280", "#6B7280"] : config.gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 16, paddingHorizontal: 20, flexDirection: "row", alignItems: "center" }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(255,255,255,0.25)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
              }}
            >
              {isCompleted ? (
                <Check size={24} color="#FFFFFF" strokeWidth={3} />
              ) : (
                <Text style={{ fontSize: 20, fontWeight: "900", color: "#FFFFFF" }}>{config.step}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.8)", letterSpacing: 1, marginBottom: 2 }}>
                {config.subtitle.toUpperCase()}
              </Text>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#FFFFFF" }}>{config.title}</Text>
            </View>
            <Text style={{ fontSize: 32 }}>{config.emoji}</Text>
          </LinearGradient>
          <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 15, color: isCompleted ? "#9CA3AF" : "#4B5563", fontWeight: "500", lineHeight: 22, marginBottom: 14 }}>
              {config.description}
            </Text>
            <View style={{ gap: 8, marginBottom: 16 }}>
              {config.features.map((feature, index) => {
                const emoji = feature.split(" ")[0];
                const text = feature.split(" ").slice(1).join(" ");
                return (
                  <View
                    key={index}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: isCompleted ? "#F9FAFB" : config.lightColor,
                      borderRadius: 12,
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      borderLeftWidth: 3,
                      borderLeftColor: isCompleted ? "#D1D5DB" : config.gradientColors[0],
                    }}
                  >
                    <Text style={{ fontSize: 18, marginRight: 10 }}>{emoji}</Text>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: isCompleted ? "#9CA3AF" : "#374151", flex: 1 }}>{text}</Text>
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: isCompleted ? "#D1D5DB" : config.gradientColors[0],
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ fontSize: 10, color: "#FFFFFF" }}>✓</Text>
                    </View>
                  </View>
                );
              })}
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              {isCurrent ? (
                <LinearGradient
                  colors={config.gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, flexDirection: "row", alignItems: "center" }}
                >
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF", marginRight: 8 }} />
                  <Text style={{ fontSize: 12, fontWeight: "800", color: "#FFFFFF" }}>YOUR NEXT STEP</Text>
                </LinearGradient>
              ) : isCompleted ? (
                <View style={{ backgroundColor: "#D1FAE5", borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, flexDirection: "row", alignItems: "center" }}>
                  <Check size={14} color="#059669" strokeWidth={3} style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 12, fontWeight: "800", color: "#059669" }}>COMPLETED</Text>
                </View>
              ) : (
                <View style={{ backgroundColor: "#F3F4F6", borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#9CA3AF" }}>UPCOMING</Text>
                </View>
              )}
              <View style={{ flexDirection: "row", gap: 6 }}>
                {[1, 2, 3, 4].map((dot) => (
                  <View
                    key={dot}
                    style={{
                      width: dot === config.step ? 20 : 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: dot < config.step ? "#10B981" : dot === config.step ? config.gradientColors[0] : "#E5E7EB",
                    }}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
