import React from "react";
import { View, Text } from "react-native";
import { MapPin } from "lucide-react-native";
import GooglePlacesTextInput from "react-native-google-places-textinput";
import { FOREST, INPUT_BG } from "./designInviteTheme";

const GOOGLE_PLACES_API_KEY = "AIzaSyA5YGDeZpa2bcYGeZQ7XJOSVPTQCh-HrG8";

type EventDetailsAddressFieldProps = {
  addressError?: string;
  addressFocused: boolean;
  onAddressSelect: (address1: string, address2: string) => void;
  onAddressFocus: () => void;
  onAddressBlur: () => void;
};

export default function EventDetailsAddressField({
  addressError,
  addressFocused,
  onAddressSelect,
  onAddressFocus,
  onAddressBlur,
}: EventDetailsAddressFieldProps) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "800",
          color: FOREST,
          letterSpacing: 1.2,
          marginBottom: 8,
        }}
      >
        ADDRESS
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: INPUT_BG,
          borderRadius: 16,
          borderWidth: 2,
          borderColor: addressFocused ? FOREST : addressError ? "#EF4444" : "#E5E7EB",
          paddingRight: 12,
          minHeight: 52,
        }}
      >
        <View style={{ flex: 1 }}>
          <GooglePlacesTextInput
            scrollEnabled={false}
            placeHolderText="Start typing address..."
            onFocus={onAddressFocus}
            onTouchStart={onAddressFocus}
            style={{
              input: {
                borderWidth: 0,
                borderRadius: 14,
                backgroundColor: "transparent",
                paddingHorizontal: 14,
                paddingVertical: 14,
                fontSize: 15,
                fontWeight: "600",
                color: "#111827",
              },
              suggestionsList: {
                backgroundColor: "#FFFFFF",
                borderRadius: 12,
                borderWidth: 0.2,
                borderColor: "lightgrey",
              },
              suggestionItem: {
                backgroundColor: "#FFFFFF",
                borderColor: "lightgrey",
                borderWidth: 1,
                borderRadius: 12,
                padding: 12,
                marginBottom: 4,
              },
            }}
            fetchDetails={true}
            apiKey={GOOGLE_PLACES_API_KEY}
            onPlaceSelect={(place) => {
              const main = place.structuredFormat?.mainText?.text ?? "";
              const secondary = place.structuredFormat?.secondaryText?.text ?? "";
              onAddressSelect(main, secondary);
              onAddressBlur();
            }}
          />
        </View>
        <MapPin size={22} color={FOREST} strokeWidth={2.2} />
      </View>
      {addressError ? (
        <Text style={{ fontSize: 12, color: "#EF4444", marginTop: 6, fontWeight: "600" }}>{addressError}</Text>
      ) : null}
    </View>
  );
}
