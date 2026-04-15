import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, typography, fontFamily } from "@/src/theme";
import { routes } from "@/types/routes";

export type AppTabHeaderProps = {
  onPressNotifications?: () => void;
  showNotificationDot?: boolean;
  style?: ViewStyle;
};

/**
 * Scrolls with screen content (place as first child inside ScrollView — not a sticky nav bar).
 */
export default function AppTabHeader({
  onPressNotifications,
  showNotificationDot,
  style,
}: AppTabHeaderProps) {
  const router = useRouter();

  return (
    <View style={[styles.row, style]}>
      <Text style={styles.brand}>CreditKid</Text>
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={onPressNotifications ?? (() => {})}
          hitSlop={10}
          accessibilityLabel="Notifications"
        >
          <View style={styles.notifWrap}>
            <Ionicons name="notifications-outline" size={24} color={colors.onSurface} />
            {showNotificationDot ? <View style={styles.notifDot} /> : null}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push(routes.tabs.profile)}
          hitSlop={10}
          accessibilityLabel="Profile"
        >
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={colors.onSurfaceVariant} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  brand: {
    ...typography.headlineLg,
    fontFamily: fontFamily.display,
    color: colors.primary,
    fontStyle: "italic",
    letterSpacing: -0.3,
    fontSize: 20,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  notifWrap: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  notifDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.surfaceContainerLowest,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
