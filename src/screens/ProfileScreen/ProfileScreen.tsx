import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import AppTabFooter from "@/src/components/AppTabFooter";
import AppTabHeader from "@/src/components/AppTabHeader";
import { colors, fontFamily, primaryGradient, radius, spacing, typography } from "@/src/theme";
import { useProfileScreen } from "./useProfileScreen";

const BG = "transparent";
const PURPLE = colors.primary;
const PROFILE_GLASS_BORDER = "rgba(107, 56, 212, 0.12)";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const {
    loading,
    refreshing,
    refresh,
    photoUrl,
    displayName,
    membershipSubtitle,
    bankLabel,
    bankVerified,
    spendingLimitLabel,
    primaryEvent,
    showGiftAmountsBeforeEvent,
    userProfile,
    handleSignOut,
    openFaq,
    openTerms,
    openPrivacy,
    goToBankingSetup,
    goToKids,
    goToEditChildName,
    unlinkChildProfile,
    setShowGiftAmountsBeforeEvent,
  } = useProfileScreen();

  const appVersion = Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "1.0.0";
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";
  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={PURPLE} />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
        <AppTabFooter />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingHorizontal: spacing[5],
          paddingTop: insets.top + spacing[3],
          paddingBottom: insets.bottom + spacing[8],
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={PURPLE} />
        }
      >
        <AppTabHeader />

        <Text style={styles.pageTitle}>Settings</Text>
        <Text style={styles.pageSubtitle}>
          Manage your family profile, payout setup, privacy, and support.
        </Text>

        <LinearGradient
          {...primaryGradient}
          style={styles.heroCard}
        >
          <View style={styles.heroGlow} pointerEvents="none" />
          <View style={styles.profileRow}>
            <View style={styles.avatarOuter}>
              <View style={styles.avatar}>
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.avatarImage} resizeMode="cover" />
                ) : (
                  <Text style={styles.avatarInitial}>{initial}</Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => Alert.alert("Edit photo", "Profile photo editing coming soon.")}
                style={styles.editAvatarBtn}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel="Edit profile photo"
              >
                <Ionicons name="pencil" size={14} color={colors.onPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.profileCopy}>
              <Text style={styles.profileName} numberOfLines={1}>{displayName}</Text>
              <Text style={styles.membershipText}>{membershipSubtitle}</Text>
            </View>
          </View>
        </LinearGradient>

        <SettingsSection title="Family">
          <SettingsRow
            icon={<Ionicons name="person" size={20} color={PURPLE} />}
            iconBg="rgba(107, 56, 212, 0.1)"
            title="Change Child's Name"
            subtitle={primaryEvent?.childName?.trim() || "Update the name shown across event and child pages"}
            onPress={goToEditChildName}
          />
          <SettingsRow
            icon={<Ionicons name="unlink" size={20} color="#DC2626" />}
            iconBg="#FEF2F2"
            title="Unlink Child Profile"
            subtitle={(userProfile?.childIds?.length ?? 0) > 0 ? "Remove child profile connection" : "No linked child profile yet"}
            onPress={unlinkChildProfile}
          />
          <SettingsToggleRow
            icon={<Ionicons name="gift" size={20} color="#059669" />}
            iconBg="#D1FAE5"
            title="Show Gift Amounts Before The Big Day"
            subtitle="Let parents see gift totals before the event date"
            value={showGiftAmountsBeforeEvent}
            onValueChange={setShowGiftAmountsBeforeEvent}
            last
          />
        </SettingsSection>

        <SettingsSection title="Account">
          <SettingsRow
            icon={<Ionicons name="notifications" size={20} color={PURPLE} />}
            iconBg="rgba(107, 56, 212, 0.1)"
            title="Notifications"
            subtitle="Real-time event, gift, and activity alerts"
            onPress={() => Alert.alert("Notifications", "Notification settings open here soon.")}
          />
          <SettingsRow
            icon={<Ionicons name="lock-closed" size={20} color="#059669" />}
            iconBg="#D1FAE5"
            title="Privacy"
            subtitle="Visibility, data control, and permissions"
            onPress={openPrivacy}
          />
          <SettingsRow
            icon={<MaterialIcons name="account-balance" size={20} color="#92400E" />}
            iconBg="#FEF3C7"
            title="Linked Bank"
            subtitle={bankLabel ?? "Connect your bank to receive payouts"}
            badge={bankVerified ? "VERIFIED" : undefined}
            onPress={goToBankingSetup}
          />
          <SettingsRow
            icon={<MaterialIcons name="speed" size={20} color={PURPLE} />}
            iconBg="rgba(107, 56, 212, 0.1)"
            title="Spending Limits"
            subtitle={spendingLimitLabel}
            onPress={goToKids}
            last
          />
        </SettingsSection>

        <View style={styles.supportGrid}>
          <SupportTile
            icon={<Ionicons name="help-circle" size={26} color={PURPLE} />}
            title="FAQ"
            subtitle="Get answers"
            onPress={openFaq}
          />
          <SupportTile
            icon={<Ionicons name="document-text" size={26} color={PURPLE} />}
            title="Terms"
            subtitle="Legal details"
            onPress={openTerms}
          />
        </View>

        <TouchableOpacity
          onPress={handleSignOut}
          activeOpacity={0.86}
          style={styles.signOutBtn}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Ionicons name="log-out-outline" size={21} color="#DC2626" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.versionWrap}>
          <Text style={styles.versionText}>CREDITKID V{appVersion}</Text>
          <Text style={styles.versionSubtext}>Made with care for your financial future.</Text>
        </View>

        <AppTabFooter style={{ marginTop: spacing[3] }} />
      </ScrollView>
    </View>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.settingsCard}>{children}</View>
    </View>
  );
}

function SettingsRow({
  icon,
  iconBg,
  title,
  subtitle,
  onPress,
  badge,
  last,
}: {
  icon: ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  badge?: string;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.78}
      style={[styles.settingsRow, last && styles.settingsRowLast]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[styles.settingsIcon, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <View style={styles.settingsCopy}>
        <Text style={styles.settingsTitle}>{title}</Text>
        <Text style={styles.settingsSubtitle} numberOfLines={1}>{subtitle}</Text>
      </View>
      {badge ? (
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedBadgeText}>{badge}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </TouchableOpacity>
  );
}

function SettingsToggleRow({
  icon,
  iconBg,
  title,
  subtitle,
  value,
  onValueChange,
  last,
}: {
  icon: ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.settingsRow, last && styles.settingsRowLast]}>
      <View style={[styles.settingsIcon, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <View style={styles.settingsCopy}>
        <Text style={styles.settingsTitle}>{title}</Text>
        <Text style={styles.settingsSubtitle} numberOfLines={2}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.surfaceContainerHigh, true: "rgba(107, 56, 212, 0.32)" }}
        thumbColor={value ? PURPLE : colors.surfaceContainerLowest}
        ios_backgroundColor={colors.surfaceContainerHigh}
      />
    </View>
  );
}

function SupportTile({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.84}
      style={styles.supportTile}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.supportIcon}>{icon}</View>
      <Text style={styles.supportTitle}>{title}</Text>
      <Text style={styles.supportSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: spacing[4],
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
  },
  pageTitle: {
    fontFamily: fontFamily.display,
    fontSize: 34,
    fontWeight: "900",
    color: colors.onSurface,
    letterSpacing: -0.8,
    marginTop: spacing[1],
  },
  pageSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.onSurfaceVariant,
    marginTop: spacing[1],
    marginBottom: spacing[4],
  },
  heroCard: {
    borderRadius: radius.lg,
    padding: spacing[5],
    overflow: "hidden",
    marginBottom: spacing[4],
    ...Platform.select({
      ios: {
        shadowColor: PURPLE,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.22,
        shadowRadius: 22,
      },
      android: { elevation: 8 },
    }),
  },
  heroGlow: {
    position: "absolute",
    right: -45,
    top: -45,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
  },
  avatarOuter: {
    position: "relative",
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 82,
    height: 82,
  },
  avatarInitial: {
    fontFamily: fontFamily.display,
    fontSize: 34,
    fontWeight: "900",
    color: colors.onPrimary,
  },
  editAvatarBtn: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    fontFamily: fontFamily.headline,
    fontSize: 23,
    fontWeight: "900",
    color: colors.onPrimary,
    letterSpacing: -0.4,
  },
  membershipText: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    color: "rgba(255,255,255,0.82)",
    marginTop: 3,
  },
  sectionWrap: {
    marginBottom: spacing[5],
  },
  sectionTitle: {
    fontFamily: fontFamily.headline,
    fontSize: 18,
    fontWeight: "900",
    color: colors.onSurface,
    marginBottom: spacing[3],
  },
  settingsCard: {
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: PROFILE_GLASS_BORDER,
    overflow: "hidden",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(107, 56, 212, 0.12)",
  },
  settingsRowLast: {
    borderBottomWidth: 0,
  },
  settingsIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing[3],
  },
  settingsCopy: {
    flex: 1,
    minWidth: 0,
  },
  settingsTitle: {
    fontFamily: fontFamily.headline,
    fontSize: 15,
    fontWeight: "800",
    color: colors.onSurface,
  },
  settingsSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  verifiedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#D1FAE5",
    marginLeft: spacing[2],
  },
  verifiedBadgeText: {
    fontFamily: fontFamily.label,
    fontSize: 9,
    fontWeight: "900",
    color: "#059669",
  },
  supportGrid: {
    flexDirection: "row",
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  supportTile: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing[4],
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: PROFILE_GLASS_BORDER,
  },
  supportIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(107, 56, 212, 0.1)",
    marginBottom: spacing[2],
  },
  supportTitle: {
    fontFamily: fontFamily.headline,
    fontSize: 15,
    fontWeight: "800",
    color: colors.onSurface,
  },
  supportSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    paddingVertical: 15,
    borderRadius: radius.md,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: spacing[5],
  },
  signOutText: {
    fontFamily: fontFamily.headline,
    fontSize: 16,
    fontWeight: "900",
    color: "#DC2626",
  },
  versionWrap: {
    alignItems: "center",
    marginBottom: spacing[2],
  },
  versionText: {
    fontFamily: fontFamily.label,
    fontSize: 11,
    fontWeight: "800",
    color: colors.onSurfaceVariant,
    letterSpacing: 0.6,
  },
  versionSubtext: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    color: colors.muted,
    marginTop: 4,
    fontStyle: "italic",
  },
});
