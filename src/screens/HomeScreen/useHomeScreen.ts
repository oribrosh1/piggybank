import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { routes } from "@/types/routes";
import { getUserEventsStats } from "@/src/lib/eventService";
import { getUserProfile } from "@/src/lib/userService";
import type { EventSummary } from "@/types/events";
import type { UserProfile } from "@/types/user";
import firebase from "@/src/firebase";

const STEPS_CONFIG = [
  {
    step: 1,
    emoji: "🎂",
    title: "Create Your Event",
    subtitle: "Birthday Party Setup",
    description:
      "Plan your child's birthday with AI-designed invitations. Invite guests & track RSVPs",
    gradientColors: ["#FBBF24", "#F59E0B"] as const,
    lightColor: "#FEF3C7",
    iconBg: "#FDE68A",
    features: [
      "📋 AI Designed Invitation",
      "👥 Invite From Your Contacts",
      "📱 SMS Invites & Updates",
      "✅ Manage & Track RSVPs",
    ],
  },
  {
    step: 2,
    emoji: "💳",
    title: "Get Virtual Card",
    subtitle: "Digital Wallet",
    description:
      "No more gift cards! All gifts go to one virtual card your child can actually use anywhere",
    gradientColors: ["#8B5CF6", "#7C3AED"] as const,
    lightColor: "#EDE9FE",
    iconBg: "#DDD6FE",
    features: [
      "🎁 All Gifts in One Place",
      "💳 Replace Gift Cards Forever",
      "🔒 Verified & Secure",
      "⚡ Instant Balance",
    ],
  },
  {
    step: 3,
    emoji: "👨‍👩‍👧",
    title: "Link Your Child",
    subtitle: "Secure Connection",
    description:
      "Your child downloads the app and securely links to their virtual card with parental approval",
    gradientColors: ["#3B82F6", "#2563EB"] as const,
    lightColor: "#DBEAFE",
    iconBg: "#BFDBFE",
    features: ["👁️ Parent View", "🛡️ Secure", "🔗 Easy Link"],
  },
  {
    step: 4,
    emoji: "🛍️",
    title: "Pay Anywhere!",
    subtitle: "Apple Pay Ready",
    description:
      "Your child spends gift money anywhere with Apple Pay. Track every purchase in real-time",
    gradientColors: ["#10B981", "#059669"] as const,
    lightColor: "#D1FAE5",
    iconBg: "#A7F3D0",
    features: [" Apple Pay", "📊 Live Tracking", "🌍 Worldwide"],
  },
] as const;

export type StepConfig = (typeof STEPS_CONFIG)[number];

function getEventEmoji(eventType: string): string {
  switch (eventType) {
    case "birthday":
      return "🎂";
    case "barMitzvah":
      return "📖";
    case "batMitzvah":
      return "📖";
    default:
      return "🎉";
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getUserGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

export function useHomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeEvents, setActiveEvents] = useState<EventSummary[]>([]);
  const [eventsCount, setEventsCount] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const user = firebase.auth().currentUser;
      if (!user) return;

      const [profile, events] = await Promise.all([
        getUserProfile(user.uid),
        getUserEventsStats(),
      ]);

      setUserProfile(profile || null);
      setEventsCount(events.length);

      const active = events.filter((e) => e.status === "active");
      active.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setActiveEvents(active);
    } catch (error) {
      console.error("Error loading home data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getFirstName = (): string => {
    if (userProfile?.fullName) {
      return userProfile.fullName.split(" ")[0];
    }
    return "there";
  };

  const goToEventDashboard = (eventId: string) => {
    router.push(routes.eventDashboard(eventId));
  };

  const goToMyEvents = () => {
    router.push(routes.tabs.myEvents);
  };

  const goToBanking = () => {
    router.push(routes.tabs.banking);
  };

  const goToCreateEvent = () => {
    router.push(routes.tabs.createEvent);
  };

  return {
    loading,
    userProfile,
    activeEvents,
    eventsCount,
    loadData,
    stepsConfig: STEPS_CONFIG,
    getEventEmoji,
    formatDate,
    getUserGreeting,
    getFirstName,
    goToEventDashboard,
    goToMyEvents,
    goToBanking,
    goToCreateEvent,
  };
}
