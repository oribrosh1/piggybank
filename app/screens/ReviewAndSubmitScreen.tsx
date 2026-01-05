// Review and submit screen for account verification
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { collection, doc, getDoc } from 'firebase/firestore';
import firebase from '../../src/firebase';

export default function ReviewAndSubmitScreen({ route, navigation }: { route: any, navigation: any }) {
  const { accountId } = route.params;
  const [loading, setLoading] = useState(true);
  const [accountData, setAccountData] = useState<any>(null);
  const user = firebase.auth().currentUser;
  const db = firebase.firestore();

  useEffect(() => {
    loadAccountData();
  }, []);

  async function loadAccountData() {
    try {
      if (user) {
        const docRef = doc(collection(db, 'stripeAccounts'), user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setAccountData(docSnap.data() as any);
        }
      }
    } catch (error: any) {
      console.error('Error loading account:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleContinue() {
    Alert.alert(
      'Setup Complete!',
      'Your account is being verified. This usually takes 1-2 business days.',
      [
        {
          text: 'Go to Dashboard',
          onPress: () => navigation.navigate('BankAccountSuccess', { accountId })
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
      <View style={styles.content}>
        <Text style={styles.icon}>✓</Text>
        <Text style={styles.title}>Review Your Information</Text>
        <Text style={styles.description}>
          Please review the information you've provided
        </Text>

        <View style={styles.infoCard}>
          <InfoRow label="Account ID" value={accountId} />
          {accountData?.lastUploadedFile && (
            <InfoRow label="Document Status" value="Uploaded ✓" />
          )}
          <InfoRow
            label="Created"
            value={accountData?.createdAt
              ? new Date(accountData.createdAt).toLocaleDateString()
              : 'Just now'
            }
          />
        </View>

        <View style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>What's Next?</Text>
          <Text style={styles.noticeText}>
            • Your documents will be verified by Stripe{'\n'}
            • You'll receive an email with the verification status{'\n'}
            • Once verified, you can start receiving payments{'\n'}
            • Verification typically takes 1-2 business days
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>Continue to Dashboard</Text>
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

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="middle">
        {value}
      </Text>
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
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  icon: {
    fontSize: 80,
    textAlign: 'center',
    marginBottom: 20,
    color: '#27ae60',
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
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
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
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  noticeBox: {
    backgroundColor: '#e8f4f8',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  noticeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  noticeText: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#27ae60',
    padding: 18,
    borderRadius: 10,
    marginBottom: 15,
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

