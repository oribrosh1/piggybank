import { Tabs, Redirect } from "expo-router";
import { Plus, Calendar, User, Home, CreditCard } from "lucide-react-native";
import { View, Platform } from "react-native";
import { useAuth } from "@/src/utils/auth/useAuth";
import { routes } from "@/types/routes";

export default function TabLayout() {
  const { isAuthenticated, isReady } = useAuth();

  // Show nothing while checking auth status
  if (!isReady) {
    return null;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect href={routes.auth.login} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 20,
        },
        tabBarActiveTintColor: "#FBBF24",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? "rgba(251, 191, 36, 0.15)" : "transparent",
                borderRadius: 12,
                padding: 8,
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Home
                color={color}
                size={24}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="banking"
        options={{
          title: "Credit",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? "rgba(251, 191, 36, 0.15)" : "transparent",
                borderRadius: 12,
                padding: 8,
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CreditCard
                color={color}
                size={24}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="create-event"
        options={{
          title: "Create",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? "rgba(251, 191, 36, 0.15)" : "transparent",
                borderRadius: 12,
                padding: 8,
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Plus
                color={color}
                size={24}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="my-events"
        options={{
          title: "Events",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? "rgba(251, 191, 36, 0.15)" : "transparent",
                borderRadius: 12,
                padding: 8,
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Calendar
                color={color}
                size={24}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? "rgba(251, 191, 36, 0.15)" : "transparent",
                borderRadius: 12,
                padding: 8,
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <User
                color={color}
                size={24}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
