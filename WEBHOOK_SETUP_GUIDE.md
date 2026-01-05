# 🔔 Stripe Webhook Setup Guide

## Why You Need Webhooks

Webhooks let Stripe automatically notify your backend when important events happen:
- ✅ User completes onboarding → Update Firestore with new status
- ✅ Payment succeeds → Record transaction in database
- ✅ Account status changes → Update KYC verification status

**Without webhooks**: You'd have to constantly poll Stripe's API  
**With webhooks**: Stripe tells you immediately when something happens

---

## 📋 Step-by-Step Setup

### Step 1: Deploy Your Functions First

**Important**: Deploy functions BEFORE creating webhook (you need the URL)

```bash
cd /Users/oribrosh/Downloads/react-native-firebase-authentication-main
firebase deploy --only functions
```

**Copy the URL from output:**
```
✔  functions[api(us-central1)]: Successful create operation.
Function URL: https://us-central1-piggybank-a0011.cloudfunctions.net/api
```

Your webhook endpoint will be: `https://us-central1-piggybank-a0011.cloudfunctions.net/api/webhook`

---

### Step 2: Go to Stripe Dashboard

1. **Open**: https://dashboard.stripe.com
2. **Toggle**: Switch to **Test mode** (top right)
3. **Navigate**: Click **Developers** in top menu
4. **Click**: **Webhooks** in left sidebar

---

### Step 3: Add Endpoint

1. **Click**: "Add endpoint" button (blue button on right)

2. **Enter Endpoint URL**:
   ```
   https://us-central1-piggybank-a0011.cloudfunctions.net/api/webhook
   ```
   ⚠️ Replace `piggybank-a0011` with YOUR project ID

3. **Description** (optional):
   ```
   PiggyBank App - Account and Payment Events
   ```

4. **Click**: "Select events" button

---

### Step 4: Select ONLY These Events

**Don't select all events!** Only choose these 2:

#### Event 1: Connect Account Updates
1. **Search**: Type "account" in the search box
2. **Find**: `account.updated`
3. **Check**: ✅ `account.updated`
4. **Description**: "Occurs whenever an account status or property has changed."

#### Event 2: Payment Success
1. **Search**: Type "payment_intent" in the search box
2. **Find**: `payment_intent.succeeded`
3. **Check**: ✅ `payment_intent.succeeded`
4. **Description**: "Occurs when a PaymentIntent has successfully completed payment."

**That's it! Only 2 events needed.**

---

### Step 5: Add Endpoint

1. **Click**: "Add endpoint" button at bottom
2. **Wait**: Stripe creates the endpoint

---

### Step 6: Get Webhook Signing Secret

After creating the endpoint:

1. **Click**: On your newly created endpoint in the list
2. **Look for**: "Signing secret" section
3. **Click**: "Reveal" button
4. **Copy**: The secret (starts with `whsec_...`)

Example: `whsec_1234567890abcdefghijklmnopqrstuvwxyz`

---

### Step 7: Add Signing Secret to Firebase

```bash
firebase functions:config:set stripe.webhook_secret="whsec_YOUR_SECRET_HERE"
```

Replace `whsec_YOUR_SECRET_HERE` with your actual secret from Step 6.

---

### Step 8: Redeploy Functions

```bash
firebase deploy --only functions
```

This applies the webhook secret to your functions.

---

## ✅ Verify It's Working

### Test in Stripe Dashboard

1. **Go to**: Your webhook endpoint page
2. **Click**: "Send test webhook" button
3. **Select**: `account.updated`
4. **Click**: "Send test event"

**Expected Result:**
```
✓ Test webhook sent successfully
200 OK
```

### Check Firebase Logs

```bash
firebase functions:log --limit 10
```

You should see:
```
Webhook received: account.updated
```

---

## 📊 What Each Event Does

### Event: `account.updated`

**When it fires:**
- User submits onboarding information
- Stripe verifies identity documents
- Account verification status changes
- Requirements are added or cleared

**What your function does:**
```javascript
// Updates Firestore: stripeAccounts/{uid}
{
  "charges_enabled": true,
  "payouts_enabled": true,
  "details_submitted": true,
  "requirements": {...},
  "updatedAt": Timestamp
}
```

**Example payload:**
```json
{
  "type": "account.updated",
  "data": {
    "object": {
      "id": "acct_1xxxxx",
      "charges_enabled": true,
      "payouts_enabled": false,
      "requirements": {
        "currently_due": ["individual.ssn_last_4"],
        "eventually_due": [],
        "past_due": []
      }
    }
  }
}
```

---

### Event: `payment_intent.succeeded`

**When it fires:**
- A customer successfully pays
- Money is transferred to Connect account
- Payment is confirmed and captured

**What your function does:**
```javascript
// Stores payment record in Firestore: payments/{id}
{
  "paymentIntentId": "pi_xxxxx",
  "amount": 5000,
  "currency": "usd",
  "status": "succeeded",
  "created": Timestamp
}
```

**Example payload:**
```json
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_xxxxx",
      "amount": 5000,
      "currency": "usd",
      "status": "succeeded",
      "transfer_data": {
        "destination": "acct_xxxxx"
      }
    }
  }
}
```

---

## 🎯 Quick Reference

### Webhook URL Format:
```
https://us-central1-{YOUR_PROJECT_ID}.cloudfunctions.net/api/webhook
```

### Events to Select:
```
✅ account.updated
✅ payment_intent.succeeded
```

### Commands:
```bash
# Set webhook secret
firebase functions:config:set stripe.webhook_secret="whsec_xxxxx"

# View config
firebase functions:config:get

# Deploy
firebase deploy --only functions

# View logs
firebase functions:log
```

---

## 🐛 Troubleshooting

### Issue: "Webhook signature verification failed"

**Cause**: Webhook secret not set or incorrect

**Fix:**
```bash
# Check if secret is set
firebase functions:config:get stripe.webhook_secret

# If not set or wrong, update it
firebase functions:config:set stripe.webhook_secret="whsec_YOUR_ACTUAL_SECRET"
firebase deploy --only functions
```

---

### Issue: "404 Not Found"

**Cause**: Wrong endpoint URL

**Fix:**
1. Check your function URL: `firebase functions:list`
2. Should be: `https://us-central1-PROJECT.cloudfunctions.net/api`
3. Webhook endpoint: Add `/webhook` to the end
4. Update in Stripe Dashboard

---

### Issue: "500 Internal Server Error"

**Cause**: Function crashed or error in code

**Fix:**
```bash
# Check logs
firebase functions:log --limit 20

# Look for error messages
# Fix the issue in code
# Redeploy
firebase deploy --only functions
```

---

### Issue: No events received

**Cause**: Webhook not properly set up

**Fix:**
1. Go to Stripe Dashboard → Webhooks
2. Click on your endpoint
3. Check "Logs" tab
4. Send test event
5. See what error appears

---

## 🔒 Security Notes

### ✅ Your webhook is secure because:

1. **Signature Verification**:
   ```javascript
   stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
   ```
   This verifies the webhook actually came from Stripe.

2. **Raw Body Required**:
   ```javascript
   express.raw({type: 'application/json'})
   ```
   Webhook verification needs the raw request body.

3. **Secret Key Never Exposed**:
   Stored securely in Firebase Functions config.

### ⚠️ Don't:
- Don't disable signature verification
- Don't log the webhook secret
- Don't process webhooks without verification
- Don't expose webhook endpoint without HTTPS

---

## 📱 Testing Without Deploying

Use **Stripe CLI** to test webhooks locally:

### 1. Install Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
```

### 2. Login:
```bash
stripe login
```

### 3. Forward webhooks to local:
```bash
stripe listen --forward-to localhost:5001/piggybank-a0011/us-central1/api/webhook
```

### 4. Trigger test events:
```bash
stripe trigger account.updated
stripe trigger payment_intent.succeeded
```

This lets you test webhook handling without deploying!

---

## 🎯 Production Checklist

Before going live:

- [ ] Switch Stripe to **Live Mode**
- [ ] Create webhook endpoint for **live mode**
- [ ] Use **live webhook secret** (different from test!)
- [ ] Update Firebase config with live secret:
  ```bash
  firebase functions:config:set stripe.webhook_secret="whsec_LIVE_SECRET"
  ```
- [ ] Deploy to production
- [ ] Test with real events
- [ ] Monitor webhook logs regularly

---

## 📊 Monitoring Webhooks

### Stripe Dashboard:
1. Go to **Developers** → **Webhooks**
2. Click on your endpoint
3. View **Logs** tab
4. See all received events and responses

### Firebase Logs:
```bash
# Real-time logs
firebase functions:log --only api

# Last 50 entries
firebase functions:log --limit 50

# Filter by severity
firebase functions:log --severity INFO
```

---

## 🆘 Common Questions

### Q: Do I need webhooks for the app to work?

**A**: Not for basic functionality, but **highly recommended** for:
- Automatic status updates
- Real-time verification notifications
- Payment tracking

Without webhooks, users would need to manually refresh to see status changes.

---

### Q: What if I add more events later?

**A**: Just edit your webhook in Stripe:
1. Go to webhook endpoint page
2. Click "Add events"
3. Select new events
4. Update your code to handle them
5. Redeploy functions

---

### Q: How do I know which events I need?

**A**: Look at your `functions/index.js`:
```javascript
if (event.type === 'account.updated') { ... }
if (event.type === 'payment_intent.succeeded') { ... }
```

Only add events your code actually handles.

---

### Q: Can I have multiple webhooks?

**A**: Yes! You can create:
- One for test mode
- One for live mode
- Multiple per environment if needed

Each can listen to different events.

---

## ✅ Summary

**What you need:**
1. ✅ Webhook URL: `https://us-central1-{PROJECT}.cloudfunctions.net/api/webhook`
2. ✅ Events: `account.updated`, `payment_intent.succeeded`
3. ✅ Signing secret: Set in Firebase config
4. ✅ Deploy functions with the secret

**What you DON'T need:**
- ❌ All 100+ Stripe events
- ❌ Multiple webhook endpoints (one is enough)
- ❌ Complex setup (just 2 events!)

---

## 🎉 Done!

Your webhook is now set up and will automatically:
- ✅ Update account status when users complete onboarding
- ✅ Record payments when they succeed
- ✅ Keep Firestore in sync with Stripe

**Next step**: Deploy functions and test!

```bash
firebase deploy --only functions
```

