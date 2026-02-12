# User Flow & Stripe Connect + Issuing (US Individuals)

User flow and Stripe integration for US-based individual users (parents) using **Stripe Connect + Stripe Issuing**. The solution is split into **THREE DISTINCT STAGES**.

---

## USER FLOW OVERVIEW (MANDATORY)

* **Step 0 – App Signup:** Parent signs up with Legal First/Last Name (SSN match), Email, and Password.
* **Step 1 – Public Profile:** Automatically generate a public, non-commercial profile page (e.g. `creditkid.app/users/{profileSlug}`) to serve as the Stripe `business_profile.url`.

---

## Step 0 – App Signup

- Parent signs up with **Legal First Name**, **Legal Last Name** (for SSN match), **Email**, and **Password**.
- **No SSN in DB** – Stripe collects and verifies SSN during onboarding.
- Optional: store `legalFirstName` / `legalLastName` for display; `fullName` = first + last.

---

## Step 1 – Public Profile

- After signup, a **public non-commercial profile** is available at:
  - `https://creditkid.app/users/{profileSlug}` (name-based slug, e.g. `john-doe-abc12def`)
- This URL is used as the Stripe Connect account **`business_profile.url`** (required for Custom accounts).

---

## STAGE 1 – Create the Stripe Connected Account

Implement server-side logic (Node.js/TypeScript) to create a **Stripe Custom Connected Account**.

**Route:** `POST /createCustomConnectAccount` (Firebase Functions)

* **Settings:** Country: `US`, Type: `custom`, Business Type: `individual`.
* **Capabilities:** `transfers`, `card_issuing`.
* **Business Profile:**
  * `mcc`: `"7399"` (Business Services - Not Elsewhere Classified) or `"7299"`.
  * `url`: The internally generated public user page (`https://creditkid.app/users/{profileSlug}`).
  * `product_description`: `"Personal event fundraising and allowance management for family celebrations."`
* Stores `accountId` in `stripeAccounts` and `users`.

**Errors:** `capability_not_enabled` if Issuing is not enabled on the platform.

---

## STAGE 2 – Stripe Verification (KYC) & Banking

Redirect user to **Stripe Hosted Onboarding** via Account Links.

**Route:** `POST /createOnboardingLink`

* **Requirement:** Stripe must collect SSN, DOB, Address, and **Bank Account (External Account)**.
* **Webhook Listener:** Create a webhook to listen for `account.updated`. Only proceed when `capabilities.card_issuing === 'active'`.
* When `card_issuing` is active, `stripeAccounts` and `users` are updated (e.g. `cardIssuingActive`, `stripeAccountStatus: 'approved'`).

---

## STAGE 2.5 – Funding & Balance Management (CRITICAL INTERMEDIATE STEP)

**Do not issue a card to a zero-balance account.** Implement the following:

1. **Balance Check:** Logic to check the `issuing` balance of the connected account.
   * **Route:** `GET /getIssuingBalance` – returns `issuingAvailable` (cents), `canCreateCard: true` only when issuing balance > 0.

2. **Top-up Mechanism:** Create a function to fund the account.
   * **Route:** `POST /topUpIssuing` with `{ amount }` (cents).
   * **Approach:** Use `Stripe.topups.create` (from the linked bank account) or a transfer from the platform to the connected account’s issuing balance.
   * Handles `insufficient_funds` and `capability_not_enabled`.

3. **UI Logic:** Ensure the “Create Card” button is only enabled/triggered once the `issuing.available` balance is > $0.

---

## STAGE 3 – Issuing Virtual Credit Card

Once verified AND funded:

1. **Create Cardholder:** Type: `individual`, include full KYC details (Name, Email, Phone, Address).
   * **Route:** `POST /createIssuingCardholder` – billing address (line1, city, state, postal_code, country US).

2. **Issue Virtual Card:** Type: `virtual`, Currency: `usd`.
   * **Route:** `POST /createVirtualCard`.
   * Attach to the cardholder, activate the card.

3. **Spending Controls:** Set a default `spending_limit` to prevent overdrafts.
   * Optional body: `{ spendingLimitAmount, spendingLimitInterval }`.

**Errors:** `insufficient_funds`, `capability_not_enabled` handled explicitly.

---

## Technical Constraints

* **No Sensitive Data in DB:** Never store full SSNs. Let Stripe handle KYC.
* **Error Handling:** Handle `insufficient_funds` and `capability_not_enabled` explicitly.
* **Architecture:** Separate routes for Account Creation, Onboarding Link, Funding, and Issuing.
* **Environment:** Use Stripe Test Mode logic.

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
- `PUBLIC_BASE_URL` or `APP_BASE_URL` – e.g. `https://creditkid.app` (for profile URL).
- `APP_SCHEME` – e.g. `myapp` (for onboarding return/refresh deep links).
- `STRIPE_WEBHOOK_SECRET` – for `account.updated` (and other) webhooks.

---

## Test Mode

- Use Stripe **Test Mode** keys for development.
- In test mode, top-ups and Issuing behavior follow Stripe’s test flows (e.g. test bank, test card funding).
