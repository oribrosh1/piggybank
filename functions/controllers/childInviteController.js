const crypto = require("crypto");
const eventRepository = require("../repositories/eventRepository");
const { AppError, handleError } = require("../utils/errors");

const INVITE_TOKEN_EXPIRY_DAYS = 30;
const CHILD_ACCOUNTS_COLLECTION = "childAccounts";
const CHILD_INVITE_TOKENS_COLLECTION = "childInviteTokens";

/**
 * Parent: create a one-time link for the child to claim and view balance/gifts.
 * Requires auth. Event must exist and creatorId === uid.
 */
async function getChildInviteLink(req, res) {
    const uid = req.user.uid;
    const { eventId } = req.body;

    if (!eventId) {
        return res.status(400).json({ error: "Missing eventId" });
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
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + INVITE_TOKEN_EXPIRY_DAYS);

        await db.collection(CHILD_INVITE_TOKENS_COLLECTION).doc(token).set({
            eventId,
            creatorId: uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        });

        const baseUrl = (req.PUBLIC_BASE_URL || process.env.PUBLIC_BASE_URL || process.env.APP_BASE_URL || "https://creditkid.vercel.app").replace(/\/+$/, "");
        const link = `${baseUrl}/child?token=${token}`;

        res.json({
            link,
            expiresAt: expiresAt.toISOString(),
            token,
        });
    } catch (err) {
        if (err instanceof AppError) {
            return res.status(err.statusCode).json({ error: err.message, ...(err.code && { code: err.code }) });
        }
        handleError(err, res);
    }
}

/**
 * Child: claim invite with token from link (no auth). Returns customToken to sign in.
 */
async function claimChildInvite(req, res) {
    const { token } = req.body;

    if (!token || typeof token !== "string") {
        return res.status(400).json({ error: "Missing or invalid token" });
    }

    const admin = require("firebase-admin");
    const db = admin.firestore();

    try {
        const tokenDoc = await db.collection(CHILD_INVITE_TOKENS_COLLECTION).doc(token).get();
        if (!tokenDoc.exists) {
            return res.status(404).json({ error: "Invalid or expired link." });
        }

        const data = tokenDoc.data();
        const { eventId, creatorId, expiresAt } = data || {};
        if (!eventId || !creatorId) {
            return res.status(404).json({ error: "Invalid or expired link." });
        }

        const expiry = expiresAt?.toDate?.() ?? (expiresAt && new Date(expiresAt));
        if (expiry && expiry < new Date()) {
            return res.status(404).json({ error: "This link has expired." });
        }

        const event = await eventRepository.getById(eventId);
        if (!event) {
            return res.status(404).json({ error: "Event no longer exists." });
        }

        const childUid = `child_${crypto.randomBytes(12).toString("hex")}`;
        const customToken = await admin.auth().createCustomToken(childUid);

        const childRef = await db.collection(CHILD_ACCOUNTS_COLLECTION).add({
            userId: childUid,
            eventId,
            creatorId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.json({
            customToken,
            childAccountId: childRef.id,
            eventId,
            eventName: event.eventName || null,
        });
    } catch (err) {
        console.error("claimChildInvite error:", err);
        handleError(err, res);
    }
}

module.exports = { getChildInviteLink, claimChildInvite };
