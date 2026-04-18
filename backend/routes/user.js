const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const Favorite = require('../models/Favorite');
const ReadingList = require('../models/ReadingList');

const router = express.Router();

// Reusable slug validator — book slugs are lowercase, digits, and hyphens only.
const slugValidator = body('bookSlug').isString().trim().matches(/^[a-z0-9-]+$/).escape();

// --- Favorites ---

router.get('/favorites', async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ userId: req.user.id }).sort({ addedAt: -1 });
    res.json(favorites.map((f) => ({ bookSlug: f.bookSlug, addedAt: f.addedAt })));
  } catch (err) {
    next(err);
  }
});

router.post('/favorites', [slugValidator, validate], async (req, res, next) => {
  try {
    const { bookSlug } = req.body;
    const existing = await Favorite.findOne({ userId: req.user.id, bookSlug });
    if (existing) return res.status(409).json({ error: 'Already in favorites' });
    const fav = await Favorite.create({ userId: req.user.id, bookSlug });
    res.status(201).json({ bookSlug: fav.bookSlug, addedAt: fav.addedAt });
  } catch (err) {
    next(err);
  }
});

router.delete('/favorites/:slug', async (req, res, next) => {
  try {
    const result = await Favorite.findOneAndDelete({ userId: req.user.id, bookSlug: req.params.slug });
    if (!result) return res.status(404).json({ error: 'Not in favorites' });
    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    next(err);
  }
});

// --- Reading List ---

router.get('/reading-list', async (req, res, next) => {
  try {
    const list = await ReadingList.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    res.json(list.map((item) => ({ bookSlug: item.bookSlug, status: item.status, updatedAt: item.updatedAt })));
  } catch (err) {
    next(err);
  }
});

router.post(
  '/reading-list',
  [slugValidator, body('status').isIn(['want-to-read', 'reading', 'completed']), validate],
  async (req, res, next) => {
    try {
      const { bookSlug, status } = req.body;
      const existing = await ReadingList.findOne({ userId: req.user.id, bookSlug });
      if (existing) return res.status(409).json({ error: 'Already in reading list' });
      const item = await ReadingList.create({ userId: req.user.id, bookSlug, status });
      res.status(201).json({ bookSlug: item.bookSlug, status: item.status, updatedAt: item.updatedAt });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/reading-list/:slug',
  [body('status').isIn(['want-to-read', 'reading', 'completed']), validate],
  async (req, res, next) => {
    try {
      const item = await ReadingList.findOneAndUpdate(
        { userId: req.user.id, bookSlug: req.params.slug },
        { status: req.body.status, updatedAt: new Date() },
        { returnDocument: 'after' }
      );
      if (!item) return res.status(404).json({ error: 'Not in reading list' });
      res.json({ bookSlug: item.bookSlug, status: item.status, updatedAt: item.updatedAt });
    } catch (err) {
      next(err);
    }
  }
);

router.delete('/reading-list/:slug', async (req, res, next) => {
  try {
    const result = await ReadingList.findOneAndDelete({ userId: req.user.id, bookSlug: req.params.slug });
    if (!result) return res.status(404).json({ error: 'Not in reading list' });
    res.json({ message: 'Removed from reading list' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
