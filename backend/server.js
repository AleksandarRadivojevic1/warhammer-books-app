require('dotenv').config();

const env = require('./config/env');
const express = require('express');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { applySecurity, authLimiter } = require('./middleware/security');

const app = express();

applySecurity(app);
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));

// Simple health check — useful for uptime monitoring and smoke tests.
app.get('/health', (req, res) => res.json({ status: 'ok' }));


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
      app.listen(env.port, () => console.log(`Backend running on port ${env.port}`));
    })
    .catch((err) => {
      console.error('Failed to connect to MongoDB:', err.message);
      process.exit(1);
    });
}

module.exports = app;
