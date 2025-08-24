const rateLimit = require('express-rate-limit');

/**
 * ### CHANGE THIS ###
 * Rate limiting middleware to prevent abuse
 */
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: 'Too many requests, please try again later',
      error: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Different rate limits for different operations
const generalLimiter = createRateLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100 // 100 requests
);

const strictLimiter = createRateLimiter(
  5 * 60 * 1000, // 5 minutes
  20 // 20 requests
);

const createCouponLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  10 // 10 coupon creations per hour
);

module.exports = {
  generalLimiter,
  strictLimiter,
  createCouponLimiter
};
