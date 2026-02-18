# CreditKid / Piggybank — Project Overview

This document describes the **CreditKid** (Piggybank) app: what it does, how it’s built, and how to work with it.

---

## 1. What the project is

**CreditKid** is a mobile app (Expo React Native) that lets **parents**:

1. **Create events** (e.g. birthday parties) with AI-designed invitations, invite guests from contacts, send SMS invites, and track RSVPs.
2. **Get a virtual bank** — a Stripe Connect (Custom) account — so that gift payments go to a single balance instead of scattered gift cards.
3. **Stripe Issuing** — add funds to an Issuing balance and create a **virtual card** the child can use.
4. **Apple Pay** — (when configured) add the virtual card to Apple Wallet for in-store and in-app payments.

**Child flow**: A child can open the app via an invite link, claim the link, and (when implemented) use the virtual card (e.g. via Apple Pay). Parents see balance and activity on the Banking screen.

So the project covers: **events + invitations**, **Stripe Connect + balance + payouts**, **Stripe Issuing + virtual card**, and (optionally) **Apple Pay**.

---

## 2. High-level architecture

- **Frontend**: Expo (React Native) app using **Expo Router** for file-based routing. Uses **Firebase Auth** (email/password, Google, Apple), **Firestore** for users/events/families, and **Firebase Storage** for uploads. All Stripe operations go through **Firebase Cloud Functions** (HTTPS API). The app uses **@stripe/stripe-react-native** for payment UI and Apple Pay (requires a native/EAS build).
- **Backend**: **Firebase Cloud Functions** (Node.js) in `functions/`. One HTTP function `api` is an Express app that:
  - Verifies Firebase ID token on protected routes.
  - Handles Stripe Connect (create Custom account, onboarding link, account status, capabilities, Issuing balance, top-up, cardholder, virtual card, test authorization).
  - Handles Stripe webhooks (e.g. `account.updated`) with raw body.
  - Poster generation (AI) and any other HTTP endpoints registered in `routes`.
- **Stripe**: Connect **Custom** accounts (not Express). KYC/onboarding can be Stripe-hosted or custom UI; the backend creates the account and onboarding link. **Stripe Issuing** is used to create virtual cards funded from the connected account’s Issuing balance (funded from Connect balance). Payments to the parent can be implemented with PaymentIntent/Checkout with `transfer_data.destination` to the Connect account.

---

## 3. Tech stack

| Layer | Technologies |
|--------|----------------|
| **App** | Expo SDK 54, React 19, React Native, TypeScript |
| **Navigation** | Expo Router (file-based), React Navigation (tabs + stack) |
| **Auth** | Firebase Auth (email/password, Google Sign-In, Apple), Zustand + SecureStore for session |
| **Data** | Firestore (`@react-native-firebase/firestore`), Firebase Storage |
| **API** | Axios → Cloud Functions base URL (see `EXPO_PUBLIC_API_BASE_URL`) |
| **Payments / Card** | Stripe (server-side only), `@stripe/stripe-react-native` (client for Payment Sheet / Apple Pay) |
| **Backend** | Firebase Cloud Functions (Node), Express, Stripe Node SDK, Firestore, Storage, Twilio (SMS), optional Gemini (poster) |
| **State** | Zustand (auth), React Query (TanStack Query) where used |

---

## 4. Repository structure (relevant parts)

```
piggybank/
├── app/                          # Expo Router pages (routes)
│   ├── _layout.tsx               # Root layout (auth listener, QueryClient, Stack)
│   ├── index.tsx                 # Entry: redirect by auth / child token
│   ├── (auth)/                   # Auth group: login, signup, email-signin
│   ├── (tabs)/                   # Tab navigator: home, banking, create-event, my-events, profile
│   ├── banking/setup/            # Banking onboarding: identity-verification, personal-info, issuing-card, success, etc.
│   ├── create-event/             # Create event: event-type, event-details, select-guests
│   ├── event-dashboard/         # Event dashboard [id], edit, add-guests
│   ├── event-detail/             # Public event detail [id]
│   ├── child.tsx                 # Child invite claim (from SMS/link)
│   └── screens/                  # Legacy / shared screen components (e.g. CreateBankIntroScreen)
├── src/
│   ├── components/               # Reusable UI
│   │   ├── banking-screen/       # Banking tab: BalanceCard, WavyDivider, NoAccount, Pending, VirtualCard, ApprovedContent, etc.
│   │   ├── create-event/         # Event creation (EventDetailsScreen pieces, modals, etc.)
│   │   ├── events/               # Event dashboard (EventHeader, GuestListCard, AIPosterGenerator, etc.)
│   │   ├── home/                 # Home tab (StepCard, EventCard, QuickActions, etc.)
│   │   ├── banking/              # KYC/verification (DocumentUploadCard, IdTypeSelector, etc.)
│   │   └── common/               # Button, Input, Card, Modal
│   ├── screens/                  # Screen logic + layout (e.g. BankingScreen, HomeScreen, EventDetailsScreen)
│   ├── lib/
│   │   ├── api.ts                # All HTTP calls to Cloud Functions (Stripe, account, balance, payouts, etc.)
│   │   ├── eventService.ts       # Event CRUD, Firestore events + user updates
│   │   ├── userService.ts        # User profile, Firestore users
│   │   └── familyService.ts      # Families, child linking, virtual cards (Firestore)
│   ├── utils/auth/               # useAuth, store (Zustand), auth modal
│   ├── firebase.ts               # Firebase app init (used by client)
│   └── hooks/
├── types/                        # Shared TypeScript types (routes, user, events, verifications)
├── functions/                    # Firebase Cloud Functions
│   ├── index.js                  # Express app, webhook, route registration, trigger exports
│   ├── controllers/              # stripeController, webhookController, posterController
│   ├── services/                # stripeConnectService, aiService
│   ├── repositories/             # eventRepository, userRepository, stripeAccountRepository, storageRepository
│   ├── middleware/               # auth (verifyFirebaseToken)
│   ├── triggers/                 # onEventCreated, onTransactionCreated, sendEventReminderSMS
│   └── ARCHITECTURE.md           # Backend architecture notes
├── package.json                  # App dependencies (Expo, Stripe RN, Firebase, etc.)
├── README.md                     # Implementation plan (Stripe Connect + Expo)
├── redmes.md                     # Notes (e.g. Hebrew) on architecture and Stripe/Apple Pay
└── project.md                    # This file
```

---

## 5. App routes (summary)

- **Auth**: `/(auth)/login`, `/(auth)/signup`, `/(auth)/email-signin`
- **Tabs**: `/(tabs)/home`, `/(tabs)/banking`, `/(tabs)/create-event`, `/(tabs)/my-events`, `/(tabs)/profile`
- **Banking setup**: `/banking/setup/identity-verification`, `personal-info`, `issuing-card`, `success`, `apple-pay-setup`, etc.
- **Create event**: `/create-event/event-type`, `event-details`, `select-guests`, `review-invitation`
- **Event**: `/event-dashboard/[id]`, `edit/[id]`, `add-guests/[id]`; `/event-detail/[id]`
- **Child**: `/child` (with `?token=...` for invite claim)
- **Types and helpers**: `types/routes.ts` exports a `routes` object and types for type-safe navigation.

---

## 6. Main user flows

1. **Auth**  
   User opens app → `app/index.tsx` redirects to login or home based on auth. Login/signup can use email or providers (Google, Apple). Auth state is in Zustand and persisted (e.g. SecureStore on native).

2. **Home**  
   Home tab shows onboarding steps (create event → get virtual card → link child → pay with Apple Pay) and active events. User can start “Create Event” or go to Banking.

3. **Create event**  
   User picks event type → event details (name, date, time, location, optional fields) → select guests (contacts) → review invitation. Event is written to Firestore; Cloud Function `onEventCreated` can create/link Stripe Connect account and send SMS invites (Twilio).

4. **Banking**  
   - **No account**: CTA to set up credit (go to banking setup).
   - **Pending**: KYC/verification in progress; user can refresh status.
   - **Approved**: Balance card, virtual card (if created), Add to Apple Pay, Issuing balance and top-up, “Create virtual card,” Stripe Connected Account (balance + transactions), balance breakdown, withdraw to bank, linked bank account, payout history. Optional “Action required” if Stripe has `currently_due` requirements. In `__DEV__`, test actions (verify account, add test payment/balance) are shown.

5. **Banking setup**  
   Identity verification → personal info (Stripe Custom account creation with KYC data, optional bank account) → document upload if needed → issuing card (cardholder + virtual card) → success. Backend creates Custom Connect account, returns onboarding link when needed, and manages Issuing cardholder and card.

6. **Child**  
   Child opens link (e.g. from SMS) with token → `child` route with `?token=...` → claim flow (backend validates token, links child to event/card). Parent can see and manage the linked card.

---

## 7. Backend (Cloud Functions)

- **Entry**: `functions/index.js`  
  - Express app with CORS, JSON body (except webhook).  
  - `POST /webhook` uses `express.raw()` and Stripe webhook handler.  
  - All other routes registered via `require("./routes").registerRoutes(app, { ... })`.  
  - Exports: `api` (HTTP), `onEventCreated`, `onTransactionCreated`, `sendEventReminderSMS`.

- **Stripe**  
  - Controller: `stripeController` (createCustomConnectAccount, createOnboardingLink, getAccountStatus, updateAccountCapabilities, getIssuingBalance, topUpIssuing, createIssuingCardholder, createVirtualCard, getCardDetails, createTestAuthorization).  
  - Service: `stripeConnectService` (uses Stripe SDK and repositories).  
  - Webhook: `account.updated` (and others as needed) to update Stripe account status in Firestore.

- **Repositories**  
  Firestore: `events`, `users`, `stripeAccounts`; Storage for files. See `functions/ARCHITECTURE.md`.

- **Triggers**  
  - `onEventCreated`: On new event document, optionally create/update Stripe Connect account and send SMS.  
  - `onTransactionCreated`: On new transaction (e.g. Issuing), notify or update state.  
  - `sendEventReminderSMS`: Scheduled (or callable) to send event reminders via Twilio.

- **Secrets / config**  
  Stripe key from `process.env.STRIPE_SECRET_KEY` (or Firebase config). No Stripe secret in the client.

---

## 8. Client API (`src/lib/api.ts`)

The app calls the Cloud Function base URL (e.g. `EXPO_PUBLIC_API_BASE_URL`). All requests that need auth send the Firebase ID token in the `Authorization` header.

**Examples of exported functions** (see `api.ts` for full list and types):

- **Account**: `createExpressAccount`, `createCustomConnectAccount`, `getAccountStatus`, `updateAccountCapabilities`, `createOnboardingLink`
- **Issuing**: `getIssuingBalance`, `topUpIssuing`, `createIssuingCardholder`, `createVirtualCard`, `getCardDetails`, `createTestAuthorization`
- **Balance & payouts**: `getBalance`, `createPayout`, `getTransactions`, `getAccountDetails`, `getPayouts`, `addBankAccount`, `updateAccountInfo`
- **Verification**: `uploadVerificationFile`, `acceptTermsOfService`
- **Payments**: `createPaymentIntent`
- **Testing** (dev): `testVerifyAccount`, `testCreateTransaction`, `testAddBalance`
- **Child**: `getChildInviteLink`, `claimChildInvite`

Types (e.g. `GetBalanceResponse`, `GetAccountDetailsResponse`, `Transaction`, `Payout`, `ExternalBankAccount`) are defined in `api.ts` and used by the Banking UI and hooks.

---

## 9. Firestore (main collections)

- **users**  
  User profile: `uid`, email, name, KYC/verification status, Stripe account id, onboarding step, etc. Updated by app and by Cloud Functions (e.g. after Stripe webhook or account creation).

- **events**  
  Event docs: creator, event type, name, date, time, location, guests, status, `stripeAccountId`, poster URL, etc. Created/updated by `eventService` and triggers.

- **stripeAccounts**  
  One doc per user (uid): `accountId` (Stripe Connect account id), capabilities, status, etc. Used by Stripe Connect service and webhook.

- **families**  
  Used by `familyService` for parent–child linking and virtual card assignment.

- **virtualCards**  
  Virtual card records linked to users/events; used for child card assignment and spending (see `familyService`).

---

## 10. Auth

- **Firebase Auth** is the source of truth. `src/utils/auth/useAuth.ts` subscribes to `onAuthStateChanged`, updates Zustand store, and (on native) syncs to SecureStore.
- **Root layout** (`app/_layout.tsx`) runs `initiate()` so auth is ready before redirects. Entry (`app/index.tsx`) redirects to login or home; child token in URL sends to `/child?token=...`.
- **Protected routes**: Tabs and banking/create-event flows assume the user is logged in (redirect from index if not). API calls attach the Firebase ID token for backend verification.

---

## 11. Environment and running

- **App**  
  - `EXPO_PUBLIC_API_BASE_URL`: Cloud Functions URL (e.g. `https://us-central1-<project>.cloudfunctions.net/api`).  
  - Firebase config (API key, project id, etc.) in app config or env.  
  - Run: `npm start` / `expo start`. For Stripe React Native and Apple Pay use a **development build** (e.g. EAS Build), not Expo Go.

- **Functions**  
  - `functions/`: `npm install`, then set env (e.g. `.env` or Firebase config): `STRIPE_SECRET_KEY`, `PUBLIC_BASE_URL` (or `APP_BASE_URL`), Twilio vars if using SMS, Gemini if using poster AI).  
  - Deploy: `firebase deploy --only functions`.  
  - Stripe webhook URL: `https://us-central1-<project>.cloudfunctions.net/api/webhook` (subscribe to `account.updated` and any other events you need).

- **Stripe**  
  - Use **test mode** keys for development.  
  - Enable **Connect** and **Issuing** in Stripe Dashboard; complete Issuing onboarding if required.  
  - Apple Pay: Merchant ID, domain verification, and native build (see README and redmes.md).

---

## 12. Security and compliance

- **Stripe secret key** is only in the backend (env or Firebase config). The app never sees it.
- **KYC/identity**: Handled by Stripe (onboarding or custom forms). Document uploads can go to Storage; backend sends to Stripe. Comply with privacy policy and terms when collecting identity data.
- **PCI**: Using Stripe’s APIs and Stripe-hosted or Stripe-native UI (PaymentIntent, Issuing, stripe-react-native) keeps card data out of your systems and reduces PCI scope.
- **Auth**: All sensitive API routes verify the Firebase ID token (middleware in Cloud Functions).

---

## 13. Key files reference

| Purpose | File(s) |
|--------|--------|
| App entry & auth redirect | `app/index.tsx`, `app/_layout.tsx` |
| Tabs | `app/(tabs)/_layout.tsx`, `app/(tabs)/home.tsx`, `app/(tabs)/banking.tsx` |
| Banking UI | `src/screens/BankingScreen/`, `src/components/banking-screen/*` |
| Banking logic | `src/screens/BankingScreen/useBankingScreen.ts` |
| Type-safe routes | `types/routes.ts` |
| API client & types | `src/lib/api.ts` |
| Events | `src/lib/eventService.ts`, `src/screens/HomeScreen/`, `src/components/events/` |
| Auth state | `src/utils/auth/useAuth.ts`, `src/utils/auth/store` |
| Functions entry | `functions/index.js` |
| Stripe backend | `functions/controllers/stripeController.js`, `functions/services/stripeConnectService.js` |
| Triggers | `functions/triggers/firestoreTriggers.js`, `functions/triggers/schedulerTriggers.js` |

---

## 14. README and other docs

- **README.md**: High-level implementation plan for Expo + Firebase + Stripe Connect (account creation, verification upload, PaymentIntent, webhook, Apple Pay notes).
- **redmes.md**: Additional notes (including in Hebrew) on architecture, Stripe Connect vs Express, Issuing, Apple Pay entitlements, and Expo limitations.
- **functions/ARCHITECTURE.md**: Backend controller–service–repository layout and env vars.

This **project.md** is the single place that explains the **current** project end-to-end: events, banking, Stripe Connect, Issuing, and how the app and backend fit together.
