import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronRight } from "lucide-react-native";
import { getAccountStatus } from "@/src/lib/api";
import { navigateToStripeConnectOrPersonalInfo } from "@/src/lib/stripeHostedOnboarding";
import type { Event } from "@/types/events";

const stripeWordmark = require("../../../assets/images/stripe-icon.png");

type Props = {
  event: Pick<Event, "stripeAccountId">;
};

/**
 * Shown when guest gifts should route to Connect but payouts are not fully enabled yet.
 * Tapping runs Stripe hosted onboarding (browser) or routes to personal-info if no Connect account exists.
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

  const onPress = useCallback(async () => {
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
      <View style={{ paddingHorizontal: 4, marginBottom: 12, alignItems: "center" }}>
        <ActivityIndicator color="#6B4EFF" />
      </View>
    );
  }

  if (payoutsReady) return null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.92}
      disabled={opening}
      style={{ marginBottom: 16, borderRadius: 20, overflow: "hidden" }}
    >
      <LinearGradient
        colors={["#5B21B6", "#7C3AED", "#4C1D95"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingVertical: 18,
          paddingHorizontal: 18,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.2)",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 14 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image source={stripeWordmark} style={{ width: 32, height: 32 }} resizeMode="contain" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "800",
                color: "rgba(255,255,255,0.85)",
                letterSpacing: 1,
                marginBottom: 6,
              }}
            >
              PAYOUTS
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "900", color: "#FFFFFF", marginBottom: 8 }}>
              Finish payout setup
            </Text>
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.92)", lineHeight: 20, fontWeight: "500" }}>
              {event.stripeAccountId
                ? "Continue to Stripe’s secure page to finish verification so guest gifts reach your account."
                : "Create your CreditKid wallet, then verify with Stripe in the browser—guest gifts go to you."}
            </Text>
          </View>
        </View>

        <View
          style={{
            marginTop: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "rgba(255,255,255,0.18)",
            borderRadius: 14,
            paddingVertical: 14,
            paddingHorizontal: 16,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "800", color: "#FFFFFF" }}>
            {opening ? "Opening…" : "Verify with Stripe"}
          </Text>
          {opening ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <ChevronRight size={22} color="#FFFFFF" strokeWidth={2.5} />
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}
