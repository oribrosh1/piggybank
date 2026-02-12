# Deploy piggybank-website to Vercel via GitHub

Follow these steps to deploy the Next.js app to Vercel using your GitHub repo.

## Prerequisites

- GitHub repo pushed (e.g. `creditkid/piggybank` or your fork)
- [Vercel account](https://vercel.com/signup) (sign in with GitHub)

## 1. Connect the repo to Vercel

1. Go to [vercel.com/new](https://vercel.com/new).
2. Click **Import Git Repository** and choose **GitHub**.
3. Authorize Vercel to access your GitHub if prompted.
4. Select the **piggybank** repository (or the one that contains `piggybank-website`).

## 2. Configure the project (important: root directory)

Because the Next.js app lives in a subdirectory, set the **Root Directory**:

1. Click **Edit** next to "Root Directory".
2. Enter: **`piggybank-website`**
3. Confirm so that Vercel uses `piggybank-website` as the project root.

Leave these as default (they run from `piggybank-website`):

- **Framework Preset**: Next.js (auto-detected)
- **Build Command**: `next build` (default)
- **Output Directory**: (default)
- **Install Command**: `npm install` (default)

## 3. Add environment variables

Before deploying, add the required env vars in Vercel:

1. In the import screen, open **Environment Variables**.
2. Add each variable from [ENV_SETUP.md](./ENV_SETUP.md), for example:

| Name | Value | Environments |
|------|--------|---------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | (from Firebase) | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | (from Firebase) | All |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | (from Firebase) | All |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | (from Firebase) | All |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | (from Firebase) | All |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | (from Firebase) | All |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | (JSON string) | All |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_...` | All |
| `STRIPE_SECRET_KEY` | `sk_...` | All |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | All |
| `NEXT_PUBLIC_BASE_URL` | `https://your-app.vercel.app` (or custom domain) | All |

Use **test** Stripe keys for Preview/Development and **live** keys for Production if you use separate Stripe modes.

## 4. Deploy

1. Click **Deploy**.
2. Wait for the build to finish. Vercel will run `npm install` and `next build` inside `piggybank-website`.
3. Your site will be available at `https://<project-name>.vercel.app` (or your custom domain).

## 5. Automatic deploys from GitHub

- **Production**: every push to the default branch (e.g. `main` or `master`) deploys to production.
- **Preview**: every push to other branches (or every PR) gets a unique preview URL.

No extra config needed once the project is connected.

## 6. Stripe webhook (production)

After the first deploy you have a real URL:

1. In [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks), add an endpoint:
   - **URL**: `https://<your-vercel-domain>/api/webhooks/stripe`
   - **Events**: e.g. `payment_intent.succeeded`, `payment_intent.payment_failed`
2. Copy the **Signing secret** (`whsec_...`).
3. In Vercel: **Project → Settings → Environment Variables** → set `STRIPE_WEBHOOK_SECRET` for Production (and redeploy if needed).

## Troubleshooting

- **Build fails**: Ensure **Root Directory** is exactly `piggybank-website` (no leading/trailing slash).
- **Env errors**: Double-check names (e.g. `NEXT_PUBLIC_*` for client-side) and that no values have leading/trailing spaces.
- **404 on routes**: Confirm the deploy finished successfully and you’re opening the Vercel URL (not an old or local URL).
