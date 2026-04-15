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
import { colors, radius, ambientShadow, fontFamily } from "@/src/theme";

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
              <Ionicons name="arrow-back" size={24} color={colors.primary} />
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
                  <Ionicons name="arrow-forward" size={16} color={colors.onPrimary} />
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
                        color={colors.primary}
                      />
                    </View>
                    <Text style={styles.routeTitle} numberOfLines={1}>
                      {route.name}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.muted} />
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
    backgroundColor: "transparent",
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
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
    backgroundColor: colors.surfaceContainerLowest,
    ...ambientShadow,
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
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  notFoundText: {
    fontSize: 20,
    fontFamily: fontFamily.display,
    color: colors.onPrimary,
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontFamily: fontFamily.display,
    color: colors.onSurface,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    marginBottom: 8,
    fontFamily: fontFamily.title,
  },
  pathHighlight: {
    color: colors.primary,
    fontFamily: fontFamily.title,
  },
  description: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  createPageCard: {
    width: "100%",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    padding: 20,
    marginBottom: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    ...ambientShadow,
    elevation: 4,
  },
  createIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surfaceContainerHigh,
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
    fontFamily: fontFamily.title,
    color: colors.onSurface,
    marginBottom: 4,
  },
  createDescription: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    fontFamily: fontFamily.body,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  createButtonText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontFamily: fontFamily.title,
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
    fontFamily: fontFamily.display,
    color: colors.onSurface,
    marginBottom: 6,
  },
  routesSubtitle: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: fontFamily.title,
  },
  routesList: {
    width: "100%",
    gap: 12,
  },
  routeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: 16,
    gap: 12,
    ...ambientShadow,
    elevation: 2,
  },
  routeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  routeTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: fontFamily.title,
    color: colors.onSurface,
    textTransform: "capitalize",
  },
});
