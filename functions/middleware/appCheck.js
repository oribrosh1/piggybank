const admin = require("firebase-admin");

/**
 * Strict enforcement: rejects requests missing or carrying an invalid App Check token.
 * Use after confirming all clients successfully send tokens (Phase 2).
 */
async function verifyAppCheck(req, res, next) {
    const appCheckToken = req.header("X-Firebase-AppCheck");
    if (!appCheckToken) {
        return res.status(401).json({ error: "Missing App Check token" });
    }
    try {
        await admin.appCheck().verifyToken(appCheckToken);
        next();
    } catch (err) {
        console.warn("[appCheck] verification failed:", err.message);
        return res.status(401).json({ error: "Invalid App Check token" });
    }
}

/**
 * Warn-only mode: logs missing/invalid tokens but allows the request through.
 * Use during initial rollout (Phase 1) to monitor without breaking clients.
 */
async function warnAppCheck(req, res, next) {
    const appCheckToken = req.header("X-Firebase-AppCheck");
    if (!appCheckToken) {
        console.warn("[appCheck] missing token for", req.method, req.path);
        return next();
    }
    try {
        await admin.appCheck().verifyToken(appCheckToken);
    } catch (err) {
        console.warn("[appCheck] invalid token for", req.method, req.path, err.message);
    }
    next();
}

module.exports = { verifyAppCheck, warnAppCheck };
