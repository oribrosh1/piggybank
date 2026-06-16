/**
 * Register all API routes. Called from index.js with app and dependencies.
 */
const childInviteController = require("./controllers/childInviteController");
const childCardController = require("./controllers/childCardController");
const { sensitiveEndpointLimiter, generalLimiter, inviteLimiter } = require("./middleware/rateLimit");
const { verifyAppCheck, warnAppCheck } = require("./middleware/appCheck");
const { isSandbox } = require("./config/providerConfig");

/**
 * App Check: relaxed in sandbox (Stripe test / Unit sandbox).
 */
function applyAppCheckMiddleware(app) {
    if (isSandbox()) {
        return;
    }
    if (process.env.APPCHECK_RELAXED === "1") {
        app.use(warnAppCheck);
    } else {
        app.use(verifyAppCheck);
    }
}

function registerRoutes(app, opts) {
    const { verifyFirebaseToken, bankingController, posterController } = opts;

    app.use(generalLimiter);
    applyAppCheckMiddleware(app);

    // ----- Provider config (public to authenticated clients) -----
    app.get("/getProviderConfig", verifyFirebaseToken, bankingController.getProviderConfig);

    // ----- Banking / cards (provider-neutral; Stripe or Unit via BANKING_PROVIDER) -----
    // createCustomConnectAccount is registered in index.js with a larger body limit
    app.post("/createOnboardingLink", verifyFirebaseToken, bankingController.createOnboardingLink);
    app.get("/getAccountStatus", verifyFirebaseToken, bankingController.getAccountStatus);
    app.post("/updateAccountCapabilities", verifyFirebaseToken, bankingController.updateAccountCapabilities);
    app.get("/getFinancialAccountBalance", verifyFirebaseToken, bankingController.getFinancialAccountBalance);
    app.post("/retryProvisioning", verifyFirebaseToken, sensitiveEndpointLimiter, bankingController.retryProvisioning);
    app.post("/createIssuingCardholder", verifyFirebaseToken, bankingController.createIssuingCardholder);
    app.post("/createVirtualCard", verifyFirebaseToken, bankingController.createVirtualCard);
    app.get("/getCardDetails", verifyFirebaseToken, sensitiveEndpointLimiter, bankingController.getCardDetails);
    app.get("/getCardDetailsWithWallet", verifyFirebaseToken, bankingController.getCardDetailsWithWallet);
    app.post("/createPushProvisioningEphemeralKey", verifyFirebaseToken, sensitiveEndpointLimiter, bankingController.createPushProvisioningEphemeralKey);
    app.post("/createTestAuthorization", verifyFirebaseToken, sensitiveEndpointLimiter, bankingController.createTestAuthorization);

    // ----- Balance, Transactions, Account Details, Payouts -----
    app.get("/getBalance", verifyFirebaseToken, bankingController.getBalance);
    app.get("/getTransactions", verifyFirebaseToken, bankingController.getTransactions);
    app.get("/getAccountDetails", verifyFirebaseToken, bankingController.getAccountDetails);
    app.get("/getPayouts", verifyFirebaseToken, bankingController.getPayouts);
    app.post("/createPayout", verifyFirebaseToken, sensitiveEndpointLimiter, bankingController.createPayout);
    app.post("/addBankAccount", verifyFirebaseToken, sensitiveEndpointLimiter, bankingController.addBankAccount);
    app.post("/updateAccountInfo", verifyFirebaseToken, bankingController.updateAccountInfo);
    app.post("/acceptTermsOfService", verifyFirebaseToken, bankingController.acceptTermsOfService);

    // ----- Neutral aliases (new routes) -----
    app.post("/banking/account", verifyFirebaseToken, bankingController.createCustomConnectAccount);
    app.post("/banking/onboarding-link", verifyFirebaseToken, bankingController.createOnboardingLink);
    app.get("/banking/status", verifyFirebaseToken, bankingController.getAccountStatus);
    app.get("/banking/balance", verifyFirebaseToken, bankingController.getBalance);
    app.get("/banking/transactions", verifyFirebaseToken, bankingController.getTransactions);
    app.post("/cards/virtual", verifyFirebaseToken, bankingController.createVirtualCard);

    // ----- Test mode only (blocked in production) -----
    if (isSandbox()) {
        app.post("/testVerifyAccount", verifyFirebaseToken, bankingController.testVerifyAccount);
        app.post("/testCreateTransaction", verifyFirebaseToken, bankingController.testCreateTransaction);
        app.post("/testAddBalance", verifyFirebaseToken, bankingController.testAddBalance);
        app.post("/testLinkChildAccount", verifyFirebaseToken, childCardController.testLinkChildAccount);
    }

    // ----- Poster (protected) -----
    app.post("/generatePoster", verifyFirebaseToken, posterController.generatePoster);

    // ----- Child invite -----
    app.post("/sendChildInvite", verifyFirebaseToken, inviteLimiter, childInviteController.sendChildInvite);
    app.post("/claimChildInvite", sensitiveEndpointLimiter, verifyFirebaseToken, childInviteController.claimChildInvite);
    app.post("/revokeChildInvite", verifyFirebaseToken, childInviteController.revokeChildInvite);
    app.get("/getPendingInvite", verifyFirebaseToken, childInviteController.getPendingInvite);

    // ----- Child card management -----
    app.get("/getChildCard", verifyFirebaseToken, childCardController.getChildCard);
    app.post("/freezeChildCard", verifyFirebaseToken, childCardController.freezeChildCard);
    app.post("/unfreezeChildCard", verifyFirebaseToken, childCardController.unfreezeChildCard);
    app.post("/updateChildSpendingLimits", verifyFirebaseToken, childCardController.updateChildSpendingLimits);
    app.post("/updateChildBlockedCategories", verifyFirebaseToken, childCardController.updateChildBlockedCategories);
    app.get("/getChildTransactions", verifyFirebaseToken, childCardController.getChildTransactions);
    app.get("/getChildSpendingSummary", verifyFirebaseToken, childCardController.getChildSpendingSummary);
}

module.exports = { registerRoutes };
