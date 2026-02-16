import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import firebase from "@/src/firebase";
import { routes } from "@/types/routes";

export default function EmailSignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAuth() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        // Sign up new user
        await firebase.auth().createUserWithEmailAndPassword(email, password);

        // Save credentials for biometric auth
        await SecureStore.setItemAsync('userEmail', email);
        await SecureStore.setItemAsync('userPassword', password);

        Alert.alert(
          'Success',
          'Account created! You can now use Face ID to sign in.',
          [{ text: 'OK', onPress: () => router.replace(routes.tabs.home) }]
        );
      } else {
        // Sign in existing user
        await firebase.auth().signInWithEmailAndPassword(email, password);

        // Save credentials for biometric auth
        await SecureStore.setItemAsync('userEmail', email);
        await SecureStore.setItemAsync('userPassword', password);

        router.replace(routes.tabs.home);
      }
    } catch (error: any) {
      console.error('Auth error:', error);

      let errorMessage = 'Authentication failed';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already in use. Try signing in instead.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found. Please sign up first.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/Password sign-in is not enabled. Please contact support.';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FBBF24' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 20,
            paddingHorizontal: 20,
            paddingBottom: 20,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              alignSelf: 'flex-start',
              padding: 8,
            }}
          >
            <Text style={{ fontSize: 24, color: '#FFFFFF' }}>←</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View
          style={{
            flex: 1,
            paddingHorizontal: 20,
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
              elevation: 12,
            }}
          >
            <Text
              style={{
                fontSize: 28,
                fontWeight: '900',
                color: '#000000',
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Text>

            <Text
              style={{
                fontSize: 14,
                color: '#666666',
                marginBottom: 24,
                textAlign: 'center',
              }}
            >
              {isSignUp
                ? 'Sign up to create your account'
                : 'Sign in to continue to your events'}
            </Text>

            {/* Email Input */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#333333',
                  marginBottom: 8,
                }}
              >
                Email
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#F5F5F5',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: '#E0E0E0',
                }}
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!loading}
              />
            </View>

            {/* Password Input */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#333333',
                  marginBottom: 8,
                }}
              >
                Password
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#F5F5F5',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: '#E0E0E0',
                }}
                placeholder="••••••••"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                autoComplete="password"
                editable={!loading}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: '#999999',
                  marginTop: 4,
                }}
              >
                Minimum 6 characters
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleAuth}
              disabled={loading}
              style={{
                backgroundColor: loading ? '#CCCCCC' : '#FBBF24',
                borderRadius: 12,
                padding: 18,
                marginBottom: 16,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '900',
                    color: '#FFFFFF',
                    textAlign: 'center',
                  }}
                >
                  {isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Toggle Sign Up/Sign In */}
            <TouchableOpacity
              onPress={() => setIsSignUp(!isSignUp)}
              disabled={loading}
              style={{ padding: 8 }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: '#FBBF24',
                  textAlign: 'center',
                  fontWeight: '600',
                }}
              >
                {isSignUp
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info Box */}
          <View
            style={{
              marginTop: 24,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.3)',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                color: '#FFFFFF',
                textAlign: 'center',
                fontWeight: '600',
                lineHeight: 20,
              }}
            >
              🔒 Your credentials will be saved securely{'\n'}
              to enable Face ID sign in
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

