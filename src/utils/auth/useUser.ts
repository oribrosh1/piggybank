import { useCallback } from "react";
import { useAuth } from "./useAuth";
import { UserCredential } from "@/types/user";

export const useUser = () => {
  const { auth, isReady } = useAuth();
  const user: UserCredential | null = auth ?? null;
  const fetchUser = useCallback(async () => {
    return user;
  }, [user]);
  return { user, data: user, loading: !isReady, refetch: fetchUser };
};
export default useUser;
