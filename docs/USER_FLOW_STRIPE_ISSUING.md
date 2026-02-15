# User Flow & Stripe Connect + Issuing (US Individuals)

Complete end-to-end user flow and Stripe integration for an **Expo (React Native)** app targeting US-based individual users (parents). Uses **Stripe Connect Custom** and **Stripe Issuing**.

**CRITICAL: The solution is split into FOUR DISTINCT STAGES. Do NOT merge stages or simplify the logic.**

---

## USER FLOW & ARCHITECTURE

### Step 0 – App Signup (Mobile)

- Parent signs up with **Legal First Name**, **Legal Last Name** (for SSN match), **Email**, and **Password**.
- **No SSN in DB** – Stripe collects and verifies SSN during hosted onboarding.
- Store `legalFirstName` / `legalLastName`; derive `fullName` and `profileSlug` for the public profile URL.

### Step 1 – Public Profile Generation (Server)

- **Automatically** generate a public-facing, non-commercial profile page to serve as the Stripe **`business_profile.url`**.
- URL pattern: `https://yourplatform.com/users/{profileSlug}` (e.g. `https://creditkid.app/users/john-doe-abc12def`).
- Resolve by `profileSlug` (name-based) or by `userId` for backward compatibility.

---

## STAGE 1 – Stripe Account Creation (Backend)

Implement **Node.js/TypeScript** logic to create a **Stripe Custom Connected Account**.

| Item | Value |
|------|--------|
| **Route** | `POST /createCustomConnectAccount` |
| **Country** | `US` |
| **Type** | `custom` |
| **Business Type** | `individual` |
| **Capabilities** | `transfers`, `card_issuing` |
| **business_profile** | `mcc: "7399"`, `url: "[Generated User URL]"`, `product_description: "Personal event fundraising and family allowance management."` |

- **Output:** Return `account.id` and save it to the user record (e.g. `stripeAccounts`, `users`).
- **Errors:** Handle `capability_not_enabled` if Issuing is not enabled on the **platform**.  
  **Important:** The **platform** Stripe account (your main Dashboard account, not the connected account) must be **onboarded to Stripe Issuing** before you can request `card_issuing` for connected accounts. In Stripe Dashboard go to **Issuing** and complete the platform’s Issuing application if you see that error.

---

## STAGE 2 – Hosted Onboarding for Expo (Mobile & Backend)

**Do NOT use embedded components.** Use **Stripe Hosted Onboarding** only.

### Backend

- Create an **Account Link** (`account_links`) for the connected account.
- Set **collection_options**: `{ fields: "eventually_due" }` so Stripe collects KYC (SSN, DOB, Address, Bank Account) via the hosted flow.
- **return_url:** e.g. `creditkidapp://stripe-callback` (or `creditkidapp://banking/setup/success`) to bring the user back to the app after onboarding.
- **refresh_url:** e.g. `creditkidapp://banking/setup/stripe-connection?refresh=true` for link refresh.

### Mobile (Expo)

- Use **expo-web-browser** (e.g. `WebBrowser.openAuthSessionAsync` or `openBrowserAsync`) to open the Stripe Onboarding URL.
- **Deep linking:** Configure the app scheme and return URL so the user returns to the app once KYC (SSN, DOB, Address, Bank Account) is complete.

### Webhook

- Monitor **`account.updated`**.
- Only enable the next step when **`capabilities.card_issuing === 'active'`**.
- Update `stripeAccounts` and `users` (e.g. `cardIssuingActive`, `stripeAccountStatus: 'approved'`).

### Errors

- Handle **`link_expired`** (re-create account link and redirect user).
- Handle **KYC/verification failures** (e.g. `requirements.eventually_due`, account not yet verified) and surface a clear message (e.g. `KYC_failed` or "Verification incomplete").

---

## How to do onboarding (step-by-step)

### In the app (recommended)

1. **Start banking setup**  
   User opens the **Banking** tab (bottom nav), then taps the green **"+ CREATE PIGGY BANK"** button. That navigates to the **Personal info** screen (`/banking/setup/personal-info`, `app/banking/setup/personal-info.tsx`).

2. **Step 1 – Personal info**  
   User fills in: First name, Last name, Email (from auth), Phone, DOB, Address (or use Google Places). Accept ToS. Tap **Next**.

3. **Step 2 – Stripe Hosted Onboarding**  
   On the next **Next**:
   - App calls **`createCustomConnectAccount({ country: "US" })`** (creates Connect account if needed).
   - App calls **`createOnboardingLink()`** to get a Stripe Account Link URL.
   - App opens that URL with **`Linking.openURL(url)`** (browser or in-app browser).
   - User completes **Stripe’s hosted form**: identity (SSN, DOB), address, **bank account** (for funding/top-up). No SSN or bank details are stored in your app.
   - When done, Stripe redirects to **return_url** (e.g. `creditkidapp://banking/setup/success`), which deep-links the user back to the app’s success screen.

4. **After onboarding**  
   Poll **`getAccountStatus`** or rely on **`account.updated`** webhook; when **`capabilities.card_issuing === 'active'`**, user can proceed to **Stage 3** (fund account) and **Stage 4** (issue card).

### Environment (backend)

In **`functions/.env`**:

- **`APP_SCHEME`** – Must match the app’s URL scheme (e.g. `creditkidapp` in `app.json`). Used to build return/refresh URLs.
- **`STRIPE_RETURN_PATH`** (optional) – Path after scheme for return URL. Default: `banking/setup/success` → `creditkidapp://banking/setup/success`.
- **`STRIPE_REFRESH_PATH`** (optional) – Path for refresh URL when the link expires. Default: `banking/setup/stripe-connection?refresh=true`.

So return URL = `{APP_SCHEME}://{STRIPE_RETURN_PATH}`, refresh URL = `{APP_SCHEME}://{STRIPE_REFRESH_PATH}`.

### Deep linking

- **Expo:** `app.json` / `app.config.js` must set **`scheme`** to the same value as `APP_SCHEME` (e.g. `creditkidapp`).
- Stripe redirects to that scheme + path (e.g. `creditkidapp://banking/setup/success`). Expo Router should have a route that handles that path (e.g. `app/banking/setup/success.tsx`).

### Getting a new link if it expired

If the user sees “link expired” or leaves the flow and comes back later:

- Call **`createOnboardingLink()`** again (same Firebase user; backend uses their existing `accountId` from `stripeAccounts`).
- Open the new URL. **refresh_url** is used when Stripe needs to issue a new link (user can be sent to that URL to retry).

---

## STAGE 3 – Funding & Intermediate Balance Check (THE "MIDDLE" STEP)

**A card cannot spend without a balance.**

### Balance verification

- Implement a check for **`issuing.available`** balance (e.g. `GET /getIssuingBalance`).
- Return `issuingAvailable` (cents) and a flag such as `canCreateCard: true` only when issuing balance **> 0**.

### Top-up logic

- Implement a **"Fund Account"** feature using **`Stripe.topups.create`** to pull funds from the linked Bank Account (ACH) into the account’s **Issuing Balance**.
- **Route:** `POST /topUpIssuing` with `{ amount }` (cents).
- **Errors:** Handle `insufficient_funds` and `capability_not_enabled`.

### UI constraint

- The **"Issue Card"** button must remain **locked/hidden** until **Issuing Balance > $0**.

---

## STAGE 4 – Card Issuing & Activation

Only when the account is **Verified** (card_issuing active) **and Funded** (issuing balance > 0):

### Create cardholder

- Use the **verified individual** data (name, email, phone, address: line1, city, state, postal_code, country US).
- **Route:** `POST /createIssuingCardholder`.

### Issue virtual card

- **Type:** `virtual`, **Currency:** `usd`.
- **Route:** `POST /createVirtualCard`.
- **Activation:** Ensure the card is set to **active** after creation.

### Security – card sensitive details

- **Implement a server-side endpoint** to fetch card sensitive details (number, CVV) **securely** via Stripe.
- Use Stripe’s **Retrieve a card** with **expand** `number` and `cvc` only on the server, and return to the authenticated cardholder only (never store full card number or CVV in your database).
- **Route (example):** `GET /getCardDetails` – verifies the requesting user owns the card, then retrieves and returns the details once (or use Issuing Elements / ephemeral keys for PCI-compliant display).

---

## Technical Requirements

| Requirement | Details |
|-------------|---------|
| **Language** | TypeScript for both Expo and Backend (backend may be Node.js/JS with types where applicable). |
| **Error handling** | Handle **`insufficient_funds`**, **`KYC_failed`** (or verification failure), and **`link_expired`** explicitly. |
| **Security** | **Never** store SSN or full card numbers in your database. |
| **Separation of concerns** | Keep Stripe logic in a dedicated **StripeService** file (backend). |

---

## Architecture Summary

| Purpose | Route / Handler |
|--------|------------------|
| Account creation | `POST /createCustomConnectAccount` |
| Onboarding link | `POST /createOnboardingLink` (Account Links, `eventually_due`) |
| Balance check | `GET /getIssuingBalance` |
| Fund account | `POST /topUpIssuing` (Stripe.topups.create) |
| Cardholder | `POST /createIssuingCardholder` |
| Virtual card | `POST /createVirtualCard` |
| Card details (secure) | `GET /getCardDetails` (server-side only, expand number & cvc) |
| Webhook | `POST /webhook` – `account.updated` (proceed when card_issuing active) |

---

## Environment (Functions)

- `STRIPE_SECRET_KEY` – Stripe secret (test/live).
- `PUBLIC_BASE_URL` or `APP_BASE_URL` – e.g. `https://creditkid.app` (for profile URL).
- `APP_SCHEME` – e.g. `creditkidapp` (for onboarding return/refresh deep links).
- `STRIPE_RETURN_PATH` – (optional) Path after scheme for return URL, e.g. `stripe-callback` → `creditkidapp://stripe-callback`. Default: `banking/setup/success`.
- `STRIPE_REFRESH_PATH` – (optional) Path for refresh URL. Default: `banking/setup/stripe-connection?refresh=true`.
- `STRIPE_WEBHOOK_SECRET` – for `account.updated` (and other) webhooks.

---

## Test Mode

- Use Stripe **Test Mode** keys for development.
- In test mode, top-ups and Issuing follow Stripe’s test flows (e.g. test bank, test card funding).
