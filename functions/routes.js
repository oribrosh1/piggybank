/**
 * Register all API routes. Called from index.js with app and dependencies.
 */
const childInviteController = require("./controllers/childInviteController");
const childCardController = require("./controllers/childCardController");
const { sensitiveEndpointLimiter, generalLimiter, inviteLimiter } = require("./middleware/rateLimit");
const { verifyAppCheck, warnAppCheck } = require("./middleware/appCheck");

const isTestMode = () => (process.env.STRIPE_SECRET_KEY || "").startsWith("sk_test_");

/**
 * App Check: skipped entirely when STRIPE_SECRET_KEY is sk_test_ (Stripe test mode on Functions).
 * With sk_live_: strict verifyAppCheck, unless APPCHECK_RELAXED=1 (warn-only for staging).
 */
function applyAppCheckMiddleware(app) {
    if (isTestMode()) {
        return;
    }
    if (process.env.APPCHECK_RELAXED === "1") {
        app.use(warnAppCheck);
    } else {
        app.use(verifyAppCheck);
    }
}

function registerRoutes(app, opts) {
    const { verifyFirebaseToken, stripeController, posterController, PUBLIC_BASE_URL } = opts;

    app.use(generalLimiter);
    applyAppCheckMiddleware(app);

    // ----- Stripe Connect (protected) -----
    // createCustomConnectAccount is registered in index.js with a larger body limit
    app.post("/createOnboardingLink", verifyFirebaseToken, stripeController.createOnboardingLink);
    app.get("/getAccountStatus", verifyFirebaseToken, stripeController.getAccountStatus);
    app.post("/updateAccountCapabilities", verifyFirebaseToken, stripeController.updateAccountCapabilities);
    app.get("/getFinancialAccountBalance", verifyFirebaseToken, stripeController.getFinancialAccountBalance);
    app.post("/retryProvisioning", verifyFirebaseToken, sensitiveEndpointLimiter, stripeController.retryProvisioning);
    app.post("/createIssuingCardholder", verifyFirebaseToken, stripeController.createIssuingCardholder);
    app.post("/createVirtualCard", verifyFirebaseToken, stripeController.createVirtualCard);
    app.get("/getCardDetails", verifyFirebaseToken, sensitiveEndpointLimiter, stripeController.getCardDetails);
    app.get("/getCardDetailsWithWallet", verifyFirebaseToken, stripeController.getCardDetailsWithWallet);
    app.post("/createPushProvisioningEphemeralKey", verifyFirebaseToken, sensitiveEndpointLimiter, stripeController.createPushProvisioningEphemeralKey);
    app.post("/createTestAuthorization", verifyFirebaseToken, sensitiveEndpointLimiter, stripeController.createTestAuthorization);

    // ----- Balance, Transactions, Account Details, Payouts -----
    app.get("/getBalance", verifyFirebaseToken, stripeController.getBalance);
    app.get("/getTransactions", verifyFirebaseToken, stripeController.getTransactions);
    app.get("/getAccountDetails", verifyFirebaseToken, stripeController.getAccountDetails);
    app.get("/getPayouts", verifyFirebaseToken, stripeController.getPayouts);
    app.post("/createPayout", verifyFirebaseToken, sensitiveEndpointLimiter, stripeController.createPayout);
    app.post("/addBankAccount", verifyFirebaseToken, sensitiveEndpointLimiter, stripeController.addBankAccount);
    app.post("/updateAccountInfo", verifyFirebaseToken, stripeController.updateAccountInfo);
    app.post("/acceptTermsOfService", verifyFirebaseToken, stripeController.acceptTermsOfService);

    // ----- Test mode only (blocked in production) -----
    if (isTestMode()) {
        app.post("/testVerifyAccount", verifyFirebaseToken, stripeController.testVerifyAccount);
        app.post("/testCreateTransaction", verifyFirebaseToken, stripeController.testCreateTransaction);
        app.post("/testAddBalance", verifyFirebaseToken, stripeController.testAddBalance);
        app.post("/testLinkChildAccount", verifyFirebaseToken, childCardController.testLinkChildAccount);
    }

    // ----- Poster (protected) -----
    app.post("/generatePoster", verifyFirebaseToken, posterController.generatePoster);

    // ----- Child invite -----
    app.post("/sendChildInvite", verifyFirebaseToken, inviteLimiter, childInviteController.sendChildInvite);
    app.post("/claimChildInvite", sensitiveEndpointLimiter, verifyFirebaseToken, childInviteController.claimChildInvite);
    app.post("/revokeChildInvite", verifyFirebaseToken, childInviteController.revokeChildInvite);
    app.get("/getPendingInvite", verifyFirebaseToken, childInviteController.getPendingInvite);

    // ----- Child card management (parent controls child's Issuing card) -----
    app.get("/getChildCard", verifyFirebaseToken, childCardController.getChildCard);
    app.post("/freezeChildCard", verifyFirebaseToken, childCardController.freezeChildCard);
    app.post("/unfreezeChildCard", verifyFirebaseToken, childCardController.unfreezeChildCard);
    app.post("/updateChildSpendingLimits", verifyFirebaseToken, childCardController.updateChildSpendingLimits);
    app.post("/updateChildBlockedCategories", verifyFirebaseToken, childCardController.updateChildBlockedCategories);
    app.get("/getChildTransactions", verifyFirebaseToken, childCardController.getChildTransactions);
    app.get("/getChildSpendingSummary", verifyFirebaseToken, childCardController.getChildSpendingSummary);

}

module.exports = { registerRoutes };
