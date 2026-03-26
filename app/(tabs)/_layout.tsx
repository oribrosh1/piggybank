import { Tabs, Redirect } from "expo-router";
import { View, Platform } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "@/src/utils/auth/useAuth";
import { routes } from "@/types/routes";

export default function TabLayout() {
  const { isAuthenticated, isReady } = useAuth();

  if (!isReady) {
    return null;
  }

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
          height: Platform.OS === "ios" ? 90 : 70,
          paddingBottom: Platform.OS === "ios" ? 20 : 8,
          paddingTop: 8,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 20,
        },
        tabBarActiveTintColor: "#7C3AED",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          marginTop: 2,
          letterSpacing: 0.3,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "HOME",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={focused ? "grid" : "grid-outline"}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="my-event"
        options={{
          title: "MY EVENT",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={focused ? "calendar" : "calendar-outline"}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="gifts"
        options={{
          title: "GIFTS",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={focused ? "gift" : "gift-outline"}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="kids"
        options={{
          title: "MY CHILD",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={focused ? "happy" : "happy-outline"}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "PROFILE",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={focused ? "settings" : "settings-outline"}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({
  icon,
  color,
  focused,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  focused: boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: focused ? "rgba(124, 58, 237, 0.12)" : "transparent",
        borderRadius: 12,
        padding: 8,
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={icon} size={22} color={color} />
    </View>
  );
}
