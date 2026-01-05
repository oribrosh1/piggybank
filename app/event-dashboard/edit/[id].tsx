import React, { useEffect, useState, useRef } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Animated,
    Modal,
    ActivityIndicator,
    Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft,
    Calendar,
    Clock,
    MapPinned,
    Sparkles,
    Check,
    Notebook,
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import GooglePlacesTextInput from "react-native-google-places-textinput";
import { routes } from "../../../types/routes";
import { Event, EventFormData, EventCategory } from "../../../types/events";
import { getEvent, updateEvent } from "../../../src/lib/eventService";

export default function EditEventScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<EventFormData>({
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
        date: "",
        time: "",
        address1: "",
        address2: "",
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState(new Date());

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadEvent();
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();
    }, [id]);

    const loadEvent = async () => {
        if (!id) return;
        setLoading(true);
        const eventData = await getEvent(id);
        if (eventData) {
            setEvent(eventData);
            setFormData({
                age: eventData.age || "",
                eventName: eventData.eventName,
                eventCategory: eventData.eventCategory,
                partyType: eventData.partyType || "",
                otherPartyType: eventData.otherPartyType || "",
                attireType: eventData.attireType || "",
                footwearType: eventData.footwearType || "",
                theme: eventData.theme || "",
                parking: eventData.parking || "",
                kosherType: eventData.kosherType || "",
                mealType: eventData.mealType || "",
                vegetarianType: eventData.vegetarianType || "",
                date: eventData.date,
                time: eventData.time,
                address1: eventData.address1,
                address2: eventData.address2,
            });
        }
        setLoading(false);
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (event?.eventType === "birthday" && !formData.age.trim())
            newErrors.age = "Age is required";
        if (!formData.eventName.trim())
            newErrors.eventName = "Event name is required";
        if (!formData.date.trim()) newErrors.date = "Date is required";
        if (!formData.time.trim()) newErrors.time = "Time is required";
        if (!formData.address1.trim()) newErrors.address1 = "Address is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm() || !event || !id) return;

        setSaving(true);
        try {
            const result = await updateEvent(id, {
                eventName: formData.eventName,
                eventCategory: formData.eventCategory,
                partyType: formData.partyType,
                otherPartyType: formData.otherPartyType,
                attireType: formData.attireType,
                footwearType: formData.footwearType,
                theme: formData.theme,
                parking: formData.parking,
                kosherType: formData.kosherType,
                mealType: formData.mealType,
                vegetarianType: formData.vegetarianType,
                age: formData.age,
                date: formData.date,
                time: formData.time,
                address1: formData.address1,
                address2: formData.address2,
            });

            if (result.success) {
                Alert.alert("Success", "Event updated successfully!", [
                    { text: "OK", onPress: () => router.back() }
                ]);
            } else {
                Alert.alert("Error", result.error || "Failed to update event");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Something went wrong");
        } finally {
            setSaving(false);
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
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
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
        handleInputChange("time", `${String(hour12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`);
        setShowTimePicker(false);
    };

    const isBirthday = event?.eventType === "birthday";
    const isBarBatMitzvah = event?.eventType === "barMitzvah" || event?.eventType === "batMitzvah";
    const isPartyMode = isBirthday || formData.eventCategory === "party";

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: "#F9FAFB", alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={{ marginTop: 16, fontSize: 16, color: "#6B7280" }}>Loading event...</Text>
            </View>
        );
    }

    if (!event) {
        return (
            <View style={{ flex: 1, backgroundColor: "#F9FAFB", alignItems: "center", justifyContent: "center", padding: 24 }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>😕</Text>
                <Text style={{ fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 8 }}>Event Not Found</Text>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{ backgroundColor: "#8B5CF6", borderRadius: 16, paddingVertical: 14, paddingHorizontal: 24 }}
                >
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
            <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
                <Animated.ScrollView
                    style={{ flex: 1, opacity: fadeAnim }}
                    contentContainerStyle={{ paddingBottom: 140 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View
                        style={{
                            backgroundColor: "#8B5CF6",
                            paddingTop: insets.top,
                            paddingBottom: 24,
                            borderBottomLeftRadius: 32,
                            borderBottomRightRadius: 32,
                        }}
                    >
                        <View style={{ paddingHorizontal: 20, paddingBottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                            <TouchableOpacity
                                onPress={() => router.back()}
                                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}
                            >
                                <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
                            </TouchableOpacity>
                            <Text style={{ fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.8)", letterSpacing: 1 }}>
                                EDIT EVENT
                            </Text>
                            <View style={{ width: 40 }} />
                        </View>

                        <View style={{ paddingHorizontal: 20 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                                <Sparkles size={28} color="#FFFFFF" strokeWidth={2.5} />
                                <Text style={{ fontSize: 28, fontWeight: "900", color: "#FFFFFF", marginLeft: 12 }}>
                                    Edit Details
                                </Text>
                            </View>
                            <Text style={{ fontSize: 15, color: "rgba(255,255,255,0.9)", fontWeight: "500" }}>
                                Update your event information ✨
                            </Text>
                        </View>
                    </View>

                    {/* Form Content */}
                    <View style={{ backgroundColor: "#FFFFFF", paddingHorizontal: 24, paddingTop: 28 }}>
                        {/* Age Field (only for birthdays) */}
                        {isBirthday && (
                            <View style={{ marginBottom: 24 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#EDE9FE", alignItems: "center", justifyContent: "center" }}>
                                        <Text style={{ fontSize: 20 }}>🎉</Text>
                                    </View>
                                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#6B7280", marginLeft: 12, textTransform: "uppercase" }}>
                                        Turning Age
                                    </Text>
                                </View>
                                <View style={{ backgroundColor: "#FFFFFF", borderRadius: 20, padding: 20, borderWidth: 2, borderColor: focusedField === "age" ? "#8B5CF6" : "#E5E7EB" }}>
                                    <TextInput
                                        style={{ fontSize: 28, fontWeight: "800", color: "#8B5CF6", textAlign: "center", paddingVertical: 8 }}
                                        placeholder="16"
                                        placeholderTextColor="#D1D5DB"
                                        value={formData.age}
                                        onChangeText={(v) => handleInputChange("age", v)}
                                        onFocus={() => setFocusedField("age")}
                                        onBlur={() => setFocusedField(null)}
                                        keyboardType="number-pad"
                                        maxLength={3}
                                    />
                                </View>
                                {errors.age && <Text style={{ fontSize: 12, color: "#EF4444", marginTop: 8, fontWeight: "600" }}>⚠️ {errors.age}</Text>}
                            </View>
                        )}

                        {/* Event Name */}
                        <View style={{ marginBottom: 24 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#EDE9FE", alignItems: "center", justifyContent: "center" }}>
                                    <Sparkles size={18} color="#8B5CF6" strokeWidth={2.5} />
                                </View>
                                <Text style={{ fontSize: 14, fontWeight: "700", color: "#6B7280", marginLeft: 12, textTransform: "uppercase" }}>
                                    Event Name
                                </Text>
                            </View>
                            <View style={{ borderRadius: 20, paddingHorizontal: 20, paddingVertical: 18, borderWidth: 2, backgroundColor: "#F9FAFB", borderColor: focusedField === "eventName" ? "#8B5CF6" : "#E5E7EB" }}>
                                <TextInput
                                    style={{ fontSize: 20, fontWeight: "700", color: "#111827", paddingVertical: 6 }}
                                    placeholder="Emma's Birthday"
                                    placeholderTextColor="#D1D5DB"
                                    value={formData.eventName}
                                    onChangeText={(v) => handleInputChange("eventName", v)}
                                    onFocus={() => setFocusedField("eventName")}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>
                            {errors.eventName && <Text style={{ fontSize: 12, color: "#EF4444", marginTop: 8, fontWeight: "600" }}>⚠️ {errors.eventName}</Text>}
                        </View>

                        {/* Event Details Card */}
                        <View style={{ marginBottom: 24, backgroundColor: "#FFFFFF", borderRadius: 24, padding: 20, borderWidth: 2, borderColor: "#F3F4F6" }}>
                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#EDE9FE", alignItems: "center", justifyContent: "center" }}>
                                    <Notebook size={20} color="#8B5CF6" strokeWidth={2.5} />
                                </View>
                                <Text style={{ fontSize: 16, fontWeight: "800", color: "#111827", marginLeft: 14 }}>
                                    Event Details
                                </Text>
                            </View>

                            {/* Event Category for Bar/Bat Mitzvah */}
                            {isBarBatMitzvah && (
                                <View style={{ marginBottom: 18 }}>
                                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", marginBottom: 10 }}>🎪 What are you planning?</Text>
                                    <View style={{ flexDirection: "row", gap: 10 }}>
                                        {[{ value: "formal", label: "🕎", name: "The Ceremony" }, { value: "party", label: "🎉", name: "The Party" }].map((opt) => (
                                            <TouchableOpacity
                                                key={opt.value}
                                                onPress={() => handleInputChange("eventCategory", opt.value)}
                                                style={{ flex: 1, backgroundColor: formData.eventCategory === opt.value ? "#8B5CF6" : "#F9FAFB", borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 2, borderColor: formData.eventCategory === opt.value ? "#8B5CF6" : "#E5E7EB" }}
                                            >
                                                <Text style={{ fontSize: 24, marginBottom: 6 }}>{opt.label}</Text>
                                                <Text style={{ fontSize: 14, fontWeight: "700", color: formData.eventCategory === opt.value ? "#FFFFFF" : "#374151" }}>{opt.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Party Details */}
                            {isPartyMode && (
                                <>
                                    {/* Party Type */}
                                    <View style={{ marginBottom: 16 }}>
                                        <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", marginBottom: 10 }}>🎊 Party Type</Text>
                                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                                            {[{ value: "pool", label: "🏊", name: "Pool" }, { value: "beach", label: "🏖️", name: "Beach" }, { value: "garden", label: "🌳", name: "Garden" }, { value: "indoor", label: "🏠", name: "Indoor" }, { value: "restaurant", label: "🍽️", name: "Restaurant" }].map((opt) => (
                                                <TouchableOpacity
                                                    key={opt.value}
                                                    onPress={() => handleInputChange("partyType", opt.value)}
                                                    style={{ width: "30%", backgroundColor: formData.partyType === opt.value ? "#8B5CF6" : "#F9FAFB", borderRadius: 14, paddingVertical: 12, alignItems: "center", borderWidth: 2, borderColor: formData.partyType === opt.value ? "#8B5CF6" : "#E5E7EB" }}
                                                >
                                                    <Text style={{ fontSize: 20, marginBottom: 4 }}>{opt.label}</Text>
                                                    <Text style={{ fontSize: 11, fontWeight: "700", color: formData.partyType === opt.value ? "#FFFFFF" : "#374151" }}>{opt.name}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>

                                    {/* Attire Type */}
                                    <View style={{ marginBottom: 16 }}>
                                        <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", marginBottom: 10 }}>👕 Attire Type</Text>
                                        <View style={{ flexDirection: "row", gap: 10 }}>
                                            {[{ value: "casual", label: "👕", name: "Casual" }, { value: "swimwear", label: "🩱", name: "Swimwear" }, { value: "costume", label: "🎭", name: "Costume" }].map((opt) => (
                                                <TouchableOpacity
                                                    key={opt.value}
                                                    onPress={() => handleInputChange("attireType", opt.value)}
                                                    style={{ flex: 1, backgroundColor: formData.attireType === opt.value ? "#8B5CF6" : "#F9FAFB", borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 2, borderColor: formData.attireType === opt.value ? "#8B5CF6" : "#E5E7EB" }}
                                                >
                                                    <Text style={{ fontSize: 22, marginBottom: 4 }}>{opt.label}</Text>
                                                    <Text style={{ fontSize: 12, fontWeight: "700", color: formData.attireType === opt.value ? "#FFFFFF" : "#374151" }}>{opt.name}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>

                                    {/* Footwear */}
                                    <View style={{ marginBottom: 16 }}>
                                        <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", marginBottom: 10 }}>👟 Footwear</Text>
                                        <View style={{ flexDirection: "row", gap: 10 }}>
                                            {[{ value: "sneakers", label: "👟", name: "Sneakers" }, { value: "slides", label: "🩴", name: "Slides" }, { value: "any", label: "✨", name: "Any" }].map((opt) => (
                                                <TouchableOpacity
                                                    key={opt.value}
                                                    onPress={() => handleInputChange("footwearType", opt.value)}
                                                    style={{ flex: 1, backgroundColor: formData.footwearType === opt.value ? "#8B5CF6" : "#F9FAFB", borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 2, borderColor: formData.footwearType === opt.value ? "#8B5CF6" : "#E5E7EB" }}
                                                >
                                                    <Text style={{ fontSize: 24, marginBottom: 4 }}>{opt.label}</Text>
                                                    <Text style={{ fontSize: 12, fontWeight: "700", color: formData.footwearType === opt.value ? "#FFFFFF" : "#374151" }}>{opt.name}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                </>
                            )}

                            {/* Theme */}
                            <View style={{ marginBottom: 16 }}>
                                <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", marginBottom: 10 }}>🎭 Party Theme (optional)</Text>
                                <TextInput
                                    style={{ backgroundColor: focusedField === "theme" ? "#F5F3FF" : "#F9FAFB", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontWeight: "600", color: "#111827", borderWidth: 2, borderColor: focusedField === "theme" ? "#8B5CF6" : "#E5E7EB" }}
                                    placeholder="What's the vibe? 🎉"
                                    placeholderTextColor="#D1D5DB"
                                    value={formData.theme}
                                    onChangeText={(v) => handleInputChange("theme", v)}
                                    onFocus={() => setFocusedField("theme")}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>

                            {/* Kosher Type */}
                            <View style={{ marginBottom: 16 }}>
                                <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", marginBottom: 10 }}>✡️ Kosher Type</Text>
                                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                                    {[{ value: "kosher-style", label: "🍴", name: "Kosher Style" }, { value: "kosher", label: "✡️", name: "Kosher" }, { value: "glatt-kosher", label: "Ⓤ", name: "Glatt Kosher" }, { value: "not-kosher", label: "🍽️", name: "Not Kosher" }].map((opt) => (
                                        <TouchableOpacity
                                            key={opt.value}
                                            onPress={() => handleInputChange("kosherType", opt.value)}
                                            style={{ width: "47%", backgroundColor: formData.kosherType === opt.value ? "#8B5CF6" : "#F9FAFB", borderRadius: 14, paddingVertical: 12, alignItems: "center", borderWidth: 2, borderColor: formData.kosherType === opt.value ? "#8B5CF6" : "#E5E7EB" }}
                                        >
                                            <Text style={{ fontSize: 20, marginBottom: 4 }}>{opt.label}</Text>
                                            <Text style={{ fontSize: 11, fontWeight: "700", color: formData.kosherType === opt.value ? "#FFFFFF" : "#374151" }}>{opt.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>

                        {/* Date & Time Card */}
                        <View style={{ marginBottom: 24, backgroundColor: "#FFFFFF", borderRadius: 24, padding: 24, borderWidth: 2, borderColor: "#F3F4F6" }}>
                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
                                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#EDE9FE", alignItems: "center", justifyContent: "center" }}>
                                    <Calendar size={22} color="#8B5CF6" strokeWidth={2.5} />
                                </View>
                                <Text style={{ fontSize: 17, fontWeight: "800", color: "#111827", marginLeft: 14 }}>
                                    When is it happening?
                                </Text>
                            </View>

                            {/* Date Picker */}
                            <TouchableOpacity
                                onPress={() => {
                                    if (formData.date) {
                                        const [year, month, day] = formData.date.split("-");
                                        setSelectedDate(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)));
                                    }
                                    setShowDatePicker(true);
                                }}
                                style={{ marginBottom: 18, backgroundColor: "#F9FAFB", borderRadius: 16, padding: 18, borderWidth: 2, borderColor: "#E5E7EB" }}
                            >
                                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                    <View>
                                        <Text style={{ fontSize: 12, fontWeight: "700", color: "#6B7280", marginBottom: 8, textTransform: "uppercase" }}>📅 DATE</Text>
                                        <Text style={{ fontSize: 18, fontWeight: "700", color: formData.date ? "#111827" : "#9CA3AF" }}>
                                            {formData.date ? formatDateDisplay(formData.date) : "Select date"}
                                        </Text>
                                    </View>
                                    <View style={{ backgroundColor: "#EDE9FE", borderRadius: 12, width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
                                        <Text style={{ fontSize: 20 }}>📆</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            {/* Time Picker */}
                            <TouchableOpacity
                                onPress={() => {
                                    if (formData.time) {
                                        const match = formData.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
                                        if (match) {
                                            let hours = parseInt(match[1]);
                                            const minutes = parseInt(match[2]);
                                            const period = match[3].toUpperCase();
                                            if (period === "PM" && hours !== 12) hours += 12;
                                            else if (period === "AM" && hours === 12) hours = 0;
                                            const time = new Date();
                                            time.setHours(hours, minutes);
                                            setSelectedTime(time);
                                        }
                                    }
                                    setShowTimePicker(true);
                                }}
                                style={{ backgroundColor: "#F9FAFB", borderRadius: 16, padding: 18, borderWidth: 2, borderColor: "#E5E7EB" }}
                            >
                                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                    <View>
                                        <Text style={{ fontSize: 12, fontWeight: "700", color: "#6B7280", marginBottom: 8, textTransform: "uppercase" }}>⏰ TIME</Text>
                                        <Text style={{ fontSize: 18, fontWeight: "700", color: formData.time ? "#111827" : "#9CA3AF" }}>
                                            {formData.time || "Select time"}
                                        </Text>
                                    </View>
                                    <View style={{ backgroundColor: "#EDE9FE", borderRadius: 12, width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
                                        <Text style={{ fontSize: 20 }}>🕐</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Location Card */}
                        <View style={{ marginBottom: 20, backgroundColor: "#FFFFFF", borderRadius: 24, padding: 24, borderWidth: 2, borderColor: "#F3F4F6" }}>
                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
                                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#EDE9FE", alignItems: "center", justifyContent: "center" }}>
                                    <MapPinned size={22} color="#8B5CF6" strokeWidth={2.5} />
                                </View>
                                <Text style={{ fontSize: 17, fontWeight: "800", color: "#111827", marginLeft: 14 }}>
                                    Where will it be?
                                </Text>
                            </View>

                            <View style={{ marginBottom: 16 }}>
                                <Text style={{ fontSize: 14, fontWeight: "700", color: "#6B7280", marginBottom: 12, textTransform: "uppercase" }}>📍 Event Location</Text>
                                <GooglePlacesTextInput
                                    scrollEnabled={false}
                                    placeHolderText={formData.address1 || "Enter event location..."}
                                    onFocus={() => setFocusedField("address1")}
                                    style={{
                                        input: { borderWidth: 2, borderColor: focusedField === "address1" ? "#8B5CF6" : "#E5E7EB", borderRadius: 12, backgroundColor: "#F9FAFB", padding: 12 },
                                        suggestionsList: { backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 0.2, borderColor: "lightgrey" },
                                        suggestionItem: { backgroundColor: "#FFFFFF", borderColor: "lightgrey", borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 4 },
                                    }}
                                    fetchDetails={true}
                                    apiKey="AIzaSyA5YGDeZpa2bcYGeZQ7XJOSVPTQCh-HrG8"
                                    onPlaceSelect={(place) => {
                                        setFormData({
                                            ...formData,
                                            address1: place.structuredFormat.mainText.text,
                                            address2: place.structuredFormat.secondaryText?.text || "",
                                        });
                                        setErrors({ ...errors, address1: "" });
                                    }}
                                />
                                {errors.address1 && <Text style={{ fontSize: 11, color: "#EF4444", marginTop: 6, fontWeight: "600" }}>⚠️ {errors.address1}</Text>}
                            </View>

                            {formData.address1 && (
                                <View style={{ backgroundColor: "#F5F3FF", borderRadius: 14, padding: 14, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: "#8B5CF6" }}>
                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#8B5CF6", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                                            <Text style={{ fontSize: 16 }}>📍</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 11, fontWeight: "700", color: "#8B5CF6", marginBottom: 4, textTransform: "uppercase" }}>Selected Location</Text>
                                            <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827" }}>{formData.address1}</Text>
                                            {formData.address2 && <Text style={{ fontSize: 13, fontWeight: "500", color: "#6B7280" }}>{formData.address2}</Text>}
                                        </View>
                                    </View>
                                </View>
                            )}

                            {/* Parking */}
                            <View>
                                <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", marginBottom: 10 }}>🅿️ Parking Instructions (optional)</Text>
                                <TextInput
                                    style={{ backgroundColor: focusedField === "parking" ? "#F5F3FF" : "#F9FAFB", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontWeight: "600", color: "#111827", borderWidth: 2, borderColor: focusedField === "parking" ? "#8B5CF6" : "#E5E7EB" }}
                                    placeholder="e.g. Free valet, Street parking..."
                                    placeholderTextColor="#D1D5DB"
                                    value={formData.parking}
                                    onChangeText={(v) => handleInputChange("parking", v)}
                                    onFocus={() => setFocusedField("parking")}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>
                        </View>
                    </View>
                </Animated.ScrollView>

                {/* Floating Save Button */}
                <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 20, paddingBottom: insets.bottom + 16, backgroundColor: "#FFFFFF", borderTopWidth: 1, borderTopColor: "#E5E7EB" }}>
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={saving}
                        style={{ backgroundColor: saving ? "#D1D5DB" : "#8B5CF6", borderRadius: 20, paddingVertical: 20, alignItems: "center", flexDirection: "row", justifyContent: "center" }}
                    >
                        {saving ? (
                            <ActivityIndicator color="#FFFFFF" style={{ marginRight: 10 }} />
                        ) : (
                            <Check size={20} color="#FFFFFF" strokeWidth={3} style={{ marginRight: 10 }} />
                        )}
                        <Text style={{ fontSize: 18, fontWeight: "800", color: "#FFFFFF" }}>
                            {saving ? "Saving..." : "Save Changes"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Date Picker Modal */}
            <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.6)" }}>
                    <View style={{ backgroundColor: "#FFFFFF", borderRadius: 24, padding: 24, width: "90%", maxWidth: 400 }}>
                        <Text style={{ fontSize: 22, fontWeight: "800", color: "#8B5CF6", marginBottom: 20, textAlign: "center" }}>📅 Select Date</Text>
                        <View style={{ alignItems: "center" }}>
                            <DateTimePicker value={selectedDate} mode="date" display={Platform.OS === "ios" ? "inline" : "default"} minimumDate={new Date()} onChange={(_, date) => date && setSelectedDate(date)} />
                        </View>
                        <View style={{ marginTop: 20, gap: 12 }}>
                            <TouchableOpacity onPress={() => handleDateConfirm(selectedDate)} style={{ backgroundColor: "#8B5CF6", borderRadius: 16, paddingVertical: 16, alignItems: "center" }}>
                                <Text style={{ fontSize: 16, fontWeight: "800", color: "#FFFFFF" }}>Confirm Date</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)} style={{ backgroundColor: "#F3F4F6", borderRadius: 16, paddingVertical: 14, alignItems: "center" }}>
                                <Text style={{ fontSize: 14, fontWeight: "700", color: "#6B7280" }}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Time Picker Modal */}
            <Modal visible={showTimePicker} transparent animationType="fade" onRequestClose={() => setShowTimePicker(false)}>
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.6)" }}>
                    <View style={{ backgroundColor: "#FFFFFF", borderRadius: 24, padding: 24, width: "85%", maxWidth: 350 }}>
                        <Text style={{ fontSize: 22, fontWeight: "800", color: "#8B5CF6", marginBottom: 20, textAlign: "center" }}>⏰ Select Time</Text>
                        <View style={{ alignItems: "center" }}>
                            <DateTimePicker value={selectedTime} mode="time" display="spinner" minuteInterval={5} onChange={(_, time) => time && setSelectedTime(time)} />
                        </View>
                        <View style={{ marginTop: 20, gap: 12 }}>
                            <TouchableOpacity onPress={() => handleTimeConfirm(selectedTime)} style={{ backgroundColor: "#8B5CF6", borderRadius: 16, paddingVertical: 16, alignItems: "center" }}>
                                <Text style={{ fontSize: 16, fontWeight: "800", color: "#FFFFFF" }}>Confirm Time</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setShowTimePicker(false)} style={{ backgroundColor: "#F3F4F6", borderRadius: 16, paddingVertical: 14, alignItems: "center" }}>
                                <Text style={{ fontSize: 14, fontWeight: "700", color: "#6B7280" }}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

