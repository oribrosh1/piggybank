import React from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import CreateEventTopBar from "./CreateEventTopBar";
import { colors, spacing, typography, fontFamily, radius } from "@/src/theme";

type EventDetailsScreenHeaderProps = {
  progressWidth: Animated.AnimatedInterpolation<string | number>;
  progressPercentLabel: string;
  stepLabel?: string;
  onBack: () => void;
};

export default function EventDetailsScreenHeader(props: EventDetailsScreenHeaderProps) {
  const { progressWidth, progressPercentLabel, stepLabel = "STEP 1 OF 3", onBack } = props;
  return (
    <View style={styles.wrap}>
      <CreateEventTopBar onBack={onBack} />
      <View style={styles.inner}>
        <Text style={styles.stepLabel}>{stepLabel}</Text>
        <View style={styles.titleRow}>
          <View style={styles.titleCol}>
            <Text style={styles.title}>Design your invitation</Text>
            <Text style={styles.subtitle}>
              We&apos;ll use your answers to generate a unique poster and fill in your event.
            </Text>
          </View>
          <Text style={styles.percent}>{progressPercentLabel}</Text>
        </View>
        <View style={styles.track}>
          <Animated.View style={[styles.trackFill, { width: progressWidth }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    paddingBottom: spacing[2],
  },
  inner: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[1],
  },
  stepLabel: {
    ...typography.labelMd,
    color: colors.secondary,
    letterSpacing: 1.2,
    marginBottom: spacing[2] - 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing[2],
  },
  titleCol: {
    flex: 1,
    paddingRight: spacing[3],
  },
  title: {
    fontFamily: fontFamily.headline,
    fontSize: 26,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: spacing[2],
    lineHeight: 20,
  },
  percent: {
    fontFamily: fontFamily.title,
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary,
  },
  track: {
    height: spacing[2],
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius.sm,
    overflow: "hidden",
    marginBottom: spacing[2],
  },
  trackFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
  },
});
