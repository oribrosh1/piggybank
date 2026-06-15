import { useState, useEffect, useCallback } from "react";
import {
  getChildCard,
  freezeChildCard,
  unfreezeChildCard,
  updateChildSpendingLimits,
  updateChildBlockedCategories,
  getChildTransactions,
  getChildSpendingSummary,
  sendChildInvite,
  testLinkChildAccount,
  getPendingInvite,
  revokeChildInvite,
  getAccountStatus,
  ChildCardResponse,
  ChildIssuingTransaction,
  ChildSpendingSummaryResponse,
  PendingInviteResponse,
} from "@/src/lib/api";
import firebase from "@/src/firebase";
import firestore from "@react-native-firebase/firestore";
import { Alert } from "react-native";

export function useKidsScreen() {
  const [childAccountId, setChildAccountId] = useState<string | null>(null);
  const [card, setCard] = useState<ChildCardResponse | null>(null);
  const [transactions, setTransactions] = useState<ChildIssuingTransaction[]>([]);
  const [hasMoreTxns, setHasMoreTxns] = useState(false);
  const [summary, setSummary] = useState<ChildSpendingSummaryResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [freezing, setFreezing] = useState(false);
  const [updatingLimits, setUpdatingLimits] = useState(false);
  const [updatingCategories, setUpdatingCategories] = useState(false);
  const [loadingMoreTxns, setLoadingMoreTxns] = useState(false);
  const [limitsModalVisible, setLimitsModalVisible] = useState(false);
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [testLinking, setTestLinking] = useState(false);
  const [pendingInvite, setPendingInvite] = useState<PendingInviteResponse | null>(null);
  const [revokingInvite, setRevokingInvite] = useState(false);
  const [bankingReady, setBankingReady] = useState(false);
  const [bankingLoading, setBankingLoading] = useState(true);
  const [latestEventMeta, setLatestEventMeta] = useState<{
    id: string;
    childName?: string;
    eventName?: string;
    age?: string;
    honoreePhotoUrl?: string;
  } | null>(null);

  const loadBankingStatus = useCallback(async () => {
    try {
      const s = await getAccountStatus();
      const ok =
        Boolean(s.exists) &&
        (s.charges_enabled ?? false) &&
        (s.payouts_enabled ?? false);
      setBankingReady(ok);
    } catch {
      setBankingReady(false);
    } finally {
      setBankingLoading(false);
    }
  }, []);

  const findChildAccount = useCallback(async (): Promise<string | null> => {
    const user = firebase.auth().currentUser;
    if (!user) return null;

    const snap = await firestore()
      .collection("childAccounts")
      .where("creatorId", "==", user.uid)
      .limit(1)
      .get();

    if (snap.empty) return null;
    return snap.docs[0].id;
  }, []);

  const fetchAll = useCallback(
    async (accountId: string) => {
      try {
        const [cardRes, txnRes, summaryRes] = await Promise.all([
          getChildCard(accountId),
          getChildTransactions(accountId, 10),
          getChildSpendingSummary(accountId, "month"),
        ]);
        setCard(cardRes);
        setTransactions(txnRes.transactions);
        setHasMoreTxns(txnRes.hasMore);
        setSummary(summaryRes);
      } catch (err: any) {
        console.error("[useKidsScreen] fetchAll error:", err.message);
      }
    },
    []
  );

  const findLatestEvent = useCallback(async (): Promise<{
    id: string;
    childName?: string;
    eventName?: string;
    age?: string;
    honoreePhotoUrl?: string;
  } | null> => {
    const user = firebase.auth().currentUser;
    if (!user) return null;
    const snap = await firestore()
      .collection("events")
      .where("creatorId", "==", user.uid)
      .limit(5)
      .get();
    if (snap.empty) return null;
    let best = snap.docs[0];
    for (const doc of snap.docs) {
      const ts = doc.data().createdAt?.toMillis?.() ?? 0;
      const bestTs = best.data().createdAt?.toMillis?.() ?? 0;
      if (ts > bestTs) best = doc;
    }
    const data = best.data();
    return {
      id: best.id,
      childName: typeof data.childName === "string" ? data.childName : undefined,
      eventName: typeof data.eventName === "string" ? data.eventName : undefined,
      age: typeof data.age === "string" ? data.age : data.age != null ? String(data.age) : undefined,
      honoreePhotoUrl:
        typeof data.honoreePhotoUrl === "string" && data.honoreePhotoUrl.trim()
          ? data.honoreePhotoUrl.trim()
          : undefined,
    };
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setBankingLoading(true);
    try {
      const [accountId, eventMeta] = await Promise.all([
        findChildAccount(),
        findLatestEvent(),
        loadBankingStatus(),
      ]);
      setChildAccountId(accountId);
      setLatestEventMeta(eventMeta);
      if (accountId) {
        await fetchAll(accountId);
      } else if (eventMeta?.id) {
        try {
          const invite = await getPendingInvite(eventMeta.id);
          setPendingInvite(invite);
        } catch {
          setPendingInvite(null);
        }
      }
    } catch (err: any) {
      console.error("[useKidsScreen] loadInitial error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [findChildAccount, findLatestEvent, fetchAll, loadBankingStatus]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setBankingLoading(true);
    try {
      const [accountId, eventMeta] = await Promise.all([
        childAccountId ? Promise.resolve(childAccountId) : findChildAccount(),
        findLatestEvent(),
        loadBankingStatus(),
      ]);
      setLatestEventMeta(eventMeta);
      if (accountId) {
        setChildAccountId(accountId);
        await fetchAll(accountId);
      } else if (eventMeta?.id) {
        try {
          const invite = await getPendingInvite(eventMeta.id);
          setPendingInvite(invite);
        } catch {
          setPendingInvite(null);
        }
      }
    } finally {
      setRefreshing(false);
    }
  }, [childAccountId, findChildAccount, findLatestEvent, fetchAll, loadBankingStatus]);

  const handleToggleFreeze = useCallback(async () => {
    if (!childAccountId || !card) return;
    const isFrozen = card.card.status === "inactive";
    setFreezing(true);
    try {
      if (isFrozen) {
        await unfreezeChildCard(childAccountId);
      } else {
        await freezeChildCard(childAccountId);
      }
      const updated = await getChildCard(childAccountId);
      setCard(updated);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update card status");
    } finally {
      setFreezing(false);
    }
  }, [childAccountId, card]);

  const handleUpdateLimits = useCallback(
    async (limits: { daily?: number; weekly?: number; monthly?: number; perTransaction?: number }) => {
      if (!childAccountId) return;
      setUpdatingLimits(true);
      try {
        await updateChildSpendingLimits(childAccountId, limits);
        const updated = await getChildCard(childAccountId);
        setCard(updated);
        setLimitsModalVisible(false);
      } catch (err: any) {
        Alert.alert("Error", err.message || "Failed to update spending limits");
      } finally {
        setUpdatingLimits(false);
      }
    },
    [childAccountId]
  );

  const handleToggleCategory = useCallback(
    async (category: string, blocked: boolean) => {
      if (!childAccountId || !card) return;
      setUpdatingCategories(true);
      try {
        const current = card.card.spendingControls?.blocked_categories || [];
        const updated = blocked
          ? [...current, category]
          : current.filter((c) => c !== category);
        await updateChildBlockedCategories(childAccountId, updated);
        const cardRes = await getChildCard(childAccountId);
        setCard(cardRes);
      } catch (err: any) {
        Alert.alert("Error", err.message || "Failed to update blocked categories");
      } finally {
        setUpdatingCategories(false);
      }
    },
    [childAccountId, card]
  );

  const handleLoadMoreTransactions = useCallback(async () => {
    if (!childAccountId || !hasMoreTxns || loadingMoreTxns) return;
    setLoadingMoreTxns(true);
    try {
      const lastId = transactions[transactions.length - 1]?.id;
      const res = await getChildTransactions(childAccountId, 10, lastId);
      setTransactions((prev) => [...prev, ...res.transactions]);
      setHasMoreTxns(res.hasMore);
    } catch (err: any) {
      console.error("[useKidsScreen] loadMore error:", err.message);
    } finally {
      setLoadingMoreTxns(false);
    }
  }, [childAccountId, hasMoreTxns, loadingMoreTxns, transactions]);

  const handleSendInvite = useCallback(
    async (childPhone: string, childName: string) => {
      if (!latestEventMeta?.id) {
        Alert.alert("No Event", "Please create an event first before linking your child.");
        return;
      }
      setSendingInvite(true);
      try {
        const res = await sendChildInvite(latestEventMeta.id, childPhone, childName);
        if (res.smsSkipped && res.devInviteLink && res.devPin) {
          Alert.alert(
            "Invite created (test mode)",
            `Twilio is not configured — SMS was not sent.\n\nLink:\n${res.devInviteLink}\n\nPIN: ${res.devPin}`,
            [{ text: "OK" }]
          );
        }
        await loadInitial();
      } catch (err: any) {
        Alert.alert("Error", err.message || "Failed to send invite");
      } finally {
        setSendingInvite(false);
      }
    },
    [latestEventMeta?.id, loadInitial]
  );

  const handleRevokeInvite = useCallback(async () => {
    if (!latestEventMeta?.id) return;
    setRevokingInvite(true);
    try {
      await revokeChildInvite(latestEventMeta.id);
      setPendingInvite(null);
      Alert.alert("Invite Cancelled", "The pending invite has been revoked.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to revoke invite");
    } finally {
      setRevokingInvite(false);
    }
  }, [latestEventMeta?.id]);

  const handleTestLink = useCallback(async () => {
    setTestLinking(true);
    try {
      await testLinkChildAccount();
      await loadInitial();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create test account");
    } finally {
      setTestLinking(false);
    }
  }, [loadInitial]);

  return {
    childAccountId,
    card,
    transactions,
    hasMoreTxns,
    summary,
    loading,
    refreshing,
    freezing,
    updatingLimits,
    updatingCategories,
    loadingMoreTxns,
    limitsModalVisible,
    setLimitsModalVisible,
    linkModalVisible,
    setLinkModalVisible,
    sendingInvite,
    testLinking,
    pendingInvite,
    revokingInvite,
    bankingReady,
    bankingLoading,
    latestEventMeta,
    onRefresh,
    handleToggleFreeze,
    handleUpdateLimits,
    handleToggleCategory,
    handleLoadMoreTransactions,
    handleSendInvite,
    handleRevokeInvite,
    handleTestLink,
  };
}
