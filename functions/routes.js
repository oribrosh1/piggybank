/**
 * Register all API routes. Called from index.js with app and dependencies.
 */
const childInviteController = require("./controllers/childInviteController");
const { sensitiveEndpointLimiter, generalLimiter } = require("./middleware/rateLimit");

const isTestMode = () => (process.env.STRIPE_SECRET_KEY || "").startsWith("sk_test_");

function registerRoutes(app, opts) {
    const { verifyFirebaseToken, stripeController, posterController, PUBLIC_BASE_URL } = opts;

    app.use(generalLimiter);

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
    }

    // ----- Poster (protected) -----
    app.post("/generatePoster", verifyFirebaseToken, posterController.generatePoster);

    // ----- Child invite -----
    app.post("/getChildInviteLink", verifyFirebaseToken, (req, res) => {
        req.PUBLIC_BASE_URL = PUBLIC_BASE_URL;
        return childInviteController.getChildInviteLink(req, res);
    });
    app.post("/claimChildInvite", verifyFirebaseToken, (req, res) => childInviteController.claimChildInvite(req, res));
}

module.exports = { registerRoutes };
