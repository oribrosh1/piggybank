import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Eye,
  ChevronDown,
  Link2,
  Lock,
  Shield,
  PieChart,
  Bell,
  SlidersHorizontal,
  ChevronRight,
  ShoppingBag,
  Music,
  Coffee,
  WalletCards,
  UserRound,
} from "lucide-react-native";
import { firstNameFromDisplayName } from "@/src/lib/eventTitle";
import BankingSetupRequiredCard from "@/src/components/home/BankingSetupRequiredCard";
import { colors, fontFamily, radius, spacing, typography } from "@/src/theme";

const HABITS_GRAPH = require("@/assets/images/child-page/graph-only.png");
const PREVIEW_SPENT = 243.5;
const BAR_HEIGHTS = [0.46, 0.63, 1, 0.57, 0.73, 0.44, 0.55];
const BAR_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const MINI_BAR_HEIGHTS = [0.3, 0.55, 0.42, 0.72, 0.86, 1];

const PREVIEW_TRANSACTIONS = [
  { id: "1", merchant: "Nike Store", meta: "Today, 3:45 PM  •  Shopping", color: "#777B84", Icon: ShoppingBag },
  { id: "2", merchant: "Spotify", meta: "Yesterday, 8:12 PM  •  Entertainment", color: "#1DB954", Icon: Music },
  { id: "3", merchant: "Starbucks", meta: "Yesterday, 2:31 PM  •  Food & Drinks", color: "#00704A", Icon: Coffee },
] as const;

const LOCKED_FEATURES = [
  {
    key: "overview",
    title: "Spending Overview",
    description: "See where and how much Alex is spending.",
    Icon: WalletCards,
    color: colors.primary,
    bg: "rgba(107, 56, 212, 0.1)",
  },
  {
    key: "categories",
    title: "Top Categories",
    description: "Discover their top spending categories.",
    Icon: PieChart,
    color: "#2563EB",
    bg: "#DBEAFE",
  },
  {
    key: "activity",
    title: "Live Activity",
    description: "Get real-time alerts and activity updates.",
    Icon: Bell,
    color: colors.primary,
    bg: "rgba(107, 56, 212, 0.1)",
  },
  {
    key: "controls",
    title: "Spending Controls",
    description: "Set limits, blocks, and manage their card.",
    Icon: SlidersHorizontal,
    color: colors.secondary,
    bg: colors.secondaryContainer,
  },
] as const;

type Props = {
  childName: string;
  childAge?: string;
  childPhotoUrl?: string;
  isLinked?: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onVerify: () => void;
  onLinkChild?: () => void;
  insets: { top: number; bottom: number };
};

function PreviewModeBadge({ inverse = false }: { inverse?: boolean }) {
  return (
    <View style={[styles.previewBadge, inverse && styles.previewBadgeInverse]}>
      <Eye size={12} color={inverse ? "rgba(255,255,255,0.9)" : colors.onSurfaceVariant} strokeWidth={2.2} />
      <Text style={[styles.previewBadgeText, inverse && styles.previewBadgeTextInverse]}>Preview Mode</Text>
    </View>
  );
}

function LockedFooter({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.lockedFooter, compact && styles.lockedFooterCompact]}>
      <Lock size={12} color={colors.muted} strokeWidth={2.2} />
      <View>
        <Text style={styles.lockedFooterTitle}>Locked</Text>
        <Text style={styles.lockedFooterText}>Verify to unlock</Text>
      </View>
    </View>
  );
}

function getFirstLetter(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
}

function firstName(name: string): string {
  return firstNameFromDisplayName(name);
}

function MiniBars() {
  return (
    <View style={styles.miniBars}>
      {MINI_BAR_HEIGHTS.map((height, index) => (
        <View key={index} style={[styles.miniBar, { height: 30 * height }]} />
      ))}
    </View>
  );
}

function CategoryVenn() {
  return (
    <View style={styles.vennWrap}>
      <View style={[styles.vennCircle, styles.vennPurple]} />
      <View style={[styles.vennCircle, styles.vennBlue]} />
      <View style={[styles.vennCircle, styles.vennYellow]} />
    </View>
  );
}

function ControlsGhost() {
  return (
    <View style={styles.controlsGhost}>
      <View style={styles.controlsLine} />
      <View style={styles.controlsSwitch} />
      <View style={styles.controlsLineShort} />
      <View style={styles.controlsSwitchMuted} />
    </View>
  );
}

function ActivityGhost() {
  return (
    <View style={styles.activityGhost}>
      <View style={styles.activityGhostDot} />
      <View style={styles.activityGhostLine} />
      <View style={styles.activityGhostDot} />
      <View style={styles.activityGhostLineShort} />
    </View>
  );
}

export default function KidsPreviewDashboard({
  childName,
  childAge,
  childPhotoUrl,
  isLinked = true,
  refreshing,
  onRefresh,
  onVerify,
  onLinkChild,
  insets,
}: Props) {
  const displayName = childName.trim();
  const childFirst = firstName(displayName);
  const photoUrl = childPhotoUrl?.trim() || undefined;
  const ageLabel = childAge?.trim()
    ? `${childAge.trim()} years old`
    : displayName
      ? `${childFirst}'s profile`
      : "";

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 10,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.topHeader}>
          <Text style={styles.brand}>CreditKid</Text>
          <TouchableOpacity activeOpacity={0.86} style={styles.profileButton}>
            <UserRound size={18} color={colors.primary} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderCopy}>
            <Text style={styles.pageTitle}>My Child</Text>
            <Text style={styles.pageSubtitle}>
              {displayName
                ? `You're almost set! Verify your identity to unlock full access to ${childFirst}'s activity and controls.`
                : "You're almost set! Verify your identity to unlock full access to activity and controls."}
            </Text>
          </View>
          {displayName ? (
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={styles.profileAvatarImage} resizeMode="cover" />
              ) : (
                <Text style={styles.profileAvatarLetter}>{getFirstLetter(displayName)}</Text>
              )}
              {isLinked ? <View style={styles.profileOnlineDot} /> : null}
            </View>
            <View style={styles.profileCardCopy}>
              <Text style={styles.profileName} numberOfLines={1}>
                {displayName}
              </Text>
              {ageLabel ? <Text style={styles.profileAge}>{ageLabel}</Text> : null}
              {isLinked ? (
                <View style={styles.linkedBadge}>
                  <Link2 size={10} color={colors.primary} strokeWidth={2.4} />
                  <Text style={styles.linkedBadgeText}>Linked</Text>
                </View>
              ) : onLinkChild ? (
                <TouchableOpacity style={styles.linkChildBadge} onPress={onLinkChild} activeOpacity={0.85}>
                  <Link2 size={10} color={colors.primary} strokeWidth={2.4} />
                  <Text style={styles.linkedBadgeText}>Link {childFirst}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          ) : null}
        </View>

        <LinearGradient
          colors={["#8B6BDF", "#5F39C5", "#4B2AA4"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.spendingCard}
        >
          <View style={styles.spendingTopRow}>
            <View style={styles.monthPill}>
              <Text style={styles.monthPillText}>This Month</Text>
              <ChevronDown size={14} color="rgba(255,255,255,0.85)" strokeWidth={2.2} />
            </View>
            <PreviewModeBadge inverse />
          </View>

          <View style={styles.spendingMiddle}>
            <View style={styles.spendingCopy}>
              <Text style={styles.spentLabel}>Total Spent</Text>
              <Text style={styles.spentAmount}>
                ${PREVIEW_SPENT.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <View style={styles.spendingLockOverlay}>
                <View style={styles.spendingLockPill}>
                  <Lock size={13} color="rgba(255,255,255,0.78)" strokeWidth={2.2} />
                  <Text style={styles.spendingLockTitle}>Locked</Text>
                </View>
                <Text style={styles.spendingLockSub}>Verify to unlock</Text>
              </View>
            </View>

            <View style={styles.chartRow}>
              {BAR_HEIGHTS.map((height, index) => (
                <View key={`${BAR_LABELS[index]}-${index}`} style={styles.chartCol}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: 62 * height,
                        backgroundColor: index === 2 ? colors.onPrimary : "rgba(255,255,255,0.25)",
                      },
                    ]}
                  />
                  <Text style={styles.chartLabel}>{BAR_LABELS[index]}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.spendingFooter}>
            <Lock size={14} color="rgba(255,255,255,0.85)" strokeWidth={2.2} />
            <Text style={styles.spendingFooterText}>
              Verify your identity to see real-time data and insights.
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.habitsCard}>
          <View style={styles.habitsIconWrap}>
            <Shield size={20} color={colors.onPrimary} strokeWidth={2.2} />
          </View>
          <View style={styles.habitsTextWrap}>
            <Text style={styles.habitsTitle}>Build smart money habits</Text>
            <Text style={styles.habitsSubtitle}>
              Get insights, trends, and personalized tips to help {childFirst || "your child"} make smarter choices.
            </Text>
          </View>
          <View style={styles.habitsGraphWrap}>
            <Image source={HABITS_GRAPH} style={styles.habitsGraph} resizeMode="contain" />
            <View style={styles.habitsGraphLock}>
              <Lock size={12} color={colors.muted} strokeWidth={2.3} />
            </View>
          </View>
        </View>

        <View style={styles.featureGrid}>
          {LOCKED_FEATURES.map((feature, index) => {
            const Icon = feature.Icon;
            return (
              <View key={feature.key} style={styles.featureCard}>
                <View style={styles.cardLockIconSmall}>
                  <Lock size={12} color={colors.muted} strokeWidth={2.3} />
                </View>
                <View style={[styles.featureIconWrap, { backgroundColor: feature.bg }]}>
                  <Icon size={18} color={feature.color} strokeWidth={2.2} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
                <LockedFooter compact />
                {index === 0 ? <MiniBars /> : null}
                {index === 1 ? <CategoryVenn /> : null}
                {index === 2 ? <ActivityGhost /> : null}
                {index === 3 ? <ControlsGhost /> : null}
              </View>
            );
          })}
        </View>

        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>Recent Activity</Text>
            <PreviewModeBadge />
          </View>

          {PREVIEW_TRANSACTIONS.map((txn) => {
            const Icon = txn.Icon;
            return (
            <View key={txn.id} style={styles.activityRow}>
              <View style={[styles.merchantIcon, { backgroundColor: txn.color }]}>
                <Icon size={17} color="#FFFFFF" strokeWidth={2.2} />
              </View>
              <View style={styles.activityMerchantWrap}>
                <Text style={styles.activityMerchant}>{txn.merchant}</Text>
                <Text style={styles.activityMeta}>{txn.meta}</Text>
              </View>
              <View style={styles.activityLockWrap}>
                <Lock size={12} color={colors.muted} strokeWidth={2.2} />
                <Text style={styles.activityLockText}>Verify to unlock{"\n"}details</Text>
              </View>
            </View>
            );
          })}

          <TouchableOpacity onPress={onVerify} activeOpacity={0.85} style={styles.activityCta}>
            <Text style={styles.activityCtaText}>Verify to view all transactions</Text>
            <ChevronRight size={16} color={colors.primary} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        <BankingSetupRequiredCard onCompleteSetup={onVerify} showBlessingPreview={false} />

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F9F7FF",
  },
  scroll: {
    flex: 1,
    marginBottom: spacing[20],
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  brand: {
    ...typography.headlineLg,
    fontFamily: fontFamily.display,
    fontSize: 36,
    fontWeight: "900",
    color: colors.primary,
    fontStyle: "italic",
    letterSpacing: -0.3,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(107, 56, 212, 0.15)",
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.14,
        shadowRadius: 9,
      },
      android: { elevation: 4 },
    }),
  },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  pageHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  pageTitle: {
    fontFamily: fontFamily.headline,
    fontSize: 28,
    fontWeight: "900",
    color: "#06081F",
    letterSpacing: -0.7,
    marginBottom: 6,
  },
  pageSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    lineHeight: 16,
    color: colors.onSurfaceVariant,
  },
  profileCard: {
    width: 208,
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 22,
    padding: 12,
    shadowColor: "#0c1c2a",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 4,
  },
  profileAvatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 31,
  },
  profileOnlineDot: {
    position: "absolute",
    right: 2,
    bottom: 6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#6BE6A3",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  profileAvatarLetter: {
    fontFamily: fontFamily.headline,
    fontSize: 24,
    fontWeight: "800",
    color: colors.primary,
  },
  profileCardCopy: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-start",
  },
  profileName: {
    fontFamily: fontFamily.headline,
    fontSize: 13,
    fontWeight: "900",
    color: "#111225",
    marginBottom: 4,
  },
  profileAge: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginBottom: 8,
  },
  linkedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(107, 56, 212, 0.1)",
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  linkChildBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.onPrimary,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(107, 56, 212, 0.2)",
  },
  linkedBadgeText: {
    fontFamily: fontFamily.label,
    fontSize: 10,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.3,
  },
  spendingCard: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    marginBottom: 14,
    overflow: "hidden",
    position: "relative",
  },
  spendingTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  monthPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "transparent",
    borderRadius: radius.full,
    paddingVertical: 2,
  },
  monthPillText: {
    fontFamily: fontFamily.label,
    fontSize: 10,
    fontWeight: "700",
    color: colors.onPrimary,
  },
  previewBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.full,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  previewBadgeInverse: {
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  previewBadgeText: {
    fontFamily: fontFamily.label,
    fontSize: 9,
    fontWeight: "700",
    color: colors.onSurfaceVariant,
  },
  previewBadgeTextInverse: {
    color: "rgba(255,255,255,0.92)",
  },
  spendingMiddle: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  spendingCopy: {
    width: 128,
    paddingBottom: 2,
  },
  spentLabel: {
    fontFamily: fontFamily.label,
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
    marginBottom: 2,
  },
  spentAmount: {
    fontFamily: fontFamily.display,
    fontSize: 28,
    fontWeight: "900",
    color: colors.onPrimary,
    letterSpacing: -0.7,
    marginBottom: 9,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 16,
    minHeight: 86,
    flex: 1,
    paddingLeft: 8,
  },
  chartCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  chartBar: {
    width: 8,
    borderRadius: 6,
    minHeight: 8,
  },
  chartLabel: {
    fontFamily: fontFamily.label,
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.75)",
  },
  spendingLockOverlay: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  spendingLockPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  spendingLockTitle: {
    fontFamily: fontFamily.headline,
    fontSize: 12,
    fontWeight: "800",
    color: colors.onPrimary,
  },
  spendingLockSub: {
    fontFamily: fontFamily.body,
    fontSize: 8,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },
  spendingFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    backgroundColor: "rgba(24, 11, 74, 0.32)",
    borderRadius: 0,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginHorizontal: -14,
    marginBottom: -10,
    marginTop: 8,
  },
  spendingFooterText: {
    fontFamily: fontFamily.body,
    fontSize: 10,
    lineHeight: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "700",
  },
  habitsCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 78,
    shadowColor: "#0c1c2a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  habitsIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
  },
  habitsTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  habitsTitle: {
    fontFamily: fontFamily.headline,
    fontSize: 15,
    fontWeight: "900",
    color: colors.onSurface,
    marginBottom: 4,
  },
  habitsSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    lineHeight: 14,
    color: colors.onSurfaceVariant,
  },
  habitsGraphWrap: {
    width: 100,
    height: 50,
    flexShrink: 0,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  habitsGraph: {
    width: "100%",
    height: "100%",
  },
  habitsGraphLock: {
    position: "absolute",
    top: -10,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(107, 56, 212, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  featureCard: {
    width: "48.5%",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 12,
    overflow: "hidden",
    minHeight: 126,
    position: "relative",
  },
  featureIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  featureTitle: {
    fontFamily: fontFamily.headline,
    fontSize: 15,
    fontWeight: "900",
    color: colors.onSurface,
    marginBottom: 3,
  },
  featureDescription: {
    fontFamily: fontFamily.body,
    fontSize: 9,
    lineHeight: 12,
    color: colors.onSurfaceVariant,
    marginBottom: 12,
    maxWidth: 118,
  },
  lockedFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: "auto",
  },
  lockedFooterCompact: {
    alignItems: "flex-start",
  },
  lockedFooterTitle: {
    fontFamily: fontFamily.label,
    fontSize: 9,
    fontWeight: "800",
    color: colors.onSurfaceVariant,
    lineHeight: 10,
  },
  lockedFooterText: {
    fontFamily: fontFamily.label,
    fontSize: 8,
    fontWeight: "700",
    color: colors.muted,
    lineHeight: 10,
  },
  cardLockIconSmall: {
    position: "absolute",
    right: 10,
    top: 10,
    zIndex: 2,
  },
  miniBars: {
    position: "absolute",
    right: 12,
    bottom: 18,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    opacity: 0.18,
  },
  miniBar: {
    width: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  vennWrap: {
    position: "absolute",
    right: 10,
    bottom: 22,
    width: 46,
    height: 34,
  },
  vennCircle: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    opacity: 0.48,
  },
  vennPurple: {
    left: 0,
    top: 5,
    backgroundColor: colors.primary,
  },
  vennBlue: {
    left: 14,
    top: 0,
    backgroundColor: "#60A5FA",
  },
  vennYellow: {
    left: 22,
    top: 8,
    backgroundColor: "#FDE68A",
  },
  controlsGhost: {
    position: "absolute",
    right: 12,
    bottom: 22,
    width: 52,
    opacity: 0.22,
  },
  controlsLine: {
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginBottom: 7,
  },
  controlsLineShort: {
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginBottom: 0,
  },
  controlsSwitch: {
    position: "absolute",
    top: -2,
    right: 0,
    width: 18,
    height: 9,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  controlsSwitchMuted: {
    position: "absolute",
    top: 14,
    right: 0,
    width: 18,
    height: 9,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  activityGhost: {
    position: "absolute",
    right: 14,
    bottom: 22,
    width: 58,
    opacity: 0.16,
  },
  activityGhostDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginBottom: 6,
  },
  activityGhostLine: {
    position: "absolute",
    left: 12,
    top: 1,
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  activityGhostLineShort: {
    position: "absolute",
    left: 12,
    top: 13,
    width: 30,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  activitySection: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  activityHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  activityTitle: {
    fontFamily: fontFamily.headline,
    fontSize: 13,
    fontWeight: "900",
    color: colors.onSurface,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(15, 23, 42, 0.08)",
  },
  merchantIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  activityMerchantWrap: {
    flex: 1,
    minWidth: 0,
  },
  activityMerchant: {
    fontFamily: fontFamily.headline,
    fontSize: 11,
    fontWeight: "900",
    color: colors.onSurface,
    marginBottom: 2,
  },
  activityMeta: {
    fontFamily: fontFamily.body,
    fontSize: 8,
    color: colors.onSurfaceVariant,
  },
  activityLockWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: 104,
  },
  activityLockText: {
    fontFamily: fontFamily.label,
    fontSize: 8,
    lineHeight: 11,
    fontWeight: "700",
    color: colors.muted,
  },
  activityCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 8,
    paddingVertical: 4,
  },
  activityCtaText: {
    fontFamily: fontFamily.headline,
    fontSize: 10,
    fontWeight: "800",
    color: colors.primary,
  },
});
