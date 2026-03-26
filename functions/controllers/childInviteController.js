const crypto = require("crypto");
const eventRepository = require("../repositories/eventRepository");
const { AppError, handleError } = require("../utils/errors");
const { sendSMS, isSmsConfigured } = require("../services/smsService");

const isStripeTestMode = () => (process.env.STRIPE_SECRET_KEY || "").startsWith("sk_test_");

const INVITE_TOKEN_EXPIRY_DAYS = 30;
const PIN_LENGTH = 6;
const MAX_PIN_ATTEMPTS = 5;
const MAX_DAILY_INVITES = 10;
const CHILD_ACCOUNTS_COLLECTION = "childAccounts";
const CHILD_INVITE_TOKENS_COLLECTION = "childInviteTokens";
const APP_STORE_URL = process.env.APP_STORE_URL || "https://apps.apple.com/app/creditkid";

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
 * Parent: create invite and send SMS to child via Twilio.
 * The SMS contains: App Store link, deep link with token, and PIN.
 */
async function sendChildInvite(req, res) {
    const uid = req.user.uid;
    const { eventId, childPhone, childName } = req.body;
    console.log(`[sendChildInvite] uid=${uid} eventId=${eventId} childPhone=${childPhone ? "***" + childPhone.slice(-4) : "none"} childName=${childName || "none"}`);

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

        // Daily SMS cap (single-field query + in-memory filter — avoids composite index requirement)
        const dayAgoMs = Date.now() - 24 * 60 * 60 * 1000;
        const recentSnap = await db.collection(CHILD_INVITE_TOKENS_COLLECTION)
            .where("creatorId", "==", uid)
            .get();
        const recentCount = recentSnap.docs.filter((doc) => {
            const createdAt = doc.data().createdAt?.toMillis?.() ?? doc.data().createdAt?.seconds * 1000 ?? 0;
            return createdAt >= dayAgoMs;
        }).length;
        if (recentCount >= MAX_DAILY_INVITES) {
            return res.status(429).json({
                error: "Daily invite limit reached. You can send up to 10 invites per day.",
                code: "daily_limit_exceeded",
            });
        }

        // Revoke any existing unclaimed invite for same event+phone (single-field query + filter — no composite index)
        const existingSnap = await db.collection(CHILD_INVITE_TOKENS_COLLECTION)
            .where("eventId", "==", eventId)
            .get();
        const toRevoke = existingSnap.docs.filter((doc) => {
            const d = doc.data();
            return d.childPhone === normalizedPhone && d.claimed === false && !d.revoked;
        });
        if (toRevoke.length > 0) {
            const batch = db.batch();
            toRevoke.forEach((doc) => batch.update(doc.ref, { revoked: true }));
            await batch.commit();
            console.log(`[sendChildInvite] revoked ${toRevoke.length} previous invite(s) for eventId=${eventId}`);
        }

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
            childName: childName || null,
            pinHash,
            pinSalt,
            pinAttempts: 0,
            claimed: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        });

        await db.collection("events").doc(eventId).update({
            childPhone: normalizedPhone,
            childName: childName || null,
        });

        const deepLink = `creditkidapp://child?token=${token}`;
        const name = childName || "there";

        const smsBody =
            `Hi ${name}! Your parent set up a CreditKid account for you.\n\n` +
            `1. Download the app: ${APP_STORE_URL}\n` +
            `2. After installing, tap this link: ${deepLink}\n` +
            `3. Enter this code: ${pin}\n\n` +
            `Your gifts are waiting!`;

        let smsSkipped = false;
        if (!isSmsConfigured() && isStripeTestMode()) {
            smsSkipped = true;
            console.warn(
                `[sendChildInvite] SMS skipped: Twilio not configured (Stripe test mode). ` +
                    `Configure TWILIO_* env vars to send real SMS.`
            );
        } else {
            try {
                await sendSMS(normalizedPhone, smsBody);
            } catch (smsErr) {
                console.error(`[sendChildInvite] Twilio error: ${smsErr.message}`);
                const msg = String(smsErr.message || "");
                if (isStripeTestMode()) {
                    console.warn(`[sendChildInvite] SMS failed in test mode; invite still valid. ${msg}`);
                    smsSkipped = true;
                } else if (msg.includes("Twilio credentials") || msg.includes("TWILIO_PHONE_NUMBER not configured")) {
                    throw new AppError(
                        "SMS is not configured on the server. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER on Cloud Functions.",
                        { statusCode: 503, code: "sms_not_configured" }
                    );
                } else {
                    throw new AppError("Could not send SMS. Try again later.", { statusCode: 503, code: "sms_failed" });
                }
            }
        }

        console.log(`[sendChildInvite] success uid=${uid} eventId=${eventId} expires=${expiresAt.toISOString()} smsSkipped=${smsSkipped}`);
        const payload = {
            success: true,
            childName: childName || null,
            expiresAt: expiresAt.toISOString(),
            smsSkipped: smsSkipped || undefined,
        };
        // Only in Stripe test mode when SMS was not sent — lets you copy link/PIN without Twilio
        if (smsSkipped && isStripeTestMode()) {
            payload.devInviteLink = deepLink;
            payload.devPin = pin;
        }
        res.json(payload);
    } catch (err) {
        console.error(`[sendChildInvite] error uid=${uid} eventId=${eventId} message=${err.message}`);
        if (err instanceof AppError) {
            return res.status(err.statusCode).json({ error: err.message, ...(err.code && { code: err.code }) });
        }
        handleError(err, res);
    }
}

/**
 * Write an audit log entry for a claim attempt (fire-and-forget).
 */
function logClaimAttempt(db, token, req, result) {
    const admin = require("firebase-admin");
    db.collection(CHILD_INVITE_TOKENS_COLLECTION)
        .doc(token)
        .collection("claimAttempts")
        .add({
            ip: req.headers["x-forwarded-for"] || req.ip || null,
            userAgent: req.headers["user-agent"] || null,
            uid: req.user?.uid || null,
            result,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        })
        .catch(err => console.warn(`[claimAudit] write failed: ${err.message}`));
}

/**
 * Child: claim invite with token + PIN.
 * Requires Firebase Phone Auth — the child must verify their phone number first.
 * The backend checks that the authenticated phone matches the invite's childPhone.
 */
async function claimChildInvite(req, res) {
    const { token, pin } = req.body;
    console.log(`[claimChildInvite] uid=${req.user?.uid} tokenPrefix=${token ? token.slice(0, 8) + "..." : "none"}`);

    if (!token || typeof token !== "string") {
        return res.status(400).json({ error: "Missing or invalid token" });
    }
    if (!pin || typeof pin !== "string") {
        return res.status(400).json({ error: "Missing PIN" });
    }

    const admin = require("firebase-admin");
    const db = admin.firestore();

    try {
        const tokenRef = db.collection(CHILD_INVITE_TOKENS_COLLECTION).doc(token);
        const tokenDoc = await tokenRef.get();
        if (!tokenDoc.exists) {
            console.warn(`[claimChildInvite] token not found`);
            logClaimAttempt(db, token, req, "not_found");
            return res.status(404).json({ error: "Invalid or expired link." });
        }

        const data = tokenDoc.data();
        const { eventId, creatorId, expiresAt, childPhone, pinHash, pinSalt, pinAttempts, claimed } = data || {};

        if (claimed) {
            console.warn(`[claimChildInvite] token already claimed eventId=${eventId}`);
            logClaimAttempt(db, token, req, "already_claimed");
            return res.status(410).json({ error: "This link has already been used." });
        }

        if (data.revoked) {
            console.warn(`[claimChildInvite] token revoked eventId=${eventId}`);
            logClaimAttempt(db, token, req, "revoked");
            return res.status(410).json({ error: "This invite has been revoked by the parent." });
        }

        if (!eventId || !creatorId) {
            logClaimAttempt(db, token, req, "invalid_data");
            return res.status(404).json({ error: "Invalid or expired link." });
        }

        const expiry = expiresAt?.toDate?.() ?? (expiresAt && new Date(expiresAt));
        if (expiry && expiry < new Date()) {
            console.warn(`[claimChildInvite] token expired eventId=${eventId}`);
            logClaimAttempt(db, token, req, "expired");
            return res.status(410).json({ error: "This link has expired." });
        }

        if ((pinAttempts || 0) >= MAX_PIN_ATTEMPTS) {
            console.warn(`[claimChildInvite] max PIN attempts reached eventId=${eventId}`);
            logClaimAttempt(db, token, req, "max_attempts");
            return res.status(429).json({ error: "Too many incorrect PIN attempts. Ask your parent for a new link." });
        }

        const computedHash = hashPin(pin, pinSalt);
        if (computedHash !== pinHash) {
            await tokenRef.update({
                pinAttempts: admin.firestore.FieldValue.increment(1),
            });
            const remaining = MAX_PIN_ATTEMPTS - (pinAttempts || 0) - 1;
            console.warn(`[claimChildInvite] wrong PIN eventId=${eventId} remaining=${remaining}`);
            logClaimAttempt(db, token, req, "wrong_pin");
            return res.status(403).json({
                error: `Incorrect PIN. ${remaining > 0 ? `${remaining} attempt${remaining === 1 ? "" : "s"} remaining.` : "No attempts remaining."}`,
            });
        }

        const event = await eventRepository.getById(eventId);
        if (!event) {
            logClaimAttempt(db, token, req, "event_deleted");
            return res.status(404).json({ error: "Event no longer exists." });
        }

        // Verify the authenticated child's phone matches the invite
        const normalizedInvitePhone = normalizePhone(childPhone);
        if (!req.user.phone_number) {
            logClaimAttempt(db, token, req, "no_phone_verified");
            return res.status(403).json({ error: "Phone verification required before claiming an invite." });
        }
        const authedPhone = normalizePhone(req.user.phone_number);
        if (normalizedInvitePhone && authedPhone !== normalizedInvitePhone) {
            console.warn(`[claimChildInvite] phone mismatch authed=${authedPhone?.slice(-4)} invite=${normalizedInvitePhone?.slice(-4)}`);
            logClaimAttempt(db, token, req, "phone_mismatch");
            return res.status(403).json({ error: "Phone number does not match the invite." });
        }

        const childUid = req.user.uid;

        const childRef = await db.collection(CHILD_ACCOUNTS_COLLECTION).add({
            userId: childUid,
            eventId,
            creatorId,
            phoneNumber: normalizedInvitePhone,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await tokenRef.update({
            claimed: true,
            claimedAt: admin.firestore.FieldValue.serverTimestamp(),
            claimedBy: childUid,
        });

        // Generate a Firebase Custom Token so the child can sign in
        const customToken = await admin.auth().createCustomToken(childUid, {
            role: "child",
            eventId,
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

        logClaimAttempt(db, token, req, "success");
        console.log(`[claimChildInvite] success childUid=${childUid} eventId=${eventId} childAccountId=${childRef.id} hasCard=${!!cardLast4}`);
        res.json({
            customToken,
            childAccountId: childRef.id,
            eventId,
            eventName: event.eventName || null,
            ephemeralKeySecret,
            cardLast4,
        });
    } catch (err) {
        console.error(`[claimChildInvite] error message=${err.message}`);
        handleError(err, res);
    }
}

/**
 * Parent: revoke all pending (unclaimed, non-revoked) invites for an event.
 */
async function revokeChildInvite(req, res) {
    const uid = req.user.uid;
    const { eventId } = req.body;
    console.log(`[revokeChildInvite] uid=${uid} eventId=${eventId}`);

    if (!eventId) {
        return res.status(400).json({ error: "Missing eventId" });
    }

    const admin = require("firebase-admin");
    const db = admin.firestore();

    try {
        const tokensSnap = await db.collection(CHILD_INVITE_TOKENS_COLLECTION)
            .where("eventId", "==", eventId)
            .get();

        const batch = db.batch();
        let revokedCount = 0;
        tokensSnap.docs.forEach((doc) => {
            const d = doc.data();
            if (d.creatorId === uid && d.claimed === false && !d.revoked) {
                batch.update(doc.ref, {
                    revoked: true,
                    revokedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                revokedCount++;
            }
        });
        await batch.commit();

        console.log(`[revokeChildInvite] revoked ${revokedCount} token(s) for eventId=${eventId}`);
        res.json({ success: true, revokedCount });
    } catch (err) {
        console.error(`[revokeChildInvite] error uid=${uid} eventId=${eventId} message=${err.message}`);
        handleError(err, res);
    }
}

/**
 * Parent: check if there is a pending (unclaimed, non-revoked, non-expired) invite for an event.
 */
async function getPendingInvite(req, res) {
    const uid = req.user.uid;
    const { eventId } = req.query;
    console.log(`[getPendingInvite] uid=${uid} eventId=${eventId}`);

    if (!eventId) {
        return res.status(400).json({ error: "Missing eventId" });
    }

    const admin = require("firebase-admin");
    const db = admin.firestore();

    try {
        const tokensSnap = await db.collection(CHILD_INVITE_TOKENS_COLLECTION)
            .where("eventId", "==", eventId)
            .limit(50)
            .get();

        const now = new Date();
        const pending = tokensSnap.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter((t) => t.creatorId === uid && t.claimed === false)
            .filter(t => !t.revoked)
            .filter(t => {
                const expiry = t.expiresAt?.toDate?.() ?? (t.expiresAt && new Date(t.expiresAt));
                return !expiry || expiry > now;
            });

        if (pending.length === 0) {
            return res.json({ hasPending: false });
        }

        const invite = pending[0];
        res.json({
            hasPending: true,
            childName: invite.childName || null,
            childPhone: invite.childPhone ? `***${invite.childPhone.slice(-4)}` : null,
            expiresAt: invite.expiresAt?.toDate?.()?.toISOString() || null,
        });
    } catch (err) {
        console.error(`[getPendingInvite] error uid=${uid} eventId=${eventId} message=${err.message}`);
        handleError(err, res);
    }
}

module.exports = { sendChildInvite, claimChildInvite, revokeChildInvite, getPendingInvite };
