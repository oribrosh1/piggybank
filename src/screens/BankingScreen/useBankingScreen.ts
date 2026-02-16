import { useState, useEffect, useRef } from "react";
import { Animated } from "react-native";
import { useRouter } from "expo-router";
import {
  AccountStatusResponse,
  getAccountStatus,
  getBalance,
  GetBalanceResponse,
  getTransactions,
  Transaction,
  getAccountDetails,
  GetAccountDetailsResponse,
  getPayouts,
  Payout,
  createPayout,
  getIssuingBalance,
  GetIssuingBalanceResponse,
  topUpIssuing,
  createIssuingCardholder,
  createVirtualCard,
  testCreateTransaction,
  testAddBalance,
  testVerifyAccount,
} from "@/src/lib/api";
import { getUserProfile } from "@/src/lib/userService";
import { UserProfile } from "@/types/user";
import firebase from "@/src/firebase";
import { routes } from "@/types/routes";

export type KycStatus = "no_account" | "pending" | "approved" | "rejected";

export function useBankingScreen() {
  const router = useRouter();

  const [accountData, setAccountData] = useState<AccountStatusResponse | null>(null);
  const [accountDetails, setAccountDetails] = useState<GetAccountDetailsResponse | null>(null);
  const [balanceData, setBalanceData] = useState<GetBalanceResponse | null>(null);
  const [issuingBalance, setIssuingBalance] = useState<GetIssuingBalanceResponse | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [toppingUp, setToppingUp] = useState(false);
  const [creatingCard, setCreatingCard] = useState(false);
  const [kycStatus, setKycStatus] = useState<KycStatus>("no_account");
  const [refreshing, setRefreshing] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);

  const cardScale = useRef(new Animated.Value(0.95)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (kycStatus === "approved") {
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [kycStatus]);

  const fetchAccountData = async () => {
    try {
      const user = firebase.auth().currentUser;
      if (!user) {
        setKycStatus("no_account");
        setAccountData(null);
        setUserProfile(null);
        return;
      }

      let accountStatus: AccountStatusResponse;
      try {
        accountStatus = await getAccountStatus();
      } catch (statusErr) {
        console.warn("getAccountStatus failed:", statusErr);
        setKycStatus("no_account");
        setAccountData(null);
        setUserProfile(null);
        setBalanceData(null);
        setTransactions([]);
        setIssuingBalance(null);
        return;
      }

      setAccountData(accountStatus);

      if (!accountStatus.exists) {
        setKycStatus("no_account");
        setUserProfile(null);
        setBalanceData(null);
        setTransactions([]);
        setAccountDetails(null);
        setPayouts([]);
        setIssuingBalance(null);
        return;
      }

      try {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile ?? null);
      } catch {
        setUserProfile(null);
      }

      const approved = accountStatus.charges_enabled && accountStatus.payouts_enabled;
      const pending = accountStatus.details_submitted && !approved;

      if (approved) {
        setKycStatus("approved");
        try {
          const balance = await getBalance();
          setBalanceData(balance);
        } catch (e) {
          console.warn("Could not fetch balance:", e);
        }
        try {
          setLoadingTransactions(true);
          const txnData = await getTransactions(10);
          setTransactions(txnData.transactions || []);
        } catch (e) {
          console.warn("Could not fetch transactions:", e);
        } finally {
          setLoadingTransactions(false);
        }
        try {
          const details = await getAccountDetails();
          setAccountDetails(details);
        } catch (e) {
          console.warn("Could not fetch account details:", e);
        }
        try {
          const payoutData = await getPayouts(5);
          setPayouts(payoutData.payouts || []);
        } catch (e) {
          console.warn("Could not fetch payouts:", e);
        }
        try {
          const issuing = await getIssuingBalance();
          setIssuingBalance(issuing);
        } catch (e) {
          console.warn("Could not fetch issuing balance:", e);
          setIssuingBalance(null);
        }
      } else if (pending) {
        setKycStatus("pending");
        setBalanceData(null);
        setTransactions([]);
        setIssuingBalance(null);
      } else {
        setKycStatus("rejected");
        setBalanceData(null);
        setTransactions([]);
        setIssuingBalance(null);
      }
    } catch (error) {
      console.error("Error fetching account data:", error);
      setKycStatus("no_account");
      setAccountData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAccountData();
    setRefreshing(false);
  };

  const handleSetupCredit = () => {
    router.push(routes.banking.setup.personalInfo);
  };

  const toggleCardVisibility = () => {
    setCardVisible((v) => !v);
  };

  const handleCopyCardNumber = () => {
    alert("Card number copied!");
  };

  const handleTopUp = async (amountCents: number) => {
    try {
      setToppingUp(true);
      await topUpIssuing({ amount: amountCents });
      alert(`$${(amountCents / 100).toFixed(2)} added to card balance.`);
      onRefresh();
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      alert(message || "Failed to add funds");
    } finally {
      setToppingUp(false);
    }
  };

  const handleCreateCard = async () => {
    if (!issuingBalance?.canCreateCard) return;
    const ind = accountDetails?.individual;
    if (
      !ind?.first_name ||
      !ind?.last_name ||
      !ind?.address?.line1 ||
      !ind?.address?.city ||
      !ind?.address?.state ||
      !ind?.address?.postal_code
    ) {
      alert(
        "Complete your Stripe profile with name and full address first (you can do this in Stripe onboarding)."
      );
      return;
    }
    const email = (userProfile?.email || ind?.email || "").trim();
    if (!email) {
      alert("We need your email to create the card.");
      return;
    }
    try {
      setCreatingCard(true);
      await createIssuingCardholder({
        name: `${ind.first_name} ${ind.last_name}`.trim(),
        email,
        phone: ind.phone || undefined,
        line1: ind.address.line1,
        line2: ind.address.line2 || undefined,
        city: ind.address.city,
        state: ind.address.state,
        postal_code: ind.address.postal_code,
      });
      const cardRes = await createVirtualCard({});
      alert(`Virtual card created! Last 4: ${cardRes.last4}`);
      onRefresh();
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      alert(message || "Failed to create card");
    } finally {
      setCreatingCard(false);
    }
  };

  const handleRequestPayout = async () => {
    const availableAmount = balanceData?.available?.[0]?.amount || 0;
    if (availableAmount <= 0) {
      alert("No available balance to withdraw");
      return;
    }
    if (!accountDetails?.external_accounts?.length) {
      alert("Please add a bank account first to withdraw funds");
      return;
    }
    try {
      setRequestingPayout(true);
      const result = await createPayout({
        amount: availableAmount,
        currency: balanceData?.available?.[0]?.currency || "usd",
      });
      alert(
        `Payout requested! $${(result.amount / 100).toFixed(2)} will arrive in 1-2 business days.`
      );
      onRefresh();
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      alert(message || "Failed to request payout");
    } finally {
      setRequestingPayout(false);
    }
  };

  const handleTestVerify = async () => {
    try {
      const result = await testVerifyAccount();
      alert(result.message);
      onRefresh();
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      alert(message || "Failed to verify account");
    }
  };

  const handleTestAddBalance = async (cents: number) => {
    try {
      const result = await testAddBalance(cents);
      alert(result.message);
      onRefresh();
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      alert(message || "Failed to add test balance");
    }
  };

  const handleTestCreateTransaction = async () => {
    try {
      const result = await testCreateTransaction(2500);
      alert(result.message);
      onRefresh();
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      alert(message || "Failed to create test transaction");
    }
  };

  const balanceTotalFormatted =
    kycStatus === "approved" && balanceData?.available?.length
      ? (balanceData.available.reduce((sum, bal) => sum + bal.amount, 0) / 100).toFixed(2)
      : "0.00";

  return {
    router,
    accountData,
    accountDetails,
    balanceData,
    issuingBalance,
    userProfile,
    transactions,
    payouts,
    loading,
    loadingTransactions,
    requestingPayout,
    toppingUp,
    creatingCard,
    kycStatus,
    refreshing,
    cardVisible,
    cardScale,
    cardOpacity,
    balanceTotalFormatted,
    onRefresh,
    handleSetupCredit,
    toggleCardVisibility,
    handleCopyCardNumber,
    handleTopUp,
    handleCreateCard,
    handleRequestPayout,
    handleTestVerify,
    handleTestAddBalance,
    handleTestCreateTransaction,
  };
}
