# 📱 Deep Links for Stripe Connect (Mobile Apps)

## Why Deep Links?

Since this is a **React Native mobile app** (not a web app), when Stripe redirects users after onboarding, it needs to use **deep links** to open your app, not regular web URLs.

---

## 🔗 Your Current App Scheme

From `app.json`:
```json
{
  "expo": {
    "scheme": "myapp"
  }
}
```

**Your deep link format:** `myapp://path/to/screen`

---

## 🎯 How Stripe Redirects Work

When a user completes Stripe onboarding:

1. **User opens Stripe onboarding** → Opens in browser/WebView
2. **User completes form** → Enters business info, bank account, ID
3. **Stripe redirects** → `myapp://banking/setup/success`
4. **Your app opens** → Detects the deep link and navigates to success screen

---

## 🛠️ Current Implementation

### Backend (Cloud Functions)

```javascript
// functions/index.js (already configured)
const appScheme = 'myapp'; // Matches your app.json

const accountLink = await stripe.accountLinks.create({
  account: account.id,
  refresh_url: `${appScheme}://banking/setup/stripe-connection?refresh=true`,
  return_url: `${appScheme}://banking/setup/success`,
  type: "account_onboarding",
});
```

### Frontend (Expo Router)

Expo Router **automatically handles** deep links that match your route structure:

- `myapp://banking/setup/success` → Opens `/app/banking/setup/success.tsx`
- `myapp://banking/setup/stripe-connection` → Opens `/app/banking/setup/stripe-connection.tsx`

---

## 📋 Setup Checklist

### ✅ Already Done:
- [x] App scheme set in `app.json`: `"scheme": "myapp"`
- [x] Cloud Functions configured to use deep links
- [x] Expo Router will handle deep links automatically

### 🔧 To Do (if needed):

#### 1. Handle Deep Link Parameters

If you want to detect when user returns from Stripe:

```javascript
// app/banking/setup/success.tsx
import { useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';

export default function StripeOnboardingSuccess() {
  const params = useLocalSearchParams();
  
  useEffect(() => {
    // User was redirected back from Stripe
    console.log('Returned from Stripe onboarding');
    
    // Refresh account status
    checkStripeAccountStatus();
  }, []);

  return (
    <View>
      <Text>✅ Setup Complete!</Text>
      <Text>Your payment account is ready.</Text>
    </View>
  );
}
```

#### 2. Test Deep Links

**Test on iOS Simulator:**
```bash
xcrun simctl openurl booted myapp://banking/setup/success
```

**Test on Android Emulator:**
```bash
adb shell am start -a android.intent.action.VIEW -d "myapp://banking/setup/success"
```

**Test on Physical Device:**
```bash
# iOS
npx uri-scheme open myapp://banking/setup/success --ios

# Android
npx uri-scheme open myapp://banking/setup/success --android
```

---

## 🌐 Alternative: Web Fallback URLs

If you want to support web AND mobile, use a web URL that redirects:

### Option 1: Custom Redirect Page

1. **Create a simple web page**: `https://yourwebsite.com/stripe-redirect`
2. **Page auto-detects mobile** and redirects to `myapp://`
3. **Falls back to web** if app not installed

```html
<!-- https://yourwebsite.com/stripe-redirect.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Redirecting...</title>
  <script>
    // Detect mobile and try deep link
    const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location = 'myapp://banking/setup/success';
      // Fallback to app store if app not installed (after 2 seconds)
      setTimeout(() => {
        window.location = 'https://apps.apple.com/your-app'; // or Play Store
      }, 2000);
    } else {
      // Show web version or download link
      document.body.innerHTML = '<h1>Please open this on your mobile device</h1>';
    }
  </script>
</head>
<body>
  <p>Redirecting to app...</p>
</body>
</html>
```

### Option 2: Use Expo's Linking URL

```javascript
// functions/index.js - Alternative approach
const accountLink = await stripe.accountLinks.create({
  account: account.id,
  refresh_url: `https://yourwebsite.com/stripe-redirect?type=refresh`,
  return_url: `https://yourwebsite.com/stripe-redirect?type=success`,
  type: "account_onboarding",
});
```

---

## 🔐 Environment Variable Setup

### For Default Scheme (Recommended):

**No config needed!** It uses `myapp` from your `app.json`.

### To Override (Optional):

```bash
# Set custom scheme in Firebase
firebase functions:config:set app.scheme="myapp"

# Or in .env file
echo "APP_SCHEME=myapp" >> functions/.env
```

---

## 📱 Universal Links (Production)

For production, use **Universal Links** (iOS) or **App Links** (Android) instead of custom URL schemes.

### Benefits:
- More reliable
- Works even if app not installed (opens website)
- No "Open in app?" dialog
- Better security

### Setup:

1. **Domain**: You need a domain (e.g., `creditkid.vercel.app`)

2. **iOS Universal Links**:
   - Add `apple-app-site-association` file at `https://creditkid.vercel.app/.well-known/apple-app-site-association`
   - Configure in `app.json`:
   ```json
   {
     "ios": {
       "associatedDomains": ["applinks:creditkid.vercel.app"]
     }
   }
   ```

3. **Android App Links**:
   - Add `assetlinks.json` at `https://creditkid.vercel.app/.well-known/assetlinks.json`
   - Configure in `app.json`:
   ```json
   {
     "android": {
       "intentFilters": [{
         "action": "VIEW",
         "data": {
           "scheme": "https",
           "host": "creditkid.vercel.app"
         }
       }]
     }
   }
   ```

4. **Use in Functions**:
   ```javascript
   const accountLink = await stripe.accountLinks.create({
     account: account.id,
     refresh_url: `https://creditkid.vercel.app/banking/setup/stripe-connection`,
     return_url: `https://creditkid.vercel.app/banking/setup/success`,
     type: "account_onboarding",
   });
   ```

---

## 🧪 Testing the Complete Flow

1. **Run your app:**
   ```bash
   npx expo start
   ```

2. **Sign up a new user** → Stripe account auto-created

3. **Navigate to Banking tab** → Click "Complete Setup"

4. **Get the onboarding link:**
   ```javascript
   // From Firestore or call API
   const accountLink = 'https://connect.stripe.com/setup/...';
   ```

5. **Open in WebView** or external browser:
   ```javascript
   import * as WebBrowser from 'expo-web-browser';
   
   WebBrowser.openBrowserAsync(accountLink);
   ```

6. **Complete Stripe form** → Fill in business info

7. **Stripe redirects** → `myapp://banking/setup/success`

8. **App opens** → Navigate to success screen

---

## 🎯 Recommended Approach

For simplicity during development:

✅ **Use custom URL scheme** (`myapp://`)
- Easy to set up
- Works immediately
- Good for testing

For production:

✅ **Upgrade to Universal Links**
- Professional
- Better UX
- More reliable

---

## 📚 Additional Resources

- [Expo Linking Docs](https://docs.expo.dev/guides/linking/)
- [Expo Router Deep Linking](https://docs.expo.dev/router/reference/linking/)
- [Stripe Connect Redirect URLs](https://stripe.com/docs/connect/express-accounts#redirect)
- [iOS Universal Links](https://developer.apple.com/ios/universal-links/)
- [Android App Links](https://developer.android.com/training/app-links)

---

## ✅ Current Status

Your app is **ready** with:
- ✅ Deep link scheme: `myapp://`
- ✅ Cloud Functions configured
- ✅ Expo Router handles deep links automatically
- ✅ Redirect URLs: `myapp://banking/setup/success`

**No additional setup needed for basic functionality!** 🎉

When Stripe redirects to `myapp://banking/setup/success`, your app will automatically open to that route.

