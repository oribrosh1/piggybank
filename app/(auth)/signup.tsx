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
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import firebase from '../../src/firebase';
import { routes } from "../../types/routes";
import { initializeUserProfile } from '../../src/lib/userService';

export default function SignUpScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSignUp() {
        // Validation
        if (!fullName.trim()) {
            Alert.alert('Error', 'Please enter your full name');
            return;
        }

        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            // Create user account
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);

            // Save credentials for biometric auth
            await SecureStore.setItemAsync('userEmail', email);
            await SecureStore.setItemAsync('userPassword', password);

            // Initialize user profile and create Stripe account
            console.log('🚀 Initializing user profile and Stripe account...');
            const initResult = await initializeUserProfile(userCredential, {
                fullName: fullName.trim(),
            });

            console.log('✅ User initialization result:', initResult);

            // Show success message
            let successMessage = initResult.message || 'Your account has been created successfully!';
            if (initResult.stripeAccount) {
                successMessage += '\n\n🏦 Your payment account is ready! Complete the setup in the Banking tab to start receiving payments.';
            }

            Alert.alert(
                'Success! 🎉',
                successMessage,
                [
                    {
                        text: 'Get Started',
                        onPress: () => router.replace(routes.tabs.home)
                    }
                ]
            );
        } catch (error: any) {
            console.error('Sign up error:', error);

            let errorMessage = 'Failed to create account';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered. Please sign in instead.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak. Use at least 6 characters.';
            } else if (error.code === 'auth/operation-not-allowed') {
                errorMessage = 'Email/Password sign-up is not enabled. Please contact support.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            Alert.alert('Sign Up Failed', errorMessage);
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

                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        paddingHorizontal: 20,
                        justifyContent: 'center',
                        paddingBottom: 40,
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Welcome Section */}
                    <View style={{ alignItems: 'center', marginBottom: 30 }}>
                        <Text style={{ fontSize: 60, marginBottom: 20 }}>🎉</Text>
                        <Text
                            style={{
                                fontSize: 32,
                                fontWeight: '900',
                                color: '#FFFFFF',
                                textAlign: 'center',
                                marginBottom: 8,
                            }}
                        >
                            Create Account
                        </Text>
                        <Text
                            style={{
                                fontSize: 16,
                                color: 'rgba(255, 255, 255, 0.9)',
                                textAlign: 'center',
                                fontWeight: '600',
                            }}
                        >
                            Join PiggyBank and start managing your events
                        </Text>
                    </View>

                    {/* Form Card */}
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
                        {/* Full Name Input */}
                        <View style={{ marginBottom: 16 }}>
                            <Text
                                style={{
                                    fontSize: 14,
                                    fontWeight: '600',
                                    color: '#333333',
                                    marginBottom: 8,
                                }}
                            >
                                Full Name
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
                                placeholder="John Doe"
                                value={fullName}
                                onChangeText={setFullName}
                                autoCapitalize="words"
                                autoComplete="name"
                                editable={!loading}
                            />
                        </View>

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
                                Email Address
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
                        <View style={{ marginBottom: 16 }}>
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
                                placeholder="At least 6 characters"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                                autoCapitalize="none"
                                autoComplete="password-new"
                                editable={!loading}
                            />
                        </View>

                        {/* Confirm Password Input */}
                        <View style={{ marginBottom: 24 }}>
                            <Text
                                style={{
                                    fontSize: 14,
                                    fontWeight: '600',
                                    color: '#333333',
                                    marginBottom: 8,
                                }}
                            >
                                Confirm Password
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
                                placeholder="Re-enter your password"
                                secureTextEntry
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                autoCapitalize="none"
                                autoComplete="password-new"
                                editable={!loading}
                            />
                        </View>

                        {/* Sign Up Button */}
                        <TouchableOpacity
                            onPress={handleSignUp}
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
                                    CREATE ACCOUNT
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Sign In Link */}
                        <TouchableOpacity
                            onPress={() => router.push(routes.auth.emailSignin)}
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
                                Already have an account? Sign In
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Benefits Section */}
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
                                fontSize: 14,
                                color: '#FFFFFF',
                                textAlign: 'center',
                                fontWeight: '600',
                                lineHeight: 22,
                            }}
                        >
                            🔒 Secure account with Face ID{'\n'}
                            🎉 Create and manage events{'\n'}
                            💳 Accept payments easily
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

