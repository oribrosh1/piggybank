/**
 * Client-side provider configuration (from EXPO_PUBLIC_* env).
 * Authoritative runtime config is returned by GET /getProviderConfig on the backend.
 */

export type BankingProvider = 'stripe' | 'unit';
export type PaymentsProvider = 'stripe' | 'unit';

function normalizeProvider(value: string | undefined, fallback: BankingProvider): BankingProvider {
  const v = (value || '').trim().toLowerCase();
  return v === 'unit' || v === 'stripe' ? v : fallback;
}

export const BANKING_PROVIDER: BankingProvider = normalizeProvider(
  process.env.EXPO_PUBLIC_BANKING_PROVIDER,
  'stripe'
);

export const PAYMENTS_PROVIDER: PaymentsProvider = normalizeProvider(
  process.env.EXPO_PUBLIC_PAYMENTS_PROVIDER,
  'stripe'
) as PaymentsProvider;

export function isUnitBanking(): boolean {
  return BANKING_PROVIDER === 'unit';
}

export function isStripePayments(): boolean {
  return PAYMENTS_PROVIDER === 'stripe';
}

/** User-facing label for banking setup screens */
export function bankingProviderLabel(): string {
  return BANKING_PROVIDER === 'unit' ? 'banking partner' : 'payment partner';
}
