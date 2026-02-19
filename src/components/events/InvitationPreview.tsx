import React, { useState, forwardRef, useImperativeHandle } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Modal,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
    Eye,
    X,
    CheckCircle,
    Gift,
    Calendar,
    Clock,
    MapPin,
    Sparkles,
    PartyPopper,
    ExternalLink,
} from "lucide-react-native";
import { Event } from "@/types/events";
import { formatDate } from "./utils";

interface InvitationPreviewProps {
    event: Event;
    delay?: number;
}

export interface InvitationPreviewRef {
    open: () => void;
}

// Sample templates matching the website
const TEMPLATES = [
    { id: "1", name: "Balloons", emoji: "🎈", colors: ["#F472B6", "#A855F7"] },
    { id: "2", name: "Confetti", emoji: "🎊", colors: ["#FBBF24", "#F97316"] },
    { id: "3", name: "Stars", emoji: "⭐", colors: ["#60A5FA", "#6366F1"] },
    { id: "4", name: "Hearts", emoji: "💖", colors: ["#F87171", "#EC4899"] },
    { id: "5", name: "Cake", emoji: "🎂", colors: ["#FBBF24", "#EAB308"] },
    { id: "6", name: "Party", emoji: "🎉", colors: ["#4ADE80", "#14B8A6"] },
];

const InvitationPreview = forwardRef<InvitationPreviewRef, InvitationPreviewProps>(function InvitationPreview(
    { event, delay = 800 },
    ref
) {
    const [showPreview, setShowPreview] = useState(false);
    useImperativeHandle(ref, () => ({ open: () => setShowPreview(true) }), []);
    const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);

    const getEventTypeEmoji = () => {
        switch (event.eventType) {
            case "birthday": return "🎂";
            case "barMitzvah": return "✡️";
            case "batMitzvah": return "✡️";
            default: return "🎉";
        }
    };

    const getEventTypeLabel = () => {
        switch (event.eventType) {
            case "birthday": return "Birthday Celebration";
            case "barMitzvah": return "Bar Mitzvah";
            case "batMitzvah": return "Bat Mitzvah";
            default: return "Celebration";
        }
    };

    return (
        <>
            {/* Preview Card Button */}
            <Animated.View
                entering={FadeInDown.delay(delay).duration(400)}
                style={{
                    marginHorizontal: 24,
                    marginTop: 16,
                }}
            >
                <TouchableOpacity
                    onPress={() => setShowPreview(true)}
                    style={{
                        backgroundColor: "#FFFFFF",
                        borderRadius: 20,
                        padding: 20,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.06,
                        shadowRadius: 12,
                        elevation: 3,
                        borderWidth: 2,
                        borderColor: "#EDE9FE",
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View
                            style={{
                                width: 50,
                                height: 50,
                                borderRadius: 16,
                                backgroundColor: "#8B5CF6",
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: 14,
                            }}
                        >
                            <Eye size={24} color="#FFFFFF" strokeWidth={2} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 17, fontWeight: "800", color: "#111827", marginBottom: 4 }}>
                                Preview Invitation
                            </Text>
                            <Text style={{ fontSize: 13, color: "#6B7280", fontWeight: "500" }}>
                                See how guests will view your event page
                            </Text>
                        </View>
                        <View
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                backgroundColor: "#F3F4F6",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <ExternalLink size={18} color="#6B7280" strokeWidth={2} />
                        </View>
                    </View>

                    {/* Mini Preview */}
                    <View
                        style={{
                            marginTop: 16,
                            backgroundColor: "#F9FAFB",
                            borderRadius: 16,
                            padding: 16,
                            borderWidth: 1,
                            borderColor: "#E5E7EB",
                        }}
                    >
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                            <Text style={{ fontSize: 32, marginRight: 12 }}>{getEventTypeEmoji()}</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 15, fontWeight: "800", color: "#111827" }}>{event.eventName}</Text>
                                <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                                    {formatDate(event.date)} • {event.time}
                                </Text>
                            </View>
                        </View>
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                backgroundColor: "#8B5CF6",
                                borderRadius: 10,
                                paddingVertical: 10,
                                paddingHorizontal: 14,
                                justifyContent: "center",
                            }}
                        >
                            <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>
                                Tap to see full preview →
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>

            {/* Full Preview Modal */}
            <Modal
                visible={showPreview}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowPreview(false)}
            >
                <View style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
                    {/* Header */}
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingHorizontal: 20,
                            paddingTop: 16,
                            paddingBottom: 16,
                            backgroundColor: "#FFFFFF",
                            borderBottomWidth: 1,
                            borderBottomColor: "#E5E7EB",
                        }}
                    >
                        <Text style={{ fontSize: 18, fontWeight: "800", color: "#111827" }}>
                            Website Preview
                        </Text>
                        <TouchableOpacity
                            onPress={() => setShowPreview(false)}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                backgroundColor: "#F3F4F6",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <X size={20} color="#374151" strokeWidth={2} />
                        </TouchableOpacity>
                    </View>

                    {/* Browser mockup */}
                    <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
                        <View
                            style={{
                                backgroundColor: "#FFFFFF",
                                borderRadius: 12,
                                padding: 8,
                                flexDirection: "row",
                                alignItems: "center",
                                marginBottom: 12,
                            }}
                        >
                            <View style={{ flexDirection: "row", gap: 4, marginRight: 12 }}>
                                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#EF4444" }} />
                                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#FBBF24" }} />
                                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#22C55E" }} />
                            </View>
                            <View
                                style={{
                                    flex: 1,
                                    backgroundColor: "#F3F4F6",
                                    borderRadius: 6,
                                    paddingVertical: 6,
                                    paddingHorizontal: 10,
                                }}
                            >
                                <Text style={{ fontSize: 11, color: "#6B7280", fontWeight: "500" }}>
                                    creditkid.vercel.app/event/{event.id.slice(0, 8)}...
                                </Text>
                            </View>
                        </View>
                    </View>

                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Event Header Card */}
                        <View
                            style={{
                                backgroundColor: "#FFFFFF",
                                borderRadius: 24,
                                overflow: "hidden",
                                marginBottom: 16,
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.1,
                                shadowRadius: 12,
                                elevation: 4,
                            }}
                        >
                            {/* Gradient Header */}
                            <View
                                style={{
                                    backgroundColor: "#8B5CF6",
                                    paddingVertical: 32,
                                    paddingHorizontal: 24,
                                    alignItems: "center",
                                }}
                            >
                                <View
                                    style={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 40,
                                        backgroundColor: "rgba(255,255,255,0.2)",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginBottom: 16,
                                    }}
                                >
                                    <Text style={{ fontSize: 40 }}>{getEventTypeEmoji()}</Text>
                                </View>
                                <Text style={{ fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.8)", marginBottom: 8, letterSpacing: 1 }}>
                                    YOU'RE INVITED TO
                                </Text>
                                <Text style={{ fontSize: 28, fontWeight: "900", color: "#FFFFFF", textAlign: "center", marginBottom: 8 }}>
                                    {event.eventName}
                                </Text>
                                {event.age && (
                                    <View
                                        style={{
                                            backgroundColor: "rgba(255,255,255,0.2)",
                                            borderRadius: 20,
                                            paddingVertical: 6,
                                            paddingHorizontal: 16,
                                        }}
                                    >
                                        <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>
                                            Turning {event.age}! 🎉
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Event Details */}
                            <View style={{ padding: 24 }}>
                                {/* Date & Time */}
                                <View style={{ flexDirection: "row", marginBottom: 16 }}>
                                    <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                                        <View
                                            style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 12,
                                                backgroundColor: "#EDE9FE",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                marginRight: 12,
                                            }}
                                        >
                                            <Calendar size={22} color="#8B5CF6" strokeWidth={2} />
                                        </View>
                                        <View>
                                            <Text style={{ fontSize: 11, color: "#9CA3AF", fontWeight: "600", marginBottom: 2 }}>DATE</Text>
                                            <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827" }}>
                                                {formatDate(event.date)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={{ flexDirection: "row", marginBottom: 16 }}>
                                    <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                                        <View
                                            style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 12,
                                                backgroundColor: "#FEF3C7",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                marginRight: 12,
                                            }}
                                        >
                                            <Clock size={22} color="#F59E0B" strokeWidth={2} />
                                        </View>
                                        <View>
                                            <Text style={{ fontSize: 11, color: "#9CA3AF", fontWeight: "600", marginBottom: 2 }}>TIME</Text>
                                            <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827" }}>{event.time}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={{ flexDirection: "row" }}>
                                    <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-start" }}>
                                        <View
                                            style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 12,
                                                backgroundColor: "#D1FAE5",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                marginRight: 12,
                                            }}
                                        >
                                            <MapPin size={22} color="#10B981" strokeWidth={2} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 11, color: "#9CA3AF", fontWeight: "600", marginBottom: 2 }}>LOCATION</Text>
                                            <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827" }}>{event.address1}</Text>
                                            {event.address2 && (
                                                <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{event.address2}</Text>
                                            )}
                                        </View>
                                    </View>
                                </View>

                                {/* Theme & Attire */}
                                {(event.theme || event.attireType) && (
                                    <View style={{ marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: "#F3F4F6" }}>
                                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                                            {event.theme && (
                                                <View style={{ backgroundColor: "#EDE9FE", borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 }}>
                                                    <Text style={{ fontSize: 12, fontWeight: "700", color: "#7C3AED" }}>🎭 {event.theme}</Text>
                                                </View>
                                            )}
                                            {event.attireType && (
                                                <View style={{ backgroundColor: "#DBEAFE", borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 }}>
                                                    <Text style={{ fontSize: 12, fontWeight: "700", color: "#2563EB" }}>👕 {event.attireType}</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* RSVP Card */}
                        <View
                            style={{
                                backgroundColor: "#FFFFFF",
                                borderRadius: 24,
                                padding: 20,
                                marginBottom: 16,
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.06,
                                shadowRadius: 8,
                                elevation: 2,
                            }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                                <View
                                    style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 16,
                                        backgroundColor: "#EDE9FE",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginRight: 12,
                                    }}
                                >
                                    <CheckCircle size={24} color="#8B5CF6" strokeWidth={2} />
                                </View>
                                <View>
                                    <Text style={{ fontSize: 16, fontWeight: "800", color: "#111827" }}>Hey Guest! 👋</Text>
                                    <Text style={{ fontSize: 13, color: "#6B7280" }}>Will you be joining us?</Text>
                                </View>
                            </View>

                            <View style={{ flexDirection: "row", gap: 12 }}>
                                <View
                                    style={{
                                        flex: 1,
                                        backgroundColor: "#22C55E",
                                        borderRadius: 14,
                                        paddingVertical: 16,
                                        alignItems: "center",
                                        flexDirection: "row",
                                        justifyContent: "center",
                                    }}
                                >
                                    <CheckCircle size={18} color="#FFFFFF" strokeWidth={2.5} />
                                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF", marginLeft: 8 }}>I'll Be There!</Text>
                                </View>
                                <View
                                    style={{
                                        flex: 1,
                                        backgroundColor: "#F3F4F6",
                                        borderRadius: 14,
                                        paddingVertical: 16,
                                        alignItems: "center",
                                    }}
                                >
                                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#6B7280" }}>Can't Make It</Text>
                                </View>
                            </View>
                        </View>

                        {/* CreditKid Gift Card */}
                        <View
                            style={{
                                backgroundColor: "#FAF5FF",
                                borderRadius: 24,
                                padding: 20,
                                marginBottom: 16,
                                borderWidth: 2,
                                borderColor: "#E9D5FF",
                            }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                                <View
                                    style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 16,
                                        backgroundColor: "#8B5CF6",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginRight: 12,
                                    }}
                                >
                                    <Text style={{ fontSize: 24 }}></Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 16, fontWeight: "800", color: "#111827" }}>Skip the Gift Card! 🎁</Text>
                                    <Text style={{ fontSize: 12, color: "#7C3AED", fontWeight: "600" }}>Give a gift they'll actually use</Text>
                                </View>
                            </View>

                            {/* Benefits */}
                            <View style={{ gap: 8 }}>
                                {[
                                    { icon: "✓", text: "Use anywhere – not locked to one store" },
                                    { icon: "✓", text: "Apple Pay ready – tap & pay instantly" },
                                    { icon: "✓", text: "Never expires – no hidden fees" },
                                    { icon: "✓", text: "Only 3% fee – vs 15-20% gift card markup" },
                                ].map((item, i) => (
                                    <View key={i} style={{ flexDirection: "row", alignItems: "center" }}>
                                        <View
                                            style={{
                                                width: 20,
                                                height: 20,
                                                borderRadius: 10,
                                                backgroundColor: "#D1FAE5",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                marginRight: 10,
                                            }}
                                        >
                                            <Text style={{ fontSize: 10, color: "#059669", fontWeight: "800" }}>{item.icon}</Text>
                                        </View>
                                        <Text style={{ fontSize: 13, color: "#374151", fontWeight: "500", flex: 1 }}>{item.text}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Gift Card Preview */}
                        <View
                            style={{
                                backgroundColor: "#FFFFFF",
                                borderRadius: 24,
                                padding: 20,
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.06,
                                shadowRadius: 8,
                                elevation: 2,
                            }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                                <View
                                    style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 16,
                                        backgroundColor: "#EDE9FE",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginRight: 12,
                                    }}
                                >
                                    <Gift size={24} color="#8B5CF6" strokeWidth={2} />
                                </View>
                                <View>
                                    <Text style={{ fontSize: 16, fontWeight: "800", color: "#111827" }}>Send Your Gift 🎁</Text>
                                    <Text style={{ fontSize: 13, color: "#6B7280" }}>Create a personalized virtual gift card</Text>
                                </View>
                            </View>

                            {/* Amount Selection Preview */}
                            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                                {[25, 50, 100, 150].map((amount, i) => (
                                    <View
                                        key={amount}
                                        style={{
                                            flex: 1,
                                            paddingVertical: 12,
                                            borderRadius: 12,
                                            alignItems: "center",
                                            backgroundColor: i === 1 ? "#8B5CF6" : "#F3F4F6",
                                        }}
                                    >
                                        <Text style={{ fontSize: 13, fontWeight: "700", color: i === 1 ? "#FFFFFF" : "#374151" }}>
                                            ${amount}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            {/* Gift Card Preview */}
                            <View
                                style={{
                                    borderRadius: 16,
                                    padding: 20,
                                    backgroundColor: selectedTemplate.colors[0],
                                    minHeight: 160,
                                }}
                            >
                                <View style={{ position: "absolute", top: 16, right: 16, opacity: 0.3 }}>
                                    <Text style={{ fontSize: 40 }}>{selectedTemplate.emoji}</Text>
                                </View>
                                <View
                                    style={{
                                        backgroundColor: "rgba(255,255,255,0.2)",
                                        borderRadius: 8,
                                        paddingVertical: 4,
                                        paddingHorizontal: 10,
                                        alignSelf: "flex-start",
                                        marginBottom: 12,
                                    }}
                                >
                                    <Text style={{ fontSize: 11, fontWeight: "700", color: "#FFFFFF" }}> CreditKid Gift</Text>
                                </View>
                                <Text style={{ fontSize: 32, fontWeight: "900", color: "#FFFFFF", marginBottom: 4 }}>$50</Text>
                                <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)" }}>
                                    For {event.creatorName.split(" ")[0]}'s {getEventTypeLabel()}
                                </Text>
                                <View
                                    style={{
                                        marginTop: 16,
                                        backgroundColor: "rgba(255,255,255,0.2)",
                                        borderRadius: 12,
                                        padding: 12,
                                    }}
                                >
                                    <Text style={{ fontSize: 12, color: "#FFFFFF", fontStyle: "italic" }}>
                                        "Wishing you an amazing birthday! 🎉"
                                    </Text>
                                </View>
                            </View>

                            {/* Template Selector */}
                            <View style={{ marginTop: 16 }}>
                                <Text style={{ fontSize: 12, fontWeight: "600", color: "#6B7280", marginBottom: 10 }}>Card Designs</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={{ flexDirection: "row", gap: 8 }}>
                                        {TEMPLATES.map((template) => (
                                            <TouchableOpacity
                                                key={template.id}
                                                onPress={() => setSelectedTemplate(template)}
                                                style={{
                                                    width: 56,
                                                    height: 56,
                                                    borderRadius: 16,
                                                    backgroundColor: template.colors[0],
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    borderWidth: selectedTemplate.id === template.id ? 3 : 0,
                                                    borderColor: "#8B5CF6",
                                                }}
                                            >
                                                <Text style={{ fontSize: 24 }}>{template.emoji}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </>
    );
});

export default InvitationPreview;

