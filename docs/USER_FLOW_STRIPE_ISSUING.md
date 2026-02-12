# User Flow & Stripe Connect + Issuing (US Individuals)

Three distinct stages for US-based parents using **Stripe Connect + Stripe Issuing**.

---

## Step 0 – App Signup

- Parent signs up with **Legal First Name**, **Legal Last Name** (for SSN match), **Email**, and **Password**.
- **No SSN in DB** – Stripe collects and verifies SSN during onboarding.
- Optional: store `legalFirstName` / `legalLastName` for display; `fullName` = first + last.

---

## Step 1 – Public Profile

- After signup, a **public non-commercial profile** is available at:
  - `https://creditkid.vercel.app/users/{profileSlug}` (name-based slug, e.g. `john-doe-abc12def`)
- This URL is used as the Stripe Connect account **`business_profile.url`** (required for Custom accounts).

---

## STAGE 1 – Create Stripe Connected Account

**Route:** `POST /createCustomConnectAccount` (Firebase Functions)

- **Settings:** Country `US`, Type `custom`, Business Type `individual`.
- **Capabilities:** `transfers`, `card_issuing`.
- **Business profile:**
  - `mcc`: `"7399"` (Business Services - Not Elsewhere Classified)
  - `url`: `https://creditkid.vercel.app/users/{profileSlug}`
  - `product_description`: `"Personal event fundraising and allowance management for family celebrations."`
- Stores `accountId` in `stripeAccounts` and `users`.

**Errors:** `capability_not_enabled` if Issuing is not enabled on the platform.

---

## STAGE 2 – Stripe Verification (KYC) & Banking

**Route:** `POST /createOnboardingLink`

- Redirects user to **Stripe Hosted Onboarding** via Account Links.
- Stripe collects: SSN, DOB, Address, **Bank Account (External Account)**.
- **Webhook:** `account.updated` – only treat as “ready for Issuing” when `capabilities.card_issuing === 'active'`.
- When `card_issuing` is active, `stripeAccounts` and `users` are updated (e.g. `cardIssuingActive`, `stripeAccountStatus: 'approved'`).

---

## STAGE 2.5 – Funding & Balance (Critical)

**Do not issue a card to a zero-balance account.**

1. **Balance check:** `GET /getIssuingBalance`
   - Returns `issuingAvailable` (cents), `canCreateCard: true` only when issuing balance > 0.

2. **Top-up:** `POST /topUpIssuing` with `{ amount }` (cents)
   - Uses Stripe Top-ups (from the connected account’s linked bank).
   - Handles `insufficient_funds` and `capability_not_enabled`.

3. **UI:** Enable the **“Create Card”** button only when `canCreateCard === true` (issuing balance > $0).

---

## STAGE 3 – Issuing Virtual Credit Card

Only when **verified** (card_issuing active) **and funded** (issuing balance > 0):

1. **Create Cardholder:** `POST /createIssuingCardholder`
   - Type: `individual`.
   - Include: Name, Email, Phone, Address (line1, city, state, postal_code, country US).

2. **Issue Virtual Card:** `POST /createVirtualCard`
   - Type: `virtual`, Currency: `usd`.
   - **Spending controls:** default `spending_limit` (e.g. per_authorization or daily) to prevent overdrafts.
   - Optional body: `{ spendingLimitAmount, spendingLimitInterval }`.

**Errors:** `insufficient_funds`, `capability_not_enabled` handled explicitly.

---

## Architecture Summary

| Purpose           | Route / Handler                          |
|-------------------|------------------------------------------|
| Account creation  | `POST /createCustomConnectAccount`       |
| Onboarding link   | `POST /createOnboardingLink`             |
| Funding / balance | `GET /getIssuingBalance`, `POST /topUpIssuing` |
| Issuing           | `POST /createIssuingCardholder`, `POST /createVirtualCard` |
| Webhook           | `POST /webhook` – `account.updated` (card_issuing active) |

---

## Environment (Functions)

- `STRIPE_SECRET_KEY` – Stripe secret (test/live).
- `PUBLIC_BASE_URL` or `APP_BASE_URL` – e.g. `https://creditkid.vercel.app` (for profile URL).
- `APP_SCHEME` – e.g. `myapp` (for onboarding return/refresh deep links).
- `STRIPE_WEBHOOK_SECRET` – for `account.updated` (and other) webhooks.

---

## Test Mode

- Use Stripe **Test Mode** keys for development.
- In test mode, top-ups and Issuing behavior follow Stripe’s test flows (e.g. test bank, test card funding).
