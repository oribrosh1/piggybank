# Environment Variables Setup

Create a `.env.local` file in the `piggybank-website` folder with these variables:

```bash
# Firebase Configuration (Client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (Server-side)
# Get this from Firebase Console > Project Settings > Service Accounts > Generate New Private Key
# Stringify the JSON and paste it here
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}

# Stripe Configuration
# Get these from https://dashboard.stripe.com/apikeys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
# Webhook secret - Get from Stripe Dashboard > Developers > Webhooks
STRIPE_WEBHOOK_SECRET=whsec_...

# Base URL for Open Graph images (for SMS previews)
NEXT_PUBLIC_BASE_URL=https://creditkid.app
```

## Getting Firebase Admin Service Account Key:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon)
4. Click **Service Accounts** tab
5. Click **Generate New Private Key**
6. Download the JSON file
7. Copy the contents and stringify it (remove newlines)
8. Paste into `FIREBASE_SERVICE_ACCOUNT_KEY`

## Getting Stripe API Keys:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Sign up or log in to your Stripe account
3. In the API Keys section:
   - Copy the **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - Copy the **Secret key** (starts with `sk_test_` or `sk_live_`)
4. For testing, use the test keys (starts with `pk_test_` and `sk_test_`)
5. For production, use the live keys

### Test Card Numbers:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Auth**: `4000 0025 0000 3155`

Use any future expiry date and any 3-digit CVC.

### Setting up Stripe Webhook:

1. Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Enter your webhook URL:
   - Local: Use Stripe CLI (see below)
   - Production: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Click **"Add endpoint"**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Add it to your `.env.local` as `STRIPE_WEBHOOK_SECRET`

### Testing Webhooks Locally:

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# This will give you a webhook signing secret for local testing
# Use that in your .env.local
```

## For Vercel Deployment:

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add each variable listed above
4. Make sure to select all environments (Production, Preview, Development)
5. For Stripe, use live keys in Production and test keys in Preview/Development

