/**
 * Register all API routes. Called from index.js with app and dependencies.
 */
const childInviteController = require("./controllers/childInviteController");

function registerRoutes(app, opts) {
    const { verifyFirebaseToken, stripeController, posterController, PUBLIC_BASE_URL } = opts;

    // ----- Stripe Connect (protected) -----
    app.post("/createCustomConnectAccount", verifyFirebaseToken, stripeController.createCustomConnectAccount);
    app.post("/createOnboardingLink", verifyFirebaseToken, stripeController.createOnboardingLink);
    app.get("/getAccountStatus", verifyFirebaseToken, stripeController.getAccountStatus);
    app.post("/updateAccountCapabilities", verifyFirebaseToken, stripeController.updateAccountCapabilities);
    app.get("/getIssuingBalance", verifyFirebaseToken, stripeController.getIssuingBalance);
    app.post("/topUpIssuing", verifyFirebaseToken, stripeController.topUpIssuing);
    app.post("/createIssuingCardholder", verifyFirebaseToken, stripeController.createIssuingCardholder);
    app.post("/createVirtualCard", verifyFirebaseToken, stripeController.createVirtualCard);
    app.get("/getCardDetails", verifyFirebaseToken, stripeController.getCardDetails);
    app.post("/createTestAuthorization", verifyFirebaseToken, stripeController.createTestAuthorization);

    // ----- Balance, Transactions, Account Details, Payouts -----
    app.get("/getBalance", verifyFirebaseToken, stripeController.getBalance);
    app.get("/getTransactions", verifyFirebaseToken, stripeController.getTransactions);
    app.get("/getAccountDetails", verifyFirebaseToken, stripeController.getAccountDetails);
    app.get("/getPayouts", verifyFirebaseToken, stripeController.getPayouts);
    app.post("/createPayout", verifyFirebaseToken, stripeController.createPayout);
    app.post("/addBankAccount", verifyFirebaseToken, stripeController.addBankAccount);
    app.post("/updateAccountInfo", verifyFirebaseToken, stripeController.updateAccountInfo);
    app.post("/acceptTermsOfService", verifyFirebaseToken, stripeController.acceptTermsOfService);

    // ----- Test mode only -----
    app.post("/testVerifyAccount", verifyFirebaseToken, stripeController.testVerifyAccount);
    app.post("/testCreateTransaction", verifyFirebaseToken, stripeController.testCreateTransaction);
    app.post("/testAddBalance", verifyFirebaseToken, stripeController.testAddBalance);

    // ----- Poster (protected) -----
    app.post("/generatePoster", verifyFirebaseToken, posterController.generatePoster);

    // ----- Child invite -----
    app.post("/getChildInviteLink", verifyFirebaseToken, (req, res) => {
        req.PUBLIC_BASE_URL = PUBLIC_BASE_URL;
        return childInviteController.getChildInviteLink(req, res);
    });
    app.post("/claimChildInvite", (req, res) => childInviteController.claimChildInvite(req, res));
}

module.exports = { registerRoutes };
