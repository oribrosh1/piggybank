import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  type ViewStyle,
} from "react-native";
import { useRouter } from "expo-router";
import { Bell, UserRound } from "lucide-react-native";
import { colors, typography, fontFamily, spacing } from "@/src/theme";
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
          onPress={() => router.push(routes.tabs.profile)}
          activeOpacity={0.88}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Profile"
          style={styles.actionOuter}
        >
          <View style={styles.actionChrome}>
            <UserRound size={22} color={colors.primary} strokeWidth={2.25} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const ACTION_SIZE = 46;
/** Half of width/height — perfect circle */
const CIRCLE_RADIUS = ACTION_SIZE / 2;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    ...typography.headlineLg,
    fontFamily: fontFamily.display,
    color: colors.primary,
    fontStyle: "italic",
    letterSpacing: -0.3,
    fontSize: 36,
 
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionOuter: {
    /** Slight outer pad so purple shadow does not clip */
    padding: 2,
  },
  /**
   * Frosted “candy” control: soft white cap, lilac rim, brand lift shadow —
   * matches the playful glass cards used elsewhere on Home.
   */
  actionChrome: {
    width: ACTION_SIZE,
    height: ACTION_SIZE,
    borderRadius: CIRCLE_RADIUS,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(107, 56, 212, 0.2)",
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
        shadowColor: colors.primary,
      },
      default: {},
    }),
  },
  notifDot: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.primaryContainer,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.95)",
  },
});
