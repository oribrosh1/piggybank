import { View, Animated, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  EventDetailsScreenHeader,
  EventDetailsScreenFooter,
  EventDatePickerModal,
  EventTimePickerModal,
  EventDetailsAgeField,
  EventDetailsNameField,
  EventDetailsOptionalCard,
  EventDetailsDateTimeCard,
  EventDetailsLocationCard,
} from "@/src/components/create-event";
import { useEventDetailsScreen } from "./useEventDetailsScreen";

function parseTimeToDate(timeStr: string): Date | null {
  const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!timeMatch) return null;
  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const period = timeMatch[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  else if (period === "AM" && hours === 12) hours = 0;
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export default function EventDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
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
    fadeAnim,
    progressWidth,
    handleContinue,
    handleInputChange,
    setAddressFromPlace,
    formatDateDisplay,
    handleDateConfirm,
    handleTimeConfirm,
    isBirthday,
    isBarBatMitzvah,
    isPartyMode,
  } = useEventDetailsScreen();

  const openDatePicker = () => {
    if (formData.date) {
      const [y, m, d] = formData.date.split("-").map(Number);
      setSelectedDate(new Date(y, m - 1, d));
    } else {
      setSelectedDate(new Date());
    }
    setShowDatePicker(true);
    setFocusedField("date");
  };

  const openTimePicker = () => {
    if (formData.time) {
      const parsed = parseTimeToDate(formData.time);
      setSelectedTime(parsed ?? new Date());
    } else {
      setSelectedTime(new Date());
    }
    setShowTimePicker(true);
    setFocusedField("time");
  };

  const clearFocus = () => setFocusedField(null);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
    >
      <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        <Animated.ScrollView
          style={{ flex: 1, opacity: fadeAnim, backgroundColor: "#FFFFFF" }}
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          <EventDetailsScreenHeader
            progressWidth={progressWidth}
            isBirthday={!!isBirthday}
            onBack={() => router.back()}
          />

          <View style={{ backgroundColor: "#FFFFFF", paddingHorizontal: 24, paddingTop: 28 }}>
            {isBirthday && (
              <EventDetailsAgeField
                value={formData.age}
                error={errors.age}
                focused={focusedField === "age"}
                onChange={(v) => handleInputChange("age", v)}
                onFocus={() => setFocusedField("age")}
                onBlur={clearFocus}
              />
            )}

            <EventDetailsNameField
              value={formData.eventName}
              error={errors.eventName}
              focused={focusedField === "eventName"}
              placeholder={isBirthday ? "Emma's Sweet 16 Birthday" : "Sarah's Bat Mitzvah"}
              onChange={(v) => handleInputChange("eventName", v)}
              onFocus={() => setFocusedField("eventName")}
              onBlur={clearFocus}
            />

            <EventDetailsOptionalCard
              formData={formData}
              showEventDetails={showEventDetails}
              focusedField={focusedField}
              isBarBatMitzvah={!!isBarBatMitzvah}
              isPartyMode={!!isPartyMode}
              onToggleDetails={() => setShowEventDetails(!showEventDetails)}
              onInputChange={handleInputChange}
              setFocusedField={setFocusedField}
            />

            <EventDetailsDateTimeCard
              dateValue={formData.date}
              timeValue={formData.time}
              dateError={errors.date}
              timeError={errors.time}
              dateFocused={focusedField === "date"}
              timeFocused={focusedField === "time"}
              formatDateDisplay={formatDateDisplay}
              onDatePress={openDatePicker}
              onTimePress={openTimePicker}
            />

            <EventDetailsLocationCard
              address1={formData.address1}
              address2={formData.address2}
              parking={formData.parking ?? ""}
              addressError={errors.address1}
              addressFocused={focusedField === "address1"}
              parkingFocused={focusedField === "parking"}
              onAddressSelect={setAddressFromPlace}
              onParkingChange={(v) => handleInputChange("parking", v)}
              onAddressFocus={() => setFocusedField("address1")}
              onAddressBlur={clearFocus}
              onParkingFocus={() => setFocusedField("parking")}
              onParkingBlur={clearFocus}
            />
          </View>
        </Animated.ScrollView>

        <EventDetailsScreenFooter onContinue={handleContinue} />
      </View>

      <EventDatePickerModal
        visible={showDatePicker}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onConfirm={(date: Date) => {
          handleDateConfirm(date);
          clearFocus();
        }}
        onCancel={() => {
          setShowDatePicker(false);
          clearFocus();
        }}
      />

      <EventTimePickerModal
        visible={showTimePicker}
        selectedTime={selectedTime}
        onTimeChange={setSelectedTime}
        onConfirm={(time) => {
          handleTimeConfirm(time);
          clearFocus();
        }}
        onCancel={() => {
          setShowTimePicker(false);
          clearFocus();
        }}
      />
    </KeyboardAvoidingView>
  );
}
