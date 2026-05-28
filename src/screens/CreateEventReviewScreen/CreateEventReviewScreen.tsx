import { useCallback, useRef, useState } from "react";
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
  ActivityIndicator,
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import { captureRef } from "react-native-view-shot";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Download, Eye } from "lucide-react-native";
import EventDetailsScreenFooter from "@/src/components/create-event/EventDetailsScreenFooter";
import PosterSkeletonPreviewSection from "@/src/components/create-event/PosterSkeletonPreviewSection";
import PosterSummarySkeletonPreview from "@/src/components/create-event/PosterSummarySkeletonPreview";
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
  const posterCaptureRef = useRef<View>(null);
  const [savingPosterImage, setSavingPosterImage] = useState(false);
  const { draft, isSubmitting, posterGenLive, handleConfirmCreate } =
    useCreateEventReviewScreen();

  const handleSavePosterImage = useCallback(async () => {
    const node = posterCaptureRef.current;
    if (!node) return;
    try {
      setSavingPosterImage(true);
      if (Platform.OS === "web") {
        Alert.alert(
          "Not available",
          "Saving poster images is only supported in the mobile app.",
        );
        return;
      }
      const perm = await MediaLibrary.requestPermissionsAsync(true);
      if (!perm.granted) {
        Alert.alert(
          "Photos access needed",
          "Allow photo library access so we can save your poster image.",
        );
        return;
      }
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const uri = await captureRef(node, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert("Saved", "Poster image was saved to your photo library.");
    } catch (e) {
      console.warn("Save poster image failed", e);
      Alert.alert(
        "Could not save",
        "Something went wrong saving the image. Please try again.",
      );
    } finally {
      setSavingPosterImage(false);
    }
  }, []);

  if (!draft) {
    return null;
  }

  const { formData } = draft;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.screen}
    >
      <View style={styles.screen}>
        <View
          style={[
            styles.topBar,
            { paddingTop: insets.top + spacing[1] },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.backHit}
            accessibilityRole="button"
            accessibilityLabel="Back to edit details"
          >
            <ArrowLeft size={22} color={colors.onSurface} strokeWidth={2.2} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Review your event</Text>
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
          <Text style={styles.lead}>
            Double-check your details. The sketch below shows how your invitation
            will be composed from what you entered — final AI art arrives after you
            create the event.
          </Text>

          <View
            style={styles.previewHeaderRow}
            accessibilityRole="header"
            accessibilityLabel="Preview"
          >
            <Eye size={20} color={colors.primary} strokeWidth={2.25} />
            <Text style={styles.previewHeaderText}>Preview</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.savePosterButton,
              savingPosterImage && styles.savePosterButtonDisabled,
            ]}
            onPress={handleSavePosterImage}
            disabled={savingPosterImage}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Save poster image to photo library"
          >
            {savingPosterImage ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Download size={20} color={colors.primary} strokeWidth={2.25} />
            )}
            <Text style={styles.savePosterButtonText}>
              {savingPosterImage ? "Saving…" : "Save to Photos"}
            </Text>
          </TouchableOpacity>

          <View
            ref={posterCaptureRef}
            collapsable={false}
            style={styles.inlinePreviewWrap}
          >
            <PosterSummarySkeletonPreview
              formData={formData}
              showSectionHeader={false}
              showPartyVibeAnimation={false}
              showAvatar={false}
              elevated={false}
              horizontalInset={spacing[5]}
              style={styles.inlinePreviewPoster}
            />
          </View>

          <PosterSummarySkeletonPreview formData={formData} />
    
          <View style={styles.pipelineSection}>
            <Text style={styles.pipelineTitle}>Your poster over time</Text>
            <Text style={styles.pipelineSubtitle}>
              Example invitations — yours will match your theme and photo. Times
              vary with traffic and detail.
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

          <PosterSkeletonPreviewSection
            visible={!!posterGenLive}
            posterUrl={posterGenLive?.posterUrl}
            posterStreamingPreviewUrl={posterGenLive?.posterStreamingPreviewUrl}
            skeletonPosterUrl={posterGenLive?.skeletonPosterUrl}
          />
        </ScrollView>

        <EventDetailsScreenFooter
          onContinue={handleConfirmCreate}
          loading={isSubmitting}
          disabled={isSubmitting}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
  },
  backHit: {
    padding: 8,
    marginLeft: -4,
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
  topBarSpacer: {
    width: 38,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[3],
  },
  lead: {
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
    color: colors.onSurfaceVariant,
    marginBottom: spacing[3],
  },
  previewHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[2],
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(107, 56, 212, 0.35)",
    backgroundColor: "rgba(107, 56, 212, 0.06)",
  },
  previewHeaderText: {
    fontFamily: fontFamily.title,
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.2,
  },
  inlinePreviewWrap: {
    marginBottom: spacing[4],
    width: "100%",
    maxWidth: "100%",
    alignSelf: "center",
  },
  inlinePreviewPoster: {
    marginBottom: 0,
    maxWidth: "100%",
  },
  savePosterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
    marginTop: spacing[1],
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(107, 56, 212, 0.35)",
    backgroundColor: colors.surfaceContainerLow,
    minWidth: 200,
  },
  savePosterButtonDisabled: {
    opacity: 0.72,
  },
  savePosterButtonText: {
    fontFamily: fontFamily.title,
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.2,
  },
  afterSketchHint: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
    color: colors.onSurfaceVariant,
    marginBottom: spacing[4],
    marginTop: -spacing[1],
  },
  cardHeading: {
    fontFamily: fontFamily.headline,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: colors.primary,
    marginBottom: spacing[3],
  },
  summaryRow: {
    marginBottom: spacing[2],
  },
  summaryLabel: {
    fontFamily: fontFamily.label,
    fontSize: 11,
    fontWeight: "600",
    color: colors.onSurfaceVariant,
    marginBottom: 2,
  },
  summaryValue: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    fontWeight: "600",
    color: colors.onSurface,
    lineHeight: 22,
  },
  pipelineSection: {
    marginTop: spacing[5],
    marginBottom: spacing[2],
  },
  pipelineTitle: {
    fontFamily: fontFamily.title,
    fontSize: 20,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.4,
    marginBottom: spacing[1],
  },
  pipelineSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
    color: colors.onSurfaceVariant,
    marginBottom: spacing[3],
  },
  tierCard: {
    borderRadius: radius.md,
    overflow: "hidden",
    marginBottom: spacing[3],
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
