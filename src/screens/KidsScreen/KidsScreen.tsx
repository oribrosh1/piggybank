import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { navigateToStripeConnectOrPersonalInfo } from "@/src/lib/stripeHostedOnboarding";
import {
  UserPlus,
  ShieldCheck,
  Activity as ActivityIcon,
  CreditCard,
  SlidersHorizontal,
  ShieldBan,
  Bell,
  XCircle,
  ChevronRight,
  HelpCircle,
  Lock,
} from "lucide-react-native";
import {
  ChildCardVisual,
  QuickActionsRow,
  SpendingLimitsCard,
  BlockedCategoriesCard,
  ChildTransactionList,
  ChildSpendingSummary,
  SpendingLimitModal,
} from "@/src/components/kids";
import ChildLinkCard from "@/src/components/events/ChildLinkCard";
import { useKidsScreen } from "./useKidsScreen";
import KidsPreviewDashboard from "./KidsPreviewDashboard";
import AppTabFooter from "@/src/components/AppTabFooter";
import AppTabHeader from "@/src/components/AppTabHeader";
import { colors, radius, spacing, typography, fontFamily, primaryGradient } from "@/src/theme";
import { childDisplayNameFromEvent, firstNameFromDisplayName } from "@/src/lib/eventTitle";
import LottieView from "lottie-react-native";

const PARENT_CHILD_LOTTIE = require("../../../assets/lotties/parent-child-creditkid.json");

const UNLINKED_FEATURES = [
  {
    icon: CreditCard,
    label: "Virtual Card",
    badge: "INSTANT SETUP",
    description: "Create and manage your child's virtual card instantly.",
    color: colors.primary,
    iconBg: "rgba(107, 56, 212, 0.1)",
    badgeColor: colors.primary,
    badgeBg: "rgba(107, 56, 212, 0.1)",
  },
  {
    icon: SlidersHorizontal,
    label: "Spending Limits",
    badge: "FULL CONTROL",
    description: "Set daily, weekly, or monthly limits with full control.",
    color: colors.secondary,
    iconBg: colors.secondaryContainer,
    badgeColor: colors.secondary,
    badgeBg: "rgba(0, 108, 73, 0.1)",
  },
  {
    icon: ShieldBan,
    label: "Category Blocks",
    badge: "SAFETY FIRST",
    description: "Block or allow specific categories for safer spending.",
    color: "#EA580C",
    iconBg: "#FFEDD5",
    badgeColor: "#EA580C",
    badgeBg: "#FFEDD5",
  },
  {
    icon: Bell,
    label: "Live Activity",
    badge: "REAL-TIME ALERTS",
    description: "Get real-time alerts and stay updated on their activity.",
    color: colors.primary,
    iconBg: "rgba(107, 56, 212, 0.1)",
    badgeColor: colors.primary,
    badgeBg: "rgba(107, 56, 212, 0.1)",
  },
] as const;

export default function KidsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const hook = useKidsScreen();
  const [openingBanking, setOpeningBanking] = useState(false);

  const onVerifyIdentity = useCallback(async () => {
    if (openingBanking) return;
    setOpeningBanking(true);
    try {
      await navigateToStripeConnectOrPersonalInfo(router);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : err instanceof Error
            ? err.message
            : "Could not open Stripe. Try again.";
      Alert.alert("Setup", String(msg || "Something went wrong"));
    } finally {
      setOpeningBanking(false);
    }
  }, [router, openingBanking]);

  if (hook.loading || hook.bankingLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "transparent", paddingTop: insets.top }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={[
              typography.bodyMd,
              { marginTop: spacing[3], color: colors.muted, fontFamily: fontFamily.title },
            ]}
          >
            Loading...
          </Text>
        </View>
        <AppTabFooter />
      </View>
    );
  }

  const isChildLinked = Boolean(hook.childAccountId && hook.card);
  const eventChildName = childDisplayNameFromEvent(hook.latestEventMeta);
  const previewChildName =
    hook.card?.childName?.trim() ||
    eventChildName ||
    hook.latestEventMeta?.eventName?.trim() ||
    "";

  if (!hook.bankingReady) {
    return (
      <>
        <KidsPreviewDashboard
          childName={previewChildName}
          childAge={hook.latestEventMeta?.age}
          childPhotoUrl={hook.latestEventMeta?.honoreePhotoUrl}
          isLinked={isChildLinked}
          refreshing={hook.refreshing}
          onRefresh={hook.onRefresh}
          onVerify={onVerifyIdentity}
          onLinkChild={isChildLinked ? undefined : () => hook.setLinkModalVisible(true)}
          insets={insets}
        />
        {!isChildLinked ? (
          <ChildLinkCard
            visible={hook.linkModalVisible}
            onClose={() => hook.setLinkModalVisible(false)}
            onSendInvite={hook.handleSendInvite}
            loading={hook.sendingInvite}
          />
        ) : null}
      </>
    );
  }

  if (!isChildLinked) {
    return (
      <UnlinkedKidsView hook={hook} insets={insets} />
    );
  }

  const childCard = hook.card!;
  const { card } = childCard;
  const isFrozen = card.status === "inactive";
  const spendingLimits = card.spendingControls?.spending_limits || [];
  const blockedCategories = card.spendingControls?.blocked_categories || [];

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "transparent",
      }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={hook.refreshing}
            onRefresh={hook.onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 12 }}>
          <AppTabHeader />
        </View>
        {/* Header */}
        <View
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 24,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "rgba(255,255,255,0.7)",
              marginBottom: 4,
            }}
          >
            MY CHILD
          </Text>
          <Text
            style={{
              fontSize: 26,
              fontWeight: "800",
              color: "#FFFFFF",
            }}
          >
            {childCard.childName?.trim() || eventChildName || "My Child"}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          {/* Card Visual */}
          <ChildCardVisual
            last4={card.last4}
            expMonth={card.expMonth}
            expYear={card.expYear}
            status={card.status}
            brand={card.brand}
            balance={childCard.balance}
            childName={childCard.childName}
          />

          {/* Quick Actions */}
          <QuickActionsRow
            isFrozen={isFrozen}
            freezing={hook.freezing}
            onToggleFreeze={hook.handleToggleFreeze}
            onSetLimits={() => hook.setLimitsModalVisible(true)}
          />

          {/* ── Spending Controls Section ── */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
              marginTop: 4,
            }}
          >
            <ShieldCheck size={18} color={colors.primary} strokeWidth={2.5} />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: colors.primary,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              Spending Controls
            </Text>
            <View
              style={{
                flex: 1,
                height: 1,
                backgroundColor: "#E5E7EB",
                marginLeft: 8,
              }}
            />
          </View>

          <SpendingLimitsCard
            spendingLimits={spendingLimits}
            onEdit={() => hook.setLimitsModalVisible(true)}
          />

          <BlockedCategoriesCard
            blockedCategories={blockedCategories}
            onToggleCategory={hook.handleToggleCategory}
            updating={hook.updatingCategories}
          />

          {/* ── Activity Section ── */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
              marginTop: 8,
            }}
          >
            <ActivityIcon size={18} color={colors.primary} strokeWidth={2.5} />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: colors.primary,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              Activity
            </Text>
            <View
              style={{
                flex: 1,
                height: 1,
                backgroundColor: "#E5E7EB",
                marginLeft: 8,
              }}
            />
          </View>

          <ChildTransactionList
            transactions={hook.transactions}
            hasMore={hook.hasMoreTxns}
            loadingMore={hook.loadingMoreTxns}
            onLoadMore={hook.handleLoadMoreTransactions}
          />

          <ChildSpendingSummary summary={hook.summary} />

          <AppTabFooter />
        </View>
      </ScrollView>

      {/* Spending Limit Modal */}
      <SpendingLimitModal
        visible={hook.limitsModalVisible}
        onClose={() => hook.setLimitsModalVisible(false)}
        onSave={hook.handleUpdateLimits}
        saving={hook.updatingLimits}
        currentLimits={spendingLimits}
      />
    </View>
  );
}

type UnlinkedKidsViewProps = {
  hook: ReturnType<typeof useKidsScreen>;
  insets: { top: number; bottom: number };
};

function UnlinkedKidsView({ hook, insets }: UnlinkedKidsViewProps) {
  const [helpVisible, setHelpVisible] = useState(false);
  const childName = childDisplayNameFromEvent(hook.latestEventMeta);
  const childFirst = firstNameFromDisplayName(childName);
  const linkTitle = childName
    ? `Link ${childFirst} to unlock`
    : "Link your child to unlock";
  const linkSubtitle = childName
    ? `Connect ${childFirst}'s profile to access all features and start their journey.`
    : "Connect your child's profile to access all features and start their journey.";
  const linkCtaLabel = childName ? `Link ${childFirst}` : "Link Your Child";

  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: "transparent" }}
        contentContainerStyle={{
          paddingHorizontal: spacing[5],
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <AppTabHeader />

        <LinearGradient
          {...primaryGradient}
          style={unlinkedStyles.heroBanner}
        >
          <View style={unlinkedStyles.heroRow}>
            <View style={unlinkedStyles.heroCopy}>
              <Text style={unlinkedStyles.heroTitle}>{linkTitle}</Text>
              <Text style={unlinkedStyles.heroSubtitle}>
                {linkSubtitle}
              </Text>
              <TouchableOpacity
                style={unlinkedStyles.heroCta}
                onPress={() => hook.setLinkModalVisible(true)}
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityLabel={linkCtaLabel}
              >
                <UserPlus size={16} color={colors.primary} strokeWidth={2.4} />
                <Text style={unlinkedStyles.heroCtaText}>{linkCtaLabel}</Text>
              </TouchableOpacity>
            </View>
            <View style={unlinkedStyles.lottieWrap}>
              <LottieView
                source={PARENT_CHILD_LOTTIE}
                style={unlinkedStyles.lottie}
                autoPlay
                loop
                resizeMode="contain"
              />
            </View>
          </View>
        </LinearGradient>

        {hook.pendingInvite?.hasPending ? (
          <View style={unlinkedStyles.pendingBanner}>
            <View style={{ flex: 1 }}>
              <Text style={unlinkedStyles.pendingTitle}>Invite Pending</Text>
              <Text style={unlinkedStyles.pendingBody}>
                Sent to {hook.pendingInvite.childName || "your child"} ({hook.pendingInvite.childPhone})
              </Text>
            </View>
            <TouchableOpacity
              onPress={hook.handleRevokeInvite}
              disabled={hook.revokingInvite}
              style={{ padding: 8, opacity: hook.revokingInvite ? 0.5 : 1 }}
            >
              {hook.revokingInvite ? (
                <ActivityIndicator size="small" color="#92400E" />
              ) : (
                <XCircle size={22} color="#92400E" strokeWidth={2} />
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={unlinkedStyles.featureGrid}>
          {UNLINKED_FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <View key={feature.label} style={unlinkedStyles.featureCard}>
                <View style={unlinkedStyles.featureTopRow}>
                  <View style={[unlinkedStyles.featureIconBubble, { backgroundColor: feature.iconBg }]}>
                    <Icon size={20} color={feature.color} strokeWidth={2} />
                  </View>
                  <ChevronRight size={18} color={colors.outlineVariant} strokeWidth={2} />
                </View>
                <Text style={unlinkedStyles.featureTitle}>{feature.label}</Text>
                <View style={[unlinkedStyles.featureBadge, { backgroundColor: feature.badgeBg }]}>
                  <Text style={[unlinkedStyles.featureBadgeText, { color: feature.badgeColor }]}>
                    {feature.badge}
                  </Text>
                </View>
                <Text style={unlinkedStyles.featureDescription}>{feature.description}</Text>
              </View>
            );
          })}
        </View>

        <View style={unlinkedStyles.securityBanner}>
          <View style={unlinkedStyles.securityIconWrap}>
            <ShieldCheck size={20} color={colors.secondary} strokeWidth={2.2} />
          </View>
          <View style={unlinkedStyles.securityCopy}>
            <Text style={unlinkedStyles.securityTitle}>Your child's data is secure and private</Text>
            <Text style={unlinkedStyles.securitySubtitle}>We never share your information.</Text>
          </View>
          <Lock size={18} color="rgba(0, 108, 73, 0.18)" strokeWidth={2} />
        </View>

        <TouchableOpacity
          style={unlinkedStyles.helpCard}
          onPress={() => setHelpVisible(true)}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="How does it work"
        >
          <View style={unlinkedStyles.helpIconWrap}>
            <HelpCircle size={20} color={colors.primary} strokeWidth={2.2} />
          </View>
          <View style={unlinkedStyles.helpCopy}>
            <Text style={unlinkedStyles.helpTitle}>How does it work?</Text>
            <Text style={unlinkedStyles.helpSubtitle}>
              Learn how linking your child helps you guide and protect them.
            </Text>
          </View>
          <ChevronRight size={18} color={colors.primary} strokeWidth={2.2} />
        </TouchableOpacity>

        {__DEV__ ? (
          <TouchableOpacity
            onPress={hook.handleTestLink}
            disabled={hook.testLinking}
            activeOpacity={0.82}
            style={[
              unlinkedStyles.devButton,
              { opacity: hook.testLinking ? 0.6 : 1 },
            ]}
          >
            {hook.testLinking ? (
              <ActivityIndicator size="small" color={colors.onSurfaceVariant} />
            ) : null}
            <Text style={unlinkedStyles.devButtonText}>
              {hook.testLinking ? "Provisioning..." : "Test Link Account"}
            </Text>
          </TouchableOpacity>
        ) : null}

        <AppTabFooter />
      </ScrollView>

      <Modal visible={hook.testLinking} transparent animationType="fade">
        <View style={unlinkedStyles.testOverlay}>
          <View style={unlinkedStyles.testCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={unlinkedStyles.testTitle}>Setting up test account...</Text>
            <Text style={unlinkedStyles.testBody}>
              Creating Stripe account, provisioning card, and adding funds. This may take 2-3 minutes.
            </Text>
          </View>
        </View>
      </Modal>

      <Modal visible={helpVisible} transparent animationType="fade" onRequestClose={() => setHelpVisible(false)}>
        <View style={unlinkedStyles.testOverlay}>
          <View style={unlinkedStyles.helpModalCard}>
            <Text style={unlinkedStyles.helpModalTitle}>How linking works</Text>
            <Text style={unlinkedStyles.helpModalStep}>1. Enter your child's name and phone number.</Text>
            <Text style={unlinkedStyles.helpModalStep}>2. They receive an SMS with a download link and PIN.</Text>
            <Text style={unlinkedStyles.helpModalStep}>3. Once they join, you can manage their card, limits, and activity here.</Text>
            <TouchableOpacity
              style={unlinkedStyles.helpModalCta}
              onPress={() => {
                setHelpVisible(false);
                hook.setLinkModalVisible(true);
              }}
              activeOpacity={0.9}
            >
              <Text style={unlinkedStyles.helpModalCtaText}>{linkCtaLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setHelpVisible(false)} style={{ marginTop: 12 }}>
              <Text style={unlinkedStyles.helpModalDismiss}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ChildLinkCard
        visible={hook.linkModalVisible}
        onClose={() => hook.setLinkModalVisible(false)}
        onSendInvite={hook.handleSendInvite}
        loading={hook.sendingInvite}
      />
    </View>
  );
}

const unlinkedStyles = StyleSheet.create({
  heroBanner: {
    borderRadius: radius.lg,
    marginTop: spacing[2],
    padding: spacing[4],
    marginBottom: spacing[4],
    overflow: "hidden",
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  lottieWrap: {
    width: 130,
    height: 140,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  lottie: {
    width: 200,
    height: 250,
  },
  heroTitle: {
    fontFamily: fontFamily.headline,
    fontSize: 17,
    fontWeight: "800",
    color: colors.onPrimary,
    letterSpacing: -0.3,
    marginBottom: spacing[1],
  },
  heroSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(255,255,255,0.88)",
    marginBottom: spacing[3],
  },
  heroCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.onPrimary,
    borderRadius: radius.full,
    paddingVertical: 10,
    paddingHorizontal: spacing[3],
    alignSelf: "flex-start",
  },
  heroCtaText: {
    fontFamily: fontFamily.headline,
    fontSize: 12,
    fontWeight: "800",
    color: colors.primary,
  },
  pendingBanner: {
    backgroundColor: "#FEF3C7",
    borderRadius: radius.md,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  pendingTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#92400E",
    marginBottom: 2,
  },
  pendingBody: {
    fontSize: 12,
    color: "#A16207",
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: spacing[4],
  },
  featureCard: {
    width: "48%",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.06)",
    shadowColor: "#0c1c2a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  featureTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing[3],
  },
  featureIconBubble: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: {
    fontFamily: fontFamily.headline,
    fontSize: 15,
    fontWeight: "800",
    color: colors.onSurface,
    marginBottom: 6,
  },
  featureBadge: {
    alignSelf: "flex-start",
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  featureBadgeText: {
    fontFamily: fontFamily.label,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  featureDescription: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    lineHeight: 15,
    color: colors.onSurfaceVariant,
  },
  securityBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    backgroundColor: colors.secondaryContainer,
    borderRadius: radius.md,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: "rgba(0, 108, 73, 0.12)",
  },
  securityIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  securityCopy: {
    flex: 1,
    minWidth: 0,
  },
  securityTitle: {
    fontFamily: fontFamily.headline,
    fontSize: 14,
    fontWeight: "800",
    color: colors.onSurface,
    marginBottom: 2,
  },
  securitySubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    lineHeight: 16,
    color: colors.onSurfaceVariant,
  },
  helpCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing[4],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.06)",
    shadowColor: "#0c1c2a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  helpIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(107, 56, 212, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  helpCopy: {
    flex: 1,
    minWidth: 0,
  },
  helpTitle: {
    fontFamily: fontFamily.headline,
    fontSize: 15,
    fontWeight: "800",
    color: colors.onSurface,
    marginBottom: 2,
  },
  helpSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    lineHeight: 16,
    color: colors.onSurfaceVariant,
  },
  devButton: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.sm,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: spacing[4],
  },
  devButtonText: {
    fontFamily: fontFamily.title,
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  testOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  testCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    width: "100%",
  },
  testTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.onSurface,
    marginTop: 16,
  },
  testBody: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 18,
  },
  helpModalCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: spacing[5],
    width: "100%",
  },
  helpModalTitle: {
    fontFamily: fontFamily.headline,
    fontSize: 20,
    fontWeight: "800",
    color: colors.onSurface,
    marginBottom: spacing[4],
  },
  helpModalStep: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.onSurfaceVariant,
    marginBottom: spacing[3],
  },
  helpModalCta: {
    marginTop: spacing[2],
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 14,
    alignItems: "center",
  },
  helpModalCtaText: {
    fontFamily: fontFamily.headline,
    fontSize: 15,
    fontWeight: "800",
    color: colors.onPrimary,
  },
  helpModalDismiss: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    fontWeight: "600",
    color: colors.muted,
    textAlign: "center",
  },
});
