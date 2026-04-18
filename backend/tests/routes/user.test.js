process.env.JWT_ACCESS_SECRET = 'test_access_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
process.env.MONGO_URI = 'mongodb://localhost/test';
process.env.WARHAMMER_API_URL = 'http://localhost:3001';
process.env.FRONTEND_ORIGIN = 'http://localhost:5173';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../../server');
const { connect, disconnect, clear } = require('../helpers/db');

beforeAll(connect);
afterAll(disconnect);
afterEach(clear);

const userId = new mongoose.Types.ObjectId().toString();
const userToken = () =>
  jwt.sign({ id: userId, email: 'user@test.com', role: 'user' }, 'test_access_secret');

describe('Favorites', () => {
  test('GET /api/user/favorites returns empty array initially', async () => {
    const res = await request(app)
      .get('/api/user/favorites')
      .set('Authorization', `Bearer ${userToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('POST /api/user/favorites adds a book', async () => {
    const res = await request(app)
      .post('/api/user/favorites')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ bookSlug: 'horus-rising' });
    expect(res.status).toBe(201);
    expect(res.body.bookSlug).toBe('horus-rising');
  });

  test('POST /api/user/favorites returns 409 for duplicate', async () => {
    await request(app)
      .post('/api/user/favorites')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ bookSlug: 'horus-rising' });
    const res = await request(app)
      .post('/api/user/favorites')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ bookSlug: 'horus-rising' });
    expect(res.status).toBe(409);
  });

  test('DELETE /api/user/favorites/:slug removes a book', async () => {
    await request(app)
      .post('/api/user/favorites')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ bookSlug: 'horus-rising' });
    const res = await request(app)
      .delete('/api/user/favorites/horus-rising')
      .set('Authorization', `Bearer ${userToken()}`);
    expect(res.status).toBe(200);
  });

  test('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/user/favorites');
    expect(res.status).toBe(401);
  });
});

describe('Reading List', () => {
  test('GET /api/user/reading-list returns empty array initially', async () => {
    const res = await request(app)
      .get('/api/user/reading-list')
      .set('Authorization', `Bearer ${userToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('POST /api/user/reading-list adds a book', async () => {
    const res = await request(app)
      .post('/api/user/reading-list')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ bookSlug: 'horus-rising', status: 'want-to-read' });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('want-to-read');
  });

  test('PATCH /api/user/reading-list/:slug updates status', async () => {
    await request(app)
      .post('/api/user/reading-list')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ bookSlug: 'horus-rising', status: 'want-to-read' });
    const res = await request(app)
      .patch('/api/user/reading-list/horus-rising')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ status: 'reading' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('reading');
  });

  test('POST /api/user/reading-list returns 400 for invalid status', async () => {
    const res = await request(app)
      .post('/api/user/reading-list')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ bookSlug: 'horus-rising', status: 'invalid-status' });
    expect(res.status).toBe(400);
  });

  test('DELETE /api/user/reading-list/:slug removes entry', async () => {
    await request(app)
      .post('/api/user/reading-list')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ bookSlug: 'horus-rising', status: 'reading' });
    const res = await request(app)
      .delete('/api/user/reading-list/horus-rising')
      .set('Authorization', `Bearer ${userToken()}`);
    expect(res.status).toBe(200);
  });
});
