A complete, ready-to-run implementation plan **(frontend + backend)** for your Expo React Native app that lets a user:

* register/login (Firebase Auth)
* create a **virtual bank** (Stripe Connect account) from the app UI
* upload identity documents (Firebase Storage → Stripe verification)
* receive payments into a Stripe balance (Connect account)
* (optional) present Apple Pay via stripe-react-native — with the exact caveats and steps required for Apple Pay to work on iOS

This delivers everything you asked for (Expo, React Native, Firebase, Stripe). I’ll include:

1. Project structure and required services
2. Exact packages to install + commands
3. Firebase Cloud Functions (Node) code for all Stripe interactions (secure, server-side)
4. Expo React Native code for the UI + logic (auth, forms, uploads, calling functions)
5. How to configure secrets (Stripe keys, Firebase functions config)
6. Apple Pay notes & build requirements
7. Security & testing checklist

I assume you want working code you can paste into Cursor (or any editor). I’ll keep each file self-contained and note where to replace keys.

---

# Summary architecture (short)

* **Frontend (Expo React Native)**

  * Firebase Auth (email/password)
  * Firestore for user metadata and Connect account IDs
  * Firebase Storage for uploaded identity documents
  * Calls Firebase Cloud Functions (HTTPS) to create Stripe Connect accounts / upload files / create PaymentIntents
  * stripe-react-native for in-app payments (and Apple Pay on iOS when built with EAS)

* **Backend (Firebase Cloud Functions)**

  * Node.js functions that use the **Stripe Secret Key** to:

    * create Stripe Connect Accounts (Express or Custom — we’ll use **Express** for simpler onboarding)
    * upload verification files (from Storage or from direct upload)
    * create PaymentIntent or PaymentLink that sends funds to user Connect account
    * webhook handler to update Firestore with verification status

---

# Important prerequisites & notes (read first)

1. **Stripe secret keys must never be in the app.** Use Firebase Cloud Functions and set keys in `firebase functions:config:set stripe.secret="..." stripe.publishable="..."` or in environment variables for functions.
2. **Apple Pay**: requires Apple Merchant ID, domain verification, and a native build. With Expo managed you must use **EAS Build** (not plain Expo Go). I’ll show how to prepare, but you cannot test Apple Pay on Expo Go.
3. **Expo + stripe-react-native**: `@stripe/stripe-react-native` requires native builds. Use EAS.
4. **Testing**: start in Stripe **test mode** with test keys, test cards, and test Apple Pay if configured.
5. This includes file uploads: we’ll upload to Firebase Storage from the app, then instruct Cloud Function to fetch that Storage file and send to Stripe (server-to-server). This avoids sending raw secret keys from the app.

---

# Folder layout (final app)

```
/mobile-app (Expo frontend)
  App.js
  app.json / eas.json
  /src
    /screens
      AuthScreen.js
      ProfileScreen.js
      CreateBankIntroScreen.js
      BankDetailsFormScreen.js
      DocumentUploadScreen.js
      ReviewAndSubmitScreen.js
      BankAccountSuccessScreen.js
      PaymentScreen.js
    /components
      PrimaryButton.js
      FormInput.js
      DocumentPicker.js
    /lib
      firebase.js
      api.js  // wrappers for calling cloud functions
/package.json

/backend (Firebase Functions)
  functions/
    index.js
    package.json
    stripeHelpers.js
    webhookHandler.js
```

---

# Step A — Initialize projects & install packages

### 1) Create Firebase project

* Create project in Firebase console
* Enable **Authentication** (Email/Password)
* Enable **Firestore (native)**
* Enable **Storage**
* Set up **Cloud Functions** (Node 18 or Node 20)

### 2) Create Stripe account

* Create Stripe account, get **Test Secret Key** and **Publishable Key**
* Enable Connect in dashboard (you’ll use Express accounts)
* (Optional for payouts) configure bank/merchant details later

### 3) Initialize Expo app

```bash
npx create-expo-app bank-connect-app
cd bank-connect-app
```

Install frontend dependencies:

```bash
# navigation & core
expo install react-native-safe-area-context @react-navigation/native @react-navigation/native-stack react-native-gesture-handler react-native-reanimated

# firebase
yarn add firebase

# http client
yarn add axios

# stripe react native (native module; requires EAS build)
yarn add @stripe/stripe-react-native

# misc
yarn add formik yup
```

### 4) Initialize Firebase functions (backend)

Outside the mobile folder or in `/backend/functions`:

```bash
mkdir backend && cd backend
firebase init functions
# Choose Node 18 (or 20) and TypeScript or JavaScript (I'll show JS)
cd functions
yarn add stripe firebase-admin express busboy
```

---

# Step B — Backend: Firebase Cloud Functions (server-side Stripe logic)

Create `/backend/functions/index.js` (example code below). This uses Express to expose endpoints the app will call: `createExpressAccount`, `uploadVerificationFile`, `createPaymentIntent`, and `webhook`.

> **Note**: This is production-capable but simplified for clarity. In production you should validate requests (Auth tokens), add rate limits, logging, error handling, and use signed URLs for storage if needed.

**functions/index.js**

```js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const Stripe = require("stripe");
const fetch = require("node-fetch"); // or use axios
const Busboy = require("busboy");

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

const stripe = Stripe(functions.config().stripe.secret); // set with firebase functions:config:set

const app = express();
app.use(express.json({ limit: '10mb' }));

// Middleware: verify Firebase ID token (optional but recommended)
async function verifyFirebaseToken(req, res, next) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return res.status(401).send("Missing token");
  const idToken = auth.split("Bearer ")[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token error", err);
    res.status(401).send("Invalid token");
  }
}

// 1) Create a Stripe Express Account and return account link (onboarding)
app.post("/createExpressAccount", verifyFirebaseToken, async (req, res) => {
  const uid = req.user.uid;
  const { business_type = "individual", country = "US" } = req.body;

  try {
    // Create a Connect Account (Express)
    const account = await stripe.accounts.create({
      type: "express",
      country,
      business_type,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Save account ID in Firestore
    await db.collection("stripeAccounts").doc(uid).set({
      accountId: account.id,
      created: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // Create an account link so the user can finish onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: "https://your-app-refresh-url.example", // replace with your app URL or deep link
      return_url: "https://your-app-success-url.example",   // replace with deep link that navigates back to app
      type: "account_onboarding",
    });

    res.json({ accountId: account.id, accountLink: accountLink.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 2) Upload verification file to Stripe (server fetches file from Firebase Storage)
app.post("/uploadVerificationFile", verifyFirebaseToken, async (req, res) => {
  const uid = req.user.uid;
  const { accountId, storagePath, purpose = "identity_document" } = req.body;
  try {
    // Get signed URL or read file bytes from Cloud Storage
    const bucket = storage.bucket(functions.config().firebase.storage_bucket);
    const file = bucket.file(storagePath);
    const [buffer] = await file.download();

    const stripeFile = await stripe.files.create({
      file: {
        data: buffer,
        name: storagePath.split("/").pop(),
        type: "application/octet-stream",
      },
      purpose,
    });

    // Attach file to account as verification document
    await stripe.accounts.update(accountId, {
      individual: { verification: { document: { front: stripeFile.id } } }
    });

    // Update Firestore
    await db.collection("stripeAccounts").doc(uid).set({
      lastUploadedFile: stripeFile.id,
      updated: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    res.json({ fileId: stripeFile.id });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// 3) Create a PaymentIntent to charge a customer and transfer to connected account
app.post("/createPaymentIntent", verifyFirebaseToken, async (req, res) => {
  const { amount, currency = "usd", connectedAccountId } = req.body;
  try {
    // Create PaymentIntent specifying transfer_data.destination
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: ["card"],
      transfer_data: {
        destination: connectedAccountId, // money will ultimately be in the connected account's Stripe balance
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// 4) Webhook to listen for account.updated to track verification status
app.post("/webhook", express.raw({type: 'application/json'}), async (req, res) => {
  const webhookSecret = functions.config().stripe.webhook_secret;
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'account.updated') {
    const acct = event.data.object;
    // get owner uid by looking up Firestore where accountId == acct.id
    const query = await db.collection('stripeAccounts').where('accountId', '==', acct.id).get();
    if (!query.empty) {
      const doc = query.docs[0];
      await doc.ref.set({
        verification: acct.requirements || acct.individual || null,
        details_submitted: acct.details_submitted || false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }
  }

  res.json({received: true});
});

// Expose Express app as one Cloud Function
exports.api = functions.region('us-central1').https.onRequest(app);
```

**Set functions config (example):**

```bash
firebase functions:config:set stripe.secret="sk_test_xxx" stripe.publishable="pk_test_xxx" stripe.webhook_secret="whsec_xxx"
```

Deploy:

```bash
cd backend/functions
firebase deploy --only functions
```

> Replace `refresh_url` and `return_url` with deep links to your app. For mobile apps, you can use custom URL schemes or universal links.

---

# Step C — Frontend: Expo app

### 1) Firebase client setup: `/mobile-app/src/lib/firebase.js`

```js
// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOURS",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "...",
  appId: "...",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

### 2) API wrapper for calling Cloud Functions: `/mobile-app/src/lib/api.js`

```js
import axios from 'axios';
import { getAuth } from 'firebase/auth';

const BASE = "https://us-central1-YOUR_FIREBASE_PROJECT.cloudfunctions.net/api"; // change to your functions URL

async function authHeaders() {
  const token = await getAuth().currentUser.getIdToken(true);
  return { Authorization: `Bearer ${token}` };
}

export async function createExpressAccount(payload) {
  const headers = await authHeaders();
  const res = await axios.post(`${BASE}/createExpressAccount`, payload, { headers });
  return res.data;
}

export async function uploadVerificationFile(payload) {
  const headers = await authHeaders();
  const res = await axios.post(`${BASE}/uploadVerificationFile`, payload, { headers });
  return res.data;
}

export async function createPaymentIntent(payload) {
  const headers = await authHeaders();
  const res = await axios.post(`${BASE}/createPaymentIntent`, payload, { headers });
  return res.data;
}
```

### 3) Auth flow (simple email/password)

* `AuthScreen.js`: let user sign up / sign in using Firebase Auth.
* After sign up, navigate to `CreateBankIntroScreen`.

(Quick example:)

```js
// AuthScreen.js (very minimal)
import React, {useState} from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function AuthScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function onSignUp() {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigation.replace('CreateBankIntro');
    } catch (e) { alert(e.message) }
  }

  async function onSignIn() {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigation.replace('CreateBankIntro');
    } catch (e) { alert(e.message) }
  }

  return (
    <View style={{padding:20}}>
      <TextInput placeholder="email" value={email} onChangeText={setEmail} />
      <TextInput placeholder="password" secureTextEntry value={password} onChangeText={setPassword} />
      <Button title="Sign up" onPress={onSignUp} />
      <Button title="Sign in" onPress={onSignIn} />
    </View>
  );
}
```

### 4) Bank account creation screens & flow (key parts)

**CreateBankIntroScreen.js**: explains and has button to `createExpressAccount()`.

```js
// CreateBankIntroScreen.js
import React from 'react';
import { View, Text, Button } from 'react-native';
import { createExpressAccount } from '../lib/api';
import { auth } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function CreateBankIntroScreen({ navigation }) {
  async function startOnboarding() {
    try {
      const user = auth.currentUser;
      const res = await createExpressAccount({ country: "US" });
      // Optionally store the account link in Firestore / open it in WebView
      await setDoc(doc(db, 'stripeAccounts', user.uid), { accountId: res.accountId }, { merge: true });
      // open res.accountLink in an in-app browser or external browser
      navigation.navigate('DocumentUpload', { accountId: res.accountId });
      // you can alternatively open a WebView to res.accountLink to let user complete onboarding
    } catch(e) {
      alert(e.message);
    }
  }

  return (
    <View style={{padding:20}}>
      <Text style={{fontSize:20}}>Create Your Payment Account</Text>
      <Text>We will create a Stripe Express account so you can receive payments.</Text>
      <Button title="Start setup" onPress={startOnboarding}/>
    </View>
  );
}
```

**DocumentUploadScreen.js**: upload to Firebase Storage, then call `/uploadVerificationFile`.

```js
// DocumentUploadScreen.js
import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { uploadVerificationFile } from '../lib/api';
import { auth } from '../lib/firebase';

export default function DocumentUploadScreen({ route, navigation }) {
  const { accountId } = route.params;
  const [fileInfo, setFileInfo] = useState(null);

  async function pickFile() {
    const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (res.type === 'success') {
      setFileInfo(res);
    }
  }

  async function uploadToStorageAndSend() {
    if (!fileInfo) return alert('Pick a file first');
    try {
      const user = auth.currentUser;
      const storagePath = `verification/${user.uid}/${Date.now()}_${fileInfo.name}`;
      // fetch file as blob
      const response = await fetch(fileInfo.uri);
      const blob = await response.blob();
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, blob);
      // Call cloud function to fetch from storage and send to Stripe
      const result = await uploadVerificationFile({ accountId, storagePath, purpose: 'identity_document' });
      alert('Uploaded to Stripe: ' + result.fileId);
      navigation.navigate('Review', { accountId });
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <View style={{padding:20}}>
      <Button title="Pick ID file" onPress={pickFile} />
      {fileInfo && <Text>{fileInfo.name}</Text>}
      <Button title="Upload and verify" onPress={uploadToStorageAndSend} />
    </View>
  );
}
```

**ReviewAndSubmitScreen.js**: show collected data and create finalization.

**BankAccountSuccessScreen.js**: success UI.

### 5) Payments flow (charge a customer and transfer to connected account)

`PaymentScreen.js` will call `createPaymentIntent` endpoint to get a `client_secret`, then use `@stripe/stripe-react-native` to confirm the card payment.

Example (simplified) using stripe-react-native:

```js
import React, { useEffect, useState } from 'react';
import { View, Button } from 'react-native';
import { CardField, useConfirmPayment, initStripe } from '@stripe/stripe-react-native';
import { createPaymentIntent } from '../lib/api';
import { functionsPublishableKey } from '../lib/config'; // or fetch from your backend

export default function PaymentScreen({ route }) {
  const [clientSecret, setClientSecret] = useState(null);
  const { confirmPayment } = useConfirmPayment();
  useEffect(() => {
    // init stripe with publishable key; do once when app starts ideally
    initStripe({ publishableKey: 'pk_test_xxx' });
  }, []);

  async function startPayment() {
    // call backend to create a PaymentIntent
    const res = await createPaymentIntent({ amount: 1000, currency: 'usd', connectedAccountId: route.params.connectedAccountId });
    setClientSecret(res.clientSecret);
  }

  async function pay() {
    const { paymentIntent, error } = await confirmPayment(clientSecret, {
      type: 'Card',
      // billing details...
    });
    if (error) {
      alert(error.message);
    } else {
      alert('Payment successful: ' + paymentIntent.id);
    }
  }

  return (
    <View style={{padding:20}}>
      <CardField postalCodeEnabled={true} placeholders={{ number: '4242 4242 4242 4242' }} />
      <Button title="Create PaymentIntent" onPress={startPayment} />
      <Button title="Pay" onPress={pay} />
    </View>
  );
}
```

---

# Step D — Config & deployment checklist

1. **Set Firebase Functions Config**:

```bash
firebase functions:config:set stripe.secret="sk_test_xxx" stripe.publishable="pk_test_xxx" stripe.webhook_secret="whsec_xxx"
firebase deploy --only functions
```

2. **Set Storage bucket config**: Cloud Functions used `functions.config().firebase.storage_bucket` — ensure `firebase` config available or change to string `your-project.appspot.com`.

3. **Set up webhook**:

   * In Stripe Dashboard -> Developers -> Webhooks -> add endpoint:

     ```
     https://us-central1-YOUR_FIREBASE_PROJECT.cloudfunctions.net/api/webhook
     ```
   * Subscribe to `account.updated` and any events you need.
   * Copy webhook secret and set it in functions config (`stripe.webhook_secret`).

4. **Set return/refresh URLs** used in `accountLinks.create` to deep links for your app. For mobile, consider using universal links or `creditkidapp://onboarding-complete`. On completion Stripe will redirect to that URL which you must handle (open app and continue flow).

5. **EAS Build for iOS/Android** if you want to use `@stripe/stripe-react-native` (native modules) or Apple Pay:

   * Install EAS CLI: `npm i -g eas-cli`
   * Configure `eas.json` and run `eas build --platform ios` (you need Apple developer account for iOS builds).
   * For Apple Pay: create Apple Merchant ID in Apple Developer, add merchant id in app entitlements, and configure domain verification per Stripe docs.

---

# Apple Pay specific notes (important)

* Apple Pay needs:

  * Apple Merchant ID
  * App entitlement with merchant IDs
  * Domain verification file hosted at `https://<your-domain>/.well-known/apple-developer-merchantid-domain-association` (Stripe will give instructions and file)
  * Native build (EAS) — cannot test Apple Pay in Expo Go
* Stripe + Apple Pay in react-native:

  * Use `@stripe/stripe-react-native` and call `confirmApplePayPayment` flow.
  * Follow Stripe docs for domain verification then configure in Stripe Dashboard.

If you want, I can generate the EAS configs and show the exact steps for domain verification and entitlements.

---

# Security & compliance notes (must read)

* Do NOT put `sk_test_...` or any secret key in the client. Always use Cloud Functions for secret operations.
* For production, consider using **Custom** Connect accounts if you need full control; Express is simpler and Stripe handles UI.
* For identity documents, securely transmit and store them. Files uploaded to Stripe are sensitive — avoid storing them locally.
* Make sure your privacy policy and terms cover collecting KYC docs.
* PCI scope: using Stripe-hosted elements (`PaymentIntent` + stripe-native confirm) minimizes PCI burden.

---

# Minimal tests to run locally (development)

1. Use Expo locally for UI; you can test Auth and file upload to Storage (works in Expo Go).
2. Test Cloud Functions endpoints with `curl` or Postman using an ID token from Firebase Auth (get token from Firebase client).
3. Test Stripe flows in test mode:

   * create Express account
   * upload document
   * use test card `4242 4242 4242 4242` to confirm PaymentIntent
4. Use Stripe Dashboard to monitor created accounts and payment intents and watch webhooks.