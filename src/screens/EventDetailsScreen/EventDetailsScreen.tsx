import { useRef, useCallback } from "react";
import {
  View,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import {
  EventDetailsScreenHeader,
  EventDetailsScreenFooter,
  EventDatePickerModal,
  EventTimePickerModal,
  EventDetailsCelebrationCard,
  EventDetailsCelebrationTypeCard,
  EventDetailsOptionalCard,
  EventDetailsDateTimeCard,
  EventDetailsLocationCard,
  EventDetailsAddressField,
  EventDetailsKosherCateringCard,
} from "@/src/components/create-event";
import { useEventDetailsScreen } from "./useEventDetailsScreen";
import { spacing } from "@/src/theme";
import EventThemeAndVibeCard from "@/src/components/create-event/EventThemeAndVibeCard";

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
  const scrollRef = useRef<ScrollView>(null);
  const scrollToTopOnError = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const {
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
    handleContinue,
    handleInputChange,
    setCelebrationType,
    setMitzvahCelebrationFocus,
    setAddressFromPlace,
    formatDateDisplay,
    handleDateConfirm,
    handleTimeConfirm,
    isBarBatMitzvah,
    isPartyMode,
    showCelebrationTypeSection,
    setOptionalDetailsLater,
    pickHonoreePhoto,
    clearHonoreePhoto,
  } = useEventDetailsScreen({ scrollToTopOnError });

  const themeInputRef = useRef<TextInput>(null);

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
      style={styles.screen}
    >
      <View style={styles.screen}>
        <Animated.ScrollView
          ref={scrollRef}
          style={[styles.scroll, { opacity: fadeAnim }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          <EventDetailsScreenHeader onBack={() => router.back()} />

          <View style={styles.formBlock}>
            <EventDetailsCelebrationCard
              childName={formData.childName}
              age={formData.age}
              honoreePhotoUri={formData.honoreePhotoUri}
              nameError={errors.childName}
              ageError={errors.age}
              nameFocused={focusedField === "childName"}
              ageFocused={focusedField === "age"}
              onNameChange={(v) => handleInputChange("childName", v)}
              onAgeChange={(v) => handleInputChange("age", v)}
              onNameFocus={() => setFocusedField("childName")}
              onNameBlur={clearFocus}
              onAgeFocus={() => setFocusedField("age")}
              onAgeBlur={clearFocus}
              onPickHonoreePhoto={pickHonoreePhoto}
              onClearHonoreePhoto={clearHonoreePhoto}
              honoreeGender={formData.honoreeGender}
              honoreeGenderError={errors.honoreeGender}
              onHonoreeGenderChange={(g) => handleInputChange("honoreeGender", g)}
            />

            {showCelebrationTypeSection ? (
              <EventDetailsCelebrationTypeCard
                celebrationType={formData.celebrationType ?? "birthday"}
                mitzvahCelebrationFocus={formData.mitzvahCelebrationFocus}
                mitzvahFocusError={errors.mitzvahCelebrationFocus}
                onCelebrationTypeChange={setCelebrationType}
                onMitzvahFocusChange={setMitzvahCelebrationFocus}
              />
            ) : null}

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
              locationNotes={formData.locationNotes ?? ""}
              parking={formData.parking ?? ""}
              locationNotesFocused={focusedField === "locationNotes"}
              parkingFocused={focusedField === "parking"}
              onLocationNotesChange={(v) =>
                handleInputChange("locationNotes", v)
              }
              onParkingChange={(v) => handleInputChange("parking", v)}
              onLocationNotesFocus={() =>
                setFocusedField("locationNotes")
              }
              onLocationNotesBlur={clearFocus}
              onParkingFocus={() => setFocusedField("parking")}
              onParkingBlur={clearFocus}
            />
            
            <EventThemeAndVibeCard
              formData={formData}
              focusedField={focusedField}
              setFocusedField={setFocusedField}
              isPartyMode={!!isPartyMode}
              onInputChange={handleInputChange}
              themeInputRef={themeInputRef}
            />


            {/* <EventDetailsKosherCateringCard
              selected={formData.kosherCateringPartnerId}
              onSelect={(value) => handleInputChange("kosherCateringPartnerId", value)}
            /> */}

            <EventDetailsOptionalCard
              formData={formData}
              showEventDetails={showEventDetails}
              optionalDetailsLater={formData.optionalDetailsLater ?? false}
              onOptionalDetailsLaterChange={setOptionalDetailsLater}
              focusedField={focusedField}
              setFocusedField={setFocusedField}

              isBarBatMitzvah={!!isBarBatMitzvah}
              isPartyMode={!!isPartyMode}
              onToggleDetails={() => setShowEventDetails(!showEventDetails)}
              onInputChange={handleInputChange}
            />
{/* 
            <EventDetailsLocationCard
              address1={formData.address1}
              address2={formData.address2}
              locationNotes={formData.locationNotes}
              parking={formData.parking}
            /> */}
          </View>
        </Animated.ScrollView>

        <EventDetailsScreenFooter
          onContinue={handleContinue}
          ctaTitle="Review summary"
        />
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scroll: {
    flex: 1,
    backgroundColor: "transparent",
  },
  /** Space for absolute footer + comfortable scroll end */
  scrollContent: {
    paddingBottom: spacing[6] * 6,
  },
  formBlock: {
    backgroundColor: "transparent",
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
});
