import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Info } from "lucide-react-native";
import { FOREST, INPUT_BG, MINT_PANEL } from "./designInviteTheme";

type EventDetailsLocationCardProps = {
  address1: string;
  address2: string;
  parking: string;
  parkingFocused: boolean;
  onParkingChange: (value: string) => void;
  onParkingFocus: () => void;
  onParkingBlur: () => void;
  onRequestParkingNotes?: () => void;
};

export default function EventDetailsLocationCard(props: EventDetailsLocationCardProps) {
  const {
    address1,
    address2,
    parking,
    parkingFocused,
    onParkingChange,
    onParkingFocus,
    onParkingBlur,
    onRequestParkingNotes,
  } = props;

  return (
    <View
      style={{
        marginBottom: 24,
        backgroundColor: INPUT_BG,
        borderRadius: 20,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: "#E5E7EB",
      }}
    >
      <View style={{ height: 100, backgroundColor: MINT_PANEL, position: "relative" }}>
        <View
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: FOREST,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "800" }}>P</Text>
        </View>
        <View
          style={{
            position: "absolute",
            bottom: 14,
            left: 16,
            right: 16,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: FOREST,
              marginRight: 8,
            }}
          />
          <Text style={{ color: FOREST, fontSize: 13, fontWeight: "600", flex: 1 }} numberOfLines={1}>
            {address1 ? address1 : "Pin will appear from your address"}
          </Text>
        </View>
      </View>

      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: "800", color: FOREST, marginBottom: 12 }}>Location & Parking</Text>

        {address1 ? (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#374151" }}>{address1}</Text>
            {address2 ? <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{address2}</Text> : null}
          </View>
        ) : null}

        <Text style={{ fontSize: 11, fontWeight: "800", color: FOREST, letterSpacing: 0.8, marginBottom: 8 }}>
          PARKING INSTRUCTIONS
        </Text>

        <TouchableOpacity
          onPress={() => {
            onRequestParkingNotes?.();
            onParkingFocus();
          }}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 13, fontWeight: "800", color: FOREST, letterSpacing: 0.6, marginBottom: 8 }}>
            ADD PARKING NOTES +
          </Text>
        </TouchableOpacity>

        <TextInput
          style={{
            backgroundColor: parkingFocused ? "#F0FDF4" : "#F9FAFB",
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 15,
            fontWeight: "600",
            color: "#111827",
            borderWidth: 1.5,
            borderColor: parkingFocused ? FOREST : "#E5E7EB",
            minHeight: 88,
            textAlignVertical: "top",
          }}
          placeholder="e.g. Valet parking at entrance..."
          placeholderTextColor="#9CA3AF"
          value={parking}
          onChangeText={onParkingChange}
          onFocus={onParkingFocus}
          onBlur={onParkingBlur}
          multiline
        />

        <View
          style={{
            marginTop: 14,
            flexDirection: "row",
            alignItems: "flex-start",
            backgroundColor: MINT_PANEL,
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: "#BBF7D0",
          }}
        >
          <Info size={18} color={FOREST} style={{ marginRight: 8, marginTop: 1 }} />
          <Text style={{ fontSize: 13, color: FOREST, flex: 1, lineHeight: 18, fontWeight: "600" }}>
            Accessible ramp located on the East Side of the building.
          </Text>
        </View>
      </View>
    </View>
  );
}
