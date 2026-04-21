require('dotenv').config();

const env = require('./config/env');
const express = require('express');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { applySecurity, authLimiter } = require('./middleware/security');
const auth = require('./middleware/auth');
const adminOnly = require('./middleware/adminOnly');

const app = express();

applySecurity(app);
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));

// Simple health check — useful for uptime monitoring and smoke tests.
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Auth routes get the stricter rate limiter (10 req / 15 min) to slow brute force.
app.use('/api/auth', authLimiter, require('./routes/auth'));

// Proxy routes — forward requests to the external Warhammer Books API.
app.use('/api/books', require('./routes/books'));
app.use('/api/authors', require('./routes/authors'));
app.use('/api/series', require('./routes/series'));
app.use('/api/primarchs', require('./routes/primarchs'));

// Featured is public — anyone can see the homepage strip.
app.use('/api/featured', require('./routes/featured'));
// Admin routes require a valid JWT and admin role.
app.use('/api/admin', auth, adminOnly, require('./routes/admin'));
// User routes — favorites and reading list, requires auth.
app.use('/api/user', auth, require('./routes/user'));

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));


// Tries to forward the upstream API status/message if available.
app.use((err, req, res, next) => {
  console.error(err.message);
  const status = err.response?.status || 500;
  const message = err.response?.data?.error || err.message || 'Internal server error';
  res.status(status).json({ error: message });
});

// Only start the HTTP server when this file is run directly (not during tests).
if (require.main === module) {
  connectDB()
    .then(() => {
      app.listen(env.port, '0.0.0.0', () => console.log(`Backend running on port ${env.port}`));
    })
    .catch((err) => {
      console.error('Failed to connect to MongoDB:', err.message);
      process.exit(1);
    });
}

module.exports = app;
