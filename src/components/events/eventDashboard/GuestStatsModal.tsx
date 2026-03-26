import React, { useMemo, type ComponentType } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from "react-native-svg";
import {
  X,
  Users,
  Check,
  Gift,
  HelpCircle,
  UserX,
  ChevronRight,
  AlertTriangle,
} from "lucide-react-native";
import type { Event } from "@/types/events";

const PAGE_BG = "#F3F4F6";

export interface GuestStatsModalProps {
  visible: boolean;
  onClose: () => void;
  bottomInset: number;
  event: Event | null;
  onViewFullGuestList: () => void;
  /** Invalid numbers — opens guest list filtered to fix */
  onFixInvalidPhones: () => void;
  /** Pending = added + invited */
  onSendRemindersToPending: () => void;
}

function RsvpDonut({
  percent,
  size = 92,
  stroke = 10,
}: {
  percent: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(100, Math.max(0, percent));
  const offset = c * (1 - p / 100);
  const half = size / 2;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle
        cx={half}
        cy={half}
        r={r}
        stroke="#E5E7EB"
        strokeWidth={stroke}
        fill="none"
      />
      <Circle
        cx={half}
        cy={half}
        r={r}
        stroke="#059669"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${half} ${half})`}
      />
    </Svg>
  );
}

function StatRow({
  icon: Icon,
  label,
  count,
  total,
  accent,
  iconBg,
}: {
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  count: number;
  total: number;
  accent: string;
  iconBg: string;
}) {
  const pct = total > 0 ? Math.min(100, (count / total) * 100) : 0;
  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 22,
        padding: 16,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.04)",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: iconBg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={18} color={accent} strokeWidth={2.5} />
        </View>
        <Text
          style={{
            flex: 1,
            marginLeft: 12,
            fontSize: 16,
            fontWeight: "700",
            color: "#111827",
          }}
        >
          {label}
        </Text>
        <Text style={{ fontSize: 11, fontWeight: "800", color: "#9CA3AF", letterSpacing: 0.4 }}>
          {count} GUESTS
        </Text>
      </View>
      <View
        style={{
          height: 5,
          backgroundColor: "#F3F4F6",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: 5,
            width: `${pct}%`,
            backgroundColor: accent,
            borderRadius: 3,
          }}
        />
      </View>
    </View>
  );
}

export default function GuestStatsModal({
  visible,
  onClose,
  bottomInset,
  event,
  onViewFullGuestList,
  onFixInvalidPhones,
  onSendRemindersToPending,
}: GuestStatsModalProps) {
  const stats = useMemo(() => {
    const g = event?.guestStats;
    const total = g?.total ?? 0;
    const confirmed = g?.confirmed ?? 0;
    const paid = g?.paid ?? 0;
    const invited = g?.invited ?? 0;
    const added = g?.added ?? 0;
    const invalidNumber = g?.invalidNumber ?? 0;
    const notComing = g?.notComing ?? 0;

    const attending = confirmed + paid;
    const rsvpRate =
      total > 0 ? Math.round(((confirmed + paid) / total) * 100) : 0;

    const pendingReminders = added + invited;

    return {
      total,
      rsvpRate,
      attending,
      sentGift: paid,
      maybeComing: invited,
      notComing,
      invalidNumber,
      pendingReminders,
    };
  }, [event?.guestStats]);

  if (!event) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            paddingHorizontal: 22,
            paddingTop: 18,
            paddingBottom: 14,
            backgroundColor: "#FFFFFF",
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: "#E5E7EB",
          }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ fontSize: 22, fontWeight: "900", color: "#111827" }}>
              Guest Stats
            </Text>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "800",
                color: "#9CA3AF",
                letterSpacing: 1.2,
                marginTop: 4,
              }}
            >
              REAL-TIME ANALYTICS
            </Text>
          </View>
          <TouchableOpacity
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={onClose}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: "#F3F4F6",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} color="#374151" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 18,
            paddingBottom: Math.max(24, bottomInset + 120),
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 18 }}>
            {/* Total guests */}
            <View
              style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
                borderRadius: 26,
                padding: 18,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.05)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.06,
                shadowRadius: 10,
                elevation: 3,
              }}
            >
              <View style={{ position: "absolute", opacity: 0.06, right: -8, bottom: -4 }}>
                <Users size={80} color="#7C3AED" strokeWidth={1.5} />
              </View>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "800",
                  color: "#7C3AED",
                  letterSpacing: 0.8,
                  marginBottom: 8,
                }}
              >
                TOTAL GUESTS
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 36,
                    fontWeight: "900",
                    color: "#111827",
                    letterSpacing: -1,
                  }}
                >
                  {stats.total}
                </Text>
                <View
                  style={{
                    marginLeft: 8,
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "#EDE9FE",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Users size={20} color="#7C3AED" strokeWidth={2.2} />
                </View>
              </View>
            </View>

            {/* RSVP donut */}
            <View
              style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
                borderRadius: 26,
                paddingVertical: 14,
                paddingHorizontal: 12,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.05)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.06,
                shadowRadius: 10,
                elevation: 3,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "800",
                  color: "#047857",
                  letterSpacing: 0.8,
                  marginBottom: 6,
                  alignSelf: "flex-start",
                }}
              >
                RSVP RATE
              </Text>
              <View
                style={{
                  width: 92,
                  height: 92,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <RsvpDonut percent={stats.rsvpRate} />
                <View
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 18, fontWeight: "900", color: "#059669" }}>
                    {stats.rsvpRate}%
                  </Text>
                  <Text style={{ fontSize: 9, fontWeight: "800", color: "#6B7280", marginTop: 2 }}>
                    RATE
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <StatRow
            icon={Check}
            label="Attending"
            count={stats.attending}
            total={stats.total}
            accent="#059669"
            iconBg="#D1FAE5"
          />
          <StatRow
            icon={Gift}
            label="Sent Gift"
            count={stats.sentGift}
            total={stats.total}
            accent="#7C3AED"
            iconBg="#EDE9FE"
          />
          <StatRow
            icon={HelpCircle}
            label="Maybe Coming"
            count={stats.maybeComing}
            total={stats.total}
            accent="#A16207"
            iconBg="#FEF9C3"
          />
          <StatRow
            icon={UserX}
            label="Not Coming"
            count={stats.notComing}
            total={stats.total}
            accent="#EC4899"
            iconBg="#FCE7F3"
          />

          {stats.invalidNumber > 0 ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#FFFBEB",
                borderRadius: 18,
                padding: 14,
                marginTop: 6,
                borderWidth: 1,
                borderColor: "#FDE68A",
              }}
            >
              <AlertTriangle size={22} color="#D97706" strokeWidth={2.2} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 15, fontWeight: "800", color: "#C2410C" }}>
                  Action Needed
                </Text>
                <Text style={{ fontSize: 13, fontWeight: "500", color: "#92400E", marginTop: 2 }}>
                  {stats.invalidNumber} invalid phone number
                  {stats.invalidNumber !== 1 ? "s" : ""} found
                </Text>
              </View>
              <TouchableOpacity
                onPress={onFixInvalidPhones}
                style={{
                  backgroundColor: "#EA580C",
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "900", color: "#FFFFFF" }}>FIX</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>

        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: Math.max(18, bottomInset),
            backgroundColor: "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: "#E5E7EB",
          }}
        >
          <TouchableOpacity onPress={onViewFullGuestList} activeOpacity={0.92}>
            <LinearGradient
              colors={["#6366F1", "#7C3AED"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 18,
                paddingVertical: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
                shadowColor: "#6366F1",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#FFFFFF" }}>
                View Full Guest List
              </Text>
              <ChevronRight size={20} color="#FFFFFF" strokeWidth={2.5} style={{ marginLeft: 6 }} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={onSendRemindersToPending} style={{ alignItems: "center", paddingVertical: 8 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "900",
                color: "#A78BFA",
                letterSpacing: 0.8,
              }}
            >
              {stats.pendingReminders > 0
                ? `SEND REMINDERS TO ${stats.pendingReminders} PENDING GUEST${stats.pendingReminders === 1 ? "" : "S"}`
                : "MANAGE REMINDERS & NOTIFICATIONS"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
