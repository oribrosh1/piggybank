import { useState, useEffect, useRef, useCallback } from "react";
import { Animated, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { routes } from "@/types/routes";
import {
  EventFormData,
  type CelebrationPickerType,
  type MitzvahCelebrationFocus,
} from "@/types/events";
import * as ImagePicker from "expo-image-picker";
import { useCreateEventDraftStore } from "@/src/stores/createEventDraftStore";
import { resolveCreateFlowEventType } from "@/src/lib/createEventFlowSubmit";

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

/** Show bar/bat vs birthday picker only for mitzvah ages. */
export function isMitzvahTurningAge(ageStr: string): boolean {
  const n = parseInt(String(ageStr).trim(), 10);
  return !Number.isNaN(n) && (n === 12 || n === 13);
}

function mitzvahFocusOrDefault(prev: EventFormData): MitzvahCelebrationFocus {
  const f = prev.mitzvahCelebrationFocus;
  return f === "party" || f === "ceremony" ? f : "party";
}

function defaultHonoreeGenderForType(
  type: CelebrationPickerType,
  prev?: EventFormData["honoreeGender"],
): EventFormData["honoreeGender"] | undefined {
  if (prev === "boy" || prev === "girl") return prev;
  if (type === "barMitzvah") return "boy";
  if (type === "batMitzvah") return "girl";
  return prev;
}

function mergeAgeIntoForm(prev: EventFormData, nextAge: string): EventFormData {
  const nextType = celebrationTypeFromAge(nextAge);
  const next: EventFormData = {
    ...prev,
    age: nextAge,
    celebrationType: nextType,
    honoreeGender: defaultHonoreeGenderForType(nextType, prev.honoreeGender),
  };
  if (nextType === "birthday") {
    next.mitzvahCelebrationFocus = undefined;
    next.eventCategory = undefined;
  } else {
    const focus = mitzvahFocusOrDefault(prev);
    next.mitzvahCelebrationFocus = focus;
    next.eventCategory = focus === "ceremony" ? "formal" : "party";
  }
  return next;
}

const initialFormData: EventFormData = {
  age: "",
  childName: "",
  eventCategory: undefined,
  partyType: "",
  otherPartyType: "",
  dressCode: "",
  theme: "",
  partyVibe: "",
  honoreeFavoriteColor: "",
  parking: "",
  locationNotes: "",
  kosherType: "",
  mealType: "",
  vegetarianType: "",
  date: new Date().toISOString().split("T")[0],
  time: new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  }),
  address1: "",
  address2: "",
  optionalDetailsLater: false,
  kosherCateringPartnerId: "later",
};

export type UseEventDetailsScreenOptions = {
  /** Called when validation or create fails so the screen can scroll errors into view. */
  scrollToTopOnError?: () => void;
};

export function useEventDetailsScreen(
  options?: UseEventDetailsScreenOptions,
) {
  const scrollToTopOnError = options?.scrollToTopOnError;

  const notifyErrorScroll = useCallback(() => {
    if (!scrollToTopOnError) return;
    requestAnimationFrame(() => scrollToTopOnError());
  }, [scrollToTopOnError]);
  const router = useRouter();
  const { eventType } = useLocalSearchParams<{ eventType?: string }>();
  const setCreateDraft = useCreateEventDraftStore((s) => s.setDraft);

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

  const googlePlacesRef = useRef<unknown>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.childName.trim()) newErrors.childName = "Name is required";
    if (!formData.age.trim()) newErrors.age = "Age is required";
    if (formData.honoreeGender !== "boy" && formData.honoreeGender !== "girl") {
      newErrors.honoreeGender = "Select boy or girl";
    }
    if (!formData.date.trim()) newErrors.date = "Date is required";
    if (!formData.time.trim()) newErrors.time = "Time is required";
    if (!formData.address1.trim()) newErrors.address1 = "Address is required";
    if (
      (formData.celebrationType === "barMitzvah" ||
        formData.celebrationType === "batMitzvah") &&
      !formData.mitzvahCelebrationFocus
    ) {
      newErrors.mitzvahCelebrationFocus =
        "Choose whether this is mainly for the party or the ceremony";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const setOptionalDetailsLater = (v: boolean) => {
    setFormData((prev) => ({ ...prev, optionalDetailsLater: v }));
  };

  const handleContinue = () => {
    if (!validateForm()) {
      notifyErrorScroll();
      return;
    }
    const resolvedEventType = resolveCreateFlowEventType(
      formData,
      eventType as string | undefined,
    );
    setCreateDraft({
      formData: { ...formData },
      resolvedEventType,
    });
    router.push(routes.createEvent.reviewCreate);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field === "age" && typeof value === "string") {
      setFormData((prev) => mergeAgeIntoForm(prev, value));
      setErrors((prev) => ({
        ...prev,
        age: "",
        honoreeGender: "",
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
      Alert.alert(
        "Photo access",
        "Allow photo library access to add a picture of your child for the AI poster.",
      );
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
    setFormData((prev) => {
      if (value === "birthday") {
        return {
          ...prev,
          celebrationType: value,
          mitzvahCelebrationFocus: undefined,
          eventCategory: undefined,
          honoreeGender: prev.honoreeGender,
        };
      }
      const focus = mitzvahFocusOrDefault(prev);
      return {
        ...prev,
        celebrationType: value,
        mitzvahCelebrationFocus: focus,
        eventCategory: focus === "ceremony" ? "formal" : "party",
        honoreeGender:
          prev.honoreeGender === "boy" || prev.honoreeGender === "girl"
            ? prev.honoreeGender
            : value === "barMitzvah"
              ? "boy"
              : "girl",
      };
    });
    setErrors((prev) => ({ ...prev, mitzvahCelebrationFocus: "", honoreeGender: "" }));
  }, []);

  const setMitzvahCelebrationFocus = useCallback(
    (value: MitzvahCelebrationFocus) => {
      setFormData((prev) => ({
        ...prev,
        mitzvahCelebrationFocus: value,
        eventCategory: value === "ceremony" ? "formal" : "party",
      }));
      setErrors((prev) => ({ ...prev, mitzvahCelebrationFocus: "" }));
    },
    [],
  );

  const setAddressFromPlace = (address1: string, address2: string) => {
    setFormData((prev) => ({ ...prev, address1, address2 }));
    setErrors((prev) => ({ ...prev, address1: "", address2: "" }));
  };

  const formatDateDisplay = (dateString: string) => {
    const [year, month, day] = dateString.split("-");
    const date = new Date(
      parseInt(year!, 10),
      parseInt(month!, 10) - 1,
      parseInt(day!, 10),
    );
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
  const showCelebrationTypeSection = isMitzvahTurningAge(formData.age);

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
    fadeAnim,
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
    showCelebrationTypeSection,
    setOptionalDetailsLater,
    pickHonoreePhoto,
    clearHonoreePhoto,
  };
}
