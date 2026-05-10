import { useEffect, useState, useCallback } from "react";
import { View, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { getAccountStatus } from "@/src/lib/api";
import { navigateToStripeConnectOrPersonalInfo } from "@/src/lib/stripeHostedOnboarding";
import BankingSetupRequiredCard from "@/src/components/home/BankingSetupRequiredCard";
import type { Event } from "@/types/events";
import { colors, spacing } from "@/src/theme";

type Props = {
  event: Pick<Event, "stripeAccountId">;
};

/**
 * Shown when guest gifts should route to Connect but payouts are not fully enabled yet.
 * Uses the home banking setup card; Complete Setup opens Stripe hosted onboarding (or personal-info).
 */
export default function PayoutSetupBanner({ event }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payoutsReady, setPayoutsReady] = useState(false);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await getAccountStatus();
        if (cancelled) return;
        const ok =
          Boolean(s.exists) &&
          (s.charges_enabled ?? false) &&
          (s.payouts_enabled ?? false);
        setPayoutsReady(ok);
      } catch {
        setPayoutsReady(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [event.stripeAccountId]);

  const onCompleteSetup = useCallback(async () => {
    if (opening) return;
    setOpening(true);
    try {
      await navigateToStripeConnectOrPersonalInfo(router);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : err instanceof Error
            ? err.message
            : "Could not open Stripe. Try again.";
      Alert.alert("Setup", String(msg || "Something went wrong"));
    } finally {
      setOpening(false);
    }
  }, [router, opening]);

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (payoutsReady) return null;

  return (
    <View style={styles.bannerWrap}>
      <BankingSetupRequiredCard onCompleteSetup={onCompleteSetup} />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    marginHorizontal: spacing[4],
    marginTop: spacing[2],
    marginBottom: spacing[3],
    alignItems: "center",
    paddingVertical: spacing[2],
  },
  bannerWrap: {
    marginHorizontal: spacing[4],
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
});
