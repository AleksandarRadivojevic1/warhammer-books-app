const express = require('express');
const FeaturedBook = require('../models/FeaturedBook');
const { proxy } = require('../utils/proxy');

const router = express.Router();

// GET /api/featured — public endpoint.
// Fetches the ordered list of featured slugs from MongoDB, then hydrates each
// one with full book data from the Warhammer API. Books that fail to hydrate
// (e.g. a slug that no longer exists upstream) are silently dropped.
router.get('/', async (req, res, next) => {
  try {
    const featured = await FeaturedBook.find().sort({ order: 1 });
    if (featured.length === 0) return res.json([]);

    const books = await Promise.all(
      featured.map(async (f) => {
        try {
          const book = await proxy(`/api/v1/books/${f.bookSlug}`);
          return { ...book, featuredOrder: f.order, featuredId: f._id };
        } catch {
          return null;
        }
      })
    );

    res.json(books.filter(Boolean));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
