import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { spacing } from "@/src/theme";

type PosterSkeletonPreviewSectionProps = {
  visible: boolean;
  posterUrl?: string | null;
  posterStreamingPreviewUrl?: string | null;
  skeletonPosterUrl?: string | null;
};

/**
 * During poster generation: spinner → blurred fast skeleton → progressive streaming preview → sharp final when `posterUrl` exists.
 */
export default function PosterSkeletonPreviewSection({
  visible,
  posterUrl,
  posterStreamingPreviewUrl,
  skeletonPosterUrl,
}: PosterSkeletonPreviewSectionProps) {
  if (!visible) return null;

  const finalUrl =
    typeof posterUrl === "string" && posterUrl.length > 0 ? posterUrl : null;
  const streamingUrl =
    typeof posterStreamingPreviewUrl === "string" &&
    posterStreamingPreviewUrl.length > 0
      ? posterStreamingPreviewUrl
      : null;
  const skUrl =
    typeof skeletonPosterUrl === "string" && skeletonPosterUrl.length > 0
      ? skeletonPosterUrl
      : null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Your invitation poster</Text>
      <View style={styles.card}>
        {!finalUrl && !streamingUrl && !skUrl ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text style={styles.sub}>Crafting your poster…</Text>
          </View>
        ) : finalUrl ? (
          <Image
            source={{ uri: finalUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : streamingUrl ? (
          <View style={styles.skeletonFrame}>
            <Image
              source={{ uri: streamingUrl }}
              style={styles.image}
              resizeMode="cover"
              blurRadius={Platform.select({ ios: 3, android: 2, default: 2 })}
            />
            <View style={styles.skeletonLabel}>
              <Text style={styles.skeletonLabelText}>Rendering preview…</Text>
            </View>
          </View>
        ) : (
          <View style={styles.skeletonFrame}>
            <Image
              source={{ uri: skUrl! }}
              style={styles.image}
              resizeMode="cover"
              blurRadius={Platform.select({ ios: 14, android: 10, default: 10 })}
            />
            <BlurView intensity={22} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.skeletonLabel}>
              <Text style={styles.skeletonLabelText}>Preview — sharpening…</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
    marginBottom: spacing[3],
    letterSpacing: 0.3,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    minHeight: 200,
    aspectRatio: 9 / 16,
    maxHeight: 360,
    alignSelf: "center",
    width: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[6],
    gap: spacing[3],
  },
  sub: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94a3b8",
    textAlign: "center",
  },
  skeletonFrame: {
    flex: 1,
    position: "relative",
  },
  skeletonLabel: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: "rgba(15,23,42,0.75)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  skeletonLabelText: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
});
