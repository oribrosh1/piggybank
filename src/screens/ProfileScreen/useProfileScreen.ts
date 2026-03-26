import { useCallback, useEffect, useState } from "react";
import { Alert, Linking } from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import firebase from "@/src/firebase";
import { getUserProfile } from "@/src/lib/userService";
import { getUserEventsStats } from "@/src/lib/eventService";
import { getAccountDetails } from "@/src/lib/api";
import type { EventSummary } from "@/types/events";
import type { UserProfile } from "@/types/user";
import { routes } from "@/types/routes";
import { navigateToStripeConnectOrPersonalInfo } from "@/src/lib/stripeHostedOnboarding";

const TERMS_URL = "https://creditkid.vercel.app/terms";
const FAQ_URL = "https://creditkid.vercel.app/terms";
const PRIVACY_URL = "https://creditkid.vercel.app/privacy";

export function useProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [primaryEvent, setPrimaryEvent] = useState<EventSummary | null>(null);
  const [bankLabel, setBankLabel] = useState<string | null>(null);
  const [bankVerified, setBankVerified] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const load = useCallback(async (isRefresh?: boolean) => {
    const user = firebase.auth().currentUser;
    if (!user) {
      setLoading(false);
      return;
    }
    if (isRefresh) setRefreshing(true);
    setPhotoUrl(user.photoURL ?? null);

    try {
      const [profile, events] = await Promise.all([
        getUserProfile(user.uid),
        getUserEventsStats(),
      ]);
      setUserProfile(profile ?? null);

      const active = events.filter((e) => e.status === "active");
      active.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setPrimaryEvent(active[0] ?? null);

      if (profile?.stripeAccountCreated) {
        try {
          const details = await getAccountDetails();
          const ext = details.external_accounts?.[0];
          if (ext?.last4) {
            const name = ext.bank_name || "Bank";
            setBankLabel(`${name} .... ${ext.last4}`);
            setBankVerified(
              Boolean(details.payouts_enabled && details.details_submitted)
            );
          }
        } catch {
          setBankLabel(null);
          setBankVerified(false);
        }
      }
    } catch (e) {
      console.error("[Profile] load error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const membershipSubtitle = (): string => {
    if (!userProfile) return "Member";
    if (userProfile.stripeAccountCreated) return "Premium Family Member";
    if ((userProfile.eventsCreated ?? 0) >= 1) return "Family Member";
    return "Member";
  };

  const guestsInvited = (): number => {
    return primaryEvent?.guestStats?.total ?? primaryEvent?.totalGuests ?? 0;
  };

  /** Guests who completed a gift payment (shown as +N badge). */
  const guestsWithGiftsBadge = (): number => {
    return primaryEvent?.guestStats?.paid ?? 0;
  };

  const totalGiftsUsd = (): number => {
    const cents = primaryEvent?.guestStats?.totalPaid ?? 0;
    return cents / 100;
  };

  const giftGoalUsd = (): number => {
    const g = totalGiftsUsd();
    if (g <= 0) return 1200;
    return Math.max(1200, Math.round(g * 1.15));
  };

  const spendingLimitLabel = (): string => {
    const monthly = userProfile?.spendingLimitMonthly;
    if (monthly != null && monthly > 0) {
      return `$${(monthly / 100).toLocaleString()} monthly threshold`;
    }
    return "Set on your child's card";
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await firebase.auth().signOut();
            await SecureStore.deleteItemAsync("userEmail");
            await SecureStore.deleteItemAsync("userPassword");
            router.replace(routes.auth.login);
          } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to sign out.");
          }
        },
      },
    ]);
  };

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return {
    loading,
    refreshing,
    userProfile,
    primaryEvent,
    photoUrl,
    displayName: userProfile?.fullName || firebase.auth().currentUser?.email?.split("@")[0] || "Parent",
    email: firebase.auth().currentUser?.email ?? null,
    membershipSubtitle: membershipSubtitle(),
    guestsInvited: guestsInvited(),
    guestsWithGiftsBadge: guestsWithGiftsBadge(),
    totalGiftsUsd: totalGiftsUsd(),
    giftGoalUsd: giftGoalUsd(),
    bankLabel,
    bankVerified,
    spendingLimitLabel: spendingLimitLabel(),
    refresh: () => load(true),
    handleSignOut,
    openFaq: () => openUrl(FAQ_URL),
    openTerms: () => openUrl(TERMS_URL),
    openPrivacy: () => openUrl(PRIVACY_URL),
    goToBankingSetup: () => {
      void navigateToStripeConnectOrPersonalInfo(router).catch((err: unknown) => {
        const msg =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
            : err instanceof Error
              ? err.message
              : "Try again.";
        Alert.alert("Banking setup", String(msg || "Could not start setup."));
      });
    },
    goToKids: () => router.push(routes.tabs.kids),
  };
}
