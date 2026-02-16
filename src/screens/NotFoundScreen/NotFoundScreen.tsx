import { Stack } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNotFoundScreen } from "./useNotFoundScreen";

export default function NotFoundScreen() {
  const {
    missingPath,
    availableRoutes,
    handleBack,
    handleNavigate,
    handleCreatePage,
    showCreatePage,
  } = useNotFoundScreen();

  return (
    <>
      <Stack.Screen options={{ title: "Page Not Found", headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#6B3AA0" />
            </TouchableOpacity>
          </View>

          <View style={styles.mainContent}>
            <View style={styles.illustrationContainer}>
              <Text style={styles.emojiLarge} />
              <View style={styles.notFoundBadge}>
                <Text style={styles.notFoundText}>404</Text>
              </View>
            </View>

            <Text style={styles.title}>Oops! Lost CreditKid!</Text>

            <Text style={styles.subtitle}>
              We couldn't find{" "}
              <Text style={styles.pathHighlight}>/{missingPath}</Text>
            </Text>

            <Text style={styles.description}>
              This page seems to have wandered off. But don't worry, we've got
              plenty of other great places for you to explore!
            </Text>

            {showCreatePage && (
              <View style={styles.createPageCard}>
                <View style={styles.createIconContainer}>
                  <Text style={styles.createIcon}>✨</Text>
                </View>
                <View style={styles.createTextContainer}>
                  <Text style={styles.createTitle}>Create This Page</Text>
                  <Text style={styles.createDescription}>
                    Build a new screen at /{missingPath}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleCreatePage}
                  style={styles.createButton}
                >
                  <Text style={styles.createButtonText}>Create</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.routesSection}>
              <View style={styles.routesHeader}>
                <Text style={styles.routesTitle}>📱 Available Screens</Text>
                <Text style={styles.routesSubtitle}>Tap to navigate</Text>
              </View>

              <View style={styles.routesList}>
                {availableRoutes.map((route, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleNavigate(route.path)}
                    style={styles.routeCard}
                    activeOpacity={0.7}
                  >
                    <View style={styles.routeIconContainer}>
                      <Ionicons
                        name="document-text-outline"
                        size={20}
                        color="#6B3AA0"
                      />
                    </View>
                    <Text style={styles.routeTitle} numberOfLines={1}>
                      {route.name}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F0FFFE",
  },
  container: {
    flex: 1,
    backgroundColor: "#F0FFFE",
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  mainContent: {
    flex: 1,
    alignItems: "center",
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  illustrationContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
    position: "relative",
  },
  emojiLarge: {
    fontSize: 120,
    marginBottom: 10,
  },
  notFoundBadge: {
    position: "absolute",
    bottom: 0,
    right: -10,
    backgroundColor: "#6B3AA0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#6B3AA0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  notFoundText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "600",
  },
  pathHighlight: {
    color: "#6B3AA0",
    fontWeight: "800",
  },
  description: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  createPageCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 2,
    borderColor: "#F3E8FF",
  },
  createIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  createIcon: {
    fontSize: 24,
  },
  createTextContainer: {
    flex: 1,
  },
  createTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  createDescription: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  createButton: {
    backgroundColor: "#6B3AA0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  routesSection: {
    width: "100%",
    marginTop: 8,
  },
  routesHeader: {
    marginBottom: 20,
    alignItems: "center",
  },
  routesTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 6,
  },
  routesSubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  routesList: {
    width: "100%",
    gap: 12,
  },
  routeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  routeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  routeTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    textTransform: "capitalize",
  },
});
