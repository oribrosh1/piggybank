import { View, Text, ActivityIndicator } from "react-native";
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

  useEffect(() => {
    (async () => {
      try {
        const details = await getAccountDetails();
        if (details.virtualCardId) {
          router.replace(routes.tabs.banking);
          return;
        }
      } catch {
        // ignore
      }

      if (!provLoading && provisioning) {
        if (provisioning.status === "complete") {
          router.replace(routes.tabs.banking);
        } else {
          router.replace(routes.banking.setup.success);
        }
        return;
      }

      setChecking(false);
    })();
  }, [provLoading, provisioning]);

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
