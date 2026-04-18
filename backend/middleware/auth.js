const jwt = require('jsonwebtoken');
const env = require('../config/env');

// Verifies the Bearer token on protected routes.
// On success, attaches the decoded payload as req.user so route handlers
// can access the authenticated user's id and role.
const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, env.jwtAccessSecret);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = auth;
