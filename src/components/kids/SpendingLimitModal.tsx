import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { X, Trash2 } from "lucide-react-native";

type SpendingLimitModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (limits: {
    daily?: number;
    weekly?: number;
    monthly?: number;
    perTransaction?: number;
  }) => void;
  saving: boolean;
  currentLimits: Array<{ amount: number; interval: string }>;
};

type LimitField = {
  key: "daily" | "weekly" | "monthly" | "perTransaction";
  label: string;
  interval: string;
};

const FIELDS: LimitField[] = [
  { key: "perTransaction", label: "Per Transaction", interval: "per_authorization" },
  { key: "daily", label: "Daily Limit", interval: "daily" },
  { key: "weekly", label: "Weekly Limit", interval: "weekly" },
  { key: "monthly", label: "Monthly Limit", interval: "monthly" },
];

export default function SpendingLimitModal({
  visible,
  onClose,
  onSave,
  saving,
  currentLimits,
}: SpendingLimitModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      const init: Record<string, string> = {};
      for (const f of FIELDS) {
        const existing = currentLimits.find((l) => l.interval === f.interval);
        init[f.key] = existing ? (existing.amount / 100).toFixed(0) : "";
      }
      setValues(init);
    }
  }, [visible, currentLimits]);

  const NO_LIMIT_CENTS = 99999900;

  function handleSave() {
    const limits: Record<string, number> = {};
    let hasAnyValue = false;
    for (const f of FIELDS) {
      const val = values[f.key];
      if (val && Number(val) > 0) {
        limits[f.key] = Math.round(Number(val) * 100);
        hasAnyValue = true;
      }
    }
    if (!hasAnyValue) return;
    onSave(limits as any);
  }

  function handleClearAll() {
    const cleared: Record<string, number> = {};
    for (const f of FIELDS) {
      cleared[f.key] = NO_LIMIT_CENTS;
    }
    onSave(cleared as any);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, justifyContent: "flex-end" }}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: Platform.OS === "ios" ? 40 : 24,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text
              style={{ fontSize: 18, fontWeight: "800", color: "#1F2937" }}
            >
              Set Spending Limits
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {FIELDS.map((f) => (
              <View key={f.key} style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#6B7280",
                    marginBottom: 6,
                  }}
                >
                  {f.label}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#F9FAFB",
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    paddingHorizontal: 14,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: "#6B7280",
                      fontWeight: "600",
                      marginRight: 4,
                    }}
                  >
                    $
                  </Text>
                  <TextInput
                    style={{
                      flex: 1,
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#1F2937",
                      paddingVertical: 12,
                    }}
                    value={values[f.key] || ""}
                    onChangeText={(t) =>
                      setValues((prev) => ({
                        ...prev,
                        [f.key]: t.replace(/[^0-9.]/g, ""),
                      }))
                    }
                    placeholder="No limit"
                    placeholderTextColor="#D1D5DB"
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                  />
                </View>
              </View>
            ))}
          </ScrollView>

          {currentLimits.length > 0 && (
            <TouchableOpacity
              onPress={handleClearAll}
              disabled={saving}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 12,
                marginTop: 4,
              }}
            >
              <Trash2 size={16} color="#EF4444" strokeWidth={2} />
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: "#EF4444" }}
              >
                Clear All Limits
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={{
              backgroundColor: "#6B3AA0",
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: "center",
              marginTop: 8,
            }}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}
              >
                Save Limits
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
