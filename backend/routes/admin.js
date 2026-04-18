const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const FeaturedBook = require('../models/FeaturedBook');

const router = express.Router();

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
      const existing = await FeaturedBook.findOne({ bookSlug });
      if (existing) return res.status(409).json({ error: 'Book already featured' });
      const featured = await FeaturedBook.create({ bookSlug, addedBy: req.user.id, order });
      res.status(201).json(featured);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/admin/featured/:id — update display order of a featured book.
router.patch(
  '/featured/:id',
  [body('order').isInt({ min: 0 }), validate],
  async (req, res, next) => {
    try {
      const featured = await FeaturedBook.findByIdAndUpdate(
        req.params.id,
        { order: req.body.order },
        { new: true }
      );
      if (!featured) return res.status(404).json({ error: 'Featured book not found' });
      res.json(featured);
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
