const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { sanitize } = require('express-mongo-sanitize');
const env = require('../config/env');

const isTest = process.env.NODE_ENV === 'test';

// In test mode, replace limiters with a no-op so tests never hit 429.
// Rate limiting is a production concern — testing it would require resetting
// the limiter store between every test, which adds noise without value.
const noOp = (req, res, next) => next();

const globalLimiter = isTest
  ? noOp
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests, please try again later.' },
    });

// Stricter rate limiter for auth routes to slow down brute force attempts.
// 10 requests per IP per 15 minutes.
const authLimiter = isTest
  ? noOp
  : rateLimit({
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

  // Strips MongoDB operators ($where, $gt, etc.) from req.body to prevent NoSQL injection.
  // Express 5 makes req.query a read-only getter, so we sanitize only req.body manually
  // rather than using the middleware form which would attempt to reassign req.query.
  app.use((req, res, next) => {
    if (req.body) req.body = sanitize(req.body);
    next();
  });
};

module.exports = { applySecurity, authLimiter };
