const axios = require('axios');
const env = require('../config/env');

// Dedicated axios instance for the Warhammer API.
// Using a shared instance keeps base URL and timeout in one place.
const warhammerClient = axios.create({
  baseURL: env.warhammerApiUrl,
  timeout: 10000,
});

// Wraps Warhammer API calls so route handlers don't deal with axios directly.
// Re-throws upstream errors with the original status attached so the central
// error handler in server.js can forward the correct HTTP status to the client.
const proxy = async (path, params = {}) => {
  try {
    const response = await warhammerClient.get(path, { params });
    return response.data;
  } catch (err) {
    if (err.response) {
      const error = new Error(err.response.data?.error || 'Upstream API error');
      error.response = err.response;
      throw error;
    }
    throw err;
  }
};

module.exports = { proxy };
