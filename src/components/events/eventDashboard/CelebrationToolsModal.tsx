import React from "react";
import { View, Text, Modal, ScrollView, TouchableOpacity, Image } from "react-native";
import { X, Sparkles, Users, Send, Clock } from "lucide-react-native";

const PAGE_BG = "#FAFAFA";
const CARD_RADIUS = 24;

export interface CelebrationToolsModalProps {
  visible: boolean;
  onClose: () => void;
  bottomInset: number;
  onOpenGuestList: () => void;
  onOpenPoster: () => void;
  /** Full invitation / SMS-style preview */
  onPreviewInvitation: () => void;
  /** Opens reminder schedule UI */
  onOpenReminderSchedule: () => void;
}

type ToolDef = {
  key: string;
  icon: typeof Sparkles;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  cta: string;
  ctaColor: string;
  onPress: () => void;
};

export default function CelebrationToolsModal({
  visible,
  onClose,
  bottomInset,
  onOpenGuestList,
  onOpenPoster,
  onPreviewInvitation,
  onOpenReminderSchedule,
}: CelebrationToolsModalProps) {
  const tools: ToolDef[] = [
    {
      key: "poster",
      icon: Sparkles,
      iconBg: "#EDE9FE",
      iconColor: "#7C3AED",
      title: "AI Poster Generator",
      description:
        "Create stunning, personalized celebration posters with just a few prompts.",
      cta: "GENERATE NOW",
      ctaColor: "#7C3AED",
      onPress: () => {
        onClose();
        setTimeout(onOpenPoster, 300);
      },
    },
    {
      key: "guests",
      icon: Users,
      iconBg: "#D1FAE5",
      iconColor: "#047857",
      title: "Smart Guest List",
      description:
        "Track RSVPs, gift status, and contact details in one real-time dashboard.",
      cta: "MANAGE LIST",
      ctaColor: "#059669",
      onPress: () => {
        onClose();
        setTimeout(onOpenGuestList, 300);
      },
    },
    {
      key: "sms",
      icon: Send,
      iconBg: "#FEF3C7",
      iconColor: "#B45309",
      title: "SMS Invitations",
      description:
        "Send beautiful, themed text invites directly to your guest's phone.",
      cta: "SEND INVITES",
      ctaColor: "#B45309",
      onPress: () => {
        onClose();
        setTimeout(onPreviewInvitation, 300);
      },
    },
    {
      key: "reminders",
      icon: Clock,
      iconBg: "#DBEAFE",
      iconColor: "#1D4ED8",
      title: "Reminder Schedule",
      description: "Automate your follow-ups and never miss a prep milestone.",
      cta: "SET REMINDERS",
      ctaColor: "#64748B",
      onPress: () => {
        onClose();
        setTimeout(onOpenReminderSchedule, 300);
      },
    },
  ];

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
            alignItems: "center",
            justifyContent: "flex-end",
            backgroundColor: "#FFFFFF",
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: "#E5E7EB",
          }}
        >
          <TouchableOpacity
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "#F3F4F6",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} color="#374151" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: Math.max(24, bottomInset + 32),
          }}
          showsVerticalScrollIndicator
        >
          <Text
            style={{
              fontSize: 26,
              fontWeight: "900",
              color: "#111827",
              marginBottom: 6,
            }}
          >
            Celebration Tools 🪄
          </Text>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "500",
              color: "#6B7280",
              marginBottom: 22,
              lineHeight: 22,
            }}
          >
            Everything you need for the perfect event.
          </Text>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            {tools.map((item) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.key}
                  activeOpacity={0.88}
                  onPress={item.onPress}
                  style={{
                    width: "48%",
                    backgroundColor: "#FFFFFF",
                    borderRadius: CARD_RADIUS,
                    padding: 16,
                    marginBottom: 14,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.06,
                    shadowRadius: 12,
                    elevation: 3,
                    borderWidth: 1,
                    borderColor: "rgba(0,0,0,0.04)",
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: item.iconBg,
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 12,
                    }}
                  >
                    <Icon size={22} color={item.iconColor} strokeWidth={2.2} />
                  </View>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "800",
                      color: "#111827",
                      marginBottom: 6,
                    }}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "500",
                      color: "#6B7280",
                      lineHeight: 17,
                      marginBottom: 14,
                      minHeight: 51,
                    }}
                  >
                    {item.description}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "800",
                      letterSpacing: 0.6,
                      color: item.ctaColor,
                    }}
                  >
                    {item.cta}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text
            style={{
              fontSize: 13,
              fontWeight: "800",
              letterSpacing: 0.4,
              color: "#6B7280",
              marginTop: 8,
              marginBottom: 12,
            }}
          >
            SMS Theme Preview
          </Text>
          <Image
            source={require("../../../../assets/images/creditkid-demo-message.png")}
            resizeMode="contain"
            style={{
              width: "100%",
              height: 420,
              borderRadius: CARD_RADIUS,
              backgroundColor: "#F3F4F6",
            }}
          />
        </ScrollView>

        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: Math.max(16, bottomInset),
            backgroundColor: "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: "#E5E7EB",
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            style={{
              paddingVertical: 16,
              borderRadius: 16,
              backgroundColor: "#7C3AED",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#FFFFFF" }}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
