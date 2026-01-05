# 🚀 Stripe Connect Setup Guide

This guide will walk you through setting up Stripe Connect in your React Native app to create virtual bank accounts and receive payments.

---

## 📋 Prerequisites

- ✅ Firebase project with Authentication, Firestore, and Storage enabled
- ✅ Stripe account (get one at https://stripe.com)
- ✅ Firebase CLI installed: `npm install -g firebase-tools`
- ✅ Expo app with `@stripe/stripe-react-native` installed

---

## Step 1: Get Your Stripe Keys

1. **Login to Stripe Dashboard**: https://dashboard.stripe.com
2. **Enable Test Mode** (toggle in top right)
3. **Go to**: Developers → API Keys
4. **Copy**:
   - `Secret key` (sk_test_...) - **NEVER put in your app**
   - `Publishable key` (pk_test_...) - safe for client-side

5. **Enable Connect**:
   - Go to Settings → Connect
   - Click "Get Started" and complete setup

---

## Step 2: Configure Firebase Cloud Functions

### 2.1 Login to Firebase

```bash
cd /Users/oribrosh/Downloads/react-native-firebase-authentication-main
firebase login
```

### 2.2 Initialize Firebase (if not already done)

```bash
firebase init
```

Select:
- ✅ Functions (already set up in `/functions` folder)
- Choose your existing Firebase project

### 2.3 Set Environment Variables

Set your Stripe secret key securely in Firebase Functions:

```bash
firebase functions:config:set stripe.secret="sk_test_YOUR_SECRET_KEY_HERE"
```

Optional (for webhooks):
```bash
firebase functions:config:set stripe.webhook_secret="whsec_YOUR_WEBHOOK_SECRET"
```

### 2.4 Deploy Functions

```bash
firebase deploy --only functions
```

After deployment, you'll get a URL like:
```
https://us-central1-YOUR_PROJECT.cloudfunctions.net/api
```

**⚠️ IMPORTANT**: Copy this URL!

---

## Step 3: Configure Frontend

### 3.1 Update API Base URL

1. Find your Firebase project ID in Firebase Console
2. Open `src/lib/api.js`
3. Replace:
   ```javascript
   const BASE = "https://us-central1-YOUR_FIREBASE_PROJECT.cloudfunctions.net/api";
   ```
   With your actual functions URL (from Step 2.4)

### 3.2 Configure Stripe Publishable Key

In `app.json`, add:
```json
{
  "expo": {
    "extra": {
      "stripePublishableKey": "pk_test_YOUR_PUBLISHABLE_KEY"
    }
  }
}
```

Or create a config file at `src/lib/config.js`:
```javascript
export const STRIPE_PUBLISHABLE_KEY = "pk_test_YOUR_KEY_HERE";
```

---

## Step 4: Initialize Stripe in Your App

Update `app/_layout.tsx` to initialize Stripe:

```typescript
import { StripeProvider } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';

const STRIPE_PUBLISHABLE_KEY = Constants.expoConfig?.extra?.stripePublishableKey;

export default function RootLayout() {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      {/* Your existing layout */}
    </StripeProvider>
  );
}
```

---

## Step 5: Test the Integration

### 5.1 Test Creating a Connect Account

1. **Run your app**: `npx expo start`
2. **Login** with a test user
3. **Navigate to**: Banking → Setup
4. **Click**: "Create Bank Account"
5. **The app will call**: `createExpressAccount()`
6. **You should get**: An `accountLink` URL

### 5.2 Check Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/connect/accounts
2. You should see your newly created Express account

### 5.3 Test Getting Account Status

```javascript
import { getAccountStatus } from '@/lib/api';

const status = await getAccountStatus();
console.log('Account Status:', status);
// Should show: charges_enabled, payouts_enabled, etc.
```

---

## Step 6: Create Payment Flow (Receive Money)

### 6.1 Example Payment Screen

```javascript
import { CardField, useConfirmPayment } from '@stripe/stripe-react-native';
import { createPaymentIntent, getAccountStatus } from '@/lib/api';

export default function PaymentScreen() {
  const [clientSecret, setClientSecret] = useState(null);
  const { confirmPayment } = useConfirmPayment();

  async function createPayment() {
    // Get your connected account ID
    const status = await getAccountStatus();
    
    // Create payment intent (amount in cents)
    const result = await createPaymentIntent({
      amount: 5000, // $50.00
      currency: 'usd',
      connectedAccountId: status.accountId,
      description: 'Event payment'
    });
    
    setClientSecret(result.clientSecret);
  }

  async function handlePayment() {
    const { paymentIntent, error } = await confirmPayment(clientSecret, {
      paymentMethodType: 'Card',
    });

    if (error) {
      alert('Payment failed: ' + error.message);
    } else {
      alert('Payment successful! 💰');
    }
  }

  return (
    <View>
      <CardField postalCodeEnabled={true} />
      <Button title="Create Payment" onPress={createPayment} />
      {clientSecret && (
        <Button title="Pay Now" onPress={handlePayment} />
      )}
    </View>
  );
}
```

---

## Step 7: Check Balance & Payouts

### 7.1 Get Account Balance

```javascript
import { getBalance } from '@/lib/api';

const balanceData = await getBalance();
console.log('Available:', balanceData.available);
console.log('Pending:', balanceData.pending);
```

### 7.2 Create Payout (Withdraw to Bank)

```javascript
import { createPayout } from '@/lib/api';

const payout = await createPayout({
  amount: 5000, // $50.00 in cents
  currency: 'usd'
});
console.log('Payout created:', payout.payoutId);
```

---

## Step 8: Set Up Webhooks (Optional but Recommended)

Webhooks keep your Firestore data in sync with Stripe.

### 8.1 Add Webhook in Stripe

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click: "Add endpoint"
3. Enter URL: `https://us-central1-YOUR_PROJECT.cloudfunctions.net/api/webhook`
4. Select events:
   - `account.updated`
   - `payment_intent.succeeded`
   - `payout.paid`

### 8.2 Copy Webhook Secret

After creating webhook, copy the signing secret (whsec_...)

### 8.3 Set Webhook Secret in Firebase

```bash
firebase functions:config:set stripe.webhook_secret="whsec_YOUR_SECRET"
firebase deploy --only functions
```

---

## 🧪 Testing with Test Cards

Use Stripe test cards (Test Mode only):

- **Success**: `4242 4242 4242 4242`
- **Requires Authentication**: `4000 0027 6000 3184`
- **Declined**: `4000 0000 0000 0002`

Expiry: Any future date  
CVC: Any 3 digits  
ZIP: Any 5 digits

---

## 🔒 Security Checklist

✅ **Never** put `sk_test_...` or `sk_live_...` in your app code  
✅ **Always** use Firebase Functions for Stripe operations  
✅ **Verify** Firebase tokens in Cloud Functions (already implemented)  
✅ **Use** webhook signature verification (already implemented)  
✅ **Test** in test mode before going live  
✅ **Review** Stripe Connect terms and compliance requirements

---

## 🚨 Common Issues & Solutions

### Issue: "API endpoint not found"
**Solution**: Make sure you deployed functions and updated the BASE URL in `api.js`

### Issue: "Stripe key not set"
**Solution**: Run `firebase functions:config:get` to verify config is set

### Issue: "Invalid token"
**Solution**: Make sure user is logged in with Firebase Auth

### Issue: "Webhook signature failed"
**Solution**: Verify webhook secret matches in Stripe and Firebase config

---

## 📱 Production Checklist

Before going live:

1. ✅ Switch to **Live Mode** in Stripe
2. ✅ Get live API keys (sk_live_... and pk_live_...)
3. ✅ Update Firebase config with live keys
4. ✅ Redeploy functions
5. ✅ Update webhook endpoints to production URL
6. ✅ Test with real cards (small amounts first!)
7. ✅ Review Stripe Connect terms
8. ✅ Ensure KYC/identity verification is working
9. ✅ Set up proper error handling and logging
10. ✅ Add transaction records to Firestore for user history

---

## 🎉 You're All Set!

Your app can now:
- ✅ Create Stripe Connect accounts
- ✅ Receive payments into Connect balance
- ✅ Check balance in real-time
- ✅ Process payouts to bank accounts
- ✅ Handle verification documents

**Next Steps**:
- Implement UI for account balance display
- Add transaction history
- Build payout request flow
- Add Apple Pay support (requires native build)

---

## 📚 Additional Resources

- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [Firebase Functions Docs](https://firebase.google.com/docs/functions)
- [Stripe React Native Docs](https://stripe.dev/stripe-react-native/)
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)

---

Need help? Check the logs:
```bash
# View Cloud Functions logs
firebase functions:log

# View Stripe events
# Go to: https://dashboard.stripe.com/test/logs
```

