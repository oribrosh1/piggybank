import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    StyleSheet,
    ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Gift, Send, X, Shield, ArrowRight, Smartphone, CreditCard, BarChart3 } from "lucide-react-native";

interface ChildLinkCardProps {
    delay?: number;
    onSendLink: () => void;
    loading?: boolean;
}

const STEPS = [
    {
        number: "1",
        icon: Send,
        title: "You share a link",
        desc: "Tap the button below and send a secure link to your child via SMS, WhatsApp, or any messenger.",
        color: "#0D9488",
        bg: "#F0FDFA",
    },
    {
        number: "2",
        icon: Smartphone,
        title: "Your child opens it",
        desc: "They tap the link on their phone — no download needed. A personal account is created instantly.",
        color: "#2563EB",
        bg: "#EFF6FF",
    },
    {
        number: "3",
        icon: CreditCard,
        title: "They get a virtual card",
        desc: "All gifts from your event flow into one secure balance on a virtual debit card just for them.",
        color: "#7C3AED",
        bg: "#F5F3FF",
    },
    {
        number: "4",
        icon: BarChart3,
        title: "You stay in control",
        desc: "Monitor spending in real time, set limits, and manage the card — all from your phone.",
        color: "#059669",
        bg: "#ECFDF5",
    },
];

export default function ChildLinkCard({ delay = 320, onSendLink, loading = false }: ChildLinkCardProps) {
    const [showExplainModal, setShowExplainModal] = useState(false);
    const insets = useSafeAreaInsets();

    const closeModal = () => setShowExplainModal(false);

    const handleGetLink = () => {
        closeModal();
        onSendLink();
    };

    return (
        <>
            {/* Inline card */}
            <Animated.View
                entering={FadeInDown.delay(delay).duration(400)}
                style={styles.card}
            >
                <View style={styles.cardAccent} />
                <View style={styles.cardContent}>
                    <View style={styles.cardRow}>
                        <View style={styles.iconWrap}>
                            <Gift size={22} color="#0F766E" strokeWidth={2} />
                        </View>
                        <View style={styles.cardText}>
                            <Text style={styles.cardTitle}>Your child's link</Text>
                            <Text style={styles.cardDesc} numberOfLines={2}>
                                Send a link so they can see their gifts and spend them on their own card.
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => setShowExplainModal(true)}
                        disabled={loading}
                        style={[styles.cardCta, loading && styles.cardCtaDisabled]}
                        activeOpacity={0.82}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Send size={12} color="#FFFFFF" strokeWidth={2.5} />
                                <Text style={styles.cardCtaLabel}>Link Your Child</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* Full-screen page sheet – same pattern as Guest List modal */}
            <Modal
                visible={showExplainModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={closeModal}
            >
                <View style={styles.sheetRoot}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Link your child</Text>
                        <TouchableOpacity
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            onPress={closeModal}
                            style={styles.closeBtn}
                        >
                            <X size={20} color="#374151" strokeWidth={2} />
                        </TouchableOpacity>
                    </View>

                    {/* Scrollable content */}
                    <ScrollView
                        style={styles.scrollArea}
                        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(24, insets.bottom + 100) }]}
                        showsVerticalScrollIndicator={true}
                    >
                        {/* Hero */}
                        <View style={styles.hero}>
                            <View style={styles.heroIconRow}>
                                <View style={[styles.heroIcon, { backgroundColor: "#F0FDFA" }]}>
                                    <Gift size={24} color="#0D9488" strokeWidth={1.8} />
                                </View>
                                <ArrowRight size={16} color="#CBD5E1" strokeWidth={2} />
                                <View style={[styles.heroIcon, { backgroundColor: "#F5F3FF" }]}>
                                    <CreditCard size={24} color="#7C3AED" strokeWidth={1.8} />
                                </View>
                            </View>
                            <Text style={styles.heroTitle}>
                                Gifts go straight to{"\n"}your child's card
                            </Text>
                            <Text style={styles.heroSubtitle}>
                                Every gift from guests lands in one secure balance — a virtual debit card your child can use, and you control.
                            </Text>
                        </View>

                        {/* How it works label */}
                        <Text style={styles.sectionLabel}>HOW IT WORKS</Text>

                        {/* Steps */}
                        <View style={styles.stepsContainer}>
                            {STEPS.map((step, idx) => {
                                const Icon = step.icon;
                                const isLast = idx === STEPS.length - 1;
                                return (
                                    <View key={step.number} style={styles.stepRow}>
                                        <View style={styles.timeline}>
                                            <View style={[styles.stepDot, { backgroundColor: step.color }]}>
                                                <Text style={styles.stepDotText}>{step.number}</Text>
                                            </View>
                                            {!isLast && <View style={[styles.stepLine, { backgroundColor: step.color + "30" }]} />}
                                        </View>
                                        <View style={[styles.stepCard, { backgroundColor: step.bg, borderColor: step.color + "18" }]}>
                                            <View style={[styles.stepIconWrap, { backgroundColor: "#FFFFFF" }]}>
                                                <Icon size={18} color={step.color} strokeWidth={2} />
                                            </View>
                                            <View style={styles.stepTextWrap}>
                                                <Text style={styles.stepTitle}>{step.title}</Text>
                                                <Text style={styles.stepDesc}>{step.desc}</Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>

                        {/* Security note */}
                        <View style={styles.securityNote}>
                            <Shield size={16} color="#0D9488" strokeWidth={2} />
                            <Text style={styles.securityText}>
                                The link is encrypted, single-use, and expires in 15 minutes.
                            </Text>
                        </View>
                    </ScrollView>

                    {/* Sticky bottom actions */}
                    <View style={[styles.actions, { paddingBottom: Math.max(16, insets.bottom) }]}>
                        <TouchableOpacity
                            onPress={handleGetLink}
                            disabled={loading}
                            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                            activeOpacity={0.85}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <>
                                    <Send size={18} color="#FFFFFF" strokeWidth={2.5} />
                                    <Text style={styles.primaryBtnLabel}>Get link & share</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={closeModal}
                            style={styles.secondaryBtn}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.secondaryBtnLabel}>Not now</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    // Inline card
    card: {
        marginHorizontal: 24,
        marginTop: 12,
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        overflow: "hidden",
        flexDirection: "row",
        shadowColor: "#0D9488",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    cardAccent: {
        width: 4,
        backgroundColor: "#0D9488",
        borderRadius: 2,
    },
    cardContent: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    cardRow: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: "#F0FDFA",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },
    cardText: {
        flex: 1,
        minWidth: 0,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: "#0F172A",
        letterSpacing: -0.2,
    },
    cardDesc: {
        fontSize: 13,
        color: "#64748B",
        lineHeight: 19,
        marginTop: 4,
    },
    cardCta: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        backgroundColor: "#0D9488",
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        marginTop: 14,
        shadowColor: "#0D9488",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 2,
    },
    cardCtaDisabled: {
        opacity: 0.8,
    },
    cardCtaLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: "#FFFFFF",
    },

    // Full-screen page sheet
    sheetRoot: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#111827",
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
    },

    // Scrollable area
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 24,
        paddingHorizontal: 20,
    },

    // Hero
    hero: {
        alignItems: "center",
        marginBottom: 28,
    },
    heroIconRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        marginBottom: 20,
    },
    heroIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: "900",
        color: "#0F172A",
        textAlign: "center",
        lineHeight: 30,
        letterSpacing: -0.5,
        marginBottom: 12,
    },
    heroSubtitle: {
        fontSize: 15,
        color: "#64748B",
        lineHeight: 22,
        textAlign: "center",
        paddingHorizontal: 8,
    },

    // Section label
    sectionLabel: {
        fontSize: 11,
        fontWeight: "800",
        color: "#94A3B8",
        letterSpacing: 1,
        marginBottom: 16,
        marginLeft: 4,
    },

    // Steps
    stepsContainer: {
        marginBottom: 20,
    },
    stepRow: {
        flexDirection: "row",
        alignItems: "stretch",
    },
    timeline: {
        width: 32,
        alignItems: "center",
    },
    stepDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 14,
    },
    stepDotText: {
        fontSize: 13,
        fontWeight: "800",
        color: "#FFFFFF",
    },
    stepLine: {
        width: 2,
        flex: 1,
        marginTop: 4,
        marginBottom: 4,
        borderRadius: 1,
    },
    stepCard: {
        flex: 1,
        flexDirection: "row",
        alignItems: "flex-start",
        borderRadius: 16,
        padding: 14,
        marginLeft: 10,
        marginBottom: 10,
        borderWidth: 1,
    },
    stepIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },
    stepTextWrap: {
        flex: 1,
        marginLeft: 12,
    },
    stepTitle: {
        fontSize: 15,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 3,
    },
    stepDesc: {
        fontSize: 13,
        color: "#64748B",
        lineHeight: 19,
    },

    // Security note
    securityNote: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 14,
        backgroundColor: "#F0FDFA",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#CCFBF1",
    },
    securityText: {
        flex: 1,
        fontSize: 13,
        color: "#0F766E",
        fontWeight: "600",
        lineHeight: 18,
    },

    // Sticky bottom actions
    actions: {
        paddingTop: 16,
        paddingHorizontal: 20,
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
    },
    primaryBtn: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#0D9488",
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: "#0D9488",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 3,
    },
    primaryBtnDisabled: {
        opacity: 0.85,
    },
    primaryBtnLabel: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    secondaryBtn: {
        marginTop: 14,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    secondaryBtnLabel: {
        fontSize: 15,
        fontWeight: "600",
        color: "#94A3B8",
    },
});
