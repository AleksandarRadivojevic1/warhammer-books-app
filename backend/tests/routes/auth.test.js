// Set env vars before any module that reads them is imported.
process.env.JWT_ACCESS_SECRET = 'test_access_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
process.env.MONGO_URI = 'mongodb://localhost/test';
process.env.WARHAMMER_API_URL = 'http://localhost:3001';
process.env.FRONTEND_ORIGIN = 'http://localhost:5173';

const request = require('supertest');
const app = require('../../server');
const { connect, disconnect, clear } = require('../helpers/db');

beforeAll(connect);
afterAll(disconnect);
afterEach(clear);

describe('POST /api/auth/register', () => {
  test('creates a new user and returns 201', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.email).toBe('test@example.com');
    expect(res.body.role).toBe('user');
    // Sensitive fields must never be returned to the client.
    expect(res.body.passwordHash).toBeUndefined();
  });

  test('returns 409 for duplicate email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@example.com', password: 'password123' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@example.com', password: 'password123' });
    expect(res.status).toBe(409);
  });

  test('returns 400 for invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'password123' });
    expect(res.status).toBe(400);
  });

  test('returns 400 for short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'short' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'login@example.com', password: 'password123' });
  });

  test('returns accessToken and sets cookies on valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe('login@example.com');
    const cookies = res.headers['set-cookie'];
    expect(cookies.some((c) => c.startsWith('refreshToken='))).toBe(true);
    expect(cookies.some((c) => c.startsWith('csrfToken='))).toBe(true);
  });

  test('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  test('returns 401 for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  test('returns new accessToken when refresh token and CSRF token are valid', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'refresh@example.com', password: 'password123' });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'refresh@example.com', password: 'password123' });

    const cookies = loginRes.headers['set-cookie'];
    const csrfCookie = cookies.find((c) => c.startsWith('csrfToken='));
    const csrfToken = csrfCookie.split(';')[0].replace('csrfToken=', '');

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookies.join('; '))
      .set('x-csrf-token', csrfToken);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  test('returns 403 when CSRF token is missing', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'csrf@example.com', password: 'password123' });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'csrf@example.com', password: 'password123' });
    const cookies = loginRes.headers['set-cookie'];

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookies.join('; '));

    expect(res.status).toBe(403);
  });
});

describe('POST /api/auth/logout', () => {
  test('clears auth cookies', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'] || [];
    expect(cookies.some((c) => c.includes('refreshToken=;'))).toBe(true);
  });
});
