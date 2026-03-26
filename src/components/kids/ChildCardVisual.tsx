import React from "react";
import { View, Text } from "react-native";
import { CreditCard, Snowflake } from "lucide-react-native";

type ChildCardVisualProps = {
  last4: string;
  expMonth: number;
  expYear: number;
  status: "active" | "inactive" | "canceled";
  brand: string;
  balance: number;
  childName: string | null;
};

export default function ChildCardVisual({
  last4,
  expMonth,
  expYear,
  status,
  balance,
  childName,
}: ChildCardVisualProps) {
  const isFrozen = status === "inactive";
  const balanceFormatted = (Math.abs(balance) / 100).toFixed(2);

  return (
    <View style={{ marginBottom: 20 }}>
      <View
        style={{
          backgroundColor: isFrozen ? "#94A3B8" : "#06D6A0",
          borderRadius: 20,
          padding: 22,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.25,
          shadowRadius: 18,
          elevation: 10,
          overflow: "hidden",
        }}
      >
        {isFrozen && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(148, 163, 184, 0.3)",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <Snowflake size={48} color="#FFFFFF" strokeWidth={1.5} />
            <Text
              style={{
                fontSize: 14,
                fontWeight: "800",
                color: "#FFFFFF",
                marginTop: 8,
                letterSpacing: 1,
              }}
            >
              CARD FROZEN
            </Text>
          </View>
        )}

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 28,
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 17,
                fontWeight: "800",
                color: "#6B3AA0",
              }}
            >
              CreditKid
            </Text>
            {childName && (
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: "#4D2875",
                  marginTop: 2,
                }}
              >
                {childName}
              </Text>
            )}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                backgroundColor: isFrozen ? "#64748B" : "#10B981",
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  color: "#FFFFFF",
                }}
              >
                {isFrozen ? "FROZEN" : "ACTIVE"}
              </Text>
            </View>
            <CreditCard size={22} color="#6B3AA0" strokeWidth={2.5} />
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 11,
              color: "#4D2875",
              marginBottom: 8,
              fontWeight: "700",
            }}
          >
            CARD NUMBER
          </Text>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: "#6B3AA0",
              letterSpacing: 2,
            }}
          >
            •••• •••• •••• {last4}
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 11,
                color: "#4D2875",
                marginBottom: 4,
                fontWeight: "700",
              }}
            >
              VALID THRU
            </Text>
            <Text
              style={{ fontSize: 15, fontWeight: "700", color: "#6B3AA0" }}
            >
              {String(expMonth).padStart(2, "0")}/{String(expYear).slice(-2)}
            </Text>
          </View>
          <View>
            <Text
              style={{
                fontSize: 11,
                color: "#4D2875",
                marginBottom: 4,
                fontWeight: "700",
              }}
            >
              BALANCE
            </Text>
            <Text
              style={{ fontSize: 15, fontWeight: "700", color: "#6B3AA0" }}
            >
              ${balanceFormatted}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
