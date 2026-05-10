import React, { useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  useWindowDimensions,
  Platform,
  type ImageSourcePropType,
} from "react-native";
import { X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { INVITATION_EXAMPLE_IMAGES } from "@/src/constants/invitationExampleImages";
import { colors, spacing, fontFamily, radius } from "@/src/theme";

type InvitationExamplesModalProps = {
  visible: boolean;
  onClose: () => void;
};

const PAGE_BG = "#FAFAFA";
/** Keeps posters readable without filling the whole sheet edge-to-edge. */
const CARD_MAX_WIDTH = 300;

function intrinsicSize(source: ImageSourcePropType): { w: number; h: number } {
  const r = Image.resolveAssetSource(source);
  const w = r?.width;
  const h = r?.height;
  if (typeof w === "number" && w > 0 && typeof h === "number" && h > 0) {
    return { w, h };
  }
  return { w: 1, h: 1 };
}

function InvitationExampleCard(props: {
  source: ImageSourcePropType;
  index: number;
  cardWidth: number;
}) {
  const { source, index, cardWidth } = props;
  const [loadFailed, setLoadFailed] = useState(false);

  const { w: iw, h: ih } = useMemo(() => intrinsicSize(source), [source]);
  const imageHeight = Math.max(1, (cardWidth / iw) * ih);

  if (loadFailed) {
    return (
      <View style={[styles.card, styles.cardFail, { width: cardWidth }]}>
        <Text style={styles.cardFailText}>Couldn't load this example.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { width: cardWidth }]} collapsable={false}>
      <Image
        source={source}
        style={{ width: cardWidth, height: imageHeight }}
        resizeMode="contain"
        resizeMethod={Platform.OS === "android" ? "resize" : undefined}
        onError={() => setLoadFailed(true)}
        accessibilityLabel={`Example invitation ${index + 1}`}
      />
    </View>
  );
}

export default function InvitationExamplesModal({
  visible,
  onClose,
}: InvitationExamplesModalProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const horizontalPad = spacing[5] * 2;
  const cardWidth = Math.min(Math.max(windowWidth - horizontalPad, 160), CARD_MAX_WIDTH);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.shell, { backgroundColor: PAGE_BG }]}>
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + spacing[2],
              paddingBottom: spacing[3],
            },
          ]}
        >
          <View style={styles.headerTextCol}>
            <Text style={styles.title}>Invitation examples</Text>
            <Text style={styles.subtitle}>
              Real posters families made with CreditKid—yours will be unique to your
              event.
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={styles.closeBtn}
          >
            <X size={24} color={colors.onSurface} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + spacing[6] },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {INVITATION_EXAMPLE_IMAGES.length === 0 ? (
            <Text style={styles.empty}>Examples coming soon.</Text>
          ) : (
            INVITATION_EXAMPLE_IMAGES.map((source, index) => (
              <InvitationExampleCard
                key={`invitation-example-${index}`}
                source={source}
                index={index}
                cardWidth={cardWidth}
              />
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: spacing[5],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(15, 23, 42, 0.08)",
    backgroundColor: "#FFFFFF",
  },
  headerTextCol: {
    flex: 1,
    paddingRight: spacing[2],
  },
  title: {
    fontFamily: fontFamily.title,
    fontSize: 20,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: fontFamily.headline,
    fontSize: 14,
    fontWeight: "500",
    color: colors.onSurfaceVariant,
    marginTop: spacing[1],
    lineHeight: 20,
  },
  closeBtn: {
    padding: spacing[1],
    marginTop: -spacing[1],
    marginRight: -spacing[1],
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    gap: spacing[4],
    alignItems: "center",
  },
  card: {
    alignSelf: "center",
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#1e1b4b",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 14,
    elevation: 4,
  },
  cardFail: {
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[4],
    backgroundColor: "#FFFFFF",
    minHeight: 120,
  },
  cardFailText: {
    fontFamily: fontFamily.headline,
    fontSize: 14,
    fontWeight: "600",
    color: colors.onSurfaceVariant,
    textAlign: "center",
  },
  empty: {
    fontFamily: fontFamily.headline,
    fontSize: 15,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    marginTop: spacing[8],
  },
});
