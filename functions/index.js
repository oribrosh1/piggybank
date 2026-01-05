const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Load environment variables from .env file
require('dotenv').config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

// Initialize Stripe with your secret key from environment variable
// Make sure STRIPE_SECRET_KEY is set in functions/.env file
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();

// Enable CORS for all routes
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));

// Middleware: Verify Firebase ID token
async function verifyFirebaseToken(req, res, next) {
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid authorization header" });
    }

    const idToken = auth.split("Bearer ")[1];
    try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        req.user = decoded;
        next();
    } catch (err) {
        console.error("Token verification error:", err);
        res.status(401).json({ error: "Invalid token" });
    }
}

// ============================================
// 1) CREATE STRIPE EXPRESS ACCOUNT
// ============================================
app.post("/createExpressAccount", verifyFirebaseToken, async (req, res) => {
    const uid = req.user.uid;
    const {
        business_type = "individual",
        country = "US",
        email
    } = req.body;

    try {
        console.log(`Creating Express account for user ${uid}`);

        // Create a Stripe Connect Express Account
        const account = await stripe.accounts.create({
            type: "express",
            country,
            email: email || req.user.email,
            business_type,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
            settings: {
                payouts: {
                    schedule: {
                        interval: 'manual', // or 'daily', 'weekly', 'monthly'
                    },
                },
            },
        });

        console.log(`Created account: ${account.id}`);

        // Save account ID in Firestore
        await db.collection("stripeAccounts").doc(uid).set({
            accountId: account.id,
            country,
            business_type,
            created: admin.firestore.FieldValue.serverTimestamp(),
            status: 'pending',
        }, { merge: true });

        // Create an account link for onboarding
        // For mobile apps, use deep links matching your app.json scheme
        // Default: 'myapp' (from app.json line 8: "scheme": "myapp")
        const appScheme = process.env.APP_SCHEME || 'myapp';
        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: `${appScheme}://banking/setup/stripe-connection?refresh=true`,
            return_url: `${appScheme}://banking/setup/success`,
            type: "account_onboarding",
        });

        res.json({
            accountId: account.id,
            accountLink: accountLink.url,
            success: true
        });
    } catch (err) {
        console.error("Error creating Express account:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// 2) GET ACCOUNT STATUS
// ============================================
app.get("/getAccountStatus", verifyFirebaseToken, async (req, res) => {
    const uid = req.user.uid;

    try {
        // Get account ID from Firestore
        const doc = await db.collection("stripeAccounts").doc(uid).get();

        if (!doc.exists) {
            return res.json({ exists: false });
        }

        const { accountId } = doc.data();

        // Retrieve account from Stripe
        const account = await stripe.accounts.retrieve(accountId);

        // Update Firestore with latest status
        await db.collection("stripeAccounts").doc(uid).update({
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            details_submitted: account.details_submitted,
            requirements: account.requirements,
            updated: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.json({
            exists: true,
            accountId: account.id,
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            details_submitted: account.details_submitted,
            requirements: account.requirements,
        });
    } catch (err) {
        console.error("Error getting account status:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// 3) UPLOAD VERIFICATION FILE TO STRIPE
// ============================================
app.post("/uploadVerificationFile", verifyFirebaseToken, async (req, res) => {
    const uid = req.user.uid;
    const { accountId, storagePath, purpose = "identity_document" } = req.body;

    if (!accountId || !storagePath) {
        return res.status(400).json({ error: "Missing accountId or storagePath" });
    }

    try {
        console.log(`Uploading verification file for account ${accountId}`);

        // Get file from Firebase Storage
        const bucket = storage.bucket();
        const file = bucket.file(storagePath);
        const [buffer] = await file.download();
        const [metadata] = await file.getMetadata();

        // Upload to Stripe
        const stripeFile = await stripe.files.create({
            file: {
                data: buffer,
                name: storagePath.split("/").pop(),
                type: metadata.contentType || "application/octet-stream",
            },
            purpose,
        });

        console.log(`Stripe file created: ${stripeFile.id}`);

        // Attach file to account as verification document
        await stripe.accounts.update(accountId, {
            individual: {
                verification: {
                    document: {
                        front: stripeFile.id
                    }
                }
            }
        });

        // Update Firestore
        await db.collection("stripeAccounts").doc(uid).update({
            lastUploadedFile: stripeFile.id,
            verificationFileUploaded: true,
            updated: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.json({
            fileId: stripeFile.id,
            success: true
        });
    } catch (err) {
        console.error("Error uploading verification file:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// 4) CREATE PAYMENT INTENT (Receive Payment)
// ============================================
app.post("/createPaymentIntent", verifyFirebaseToken, async (req, res) => {
    const { amount, currency = "usd", connectedAccountId, description } = req.body;

    if (!amount || !connectedAccountId) {
        return res.status(400).json({ error: "Missing amount or connectedAccountId" });
    }

    try {
        console.log(`Creating PaymentIntent for ${amount} ${currency} to account ${connectedAccountId}`);

        // Create PaymentIntent with transfer to connected account
        const paymentIntent = await stripe.paymentIntents.create({
            amount, // Amount in cents (e.g., 1000 = $10.00)
            currency,
            payment_method_types: ["card"],
            description: description || "Payment to connected account",
            transfer_data: {
                destination: connectedAccountId, // Money goes to connected account
            },
            // Optional: Take an application fee (platform fee)
            // application_fee_amount: Math.floor(amount * 0.10), // 10% fee example
        });

        console.log(`PaymentIntent created: ${paymentIntent.id}`);

        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            success: true
        });
    } catch (err) {
        console.error("Error creating PaymentIntent:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// 5) GET ACCOUNT BALANCE
// ============================================
app.get("/getBalance", verifyFirebaseToken, async (req, res) => {
    const uid = req.user.uid;

    try {
        // Get account ID from Firestore
        const doc = await db.collection("stripeAccounts").doc(uid).get();

        if (!doc.exists) {
            return res.status(404).json({ error: "No Stripe account found" });
        }

        const { accountId } = doc.data();

        // Get balance from Stripe
        const balance = await stripe.balance.retrieve({
            stripeAccount: accountId,
        });

        res.json({
            available: balance.available,
            pending: balance.pending,
            success: true,
        });
    } catch (err) {
        console.error("Error getting balance:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// 6) CREATE PAYOUT (Withdraw money to bank)
// ============================================
app.post("/createPayout", verifyFirebaseToken, async (req, res) => {
    const uid = req.user.uid;
    const { amount, currency = "usd" } = req.body;

    try {
        // Get account ID from Firestore
        const doc = await db.collection("stripeAccounts").doc(uid).get();

        if (!doc.exists) {
            return res.status(404).json({ error: "No Stripe account found" });
        }

        const { accountId } = doc.data();

        // Create payout
        const payout = await stripe.payouts.create(
            {
                amount,
                currency,
            },
            {
                stripeAccount: accountId,
            }
        );

        res.json({
            payoutId: payout.id,
            amount: payout.amount,
            arrival_date: payout.arrival_date,
            success: true,
        });
    } catch (err) {
        console.error("Error creating payout:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// 7) WEBHOOK HANDLER (Account Updates)
// ============================================
app.post("/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
        const signature = req.headers['stripe-signature'];
        event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`Webhook received: ${event.type}`);

    // Handle account.updated event
    if (event.type === 'account.updated') {
        const account = event.data.object;

        // Find user by account ID
        const querySnapshot = await db.collection('stripeAccounts')
            .where('accountId', '==', account.id)
            .get();

        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            await doc.ref.update({
                charges_enabled: account.charges_enabled,
                payouts_enabled: account.payouts_enabled,
                details_submitted: account.details_submitted,
                requirements: account.requirements,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`Updated account status for ${doc.id}`);
        }
    }

    // Handle payment_intent.succeeded event
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        console.log(`Payment succeeded: ${paymentIntent.id}`);

        // You can store payment records in Firestore here
        await db.collection('payments').add({
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            created: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    res.json({ received: true });
});

// ============================================
// 7) GENERATE AI INVITATION POSTER
// ============================================
app.post("/generatePoster", verifyFirebaseToken, async (req, res) => {
    const { eventId } = req.body;

    if (!eventId) {
        return res.status(400).json({ error: "Missing eventId" });
    }

    try {
        console.log(`🎨 Generating AI poster for event: ${eventId}`);

        // 1. Get event data
        const eventRef = db.collection('events').doc(eventId);
        const eventDoc = await eventRef.get();

        if (!eventDoc.exists) {
            return res.status(404).json({ error: "Event not found" });
        }

        const event = eventDoc.data();

        // 2. Verify the user owns this event
        if (event.creatorId !== req.user.uid) {
            return res.status(403).json({ error: "Not authorized to modify this event" });
        }

        // 3. Build the prompt for Gemini
        const eventTypeLabel = {
            birthday: "Birthday Party",
            barMitzvah: "Bar Mitzvah",
            batMitzvah: "Bat Mitzvah",
        }[event.eventType] || "Celebration";

        const formatDate = (dateStr) => {
            const date = new Date(dateStr);
            return date.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
            });
        };

        // Build a detailed prompt
        let promptDetails = [];
        promptDetails.push(`Event Type: ${eventTypeLabel}`);
        promptDetails.push(`Event Name: ${event.eventName}`);
        if (event.age) promptDetails.push(`Age: Turning ${event.age}`);
        promptDetails.push(`Date: ${formatDate(event.date)}`);
        promptDetails.push(`Time: ${event.time}`);
        promptDetails.push(`Location: ${event.address1}${event.address2 ? ', ' + event.address2 : ''}`);
        if (event.theme) promptDetails.push(`Theme: ${event.theme}`);
        if (event.attireType) promptDetails.push(`Dress Code: ${event.attireType}`);
        if (event.partyType) promptDetails.push(`Party Type: ${event.partyType}`);

        const prompt = `Create a beautiful, modern, and elegant digital invitation poster for the following event:

${promptDetails.join('\n')}

Design requirements:
- Make it visually stunning and celebratory
- Use modern design aesthetics with clean typography
- Include festive elements appropriate for a ${eventTypeLabel}
- The design should feel premium and personalized
- Use vibrant but tasteful colors
- Include decorative elements like confetti, balloons, or sparkles as appropriate
- Make the event name prominent
- Layout should be suitable for mobile viewing (portrait orientation)
- Include all the event details in an elegant, readable format
- The style should be ${event.theme ? `themed around "${event.theme}"` : 'elegant and modern'}

Generate a prompt for creating this invitation poster image that I can use with an image generation AI. The prompt should be detailed and specific about visual elements, colors, typography, and layout.`;

        // 4. Call Gemini to generate a detailed image prompt
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const imagePrompt = response.text();

        console.log(`📝 Generated image prompt for event ${eventId}`);

        // 5. Now use Imagen (Google's image generation) or return the prompt
        // Note: For actual image generation, you would call Imagen API here
        // For now, we'll return the prompt and a placeholder approach

        // Store the prompt in the event for future use
        await eventRef.update({
            posterPrompt: imagePrompt,
            posterGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 6. Generate image using Gemini's image generation capability
        // Note: As of now, Gemini 1.5 doesn't directly generate images
        // We'll use Imagen 3 if available, or return the prompt for client-side generation

        let posterUrl = null;

        try {
            // Try to use Imagen for image generation
            const imagenModel = genAI.getGenerativeModel({ model: "imagen-3.0-generate-001" });
            const imageResult = await imagenModel.generateContent({
                contents: [{
                    role: "user",
                    parts: [{ text: imagePrompt }]
                }],
                generationConfig: {
                    responseModalities: ["image"],
                },
            });

            // If image generation succeeds, upload to Firebase Storage
            if (imageResult.response?.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
                const imageData = imageResult.response.candidates[0].content.parts[0].inlineData;
                const buffer = Buffer.from(imageData.data, 'base64');

                const bucket = storage.bucket();
                const fileName = `posters/${eventId}/invitation_${Date.now()}.png`;
                const file = bucket.file(fileName);

                await file.save(buffer, {
                    metadata: {
                        contentType: imageData.mimeType || 'image/png',
                    },
                });

                // Make the file publicly accessible
                await file.makePublic();
                posterUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

                // Update event with poster URL
                await eventRef.update({
                    posterUrl: posterUrl,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
        } catch (imagenError) {
            console.log(`⚠️ Image generation not available, returning prompt only:`, imagenError.message);
            // Image generation failed or not available - that's okay, we return the prompt
        }

        res.json({
            success: true,
            posterPrompt: imagePrompt,
            posterUrl: posterUrl,
            message: posterUrl
                ? "AI poster generated successfully!"
                : "Image prompt generated. Image generation requires Imagen API access.",
        });

    } catch (err) {
        console.error("Error generating AI poster:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// HEALTH CHECK
// ============================================
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Export the Express app as a single Cloud Function
exports.api = functions.https.onRequest(app);

// ============================================
// FIRESTORE TRIGGER: On Event Created
// Automatically creates a Stripe Custom account for the user
// ============================================
exports.onEventCreated = functions.firestore
    .document('events/{eventId}')
    .onCreate(async (snapshot, context) => {
        const eventData = snapshot.data();
        const eventId = context.params.eventId;
        const creatorId = eventData.creatorId;

        console.log(`🎉 New event created: ${eventId} by user: ${creatorId}`);

        try {
            // 1. Get the user document
            const userRef = db.collection('users').doc(creatorId);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                console.error(`❌ User not found: ${creatorId}`);
                return null;
            }

            const userData = userDoc.data();

            // 2. Check if user already has a Stripe account
            if (userData.stripeAccountId) {
                console.log(`✅ User ${creatorId} already has Stripe account: ${userData.stripeAccountId}`);

                // Update the event with the existing Stripe account ID
                await snapshot.ref.update({
                    stripeAccountId: userData.stripeAccountId,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                return null;
            }

            // 3. Create a Stripe Custom/Express account for the user
            console.log(`🏦 Creating Stripe account for user: ${creatorId}`);

            const account = await stripe.accounts.create({
                type: "custom",
                country: "US",
                email: userData.email || eventData.creatorEmail,
                business_type: "individual",
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                settings: {
                    payouts: {
                        schedule: {
                            interval: 'manual',
                        },
                    },
                },
                // Pre-fill some info if available
                business_profile: {
                    name: userData.fullName || eventData.creatorName,
                },
            });

            console.log(`✅ Stripe account created: ${account.id}`);

            // 4. Create account link for onboarding
            const appScheme = process.env.APP_SCHEME || 'myapp';
            const accountLink = await stripe.accountLinks.create({
                account: account.id,
                refresh_url: `${appScheme}://banking/setup/stripe-connection?refresh=true`,
                return_url: `${appScheme}://banking/setup/success`,
                type: "account_onboarding",
            });

            // 5. Update user document with Stripe account info
            await userRef.update({
                stripeAccountId: account.id,
                stripeAccountLink: accountLink.url,
                stripeAccountCreated: true,
                stripeAccountStatus: 'onboarding_required',
                stripeAccountType: 'custom',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log(`✅ User ${creatorId} updated with Stripe account`);

            // 6. Update the event with the Stripe account ID
            await snapshot.ref.update({
                stripeAccountId: account.id,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log(`✅ Event ${eventId} updated with Stripe account`);

            // 7. Also save to stripeAccounts collection for reference
            await db.collection('stripeAccounts').doc(creatorId).set({
                accountId: account.id,
                userId: creatorId,
                email: userData.email || eventData.creatorEmail,
                country: 'US',
                business_type: 'individual',
                accountType: 'custom',
                status: 'pending',
                onboardingUrl: accountLink.url,
                created: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });

            console.log(`✅ Stripe account saved to stripeAccounts collection`);

            return { success: true, accountId: account.id };

        } catch (error) {
            console.error(`❌ Error creating Stripe account for event ${eventId}:`, error);

            // Update event to indicate Stripe setup failed (can retry later)
            await snapshot.ref.update({
                stripeSetupFailed: true,
                stripeSetupError: error.message,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            return { success: false, error: error.message };
        }
    });

