# Controller-Service-Repository Architecture

## Folder structure

```
functions/
  index.js                 # Entry: Express app, route wiring, webhook, exports triggers
  stripeService.js         # Stripe API only (no Firestore) – used by StripeConnectService
  repositories/
    eventRepository.js     # Firestore: events (getById, update, updatePoster, getAll)
    userRepository.js      # Firestore: users (getById, update, setProfileSlug, setStripeAccount)
    stripeAccountRepository.js  # Firestore: stripeAccounts (getByUid, set, update, getByAccountId)
    storageRepository.js   # Firebase Storage: savePoster, downloadFile
  services/
    aiService.js           # Gemini/Imagen: generatePoster (prompt + image), uses event + storage repos
    stripeConnectService.js # Stripe Connect + Issuing: createCustomConnectAccount, onboarding, issuing; uses stripeService + repos
  controllers/
    posterController.js    # POST /generatePoster: validation, call AIService
    stripeController.js   # Stripe Connect routes: validation, call StripeConnectService
  triggers/                # (Optional next step) onEventCreated, onTransactionCreated, sendEventReminderSMS
  middleware/
    auth.js               # verifyFirebaseToken
  utils/
    errors.js             # AppError, handleError
```

## Refactored flows

- **generatePoster**: Controller → AIService (Gemini prompt + image) → eventRepository, storageRepository.
- **Stripe Connect**: Controller → StripeConnectService (stripeService + stripeAccountRepository, userRepository). Webhook `account.updated` → stripeConnectService.handleWebhookAccountUpdated.

## Environment variables

Unchanged: `process.env` is used in services/controllers (e.g. `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `PUBLIC_BASE_URL`). No central config file.
