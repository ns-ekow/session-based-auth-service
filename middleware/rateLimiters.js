const rateLimit = require('express-rate-limit');

// Strict limiter for authentication endpoints
const strictAuthLimiter = rateLimit({
windowMs: 15 * 60 * 1000, // 15 minutes
limit: 10,                // max 10 requests per window per IP
standardHeaders: true,    // adds RateLimit-* headers
legacyHeaders: false,     // disables X-RateLimit-* headers
message: async (req, res) => {
return {
error: {
code: 'too_many_requests',
message: 'Too many authentication attempts. Please try again later.'
}
};
},

});

// General limiter for the whole auth router (less strict)
const generalLimiter = rateLimit({
windowMs: 15 * 60 * 1000, // 15 minutes
limit: 200,
standardHeaders: true,
legacyHeaders: false,
message: async (req, res) => {
return {
error: {
code: 'too_many_requests',
message: 'Too many requests. Please slow down.'
}
};
},

});

module.exports = {
strictAuthLimiter,
generalLimiter
};