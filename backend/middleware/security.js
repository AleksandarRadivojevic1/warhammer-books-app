const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const env = require('../config/env');

// Global rate limiter — applied to all routes.
// Allows 100 requests per IP per 15 minutes before blocking.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Stricter rate limiter for auth routes to slow down brute force attempts.
// 10 requests per IP per 15 minutes.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, please try again later.' },
});

const applySecurity = (app) => {
  // Sets secure HTTP headers (XSS protection, no sniffing, etc.).
  app.use(helmet());

  // Restricts cross-origin requests to the configured frontend origin only.
  app.use(cors({ origin: env.frontendOrigin, credentials: true }));

  app.use(globalLimiter);

  // Strips MongoDB operators ($where, $gt, etc.) from request data to prevent NoSQL injection attacks.
  app.use(mongoSanitize());
};

module.exports = { applySecurity, authLimiter };
