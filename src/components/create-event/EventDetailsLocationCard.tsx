import React from "react";
import { View, Text, TextInput } from "react-native";
import { MapPinned } from "lucide-react-native";
import GooglePlacesTextInput from "react-native-google-places-textinput";

const GOOGLE_PLACES_API_KEY = "AIzaSyA5YGDeZpa2bcYGeZQ7XJOSVPTQCh-HrG8";

type EventDetailsLocationCardProps = {
  address1: string;
  address2: string;
  parking: string;
  addressError?: string;
  addressFocused: boolean;
  parkingFocused: boolean;
  onAddressSelect: (address1: string, address2: string) => void;
  onParkingChange: (value: string) => void;
  onAddressFocus: () => void;
  onAddressBlur: () => void;
  onParkingFocus: () => void;
  onParkingBlur: () => void;
};

export default function EventDetailsLocationCard(props: EventDetailsLocationCardProps) {
  const {
    address1,
    address2,
    parking,
    addressError,
    addressFocused,
    parkingFocused,
    onAddressSelect,
    onParkingChange,
    onAddressFocus,
    onAddressBlur,
    onParkingFocus,
    onParkingBlur,
  } = props;

  return (
    <View
      style={{
        marginBottom: 20,
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        borderWidth: 2,
        borderColor: "#F3F4F6",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: "#E0F7F2",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MapPinned size={22} color="#06D6A0" strokeWidth={2.5} />
        </View>
        <Text style={{ fontSize: 17, fontWeight: "800", color: "#111827", marginLeft: 14, letterSpacing: 0.3 }}>
          Where will it be?
        </Text>
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#6B7280", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
          📍 Event Location
        </Text>
        <GooglePlacesTextInput
          scrollEnabled={false}
          placeHolderText="Enter event location..."
          onFocus={onAddressFocus}
          onTouchStart={onAddressFocus}
          style={{
            input: {
              borderWidth: addressFocused ? 2 : 1,
              borderColor: addressFocused ? "#06D6A0" : "#E5E7EB",
              borderRadius: 12,
              backgroundColor: addressFocused ? "#E0F7F2" : "#F9FAFB",
              padding: 12,
              marginBottom: 4,
            },
            suggestionsList: { backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 0.2, borderColor: "lightgrey" },
            suggestionItem: { backgroundColor: "#FFFFFF", borderColor: "lightgrey", borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 4 },
          }}
          fetchDetails={true}
          apiKey={GOOGLE_PLACES_API_KEY}
          onPlaceSelect={(place) => {
            const main = place.structuredFormat?.mainText?.text ?? "";
            const secondary = place.structuredFormat?.secondaryText?.text ?? "";
            onAddressSelect(main, secondary);
          }}
        />
        {addressError && (
          <Text style={{ fontSize: 11, color: "#EF4444", marginTop: 6, fontWeight: "600" }}>⚠️ {addressError}</Text>
        )}
      </View>

      {address1 ? (
        <View style={{ backgroundColor: "#F0FDFA", borderRadius: 14, padding: 14, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: "#06D6A0" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#06D6A0", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
              <Text style={{ fontSize: 16 }}>📍</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#06D6A0", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Selected Location</Text>
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 2 }}>{address1}</Text>
              {address2 ? <Text style={{ fontSize: 13, fontWeight: "500", color: "#6B7280" }}>{address2}</Text> : null}
            </View>
          </View>
        </View>
      ) : null}

      <View>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
          <Text style={{ fontSize: 16 }}>🅿️</Text>
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280", marginLeft: 8 }}>Parking Instructions</Text>
          <Text style={{ fontSize: 11, fontWeight: "500", color: "#9CA3AF", marginLeft: 6 }}>(optional)</Text>
        </View>
        <TextInput
          style={{
            backgroundColor: parkingFocused ? "#F0FDFA" : "#F9FAFB",
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 15,
            fontWeight: "600",
            color: "#111827",
            borderWidth: 1.5,
            borderColor: parkingFocused ? "#06D6A0" : "#E5E7EB",
          }}
          placeholder="e.g. Free valet, Street parking available..."
          placeholderTextColor="#D1D5DB"
          value={parking}
          onChangeText={onParkingChange}
          onFocus={onParkingFocus}
          onBlur={onParkingBlur}
        />
      </View>
    </View>
  );
}
