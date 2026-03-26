import { View, Animated, KeyboardAvoidingView, Platform } from "react-native";
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
  EventDetailsAddressField,
} from "@/src/components/create-event";
import { useEventDetailsScreen } from "./useEventDetailsScreen";
import { MINT_BG } from "@/src/components/create-event/designInviteTheme";

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
    isBarBatMitzvah,
    isPartyMode,
    setOptionalDetailsLater,
    isCreating,
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
      style={{ flex: 1, backgroundColor: MINT_BG }}
    >
      <View style={{ flex: 1, backgroundColor: MINT_BG }}>
        <Animated.ScrollView
          style={{ flex: 1, opacity: fadeAnim, backgroundColor: MINT_BG }}
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          <EventDetailsScreenHeader
            progressWidth={progressWidth}
            progressPercentLabel="50%"
            stepLabel="STEP 2 OF 4"
            onBack={() => router.back()}
          />

          <View style={{ backgroundColor: MINT_BG, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}>
            <EventDetailsNameField
              value={formData.childName}
              error={errors.childName}
              focused={focusedField === "childName"}
              placeholder="Emma"
              onChange={(v) => handleInputChange("childName", v)}
              onFocus={() => setFocusedField("childName")}
              onBlur={clearFocus}
            />

            <EventDetailsAgeField
              value={formData.age}
              error={errors.age}
              focused={focusedField === "age"}
              onChange={(v) => handleInputChange("age", v)}
              onFocus={() => setFocusedField("age")}
              onBlur={clearFocus}
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

            <EventDetailsAddressField
              addressError={errors.address1}
              addressFocused={focusedField === "address1"}
              onAddressSelect={setAddressFromPlace}
              onAddressFocus={() => setFocusedField("address1")}
              onAddressBlur={clearFocus}
            />

            <EventDetailsOptionalCard
              formData={formData}
              showEventDetails={showEventDetails}
              optionalDetailsLater={formData.optionalDetailsLater ?? false}
              onOptionalDetailsLaterChange={setOptionalDetailsLater}
              focusedField={focusedField}
              isBarBatMitzvah={!!isBarBatMitzvah}
              isPartyMode={!!isPartyMode}
              onToggleDetails={() => setShowEventDetails(!showEventDetails)}
              onInputChange={handleInputChange}
              setFocusedField={setFocusedField}
            />

            <EventDetailsLocationCard
              address1={formData.address1}
              address2={formData.address2}
              parking={formData.parking ?? ""}
              parkingFocused={focusedField === "parking"}
              onParkingChange={(v) => handleInputChange("parking", v)}
              onParkingFocus={() => setFocusedField("parking")}
              onParkingBlur={clearFocus}
            />
          </View>
        </Animated.ScrollView>

        <EventDetailsScreenFooter onContinue={handleContinue} loading={isCreating} disabled={isCreating} />
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
