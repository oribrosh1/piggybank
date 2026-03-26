import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { useRouter } from "expo-router";
import { routes } from "@/types/routes";
import { useProvisioningStatus, ProvisioningStatus } from "@/src/hooks/useProvisioningStatus";
import { retryProvisioning } from "@/src/lib/api";
import firebase from "@/src/firebase";

export type ProvisioningPhase = "phase1" | "waiting_for_activation" | "phase3" | "complete" | "failed" | null;

const PHASE_LABELS: Record<string, string> = {
    phase1: "Setting up capabilities...",
    waiting_for_activation: "Activating financial account...",
    phase3: "Creating your card...",
    complete: "Card ready!",
    failed: "Something went wrong",
};

export function useBankingSuccessScreen() {
    const router = useRouter();
    const uid = firebase.auth().currentUser?.uid || null;
    const { data: provisioning, loading } = useProvisioningStatus(uid);

    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
        }).start();

        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            delay: 200,
            useNativeDriver: true,
        }).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [scaleAnim, fadeAnim, pulseAnim]);

    const handleGoToCredit = () => {
        router.replace(routes.tabs.home);
    };

    const handleGetVirtualCard = () => {
        router.push(routes.banking.setup.issuingCard);
    };

    const handleRetry = async () => {
        try {
            await retryProvisioning();
        } catch (err: any) {
            console.warn("[BankingSuccess] retry failed:", err?.message);
        }
    };

    const currentPhase: ProvisioningPhase = provisioning?.status || null;
    const stepLabel = provisioning?.step || PHASE_LABELS[currentPhase || ""] || "";
    const isComplete = currentPhase === "complete";
    const isFailed = currentPhase === "failed";
    const isProvisioning = currentPhase === "phase1" || currentPhase === "waiting_for_activation" || currentPhase === "phase3";

    const steps = getSteps(currentPhase);

    return {
        scaleAnim,
        fadeAnim,
        pulseAnim,
        handleGoToCredit,
        handleGetVirtualCard,
        handleRetry,
        provisioning,
        loading,
        currentPhase,
        stepLabel,
        isComplete,
        isFailed,
        isProvisioning,
        steps,
    };
}

interface StepItem {
    label: string;
    done: boolean;
    active: boolean;
}

function getSteps(phase: ProvisioningPhase): StepItem[] {
    const phaseOrder: ProvisioningPhase[] = ["phase1", "waiting_for_activation", "phase3", "complete"];
    const currentIdx = phase ? phaseOrder.indexOf(phase) : -1;

    return [
        {
            label: "Personal information submitted",
            done: true,
            active: false,
        },
        {
            label: "Setting up capabilities",
            done: currentIdx > 0,
            active: phase === "phase1",
        },
        {
            label: "Activating financial account",
            done: currentIdx > 1,
            active: phase === "waiting_for_activation",
        },
        {
            label: "Creating virtual card",
            done: currentIdx > 2,
            active: phase === "phase3",
        },
        {
            label: "Card ready!",
            done: phase === "complete",
            active: false,
        },
    ];
}
