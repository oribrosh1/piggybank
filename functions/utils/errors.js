/**
 * Centralized error handling for Controllers.
 * Use AppError for known HTTP errors; handleError sends consistent JSON responses.
 */

class AppError extends Error {
    constructor(message, options = {}) {
        super(message);
        this.name = "AppError";
        this.statusCode = options.statusCode ?? 500;
        this.code = options.code ?? "error";
        this.param = options.param;
    }
}

function handleError(err, res) {
    if (err instanceof AppError) {
        const payload = { error: err.message };
        if (err.code) payload.code = err.code;
        if (err.param) payload.param = err.param;
        return res.status(err.statusCode).json(payload);
    }
    console.error("Unhandled error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
}

module.exports = { AppError, handleError };
