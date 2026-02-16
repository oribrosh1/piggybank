import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CreditCard, ArrowRight } from "lucide-react-native";
import { useState, useEffect } from "react";
import { routes } from "@/types/routes";
import {
  getAccountDetails,
  getIssuingBalance,
  createIssuingCardholder,
  topUpIssuing,
  createVirtualCard,
} from "@/src/lib/api";
import { useAuth } from "@/src/utils/auth";

export default function IssuingCardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { auth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCard, setHasCard] = useState(false);
  const [accountReady, setAccountReady] = useState(false);
  const [issuingBalanceCents, setIssuingBalanceCents] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [details, balance] = await Promise.all([
          getAccountDetails(),
          getIssuingBalance().catch(() => ({ issuingAvailable: 0, currency: "usd" })),
        ]);
        if (cancelled) return;
        if (details.virtualCardId) setHasCard(true);
        setIssuingBalanceCents(balance?.issuingAvailable ?? 0);
        const ind = details.individual;
        const hasRequired =
          ind?.first_name &&
          ind?.last_name &&
          ind?.address?.line1 &&
          ind?.address?.city &&
          ind?.address?.state &&
          ind?.address?.postal_code;
        setAccountReady(!!hasRequired);
      } catch (e) {
        if (!cancelled) setError("Could not load account details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleGetCard = async () => {
    if (!accountReady) {
      setError("Your account details are incomplete. Complete your profile in the Credit tab first.");
      return;
    }
    setError(null);
    setCreating(true);
    try {
      const details = await getAccountDetails();
      const ind = details.individual!;
      const email = (auth?.email || ind.email || "").trim();
      if (!email) {
        setError("We need your email to create the card.");
        setCreating(false);
        return;
      }
      if (!details.cardholderId) {
        await createIssuingCardholder({
          name: `${ind.first_name} ${ind.last_name}`.trim(),
          email,
          phone: ind.phone || undefined,
          line1: ind.address!.line1,
          line2: ind.address!.line2 || undefined,
          city: ind.address!.city,
          state: ind.address!.state,
          postal_code: ind.address!.postal_code,
        });
      }
      const balance = await getIssuingBalance();
      if ((balance?.issuingAvailable ?? 0) <= 0) {
        await topUpIssuing({ amount: 1000 });
      }
      const cardRes = await createVirtualCard({});
      setHasCard(true);
    } catch (err: any) {
      const code = err?.response?.data?.code;
      const msg = err?.response?.data?.error || err?.message || "Something went wrong";
      if (code === "card_exists") {
        setHasCard(true);
      } else {
        setError(msg);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleGoToCredit = () => {
    router.replace(routes.tabs.banking);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" }}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={{ marginTop: 12, fontSize: 15, color: "#6B7280" }}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF", paddingTop: insets.top }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: "#EDE9FE",
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "center",
            marginBottom: 20,
          }}
        >
          <CreditCard size={40} color="#8B5CF6" strokeWidth={2} />
        </View>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "800",
            color: "#111827",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          {hasCard ? "You have a virtual card" : "Get your virtual credit card"}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: "#6B7280",
            textAlign: "center",
            lineHeight: 22,
            marginBottom: 24,
          }}
        >
          {hasCard
            ? "Your card is ready. Use it in the Credit tab to view details and make payments."
            : "Create a virtual card to spend from your Credit balance. We'll use your account details to set it up."}
        </Text>

        {error ? (
          <View
            style={{
              backgroundColor: "#FEE2E2",
              borderRadius: 12,
              padding: 14,
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 14, color: "#B91C1C", fontWeight: "600" }}>{error}</Text>
          </View>
        ) : null}

        {hasCard ? (
          <TouchableOpacity
            onPress={handleGoToCredit}
            style={{
              backgroundColor: "#8B5CF6",
              borderRadius: 16,
              paddingVertical: 18,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#8B5CF6",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: "800", color: "#FFFFFF", marginRight: 8 }}>
              Go to Credit
            </Text>
            <ArrowRight size={20} color="#FFFFFF" strokeWidth={3} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleGetCard}
            disabled={creating || !accountReady}
            style={{
              backgroundColor: accountReady && !creating ? "#8B5CF6" : "#9CA3AF",
              borderRadius: 16,
              paddingVertical: 18,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#8B5CF6",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: accountReady ? 0.3 : 0,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            {creating ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={{ fontSize: 17, fontWeight: "800", color: "#FFFFFF", marginRight: 8 }}>
                  Create virtual card
                </Text>
                <ArrowRight size={20} color="#FFFFFF" strokeWidth={3} />
              </>
            )}
          </TouchableOpacity>
        )}

        {!hasCard && accountReady && (
          <Text
            style={{
              fontSize: 13,
              color: "#9CA3AF",
              textAlign: "center",
              marginTop: 16,
              paddingHorizontal: 16,
            }}
          >
            We'll add $10 to your card balance if needed. You can add more later in the Credit tab.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
