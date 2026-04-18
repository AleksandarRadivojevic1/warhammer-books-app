const express = require('express');
const { proxy } = require('../utils/proxy');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const data = await proxy('/api/v1/books', req.query);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const data = await proxy(`/api/v1/books/${req.params.slug}`);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/:slug/related', async (req, res, next) => {
  try {
    const data = await proxy(`/api/v1/books/${req.params.slug}/related`);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
