import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { useRouter } from "expo-router";
import { routes } from "@/types/routes";

export function useBankingSuccessScreen() {
  const router = useRouter();
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
    router.replace(routes.tabs.banking);
  };

  const handleGetVirtualCard = () => {
    router.push(routes.banking.setup.issuingCard);
  };

  return {
    scaleAnim,
    fadeAnim,
    pulseAnim,
    handleGoToCredit,
    handleGetVirtualCard,
  };
}
