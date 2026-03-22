const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

function keyGenerator(req) {
    return req.user?.uid || ipKeyGenerator(req.ip);
}

const sensitiveEndpointLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    keyGenerator,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later.", code: "rate_limit_exceeded" },
});

const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    keyGenerator,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later.", code: "rate_limit_exceeded" },
});

module.exports = { sensitiveEndpointLimiter, generalLimiter };
