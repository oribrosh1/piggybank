import { useState, useEffect, useRef, useCallback } from "react";
import { Alert, Animated } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { routes } from "@/types/routes";
import {
  EventFormData,
  CreateEventData,
  EventType,
  type CelebrationPickerType,
  type MitzvahCelebrationFocus,
} from "@/types/events";
import * as ImagePicker from "expo-image-picker";
import { createEvent, updateEvent } from "@/src/lib/eventService";
import { uploadHonoreePhotoToEvent } from "@/src/lib/honoreePhotoUpload";

function celebrationFromRoute(routeType: string | undefined): CelebrationPickerType {
  if (routeType === "barMitzvah") return "barMitzvah";
  if (routeType === "batMitzvah") return "batMitzvah";
  return "birthday";
}

/** Turning age drives celebration type on step 2: 12 → bat, 13 → bar, else birthday. */
export function celebrationTypeFromAge(ageStr: string): CelebrationPickerType {
  const t = String(ageStr).trim();
  if (!t) return "birthday";
  const n = parseInt(t, 10);
  if (Number.isNaN(n)) return "birthday";
  if (n === 12) return "batMitzvah";
  if (n === 13) return "barMitzvah";
  return "birthday";
}

function mergeAgeIntoForm(prev: EventFormData, nextAge: string): EventFormData {
  const nextType = celebrationTypeFromAge(nextAge);
  const next: EventFormData = {
    ...prev,
    age: nextAge,
    celebrationType: nextType,
  };
  if (nextType === "birthday") {
    next.mitzvahCelebrationFocus = undefined;
    next.eventCategory = undefined;
  }
  return next;
}

const initialFormData: EventFormData = {
  age: "",
  childName: "",
  eventCategory: undefined,
  partyType: "",
  otherPartyType: "",
  attireType: "",
  footwearType: "",
  theme: "",
  parking: "",
  kosherType: "",
  mealType: "",
  vegetarianType: "",
  date: new Date().toISOString().split("T")[0],
  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  address1: "",
  address2: "",
  optionalDetailsLater: false,
  kosherCateringPartnerId: "later",
};

export function useEventDetailsScreen() {
  const router = useRouter();
  const { eventType } = useLocalSearchParams<{ eventType?: string }>();

  const [formData, setFormData] = useState<EventFormData>(() => ({
    ...initialFormData,
    celebrationType: celebrationTypeFromAge(initialFormData.age),
  }));
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showEventDetails, setShowEventDetails] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const googlePlacesRef = useRef<unknown>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1 / 3,
      duration: 800,
      useNativeDriver: false,
    }).start();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [progressAnim, fadeAnim]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.childName.trim()) newErrors.childName = "Name is required";
    if (!formData.age.trim()) newErrors.age = "Age is required";
    if (!formData.date.trim()) newErrors.date = "Date is required";
    if (!formData.time.trim()) newErrors.time = "Time is required";
    if (!formData.address1.trim()) newErrors.address1 = "Address is required";
    if (
      (formData.celebrationType === "barMitzvah" ||
        formData.celebrationType === "batMitzvah") &&
      !formData.mitzvahCelebrationFocus
    ) {
      newErrors.mitzvahCelebrationFocus = "Choose whether this is mainly for the party or the ceremony";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const setOptionalDetailsLater = (v: boolean) => {
    setFormData((prev) => ({ ...prev, optionalDetailsLater: v }));
  };

  const handleContinue = async () => {
    if (!validateForm()) return;
    setIsCreating(true);
    try {
      const resolvedType = (formData.celebrationType ??
        celebrationFromRoute(eventType as string | undefined)) as EventType;
      const eventData: CreateEventData = {
        eventType: resolvedType,
        formData,
        guests: [],
      };
      const result = await createEvent(eventData);
      if (result.success && result.eventId) {
        const eventId = result.eventId;
        const localPhoto = formData.honoreePhotoUri?.trim();
        if (localPhoto) {
          try {
            const honoreePhotoUrl = await uploadHonoreePhotoToEvent(eventId, localPhoto);
            const up = await updateEvent(eventId, { honoreePhotoUrl });
            if (!up.success) {
              throw new Error(up.error || "Update failed");
            }
          } catch (uploadErr) {
            console.error(uploadErr);
            Alert.alert(
              "Photo upload",
              "Your event was saved, but the honoree photo could not be uploaded. You can add one when editing the event; the AI poster may not match their face until then."
            );
          }
        }
        router.push({
          pathname: routes.createEvent.eventPoster,
          params: {
            eventId,
            childName: formData.childName.trim(),
            eventType:
              formData.celebrationType ??
              celebrationFromRoute(eventType as string | undefined),
          },
        });
      } else {
        Alert.alert("Error", result.error || "Could not create event. Please try again.");
      }
    } catch (e: unknown) {
      Alert.alert("Error", (e as Error).message || "Something went wrong.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field === "age" && typeof value === "string") {
      setFormData((prev) => mergeAgeIntoForm(prev, value));
      setErrors((prev) => ({
        ...prev,
        age: "",
        ...(celebrationTypeFromAge(value) === "birthday"
          ? { mitzvahCelebrationFocus: "" }
          : {}),
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const pickHonoreePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Photo access", "Allow photo library access to add a picture of your child for the AI poster.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      handleInputChange("honoreePhotoUri", result.assets[0].uri);
    }
  };

  const clearHonoreePhoto = () => {
    setFormData((prev) => {
      const next = { ...prev };
      delete next.honoreePhotoUri;
      return next;
    });
  };

  const setCelebrationType = useCallback((value: CelebrationPickerType) => {
    setFormData((prev) => ({
      ...prev,
      celebrationType: value,
      mitzvahCelebrationFocus: value === "birthday" ? undefined : prev.mitzvahCelebrationFocus,
      eventCategory: value === "birthday" ? undefined : prev.eventCategory,
    }));
    setErrors((prev) => ({ ...prev, mitzvahCelebrationFocus: "" }));
  }, []);

  const setMitzvahCelebrationFocus = useCallback((value: MitzvahCelebrationFocus) => {
    setFormData((prev) => ({
      ...prev,
      mitzvahCelebrationFocus: value,
      eventCategory: value === "ceremony" ? "formal" : "party",
    }));
    setErrors((prev) => ({ ...prev, mitzvahCelebrationFocus: "" }));
  }, []);

  const setAddressFromPlace = (address1: string, address2: string) => {
    setFormData((prev) => ({ ...prev, address1, address2 }));
    setErrors((prev) => ({ ...prev, address1: "", address2: "" }));
  };

  const formatDateDisplay = (dateString: string) => {
    const [year, month, day] = dateString.split("-");
    const date = new Date(parseInt(year!, 10), parseInt(month!, 10) - 1, parseInt(day!, 10));
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDateConfirm = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    handleInputChange("date", `${year}-${month}-${day}`);
    setShowDatePicker(false);
  };

  const handleTimeConfirm = (time: Date) => {
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const period = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    const formattedTime = `${String(hour12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
    handleInputChange("time", formattedTime);
    setShowTimePicker(false);
  };

  const isBirthday = formData.celebrationType === "birthday";
  const isBarBatMitzvah =
    formData.celebrationType === "barMitzvah" ||
    formData.celebrationType === "batMitzvah";
  const isPartyMode = isBirthday || formData.eventCategory === "party";

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return {
    eventType,
    formData,
    errors,
    focusedField,
    setFocusedField,
    showDatePicker,
    setShowDatePicker,
    showTimePicker,
    setShowTimePicker,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    showEventDetails,
    setShowEventDetails,
    googlePlacesRef,
    progressAnim,
    fadeAnim,
    progressWidth,
    validateForm,
    handleContinue,
    handleInputChange,
    setCelebrationType,
    setMitzvahCelebrationFocus,
    setAddressFromPlace,
    formatDateDisplay,
    handleDateConfirm,
    handleTimeConfirm,
    isBirthday,
    isBarBatMitzvah,
    isPartyMode,
    setOptionalDetailsLater,
    isCreating,
    pickHonoreePhoto,
    clearHonoreePhoto,
  };
}
