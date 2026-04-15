import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { routes } from "@/types/routes";
import { getAccountDetails } from "@/src/lib/api";
import { useProvisioningStatus } from "@/src/hooks/useProvisioningStatus";
import firebase from "@/src/firebase";
import { colors, primaryGradient, radius, spacing, typography } from "@/src/theme";

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
          backgroundColor: colors.surfaceContainerLowest,
          paddingHorizontal: 28,
        }}
      >
        <Text
          style={[
            typography.titleLg,
            { fontWeight: "800", marginBottom: spacing[3], textAlign: "center" },
          ]}
        >
          Card issuing not ready
        </Text>
        <Text
          style={[
            typography.bodyMd,
            {
              fontSize: 15,
              color: colors.onSurfaceVariant,
              textAlign: "center",
              lineHeight: 22,
              marginBottom: spacing[6],
            },
          ]}
        >
          Stripe has not activated card issuing on your account yet. Finish Connect verification in the Stripe-hosted
          flow, or wait until the platform completes Issuing onboarding.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace(routes.tabs.home)}
          activeOpacity={0.9}
          style={{ borderRadius: radius.sm, overflow: "hidden" }}
        >
          <LinearGradient
            {...primaryGradient}
            style={{
              paddingVertical: 14,
              paddingHorizontal: spacing[6],
              borderRadius: radius.sm,
            }}
          >
            <Text style={[typography.bodyLg, { fontWeight: "800", color: colors.onPrimary }]}>Back to Home</Text>
          </LinearGradient>
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
          backgroundColor: colors.surfaceContainerLowest,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[typography.bodyMd, { fontSize: 15, marginTop: spacing[3], color: colors.onSurfaceVariant }]}>
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
        backgroundColor: colors.surfaceContainerLowest,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[typography.bodyMd, { fontSize: 15, marginTop: spacing[3], color: colors.onSurfaceVariant }]}>
        Redirecting...
      </Text>
    </View>
  );
}
