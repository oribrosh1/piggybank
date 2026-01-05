# 🚀 Quick Start - Automatic Stripe Account Creation

## What We've Built

✅ **Automatic Stripe Account Creation** - When a user signs up, we automatically:
1. Create a Firebase Auth account
2. Create a user profile in Firestore
3. Create a Stripe Connect Express account
4. Store the Stripe account ID in Firestore
5. Link everything together

✅ **Banking Dashboard** - Real-time display of:
- Stripe account status (pending, approved, rejected)
- Available balance (fetched from Stripe)
- Pending balance
- KYC verification status

---

## 🔧 Setup Required (Before Testing)

### 1. Deploy Firebase Cloud Functions

```bash
cd /Users/oribrosh/Downloads/react-native-firebase-authentication-main

# Login to Firebase
firebase login

# Set your Stripe secret key
firebase functions:config:set stripe.secret="sk_test_YOUR_KEY_HERE"

# Deploy functions
firebase deploy --only functions
```

After deployment, you'll get a URL like:
```
✔  functions[api(us-central1)]: Successful create operation.
Function URL (api(us-central1)): https://us-central1-YOUR_PROJECT.cloudfunctions.net/api
```

### 2. Update API Base URL

Open `/src/lib/api.js` and update line 6:

```javascript
const BASE = "https://us-central1-YOUR_ACTUAL_PROJECT_ID.cloudfunctions.net/api";
```

Replace `YOUR_ACTUAL_PROJECT_ID` with your Firebase project ID.

### 3. Get Your Stripe Keys

1. Go to https://dashboard.stripe.com
2. Toggle to **Test Mode** (top right)
3. Go to **Developers → API Keys**
4. Copy your:
   - Secret Key (sk_test_...) → Use in step 1
   - Publishable Key (pk_test_...) → For future payment UI

---

## 🧪 Testing the Flow

### Test 1: Sign Up and Auto-Create Stripe Account

1. **Run your app**:
   ```bash
   npx expo start
   ```

2. **Create a new account**:
   - Navigate to Sign Up
   - Enter: 
     - Full Name: "Test User"
     - Email: "test@example.com"
     - Password: "password123"
   - Click "Create Account"

3. **Watch the console**:
   ```
   🚀 Initializing user profile for: [user-id]
   ✅ User profile created
   🏦 Creating Stripe Connect account...
   ✅ Stripe account created: acct_xxxxx
   ```

4. **Check Firestore**:
   - Go to Firebase Console → Firestore
   - Collection: `users`
   - Document: `[user-id]`
   - Should see:
     ```json
     {
       "uid": "...",
       "email": "test@example.com",
       "fullName": "Test User",
       "stripeAccountId": "acct_xxxxx",
       "stripeAccountCreated": true,
       "stripeAccountStatus": "onboarding_required",
       "kycStatus": "pending"
     }
     ```

5. **Check Stripe Dashboard**:
   - Go to https://dashboard.stripe.com/test/connect/accounts
   - You should see a new Express account
   - Status: "Not yet onboarded"

### Test 2: Check Banking Screen

1. **Navigate to Banking tab**
2. **Should see**:
   - KYC Status: "Verification Required" or "Pending"
   - Balance: $0.00
   - "Complete Setup" button

3. **Pull to refresh**:
   - Swipe down to refresh
   - App will fetch latest status from Stripe

### Test 3: Complete Onboarding (Stripe Hosted)

The user still needs to complete Stripe onboarding:

1. **Get the account link**:
   - From Firestore, find `stripeAccountLink` field
   - Or call the API to generate a new link

2. **Open in browser**:
   - This link takes user through Stripe's onboarding flow
   - User enters: Business info, Bank account, ID verification

3. **After completion**:
   - Stripe redirects back to your app
   - Status changes to "approved"
   - User can now receive payments!

---

## 📊 What's Stored in Firestore

### Collection: `users`

```json
{
  "uid": "firebase-user-id",
  "email": "user@example.com",
  "fullName": "John Doe",
  "createdAt": "2024-01-15T...",
  "updatedAt": "2024-01-15T...",
  
  // Stripe Connect info
  "stripeAccountId": "acct_1xxxxx",
  "stripeAccountLink": "https://connect.stripe.com/setup/...",
  "stripeAccountCreated": true,
  "stripeAccountStatus": "onboarding_required", // or "approved"
  
  // Verification
  "kycStatus": "pending", // pending | approved | rejected
  "verificationStatus": "pending",
  
  // Stats
  "eventsCreated": 0,
  "eventsAttended": 0,
  "totalReceived": 0,
  "totalPaid": 0,
  
  // Settings
  "notificationsEnabled": true,
  "biometricEnabled": false
}
```

### Collection: `stripeAccounts`

Created by Cloud Functions:

```json
{
  "accountId": "acct_1xxxxx",
  "country": "US",
  "business_type": "individual",
  "created": "2024-01-15T...",
  "status": "pending",
  "charges_enabled": false,
  "payouts_enabled": false,
  "details_submitted": false
}
```

---

## 🎯 Next Steps to Receive Payments

### 1. Create Payment Flow

Use the `createPaymentIntent` endpoint:

```javascript
import { createPaymentIntent } from '@/lib/api';

// Create a payment
const result = await createPaymentIntent({
  amount: 5000, // $50.00 in cents
  currency: 'usd',
  connectedAccountId: 'acct_xxxxx', // User's Stripe account
  description: 'Event ticket payment'
});

// result.clientSecret is used to confirm payment with Stripe UI
```

### 2. Add Stripe Payment UI

```javascript
import { CardField, useConfirmPayment } from '@stripe/stripe-react-native';

function PaymentScreen() {
  const { confirmPayment } = useConfirmPayment();
  
  const handlePayment = async () => {
    const { paymentIntent, error } = await confirmPayment(clientSecret, {
      paymentMethodType: 'Card',
    });
    
    if (!error) {
      console.log('Payment successful!', paymentIntent.id);
    }
  };
  
  return (
    <View>
      <CardField postalCodeEnabled={true} />
      <Button title="Pay" onPress={handlePayment} />
    </View>
  );
}
```

### 3. Check Balance

```javascript
import { getBalance } from '@/lib/api';

const balance = await getBalance();
console.log('Available:', balance.available); // Array of currency balances
console.log('Pending:', balance.pending);
```

### 4. Create Payout

```javascript
import { createPayout } from '@/lib/api';

const payout = await createPayout({
  amount: 5000, // $50.00 in cents
  currency: 'usd'
});

console.log('Payout ID:', payout.payoutId);
```

---

## 🐛 Troubleshooting

### "API endpoint not found"

**Problem**: Functions not deployed or URL wrong  
**Solution**: 
```bash
firebase deploy --only functions
# Copy the URL and update src/lib/api.js
```

### "Invalid token" error

**Problem**: User not authenticated  
**Solution**: Make sure user is logged in before calling API

### Stripe account not created

**Problem**: Functions config not set  
**Solution**:
```bash
firebase functions:config:set stripe.secret="sk_test_YOUR_KEY"
firebase deploy --only functions
```

### "No such account" in Stripe

**Problem**: Account created but ID not saved  
**Solution**: Check Firestore for the `stripeAccountId` field

---

## 📚 Files Modified

✅ **Backend (Cloud Functions)**:
- `functions/index.js` - All Stripe API endpoints
- `functions/package.json` - Dependencies
- `firebase.json` - Firebase config

✅ **Frontend (React Native)**:
- `src/lib/api.js` - API wrapper with all endpoints
- `src/lib/userService.js` - User profile + Stripe account creation
- `app/(auth)/signup.tsx` - Auto-create account on signup
- `app/(tabs)/banking.jsx` - Display real balance & status

✅ **Documentation**:
- `STRIPE_SETUP_GUIDE.md` - Complete setup guide
- `QUICK_START.md` - This file!

---

## ✅ Checklist

Before testing:
- [ ] Firebase Functions deployed
- [ ] Stripe secret key set in Firebase config
- [ ] API base URL updated in `api.js`
- [ ] App restarted after changes

For production:
- [ ] Switch to Live Mode in Stripe
- [ ] Use live API keys (sk_live_...)
- [ ] Update webhook endpoints
- [ ] Test with real bank accounts
- [ ] Review Stripe Connect compliance

---

## 🎉 You're Ready!

Try signing up a new user and watch the magic happen! 🚀

The Stripe account will be created automatically, and you'll see the status in the Banking tab.

**Need help?** Check the full guide: `STRIPE_SETUP_GUIDE.md`

