import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronRight, LogOut } from "lucide-react-native";
import firebase from "../../src/firebase";
import * as SecureStore from "expo-secure-store";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              // Sign out from Firebase
              await firebase.auth().signOut();

              // Clear stored credentials from SecureStore
              await SecureStore.deleteItemAsync("userEmail");
              await SecureStore.deleteItemAsync("userPassword");

              // Navigate to login screen
              router.replace("/login" as any);
            } catch (error: any) {
              console.error("Logout error:", error);
              Alert.alert(
                "Error",
                "Failed to sign out. Please try again.",
                [{ text: "OK" }]
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: "#F0FFFE", paddingTop: insets.top }}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 24,
          backgroundColor: "#6B3AA0",
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
        }}
      >
        <Text
          style={{
            fontSize: 32,
            fontWeight: "900",
            color: "#FFFFFF",
            marginBottom: 4,
          }}
        >
          PROFILE 👤
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.9)",
            fontWeight: "600",
          }}
        >
          Your account & settings
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 20,
            padding: 20,
            alignItems: "center",
            marginBottom: 24,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 3,
          }}
        >
          <Text style={{ fontSize: 64, marginBottom: 12 }}>👋</Text>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "900",
              color: "#1F2937",
              marginBottom: 4,
              textAlign: "center",
            }}
          >
            Hello! 🎉
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: "#9CA3AF",
              fontWeight: "600",
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            Signed in with Apple ID
          </Text>
          <View
            style={{
              backgroundColor: "#F3E8FF",
              borderRadius: 12,
              paddingVertical: 8,
              paddingHorizontal: 16,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#6B3AA0" }}>
              user@apple.com
            </Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={{ marginBottom: 24, gap: 12 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "900",
              color: "#6B3AA0",
              letterSpacing: 0.3,
            }}
          >
            YOUR STATS 📊
          </Text>

          <View
            style={{
              flexDirection: "row",
              gap: 12,
            }}
          >
            {/* Total Events */}
            <View
              style={{
                flex: 1,
                backgroundColor: "#D1F3EE",
                borderRadius: 16,
                padding: 16,
                alignItems: "center",
                borderLeftWidth: 4,
                borderLeftColor: "#06D6A0",
              }}
            >
              <Text style={{ fontSize: 32, marginBottom: 4 }}>📅</Text>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "900",
                  color: "#06D6A0",
                  marginBottom: 2,
                }}
              >
                3
              </Text>
              <Text
                style={{ fontSize: 11, fontWeight: "600", color: "#4D8D82" }}
              >
                Events Created
              </Text>
            </View>

            {/* Total Guests */}
            <View
              style={{
                flex: 1,
                backgroundColor: "#F3E8FF",
                borderRadius: 16,
                padding: 16,
                alignItems: "center",
                borderLeftWidth: 4,
                borderLeftColor: "#6B3AA0",
              }}
            >
              <Text style={{ fontSize: 32, marginBottom: 4 }}>👥</Text>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "900",
                  color: "#6B3AA0",
                  marginBottom: 2,
                }}
              >
                86
              </Text>
              <Text
                style={{ fontSize: 11, fontWeight: "600", color: "#7C3AED" }}
              >
                Total Guests
              </Text>
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "900",
              color: "#6B3AA0",
              marginBottom: 12,
              letterSpacing: 0.3,
            }}
          >
            SETTINGS ⚙️
          </Text>

          <View style={{ gap: 8 }}>
            {/* Notifications */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 14,
                padding: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderLeftWidth: 4,
                borderLeftColor: "#06D6A0",
                shadowColor: "#000",
                shadowOpacity: 0.04,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  flex: 1,
                }}
              >
                <Text style={{ fontSize: 20 }}>🔔</Text>
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "800",
                      color: "#1F2937",
                    }}
                  >
                    Notifications
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: "#9CA3AF",
                      fontWeight: "500",
                      marginTop: 2,
                    }}
                  >
                    Get updates on responses
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#D1D5DB" />
            </TouchableOpacity>

            {/* Privacy */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 14,
                padding: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderLeftWidth: 4,
                borderLeftColor: "#6B3AA0",
                shadowColor: "#000",
                shadowOpacity: 0.04,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  flex: 1,
                }}
              >
                <Text style={{ fontSize: 20 }}>🔒</Text>
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "800",
                      color: "#1F2937",
                    }}
                  >
                    Privacy & Security
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: "#9CA3AF",
                      fontWeight: "500",
                      marginTop: 2,
                    }}
                  >
                    Manage your data
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#D1D5DB" />
            </TouchableOpacity>

            {/* Help */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 14,
                padding: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderLeftWidth: 4,
                borderLeftColor: "#FBBF24",
                shadowColor: "#000",
                shadowOpacity: 0.04,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  flex: 1,
                }}
              >
                <Text style={{ fontSize: 20 }}>❓</Text>
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "800",
                      color: "#1F2937",
                    }}
                  >
                    Help & Support
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: "#9CA3AF",
                      fontWeight: "500",
                      marginTop: 2,
                    }}
                  >
                    Got a question?
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#D1D5DB" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.85}
          style={{
            backgroundColor: "#FEE2E2",
            borderRadius: 14,
            paddingVertical: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            marginBottom: 70,
          }}
        >
          <LogOut size={18} color="#DC2626" />
          <Text style={{ fontSize: 15, fontWeight: "800", color: "#DC2626" }}>
            SIGN OUT
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
