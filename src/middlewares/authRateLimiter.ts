import { rateLimit, MemoryStore } from "express-rate-limit";

// Limit repeated login requests to 5 per 15 minutes per account
export const signInRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    store: new MemoryStore(),
    keyGenerator: (req) => {
        // Track by email if provided, otherwise fallback to IP
        const email = req.body?.email?.toString().toLowerCase();
        if (email) return `signin-user-${email}`;

        const forwarded = req.headers['x-forwarded-for'];
        const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded;
        return `signin-ip-${ip || req.ip || 'unknown-ip'}`;
    },
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    message: {
        statusCode: 429,
        status: "error",
        message: "Too many login attempts for this account, please try again after 15 minutes",
    },
});

// Limit repeated forgot password requests to 5 per 15 minutes per account
export const forgotPasswordRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    store: new MemoryStore(),
    keyGenerator: (req) => {
        // Track by email if provided, otherwise fallback to IP
        const email = req.body?.email?.toString().toLowerCase();
        if (email) return `forgotpw-user-${email}`;

        const forwarded = req.headers['x-forwarded-for'];
        const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded;
        return `forgotpw-ip-${ip || req.ip || 'unknown-ip'}`;
    },
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    message: {
        statusCode: 429,
        status: "error",
        message: "Too many password reset requests for this account, please try again after 15 minutes",
    },
});
