// Success screen after completing bank account setup
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

export default function BankAccountSuccessScreen({ route, navigation }: { route: any, navigation: any }) {
  const { accountId } = route.params || {};

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>🎉</Text>
        <Text style={styles.title}>Account Setup Complete!</Text>
        <Text style={styles.description}>
          Your virtual bank account has been created successfully.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What You Can Do Now:</Text>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>💳</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Accept Payments</Text>
              <Text style={styles.featureDesc}>
                Start receiving payments from customers
              </Text>
            </View>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📊</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Track Transactions</Text>
              <Text style={styles.featureDesc}>
                Monitor all your payment activity
              </Text>
            </View>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🔒</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Secure & Protected</Text>
              <Text style={styles.featureDesc}>
                Your funds are safely managed by Stripe
              </Text>
            </View>
          </View>
        </View>

        {accountId && (
          <View style={styles.accountIdBox}>
            <Text style={styles.accountIdLabel}>Account ID:</Text>
            <Text style={styles.accountId} numberOfLines={1}>
              {accountId}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Payment', { accountId })}
        >
          <Text style={styles.primaryButtonText}>Test Payment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.secondaryButtonText}>Go to Profile</Text>
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
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  feature: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  featureIcon: {
    fontSize: 30,
    marginRight: 15,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 5,
  },
  featureDesc: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  accountIdBox: {
    backgroundColor: '#e8f4f8',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  accountIdLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  accountId: {
    fontSize: 14,
    color: '#2c3e50',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  primaryButton: {
    backgroundColor: '#3498db',
    padding: 18,
    borderRadius: 10,
    marginBottom: 15,
  },
  primaryButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#3498db',
  },
  secondaryButtonText: {
    color: '#3498db',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
});

