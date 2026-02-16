import { useEffect, useRef, useState } from "react";
import { Alert, Animated } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Contacts from "expo-contacts";
import { routes } from "@/types/routes";
import type { Guest, EventType, EventCategory, CreateEventData } from "@/types/events";
import { createEvent } from "@/src/lib/eventService";

export function useSelectGuestsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [guests, setGuests] = useState<Guest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [phoneContacts, setPhoneContacts] = useState<Guest[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, [fadeAnim, progressAnim]);

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
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        sort: Contacts.SortTypes.FirstName,
      });
      const transformedContacts: Guest[] = data
        .filter(
          (contact) =>
            contact.phoneNumbers?.length &&
            contact.name
        )
        .map((contact) => ({
          id: contact.id || String(Math.random()),
          name: contact.name || "Unknown",
          phone: contact.phoneNumbers?.[0]?.number || "",
          status: "added" as const,
          addedAt: new Date(),
        }))
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
    outputRange: ["40%", "80%"],
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
    setIsCreatingEvent(true);
    try {
      const eventData: CreateEventData = {
        eventType: (params.eventType as EventType) || "birthday",
        formData: {
          age: params.age ?? "",
          eventName: params.eventName ?? "",
          eventCategory: params.eventCategory as EventCategory | undefined,
          partyType: params.partyType,
          otherPartyType: params.otherPartyType,
          attireType: params.attireType,
          footwearType: params.footwearType,
          theme: params.theme,
          parking: params.parking,
          kosherType: params.kosherType,
          mealType: params.mealType,
          vegetarianType: params.vegetarianType,
          date: params.date ?? "",
          time: params.time ?? "",
          address1: params.address1 ?? "",
          address2: params.address2 ?? "",
        },
        guests: skipGuests ? [] : guests,
      };

      const result = await createEvent(eventData);

      if (result.success && result.eventId) {
        router.replace(routes.eventDashboard(result.eventId));
      } else {
        Alert.alert("Error", result.error || "Failed to create event. Please try again.");
      }
    } catch (error: unknown) {
      console.error("Error creating event:", error);
      Alert.alert(
        "Error",
        (error as Error).message || "Something went wrong. Please try again."
      );
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const goBack = () => router.back();

  return {
    guests,
    searchQuery,
    setSearchQuery,
    phoneContacts,
    isLoadingContacts,
    hasPermission,
    isCreatingEvent,
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
