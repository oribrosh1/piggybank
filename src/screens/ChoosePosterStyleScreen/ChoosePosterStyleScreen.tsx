import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Crown,
  ShieldCheck,
  Zap,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppMeshBackground } from "@/src/components/AppMeshBackground";
import InvitationExamplesModal from "@/src/components/create-event/InvitationExamplesModal";
import { INVITATION_EXAMPLE_IMAGES } from "@/src/constants/invitationExampleImages";
import { colors, fontFamily, radius, spacing } from "@/src/theme";
import { useChoosePosterStyleScreen } from "./useChoosePosterStyleScreen";

const HEADER_IMAGE = require("../../../assets/images/step1-create-event/header.png");
const HEADER_SOURCE = Image.resolveAssetSource(HEADER_IMAGE);
const HEADER_ASPECT =
  (HEADER_SOURCE?.width ?? 1) / (HEADER_SOURCE?.height ?? 1);
const QUICK_POSTER_PREVIEW = require("../../../assets/images/step1-create-event/quick.png");
const PREMIUM_POSTER_PREVIEW = require("../../../assets/images/step1-create-event/p.png");

const QUICK_FEATURES = [
  "Choose what appears",
  "Instant & ready to share",
  "Clean and simple design",
] as const;

const PREMIUM_FEATURES = [
  "Custom character art",
  "Detailed & cinematic design",
  "Made just for your event",
] as const;

function FeatureRow({
  label,
  light,
}: {
  label: string;
  light?: boolean;
}) {
  return (
    <View style={styles.featureRow}>
      <View
        style={[
          styles.featureCheck,
          light && styles.featureCheckLight,
        ]}
      >
        <Check size={10} color={light ? colors.onPrimary : colors.primary} strokeWidth={3} />
      </View>
      <Text
        style={[
          styles.featureText,
          light && styles.featureTextLight,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function ChoosePosterStyleScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [examplesOpen, setExamplesOpen] = useState(false);
  const { goBack, chooseQuickPoster, choosePremiumPoster } =
    useChoosePosterStyleScreen();

  const exampleThumbWidth = Math.min(132, Math.round(screenWidth * 0.34));
  const headerHeight = screenWidth / HEADER_ASPECT;

  return (
    <View style={styles.root}>
      {/* <AppMeshBackground /> */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, spacing[4]) + spacing[6],
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.headerWrap, { width: screenWidth, height: headerHeight }]}>
          <Image
            source={HEADER_IMAGE}
            resizeMode="cover"
            style={[styles.headerImage, { width: screenWidth, height: headerHeight }]}
            accessibilityIgnoresInvertColors
          />
          <TouchableOpacity
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={[
              styles.backButton,
              { top: insets.top + spacing[2], left: spacing[4] },
            ]}
          >
            <ArrowLeft size={20} color={colors.onSurface} strokeWidth={2.2} />
          </TouchableOpacity>
          <View
            style={[
              styles.headerCopy,
              { paddingTop: insets.top + spacing[12] },
            ]}
          >
            <Text style={styles.title}>Choose Your Poster Style</Text>
            <Text style={styles.subtitle}>
              Pick how you want your invitation poster to look and be created.
            </Text>
          </View>
        </View>

        <View style={styles.cards}>
          <View style={styles.premiumCard}>
            <View style={styles.premiumCardBody}>
              <View style={styles.premiumCardCopy}>
                <View style={styles.cardTitleRow}>
                  <View style={styles.premiumIconBadge}>
                    <Crown size={18} color={colors.onPrimary} strokeWidth={2.2} />
                  </View>
                  <Text style={styles.premiumTitle}>Premium</Text>
                </View>
                <View style={styles.badgeDark}>
                  <Text style={styles.badgeDarkText}><Text style={{ fontWeight: "900", fontSize: 14 }}>FREE</Text> • <Text style={{ fontWeight: "600", fontSize: 12 }}>1-2 MINUTES</Text></Text>
                </View>
                <Text style={styles.premiumDescription}>
                  Get a unique, cinematic poster designed especially for your event.
                </Text>
                {PREMIUM_FEATURES.map((feature) => (
                  <FeatureRow key={feature} label={feature} light />
                ))}
              </View>
              <View style={styles.previewWrap}>
                <Image
                  source={PREMIUM_POSTER_PREVIEW}
                  resizeMode="cover"
                  style={styles.premiumPreview}
                  accessibilityLabel="Premium poster preview"
                />
              </View>
            </View>
            <TouchableOpacity
              onPress={choosePremiumPoster}
              accessibilityRole="button"
              accessibilityLabel="Create Premium Poster"
              style={styles.premiumCta}
            >
              <Text style={styles.premiumCtaText}>Create Premium Poster</Text>
              <ChevronRight size={18} color={colors.onPrimary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <View style={styles.quickCard}>
            <View style={styles.quickCardBody}>
              <View style={styles.quickCardCopy}>
                <View style={styles.cardTitleRow}>
                  <View style={styles.cardIconBadge}>
                    <Zap size={18} color={colors.primary} strokeWidth={2.4} />
                  </View>
                  <Text style={styles.quickTitle}>Quick Poster</Text>
                </View>
                <View style={styles.badgeLight}>
                  <Text style={styles.badgeLightText}><Text style={{ fontWeight: "900", fontSize: 16 }}>FREE</Text> • <Text style={{ fontWeight: "600", fontSize: 14 }}>INSTANT</Text></Text>
                </View>
                <Text style={styles.quickDescription}>
                  Select the details you want to include, and your poster is ready
                  right away.
                </Text>
                {QUICK_FEATURES.map((feature) => (
                  <FeatureRow key={feature} label={feature} />
                ))}
              </View>
              <View style={styles.previewWrap}>
                <Image
                  source={QUICK_POSTER_PREVIEW}
                  resizeMode="cover"
                  style={styles.quickPreview}
                  accessibilityLabel="Quick poster preview"
                />
              </View>
            </View>
            <TouchableOpacity
              onPress={chooseQuickPoster}
              accessibilityRole="button"
              accessibilityLabel="Create Quick Poster"
              style={styles.quickCta}
            >
              <Text style={styles.quickCtaText}>Create Quick Poster</Text>
              <ChevronRight size={18} color={colors.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.examplesSection}>
          <View style={styles.examplesHeader}>
            <View>
              <Text style={styles.examplesTitle}>See examples</Text>
              <Text style={styles.examplesSubtitle}>
                Posters made with CreditKid
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setExamplesOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="View all poster examples"
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>View all</Text>
              <ChevronRight size={16} color={colors.primary} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.examplesRow}
          >
            {INVITATION_EXAMPLE_IMAGES.map((source, index) => (
              <Image
                key={`example-${index}`}
                source={source}
                resizeMode="cover"
                style={[
                  styles.exampleThumb,
                  { width: exampleThumbWidth, height: exampleThumbWidth * 1.28 },
                ]}
                accessibilityLabel={`Poster example ${index + 1}`}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.footerBanner}>
          <ShieldCheck size={18} color={colors.primary} strokeWidth={2.2} />
          <Text style={styles.footerBannerText}>
            <Text style={styles.footerBannerStrong}>Both options are free</Text>
            {" — "}Choose what works best for your event.
          </Text>
        </View>
      </ScrollView>

      <InvitationExamplesModal
        visible={examplesOpen}
        onClose={() => setExamplesOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#E8DDF7",
  },
  scroll: {
    flex: 1,
  },
  backButton: {
    position: "absolute",
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(107, 56, 212, 0.12)",
  },
  headerWrap: {
    position: "relative",
    marginBottom: spacing[4],
    overflow: "hidden",
    backgroundColor: colors.surfaceContainerLow,
  },
  headerImage: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  headerCopy: {
    position: "relative",
    zIndex: 1,
    alignItems: "center",
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[5],
  },
  title: {
    fontFamily: fontFamily.headline,
    marginTop: spacing[20],
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.4,
    marginBottom: spacing[2],
    textAlign: "center",
    maxWidth: 200,

  },
  subtitle: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    maxWidth: 250,
  },
  cards: {
    paddingHorizontal: spacing[4],
    gap: spacing[4],
  },
  quickCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: "rgba(107, 56, 212, 0.1)",
    overflow: "hidden",
  },
  quickCardBody: {
    flexDirection: "row",
    alignItems: "stretch",
    // minHeight: 280,
  },
  quickCardCopy: {
    flex: 1,
    minWidth: 0,
    padding: spacing[4],
    paddingRight: spacing[2],
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  cardIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  quickTitle: {
    flex: 1,
    fontFamily: fontFamily.headline,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "800",
    color: colors.onSurface,
  },
  badgeLight: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    marginBottom: spacing[2],
  },
  badgeLightText: {
    fontFamily: fontFamily.label,
    fontSize: 12,
    color: colors.primary,
    letterSpacing: 0.6,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  quickDescription: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 18,
    color: "black",
    marginBottom: spacing[2],
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginBottom: spacing[1],
    marginLeft:-4,
  },
  featureCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
  },
  featureCheckLight: {
    backgroundColor: "rgba(255, 255, 255, 0.14)",
  },
  featureText: {
    flex: 1,
    fontFamily: fontFamily.body,
    fontSize: 10,
    lineHeight: 16,
    color: colors.onSurface,
  },
  featureTextLight: {
    color: "rgba(255, 255, 255, 0.88)",
  },
  quickCta: {
    width: "60%",
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[1],
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  quickCtaText: {
    fontFamily: fontFamily.title,
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  previewWrap: {
    width: "50%",
    alignItems: "center",
    justifyContent: "center",
    // paddingVertical: spacing[3],
    // paddingRight: spacing[2],
  },
  quickPreview: {
    width: "100%",
    height: 245,
  },
  premiumCard: {
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: "#200A68",
  },
  premiumCardBody: {
    flexDirection: "row",
    alignItems: "stretch",
    // minHeight: 300,
  },
  premiumCardCopy: {
    flex: 1,
    minWidth: 0,
    padding: spacing[4],
    paddingRight: spacing[2],
  },
  premiumIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  premiumTitle: {
    flex: 1,
    fontFamily: fontFamily.headline,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: colors.onPrimary,
  },
  badgeDark: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    marginBottom: spacing[2],
  },
  badgeDarkText: {
    fontFamily: fontFamily.label,
    fontSize: 11,
    fontWeight: "700",
    color: colors.onPrimary,
    letterSpacing: 0.6,
  },
  premiumDescription: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(255, 255, 255, 0.78)",
    marginBottom: spacing[2],
  },
  premiumCta: {
    marginHorizontal: spacing[4],
    marginTop: spacing[2],
    marginBottom: spacing[4],
    width: "60%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[1],
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  premiumCtaText: {
    fontFamily: fontFamily.title,
    fontSize: 16,
    fontWeight: "700",
    color: colors.onPrimary,
  },
  premiumPreview: {
    width: "115%",
    height: 225,
    marginTop: 10,
    position: "absolute",
    right: 0,
  },
  examplesSection: {
    marginTop: spacing[6],
    paddingHorizontal: spacing[4],
  },
  examplesHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing[3],
    gap: spacing[3],
  },
  examplesTitle: {
    fontFamily: fontFamily.headline,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    color: colors.onSurface,
  },
  examplesSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingTop: 2,
  },
  viewAllText: {
    fontFamily: fontFamily.title,
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  examplesRow: {
    gap: spacing[3],
    paddingRight: spacing[4],
  },
  exampleThumb: {
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLow,
  },
  footerBanner: {
    marginTop: spacing[5],
    marginHorizontal: spacing[4],
    padding: spacing[4],
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLow,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
  },
  footerBannerText: {
    flex: 1,
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.onSurfaceVariant,
  },
  footerBannerStrong: {
    fontFamily: fontFamily.title,
    fontWeight: "700",
    color: colors.onSurface,
  },
});
