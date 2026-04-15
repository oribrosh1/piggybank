import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronRight, Wallet } from "lucide-react-native";
import { getAccountStatus } from "@/src/lib/api";
import { navigateToStripeConnectOrPersonalInfo } from "@/src/lib/stripeHostedOnboarding";
import type { Event } from "@/types/events";
import { colors, spacing, radius, fontFamily, borderGhostOutline, primaryGradient } from "@/src/theme";

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
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (payoutsReady) return null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      disabled={opening}
      style={styles.touchWrap}
      accessibilityRole="button"
      accessibilityLabel="Must do: finish payout setup with Stripe"
    >
      <View style={styles.card}>
        <View style={styles.accentBar} />

        <View style={styles.body}>
          <View style={styles.mustActionBadge} pointerEvents="none">
            <Text style={styles.mustActionBadgeText}>MUST</Text>
            <Text style={styles.mustActionBadgeSub}>DO!</Text>
          </View>

          <View style={styles.topRow}>
            <View style={styles.iconBadge}>
              <Image source={stripeWordmark} style={styles.stripeIcon} width={45} height={45} resizeMode="contain" />
            </View>
            <View style={styles.copy}>
              <View style={styles.eyebrowRow}>
                <Wallet size={12} color={colors.primary} strokeWidth={2.4} />
                <Text style={styles.eyebrow}>Payouts</Text>
              </View>
              <Text style={styles.title}>Finish payout setup</Text>
              <Text style={styles.description}>
                {event.stripeAccountId
                  ? "Continue on Stripe’s secure page to finish verification so guest gifts reach your account."
                  : "Set up your CreditKid wallet and verify with Stripe in the browser. Then guest gifts can go to you."}
              </Text>
            </View>
          </View>

          <LinearGradient
            colors={primaryGradient.colors}
            start={primaryGradient.start}
            end={primaryGradient.end}
            style={styles.cta}
          >
            {opening ? (
              <ActivityIndicator color={colors.onPrimary} size="small" />
            ) : (
              <>
                <Text style={styles.ctaLabel}>Verify with Stripe</Text>
                <ChevronRight size={18} color={colors.onPrimary} strokeWidth={2.5} />
              </>
            )}
          </LinearGradient>
        </View>
      </View>
    </TouchableOpacity>
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
  touchWrap: {
    marginHorizontal: spacing[4],
    marginTop: spacing[2],
    marginBottom: spacing[4],
    borderRadius: radius.md,
  },
  card: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    overflow: "hidden",
    ...borderGhostOutline,
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  accentBar: {
    width: 4,
    backgroundColor: colors.primary,
    opacity: 0.95,
  },
  body: {
    flex: 1,
    position: "relative",
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    paddingLeft: spacing[3],
    paddingTop: spacing[5],
    gap: spacing[4],
  },
  mustActionBadge: {
    position: "absolute",
    top: spacing[3],
    right: spacing[3],
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.85)",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 2,
  },
  mustActionBadgeText: {
    fontFamily: fontFamily.headline,
    fontSize: 11,
    fontWeight: "800",
    color: colors.onPrimary,
    letterSpacing: 0.5,
    lineHeight: 12,
  },
  mustActionBadgeSub: {
    fontFamily: fontFamily.headline,
    fontSize: 11,
    fontWeight: "800",
    color: colors.onPrimary,
    letterSpacing: 0.5,
    lineHeight: 12,
    marginTop: -1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
    paddingRight: 56,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.sm + 4,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(107, 56, 212, 0.12)",
  },
  stripeIcon: {
    width: 26,
    height: 26,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing[1],
  },
  eyebrow: {
    fontFamily: fontFamily.label,
    fontSize: 10,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: fontFamily.headline,
    fontSize: 17,
    fontWeight: "700",
    color: colors.onSurface,
    letterSpacing: -0.3,
    marginBottom: spacing[2],
    lineHeight: 22,
  },
  description: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    fontWeight: "400",
    color: colors.onSurfaceVariant,
    lineHeight: 21,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    paddingVertical: 12,
    paddingHorizontal: spacing[4],
    borderRadius: radius.sm + 4,
    minHeight: 46,
  },
  ctaLabel: {
    fontFamily: fontFamily.title,
    fontSize: 15,
    fontWeight: "700",
    color: colors.onPrimary,
    letterSpacing: 0.2,
  },
});
