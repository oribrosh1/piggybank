import { useState, useCallback } from "react";
import { Platform, Alert } from "react-native";
import {
  getCardDetailsWithWallet,
  createPushProvisioningEphemeralKey,
} from "@/src/lib/api";

let AppleWallet: typeof import("../../modules/apple-wallet/src") | null = null;
if (Platform.OS === "ios") {
  try {
    AppleWallet = require("../../modules/apple-wallet/src");
  } catch {
    // Native module not available (Expo Go or Android)
  }
}

export type AppleWalletStatus =
  | "idle"
  | "checking"
  | "can_add"
  | "already_added"
  | "unavailable"
  | "provisioning"
  | "success"
  | "error";

export function useAppleWallet() {
  const [status, setStatus] = useState<AppleWalletStatus>("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported = Platform.OS === "ios" && AppleWallet?.isAvailable === true;

  const checkEligibility = useCallback(async () => {
    if (!isSupported || !AppleWallet) {
      setStatus("unavailable");
      return;
    }

    try {
      setStatus("checking");
      setLoading(true);
      setError(null);

      const cardDetails = await getCardDetailsWithWallet();

      const result = await AppleWallet.canAddCardToWallet(
        cardDetails.last4,
        cardDetails.primaryAccountIdentifier ?? ""
      );

      if (result.isAlreadyAdded) {
        setStatus("already_added");
      } else if (result.canAddCard) {
        setStatus("can_add");
      } else {
        setStatus("unavailable");
        setError(result.details ?? "Card cannot be added");
      }
    } catch (err: unknown) {
      setStatus("error");
      const msg =
        err instanceof Error ? err.message : "Failed to check wallet eligibility";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  const addToWallet = useCallback(async () => {
    if (!isSupported || !AppleWallet) {
      Alert.alert("Unavailable", "Apple Wallet is only available on iOS devices.");
      return;
    }

    try {
      setStatus("provisioning");
      setLoading(true);
      setError(null);

      const { ephemeralKey } = await createPushProvisioningEphemeralKey();
      const ephemeralKeyJson = JSON.stringify(ephemeralKey);

      const result = await AppleWallet.startPushProvisioning(ephemeralKeyJson);

      if (result.success) {
        setStatus("success");
        Alert.alert("Success", "Your card has been added to Apple Wallet!");
      } else {
        setStatus("error");
        setError(result.error ?? "Failed to add card");
        if (result.error && !result.error.includes("cancelled")) {
          Alert.alert("Error", result.error);
        }
      }
    } catch (err: unknown) {
      setStatus("error");
      const msg =
        err instanceof Error ? err.message : "Failed to add card to wallet";
      setError(msg);
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  return {
    status,
    loading,
    error,
    isSupported,
    checkEligibility,
    addToWallet,
  };
}
