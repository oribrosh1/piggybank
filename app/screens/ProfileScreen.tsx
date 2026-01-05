// Profile screen showing user info and account management
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { signOut } from 'firebase/auth';
import { collection, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebase from '../../src/firebase';

export default function ProfileScreen({ navigation }: { navigation: any }) {
  const [loading, setLoading] = useState(true);
  const [stripeAccount, setStripeAccount] = useState<any>(null);
  const user = firebase.auth().currentUser;

  const db = firebase.firestore();
  useEffect(() => {
    loadStripeAccount();
  }, []);

  async function loadStripeAccount() {
    try {
      if (user) {
        const docRef = doc(collection(db, 'stripeAccounts'), user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setStripeAccount(docSnap.data() as any);
        }
      }
    } catch (error: any) {
      console.error('Error loading account:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await firebase.auth().signOut();
              navigation.replace('Auth');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          {stripeAccount ? (
            <View style={styles.card}>
              <InfoRow
                label="Stripe Account"
                value={stripeAccount.accountId ? '✓ Connected' : 'Not Connected'}
              />
              <InfoRow
                label="Account ID"
                value={stripeAccount.accountId?.substring(0, 20) + '...' || 'N/A'}
              />
              <InfoRow
                label="Created"
                value={stripeAccount.createdAt
                  ? new Date(stripeAccount.createdAt).toLocaleDateString()
                  : 'N/A'
                }
              />
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.noAccountText}>
                No payment account connected
              </Text>
              <TouchableOpacity
                style={styles.setupButton}
                onPress={() => navigation.navigate('CreateBankIntro')}
              >
                <Text style={styles.setupButtonText}>
                  Set Up Payment Account
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>

          {stripeAccount?.accountId && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Payment', { accountId: stripeAccount.accountId })}
            >
              <Text style={styles.actionButtonIcon}>💳</Text>
              <Text style={styles.actionButtonText}>Test Payment</Text>
              <Text style={styles.actionButtonArrow}>›</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleSignOut}
          >
            <Text style={styles.actionButtonIcon}>🚪</Text>
            <Text style={[styles.actionButtonText, styles.dangerText]}>Sign Out</Text>
            <Text style={styles.actionButtonArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
  },
  email: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  infoValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
  },
  noAccountText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 15,
  },
  setupButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
  },
  setupButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  actionButtonIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
  },
  actionButtonArrow: {
    fontSize: 24,
    color: '#bdc3c7',
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  dangerText: {
    color: '#e74c3c',
  },
});

