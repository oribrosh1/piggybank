# 🔐 Environment Variables Guide for Firebase Functions

## Overview

There are **two ways** to store sensitive data (like Stripe API keys) in Firebase Cloud Functions:

1. **Firebase Functions Config** - Traditional method, works in production
2. **Environment Variables (.env)** - Modern method, better for local development

---

## 📦 Method 1: Firebase Functions Config (RECOMMENDED)

### ✅ Best for:
- Production deployments
- Secrets that should never be in code
- Sharing config across team without committing secrets

### Step 1: Set Configuration Values

```bash
cd /Users/oribrosh/Downloads/react-native-firebase-authentication-main

# Set Stripe secret key (REQUIRED)
firebase functions:config:set stripe.secret="sk_test_YOUR_STRIPE_SECRET_KEY_HERE"

# Set Stripe publishable key (optional, for reference)
firebase functions:config:set stripe.publishable="pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE"

# Set webhook secret (needed for webhooks)
firebase functions:config:set stripe.webhook_secret="whsec_xxxxx"

# Set app scheme for deep links (optional - defaults to 'creditkidapp')
firebase functions:config:set app.scheme="creditkidapp"
```

### Step 2: View Current Configuration

```bash
firebase functions:config:get
```

**Output:**
```json
{
  "stripe": {
    "secret": "sk_test_51xxxxx",
    "publishable": "pk_test_51xxxxx",
    "webhook_secret": "whsec_xxxxx"
  },
  "app": {
    "scheme": "creditkidapp"
  }
}
```

### Step 3: Deploy to Apply Changes

```bash
firebase deploy --only functions
```

### Step 4: Access in Code (Already Implemented)

```javascript
// In functions/index.js
const stripe = Stripe(functions.config().stripe.secret);
const webhookSecret = functions.config().stripe.webhook_secret;
const appScheme = functions.config().app.scheme; // e.g., 'creditkidapp'
```

### ❌ Delete a Config Value

```bash
firebase functions:config:unset stripe.secret
```

---

## 📦 Method 2: Environment Variables (.env file)

### ✅ Best for:
- Local development and testing
- Running Firebase emulator
- Keeping development and production configs separate

### Step 1: Create .env File

Create a file at `/functions/.env`:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_51xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# App Configuration (Mobile Deep Link Scheme)
APP_SCHEME=creditkidapp
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# Environment
NODE_ENV=development
```

### Step 2: Secure the .env File

**⚠️ CRITICAL**: Never commit `.env` to Git!

Create `/functions/.gitignore` or add to existing:

```bash
# Add to .gitignore
echo ".env" >> functions/.gitignore
echo ".env.local" >> functions/.gitignore
```

### Step 3: Create .env.example (Template)

Create `/functions/.env.example` (safe to commit):

```bash
# Stripe API Keys (GET FROM: https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# App Configuration
APP_URL=http://localhost:19006
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

# Environment
NODE_ENV=development
```

### Step 4: Access in Code (Already Implemented)

The code already supports both methods:

```javascript
// Priority: 1) .env file, 2) Firebase Functions Config
const stripe = Stripe(
  process.env.STRIPE_SECRET_KEY || 
  functions.config().stripe?.secret
);
```

### Step 5: Test Locally with Emulator

```bash
cd functions
firebase emulators:start --only functions
```

The emulator will automatically load `.env` file!

---

## 🔄 Combined Approach (BEST PRACTICE)

Use **both methods** for flexibility:

### Local Development:
- Use `.env` file
- Fast iteration, no deployment needed
- Test with `firebase emulators:start`

### Production:
- Use Firebase Functions Config
- No `.env` file in deployed code
- Managed through Firebase CLI

### Code (Already Implemented):
```javascript
// Works in both environments!
const stripeKey = process.env.STRIPE_SECRET_KEY || functions.config().stripe?.secret;
```

---

## 📝 Complete Setup Instructions

### For First-Time Setup:

```bash
# 1. Navigate to functions directory
cd /Users/oribrosh/Downloads/react-native-firebase-authentication-main/functions

# 2. Create .env file
cat > .env << 'EOF'
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_KEY_HERE
APP_URL=http://localhost:19006
NODE_ENV=development
EOF

# 3. Secure it
echo ".env" >> .gitignore

# 4. Set Firebase config for production
cd ..
firebase functions:config:set stripe.secret="sk_test_YOUR_KEY_HERE"
firebase functions:config:set stripe.webhook_secret="whsec_YOUR_KEY_HERE"

# 5. Deploy
firebase deploy --only functions
```

---

## 🎯 Quick Reference

### Get Your Stripe Keys:

1. Go to: https://dashboard.stripe.com
2. Toggle: **Test Mode** (top right)
3. Navigate: **Developers** → **API Keys**
4. Copy:
   - **Secret key** → `sk_test_...` (Never share!)
   - **Publishable key** → `pk_test_...` (Safe for client)

### Webhook Secret:

1. Go to: **Developers** → **Webhooks**
2. Click: **Add endpoint**
3. Enter URL: `https://us-central1-YOUR_PROJECT.cloudfunctions.net/api/webhook`
4. Select events: `account.updated`, `payment_intent.succeeded`
5. Copy: **Signing secret** → `whsec_...`

---

## 🔍 Checking Current Config

### Firebase Functions Config:

```bash
# View all config
firebase functions:config:get

# View specific config
firebase functions:config:get stripe

# Export to .runtimeconfig.json (for emulator)
firebase functions:config:get > functions/.runtimeconfig.json
```

### Environment Variables:

```bash
# View .env file
cat functions/.env

# Check if loaded in Node
node -e "require('dotenv').config({path:'functions/.env'}); console.log(process.env.STRIPE_SECRET_KEY)"
```

---

## 🐛 Troubleshooting

### Issue: "Stripe key not found"

**Check:**
```bash
# 1. View Firebase config
firebase functions:config:get

# 2. Check .env file exists
ls -la functions/.env

# 3. Verify in deployed function
firebase functions:log --limit 10
```

**Fix:**
```bash
# Set Firebase config
firebase functions:config:set stripe.secret="sk_test_YOUR_KEY"
firebase deploy --only functions
```

### Issue: "Config not working locally"

**Solution:** Create `.runtimeconfig.json`:
```bash
firebase functions:config:get > functions/.runtimeconfig.json
```

Firebase emulator reads this file automatically.

### Issue: ".env not loading"

**Check:**
1. File exists: `functions/.env`
2. dotenv installed: `npm list dotenv`
3. Code loads it: Check `functions/index.js` top lines

**Fix:**
```bash
cd functions
npm install dotenv
```

---

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Use Firebase Functions Config for production
- ✅ Use `.env` for local development
- ✅ Add `.env` to `.gitignore`
- ✅ Create `.env.example` template (safe to commit)
- ✅ Rotate keys if accidentally exposed
- ✅ Use test keys for development
- ✅ Use live keys only in production

### ❌ DON'T:
- ❌ Commit `.env` to Git
- ❌ Put secrets directly in code
- ❌ Share secret keys in chat/email
- ❌ Use production keys for testing
- ❌ Log secret keys in console
- ❌ Expose keys in client-side code

---

## 📊 Environment Variables Reference

### Required for Stripe:

| Variable | Example | Where to Get |
|----------|---------|--------------|
| `STRIPE_SECRET_KEY` | `sk_test_51xxx` | Stripe Dashboard → API Keys |
| `STRIPE_WEBHOOK_SECRET` | `whsec_xxx` | Stripe Dashboard → Webhooks |

### Optional:

| Variable | Example | Purpose |
|----------|---------|---------|
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_51xxx` | Reference only |
| `APP_URL` | `https://your-app.com` | Redirect URLs |
| `NODE_ENV` | `development` | Environment mode |
| `FIREBASE_STORAGE_BUCKET` | `project.appspot.com` | Storage bucket |

---

## 🚀 Quick Start Commands

```bash
# Set Stripe keys in Firebase (one-time setup)
firebase functions:config:set \
  stripe.secret="sk_test_YOUR_KEY" \
  stripe.webhook_secret="whsec_YOUR_KEY"

# Deploy
firebase deploy --only functions

# Test locally
cd functions
firebase emulators:start --only functions
```

---

## 📚 Additional Resources

- [Firebase Functions Config Docs](https://firebase.google.com/docs/functions/config-env)
- [Stripe API Keys Guide](https://stripe.com/docs/keys)
- [Stripe Connect Docs](https://stripe.com/docs/connect)

---

## ✅ Checklist

Before deploying:
- [ ] Stripe secret key set in Firebase config
- [ ] Webhook secret set (if using webhooks)
- [ ] `.env` file created for local dev
- [ ] `.env` added to `.gitignore`
- [ ] `.env.example` created as template
- [ ] Functions deployed with config
- [ ] Config verified with `firebase functions:config:get`

---

Need help? Check logs:
```bash
firebase functions:log --limit 50
```

