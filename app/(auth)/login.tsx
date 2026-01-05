import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
  Platform,
  Modal,
} from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Apple } from "lucide-react-native";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import * as AppleAuthentication from 'expo-apple-authentication';
import firebase from "../../src/firebase";
import { LinearGradient } from 'expo-linear-gradient';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { routes } from "../../types/routes";
import { initializeUserProfile } from '../../src/lib/userService';

// Import GoogleAuthProvider based on platform
const GoogleAuthProvider = Platform.OS === 'web'
  ? require('firebase/auth').GoogleAuthProvider
  : require('@react-native-firebase/auth').firebase.auth.GoogleAuthProvider;

// Import AppleAuthProvider based on platform
const AppleAuthProvider = Platform.OS === 'web'
  ? require('firebase/auth').OAuthProvider
  : require('@react-native-firebase/auth').firebase.auth.AppleAuthProvider;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = Dimensions.get("window");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [biometricType, setBiometricType] = useState<LocalAuthentication.AuthenticationType | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Animation values
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;

  // Check biometric availability and configure Google Sign-In
  useEffect(() => {
    checkBiometricSupport();
    configureGoogleSignIn();
  }, []);

  async function configureGoogleSignIn() {
    try {
      GoogleSignin.configure({
        webClientId: '507312069438-vbv4is81o3kn1qbcljabtg56vbvn4mdd.apps.googleusercontent.com', // From google-services.json
        offlineAccess: true,
      });
    } catch (error) {
      console.log('Error configuring Google Sign-In:', error);
    }
  }

  // Start animations
  useEffect(() => {
    // Bounce animation for emoji
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Float animation 1
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim1, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Float animation 2
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim2, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [bounceAnim, floatAnim1, floatAnim2]);

  async function checkBiometricSupport() {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      setHasBiometrics(compatible && enrolled);

      // Determine biometric type
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType(LocalAuthentication.AuthenticationType.FINGERPRINT);
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        setBiometricType(LocalAuthentication.AuthenticationType.IRIS);
      }
    } catch (error) {
      console.log('Error checking biometric support:', error);
    }
  }

  async function handleBiometricAuth() {
    setIsAuthenticating(true);

    try {
      // Check if user has saved credentials
      const savedEmail = await SecureStore.getItemAsync('userEmail');
      const savedPassword = await SecureStore.getItemAsync('userPassword');

      if (!savedEmail || !savedPassword) {
        // No saved credentials, redirect to email/password signup
        Alert.alert(
          'First Time Sign In',
          'Please sign in with email and password first to enable biometric authentication.',
          [
            {
              text: 'Sign In with Email',
              onPress: () => router.push(routes.auth.emailSignin)
            }
          ]
        );
        setIsAuthenticating(false);
        return;
      }

      // Check if biometrics are available
      if (!hasBiometrics) {
        Alert.alert(
          'Biometric Not Available',
          'Please set up Face ID or Touch ID in your device settings, or sign in with email and password.',
          [
            {
              text: 'Sign In with Email',
              onPress: () => router.push(routes.auth.emailSignin)
            }
          ]
        );
        setIsAuthenticating(false);
        return;
      }

      // Perform biometric authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to sign in',
        fallbackLabel: 'Use Email & Password',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        // Biometric auth successful, sign in with Firebase
        try {
          const userCredential = await firebase.auth().signInWithEmailAndPassword(savedEmail, savedPassword);
          router.replace(routes.tabs.home);
        } catch (firebaseErr: any) {
          console.log('❌ Login: Firebase sign in error:', firebaseErr);
          console.log('   - Error code:', firebaseErr.code);
          console.log('   - Error message:', firebaseErr.message);
          Alert.alert(
            'Sign In Failed',
            'Your credentials may have expired. Please sign in again.',
            [
              {
                text: 'Sign In with Email',
                onPress: () => router.push(routes.auth.emailSignin)
              }
            ]
          );
        }
      } else {
        // Biometric auth failed
        Alert.alert(
          'Authentication Failed',
          result.error || 'Please try again or sign in with email and password.',
          [
            {
              text: 'Try Again',
              onPress: handleBiometricAuth
            },
            {
              text: 'Use Email',
              onPress: () => router.push(routes.auth.emailSignin)
            }
          ]
        );
      }
    } catch (error) {
      console.log('Authentication error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  }

  const bounceTranslate = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const floatTranslate1 = floatAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 15],
  });

  const floatTranslate2 = floatAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const handleAppleSignIn = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Not Available', 'Apple Sign In is only available on iOS devices');
      return;
    }

    setIsAuthenticating(true);
    try {
      console.log('🍎 Starting Apple Sign In...');

      // Check if Apple Sign In is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      console.log('Apple Sign In available:', isAvailable);

      if (!isAvailable) {
        Alert.alert('Not Available', 'Apple Sign In is not available on this device');
        setIsAuthenticating(false);
        return;
      }

      // Start Apple Sign In
      console.log('Requesting Apple credentials...');
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('✅ Apple credentials received:', {
        user: appleCredential.user,
        email: appleCredential.email,
        fullName: appleCredential.fullName
      });

      // Create Firebase credential
      const { identityToken, fullName, email } = appleCredential;

      if (!identityToken) {
        throw new Error('No identity token received from Apple');
      }

      // Sign in with Firebase using the Apple credential
      console.log('Signing in with Firebase...');

      // For native, use AppleAuthProvider.credential
      const firebaseCredential = Platform.OS === 'ios'
        ? AppleAuthProvider.credential(identityToken)
        : new AppleAuthProvider().credential({ idToken: identityToken });

      const userCredential = await firebase.auth().signInWithCredential(firebaseCredential);
      console.log('✅ Firebase sign in successful:', userCredential.user.uid);

      // Check if this is a new user - if so, initialize profile
      if (userCredential.additionalUserInfo?.isNewUser) {
        console.log('🆕 New Apple user - initializing profile...');
        await initializeUserProfile(userCredential, {
          fullName: fullName
            ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim()
            : email?.split('@')[0] || 'Apple User',
        });
        console.log('✅ Profile initialized');
      }

      // Success - navigate to home
      console.log('✅ Navigating to home...');
      router.replace(routes.tabs.home);
    } catch (error: any) {
      console.log('❌ Apple Sign In error:', error);
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);

      if (error.code === 'ERR_REQUEST_CANCELED' || error.code === 'ERR_CANCELED') {
        // User canceled the sign-in flow - don't show error
        console.log('ℹ️ User canceled Apple Sign In');
      } else {
        // Only show alert for real errors
        Alert.alert(
          'Sign In Failed',
          error.message || 'Failed to sign in with Apple. Please try again.'
        );
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignIn = () => {
    const isDevMode = process.env.EXPO_PUBLIC_ENV === "dev";

    if (isDevMode) {
      // Dev mode: skip authentication for testing
      router.replace(routes.tabs.home);
    } else {
      // Production mode: use biometric authentication
      handleBiometricAuth();
    }
  };

  const handleEmailSignIn = () => {
    // Navigate to email/password sign in screen
    router.push(routes.auth.emailSignin);
  };

  const handleSignUp = () => {
    // Navigate to sign up screen
    router.push(routes.auth.signup);
  };

  async function handleGoogleSignIn() {
    setIsAuthenticating(true);
    try {
      // Check if device supports Google Play services
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Get users ID token
      const { data } = await GoogleSignin.signIn();
      const idToken = data?.idToken;
      if (!idToken) {
        throw new Error('No ID token found');
      }

      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      const userCredential = await firebase.auth().signInWithCredential(googleCredential);


      router.replace(routes.tabs.home);
    } catch (err: any) {
      console.log('❌ Google Sign-In error:', err);

      if (err.code === 'sign_in_cancelled') {
        Alert.alert('Cancelled', 'Google Sign-In was cancelled');
      } else if (err.code === 'in_progress') {
        Alert.alert('In Progress', 'Sign in already in progress');
      } else if (err.code === 'play_services_not_available') {
        Alert.alert('Error', 'Google Play Services not available');
      } else {
        Alert.alert('Sign In Failed', err.message || 'Something went wrong');
      }
    } finally {
      setIsAuthenticating(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF" }}>
      {/* Gradient Background with floating elements */}
      <LinearGradient
        colors={['#FBBF24', '#F59E0B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
      />

      {/* Floating decorative elements - Spheres and Stars */}
      {/* Top left yellow sphere */}
      <Animated.View
        style={{
          position: "absolute",
          top: 60,
          left: 30,
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: "#FCD34D",
          opacity: 0.9,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 8,
        }}
      >
        <View
          style={{
            position: "absolute",
            top: 5,
            left: 8,
            width: 15,
            height: 15,
            borderRadius: 7.5,
            backgroundColor: "rgba(255,255,255,0.4)",
          }}
        />
      </Animated.View>

      {/* Top center blue sphere */}
      <Animated.View
        style={{
          position: "absolute",
          top: 80,
          right: 80,
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: "#60A5FA",
          opacity: 0.95,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 6,
        }}
      >
        <View
          style={{
            position: "absolute",
            top: 3,
            left: 5,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: "rgba(255,255,255,0.35)",
          }}
        />
      </Animated.View>

      {/* Top right outline star */}
      <View
        style={{
          position: "absolute",
          top: 120,
          right: 40,
        }}
      >
        <Text style={{ fontSize: 40 }}>⭐</Text>
      </View>

      {/* Mid left small yellow sphere */}
      <Animated.View
        style={{
          position: "absolute",
          top: 200,
          left: 20,
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: "#FCD34D",
          opacity: 0.85,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 5,
        }}
      >
        <View
          style={{
            position: "absolute",
            top: 2,
            left: 4,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: "rgba(255,255,255,0.3)",
          }}
        />
      </Animated.View>

      {/* Mid right pink star outline */}
      <View
        style={{
          position: "absolute",
          top: 240,
          right: 50,
        }}
      >
        <Text style={{ fontSize: 32 }}>⭐</Text>
      </View>

      {/* Center left outline star */}
      {/* <View
        style={{
          position: "absolute",
          top: 280,
          left: 60,
        }}
      >
        <Text style={{ fontSize: 36 }}>☆</Text>
      </View> */}

      {/* Bottom left yellow sphere */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: 220,
          left: 40,
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: "#FCD34D",
          opacity: 0.8,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 6,
        }}
      >
        <View
          style={{
            position: "absolute",
            top: 3,
            left: 6,
            width: 11,
            height: 11,
            borderRadius: 5.5,
            backgroundColor: "rgba(255,255,255,0.35)",
          }}
        />
      </Animated.View>

      {/* Right side outline star */}
      {/* <View
        style={{
          position: "absolute",
          bottom: 180,
          right: 30,
        }}
      >
        <Text style={{ fontSize: 40 }}>☆</Text>
      </View> */}

      {/* Bottom right yellow sphere */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: 140,
          right: 20,
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: "#FCD34D",
          opacity: 0.9,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 8,
        }}
      >
        <View
          style={{
            position: "absolute",
            top: 4,
            left: 7,
            width: 13,
            height: 13,
            borderRadius: 6.5,
            backgroundColor: "rgba(255,255,255,0.4)",
          }}
        />
      </Animated.View>

      {/* Floating decorative elements */}
      <Animated.View
        style={{
          position: "absolute",
          top: 160,
          right: 20,
          transform: [{ translateY: floatTranslate1 }],
        }}
      >
        <Text style={{ fontSize: 60 }}>🎈</Text>
      </Animated.View>

      <Animated.View
        style={{
          position: "absolute",
          top: 250,
          left: 30,
          transform: [{ translateY: floatTranslate2 }],
        }}
      >
        <Text style={{ fontSize: 50 }}>✨</Text>
      </Animated.View>

      <Animated.View
        style={{
          position: "absolute",
          top: 150,
          left: 40,
          opacity: 0.6,
        }}
      >
        <Text style={{ fontSize: 40 }}>🎊</Text>
      </Animated.View>

      <Animated.View
        style={{
          position: "absolute",
          bottom: 200,
          right: 30,
          opacity: 0.5,
        }}
      >
        <Text style={{ fontSize: 45 }}>🎉</Text>
      </Animated.View>

      <ScrollView
        style={{ flex: 1, zIndex: 10 }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 20,
          // paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Logo Section */}
        <View style={{ alignItems: "center", marginBottom: 20, marginTop: 40 }}>
          <Animated.View
            style={{ transform: [{ translateY: bounceTranslate }] }}
          >
            <Text
              style={{ fontSize: 80, marginBottom: 20, marginTop: 40, textAlign: "center" }}
            >
              🎉
            </Text>
          </Animated.View>

          <Text
            style={{
              fontSize: 48,
              fontWeight: "900",
              color: "#FFFFFF",
              marginBottom: 8,
              textAlign: "center",
              letterSpacing: -1,
            }}
          >
            EVENT
          </Text>
          <Text
            style={{
              fontSize: 48,
              fontWeight: "900",
              color: "#FFFFFF",
              marginBottom: 20,
              textAlign: "center",
              letterSpacing: -1,
            }}
          >
            CREATOR
          </Text>

          <View
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.25)",
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 20,
              marginBottom: 24,
              borderWidth: 2,
              borderColor: "rgba(255, 255, 255, 0.4)",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: "#FFFFFF",
                fontWeight: "700",
                textAlign: "center",
                letterSpacing: 0.5,
              }}
            >
              ✨ MAKE MAGIC HAPPEN ✨
            </Text>
          </View>

          <Text
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,0.95)",
              fontWeight: "600",
              textAlign: "center",
              lineHeight: 26,
            }}
          >
            Create unforgettable events and invite your closest friends
          </Text>
        </View>

        {/* Features Grid */}
        <View
          style={{
            marginBottom: 20,
            gap: 12,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: 16,
              padding: 14,
              gap: 12,
              borderWidth: 1.5,
              borderColor: "rgba(255, 255, 255, 0.3)",
            }}
          >
            <Text style={{ fontSize: 26 }}>🎂</Text>
            <View style={{ flex: 1, justifyContent: "center" }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "800",
                  color: "#FFFFFF",
                  marginBottom: 2,
                }}
              >
                Birthdays & Bar Mitzvahs
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: "rgba(255, 255, 255, 0.8)",
                  fontWeight: "500",
                }}
              >
                Pick your vibe
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: 16,
              padding: 14,
              gap: 12,
              borderWidth: 1.5,
              borderColor: "rgba(255, 255, 255, 0.3)",
            }}
          >
            <Text style={{ fontSize: 26 }}>👥</Text>
            <View style={{ flex: 1, justifyContent: "center" }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "800",
                  color: "#FFFFFF",
                  marginBottom: 2,
                }}
              >
                Invite Everyone
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: "rgba(255, 255, 255, 0.8)",
                  fontWeight: "500",
                }}
              >
                All your contacts at once
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: 16,
              padding: 14,
              gap: 12,
              borderWidth: 1.5,
              borderColor: "rgba(255, 255, 255, 0.3)",
            }}
          >
            <Text style={{ fontSize: 26 }}>📍</Text>
            <View style={{ flex: 1, justifyContent: "center" }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "800",
                  color: "#FFFFFF",
                  marginBottom: 2,
                }}
              >
                Share Your Location
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: "rgba(255, 255, 255, 0.8)",
                  fontWeight: "500",
                }}
              >
                Everyone knows where to go
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: 16,
              padding: 14,
              gap: 12,
              borderWidth: 1.5,
              borderColor: "rgba(255, 255, 255, 0.3)",
            }}
          >
            <Text style={{ fontSize: 26 }}>✅</Text>
            <View style={{ flex: 1, justifyContent: "center" }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "800",
                  color: "#FFFFFF",
                  marginBottom: 2,
                }}
              >
                Track Who's Coming
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: "rgba(255, 255, 255, 0.8)",
                  fontWeight: "500",
                }}
              >
                See yes or no instantly
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Single CTA Button */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          backgroundColor: "transparent",
        }}
      >
        <TouchableOpacity
          onPress={() => setShowAuthModal(true)}
          activeOpacity={0.85}
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 20,
            paddingVertical: 18,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 6,
            marginBottom: 10,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "800",
              color: "#F59E0B",
              letterSpacing: 0.5,
            }}
          >
            Get Started ✨
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 10,
            color: "rgba(0, 0, 0, 0.5)",
            textAlign: "center",
            fontWeight: "500",
            lineHeight: 14,
          }}
        >
          By continuing, you agree to our{" "}
          <Text style={{ fontWeight: "700" }}>
            Terms & Privacy Policy
          </Text>
        </Text>
      </View>

      {/* Authentication Options Modal */}
      <Modal
        visible={showAuthModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAuthModal(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setShowAuthModal(false)}
          />

          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 20,
              paddingBottom: insets.bottom + 20,
              paddingHorizontal: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 20,
            }}
          >
            {/* Header */}
            <View style={{ alignItems: "center", marginBottom: 24 }}>
              <View
                style={{
                  width: 40,
                  height: 4,
                  backgroundColor: "#E5E7EB",
                  borderRadius: 2,
                  marginBottom: 16,
                }}
              />
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: "#1F2937",
                  marginBottom: 4,
                }}
              >
                Choose Sign In Method
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#6B7280",
                  fontWeight: "500",
                }}
              >
                Select how you'd like to continue
              </Text>
            </View>

            {/* Apple Sign In (iOS only) */}
            {Platform.OS === 'ios' && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={16}
                style={{
                  height: 54,
                  marginBottom: 12,
                }}
                onPress={() => {
                  setShowAuthModal(false);
                  handleAppleSignIn();
                }}
              />
            )}

            {/* Google Sign In */}
            <TouchableOpacity
              onPress={() => {
                setShowAuthModal(false);
                handleGoogleSignIn();
              }}
              activeOpacity={0.85}
              disabled={isAuthenticating}
              style={{
                backgroundColor: isAuthenticating ? "#CCCCCC" : "#4285F4",
                borderRadius: 16,
                height: 54,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                marginBottom: 12,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Ionicons name="logo-google" size={22} color="white" />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: "#FFFFFF",
                }}
              >
                Continue with Google
              </Text>
            </TouchableOpacity>

            {/* Email Sign In */}
            <TouchableOpacity
              onPress={() => {
                setShowAuthModal(false);
                handleEmailSignIn();
              }}
              activeOpacity={0.85}
              style={{
                backgroundColor: "#F59E0B",
                borderRadius: 16,
                height: 54,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                marginBottom: 12,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Ionicons name="mail-outline" size={22} color="white" />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: "#FFFFFF",
                }}
              >
                Continue with Email
              </Text>
            </TouchableOpacity>

            {/* Biometric Sign In (if available) */}
            {hasBiometrics && (
              <TouchableOpacity
                onPress={() => {
                  setShowAuthModal(false);
                  handleSignIn();
                }}
                activeOpacity={0.85}
                disabled={isAuthenticating}
                style={{
                  backgroundColor: "#1F2937",
                  borderRadius: 16,
                  height: 54,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  marginBottom: 12,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Ionicons
                  name={
                    biometricType === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
                      ? "scan"
                      : "finger-print"
                  }
                  size={22}
                  color="white"
                />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: "#FFFFFF",
                  }}
                >
                  {biometricType === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
                    ? "Use Face ID"
                    : "Use Touch ID"}
                </Text>
              </TouchableOpacity>
            )}

            {/* Divider */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginVertical: 16,
              }}
            >
              <View style={{ flex: 1, height: 1, backgroundColor: "#E5E7EB" }} />
              <Text
                style={{
                  marginHorizontal: 12,
                  fontSize: 12,
                  color: "#9CA3AF",
                  fontWeight: "600",
                }}
              >
                OR
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: "#E5E7EB" }} />
            </View>

            {/* Sign Up Link */}
            <TouchableOpacity
              onPress={() => {
                setShowAuthModal(false);
                handleSignUp();
              }}
              activeOpacity={0.85}
              style={{
                backgroundColor: "#F3F4F6",
                borderRadius: 16,
                height: 54,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: "#F59E0B",
                }}
              >
                Create New Account
              </Text>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={() => setShowAuthModal(false)}
              activeOpacity={0.7}
              style={{
                alignItems: "center",
                paddingVertical: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: "#6B7280",
                  fontWeight: "600",
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
