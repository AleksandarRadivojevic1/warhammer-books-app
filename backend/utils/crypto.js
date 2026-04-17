const crypto = require('crypto');
const bcrypt = require('bcrypt');

const BCRYPT_ROUNDS = 12;

// Two-layer password hashing:
// 1. SHA-256 the plain password (fast, deterministic)
// 2. Append a random per-user salt
// 3. Run through bcrypt (slow by design, resists brute force)
// Storing the salt separately lets us reproduce the input to bcrypt.compare on login.
const hashPassword = async (plainPassword) => {
  const salt = crypto.randomBytes(32).toString('hex');
  const sha = crypto.createHash('sha256').update(plainPassword).digest('hex');
  const hash = await bcrypt.hash(sha + salt, BCRYPT_ROUNDS);
  return { hash, salt };
};

const verifyPassword = async (plainPassword, hash, salt) => {
  const sha = crypto.createHash('sha256').update(plainPassword).digest('hex');
  return bcrypt.compare(sha + salt, hash);
};

module.exports = { hashPassword, verifyPassword };
