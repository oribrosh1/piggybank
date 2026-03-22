import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import firebase from "@/src/firebase";

export interface ProvisioningStatus {
    status: "phase1" | "waiting_for_activation" | "phase3" | "complete" | "failed";
    step: string;
    accountId?: string;
    financialAccountId?: string;
    cardholderId?: string;
    virtualCardId?: string;
    error?: string;
    retryable?: boolean;
    retryCount?: number;
}

export function useProvisioningStatus(uid: string | null) {
    const [data, setData] = useState<ProvisioningStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uid) {
            setLoading(false);
            return;
        }

        const db = firebase.firestore();
        const docRef = doc(db as any, "provisioningTasks", uid);

        const unsubscribe = onSnapshot(
            docRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    setData(snapshot.data() as ProvisioningStatus);
                } else {
                    setData(null);
                }
                setLoading(false);
            },
            (err) => {
                console.warn("[useProvisioningStatus] listener error:", err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [uid]);

    return { data, loading };
}
