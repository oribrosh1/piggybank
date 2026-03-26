import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { routes } from "@/types/routes";
import { navigateToStripeConnectOrPersonalInfo } from "@/src/lib/stripeHostedOnboarding";
import { getUserEventsStats } from "@/src/lib/eventService";
import { getUserProfile } from "@/src/lib/userService";
import {
  getAccountStatus,
  getChildCard,
  getChildTransactions,
  logApiErrorDetail,
  type ChildCardResponse,
  type ChildIssuingTransaction,
} from "@/src/lib/api";
import type { EventSummary } from "@/types/events";
import type { UserProfile } from "@/types/user";
import firebase from "@/src/firebase";
import firestore from "@react-native-firebase/firestore";

export type HomeState =
  | "empty"
  | "pre-event"
  | "pre-event-pending-banking"
  | "post-event"
  | "child-active";

export interface RSVPEntry {
  name: string;
  timeAgo: string;
  status: "attending" | "sent_gift" | "maybe" | "not_coming";
  count?: number;
}

export function useHomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [homeState, setHomeState] = useState<HomeState>("empty");

  const [childAccountId, setChildAccountId] = useState<string | null>(null);
  const [childName, setChildName] = useState<string>("Your Child");
  const [card, setCard] = useState<ChildCardResponse | null>(null);
  const [transactions, setTransactions] = useState<ChildIssuingTransaction[]>(
    []
  );

  const findChildAccount = useCallback(async (): Promise<{
    id: string;
    name: string;
  } | null> => {
    const user = firebase.auth().currentUser;
    if (!user) return null;
    const snap = await firestore()
      .collection("childAccounts")
      .where("creatorId", "==", user.uid)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return {
      id: doc.id,
      name: doc.data().childName || "Your Child",
    };
  }, []);

  const loadData = useCallback(async () => {
    try {
      const user = firebase.auth().currentUser;
      if (!user) return;

      const [profile, events] = await Promise.all([
        getUserProfile(user.uid),
        getUserEventsStats(),
      ]);

      setUserProfile(profile || null);

      const upcoming = events.filter(
        (e) => e.status === "draft" || e.status === "active"
      );
      upcoming.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const primaryEvent = upcoming[0] || null;
      setEvent(primaryEvent);

      if (!primaryEvent) {
        setHomeState("empty");
        return;
      }

      const eventDate = new Date(primaryEvent.date);
      const now = new Date();
      const isPastEvent = eventDate.getTime() < now.getTime();

      if (!isPastEvent) {
        let bankingReady = false;
        try {
          const accountStatus = await getAccountStatus();
          bankingReady = Boolean(
            accountStatus.exists &&
              accountStatus.charges_enabled &&
              accountStatus.payouts_enabled
          );
        } catch {
          bankingReady = false;
        }

        if (!bankingReady) {
          setHomeState("pre-event-pending-banking");
        } else {
          setHomeState("pre-event");
        }
        return;
      }

      const childResult = await findChildAccount();
      if (childResult) {
        setChildAccountId(childResult.id);
        setChildName(childResult.name);
        setHomeState("child-active");

        const loadChildApis = async () => {
          const [cardRes, txnRes] = await Promise.all([
            getChildCard(childResult.id),
            getChildTransactions(childResult.id, 5),
          ]);
          setCard(cardRes);
          setTransactions(txnRes.transactions);
        };
        try {
          await loadChildApis();
        } catch (err: unknown) {
          const status = (err as { response?: { status?: number } })?.response
            ?.status;
          if (status === 401) {
            logApiErrorDetail("[Home] child card 401 (will retry once)", err);
            await new Promise((r) => setTimeout(r, 800));
            await firebase.auth().currentUser?.getIdToken(true);
            try {
              await loadChildApis();
            } catch (e2) {
              logApiErrorDetail(
                "[Home] child card still failing after retry",
                e2
              );
            }
          } else {
            logApiErrorDetail("[Home] child card data failed", err);
          }
        }
      } else {
        setHomeState("post-event");
      }
    } catch (error) {
      console.error("Error loading home data:", error);
    } finally {
      setLoading(false);
    }
  }, [findChildAccount]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const getFirstName = (): string => {
    if (userProfile?.fullName) return userProfile.fullName.split(" ")[0];
    return "there";
  };

  const getChildFirstName = (): string => {
    return childName.split(" ")[0];
  };

  const getDaysUntilEvent = (): number => {
    if (!event) return 0;
    const eventDate = new Date(event.date);
    const now = new Date();
    return Math.max(
      0,
      Math.ceil(
        (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
    );
  };

  const getRsvpPercentage = (): number => {
    if (!event?.guestStats) return 0;
    const { total, confirmed, paid } = event.guestStats;
    if (total === 0) return 0;
    return Math.round(((confirmed + paid) / total) * 100);
  };

  const getTotalGifts = (): number => {
    if (!event?.guestStats) return 0;
    return event.guestStats.totalPaid / 100;
  };

  const getBalance = (): number => {
    if (card?.balance != null) return card.balance / 100;
    return getTotalGifts();
  };

  const goToEventDashboard = () => {
    if (event) router.push(routes.eventDashboard(event.id));
  };

  const goToCreateEvent = () => {
    router.push(routes.createEvent.eventType);
  };

  const goToKids = () => {
    router.push(routes.tabs.kids);
  };

  const goToMyEvents = () => {
    router.push(routes.tabs.myEvent);
  };

  /** Stripe hosted KYC or personal-info if no Connect account yet. */
  const goToBankingSetup = () => {
    void navigateToStripeConnectOrPersonalInfo(router).catch((err: unknown) => {
      console.warn("[Home] banking setup navigation failed", err);
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : err instanceof Error
            ? err.message
            : "Try again.";
      Alert.alert("Banking setup", String(msg || "Could not start setup."));
    });
  };

  const goToGifts = () => {
    router.push(routes.tabs.gifts);
  };

  const goToProfile = () => {
    router.push(routes.tabs.profile);
  };

  const getGreeting = (): string => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getFormattedEventDate = (): string => {
    if (!event?.date) return "";
    try {
      return new Date(event.date).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
    } catch {
      return event.date;
    }
  };

  return {
    loading,
    homeState,
    userProfile,
    event,
    childAccountId,
    childName,
    card,
    transactions,
    loadData,
    getFirstName,
    getChildFirstName,
    getDaysUntilEvent,
    getRsvpPercentage,
    getTotalGifts,
    getBalance,
    goToEventDashboard,
    goToCreateEvent,
    goToKids,
    goToMyEvents,
    goToBankingSetup,
    goToGifts,
    goToProfile,
    getGreeting,
    getFormattedEventDate,
  };
}
