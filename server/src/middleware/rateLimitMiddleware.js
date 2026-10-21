// ==============================================================================
// APEX PERFORMANCE — TIERED RATE-LIMITING SECURITY MIDDLEWARE
// File Path: server/src/middleware/rateLimitMiddleware.js
// ==============================================================================

import rateLimit from 'express-rate-limit';

/**
 * 1. General API Rate Limiter
 * Applied across all /api routes to prevent general Denial-of-Service (DoS) scraping.
 * Limit: 100 requests per 15-minute window per IP address.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the deprecated `X-RateLimit-*` headers
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Too many requests from this IP address. Please try again after 15 minutes.'
  }
});

/**
 * 2. Strict Authentication Rate Limiter
 * Applied to /api/auth/register and /api/auth/login to block brute-force
 * password guessing and automated account creation spam.
 * Limit: 15 requests per 15-minute window per IP address.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Too many authentication attempts from this IP. Please wait 15 minutes before retrying.'
  }
});

/**
 * 3. Grounded AI Endpoint Rate Limiter
 * Applied to /api/ai/recommend-service to protect server-side Gemini API
 * token quotas and prevent automated prompt spamming.
 * Limit: 10 requests per 15-minute window per IP address.
 */
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    statusCode: 429,
    message: 'AI Matchmaker request limit reached (10 per 15 minutes). Please wait before requesting another recommendation.'
  }
});