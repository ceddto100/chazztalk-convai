const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

/**
 * Global rate limiter for all API routes
 * Prevents abuse by limiting request frequency
 */
const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes by default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window by default
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count successful requests
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.'
  },
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(options.statusCode).json(options.message);
  },
  skip: (req) => {
    // Skip rate limiting for webhook endpoints
    return req.path.includes('/webhook');
  },
  keyGenerator: (req) => {
    // Use IP address as default key
    return req.ip;
  }
});

module.exports = rateLimiter;