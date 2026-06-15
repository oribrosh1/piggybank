import { useCallback, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import HomeScreen from "@/src/screens/HomeScreen/HomeScreen";
import MyEventTabContent from "@/src/screens/MyEventTab/MyEventTabContent";
import { isParentSetupComplete } from "@/src/lib/parentSetupStatus";
import AppTabFooter from "@/src/components/AppTabFooter";
import { colors, typography } from "@/src/theme";

export default function HomeRoute() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      void isParentSetupComplete()
        .then((complete) => {
          if (active) setSetupComplete(complete);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "transparent", paddingTop: insets.top }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[typography.bodyLg, { marginTop: 16, color: colors.onSurfaceVariant }]}>
            Loading...
          </Text>
        </View>
        <AppTabFooter style={{ paddingBottom: Math.max(insets.bottom, 12) }} />
      </View>
    );
  }

  if (!setupComplete) {
    return <MyEventTabContent />;
  }

  return <HomeScreen />;
}
