import { useState, useCallback, useEffect } from "react";
import { getAccountStatus } from "@/src/lib/api";
import type { AccountStatusResponse } from "@/src/lib/api";
import firebase from "@/src/firebase";

export interface UseAccountStatusResult {
  accountStatus: AccountStatusResponse | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Shared hook for Stripe Connect account status.
 * Use in screens that need to know if the user has an account and its state.
 * For full banking data (balance, transactions, etc.) use useBankingScreen.
 */
export function useAccountStatus(): UseAccountStatusResult {
  const [accountStatus, setAccountStatus] = useState<AccountStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    const user = firebase.auth().currentUser;
    if (!user) {
      setAccountStatus(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const status = await getAccountStatus();
      setAccountStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setAccountStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { accountStatus, loading, error, refetch };
}
