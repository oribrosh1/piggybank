import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Switch,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, ChevronDown, Clock, Plus } from "lucide-react-native";

const MAX_SLOTS = 5;

const DAY_OPTIONS = [
  "3 Days Before",
  "1 Day Before",
  "7 Days Before",
  "2 Days Before",
  "Event Morning",
  "Day of event",
];

const TIME_OPTIONS = [
  "06:00 AM",
  "09:00 AM",
  "10:00 AM",
  "02:00 PM",
  "06:00 PM",
  "08:00 PM",
];

export type ReminderSlot = {
  id: string;
  enabled: boolean;
  dayLabel: string;
  timeLabel: string;
};

export interface ReminderScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  /** Persisted slots from parent (optional) */
  initialSlots?: ReminderSlot[];
  onSave?: (slots: ReminderSlot[]) => void;
}

function createSlot(
  partial: Partial<ReminderSlot> & Pick<ReminderSlot, "id">
): ReminderSlot {
  return {
    enabled: true,
    dayLabel: "3 Days Before",
    timeLabel: "10:00 AM",
    ...partial,
  };
}

const defaultSlots: ReminderSlot[] = [
  createSlot({
    id: "1",
    enabled: true,
    dayLabel: "3 Days Before",
    timeLabel: "10:00 AM",
  }),
  createSlot({
    id: "2",
    enabled: true,
    dayLabel: "1 Day Before",
    timeLabel: "02:00 PM",
  }),
  createSlot({
    id: "3",
    enabled: false,
    dayLabel: "Event Morning",
    timeLabel: "09:00 AM",
  }),
];

export default function ReminderScheduleModal({
  visible,
  onClose,
  initialSlots,
  onSave,
}: ReminderScheduleModalProps) {
  const insets = useSafeAreaInsets();
  const { height: windowH } = useWindowDimensions();
  const [slots, setSlots] = useState<ReminderSlot[]>(initialSlots ?? defaultSlots);

  useEffect(() => {
    if (visible) {
      setSlots(initialSlots ?? defaultSlots);
    }
  }, [visible, initialSlots]);

  const cycleDay = useCallback((index: number) => {
    setSlots((prev) => {
      const row = prev[index];
      if (!row?.enabled) return prev;
      const i = DAY_OPTIONS.indexOf(row.dayLabel);
      const next = DAY_OPTIONS[(i + 1) % DAY_OPTIONS.length];
      return prev.map((s, j) => (j === index ? { ...s, dayLabel: next } : s));
    });
  }, []);

  const cycleTime = useCallback((index: number) => {
    setSlots((prev) => {
      const row = prev[index];
      if (!row?.enabled) return prev;
      const i = TIME_OPTIONS.indexOf(row.timeLabel);
      const next = TIME_OPTIONS[(i + 1) % TIME_OPTIONS.length];
      return prev.map((s, j) => (j === index ? { ...s, timeLabel: next } : s));
    });
  }, []);

  const toggleRow = useCallback((index: number) => {
    setSlots((prev) =>
      prev.map((s, i) => (i === index ? { ...s, enabled: !s.enabled } : s))
    );
  }, []);

  const addSlot = useCallback(() => {
    setSlots((prev) => {
      if (prev.length >= MAX_SLOTS) return prev;
      const id = `slot-${Date.now()}`;
      return [
        ...prev,
        createSlot({
          id,
          enabled: true,
          dayLabel: "7 Days Before",
          timeLabel: "06:00 PM",
        }),
      ];
    });
  }, []);

  const handleDiscard = () => {
    setSlots(initialSlots ?? defaultSlots);
    onClose();
  };

  const handleSave = () => {
    onSave?.(slots);
    onClose();
  };

  const activeCount = slots.filter((s) => s.enabled).length;
  const remaining = MAX_SLOTS - slots.length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(15, 23, 42, 0.45)",
          justifyContent: "center",
          paddingHorizontal: 18,
          paddingVertical: insets.top + 12,
        }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            maxHeight: windowH * 0.88,
            backgroundColor: "#FFFFFF",
            borderRadius: 24,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.2,
            shadowRadius: 24,
            elevation: 12,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 12,
            }}
          >
            <Text
              style={{
                flex: 1,
                fontSize: 20,
                fontWeight: "900",
                color: "#111827",
                paddingRight: 12,
              }}
            >
              SMS Reminder Schedule
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "#F3F4F6",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} color="#374151" strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: "#4B5563",
              lineHeight: 21,
              paddingHorizontal: 20,
              marginBottom: 18,
            }}
          >
            {`Automate your follow-ups and never miss a prep milestone. Pick up to ${MAX_SLOTS} separate times to automatically nudge guests who haven't responded yet.`}
          </Text>

          <ScrollView
            style={{ maxHeight: windowH * 0.48 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {slots.map((row, index) => (
              <View
                key={row.id}
                style={{
                  marginBottom: 14,
                  padding: 14,
                  borderRadius: 16,
                  backgroundColor: row.enabled ? "#EFF6FF" : "#FAFAFA",
                  borderWidth: row.enabled ? 1.5 : 1,
                  borderStyle: row.enabled ? "solid" : "dashed",
                  borderColor: row.enabled ? "#BFDBFE" : "#E5E7EB",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: "800",
                        color: "#9CA3AF",
                        letterSpacing: 0.6,
                        marginBottom: 6,
                      }}
                    >
                      DAYS BEFORE
                    </Text>
                    <TouchableOpacity
                      onPress={() => cycleDay(index)}
                      disabled={!row.enabled}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        backgroundColor: row.enabled ? "#DBEAFE" : "#F3F4F6",
                        borderRadius: 10,
                        paddingVertical: 12,
                        paddingHorizontal: 10,
                        borderWidth: 1,
                        borderColor: row.enabled ? "#93C5FD" : "#E5E7EB",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "700",
                          color: row.enabled ? "#1E3A8A" : "#9CA3AF",
                          flex: 1,
                        }}
                        numberOfLines={1}
                      >
                        {row.dayLabel}
                      </Text>
                      <ChevronDown size={16} color="#7C3AED" strokeWidth={2.2} />
                    </TouchableOpacity>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: "800",
                        color: "#9CA3AF",
                        letterSpacing: 0.6,
                        marginBottom: 6,
                      }}
                    >
                      TIME
                    </Text>
                    <TouchableOpacity
                      onPress={() => cycleTime(index)}
                      disabled={!row.enabled}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        backgroundColor: row.enabled ? "#DBEAFE" : "#F3F4F6",
                        borderRadius: 10,
                        paddingVertical: 12,
                        paddingHorizontal: 10,
                        borderWidth: 1,
                        borderColor: row.enabled ? "#93C5FD" : "#E5E7EB",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "700",
                          color: row.enabled ? "#1E3A8A" : "#9CA3AF",
                          flex: 1,
                        }}
                        numberOfLines={1}
                      >
                        {row.timeLabel}
                      </Text>
                      <Clock size={16} color="#7C3AED" strokeWidth={2.2} />
                    </TouchableOpacity>
                  </View>
                  <View style={{ paddingBottom: 4, marginLeft: 4 }}>
                    <Switch
                      value={row.enabled}
                      onValueChange={() => toggleRow(index)}
                      trackColor={{ false: "#D1D5DB", true: "#C4B5FD" }}
                      thumbColor={row.enabled ? "#7C3AED" : "#F3F4F6"}
                      ios_backgroundColor="#D1D5DB"
                    />
                  </View>
                </View>
              </View>
            ))}

            {slots.length < MAX_SLOTS ? (
              <TouchableOpacity
                onPress={addSlot}
                activeOpacity={0.85}
                style={{
                  borderWidth: 2,
                  borderStyle: "dashed",
                  borderColor: "#D1D5DB",
                  borderRadius: 16,
                  paddingVertical: 18,
                  paddingHorizontal: 16,
                  alignItems: "center",
                  backgroundColor: "#FAFAFA",
                  marginBottom: 8,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "#DBEAFE",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 10,
                  }}
                >
                  <Plus size={22} color="#7C3AED" strokeWidth={2.5} />
                </View>
                <Text style={{ fontSize: 15, fontWeight: "800", color: "#7C3AED", marginBottom: 6 }}>
                  Add Another Reminder Slot
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "800",
                    color: "#9CA3AF",
                    letterSpacing: 0.8,
                  }}
                >
                  {remaining} OF {MAX_SLOTS} AVAILABLE
                </Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: Math.max(16, insets.bottom + 8),
              borderTopWidth: 1,
              borderTopColor: "#F3F4F6",
              gap: 12,
            }}
          >
            <TouchableOpacity onPress={handleDiscard} style={{ paddingVertical: 12, paddingHorizontal: 8 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#4B5563" }}>Discard Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={{
                flex: 1,
                maxWidth: 200,
                backgroundColor: "#7C3AED",
                borderRadius: 25,
                paddingVertical: 14,
                alignItems: "center",
                shadowColor: "#7C3AED",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "900", color: "#FFFFFF" }}>Save Settings</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
