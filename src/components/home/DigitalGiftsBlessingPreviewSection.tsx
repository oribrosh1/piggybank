import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  type ImageSourcePropType,
} from "react-native";
import { Lock } from "lucide-react-native";
import { colors, fontFamily, radius, spacing } from "@/src/theme";

const BLESSING_DEMO_COVERS: ImageSourcePropType[] = [
  require("../../../assets/images/blessings/blessing_demo1.png"),
  require("../../../assets/images/blessings/blessing_demo2.png"),
  require("../../../assets/images/blessings/blessing_demo3.png"),
  require("../../../assets/images/blessings/blessing_demo4.png"),
];

const BLESSING_CARD_HEIGHT = 140;
const BLESSING_IMAGE_ZOOM = 1.12;

function BlessingPreviewCard({
  cover,
  width,
}: {
  cover: ImageSourcePropType;
  width: number;
}) {
  return (
    <View style={[styles.previewCard, { width, height: BLESSING_CARD_HEIGHT }]}>
      <Image
        source={cover}
        style={styles.previewCoverImage}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      <View style={styles.previewLockBubble} pointerEvents="none">
        <Lock size={12} color={colors.onSurface} strokeWidth={2.2} />
      </View>
    </View>
  );
}

type Props = {
  onVerifyPress: () => void;
};

export default function DigitalGiftsBlessingPreviewSection({ onVerifyPress }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.min(108, Math.round(screenWidth * 0.26));

  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.verifyBtn}
        onPress={onVerifyPress}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel="Verify to unlock digital gifts preview"
      >
        <Lock size={12} color={colors.primary} strokeWidth={2} />
        <Text style={styles.verifyBtnText}>Verify to unlock</Text>
      </TouchableOpacity>

      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Digital Gifts & Blessing Cards Preview</Text>
          <Text style={styles.subtitle}>
            See how your guests will send gifts and write blessings.
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsRow}
        decelerationRate="fast"
      >
        {BLESSING_DEMO_COVERS.map((cover, index) => (
          <BlessingPreviewCard key={`blessing-demo-${index + 1}`} cover={cover} width={cardWidth} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    position: "relative",
    overflow: "visible",
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: "rgba(107, 56, 212, 0.08)",
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
    shadowColor: "#0c1c2a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  headerRow: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  headerCopy: {
    minWidth: 0,
    paddingRight: spacing[6],
  },
  title: {
    fontFamily: fontFamily.headline,
    fontSize: 16,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.3,
    lineHeight: 20,
    marginBottom: spacing[1],
  },
  subtitle: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    fontWeight: "500",
    color: colors.onSurfaceVariant,
    lineHeight: 14,
  },
  verifyBtn: {
    position: "absolute",
    top: -9,
    right: 12,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing[2],
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: "rgba(107, 56, 212, 0.2)",
    shadowColor: "#0c1c2a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  verifyBtnText: {
    fontFamily: fontFamily.label,
    fontSize: 10,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.2,
  },
  cardsRow: {
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  previewCard: {
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.65)",
    backgroundColor: colors.surfaceContainerLow,
    shadowColor: "#0c1c2a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  previewCoverImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    transform: [{ scale: BLESSING_IMAGE_ZOOM }],
  },
  previewLockBubble: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -14,
    marginLeft: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    zIndex: 2,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(107, 56, 212, 0.08)",
    shadowColor: "#0c1c2a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
});
