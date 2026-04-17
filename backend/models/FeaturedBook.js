const mongoose = require('mongoose');

// Tracks which books an admin has pinned to the homepage featured strip.
// bookSlug references the external Warhammer API not a local ObjectId.
const featuredBookSchema = new mongoose.Schema({
  bookSlug: { type: String, required: true, unique: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: Number, default: 0 },
  addedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('FeaturedBook', featuredBookSchema);
