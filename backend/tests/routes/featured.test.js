process.env.JWT_ACCESS_SECRET = 'test_access_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
process.env.MONGO_URI = 'mongodb://localhost/test';
process.env.WARHAMMER_API_URL = 'http://localhost:3001';
process.env.FRONTEND_ORIGIN = 'http://localhost:5173';

// Mock proxy before requiring the app so no real API calls are made.
jest.mock('../../utils/proxy');
const { proxy } = require('../../utils/proxy');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../../server');
const FeaturedBook = require('../../models/FeaturedBook');
const { connect, disconnect, clear } = require('../helpers/db');

beforeAll(connect);
afterAll(disconnect);
afterEach(clear);

const makeAdminToken = () =>
  jwt.sign(
    { id: new mongoose.Types.ObjectId().toString(), email: 'admin@test.com', role: 'admin' },
    'test_access_secret'
  );

describe('GET /api/featured', () => {
  test('returns empty array when no featured books exist', async () => {
    const res = await request(app).get('/api/featured');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns hydrated featured books sorted by order ascending', async () => {
    proxy.mockResolvedValue({ title: 'A Book', slug: 'a-book', coverImage: null });
    const adminId = new mongoose.Types.ObjectId();
    await FeaturedBook.create([
      { bookSlug: 'horus-rising', addedBy: adminId, order: 1 },
      { bookSlug: 'false-gods', addedBy: adminId, order: 0 },
    ]);
    const res = await request(app).get('/api/featured');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    // false-gods has order 0 so it comes first
    expect(res.body[0].featuredOrder).toBe(0);
    expect(res.body[1].featuredOrder).toBe(1);
  });
});

describe('POST /api/admin/featured', () => {
  test('returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/admin/featured')
      .send({ bookSlug: 'horus-rising' });
    expect(res.status).toBe(401);
  });

  test('returns 403 for non-admin user', async () => {
    const token = jwt.sign({ id: 'user1', role: 'user' }, 'test_access_secret');
    const res = await request(app)
      .post('/api/admin/featured')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookSlug: 'horus-rising' });
    expect(res.status).toBe(403);
  });

  test('admin can add a featured book', async () => {
    const res = await request(app)
      .post('/api/admin/featured')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ bookSlug: 'horus-rising', order: 0 });
    expect(res.status).toBe(201);
    expect(res.body.bookSlug).toBe('horus-rising');
  });

  test('returns 409 for duplicate slug', async () => {
    const token = makeAdminToken();
    await request(app)
      .post('/api/admin/featured')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookSlug: 'horus-rising' });
    const res = await request(app)
      .post('/api/admin/featured')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookSlug: 'horus-rising' });
    expect(res.status).toBe(409);
  });
});

describe('DELETE /api/admin/featured/:id', () => {
  test('admin can remove a featured book', async () => {
    const adminId = new mongoose.Types.ObjectId();
    const fb = await FeaturedBook.create({ bookSlug: 'horus-rising', addedBy: adminId, order: 0 });
    const res = await request(app)
      .delete(`/api/admin/featured/${fb._id}`)
      .set('Authorization', `Bearer ${makeAdminToken()}`);
    expect(res.status).toBe(200);
    expect(await FeaturedBook.findById(fb._id)).toBeNull();
  });
});
