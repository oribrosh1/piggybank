import { useState, useEffect, useRef } from "react";
import { Alert, Animated } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { routes } from "@/types/routes";
import type { PosterThemeId, EventPosterVersionRow } from "@/types/events";
import {
  generateEventPoster,
  subscribeEventPosterVersions,
  subscribeEventPosterFromEventDoc,
} from "@/src/lib/eventService";

const MAX_POSTER_RETRIES = 3;
const RETRY_DELAY_MS = 1400;

function paramStr(v: string | string[] | undefined): string {
  if (v === undefined) return "";
  return Array.isArray(v) ? v[0] ?? "" : v;
}

export function useEventPosterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ eventId?: string; childName?: string; eventType?: string }>();

  const eventId = paramStr(params.eventId);
  const childName = paramStr(params.childName) || "your child";
  const eventType = paramStr(params.eventType) || "birthday";

  const celebrationLine = (() => {
    const name = childName.toUpperCase();
    if (eventType === "barMitzvah") return `PICK FROM DIFFERENT THEMES FOR ${name}'S BAR MITZVAH`;
    if (eventType === "batMitzvah") return `PICK FROM DIFFERENT THEMES FOR ${name}'S BAT MITZVAH`;
    return `PICK FROM DIFFERENT THEMES FOR ${name}'S BIRTHDAY`;
  })();

  const [versions, setVersions] = useState<EventPosterVersionRow[]>([]);
  const [eventPosterUrl, setEventPosterUrl] = useState<string | null>(null);
  const [generatingTheme, setGeneratingTheme] = useState<PosterThemeId | null>(null);
  const [optimisticPosterUrl, setOptimisticPosterUrl] = useState<string | null>(null);
  const [posterReady, setPosterReady] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  /** Poster URL when user tapped Select — generation completes when URL changes or API returns. */
  const posterUrlAtGenerationStart = useRef<string | null>(null);

  const latestVersion = versions[0];
  const displayPosterUrl =
    optimisticPosterUrl || eventPosterUrl || latestVersion?.posterUrl || null;

  useEffect(() => {
    if (!eventId) {
      Alert.alert("Missing event", "Go back and complete event details.", [
        { text: "OK", onPress: () => router.back() },
      ]);
      return;
    }
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(progressAnim, { toValue: 2 / 3, duration: 800, useNativeDriver: false }),
    ]).start();
  }, [eventId, fadeAnim, progressAnim, router]);

  useEffect(() => {
    if (!eventId) return;
    const unsub = subscribeEventPosterVersions(eventId, (rows) => {
      setVersions(rows);
    });
    return () => unsub();
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    const unsub = subscribeEventPosterFromEventDoc(eventId, (url) => {
      setEventPosterUrl(url);
    });
    return () => unsub();
  }, [eventId]);

  // Existing saved poster when opening the screen (not while generating)
  useEffect(() => {
    if (generatingTheme) return;
    if (displayPosterUrl) {
      setPosterReady(true);
    }
  }, [versions, generatingTheme, displayPosterUrl]);

  // Finish loading when Firestore (event doc or versions) delivers a new poster URL after user tapped Select
  useEffect(() => {
    if (!generatingTheme) return;
    const start = posterUrlAtGenerationStart.current;
    const now = optimisticPosterUrl || eventPosterUrl || latestVersion?.posterUrl;
    if (!now) return;
    if (now !== start) {
      setPosterReady(true);
      setGeneratingTheme(null);
      setOptimisticPosterUrl(null);
    }
  }, [generatingTheme, optimisticPosterUrl, eventPosterUrl, latestVersion]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const selectTheme = (posterThemeId: PosterThemeId) => {
    if (!eventId || generatingTheme) return;

    const priorUrl = optimisticPosterUrl || eventPosterUrl || latestVersion?.posterUrl || null;
    posterUrlAtGenerationStart.current = priorUrl;

    setPosterReady(false);
    setOptimisticPosterUrl(null);
    setGeneratingTheme(posterThemeId);

    const attempt = (retriesLeft: number) => {
      generateEventPoster(eventId, posterThemeId)
        .then((res) => {
          if (res.success && res.posterUrl) {
            setOptimisticPosterUrl(res.posterUrl);
            setPosterReady(true);
            setGeneratingTheme(null);
            return;
          }
          if (res.success && !res.posterUrl) {
            setGeneratingTheme(null);
            Alert.alert(
              "Poster image unavailable",
              "We saved your invitation text, but image generation did not return a picture. You can try again from your event dashboard."
            );
            return;
          }
          if (retriesLeft > 0) {
            setTimeout(() => attempt(retriesLeft - 1), RETRY_DELAY_MS);
          } else {
            setGeneratingTheme(null);
            Alert.alert("Could not create poster", res.error || "Please try again.");
          }
        })
        .catch(() => {
          if (retriesLeft > 0) {
            setTimeout(() => attempt(retriesLeft - 1), RETRY_DELAY_MS);
          } else {
            setGeneratingTheme(null);
            Alert.alert("Could not create poster", "Check your connection and try again.");
          }
        });
    };

    attempt(MAX_POSTER_RETRIES);
  };

  const continueToGuests = () => {
    if (!eventId || !posterReady) return;
    router.push({
      pathname: routes.createEvent.selectGuests,
      params: { eventId, eventType },
    });
  };

  const goBack = () => router.back();

  /** Skip AI poster — event already exists; go to My event tab without generating. */
  const skipPosterAndGoToMyEvent = () => {
    if (!eventId || generatingTheme) return;
    router.replace(routes.tabs.myEvent);
  };

  const isGenerating = Boolean(generatingTheme);

  return {
    eventId,
    childName,
    celebrationLine,
    generatingTheme,
    isGenerating,
    selectTheme,
    goBack,
    skipPosterAndGoToMyEvent,
    fadeAnim,
    progressWidth,
    displayPosterUrl,
    posterReady,
    continueToGuests,
    latestVersionNumber: latestVersion?.versionNumber,
  };
}
