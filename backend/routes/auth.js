const express = require('express');
const { body } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { hashPassword, verifyPassword } = require('../utils/crypto');
const validate = require('../middleware/validate');
const env = require('../config/env');

const router = express.Router();

// Cookie options shared across login/logout.
// httpOnly prevents JavaScript from reading the cookie (XSS protection).
// secure is true in production so cookies are only sent over HTTPS.
const COOKIE_OPTS = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  // cross-domain (Vercel frontend ↔ Railway backend) requires 'none' + secure
  sameSite: env.nodeEnv === 'production' ? 'none' : 'strict',
};

const generateTokens = (user) => {
  const payload = { id: user._id.toString(), email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, env.jwtAccessSecret, { expiresIn: '15m' });
  // Refresh token carries only the user id — the full payload is re-fetched on refresh.
  const refreshToken = jwt.sign({ id: user._id.toString() }, env.jwtRefreshSecret, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

// POST /api/auth/register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().escape(),
    body('password').isLength({ min: 8 }).trim(),
    validate,
  ],
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const existing = await User.findOne({ email });
      if (existing) return res.status(409).json({ error: 'Email already registered' });
      const { hash, salt } = await hashPassword(password);
      const user = await User.create({ email, passwordHash: hash, passwordSalt: salt });
      res.status(201).json({ id: user._id, email: user.email, role: user.role });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().escape(),
    body('password').notEmpty().trim(),
    validate,
  ],
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      const valid = user && (await verifyPassword(password, user.passwordHash, user.passwordSalt));
      // Return the same error for wrong email or wrong password to avoid user enumeration.
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

      const { accessToken, refreshToken } = generateTokens(user);
      const csrfToken = crypto.randomBytes(32).toString('hex');
      const maxAge = 7 * 24 * 60 * 60 * 1000;

      res.cookie('refreshToken', refreshToken, { ...COOKIE_OPTS, maxAge });
      // csrfToken cookie kept for same-domain dev; also returned in body so
      // cross-domain frontends can store it in localStorage.
      res.cookie('csrfToken', csrfToken, { ...COOKIE_OPTS, httpOnly: false, maxAge });

      res.json({ accessToken, csrfToken, user: { id: user._id, email: user.email, role: user.role } });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/refresh
// Validates both the httpOnly refresh token and the CSRF token sent as a header.
// This double-submit pattern ensures a CSRF attack can't silently refresh tokens.
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken, csrfToken: cookieCsrf } = req.cookies;
    const headerCsrf = req.headers['x-csrf-token'];

    if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });
    if (!cookieCsrf || cookieCsrf !== headerCsrf) {
      return res.status(403).json({ error: 'CSRF validation failed' });
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, env.jwtRefreshSecret);
    } catch {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ error: 'User not found' });

    const { accessToken } = generateTokens(user);
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', COOKIE_OPTS);
  res.clearCookie('csrfToken', { ...COOKIE_OPTS, httpOnly: false });
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
