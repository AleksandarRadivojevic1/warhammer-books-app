const express = require('express');
const { body } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { hashPassword, verifyPassword } = require('../utils/crypto');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');
const validate = require('../middleware/validate');
const env = require('../config/env');

const router = express.Router();

const COOKIE_OPTS = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: env.nodeEnv === 'production' ? 'none' : 'strict',
};

const generateTokens = (user) => {
  const payload = { id: user._id.toString(), email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, env.jwtAccessSecret, { expiresIn: '15m' });
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
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const user = await User.create({
        email,
        passwordHash: hash,
        passwordSalt: salt,
        verificationToken,
        verificationExpiry,
      });
      await sendVerificationEmail(email, verificationToken);
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
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

      const { accessToken, refreshToken } = generateTokens(user);
      const csrfToken = crypto.randomBytes(32).toString('hex');
      const maxAge = 7 * 24 * 60 * 60 * 1000;

      res.cookie('refreshToken', refreshToken, { ...COOKIE_OPTS, maxAge });
      res.cookie('csrfToken', csrfToken, { ...COOKIE_OPTS, httpOnly: false, maxAge });

      res.json({
        accessToken,
        csrfToken,
        user: { id: user._id, email: user.email, role: user.role, isVerified: user.isVerified },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/auth/verify/:token
router.get('/verify/:token', async (req, res, next) => {
  try {
    const user = await User.findOne({ verificationToken: req.params.token });
    if (!user) return res.status(400).json({ error: 'Invalid or expired verification link.' });
    if (!user.isVerified) {
      if (user.verificationExpiry < new Date()) {
        return res.status(400).json({ error: 'Invalid or expired verification link.' });
      }
      user.isVerified = true;
      await user.save();
    }
    res.json({ message: 'Email verified successfully.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.isVerified) return res.json({ message: 'If applicable, a new verification email has been sent.' });
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    user.verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();
    await sendVerificationEmail(email, verificationToken);
    res.json({ message: 'If applicable, a new verification email has been sent.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    // Always return success to avoid user enumeration.
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetToken = resetToken;
      user.resetExpiry = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();
      await sendPasswordResetEmail(email, resetToken);
    }
    res.json({ message: 'If an account exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  [body('password').isLength({ min: 8 }).trim(), validate],
  async (req, res, next) => {
    try {
      const { token, password } = req.body;
      const user = await User.findOne({
        resetToken: token,
        resetExpiry: { $gt: new Date() },
      });
      if (!user) return res.status(400).json({ error: 'Invalid or expired reset link.' });
      const { hash, salt } = await hashPassword(password);
      user.passwordHash = hash;
      user.passwordSalt = salt;
      user.resetToken = undefined;
      user.resetExpiry = undefined;
      await user.save();
      res.json({ message: 'Password reset successfully. You can now log in.' });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/refresh
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
