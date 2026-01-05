// Payment screen with Stripe integration
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform
} from 'react-native';
import { CardField, useConfirmPayment, initStripe } from '../../src/lib/stripe';
import { createPaymentIntent, CreatePaymentIntentResponse } from '../../src/lib/api';
import { STRIPE_PUBLISHABLE_KEY } from '../../src/lib/config';

export default function PaymentScreen({ route, navigation }: { route: any, navigation: any }) {
  const { accountId } = route.params || {};
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState('10.00');
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const { confirmPayment } = useConfirmPayment();

  useEffect(() => {
    // Initialize Stripe with publishable key
    initStripe({
      publishableKey: STRIPE_PUBLISHABLE_KEY,
      merchantIdentifier: 'merchant.com.piggybank.app', // For Apple Pay
    });
  }, []);

  async function handleCreatePaymentIntent() {
    if (!accountId) {
      Alert.alert('Error', 'No account ID provided');
      return;
    }

    const amountInCents = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountInCents) || amountInCents <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const res: CreatePaymentIntentResponse = await createPaymentIntent({
        amount: amountInCents,
        currency: 'usd',
        connectedAccountId: accountId
      });

      setClientSecret(res.clientSecret);
      Alert.alert('Ready', 'Payment intent created. Enter card details to pay.');
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      Alert.alert('Error', error.message || 'Failed to create payment intent');
    } finally {
      setLoading(false);
    }
  }

  async function handlePay() {
    if (!clientSecret) {
      Alert.alert('Error', 'Please create a payment intent first');
      return;
    }

    if (!cardComplete) {
      Alert.alert('Error', 'Please enter valid card details');
      return;
    }

    setLoading(true);
    try {
      const { paymentIntent, error } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {
            email: 'test@example.com',
          },
        },
      });

      if (error) {
        Alert.alert('Payment Failed', error.message);
      } else if (paymentIntent) {
        Alert.alert(
          'Payment Successful!',
          `Payment of $${amount} completed successfully.\n\nPayment ID: ${paymentIntent.id}`,
          [
            {
              text: 'Done',
              onPress: () => {
                setClientSecret(null);
                setAmount('10.00');
              }
            }
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  }

  // Show web not supported message
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>💳 Payment Not Available</Text>
          <Text style={styles.description}>
            Payment functionality is only available on iOS and Android apps.
          </Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>ℹ️ Mobile App Required</Text>
            <Text style={styles.infoText}>
              To make payments and manage your Stripe Connect account, please use the iOS or Android mobile app.
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Test Payment</Text>
        <Text style={styles.description}>
          Make a test payment to your connected account
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Amount (USD)</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />

          <TouchableOpacity
            style={[styles.createButton, loading && styles.buttonDisabled]}
            onPress={handleCreatePaymentIntent}
            disabled={loading || !!clientSecret}
          >
            {loading && !clientSecret ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.createButtonText}>
                {clientSecret ? 'Payment Intent Created ✓' : 'Create Payment Intent'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {clientSecret && (
          <View style={styles.card}>
            <Text style={styles.label}>Card Details</Text>
            <Text style={styles.testCardNote}>
              Test Card: 4242 4242 4242 4242 | Any future date | Any CVC
            </Text>

            <CardField
              postalCodeEnabled={true}
              placeholders={{
                number: '4242 4242 4242 4242',
              }}
              cardStyle={styles.cardField}
              style={styles.cardFieldContainer}
              onCardChange={(cardDetails: any) => {
                setCardComplete(cardDetails.complete);
              }}
            />

            <TouchableOpacity
              style={[styles.payButton, (loading || !cardComplete) && styles.buttonDisabled]}
              onPress={handlePay}
              disabled={loading || !cardComplete}
            >
              {loading && clientSecret ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.payButtonText}>
                  Pay ${amount}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 Test Mode</Text>
          <Text style={styles.infoText}>
            This is a test payment. Use the test card number above.{'\n\n'}
            The payment will be credited to your Stripe Connect account balance.
          </Text>
        </View>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 10,
    color: '#2c3e50',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#7f8c8d',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  amountInput: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  createButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  testCardNote: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  cardFieldContainer: {
    height: 50,
    marginVertical: 15,
  },
  cardField: {
    backgroundColor: '#FFFFFF',
    color: 'black',
  },
  payButton: {
    backgroundColor: '#27ae60',
    padding: 18,
    borderRadius: 8,
    marginTop: 10,
  },
  payButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#95a5a6',
  },
  infoBox: {
    backgroundColor: '#fff3cd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
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

