const crypto = require("crypto");
const eventRepository = require("../repositories/eventRepository");
const { AppError, handleError } = require("../utils/errors");

const INVITE_TOKEN_EXPIRY_DAYS = 30;
const PIN_LENGTH = 6;
const MAX_PIN_ATTEMPTS = 5;
const CHILD_ACCOUNTS_COLLECTION = "childAccounts";
const CHILD_INVITE_TOKENS_COLLECTION = "childInviteTokens";

function generatePin() {
    const bytes = crypto.randomBytes(4);
    const num = bytes.readUInt32BE(0) % Math.pow(10, PIN_LENGTH);
    return String(num).padStart(PIN_LENGTH, "0");
}

function hashPin(pin, salt) {
    return crypto.pbkdf2Sync(pin, salt, 100_000, 32, "sha256").toString("hex");
}

function normalizePhone(phone) {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
    if (phone.startsWith("+")) return phone;
    return `+${digits}`;
}

/**
 * Parent: create a one-time link for the child to claim and view balance/gifts.
 * Requires auth. Event must exist and creatorId === uid.
 * Now also accepts childPhone and generates a PIN.
 */
async function getChildInviteLink(req, res) {
    const uid = req.user.uid;
    const { eventId, childPhone } = req.body;
    console.log(`[getChildInviteLink] uid=${uid} eventId=${eventId} childPhone=${childPhone ? "***" + childPhone.slice(-4) : "none"}`);

    if (!eventId) {
        return res.status(400).json({ error: "Missing eventId" });
    }
    if (!childPhone) {
        return res.status(400).json({ error: "Missing childPhone" });
    }

    const normalizedPhone = normalizePhone(childPhone);
    if (!normalizedPhone || normalizedPhone.replace(/\D/g, "").length < 10) {
        return res.status(400).json({ error: "Invalid phone number" });
    }

    try {
        const event = await eventRepository.getById(eventId);
        if (!event) {
            throw new AppError("Event not found", { statusCode: 404 });
        }
        if (event.creatorId !== uid) {
            throw new AppError("Not authorized to create a child link for this event", { statusCode: 403 });
        }

        const admin = require("firebase-admin");
        const db = admin.firestore();

        const token = crypto.randomBytes(24).toString("hex");
        const pin = generatePin();
        const pinSalt = crypto.randomBytes(16).toString("hex");
        const pinHash = hashPin(pin, pinSalt);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + INVITE_TOKEN_EXPIRY_DAYS);

        await db.collection(CHILD_INVITE_TOKENS_COLLECTION).doc(token).set({
            eventId,
            creatorId: uid,
            childPhone: normalizedPhone,
            pinHash,
            pinSalt,
            pinAttempts: 0,
            claimed: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        });

        await db.collection("events").doc(eventId).update({
            childPhone: normalizedPhone,
        });

        const baseUrl = (req.PUBLIC_BASE_URL || process.env.PUBLIC_BASE_URL || process.env.APP_BASE_URL || "https://creditkid.vercel.app").replace(/\/+$/, "");
        const link = `${baseUrl}/child?token=${token}`;

        console.log(`[getChildInviteLink] success uid=${uid} eventId=${eventId} expires=${expiresAt.toISOString()}`);
        res.json({
            link,
            pin,
            expiresAt: expiresAt.toISOString(),
            token,
        });
    } catch (err) {
        console.error(`[getChildInviteLink] error uid=${uid} eventId=${eventId} message=${err.message}`);
        if (err instanceof AppError) {
            return res.status(err.statusCode).json({ error: err.message, ...(err.code && { code: err.code }) });
        }
        handleError(err, res);
    }
}

/**
 * Child: claim invite — requires Firebase Phone Auth + parent PIN.
 * Validates:
 *   1. One-time token exists and isn't expired/claimed
 *   2. Authenticated phone matches the phone the parent provided
 *   3. PIN matches (rate-limited)
 * On success:
 *   - Creates child account
 *   - Burns the token (marks claimed)
 *   - Returns Stripe Ephemeral Key for the virtual card
 */
async function claimChildInvite(req, res) {
    const { token, pin } = req.body;
    const callerUid = req.user?.uid;
    console.log(`[claimChildInvite] callerUid=${callerUid || "none"} tokenPrefix=${token ? token.slice(0, 8) + "..." : "none"}`);

    if (!token || typeof token !== "string") {
        return res.status(400).json({ error: "Missing or invalid token" });
    }
    if (!pin || typeof pin !== "string") {
        return res.status(400).json({ error: "Missing PIN" });
    }

    if (!callerUid) {
        return res.status(401).json({ error: "Authentication required. Please verify your phone number first." });
    }

    const admin = require("firebase-admin");
    const db = admin.firestore();

    try {
        const callerRecord = await admin.auth().getUser(callerUid);
        const callerPhone = callerRecord.phoneNumber;
        if (!callerPhone) {
            console.warn(`[claimChildInvite] no phone on uid=${callerUid}`);
            return res.status(403).json({ error: "Phone number not verified. Please sign in with your phone first." });
        }

        const tokenRef = db.collection(CHILD_INVITE_TOKENS_COLLECTION).doc(token);
        const tokenDoc = await tokenRef.get();
        if (!tokenDoc.exists) {
            console.warn(`[claimChildInvite] token not found`);
            return res.status(404).json({ error: "Invalid or expired link." });
        }

        const data = tokenDoc.data();
        const { eventId, creatorId, expiresAt, childPhone, pinHash, pinSalt, pinAttempts, claimed } = data || {};

        if (claimed) {
            console.warn(`[claimChildInvite] token already claimed eventId=${eventId}`);
            return res.status(410).json({ error: "This link has already been used." });
        }

        if (!eventId || !creatorId) {
            return res.status(404).json({ error: "Invalid or expired link." });
        }

        const expiry = expiresAt?.toDate?.() ?? (expiresAt && new Date(expiresAt));
        if (expiry && expiry < new Date()) {
            console.warn(`[claimChildInvite] token expired eventId=${eventId}`);
            return res.status(410).json({ error: "This link has expired." });
        }

        if ((pinAttempts || 0) >= MAX_PIN_ATTEMPTS) {
            console.warn(`[claimChildInvite] max PIN attempts reached eventId=${eventId}`);
            return res.status(429).json({ error: "Too many incorrect PIN attempts. Ask your parent for a new link." });
        }

        const normalizedCaller = normalizePhone(callerPhone);
        const normalizedExpected = normalizePhone(childPhone);
        if (normalizedCaller !== normalizedExpected) {
            console.warn(`[claimChildInvite] phone mismatch callerUid=${callerUid} eventId=${eventId}`);
            return res.status(403).json({
                error: "Phone number doesn't match. Please use the phone number your parent registered for you.",
            });
        }

        const computedHash = hashPin(pin, pinSalt);
        if (computedHash !== pinHash) {
            await tokenRef.update({
                pinAttempts: admin.firestore.FieldValue.increment(1),
            });
            const remaining = MAX_PIN_ATTEMPTS - (pinAttempts || 0) - 1;
            console.warn(`[claimChildInvite] wrong PIN callerUid=${callerUid} eventId=${eventId} remaining=${remaining}`);
            return res.status(403).json({
                error: `Incorrect PIN. ${remaining > 0 ? `${remaining} attempt${remaining === 1 ? "" : "s"} remaining.` : "No attempts remaining."}`,
            });
        }

        const event = await eventRepository.getById(eventId);
        if (!event) {
            return res.status(404).json({ error: "Event no longer exists." });
        }

        const childRef = await db.collection(CHILD_ACCOUNTS_COLLECTION).add({
            userId: callerUid,
            eventId,
            creatorId,
            phoneNumber: normalizedCaller,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await tokenRef.update({
            claimed: true,
            claimedAt: admin.firestore.FieldValue.serverTimestamp(),
            claimedBy: callerUid,
        });

        let ephemeralKeySecret = null;
        let cardLast4 = null;

        try {
            const stripeAccountRepository = require("../repositories/stripeAccountRepository");
            const parentStripeDoc = await stripeAccountRepository.getByUid(creatorId);

            if (parentStripeDoc?.accountId && parentStripeDoc?.virtualCardId) {
                const Stripe = require("stripe");
                const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

                const ephemeralKey = await stripe.ephemeralKeys.create(
                    { issuing_card: parentStripeDoc.virtualCardId },
                    {
                        stripe_version: "2024-12-18.acacia",
                        stripeAccount: parentStripeDoc.accountId,
                    }
                );
                ephemeralKeySecret = ephemeralKey.secret;

                const card = await stripe.issuing.cards.retrieve(
                    parentStripeDoc.virtualCardId,
                    { stripeAccount: parentStripeDoc.accountId }
                );
                cardLast4 = card.last4;
            }
        } catch (stripeErr) {
            console.warn(`[claimChildInvite] ephemeral key failed: ${stripeErr.message}`);
        }

        console.log(`[claimChildInvite] success callerUid=${callerUid} eventId=${eventId} childAccountId=${childRef.id} hasCard=${!!cardLast4}`);
        res.json({
            childAccountId: childRef.id,
            eventId,
            eventName: event.eventName || null,
            ephemeralKeySecret,
            cardLast4,
        });
    } catch (err) {
        console.error(`[claimChildInvite] error callerUid=${callerUid} message=${err.message}`);
        handleError(err, res);
    }
}

module.exports = { getChildInviteLink, claimChildInvite };
