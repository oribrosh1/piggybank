import { NativeModulesProxy, EventEmitter, Platform } from "expo-modules-core";

const MODULE_NAME = "AppleWallet";

const AppleWalletModule =
  Platform.OS === "ios" ? NativeModulesProxy[MODULE_NAME] : null;

export interface WalletEligibility {
  canAddCard: boolean;
  isAlreadyAdded: boolean;
  details?: string;
}

export interface ProvisioningResult {
  success: boolean;
  error?: string;
}

/**
 * Check if the device supports Apple Wallet and whether this card can be added.
 * @param cardLastFour - Last 4 digits of the card
 * @param primaryAccountIdentifier - From Stripe card.wallets.apple_pay.primary_account_identifier
 */
export async function canAddCardToWallet(
  cardLastFour: string,
  primaryAccountIdentifier?: string
): Promise<WalletEligibility> {
  if (Platform.OS !== "ios" || !AppleWalletModule) {
    return { canAddCard: false, isAlreadyAdded: false, details: "Not iOS" };
  }
  return AppleWalletModule.canAddCardToWallet(
    cardLastFour,
    primaryAccountIdentifier ?? ""
  );
}

/**
 * Start the Apple Wallet push provisioning flow.
 * Presents the native "Add to Apple Wallet" sheet.
 * @param ephemeralKeyJson - Full ephemeral key JSON string from the backend
 */
export async function startPushProvisioning(
  ephemeralKeyJson: string
): Promise<ProvisioningResult> {
  if (Platform.OS !== "ios" || !AppleWalletModule) {
    return { success: false, error: "Push provisioning is only available on iOS" };
  }
  return AppleWalletModule.startPushProvisioning(ephemeralKeyJson);
}

export const isAvailable = Platform.OS === "ios" && AppleWalletModule != null;
