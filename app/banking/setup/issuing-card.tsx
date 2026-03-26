import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { routes } from "@/types/routes";
import { getAccountDetails } from "@/src/lib/api";
import { useProvisioningStatus } from "@/src/hooks/useProvisioningStatus";
import firebase from "@/src/firebase";

export default function IssuingCardScreen() {
  const router = useRouter();
  const uid = firebase.auth().currentUser?.uid || null;
  const { data: provisioning, loading: provLoading } = useProvisioningStatus(uid);
  const [checking, setChecking] = useState(true);
  const [issuingBlocked, setIssuingBlocked] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const details = await getAccountDetails();
        const issuing = details.capabilities?.card_issuing;
        if (issuing !== undefined && issuing !== "active") {
          setIssuingBlocked(true);
          setChecking(false);
          return;
        }
        if (details.virtualCardId) {
          router.replace(routes.tabs.home);
          return;
        }
      } catch {
        // ignore
      }

      if (!provLoading && provisioning) {
        if (provisioning.status === "complete") {
          router.replace(routes.tabs.home);
        } else {
          router.replace(routes.banking.setup.success);
        }
        return;
      }

      setChecking(false);
    })();
  }, [provLoading, provisioning]);

  if (issuingBlocked) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FFFFFF",
          paddingHorizontal: 28,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 12, textAlign: "center" }}>
          Card issuing not ready
        </Text>
        <Text style={{ fontSize: 15, color: "#6B7280", textAlign: "center", lineHeight: 22, marginBottom: 24 }}>
          Stripe has not activated card issuing on your account yet. Finish Connect verification in the Stripe-hosted
          flow, or wait until the platform completes Issuing onboarding.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace(routes.tabs.home)}
          style={{
            backgroundColor: "#8B5CF6",
            paddingVertical: 14,
            paddingHorizontal: 24,
            borderRadius: 14,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "800", color: "#FFFFFF" }}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (checking || provLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FFFFFF",
        }}
      >
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={{ marginTop: 12, fontSize: 15, color: "#6B7280" }}>
          Checking card status...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
      }}
    >
      <ActivityIndicator size="large" color="#8B5CF6" />
      <Text style={{ marginTop: 12, fontSize: 15, color: "#6B7280" }}>
        Redirecting...
      </Text>
    </View>
  );
}
