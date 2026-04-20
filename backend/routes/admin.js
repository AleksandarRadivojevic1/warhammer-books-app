const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const FeaturedBook = require('../models/FeaturedBook');
const Favorite = require('../models/Favorite');
const ReadingList = require('../models/ReadingList');
const User = require('../models/User');
const { proxy } = require('../utils/proxy');

const router = express.Router();

// GET /api/admin/stats
router.get('/stats', async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalFavorites,
      totalReadingList,
      statusBreakdown,
      topFavorited,
      topReadingList,
    ] = await Promise.all([
      User.countDocuments(),
      Favorite.countDocuments(),
      ReadingList.countDocuments(),
      ReadingList.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Favorite.aggregate([
        { $group: { _id: '$bookSlug', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      ReadingList.aggregate([
        { $group: { _id: '$bookSlug', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    res.json({
      totals: { users: totalUsers, favorites: totalFavorites, readingList: totalReadingList },
      statusBreakdown: Object.fromEntries(statusBreakdown.map(({ _id, count }) => [_id, count])),
      topFavorited: topFavorited.map(({ _id, count }) => ({ bookSlug: _id, count })),
      topReadingList: topReadingList.map(({ _id, count }) => ({ bookSlug: _id, count })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/featured
router.post(
  '/featured',
  [
    body('bookSlug').isString().trim().matches(/^[a-z0-9-]+$/).escape(),
    body('order').isInt({ min: 0 }).optional(),
    validate,
  ],
  async (req, res, next) => {
    try {
      const { bookSlug, order = 0 } = req.body;

      // Verify the slug exists in the Warhammer API before saving.
      try {
        await proxy(`/api/v1/books/${bookSlug}`);
      } catch {
        return res.status(404).json({ error: `No book found with slug "${bookSlug}"` });
      }

      const existing = await FeaturedBook.findOne({ bookSlug });
      if (existing) return res.status(409).json({ error: 'Book is already featured' });

      const featured = await FeaturedBook.create({ bookSlug, addedBy: req.user.id, order });
      res.status(201).json(featured);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/admin/featured/reorder — set the full order in one shot.
// Accepts an array of IDs in the desired display order and assigns each
// an order value matching its index, avoiding partial-update race conditions.
router.put(
  '/featured/reorder',
  [body('ids').isArray({ min: 1 }), validate],
  async (req, res, next) => {
    try {
      const { ids } = req.body;
      await Promise.all(
        ids.map((id, index) =>
          FeaturedBook.findByIdAndUpdate(id, { order: index })
        )
      );
      res.json({ message: 'Order updated' });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/admin/featured/:id
router.delete('/featured/:id', async (req, res, next) => {
  try {
    const featured = await FeaturedBook.findByIdAndDelete(req.params.id);
    if (!featured) return res.status(404).json({ error: 'Featured book not found' });
    res.json({ message: 'Removed from featured' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
