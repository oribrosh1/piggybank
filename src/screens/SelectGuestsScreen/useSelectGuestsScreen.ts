import { useEffect, useRef, useState } from "react";
import { Alert, Animated } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Contacts from "expo-contacts";
import { routes } from "@/types/routes";
import type { Guest } from "@/types/events";
import { updateEventGuests } from "@/src/lib/eventService";

function paramStr(v: string | string[] | undefined): string {
  if (v === undefined) return "";
  return Array.isArray(v) ? v[0] ?? "" : v;
}

export function useSelectGuestsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const eventId = paramStr(params.eventId);

  const [guests, setGuests] = useState<Guest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [phoneContacts, setPhoneContacts] = useState<Guest[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isSavingGuests, setIsSavingGuests] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!eventId) return;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
    ]).start();
    loadContacts();
  }, [fadeAnim, progressAnim, eventId]);

  const loadContacts = async () => {
    setIsLoadingContacts(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        setHasPermission(false);
        Alert.alert(
          "Permission Required",
          "Please allow access to your contacts to add guests.",
          [{ text: "OK" }]
        );
        setIsLoadingContacts(false);
        return;
      }
      setHasPermission(true);
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Image,
          Contacts.Fields.ImageAvailable,
        ],
        sort: Contacts.SortTypes.FirstName,
      });
      const transformedContacts: Guest[] = data
        .filter(
          (contact) =>
            contact.phoneNumbers?.length &&
            contact.name
        )
        .map((contact) => {
          const imageUri = contact.image?.uri || contact.rawImage?.uri;
          return {
            id: contact.id || String(Math.random()),
            name: contact.name || "Unknown",
            phone: contact.phoneNumbers?.[0]?.number || "",
            status: "added" as const,
            addedAt: new Date(),
            ...(imageUri ? { imageUri } : {}),
          };
        })
        .filter((c) => c.phone);
      setPhoneContacts(transformedContacts);
    } catch (error) {
      console.error("Error loading contacts:", error);
      Alert.alert("Error", "Failed to load contacts. Please try again.");
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const filteredContacts = phoneContacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !guests.some((g) => g.id === c.id)
  );

  const addGuest = (contact: Guest) => {
    setGuests((prev) => [...prev, contact]);
  };

  const removeGuest = (guestId: string) => {
    setGuests((prev) => prev.filter((g) => g.id !== guestId));
  };

  const handleContinue = async (skipGuests = false) => {
    if (!eventId) return;
    setIsSavingGuests(true);
    try {
      const list = skipGuests ? [] : guests;
      const result = await updateEventGuests(eventId, list);

      if (result.success) {
        router.replace(routes.eventDashboard(eventId));
      } else {
        Alert.alert("Error", result.error || "Failed to save guests. Please try again.");
      }
    } catch (error: unknown) {
      console.error("Error saving guests:", error);
      Alert.alert(
        "Error",
        (error as Error).message || "Something went wrong. Please try again."
      );
    } finally {
      setIsSavingGuests(false);
    }
  };

  const goBack = () => router.back();

  return {
    eventId,
    guests,
    searchQuery,
    setSearchQuery,
    phoneContacts,
    isLoadingContacts,
    hasPermission,
    isSavingGuests,
    fadeAnim,
    progressWidth,
    filteredContacts,
    addGuest,
    removeGuest,
    handleContinue,
    loadContacts,
    goBack,
  };
}
