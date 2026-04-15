import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useProfileScreen } from "./useProfileScreen";
import AppTabFooter from "@/src/components/AppTabFooter";
import AppTabHeader from "@/src/components/AppTabHeader";
import { colors } from "@/src/theme";

const PURPLE = colors.primary;
const BG = "transparent";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const {
    loading,
    refreshing,
    refresh,
    photoUrl,
    displayName,
    membershipSubtitle,
    guestsInvited,
    guestsWithGiftsBadge,
    totalGiftsUsd,
    giftGoalUsd,
    bankLabel,
    bankVerified,
    spendingLimitLabel,
    userProfile,
    handleSignOut,
    openFaq,
    openTerms,
    openPrivacy,
    goToBankingSetup,
    goToKids,
  } = useProfileScreen();

  const appVersion =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "1.0.0";
  const securityLevel =
    userProfile?.stripeAccountCreated && userProfile?.verificationStatus === "verified"
      ? "High"
      : userProfile?.stripeAccountCreated
        ? "High"
        : "Standard";

  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, paddingTop: insets.top }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={PURPLE} />
        </View>
        <AppTabFooter />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView
        style={{ backgroundColor: "transparent" }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 32,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={PURPLE}
          />
        }
      >
        <AppTabHeader />

        {/* Hero avatar + name */}
        <View style={{ alignItems: "center", paddingHorizontal: 20, marginBottom: 24 }}>
          <View style={{ marginBottom: 16 }}>
            <View
              style={{
                width: 104,
                height: 104,
                borderRadius: 52,
                backgroundColor: "#E9D5FF",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {photoUrl ? (
                <Image
                  source={{ uri: photoUrl }}
                  style={{ width: 104, height: 104 }}
                />
              ) : (
                <Text style={{ fontSize: 40, fontWeight: "800", color: PURPLE }}>
                  {initial}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() =>
                Alert.alert("Edit photo", "Profile photo editing coming soon.")
              }
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: PURPLE,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 3,
                borderColor: "#FFF",
              }}
            >
              <Ionicons name="pencil" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text
            style={{
              fontSize: 26,
              fontWeight: "800",
              color: "#111827",
              marginBottom: 4,
            }}
          >
            {displayName}
          </Text>
          <Text style={{ fontSize: 15, color: "#6B7280", fontWeight: "500" }}>
            {membershipSubtitle}
          </Text>
        </View>

        {/* Stats grid */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 20,
            gap: 12,
            marginBottom: 28,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "#FFF",
              borderRadius: 20,
              padding: 16,
              borderLeftWidth: 4,
              borderLeftColor: PURPLE,
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                color: "#9CA3AF",
                letterSpacing: 0.8,
                marginBottom: 8,
              }}
            >
              GUESTS INVITED
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 28, fontWeight: "900", color: PURPLE }}>
                {guestsInvited}
              </Text>
              {guestsWithGiftsBadge > 0 && (
                <View
                  style={{
                    backgroundColor: "#D1FAE5",
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 10,
                  }}
                >
                  <Text
                    style={{ fontSize: 12, fontWeight: "800", color: "#059669" }}
                  >
                    +{guestsWithGiftsBadge}
                  </Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 12, color: "#9CA3AF", marginTop: 8 }}>
              Current Event
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: "#F5F3FF",
              borderRadius: 20,
              padding: 16,
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                color: "#9CA3AF",
                letterSpacing: 0.8,
                marginBottom: 8,
              }}
            >
              TOTAL GIFTS
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ fontSize: 28, fontWeight: "900", color: "#111827" }}>
                {guestsWithGiftsBadge}
              </Text>
              <Ionicons name="gift" size={22} color={PURPLE} />
            </View>
          </View>
        </View>

        {/* Preferences */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#111827" }}>
              Preferences
            </Text>
            <Text style={{ fontSize: 12, fontWeight: "600", color: PURPLE }}>
              Security Level: {securityLevel}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: "#FFF",
              borderRadius: 20,
              overflow: "hidden",
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <PrefRow
              icon={<Ionicons name="notifications" size={20} color={PURPLE} />}
              iconBg="#F3E8FF"
              title="Notification Prefs"
              subtitle="Real-time alerts & news"
              onPress={() =>
                Alert.alert("Notifications", "Notification settings open here soon.")
              }
            />
            <PrefRow
              icon={<Ionicons name="lock-closed" size={20} color="#059669" />}
              iconBg="#D1FAE5"
              title="Privacy"
              subtitle="Visibility & data control"
              onPress={openPrivacy}
            />
            <PrefRow
              icon={<MaterialIcons name="account-balance" size={20} color="#92400E" />}
              iconBg="#FEF3C7"
              title="Linked Bank"
              subtitle={
                bankLabel ?? "Connect your bank in the Card tab"
              }
              badge={
                bankVerified ? (
                  <View
                    style={{
                      backgroundColor: "#D1FAE5",
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "800",
                        color: "#059669",
                      }}
                    >
                      VERIFIED
                    </Text>
                  </View>
                ) : null
              }
              onPress={goToBankingSetup}
            />
            <PrefRow
              icon={<MaterialIcons name="speed" size={20} color={PURPLE} />}
              iconBg="#F3E8FF"
              title="Default Spending Limits"
              subtitle={spendingLimitLabel}
              onPress={goToKids}
              last
            />
          </View>
        </View>

        {/* Support */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "800",
              color: "#111827",
              marginBottom: 12,
            }}
          >
            Support
          </Text>
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
            <TouchableOpacity
              onPress={openFaq}
              style={{
                flex: 1,
                backgroundColor: "#FFF",
                borderRadius: 16,
                paddingVertical: 20,
                alignItems: "center",
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <Ionicons name="help-circle" size={28} color={PURPLE} />
              <Text
                style={{ marginTop: 8, fontSize: 14, fontWeight: "700", color: "#374151" }}
              >
                FAQ
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={openTerms}
              style={{
                flex: 1,
                backgroundColor: "#FFF",
                borderRadius: 16,
                paddingVertical: 20,
                alignItems: "center",
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <Ionicons name="document-text" size={28} color={PURPLE} />
              <Text
                style={{ marginTop: 8, fontSize: 14, fontWeight: "700", color: "#374151" }}
              >
                Terms
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleSignOut}
            style={{
              backgroundColor: "#FFF",
              borderRadius: 16,
              paddingVertical: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <Ionicons name="log-out-outline" size={22} color="#DC2626" />
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#DC2626" }}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>

        <AppTabFooter style={{ marginTop: 8 }} />

        <Text
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "#9CA3AF",
            fontWeight: "600",
            letterSpacing: 0.5,
          }}
        >
          CREDITKID V{appVersion}
        </Text>
        <Text
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "#D1D5DB",
            fontStyle: "italic",
            marginTop: 4,
          }}
        >
          Made with care for your financial future.
        </Text>
      </ScrollView>
    </View>
  );
}

function PrefRow({
  icon,
  iconBg,
  title,
  subtitle,
  onPress,
  badge,
  last,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  badge?: React.ReactNode;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: "#F3F4F6",
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: iconBg,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827" }}>
          {title}
        </Text>
        <Text
          style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>
      {badge}
      <Ionicons name="chevron-forward" size={20} color="#D1D5DB" style={{ marginLeft: 8 }} />
    </TouchableOpacity>
  );
}
