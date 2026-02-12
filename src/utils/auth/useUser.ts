import { useCallback } from "react";
import { useAuth } from "./useAuth";
import { UserCredential } from "@/types/user";

export const useUser = () => {
  const { auth, isReady } = useAuth();
  const user: UserCredential = auth?.user as UserCredential || null;
  const fetchUser = useCallback(async () => {
    return user;
  }, [user]);
  return { user, data: user, loading: !isReady, refetch: fetchUser };
};
export default useUser;
