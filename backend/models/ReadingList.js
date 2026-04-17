const mongoose = require('mongoose');

const readingListSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookSlug: { type: String, required: true },
  status: {
    type: String,
    enum: ['want-to-read', 'reading', 'completed'],
    required: true,
  },
  updatedAt: { type: Date, default: Date.now },
});

// User can only have one status entry per book.
readingListSchema.index({ userId: 1, bookSlug: 1 }, { unique: true });

module.exports = mongoose.model('ReadingList', readingListSchema);
