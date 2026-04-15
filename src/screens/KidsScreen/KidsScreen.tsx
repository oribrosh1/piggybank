import React from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Users, UserPlus, ShieldCheck, Activity as ActivityIcon,
  CreditCard, SlidersHorizontal, ShieldBan, Bell, XCircle,
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
import AppTabFooter from "@/src/components/AppTabFooter";
import AppTabHeader from "@/src/components/AppTabHeader";
import { colors, radius, spacing, typography, ambientShadow, fontFamily } from "@/src/theme";
import Button from "@/src/components/common/Button";
import LottieView from "lottie-react-native";

const PARENT_CHILD_LOTTIE = require("../../../assets/lotties/parent-child-creditkid.json");

export default function KidsScreen() {
  const insets = useSafeAreaInsets();
  const hook = useKidsScreen();

  if (hook.loading) {
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

  if (!hook.childAccountId || !hook.card) {
    const FEATURES = [
      { icon: CreditCard, label: "Virtual Card", badge: "INSTANT SETUP", color: colors.primary, bg: colors.surfaceContainerLow },
      { icon: SlidersHorizontal, label: "Spending Limits", badge: "FULL CONTROL", color: colors.secondary, bg: colors.secondaryContainer },
      { icon: ShieldBan, label: "Category Blocks", badge: "SAFETY FIRST", color: "#EA580C", bg: "#FFEDD5" },
      { icon: Bell, label: "Live Activity", badge: "REAL-TIME ALERTS", color: colors.primary, bg: colors.surfaceContainerLow },
    ];

    return (
      <View style={{ flex: 1, backgroundColor: "transparent" }}>
        <ScrollView
          style={{ flex: 1, backgroundColor: "transparent" }}
          contentContainerStyle={{
            paddingHorizontal: spacing[5],
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 24,
          }}
        >
          <AppTabHeader />
          <Text style={[typography.headlineLg, { fontSize: 28, marginBottom: spacing[4] }]}>My Child</Text>
          {/* Hero card */}
          <View style={{
              borderRadius: radius.lg, alignItems: "center", marginBottom: 12,
          }}>
            <View
              style={{
                backgroundColor: "white",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
              }}
            >
              <LottieView
                source={PARENT_CHILD_LOTTIE}
                style={{ width: "100%", height: 250 }}
                autoPlay
                loop
                resizeMode="contain"
              />
            </View>
            <Text style={[typography.titleLg, { textAlign: "center", marginBottom: spacing[2], paddingHorizontal: 16 }]}>
              Link your child to unlock
            </Text>
            <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant, textAlign: "center", lineHeight: 20 , paddingHorizontal: 16}]}>
              Manage their card, track spending, and build healthy habits together.
            </Text>
          </View>

          {/* Pending invite banner */}
          {hook.pendingInvite?.hasPending && (
            <View style={{
              backgroundColor: "#FEF3C7", borderRadius: radius.md, padding: 16,
              flexDirection: "row", alignItems: "center", marginBottom: 16,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#92400E", marginBottom: 2 }}>
                  Invite Pending
                </Text>
                <Text style={{ fontSize: 12, color: "#A16207" }}>
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
          )}

          {/* Feature preview grid */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28, paddingHorizontal: 16 }}>
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <View key={f.label} style={{
                  width: "48%", backgroundColor: colors.surfaceContainerLowest, borderRadius: radius.md, padding: 16,
                  ...ambientShadow,
                }}>
                  <View style={{
                    width: 40, height: 40, borderRadius: radius.sm, backgroundColor: f.bg,
                    alignItems: "center", justifyContent: "center", marginBottom: 10,
                  }}>
                    <Icon size={20} color={f.color} strokeWidth={2} />
                  </View>
                  <Text style={[typography.titleLg, { fontSize: 15, marginBottom: 4 }]}>{f.label}</Text>
                  <Text style={[typography.labelMd, { fontSize: 10, color: f.color, letterSpacing: 0.5 }]}>{f.badge}</Text>
                </View>
              );
            })}
          </View>

          {/* Link CTA */}
          <View style={{ marginBottom: 12 }}>
            <Button
              label="Link Your Child"
              onPress={() => hook.setLinkModalVisible(true)}
              leftIcon={<UserPlus size={18} color="#ffffff" strokeWidth={2.5} />}
            />
          </View>

          <TouchableOpacity onPress={() => hook.setLinkModalVisible(true)} style={{ alignItems: "center", marginBottom: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#0D9488" }}>How does it work?</Text>
          </TouchableOpacity>

          {/* Dev-only test button */}
          {__DEV__ && (
            <TouchableOpacity
              onPress={hook.handleTestLink}
              disabled={hook.testLinking}
              activeOpacity={0.82}
              style={{
                backgroundColor: colors.surfaceContainerLow,
                borderRadius: radius.sm,
                paddingVertical: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                opacity: hook.testLinking ? 0.6 : 1,
              }}
            >
              {hook.testLinking ? (
                <ActivityIndicator size="small" color={colors.onSurfaceVariant} />
              ) : null}
              <Text style={[typography.bodyMd, { fontSize: 13, color: colors.onSurfaceVariant, fontFamily: fontFamily.title }]}>
                {hook.testLinking ? "Provisioning..." : "Test Link Account"}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Test linking progress overlay */}
        <Modal visible={hook.testLinking} transparent animationType="fade">
          <View style={{
            flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center", alignItems: "center", paddingHorizontal: 40,
          }}>
            <View style={{
              backgroundColor: "#FFFFFF", borderRadius: 20, padding: 32,
              alignItems: "center", width: "100%",
            }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#0F172A", marginTop: 16 }}>
                Setting up test account...
              </Text>
              <Text style={{ fontSize: 13, color: "#9CA3AF", marginTop: 8, textAlign: "center" }}>
                Creating Stripe account, provisioning card, and adding funds. This may take 2-3 minutes.
              </Text>
            </View>
          </View>
        </Modal>

        {/* ChildLinkCard in controlled mode */}
        <ChildLinkCard
          visible={hook.linkModalVisible}
          onClose={() => hook.setLinkModalVisible(false)}
          onSendInvite={hook.handleSendInvite}
          loading={hook.sendingInvite}
        />
      </View>
    );
  }

  const { card } = hook.card;
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
            {hook.card.childName || "My Child"}
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
            balance={hook.card.balance}
            childName={hook.card.childName}
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
