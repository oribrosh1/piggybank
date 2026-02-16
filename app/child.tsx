/**
 * Child dashboard: single screen when the child opens the link from parent's SMS.
 * Shows: card, real-time balance, scrollable gifts list (blessings + amounts).
 * Access: deep link creditkidapp://child?token=xxx → claim account → this screen.
 */
import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { CreditCard, Gift, DollarSign, MessageCircle } from "lucide-react-native";
import { claimChildInvite } from "../src/lib/api";
import type { Event, Guest } from "../types/events";

const CHILD_UID_PREFIX = "child_";

function isChildUser(uid: string | undefined): boolean {
    return !!uid && uid.startsWith(CHILD_UID_PREFIX);
}

export default function ChildScreen() {
    const { token } = useLocalSearchParams<{ token?: string }>();
    const router = useRouter();
    const [claiming, setClaiming] = useState(false);
    const [claimError, setClaimError] = useState<string | null>(null);
    const [childAccountId, setChildAccountId] = useState<string | null>(null);
    const [eventId, setEventId] = useState<string | null>(null);
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [eventSnapshotReceived, setEventSnapshotReceived] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const user = auth().currentUser;
    const isChild = isChildUser(user?.uid);

    const loadChildAccountAndEvent = useCallback(async (uid: string) => {
        const snapshot = await firestore()
            .collection("childAccounts")
            .where("userId", "==", uid)
            .limit(1)
            .get();
        if (snapshot.empty) {
            setChildAccountId(null);
            setEventId(null);
            setEvent(null);
            return;
        }
        const doc = snapshot.docs[0];
        const data = doc.data();
        setChildAccountId(doc.id);
        setEventId(data.eventId || null);
    }, []);

    // Claim invite when we have a token and are not yet a child user
    useEffect(() => {
        if (!token || isChild) {
            if (isChild && user?.uid) {
                loadChildAccountAndEvent(user.uid).finally(() => setLoading(false));
            } else {
                setLoading(false);
            }
            return;
        }

        let cancelled = false;
        setClaiming(true);
        setClaimError(null);
        claimChildInvite(token)
            .then(async (res) => {
                if (cancelled) return;
                const authInstance = auth();
                await (authInstance as any).signInWithCustomToken(res.customToken);
                setChildAccountId(res.childAccountId);
                setEventId(res.eventId);
                setClaiming(false);
                setLoading(false);
            })
            .catch((err) => {
                if (!cancelled) {
                    setClaimError(err?.response?.data?.error || err?.message || "Invalid or expired link.");
                    setClaiming(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [token, isChild, user?.uid, loadChildAccountAndEvent]);

    // Once we have eventId, subscribe to event for real-time balance and guests
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
        if (user?.uid) await loadChildAccountAndEvent(user.uid);
        setRefreshing(false);
    }, [user?.uid, loadChildAccountAndEvent]);

    const paidGuests: Guest[] = event?.guests?.filter((g) => g.status === "paid") ?? [];
    const totalPaidCents = event?.guestStats?.totalPaid ?? 0;
    const totalPaidDollars = totalPaidCents >= 100 ? totalPaidCents / 100 : totalPaidCents;

    if (claiming) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#6B3AA0" />
                <Text style={styles.claimingText}>Setting up your account...</Text>
            </View>
        );
    }

    if (claimError) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorTitle}>Couldn't open the link</Text>
                <Text style={styles.errorSubtitle}>{claimError}</Text>
                <Text style={styles.errorHint}>Ask your parent to send you a new link.</Text>
            </View>
        );
    }

    if (!isChild && !token) {
        return (
            <View style={styles.centered}>
                <Gift size={48} color="#6B3AA0" strokeWidth={2} style={{ marginBottom: 16 }} />
                <Text style={styles.welcomeTitle}>Welcome to CreditKid</Text>
                <Text style={styles.welcomeSubtitle}>
                    Open the link your parent sent you by SMS to see your balance and gifts.
                </Text>
            </View>
        );
    }

    if (!eventId || loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#6B3AA0" />
            </View>
        );
    }

    if (!eventSnapshotReceived) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#6B3AA0" />
                <Text style={styles.claimingText}>Loading your event...</Text>
            </View>
        );
    }

    if (event === null) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorSubtitle}>Event not found.</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6B3AA0" />
            }
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.eventName}>{event.eventName || "My event"}</Text>
                <Text style={styles.greeting}>Your balance & gifts</Text>
            </View>

            {/* Card (visual) */}
            <View style={styles.card}>
                <View style={styles.cardInner}>
                    <View style={styles.cardRow}>
                        <Text style={styles.cardLabel}>CreditKid</Text>
                        <CreditCard size={24} color="rgba(255,255,255,0.9)" strokeWidth={2} />
                    </View>
                    <Text style={styles.cardBalanceLabel}>BALANCE</Text>
                    <Text style={styles.cardBalance}>
                        ${typeof totalPaidDollars === "number" ? totalPaidDollars.toFixed(2) : "0.00"}
                    </Text>
                </View>
            </View>

            {/* Balance (real-time) */}
            <View style={styles.balanceBlock}>
                <DollarSign size={22} color="#6B3AA0" strokeWidth={2.5} />
                <View style={styles.balanceTextBlock}>
                    <Text style={styles.balanceLabel}>Your balance</Text>
                    <Text style={styles.balanceAmount}>
                        ${typeof totalPaidDollars === "number" ? totalPaidDollars.toFixed(2) : "0.00"}
                    </Text>
                    <Text style={styles.balanceHint}>Updates when guests send you gifts</Text>
                </View>
            </View>

            {/* Gifts list */}
            <View style={styles.giftsSection}>
                <View style={styles.giftsHeader}>
                    <Gift size={22} color="#6B3AA0" strokeWidth={2.5} />
                    <Text style={styles.giftsTitle}>Gifts from guests</Text>
                </View>
                {paidGuests.length === 0 ? (
                    <View style={styles.emptyGifts}>
                        <MessageCircle size={40} color="#D1D5DB" strokeWidth={1.5} />
                        <Text style={styles.emptyGiftsText}>No gifts yet</Text>
                        <Text style={styles.emptyGiftsSubtext}>When guests send you money, they'll appear here.</Text>
                    </View>
                ) : (
                    <View style={styles.giftList}>
                        {paidGuests.map((guest) => {
                            const amount = guest.paymentAmount ?? 0;
                            const amountDollars = amount >= 100 ? amount / 100 : amount;
                            return (
                                <View key={guest.id} style={styles.giftCard}>
                                    <View style={styles.giftCardRow}>
                                        <Text style={styles.guestName}>{guest.name}</Text>
                                        <Text style={styles.guestAmount}>+${amountDollars.toFixed(2)}</Text>
                                    </View>
                                    {guest.blessing ? (
                                        <Text style={styles.guestBlessing}>&quot;{guest.blessing}&quot;</Text>
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

const styles = StyleSheet.create({
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
    errorTitle: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 8, textAlign: "center" },
    errorSubtitle: { fontSize: 15, color: "#6B7280", textAlign: "center", marginBottom: 8 },
    errorHint: { fontSize: 13, color: "#9CA3AF", textAlign: "center" },
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
    cardBalanceLabel: { fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: "700", marginBottom: 4 },
    cardBalance: { fontSize: 28, fontWeight: "800", color: "#FFFFFF" },
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
