/**
 * Child onboarding & dashboard.
 *
 * Flow when opened via deep link (creditkidapp://child?token=xxx):
 *   Step 1 – PIN entry: child enters the 6-digit PIN from the SMS.
 *   Step 2 – Claim: backend validates token + PIN → creates child account,
 *            returns Firebase Custom Token for auto-login.
 *   Step 3 – Dashboard: real-time balance, gifts list, card preview.
 *
 * Returning child users (already claimed) skip straight to the dashboard.
 */
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { LinearGradient } from "expo-linear-gradient";
import { CreditCard, Gift, DollarSign, MessageCircle, Lock, Shield } from "lucide-react-native";
import { claimChildInvite } from "@/src/lib/api";
import type { Event, Guest } from "@/types/events";
import { colors, primaryGradient, radius, spacing, ambientShadow, fontFamily } from "@/src/theme";

type Step = "pin" | "claiming" | "dashboard";

export default function ChildScreen() {
    const { token } = useLocalSearchParams<{ token?: string }>();
    const router = useRouter();

    const [step, setStep] = useState<Step>("pin");
    const [pin, setPin] = useState("");

    const [claimError, setClaimError] = useState<string | null>(null);
    const [childAccountId, setChildAccountId] = useState<string | null>(null);
    const [eventId, setEventId] = useState<string | null>(null);
    const [ephemeralKeySecret, setEphemeralKeySecret] = useState<string | null>(null);
    const [cardLast4, setCardLast4] = useState<string | null>(null);

    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [eventSnapshotReceived, setEventSnapshotReceived] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const pinInputRef = useRef<TextInput>(null);

    const user = auth().currentUser;

    const loadExistingChildAccount = useCallback(async (uid: string) => {
        const snapshot = await firestore()
            .collection("childAccounts")
            .where("userId", "==", uid)
            .limit(1)
            .get();
        if (snapshot.empty) return false;
        const doc = snapshot.docs[0];
        const data = doc.data();
        setChildAccountId(doc.id);
        setEventId(data.eventId || null);
        setStep("dashboard");
        return true;
    }, []);

    useEffect(() => {
        if (user?.uid) {
            loadExistingChildAccount(user.uid).then((found) => {
                if (!found && token) {
                    setStep("pin");
                    setTimeout(() => pinInputRef.current?.focus(), 300);
                }
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, [user?.uid, token, loadExistingChildAccount]);

    useEffect(() => {
        if (!eventId) {
            setEvent(null);
            setEventSnapshotReceived(false);
            return;
        }
        setEventSnapshotReceived(false);
        const unsubscribe = firestore()
            .collection("events")
            .doc(eventId)
            .onSnapshot(
                (snap) => {
                    setEventSnapshotReceived(true);
                    if (!snap.exists) {
                        setEvent(null);
                        return;
                    }
                    const data = snap.data()!;
                    setEvent({
                        ...data,
                        id: snap.id,
                        createdAt: data.createdAt?.toDate?.() ?? new Date(),
                        updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
                    } as Event);
                },
                (err) => {
                    console.warn("Child event listener error:", err);
                    setEvent(null);
                }
            );
        return () => unsubscribe();
    }, [eventId]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        if (user?.uid) await loadExistingChildAccount(user.uid);
        setRefreshing(false);
    }, [user?.uid, loadExistingChildAccount]);

    const handleClaimWithPin = async () => {
        if (!token) {
            setClaimError("Missing invite token. Please re-open the link from the SMS.");
            return;
        }
        if (pin.length < 6) {
            setClaimError("Enter the 6-digit code from the SMS.");
            return;
        }

        setStep("claiming");
        setClaimError(null);
        try {
            const res = await claimChildInvite(token, pin);

            // Auto-login with the custom token from the backend
            await auth().signInWithCustomToken(res.customToken);

            setChildAccountId(res.childAccountId);
            setEventId(res.eventId);
            if (res.ephemeralKeySecret) setEphemeralKeySecret(res.ephemeralKeySecret);
            if (res.cardLast4) setCardLast4(res.cardLast4);
            setStep("dashboard");
        } catch (err: any) {
            const serverMsg = err?.response?.data?.error;
            setClaimError(serverMsg || err?.message || "Could not verify. Please try again.");
            setStep("pin");
        }
    };

    if (loading) {
        return (
            <View style={s.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!token && step === "pin" && !user) {
        return (
            <View style={s.centered}>
                <Gift size={48} color={colors.primary} strokeWidth={2} />
                <Text style={s.welcomeTitle}>Welcome to CreditKid</Text>
                <Text style={s.welcomeSubtitle}>
                    Open the link from the SMS your parent sent you to see your balance and gifts.
                </Text>
            </View>
        );
    }

    // ── PIN entry ──
    if (step === "pin") {
        return (
            <KeyboardAvoidingView style={s.authRoot} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <ScrollView contentContainerStyle={s.authContent} keyboardShouldPersistTaps="handled">
                    <View style={s.authIconWrap}>
                        <Lock size={32} color={colors.primary} strokeWidth={2} />
                    </View>
                    <Text style={s.authTitle}>Enter your code</Text>
                    <Text style={s.authSubtitle}>
                        Enter the 6-digit code from the SMS your parent sent you.
                    </Text>

                    <View style={s.inputRow}>
                        <Lock size={18} color={colors.muted} strokeWidth={2} />
                        <TextInput
                            ref={pinInputRef}
                            style={[s.input, { letterSpacing: 6, textAlign: "center" }]}
                            placeholder="000000"
                            placeholderTextColor={colors.muted}
                            keyboardType="number-pad"
                            maxLength={6}
                            secureTextEntry
                            value={pin}
                            onChangeText={(t) => { setPin(t.replace(/\D/g, "")); setClaimError(null); }}
                            autoFocus
                        />
                    </View>
                    {claimError && <Text style={s.errorText}>{claimError}</Text>}

                    <TouchableOpacity
                        style={s.primaryBtnWrap}
                        onPress={handleClaimWithPin}
                        activeOpacity={0.85}
                    >
                        <LinearGradient {...primaryGradient} style={s.primaryBtnGradient}>
                            <Gift size={18} color={colors.onPrimary} strokeWidth={2.5} />
                            <Text style={s.primaryBtnLabel}>Unlock My Gifts</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={s.securityNote}>
                        <Shield size={14} color={colors.primary} strokeWidth={2} />
                        <Text style={s.securityText}>
                            This code is single-use and was sent to your phone by your parent.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    if (step === "claiming") {
        return (
            <View style={s.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={s.claimingText}>Setting up your account...</Text>
            </View>
        );
    }

    if (!eventId) {
        return (
            <View style={s.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!eventSnapshotReceived) {
        return (
            <View style={s.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={s.claimingText}>Loading your event...</Text>
            </View>
        );
    }

    if (event === null) {
        return (
            <View style={s.centered}>
                <Text style={s.errorSubtitle}>Event not found.</Text>
            </View>
        );
    }

    // ── Dashboard ──
    const paidGuests: Guest[] = event?.guests?.filter((g) => g.status === "paid") ?? [];
    const totalPaidCents = event?.guestStats?.totalPaid ?? 0;
    const totalPaidDollars = totalPaidCents >= 100 ? totalPaidCents / 100 : totalPaidCents;

    return (
        <ScrollView
            style={s.container}
            contentContainerStyle={s.content}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
        >
            <View style={s.header}>
                <Text style={s.eventName}>{event.eventName || "My event"}</Text>
                <Text style={s.greeting}>Your balance & gifts</Text>
            </View>

            <View style={s.card}>
                <View style={s.cardInner}>
                    <View style={s.cardRow}>
                        <Text style={s.cardLabel}>CreditKid</Text>
                        <CreditCard size={24} color="rgba(255,255,255,0.9)" strokeWidth={2} />
                    </View>
                    {cardLast4 && (
                        <Text style={s.cardNumber}>•••• •••• •••• {cardLast4}</Text>
                    )}
                    <Text style={s.cardBalanceLabel}>BALANCE</Text>
                    <Text style={s.cardBalance}>
                        ${typeof totalPaidDollars === "number" ? totalPaidDollars.toFixed(2) : "0.00"}
                    </Text>
                </View>
                {ephemeralKeySecret && (
                    <View style={s.secureBadge}>
                        <Shield size={12} color={colors.secondary} strokeWidth={2.5} />
                        <Text style={s.secureBadgeText}>Secured by Stripe</Text>
                    </View>
                )}
            </View>

            <View style={s.balanceBlock}>
                <DollarSign size={22} color={colors.primary} strokeWidth={2.5} />
                <View style={s.balanceTextBlock}>
                    <Text style={s.balanceLabel}>Your balance</Text>
                    <Text style={s.balanceAmount}>
                        ${typeof totalPaidDollars === "number" ? totalPaidDollars.toFixed(2) : "0.00"}
                    </Text>
                    <Text style={s.balanceHint}>Updates when guests send you gifts</Text>
                </View>
            </View>

            <View style={s.giftsSection}>
                <View style={s.giftsHeader}>
                    <Gift size={22} color={colors.primary} strokeWidth={2.5} />
                    <Text style={s.giftsTitle}>Gifts from guests</Text>
                </View>
                {paidGuests.length === 0 ? (
                    <View style={s.emptyGifts}>
                        <MessageCircle size={40} color={colors.outlineVariant} strokeWidth={1.5} />
                        <Text style={s.emptyGiftsText}>No gifts yet</Text>
                        <Text style={s.emptyGiftsSubtext}>When guests send you money, they'll appear here.</Text>
                    </View>
                ) : (
                    <View style={s.giftList}>
                        {paidGuests.map((guest) => {
                            const amount = guest.paymentAmount ?? 0;
                            const amountDollars = amount >= 100 ? amount / 100 : amount;
                            return (
                                <View key={guest.id} style={s.giftCard}>
                                    <View style={s.giftCardRow}>
                                        <Text style={s.guestName}>{guest.name}</Text>
                                        <Text style={s.guestAmount}>+${amountDollars.toFixed(2)}</Text>
                                    </View>
                                    {guest.blessing ? (
                                        <Text style={s.guestBlessing}>&quot;{guest.blessing}&quot;</Text>
                                    ) : null}
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    authRoot: { flex: 1, backgroundColor: "transparent" },
    authContent: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 28, paddingBottom: 40 },
    authIconWrap: {
        width: 64,
        height: 64,
        borderRadius: radius.md,
        backgroundColor: colors.surfaceContainerLow,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
        marginBottom: 20,
    },
    authTitle: {
        fontSize: 24,
        fontWeight: "900",
        color: colors.onSurface,
        fontFamily: fontFamily.display,
        textAlign: "center",
        marginBottom: 10,
    },
    authSubtitle: {
        fontSize: 15,
        color: colors.onSurfaceVariant,
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 28,
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surfaceContainerLowest,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: "rgba(203, 195, 215, 0.15)",
        paddingHorizontal: 14,
        marginBottom: spacing[3],
    },
    input: {
        flex: 1,
        fontSize: 17,
        fontWeight: "600",
        color: colors.onSurface,
        paddingVertical: 16,
        marginLeft: 10,
    },
    errorText: { fontSize: 13, color: "#EF4444", fontWeight: "600", textAlign: "center", marginBottom: 12 },
    primaryBtnWrap: {
        marginTop: spacing[2],
        borderRadius: radius.md,
        overflow: "hidden",
        ...ambientShadow,
        shadowColor: colors.primary,
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 4,
    },
    primaryBtnGradient: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing[2],
        paddingVertical: spacing[4],
        borderRadius: radius.md,
    },
    primaryBtnLabel: { fontSize: 16, fontWeight: "700", color: colors.onPrimary, fontFamily: fontFamily.title },
    securityNote: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[2],
        marginTop: spacing[6],
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: colors.surfaceContainerLow,
        borderRadius: radius.sm,
    },
    securityText: { flex: 1, fontSize: 12, color: colors.primary, fontWeight: "500", lineHeight: 17 },

    container: { flex: 1, backgroundColor: "transparent" },
    content: { padding: 20, paddingBottom: 40 },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: spacing[6],
        backgroundColor: "transparent",
    },
    claimingText: {
        marginTop: spacing[4],
        fontSize: 16,
        color: colors.onSurfaceVariant,
        fontWeight: "600",
    },
    errorSubtitle: { fontSize: 15, color: colors.onSurfaceVariant, textAlign: "center", marginBottom: spacing[2] },
    welcomeTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: colors.primary,
        marginBottom: spacing[3],
        textAlign: "center",
        fontFamily: fontFamily.display,
    },
    welcomeSubtitle: { fontSize: 15, color: colors.onSurfaceVariant, textAlign: "center", lineHeight: 22 },
    header: { marginBottom: 20 },
    eventName: { fontSize: 22, fontWeight: "800", color: colors.onSurface, fontFamily: fontFamily.display },
    greeting: { fontSize: 14, color: colors.onSurfaceVariant, marginTop: 4, fontWeight: "600" },
    card: {
        borderRadius: radius.md,
        padding: spacing[6],
        marginBottom: 20,
        backgroundColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    cardInner: {},
    cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    cardLabel: { fontSize: 18, fontWeight: "800", color: "rgba(255,255,255,0.95)" },
    cardNumber: { fontSize: 16, fontWeight: "700", color: "rgba(255,255,255,0.7)", letterSpacing: 2, marginBottom: 16 },
    cardBalanceLabel: { fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: "700", marginBottom: 4 },
    cardBalance: { fontSize: 28, fontWeight: "800", color: colors.onPrimary },
    secureBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 16,
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: "rgba(255,255,255,0.15)",
        borderRadius: radius.sm,
        alignSelf: "flex-start",
    },
    secureBadgeText: { fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: "700" },
    balanceBlock: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surfaceContainerLowest,
        borderRadius: radius.md,
        padding: 20,
        marginBottom: spacing[6],
        shadowColor: colors.onSurface,
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    balanceTextBlock: { marginLeft: 14, flex: 1 },
    balanceLabel: { fontSize: 12, color: colors.onSurfaceVariant, fontWeight: "700" },
    balanceAmount: { fontSize: 24, fontWeight: "800", color: colors.secondary },
    balanceHint: { fontSize: 11, color: colors.muted, marginTop: 4, fontWeight: "500" },
    giftsSection: { marginBottom: spacing[6] },
    giftsHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
    giftsTitle: { fontSize: 16, fontWeight: "800", color: colors.primary, marginLeft: 10, fontFamily: fontFamily.display },
    emptyGifts: {
        alignItems: "center",
        paddingVertical: 32,
        backgroundColor: colors.surfaceContainerLowest,
        borderRadius: radius.md,
        padding: spacing[6],
    },
    emptyGiftsText: { fontSize: 15, fontWeight: "700", color: colors.muted, marginTop: 12 },
    emptyGiftsSubtext: { fontSize: 12, color: colors.outlineVariant, marginTop: 4 },
    giftList: { gap: 12 },
    giftCard: {
        backgroundColor: colors.surfaceContainerLowest,
        borderRadius: radius.md,
        padding: spacing[4],
        shadowColor: colors.onSurface,
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    giftCardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
    guestName: { fontSize: 15, fontWeight: "700", color: colors.onSurface },
    guestAmount: { fontSize: 16, fontWeight: "800", color: colors.secondary },
    guestBlessing: { fontSize: 13, color: colors.onSurfaceVariant, fontStyle: "italic", lineHeight: 20 },
});
