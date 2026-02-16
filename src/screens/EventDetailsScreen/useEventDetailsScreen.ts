import { useState, useEffect, useRef } from "react";
import { Animated } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { routes } from "@/types/routes";
import { EventFormData } from "@/types/events";

const initialFormData: EventFormData = {
  age: "",
  eventName: "",
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
};

export function useEventDetailsScreen() {
  const router = useRouter();
  const { eventType } = useLocalSearchParams<{ eventType?: string }>();

  const [formData, setFormData] = useState<EventFormData>(initialFormData);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showEventDetails, setShowEventDetails] = useState(true);

  const googlePlacesRef = useRef<unknown>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 0.4,
      duration: 800,
      useNativeDriver: false,
    }).start();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (eventType === "birthday" && !formData.age.trim()) newErrors.age = "Age is required";
    if (!formData.eventName.trim()) newErrors.eventName = "Event name is required";
    if (!formData.date.trim()) newErrors.date = "Date is required";
    if (!formData.time.trim()) newErrors.time = "Time is required";
    if (!formData.address1.trim()) newErrors.address1 = "Address is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      router.push({
        pathname: routes.createEvent.selectGuests,
        params: {
          eventType: (eventType as "birthday" | "bar-mitzvah" | "bat-mitzvah" | "wedding") ?? "birthday",
          ...formData,
        },
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const formatDateDisplay = (dateString: string) => {
    const [year, month, day] = dateString.split("-");
    const date = new Date(parseInt(year!, 10), parseInt(month!, 10) - 1, parseInt(day!, 10));
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
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

  const isBirthday = eventType === "birthday";
  const isBarBatMitzvah = eventType === "bar-mitzvah" || eventType === "bat-mitzvah";
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
    formatDateDisplay,
    handleDateConfirm,
    handleTimeConfirm,
    isBirthday,
    isBarBatMitzvah,
    isPartyMode,
  };
}
