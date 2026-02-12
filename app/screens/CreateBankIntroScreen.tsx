// Introduction screen for banking setup (Stripe account is created only after onboarding completes)
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import firebase from '../../src/firebase';

export default function CreateBankIntroScreen({ navigation }: { navigation: any }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const auth = firebase.auth();

  async function startOnboarding() {
    if (!auth.currentUser) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }
    setLoading(true);
    try {
      // Go to banking setup flow; Stripe account is created only when user completes all steps
      router.push('/banking/setup/personal-info');
    } catch (error: any) {
      console.error('Error starting onboarding:', error);
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>🏦</Text>
        <Text style={styles.title}>Create Your Payment Account</Text>
        <Text style={styles.description}>
          Complete a few steps to set up your secure payment account and receive payments directly.
        </Text>

        <View style={styles.features}>
          <FeatureItem icon="✓" text="Secure payment processing" />
          <FeatureItem icon="✓" text="Direct deposits to your account" />
          <FeatureItem icon="✓" text="Track all your transactions" />
          <FeatureItem icon="✓" text="Identity verification for security" />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={startOnboarding}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Start Setup</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FeatureItem({ icon, text }: { icon: string, text: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  icon: {
    fontSize: 80,
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#2c3e50',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#7f8c8d',
    lineHeight: 24,
  },
  features: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 10,
    color: '#27ae60',
  },
  featureText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  button: {
    backgroundColor: '#3498db',
    padding: 18,
    borderRadius: 10,
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#95a5a6',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 10,
  },
  backText: {
    color: '#3498db',
    textAlign: 'center',
    fontSize: 16,
  },
});

