import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    StyleSheet,
    ScrollView,
    TextInput,
    FlatList,
    Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
    Gift, Send, X, Shield, ArrowRight, Smartphone, CreditCard,
    Phone, Search, User, Check, Lock, UserPlus, HelpCircle,
} from "lucide-react-native";
import * as Contacts from "expo-contacts";

interface Contact {
    id: string;
    name: string;
    phone: string;
}

interface ChildLinkCardProps {
    delay?: number;
    onSendInvite: (childPhone: string, childName: string) => void;
    loading?: boolean;
    visible?: boolean;
    onClose?: () => void;
}

type Screen = "explainer" | "contacts" | "confirm" | "success";

const STEPS = [
    {
        number: "1",
        icon: Send,
        title: "We send them an SMS",
        desc: "A secure invitation link will be sent to their phone.",
        color: "#0D9488",
        bg: "#F0FDFA",
    },
    {
        number: "2",
        icon: Smartphone,
        title: "Your child downloads the app",
        desc: "They'll get a kid-friendly version of CreditKid.",
        color: "#2563EB",
        bg: "#EFF6FF",
    },
    {
        number: "3",
        icon: Lock,
        title: "They enter their PIN",
        desc: "Secure authentication ensures only they can access.",
        color: "#7C3AED",
        bg: "#F5F3FF",
    },
];

export default function ChildLinkCard({
    delay = 320,
    onSendInvite,
    loading = false,
    visible: controlledVisible,
    onClose: controlledOnClose,
}: ChildLinkCardProps) {
    const isControlled = controlledVisible !== undefined;

    const [internalVisible, setInternalVisible] = useState(false);
    const [screen, setScreen] = useState<Screen>("explainer");
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [sent, setSent] = useState(false);
    const insets = useSafeAreaInsets();

    const modalVisible = isControlled ? controlledVisible : internalVisible;

    const closeAll = () => {
        if (isControlled) {
            controlledOnClose?.();
        } else {
            setInternalVisible(false);
        }
        setScreen("explainer");
        setSelectedContact(null);
        setSearchQuery("");
        setSent(false);
    };

    const loadContacts = async () => {
        setLoadingContacts(true);
        try {
            const { status } = await Contacts.requestPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission Required", "Please allow access to your contacts to select your child.");
                setLoadingContacts(false);
                return;
            }
            const { data } = await Contacts.getContactsAsync({
                fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
                sort: Contacts.SortTypes.FirstName,
            });
            const transformed: Contact[] = data
                .filter((c) => c.phoneNumbers?.length && c.name)
                .map((c) => ({
                    id: c.id || String(Math.random()),
                    name: c.name || "Unknown",
                    phone: c.phoneNumbers?.[0]?.number || "",
                }))
                .filter((c) => c.phone);
            setContacts(transformed);
        } catch {
            Alert.alert("Error", "Failed to load contacts. Please try again.");
        } finally {
            setLoadingContacts(false);
        }
    };

    const openContacts = async () => {
        setScreen("contacts");
        if (contacts.length === 0) await loadContacts();
    };

    const handleSelectContact = (contact: Contact) => {
        setSelectedContact(contact);
    };

    const handleContinue = () => {
        if (!selectedContact) return;
        setScreen("confirm");
    };

    const handleSend = () => {
        if (!selectedContact) return;
        onSendInvite(selectedContact.phone, selectedContact.name);
        setSent(true);
        setScreen("success");
    };

    const firstName = selectedContact?.name.split(" ")[0] || "";

    const filteredContacts = contacts.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
    );

    // ── Screen A: Explainer ──
    const renderExplainer = () => (
        <View style={s.sheetRoot}>
            <View style={s.header}>
                <Text style={s.headerTitle}>Link Child Account</Text>
                <TouchableOpacity hitSlop={12} onPress={closeAll} style={s.closeBtn}>
                    <X size={20} color="#374151" strokeWidth={2} />
                </TouchableOpacity>
            </View>
            <ScrollView style={s.scrollArea} contentContainerStyle={s.scrollContent}>
                <View style={s.hero}>
                    <View style={s.heroIconRow}>
                        <View style={[s.heroIcon, { backgroundColor: "#F0FDFA" }]}>
                            <Gift size={24} color="#0D9488" strokeWidth={1.8} />
                        </View>
                        <ArrowRight size={16} color="#CBD5E1" strokeWidth={2} />
                        <View style={[s.heroIcon, { backgroundColor: "#F5F3FF" }]}>
                            <CreditCard size={24} color="#7C3AED" strokeWidth={1.8} />
                        </View>
                    </View>
                    <Text style={s.heroTitle}>{"Gifts go straight to\nyour child's card"}</Text>
                    <Text style={s.heroSubtitle}>
                        We'll send your child an SMS with everything they need to get started.
                    </Text>
                </View>

                <View style={s.stepsContainer}>
                    {STEPS.map((step, idx) => {
                        const Icon = step.icon;
                        const isLast = idx === STEPS.length - 1;
                        return (
                            <View key={step.number} style={s.stepRow}>
                                <View style={s.timeline}>
                                    <View style={[s.stepDot, { backgroundColor: step.color }]}>
                                        <Text style={s.stepDotText}>{step.number}</Text>
                                    </View>
                                    {!isLast && <View style={[s.stepLine, { backgroundColor: step.color + "30" }]} />}
                                </View>
                                <View style={[s.stepCard, { backgroundColor: step.bg, borderColor: step.color + "18" }]}>
                                    <View style={[s.stepIconWrap, { backgroundColor: "#FFFFFF" }]}>
                                        <Icon size={18} color={step.color} strokeWidth={2} />
                                    </View>
                                    <View style={s.stepTextWrap}>
                                        <Text style={s.stepTitle}>{step.title}</Text>
                                        <Text style={s.stepDesc}>{step.desc}</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            <View style={[s.actions, { paddingBottom: Math.max(16, insets.bottom) }]}>
                <TouchableOpacity onPress={openContacts} style={[s.primaryBtnTeal]} activeOpacity={0.85}>
                    <Text style={s.primaryBtnLabel}>Select a contact first</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={closeAll} style={s.secondaryBtn}>
                    <Text style={s.secondaryBtnLabel}>Not now</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // ── Screen B/C: Contact Picker ──
    const renderContacts = () => (
        <View style={s.sheetRoot}>
            <View style={s.headerCenter}>
                <TouchableOpacity hitSlop={12} onPress={() => setScreen("explainer")} style={s.closeBtn}>
                    <X size={20} color="#374151" strokeWidth={2} />
                </TouchableOpacity>
                <Text style={[s.headerTitle, { flex: 1, textAlign: "center" }]}>Link Child Account</Text>
                <TouchableOpacity hitSlop={12} style={s.helpBtn}>
                    <HelpCircle size={22} color="#6B3AA0" strokeWidth={2} />
                </TouchableOpacity>
            </View>

            <View style={s.searchBar}>
                <Search size={18} color="#94A3B8" strokeWidth={2} />
                <TextInput
                    style={s.searchInput}
                    placeholder="Search contacts..."
                    placeholderTextColor="#94A3B8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus
                />
            </View>

            {loadingContacts ? (
                <View style={s.centered}>
                    <ActivityIndicator size="large" color="#0D9488" />
                    <Text style={s.loadingText}>Loading contacts...</Text>
                </View>
            ) : (
                <>
                    <View style={s.contactsHeader}>
                        <Text style={s.contactsHeaderLabel}>Suggested Contacts</Text>
                        <Text style={s.contactsHeaderCount}>{filteredContacts.length} FOUND</Text>
                    </View>
                    <FlatList
                        data={filteredContacts}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
                        renderItem={({ item }) => {
                            const isSelected = selectedContact?.id === item.id;
                            return (
                                <TouchableOpacity
                                    style={s.contactRow}
                                    onPress={() => handleSelectContact(item)}
                                    activeOpacity={0.7}
                                >
                                    <View style={s.contactAvatar}>
                                        <Text style={s.contactInitial}>{item.name.charAt(0).toUpperCase()}</Text>
                                    </View>
                                    <View style={s.contactInfo}>
                                        <Text style={s.contactName}>{item.name}</Text>
                                        <Text style={s.contactPhone}>{item.phone}</Text>
                                    </View>
                                    {isSelected && <Check size={20} color="#0D9488" strokeWidth={2.5} />}
                                </TouchableOpacity>
                            );
                        }}
                        ListEmptyComponent={
                            <View style={s.centered}>
                                <Text style={s.emptyText}>No contacts found</Text>
                            </View>
                        }
                    />
                </>
            )}

            {selectedContact && (
                <View style={[s.actions, { paddingBottom: Math.max(16, insets.bottom) }]}>
                    <TouchableOpacity onPress={handleContinue} style={s.primaryBtnPurple} activeOpacity={0.85}>
                        <Text style={s.primaryBtnLabel}>Continue with {firstName}</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    // ── Screen D: Confirmation ──
    const renderConfirm = () => (
        <View style={s.sheetRoot}>
            <View style={s.headerCenter}>
                <TouchableOpacity hitSlop={12} onPress={closeAll} style={s.closeBtn}>
                    <X size={20} color="#374151" strokeWidth={2} />
                </TouchableOpacity>
                <Text style={[s.headerTitle, { flex: 1, textAlign: "center", color: "#6B3AA0" }]}>Link Child Account</Text>
                <TouchableOpacity hitSlop={12} style={s.helpBtn}>
                    <HelpCircle size={22} color="#6B3AA0" strokeWidth={2} />
                </TouchableOpacity>
            </View>

            <ScrollView style={s.scrollArea} contentContainerStyle={[s.scrollContent, { alignItems: "center" }]}>
                <View style={s.confirmHeroCircle}>
                    <UserPlus size={32} color="#0D9488" strokeWidth={1.8} />
                </View>
                <Text style={s.confirmTitle}>Secure Family Linking</Text>
                <Text style={s.confirmSubtitle}>
                    Connecting {firstName} will allow them to see their balance while you maintain oversight.
                </Text>

                <View style={s.confirmSection}>
                    <View style={s.confirmSectionHeader}>
                        <Text style={s.sectionLabel}>SELECTED ACCOUNT</Text>
                        <View style={s.verifiedBadge}>
                            <View style={s.verifiedDot} />
                            <Text style={s.verifiedText}>Verified</Text>
                        </View>
                    </View>
                    <View style={s.confirmContactCard}>
                        <View style={s.confirmContactIcon}>
                            <User size={20} color="#0D9488" strokeWidth={2} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.confirmContactName}>{selectedContact?.name}</Text>
                            <Text style={s.confirmContactPhone}>{selectedContact?.phone}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setScreen("contacts")}>
                            <Text style={s.changeBtnLabel}>Change</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={s.pinNote}>
                    <View style={s.pinNoteIcon}>
                        <Lock size={18} color="#6B3AA0" strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.pinNoteTitle}>PIN-Protected Access</Text>
                        <Text style={s.pinNoteDesc}>
                            {firstName} will need to set up a unique PIN to access the vault features once linked.
                        </Text>
                    </View>
                </View>
            </ScrollView>

            <View style={[s.actions, { paddingBottom: Math.max(16, insets.bottom) }]}>
                <TouchableOpacity
                    onPress={handleSend}
                    disabled={loading}
                    style={[s.primaryBtnTeal, loading && s.primaryBtnDisabled]}
                    activeOpacity={0.85}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <>
                            <Send size={18} color="#FFFFFF" strokeWidth={2.5} />
                            <Text style={s.primaryBtnLabel}>Send SMS to {firstName}</Text>
                        </>
                    )}
                </TouchableOpacity>
                <TouchableOpacity onPress={closeAll} style={s.secondaryBtn}>
                    <Text style={s.secondaryBtnLabel}>Not now</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // ── Screen E: Success ──
    const renderSuccess = () => (
        <View style={s.successOverlay}>
            <View style={s.successCard}>
                <View style={s.successCheckCircle}>
                    <Check size={32} color="#0D9488" strokeWidth={2.5} />
                </View>
                <Text style={s.successTitle}>SMS sent!</Text>
                <Text style={s.successDesc}>
                    We sent a link and PIN to {firstName}'s phone. They can join anytime in the next 30 days.
                </Text>
                <TouchableOpacity onPress={closeAll} style={s.primaryBtnPurple} activeOpacity={0.85}>
                    <Text style={s.primaryBtnLabel}>Done</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderScreen = () => {
        switch (screen) {
            case "explainer": return renderExplainer();
            case "contacts": return renderContacts();
            case "confirm": return renderConfirm();
            case "success": return renderSuccess();
        }
    };

    return (
        <>
            {!isControlled && (
                <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={s.card}>
                    <View style={s.cardAccent} />
                    <View style={s.cardContent}>
                        <View style={s.cardRow}>
                            <View style={s.iconWrap}>
                                <Gift size={22} color="#0F766E" strokeWidth={2} />
                            </View>
                            <View style={s.cardText}>
                                <Text style={s.cardTitle}>Your child's link</Text>
                                <Text style={s.cardDesc} numberOfLines={2}>
                                    Send your child an SMS so they can see their gifts and use their card.
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={() => setInternalVisible(true)}
                            disabled={loading}
                            style={[s.cardCta, loading && s.cardCtaDisabled]}
                            activeOpacity={0.82}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <>
                                    <Send size={12} color="#FFFFFF" strokeWidth={2.5} />
                                    <Text style={s.cardCtaLabel}>Link Your Child</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}

            <Modal
                visible={modalVisible}
                animationType={screen === "success" ? "fade" : "slide"}
                presentationStyle={screen === "success" ? "overFullScreen" : "pageSheet"}
                transparent={screen === "success"}
                onRequestClose={closeAll}
            >
                {renderScreen()}
            </Modal>
        </>
    );
}

const s = StyleSheet.create({
    // Inline card (uncontrolled mode)
    card: {
        marginHorizontal: 24, marginTop: 12, backgroundColor: "#FFFFFF",
        borderRadius: 18, overflow: "hidden", flexDirection: "row",
        shadowColor: "#0D9488", shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
    },
    cardAccent: { width: 4, backgroundColor: "#0D9488", borderRadius: 2 },
    cardContent: { flex: 1, paddingVertical: 16, paddingHorizontal: 16 },
    cardRow: { flexDirection: "row", alignItems: "flex-start" },
    iconWrap: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: "#F0FDFA",
        alignItems: "center", justifyContent: "center", marginRight: 14,
    },
    cardText: { flex: 1, minWidth: 0 },
    cardTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A", letterSpacing: -0.2 },
    cardDesc: { fontSize: 13, color: "#64748B", lineHeight: 19, marginTop: 4 },
    cardCta: {
        flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
        backgroundColor: "#0D9488", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12,
        marginTop: 14,
    },
    cardCtaDisabled: { opacity: 0.8 },
    cardCtaLabel: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },

    // Shared modal layout
    sheetRoot: { flex: 1, backgroundColor: "#F9FAFB" },
    header: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        backgroundColor: "#FFFFFF", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16,
        borderBottomWidth: 1, borderBottomColor: "#E5E7EB",
    },
    headerCenter: {
        flexDirection: "row", alignItems: "center",
        backgroundColor: "#FFFFFF", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16,
        borderBottomWidth: 1, borderBottomColor: "#E5E7EB", gap: 8,
    },
    headerTitle: { fontSize: 20, fontWeight: "800", color: "#111827" },
    closeBtn: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: "#F3F4F6",
        alignItems: "center", justifyContent: "center",
    },
    helpBtn: {
        width: 36, height: 36, borderRadius: 18,
        alignItems: "center", justifyContent: "center",
    },

    scrollArea: { flex: 1 },
    scrollContent: { paddingTop: 24, paddingHorizontal: 20 },

    // Explainer hero
    hero: { alignItems: "center", marginBottom: 28 },
    heroIconRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 },
    heroIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
    heroTitle: {
        fontSize: 24, fontWeight: "900", color: "#0F172A", textAlign: "center",
        lineHeight: 30, letterSpacing: -0.5, marginBottom: 12,
    },
    heroSubtitle: { fontSize: 15, color: "#64748B", lineHeight: 22, textAlign: "center", paddingHorizontal: 8 },

    // Steps
    sectionLabel: { fontSize: 11, fontWeight: "800", color: "#94A3B8", letterSpacing: 1, marginLeft: 4 },
    stepsContainer: { marginBottom: 20 },
    stepRow: { flexDirection: "row", alignItems: "stretch" },
    timeline: { width: 32, alignItems: "center" },
    stepDot: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 14 },
    stepDotText: { fontSize: 13, fontWeight: "800", color: "#FFFFFF" },
    stepLine: { width: 2, flex: 1, marginTop: 4, marginBottom: 4, borderRadius: 1 },
    stepCard: {
        flex: 1, flexDirection: "row", alignItems: "flex-start", borderRadius: 16,
        padding: 14, marginLeft: 10, marginBottom: 10, borderWidth: 1,
    },
    stepIconWrap: {
        width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center",
        shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
    },
    stepTextWrap: { flex: 1, marginLeft: 12 },
    stepTitle: { fontSize: 15, fontWeight: "800", color: "#0F172A", marginBottom: 3 },
    stepDesc: { fontSize: 13, color: "#64748B", lineHeight: 19 },

    // Actions
    actions: {
        paddingTop: 16, paddingHorizontal: 20, alignItems: "center",
        backgroundColor: "#FFFFFF", borderTopWidth: 1, borderTopColor: "#E5E7EB",
    },
    primaryBtnTeal: {
        width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
        backgroundColor: "#0D9488", paddingVertical: 16, borderRadius: 16,
    },
    primaryBtnPurple: {
        width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
        backgroundColor: "#6B3AA0", paddingVertical: 16, borderRadius: 16,
    },
    primaryBtnDisabled: { opacity: 0.5 },
    primaryBtnLabel: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
    secondaryBtn: { marginTop: 14, paddingVertical: 8, paddingHorizontal: 12 },
    secondaryBtnLabel: { fontSize: 15, fontWeight: "600", color: "#94A3B8" },

    // Contact picker
    searchBar: {
        flexDirection: "row", alignItems: "center", gap: 10,
        backgroundColor: "#FFFFFF", marginHorizontal: 16, marginTop: 12, marginBottom: 8,
        paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
        borderWidth: 1, borderColor: "#E2E8F0",
    },
    searchInput: { flex: 1, fontSize: 16, fontWeight: "500", color: "#0F172A" },
    contactsHeader: {
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        paddingHorizontal: 20, paddingVertical: 12,
    },
    contactsHeaderLabel: { fontSize: 16, fontWeight: "800", color: "#111827" },
    contactsHeaderCount: { fontSize: 12, fontWeight: "700", color: "#6B3AA0", letterSpacing: 0.5 },
    contactRow: {
        flexDirection: "row", alignItems: "center", gap: 12,
        paddingVertical: 12, paddingHorizontal: 20,
        borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
    },
    contactAvatar: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: "#EDE9FE",
        alignItems: "center", justifyContent: "center",
    },
    contactInitial: { fontSize: 16, fontWeight: "700", color: "#6B3AA0" },
    contactInfo: { flex: 1 },
    contactName: { fontSize: 15, fontWeight: "600", color: "#111827" },
    contactPhone: { fontSize: 13, color: "#6B7280", marginTop: 2 },

    // Confirmation
    confirmHeroCircle: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: "#D1FAE5",
        alignItems: "center", justifyContent: "center", marginBottom: 20,
    },
    confirmTitle: { fontSize: 22, fontWeight: "900", color: "#0F172A", marginBottom: 8 },
    confirmSubtitle: { fontSize: 15, color: "#64748B", textAlign: "center", lineHeight: 22, paddingHorizontal: 12, marginBottom: 24 },
    confirmSection: { width: "100%", marginBottom: 16 },
    confirmSectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
    verifiedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981" },
    verifiedText: { fontSize: 13, fontWeight: "600", color: "#10B981" },
    confirmContactCard: {
        flexDirection: "row", alignItems: "center", gap: 12,
        backgroundColor: "#F0FDFA", borderRadius: 14, borderWidth: 1, borderColor: "#CCFBF1",
        paddingVertical: 14, paddingHorizontal: 16,
    },
    confirmContactIcon: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: "#CCFBF1",
        alignItems: "center", justifyContent: "center",
    },
    confirmContactName: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
    confirmContactPhone: { fontSize: 13, color: "#64748B", marginTop: 2 },
    changeBtnLabel: { fontSize: 14, fontWeight: "600", color: "#0D9488" },
    pinNote: {
        width: "100%", flexDirection: "row", alignItems: "flex-start", gap: 12,
        backgroundColor: "#F5F3FF", borderRadius: 14, borderWidth: 1, borderColor: "#EDE9FE",
        padding: 16,
    },
    pinNoteIcon: {
        width: 36, height: 36, borderRadius: 12, backgroundColor: "#EDE9FE",
        alignItems: "center", justifyContent: "center",
    },
    pinNoteTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A", marginBottom: 4 },
    pinNoteDesc: { fontSize: 13, color: "#64748B", lineHeight: 19 },

    // Success overlay
    successOverlay: {
        flex: 1, backgroundColor: "rgba(255,255,255,0.92)",
        justifyContent: "center", alignItems: "center", paddingHorizontal: 32,
    },
    successCard: {
        backgroundColor: "#FFFFFF", borderRadius: 24, padding: 32, alignItems: "center",
        width: "100%",
        shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 8,
    },
    successCheckCircle: {
        width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: "#0D9488",
        alignItems: "center", justifyContent: "center", marginBottom: 20,
    },
    successTitle: { fontSize: 22, fontWeight: "900", color: "#0F172A", marginBottom: 10 },
    successDesc: { fontSize: 14, color: "#64748B", textAlign: "center", lineHeight: 20, marginBottom: 24 },

    // Misc
    centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 40 },
    loadingText: { marginTop: 12, fontSize: 15, color: "#6B7280", fontWeight: "500" },
    emptyText: { fontSize: 15, color: "#9CA3AF", fontWeight: "500" },
});
