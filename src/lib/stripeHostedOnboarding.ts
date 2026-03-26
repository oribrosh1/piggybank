import * as WebBrowser from "expo-web-browser";
import type { Router } from "expo-router";
import { createOnboardingLink } from "@/src/lib/api";
import { routes } from "@/types/routes";

/** Must match backend HTTPS return URL — Stripe + ASWebAuthenticationSession require HTTPS, not custom schemes. */
const STRIPE_ONBOARDING_RETURN_REDIRECT =
  process.env.EXPO_PUBLIC_BANKING_RETURN_URL || "https://creditkid.vercel.app/banking/setup/success";

/**
 * Opens Stripe Connect hosted KYC (Account Link in browser).
 * The backend creates a Connect account from the signed-in user's email/name if needed — no in-app KYC forms.
 * Return URL is HTTPS (Vercel); the auth session dismisses when that URL loads — the success page does not need to deep-link.
 * After the auth session ends, navigates to in-app banking success (same for iOS success redirect and Android dismiss-after-return).
 */
export async function navigateToStripeConnectOrPersonalInfo(router: Router): Promise<void> {
  const onboarding = await createOnboardingLink();
  const url = onboarding.url?.trim();
  if (!url || !/^https:\/\//i.test(url)) {
    throw new Error("Invalid onboarding link from server.");
  }
  await WebBrowser.openAuthSessionAsync(url, STRIPE_ONBOARDING_RETURN_REDIRECT);
  router.replace(routes.banking.setup.success);
}
