import { useCallback, useRef } from "react";
import type { TextInput as TextInputType } from "react-native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ChevronRight,
  Images,
  RefreshCw,
  Sparkles,
} from "lucide-react-native";
import { useCreateEventDraftStore } from "@/src/stores/createEventDraftStore";
import type { QuickPosterCover } from "@/src/stores/createEventDraftStore";
import { routes } from "@/types/routes";
import { AppMeshBackground } from "@/src/components/AppMeshBackground";
import { GlassCardDark } from "@/src/components/common/GlassCardDark";
import CreateEventReviewDetailsSection from "@/src/components/create-event/CreateEventReviewDetailsSection";
import EventDetailsScreenFooter from "@/src/components/create-event/EventDetailsScreenFooter";
import PosterSkeletonPreviewSection from "@/src/components/create-event/PosterSkeletonPreviewSection";
import PosterSummarySkeletonPreview from "@/src/components/create-event/PosterSummarySkeletonPreview";
import QuickPosterMessageSection, {
  MESSAGE_CHAR_LIMIT,
} from "@/src/components/create-event/QuickPosterMessageSection";
import QuickPosterPreview from "@/src/components/create-event/QuickPosterPreview";
import { colors, spacing, fontFamily, radius } from "@/src/theme";
import { useCreateEventReviewScreen } from "./useCreateEventReviewScreen";

const EXAMPLE_POSTER_IMAGES = {
  fast: require("../../../assets/images/invitation-examples/example-03.png"),
  mid: require("../../../assets/images/invitation-examples/example-02.png"),
  final: require("../../../assets/images/invitation-examples/example-01.png"),
} as const;

const POSTER_PIPELINE_TIERS = [
  {
    key: "fast",
    title: "First preview",
    timeRange: "~30–90 sec",
    body: "A fast skeleton preview so you see layout, headline, and palette almost immediately.",
    qualityLabel: "Sketch preview",
    image: EXAMPLE_POSTER_IMAGES.fast,
  },
  {
    key: "mid",
    title: "Sharpened preview",
    timeRange: "~2–4 min",
    body: "Streaming render adds detail and readable type — great for sharing while you wait.",
    qualityLabel: "Enhanced preview",
    image: EXAMPLE_POSTER_IMAGES.mid,
  },
  {
    key: "final",
    title: "Final invitation art",
    timeRange: "~4–8 min",
    body: "Full-resolution poster tuned to your party details and honoree photo.",
    qualityLabel: "Print-ready",
    image: EXAMPLE_POSTER_IMAGES.final,
  },
] as const;

export default function CreateEventReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setDraft = useCreateEventDraftStore((s) => s.setDraft);
  const eventWordsInputRef = useRef<TextInputType>(null);
  const quickPosterCaptureRef = useRef<View>(null);
  const { draft, isSubmitting, posterGenLive, handleConfirmCreate } =
    useCreateEventReviewScreen(quickPosterCaptureRef);

  const handleChoosePosterCover = useCallback(() => {
    if (!draft) return;

    if (draft.posterStyle !== "quick") {
      router.push({
        pathname: routes.createEvent.posterStyle,
        params: { eventType: draft.resolvedEventType },
      });
      return;
    }

    const applyCover = (cover: QuickPosterCover) => {
      setDraft({ ...draft, quickPosterCover: cover });
    };

    Alert.alert("Choose another poster cover", "Pick a design for your poster.", [
      {
        text: "Boys",
        onPress: () => applyCover("boy"),
      },
      {
        text: "Girls",
        onPress: () => applyCover("girl"),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [draft, router, setDraft]);

  const handleEventWordsChange = useCallback(
    (text: string) => {
      if (!draft) return;
      setDraft({
        ...draft,
        quickPosterEventWords: text.slice(0, MESSAGE_CHAR_LIMIT),
      });
    },
    [draft, setDraft],
  );

  const handleShowMessageChange = useCallback(
    (show: boolean) => {
      if (!draft) return;
      setDraft({
        ...draft,
        quickPosterShowMessage: show,
        ...(show ? {} : { quickPosterEventWords: "" }),
      });
    },
    [draft, setDraft],
  );

  if (!draft) {
    return null;
  }

  const {
    formData,
    posterStyle,
    quickPosterCover,
    quickPosterEventWords,
    quickPosterShowMessage,
  } = draft;
  const isQuickPoster = posterStyle === "quick";
  const activePosterCover =
    quickPosterCover ??
    (formData.honoreeGender === "girl" ? "girl" : "boy");
  const showPosterMessage = quickPosterShowMessage !== false;
  const posterMessage = showPosterMessage ? (quickPosterEventWords ?? "") : "";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.screen}
    >
      <View style={styles.screen}>
        <AppMeshBackground />
        <View style={[styles.topBar, { paddingTop: insets.top + spacing[4] }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            style={styles.backHit}
            accessibilityRole="button"
            accessibilityLabel="Back to edit details"
          >
            <ArrowLeft size={20} color={colors.onSurface} strokeWidth={2.2} />
          </TouchableOpacity>
          <Text style={[styles.heroTitle, styles.topBarTitle]}>
            Looks great!
          </Text>
          <View style={styles.topBarSpacer} />
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + spacing[6] * 5 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroIntro}>
            {isQuickPoster ? (
              <Text style={styles.heroTitle}>
                <Text style={styles.heroTitleAccent}>We're Almost Ready!</Text> 
              </Text>
            ) : (
              <Text style={styles.heroTitle}>Looking good</Text>
            )}
            <Text style={styles.heroSubtitle}>
              {isQuickPoster
                ? "Review your poster and add a message for your guests we'll place it in the center of your poster."
                : "Confirm your details below. Your AI poster generates right after you create the event."}
            </Text>
          </View>

          {isQuickPoster ? (
            <>
              <View style={styles.posterMessageGroup}>
                <View style={styles.posterPreviewCard}>
                  <View style={styles.posterPreviewCardHeader}>
                    <Text style={styles.posterPreviewLabel}>Poster preview</Text>
                    <TouchableOpacity
                      style={styles.switchCoverButton}
                      onPress={handleChoosePosterCover}
                      activeOpacity={0.88}
                      accessibilityRole="button"
                      accessibilityLabel="Switch poster cover"
                    >
                      <RefreshCw
                        size={13}
                        color={colors.primary}
                        strokeWidth={2.4}
                      />
                      <Text style={styles.switchCoverText}>Switch cover</Text>
                    </TouchableOpacity>
                  </View>
                  <View
                    ref={quickPosterCaptureRef}
                    collapsable={false}
                    style={styles.posterCaptureWrap}
                  >
                    <QuickPosterPreview
                      formData={formData}
                      posterCover={activePosterCover}
                      eventWords={posterMessage}
                      showCenterMessage={showPosterMessage}
                      horizontalInset={spacing[8]}
                      style={styles.inlinePreviewPoster}
                    />
                  </View>
                </View>

                <GlassCardDark
                  style={styles.messageGlassCard}
                  padding={spacing[4]}
                  borderRadius={radius.md}
                  borderColor="rgba(107, 56, 212, 0.14)"
                >
                  <QuickPosterMessageSection
                    showMessage={showPosterMessage}
                    message={posterMessage}
                    onShowMessageChange={handleShowMessageChange}
                    onMessageChange={handleEventWordsChange}
                    inputRef={eventWordsInputRef}
                  />
                </GlassCardDark>
              </View>

              <TouchableOpacity
                style={styles.chooseCoverCard}
                onPress={handleChoosePosterCover}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel="Change poster cover"
              >
                <View style={styles.chooseCoverIcon}>
                  <Images size={20} color={colors.primary} strokeWidth={2.1} />
                </View>
                <View style={styles.chooseCoverCopy}>
                  <Text style={styles.chooseCoverTitle}>
                    Change poster cover
                  </Text>
                  <Text style={styles.chooseCoverSubtitle}>
                    Choose a different design
                  </Text>
                </View>
                <ChevronRight
                  size={20}
                  color={colors.onSurfaceVariant}
                  strokeWidth={2.2}
                />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.posterSection}>
              <View style={styles.posterSectionHeader}>
                <Text style={styles.posterSectionTitle}>Poster preview</Text>
                <View style={styles.posterTypeBadgePremium}>
                  <Sparkles size={12} color={colors.primary} strokeWidth={2.5} />
                  <Text style={styles.posterTypeBadgeText}>AI</Text>
                </View>
              </View>
              <GlassCardDark
                style={styles.posterCard}
                padding={spacing[3]}
                borderRadius={radius.md}
                borderColor="rgba(107, 56, 212, 0.12)"
              >
                <PosterSummarySkeletonPreview
                  formData={formData}
                  showSectionHeader={false}
                  showPartyVibeAnimation={false}
                  showAvatar={false}
                  elevated={false}
                  horizontalInset={spacing[8]}
                  style={styles.inlinePreviewPoster}
                />
              </GlassCardDark>
            </View>
          )}

          {!isQuickPoster ? (
            <CreateEventReviewDetailsSection
              formData={formData}
              isQuickPoster={isQuickPoster}
              onEdit={() => router.back()}
            />
          ) : null}

          {!isQuickPoster ? (
            <View style={styles.pipelineSection}>
              <Text style={styles.pipelineTitle}>What happens next</Text>
              <Text style={styles.pipelineSubtitle}>
                Example stages — yours will match your theme and photo.
              </Text>

              {POSTER_PIPELINE_TIERS.map((tier) => (
                <View key={tier.key} style={styles.tierCard}>
                  <Image
                    source={tier.image}
                    style={styles.tierImage}
                    resizeMode="cover"
                    accessibilityIgnoresInvertColors
                  />
                  <View style={styles.tierCopy}>
                    <View style={styles.tierTitleRow}>
                      <Text style={styles.tierTitle}>{tier.title}</Text>
                      <View style={styles.timePill}>
                        <Text style={styles.timePillText}>{tier.timeRange}</Text>
                      </View>
                    </View>
                    <Text style={styles.qualityBadge}>{tier.qualityLabel}</Text>
                    <Text style={styles.tierBody}>{tier.body}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {!isQuickPoster ? (
            <PosterSkeletonPreviewSection
              visible={!!posterGenLive}
              posterUrl={posterGenLive?.posterUrl}
              posterStreamingPreviewUrl={posterGenLive?.posterStreamingPreviewUrl}
              skeletonPosterUrl={posterGenLive?.skeletonPosterUrl}
            />
          ) : null}
        </ScrollView>

        <EventDetailsScreenFooter
          onContinue={handleConfirmCreate}
          loading={isSubmitting}
          disabled={isSubmitting}
          ctaTitle={isQuickPoster ? "Create Event" : undefined}
          footerHint={
            isQuickPoster
              ? "You can edit details anytime after creation."
              : undefined
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "transparent",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    marginTop: -spacing[4],
  },
  backHit: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(107, 56, 212, 0.10)",
    ...Platform.select({
      ios: {
        shadowColor: "#0c1c2a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  topTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: fontFamily.title,
    fontSize: 17,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  topBarTitle: {
    flex: 1,
  },
  topBarSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
    gap: spacing[5],
  },
  heroIntro: {
    gap: spacing[1],
  },
  heroTitle: {
    fontFamily: fontFamily.title,
    fontSize: 26,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.7,
    lineHeight: 36,
    textAlign: "center",
  },
  heroTitleAccent: {
    color: colors.primary,
  },
  heroSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "800",
    color: colors.onSurface,
    marginTop: spacing[1],
    textAlign: "center",
  },
  posterMessageGroup: {
    gap: 0,
  },
  posterPreviewCard: {
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    borderColor: "rgba(107, 56, 212, 0.14)",
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing[4],
    gap: spacing[3],
  },
  messageGlassCard: {
    marginTop: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  posterPreviewCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[3],
  },
  posterPreviewLabel: {
    fontFamily: fontFamily.label,
    fontSize: 11,
    fontWeight: "800",
    color: colors.onSurfaceVariant,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  switchCoverButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing[3],
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(107, 56, 212, 0.28)",
    backgroundColor: colors.surfaceContainerLowest,
  },
  switchCoverText: {
    fontFamily: fontFamily.label,
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: -0.1,
  },
  posterSection: {
    gap: spacing[3],
  },
  posterSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[3],
  },
  posterSectionTitle: {
    fontFamily: fontFamily.title,
    fontSize: 17,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.35,
  },
  posterTypeBadgePremium: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing[2],
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(107, 56, 212, 0.1)",
    borderColor: "rgba(107, 56, 212, 0.22)",
  },
  posterTypeBadgeText: {
    fontFamily: fontFamily.label,
    fontSize: 11,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  posterCard: {
    alignSelf: "stretch",
  },
  posterCaptureWrap: {
    width: "100%",
    alignSelf: "center",
  },
  inlinePreviewPoster: {
    marginBottom: 0,
    maxWidth: "100%",
  },
  chooseCoverCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(107, 56, 212, 0.12)",
    backgroundColor: colors.surfaceContainerLow,
  },
  chooseCoverIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(107, 56, 212, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  chooseCoverCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  chooseCoverTitle: {
    fontFamily: fontFamily.title,
    fontSize: 16,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.3,
    lineHeight: 21,
  },
  chooseCoverSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    fontWeight: "500",
    color: colors.onSurfaceVariant,
    lineHeight: 18,
  },
  pipelineSection: {
    gap: spacing[3],
  },
  pipelineTitle: {
    fontFamily: fontFamily.title,
    fontSize: 20,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.4,
  },
  pipelineSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
    color: colors.onSurfaceVariant,
    marginTop: -spacing[2],
    marginBottom: spacing[1],
  },
  tierCard: {
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(107, 56, 212, 0.14)",
  },
  tierImage: {
    width: "100%",
    height: 140,
    backgroundColor: "rgba(107, 56, 212, 0.06)",
  },
  tierCopy: {
    padding: spacing[3],
  },
  tierTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  tierTitle: {
    flex: 1,
    minWidth: 0,
    fontFamily: fontFamily.title,
    fontSize: 17,
    fontWeight: "800",
    color: colors.onSurface,
  },
  timePill: {
    backgroundColor: "rgba(107, 56, 212, 0.12)",
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: 10,
  },
  timePillText: {
    fontFamily: fontFamily.label,
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
  },
  qualityBadge: {
    fontFamily: fontFamily.label,
    fontSize: 12,
    fontWeight: "700",
    color: "#b45309",
    marginBottom: spacing[2],
  },
  tierBody: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.onSurfaceVariant,
  },
});
