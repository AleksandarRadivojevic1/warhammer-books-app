process.env.JWT_ACCESS_SECRET = 'test_access_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
process.env.MONGO_URI = 'mongodb://localhost/test';
process.env.WARHAMMER_API_URL = 'http://localhost:3001';
process.env.FRONTEND_ORIGIN = 'http://localhost:5173';

// Mock the proxy utility before requiring the app.
// This prevents real HTTP calls to the Warhammer API during tests.
jest.mock('../../utils/proxy');
const { proxy } = require('../../utils/proxy');

const request = require('supertest');
const app = require('../../server');

const mockBooksResponse = {
  count: 1,
  next: null,
  previous: null,
  results: [{ title: 'Horus Rising', slug: 'horus-rising' }],
};

afterEach(() => jest.clearAllMocks());

describe('GET /api/books', () => {
  test('returns proxied book list', async () => {
    proxy.mockResolvedValue(mockBooksResponse);
    const res = await request(app).get('/api/books');
    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0].title).toBe('Horus Rising');
  });

  test('forwards query params to the Warhammer API', async () => {
    proxy.mockResolvedValue(mockBooksResponse);
    await request(app).get('/api/books?search=horus&era=heresy');
    expect(proxy).toHaveBeenCalledWith(
      '/api/v1/books',
      expect.objectContaining({ search: 'horus', era: 'heresy' })
    );
  });
});

describe('GET /api/books/:slug', () => {
  test('returns proxied book detail', async () => {
    proxy.mockResolvedValue({ title: 'Horus Rising', slug: 'horus-rising' });
    const res = await request(app).get('/api/books/horus-rising');
    expect(res.status).toBe(200);
    expect(res.body.slug).toBe('horus-rising');
  });
});
