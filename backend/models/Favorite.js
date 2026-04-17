const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookSlug: { type: String, required: true },
  addedAt: { type: Date, default: Date.now },
});

// User can only favorite the same book once.
favoriteSchema.index({ userId: 1, bookSlug: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
