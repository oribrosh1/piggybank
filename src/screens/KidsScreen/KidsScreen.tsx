import React from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
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

export default function KidsScreen() {
  const insets = useSafeAreaInsets();
  const hook = useKidsScreen();

  if (hook.loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#F0FFFE",
          justifyContent: "center",
          alignItems: "center",
          paddingTop: insets.top,
        }}
      >
        <ActivityIndicator size="large" color="#6B3AA0" />
        <Text
          style={{
            marginTop: 12,
            fontSize: 14,
            color: "#9CA3AF",
            fontWeight: "600",
          }}
        >
          Loading...
        </Text>
      </View>
    );
  }

  if (!hook.childAccountId || !hook.card) {
    const FEATURES = [
      { icon: CreditCard, label: "Virtual Card", badge: "INSTANT SETUP", color: "#6B3AA0", bg: "#EDE9FE" },
      { icon: SlidersHorizontal, label: "Spending Limits", badge: "FULL CONTROL", color: "#059669", bg: "#D1FAE5" },
      { icon: ShieldBan, label: "Category Blocks", badge: "SAFETY FIRST", color: "#EA580C", bg: "#FFEDD5" },
      { icon: Bell, label: "Live Activity", badge: "REAL-TIME ALERTS", color: "#6B3AA0", bg: "#EDE9FE" },
    ];

    return (
      <View style={{ flex: 1, backgroundColor: "#F0FFFE", paddingTop: insets.top }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}>
          <Text style={{ fontSize: 28, fontWeight: "800", color: "#1F2937" }}>My Child</Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}>
          {/* Hero card */}
          <View style={{
            backgroundColor: "#EDE9FE", borderRadius: 24, padding: 28, alignItems: "center", marginBottom: 24,
          }}>
            <View style={{
              width: 72, height: 72, borderRadius: 36, backgroundColor: "#DDD6FE",
              alignItems: "center", justifyContent: "center", marginBottom: 16,
            }}>
              <Users size={32} color="#6B3AA0" strokeWidth={1.8} />
            </View>
            <Text style={{ fontSize: 20, fontWeight: "900", color: "#0F172A", textAlign: "center", marginBottom: 8 }}>
              Link your child to unlock
            </Text>
            <Text style={{ fontSize: 14, color: "#64748B", textAlign: "center", lineHeight: 20 }}>
              Manage their card, track spending, and build healthy habits together.
            </Text>
          </View>

          {/* Pending invite banner */}
          {hook.pendingInvite?.hasPending && (
            <View style={{
              backgroundColor: "#FEF3C7", borderRadius: 16, padding: 16,
              flexDirection: "row", alignItems: "center", marginBottom: 16,
              borderWidth: 1, borderColor: "#FDE68A",
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
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <View key={f.label} style={{
                  width: "48%", backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16,
                  shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
                }}>
                  <View style={{
                    width: 40, height: 40, borderRadius: 12, backgroundColor: f.bg,
                    alignItems: "center", justifyContent: "center", marginBottom: 10,
                  }}>
                    <Icon size={20} color={f.color} strokeWidth={2} />
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#0F172A", marginBottom: 4 }}>{f.label}</Text>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: f.color, letterSpacing: 0.5 }}>{f.badge}</Text>
                </View>
              );
            })}
          </View>

          {/* Link CTA */}
          <TouchableOpacity
            onPress={() => hook.setLinkModalVisible(true)}
            activeOpacity={0.85}
            style={{
              backgroundColor: "#6B3AA0", borderRadius: 16, paddingVertical: 16,
              flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
              marginBottom: 12,
            }}
          >
            <UserPlus size={18} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>Link Your Child</Text>
          </TouchableOpacity>

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
                backgroundColor: "#F3F4F6", borderRadius: 12, paddingVertical: 12,
                flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                borderWidth: 1, borderColor: "#E5E7EB", opacity: hook.testLinking ? 0.6 : 1,
              }}
            >
              {hook.testLinking ? (
                <ActivityIndicator size="small" color="#6B7280" />
              ) : null}
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280" }}>
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
              <ActivityIndicator size="large" color="#6B3AA0" />
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
        backgroundColor: "#F0FFFE",
        paddingTop: insets.top,
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
            tintColor="#6B3AA0"
            colors={["#6B3AA0"]}
          />
        }
      >
        {/* Header */}
        <View
          style={{
            backgroundColor: "#6B3AA0",
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
            <ShieldCheck size={18} color="#6B3AA0" strokeWidth={2.5} />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: "#6B3AA0",
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
            <ActivityIcon size={18} color="#6B3AA0" strokeWidth={2.5} />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: "#6B3AA0",
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
