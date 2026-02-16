const admin = require("firebase-admin");

/**
 * Verify Firebase ID token from Authorization: Bearer <token>.
 * Sets req.user = decoded token claims.
 */
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

module.exports = { verifyFirebaseToken };
