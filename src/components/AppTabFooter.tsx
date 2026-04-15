import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Linking,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, typography } from "@/src/theme";

const TERMS_URL = "https://creditkid.vercel.app/terms";
const PRIVACY_URL = "https://creditkid.vercel.app/privacy";

const STRIPE_WORDMARK = require("../../assets/images/stripe-icon.png");

type Props = {
  /** Extra wrapper styles (e.g. marginTop). */
  style?: StyleProp<ViewStyle>;
};

/**
 * Shared footer for main tab screens: Secured by Stripe + Terms / Privacy.
 */
export default function AppTabFooter({ style }: Props) {
  return (
    <View style={[{ marginTop: 24, paddingBottom: 8 }, style]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
          paddingHorizontal: 12,
        }}
      >
        <Ionicons name="shield-checkmark-outline" size={24} color={colors.muted} />
        <Text
          style={[
            typography.bodyMd,
            {
              color: colors.onSurfaceVariant,
              fontWeight: "600",
              marginLeft: 6,
            },
          ]}
        >
          Secured by
        </Text>
        <View style={{ marginLeft: 8, marginTop: 1 }}>
          <Image
            source={STRIPE_WORDMARK}
            accessibilityLabel="Stripe"
            style={{ height: 24, width: 60 }}
            resizeMode="contain"
          />
        </View>
      </View>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 20,
        }}
      >
        <TouchableOpacity onPress={() => void Linking.openURL(TERMS_URL)}>
          <Text style={[typography.bodyMd, { fontWeight: "600", color: colors.onSurfaceVariant }]}>
            Terms of Service
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => void Linking.openURL(PRIVACY_URL)}>
          <Text style={[typography.bodyMd, { fontWeight: "600", color: colors.onSurfaceVariant }]}>
            Privacy Policy
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
