/**
 * Child onboarding & dashboard.
 *
 * Flow when opened via deep link (creditkidapp://child?token=xxx):
 *   Step 1 – Firebase Phone Auth: child enters their phone, receives SMS code, verifies.
 *   Step 2 – PIN verification: child enters the 6-digit PIN their parent shared.
 *   Step 3 – Claim: backend validates token + phone match + PIN → creates child account,
 *            returns Stripe Ephemeral Key for the virtual card.
 *   Step 4 – Dashboard: real-time balance, gifts list, card preview.
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
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { CreditCard, Gift, DollarSign, MessageCircle, Phone, Lock, Shield, ArrowRight } from "lucide-react-native";
import { claimChildInvite } from "@/src/lib/api";
import type { Event, Guest } from "@/types/events";

type Step = "phone" | "code" | "pin" | "claiming" | "dashboard";

export default function ChildScreen() {
    const { token } = useLocalSearchParams<{ token?: string }>();
    const router = useRouter();

    // Auth
    const [step, setStep] = useState<Step>("phone");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [confirm, setConfirm] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);
    const [pin, setPin] = useState("");

    // Claim result
    const [claimError, setClaimError] = useState<string | null>(null);
    const [childAccountId, setChildAccountId] = useState<string | null>(null);
    const [eventId, setEventId] = useState<string | null>(null);
    const [ephemeralKeySecret, setEphemeralKeySecret] = useState<string | null>(null);
    const [cardLast4, setCardLast4] = useState<string | null>(null);

    // Dashboard
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [eventSnapshotReceived, setEventSnapshotReceived] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [authError, setAuthError] = useState<string | null>(null);
    const [sendingCode, setSendingCode] = useState(false);
    const [verifyingCode, setVerifyingCode] = useState(false);

    const codeInputRef = useRef<TextInput>(null);
    const pinInputRef = useRef<TextInput>(null);

    const user = auth().currentUser;

    // If user is already authenticated and we already have an account, go to dashboard
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
        if (user?.uid && user.phoneNumber) {
            loadExistingChildAccount(user.uid).then((found) => {
                if (!found && token) {
                    setStep("pin");
                }
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, [user?.uid, user?.phoneNumber, token, loadExistingChildAccount]);

    // Subscribe to event for real-time data once we have eventId
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

    // ── Step 1: Send phone verification ──
    const handleSendCode = async () => {
        const digits = phoneNumber.replace(/\D/g, "");
        if (digits.length < 10) {
            setAuthError("Please enter a valid phone number.");
            return;
        }
        const formatted = digits.length === 10 ? `+1${digits}` : digits.startsWith("1") ? `+${digits}` : `+${digits}`;

        setSendingCode(true);
        setAuthError(null);
        try {
            const confirmation = await auth().signInWithPhoneNumber(formatted);
            setConfirm(confirmation);
            setStep("code");
            setTimeout(() => codeInputRef.current?.focus(), 300);
        } catch (err: any) {
            console.error("Phone auth error:", err);
            if (err.code === "auth/invalid-phone-number") {
                setAuthError("Invalid phone number format.");
            } else if (err.code === "auth/too-many-requests") {
                setAuthError("Too many attempts. Please wait and try again.");
            } else {
                setAuthError(err.message || "Could not send verification code.");
            }
        } finally {
            setSendingCode(false);
        }
    };

    // ── Step 2: Verify SMS code ──
    const handleVerifyCode = async () => {
        if (!confirm) return;
        if (verificationCode.length < 6) {
            setAuthError("Enter the 6-digit code from the SMS.");
            return;
        }

        setVerifyingCode(true);
        setAuthError(null);
        try {
            await confirm.confirm(verificationCode);
            setStep("pin");
            setTimeout(() => pinInputRef.current?.focus(), 300);
        } catch (err: any) {
            console.error("Code verify error:", err);
            if (err.code === "auth/invalid-verification-code") {
                setAuthError("Incorrect code. Please check and try again.");
            } else {
                setAuthError(err.message || "Verification failed.");
            }
        } finally {
            setVerifyingCode(false);
        }
    };

    // ── Step 3: Submit PIN and claim ──
    const handleClaimWithPin = async () => {
        if (!token) {
            setClaimError("Missing invite token. Please re-open the link from your parent.");
            return;
        }
        if (pin.length < 6) {
            setClaimError("Enter the 6-digit PIN your parent gave you.");
            return;
        }

        setStep("claiming");
        setClaimError(null);
        try {
            const res = await claimChildInvite(token, pin);
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

    // ── Renders ──

    if (loading) {
        return (
            <View style={s.centered}>
                <ActivityIndicator size="large" color="#6B3AA0" />
            </View>
        );
    }

    // No token and not authenticated → generic welcome
    if (!token && !user?.phoneNumber && step === "phone") {
        return (
            <View style={s.centered}>
                <Gift size={48} color="#6B3AA0" strokeWidth={2} />
                <Text style={s.welcomeTitle}>Welcome to CreditKid</Text>
                <Text style={s.welcomeSubtitle}>
                    Open the link your parent sent you by SMS to see your balance and gifts.
                </Text>
            </View>
        );
    }

    // ── Step 1: Phone number entry ──
    if (step === "phone") {
        return (
            <KeyboardAvoidingView style={s.authRoot} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <ScrollView contentContainerStyle={s.authContent} keyboardShouldPersistTaps="handled">
                    <View style={s.authIconWrap}>
                        <Phone size={32} color="#6B3AA0" strokeWidth={2} />
                    </View>
                    <Text style={s.authTitle}>Verify your phone</Text>
                    <Text style={s.authSubtitle}>
                        Enter the phone number your parent registered for you. We'll send a verification code via SMS.
                    </Text>

                    <View style={s.inputRow}>
                        <Phone size={18} color="#94A3B8" strokeWidth={2} />
                        <TextInput
                            style={s.input}
                            placeholder="(555) 123-4567"
                            placeholderTextColor="#94A3B8"
                            keyboardType="phone-pad"
                            value={phoneNumber}
                            onChangeText={(t) => { setPhoneNumber(t); setAuthError(null); }}
                            autoComplete="tel"
                            autoFocus
                        />
                    </View>
                    {authError && <Text style={s.errorText}>{authError}</Text>}

                    <TouchableOpacity
                        style={[s.primaryBtn, sendingCode && s.primaryBtnDisabled]}
                        onPress={handleSendCode}
                        disabled={sendingCode}
                        activeOpacity={0.85}
                    >
                        {sendingCode ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <>
                                <ArrowRight size={18} color="#FFF" strokeWidth={2.5} />
                                <Text style={s.primaryBtnLabel}>Send Code</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={s.securityNote}>
                        <Shield size={14} color="#6B3AA0" strokeWidth={2} />
                        <Text style={s.securityText}>
                            Your phone number is verified by Firebase and never shared.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    // ── Step 2: SMS code entry ──
    if (step === "code") {
        return (
            <KeyboardAvoidingView style={s.authRoot} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <ScrollView contentContainerStyle={s.authContent} keyboardShouldPersistTaps="handled">
                    <View style={s.authIconWrap}>
                        <MessageCircle size={32} color="#6B3AA0" strokeWidth={2} />
                    </View>
                    <Text style={s.authTitle}>Enter the code</Text>
                    <Text style={s.authSubtitle}>
                        We sent a 6-digit code to {phoneNumber}. Enter it below.
                    </Text>

                    <View style={s.inputRow}>
                        <Lock size={18} color="#94A3B8" strokeWidth={2} />
                        <TextInput
                            ref={codeInputRef}
                            style={[s.input, { letterSpacing: 6, textAlign: "center" }]}
                            placeholder="000000"
                            placeholderTextColor="#CBD5E1"
                            keyboardType="number-pad"
                            maxLength={6}
                            value={verificationCode}
                            onChangeText={(t) => { setVerificationCode(t.replace(/\D/g, "")); setAuthError(null); }}
                        />
                    </View>
                    {authError && <Text style={s.errorText}>{authError}</Text>}

                    <TouchableOpacity
                        style={[s.primaryBtn, verifyingCode && s.primaryBtnDisabled]}
                        onPress={handleVerifyCode}
                        disabled={verifyingCode}
                        activeOpacity={0.85}
                    >
                        {verifyingCode ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <>
                                <ArrowRight size={18} color="#FFF" strokeWidth={2.5} />
                                <Text style={s.primaryBtnLabel}>Verify</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => { setStep("phone"); setAuthError(null); }} style={s.linkBtn}>
                        <Text style={s.linkBtnLabel}>Use a different number</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    // ── Step 3: PIN entry ──
    if (step === "pin") {
        return (
            <KeyboardAvoidingView style={s.authRoot} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <ScrollView contentContainerStyle={s.authContent} keyboardShouldPersistTaps="handled">
                    <View style={s.authIconWrap}>
                        <Lock size={32} color="#6B3AA0" strokeWidth={2} />
                    </View>
                    <Text style={s.authTitle}>Enter your PIN</Text>
                    <Text style={s.authSubtitle}>
                        Your parent gave you a 6-digit PIN. Enter it below to unlock your gifts.
                    </Text>

                    <View style={s.inputRow}>
                        <Lock size={18} color="#94A3B8" strokeWidth={2} />
                        <TextInput
                            ref={pinInputRef}
                            style={[s.input, { letterSpacing: 6, textAlign: "center" }]}
                            placeholder="000000"
                            placeholderTextColor="#CBD5E1"
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
                        style={s.primaryBtn}
                        onPress={handleClaimWithPin}
                        activeOpacity={0.85}
                    >
                        <Gift size={18} color="#FFF" strokeWidth={2.5} />
                        <Text style={s.primaryBtnLabel}>Unlock My Gifts</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    // ── Step "claiming" ──
    if (step === "claiming") {
        return (
            <View style={s.centered}>
                <ActivityIndicator size="large" color="#6B3AA0" />
                <Text style={s.claimingText}>Setting up your account...</Text>
            </View>
        );
    }

    // ── Dashboard: waiting on event data ──
    if (!eventId) {
        return (
            <View style={s.centered}>
                <ActivityIndicator size="large" color="#6B3AA0" />
            </View>
        );
    }

    if (!eventSnapshotReceived) {
        return (
            <View style={s.centered}>
                <ActivityIndicator size="large" color="#6B3AA0" />
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
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6B3AA0" />
            }
        >
            <View style={s.header}>
                <Text style={s.eventName}>{event.eventName || "My event"}</Text>
                <Text style={s.greeting}>Your balance & gifts</Text>
            </View>

            {/* Card */}
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
                        <Shield size={12} color="#10B981" strokeWidth={2.5} />
                        <Text style={s.secureBadgeText}>Secured by Stripe</Text>
                    </View>
                )}
            </View>

            {/* Balance */}
            <View style={s.balanceBlock}>
                <DollarSign size={22} color="#6B3AA0" strokeWidth={2.5} />
                <View style={s.balanceTextBlock}>
                    <Text style={s.balanceLabel}>Your balance</Text>
                    <Text style={s.balanceAmount}>
                        ${typeof totalPaidDollars === "number" ? totalPaidDollars.toFixed(2) : "0.00"}
                    </Text>
                    <Text style={s.balanceHint}>Updates when guests send you gifts</Text>
                </View>
            </View>

            {/* Gifts list */}
            <View style={s.giftsSection}>
                <View style={s.giftsHeader}>
                    <Gift size={22} color="#6B3AA0" strokeWidth={2.5} />
                    <Text style={s.giftsTitle}>Gifts from guests</Text>
                </View>
                {paidGuests.length === 0 ? (
                    <View style={s.emptyGifts}>
                        <MessageCircle size={40} color="#D1D5DB" strokeWidth={1.5} />
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
    // Auth screens
    authRoot: { flex: 1, backgroundColor: "#F9FAFB" },
    authContent: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 28,
        paddingBottom: 40,
    },
    authIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: "#F5F3FF",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
        marginBottom: 20,
    },
    authTitle: {
        fontSize: 24,
        fontWeight: "900",
        color: "#0F172A",
        textAlign: "center",
        marginBottom: 10,
    },
    authSubtitle: {
        fontSize: 15,
        color: "#64748B",
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 28,
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        paddingHorizontal: 14,
        marginBottom: 12,
    },
    input: {
        flex: 1,
        fontSize: 17,
        fontWeight: "600",
        color: "#0F172A",
        paddingVertical: 16,
        marginLeft: 10,
    },
    errorText: {
        fontSize: 13,
        color: "#EF4444",
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 12,
    },
    primaryBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#6B3AA0",
        paddingVertical: 16,
        borderRadius: 16,
        marginTop: 8,
        shadowColor: "#6B3AA0",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryBtnDisabled: { opacity: 0.7 },
    primaryBtnLabel: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
    linkBtn: { marginTop: 20, alignSelf: "center", padding: 8 },
    linkBtnLabel: { fontSize: 14, color: "#6B3AA0", fontWeight: "600" },
    securityNote: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 24,
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: "#F5F3FF",
        borderRadius: 12,
    },
    securityText: { flex: 1, fontSize: 12, color: "#6B3AA0", fontWeight: "500", lineHeight: 17 },

    // Dashboard
    container: { flex: 1, backgroundColor: "#F9FAFB" },
    content: { padding: 20, paddingBottom: 40 },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        backgroundColor: "#F9FAFB",
    },
    claimingText: { marginTop: 16, fontSize: 16, color: "#6B7280", fontWeight: "600" },
    errorSubtitle: { fontSize: 15, color: "#6B7280", textAlign: "center", marginBottom: 8 },
    welcomeTitle: { fontSize: 20, fontWeight: "800", color: "#6B3AA0", marginBottom: 12, textAlign: "center" },
    welcomeSubtitle: { fontSize: 15, color: "#6B7280", textAlign: "center", lineHeight: 22 },
    header: { marginBottom: 20 },
    eventName: { fontSize: 22, fontWeight: "800", color: "#111827" },
    greeting: { fontSize: 14, color: "#6B7280", marginTop: 4, fontWeight: "600" },
    card: {
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        backgroundColor: "#6B3AA0",
        shadowColor: "#6B3AA0",
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
    cardBalance: { fontSize: 28, fontWeight: "800", color: "#FFFFFF" },
    secureBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 16,
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: "rgba(255,255,255,0.15)",
        borderRadius: 8,
        alignSelf: "flex-start",
    },
    secureBadgeText: { fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: "700" },
    balanceBlock: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    balanceTextBlock: { marginLeft: 14, flex: 1 },
    balanceLabel: { fontSize: 12, color: "#6B7280", fontWeight: "700" },
    balanceAmount: { fontSize: 24, fontWeight: "800", color: "#10B981" },
    balanceHint: { fontSize: 11, color: "#9CA3AF", marginTop: 4, fontWeight: "500" },
    giftsSection: { marginBottom: 24 },
    giftsHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
    giftsTitle: { fontSize: 16, fontWeight: "800", color: "#6B3AA0", marginLeft: 10 },
    emptyGifts: { alignItems: "center", paddingVertical: 32, backgroundColor: "#FFFFFF", borderRadius: 16, padding: 24 },
    emptyGiftsText: { fontSize: 15, fontWeight: "700", color: "#9CA3AF", marginTop: 12 },
    emptyGiftsSubtext: { fontSize: 12, color: "#D1D5DB", marginTop: 4 },
    giftList: { gap: 12 },
    giftCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    giftCardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
    guestName: { fontSize: 15, fontWeight: "700", color: "#111827" },
    guestAmount: { fontSize: 16, fontWeight: "800", color: "#10B981" },
    guestBlessing: { fontSize: 13, color: "#6B7280", fontStyle: "italic", lineHeight: 20 },
});
