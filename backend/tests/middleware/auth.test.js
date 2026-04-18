const jwt = require('jsonwebtoken');

// Set env vars before importing anything that reads them.
process.env.JWT_ACCESS_SECRET = 'test_access_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
process.env.MONGO_URI = 'mongodb://localhost/test';
process.env.WARHAMMER_API_URL = 'http://localhost:3001';
process.env.FRONTEND_ORIGIN = 'http://localhost:5173';

const auth = require('../../middleware/auth');
const adminOnly = require('../../middleware/adminOnly');

// Minimal mock of Express res object — only the methods our middleware calls.
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('auth middleware', () => {
  const secret = 'test_access_secret';

  test('calls next() with valid Bearer token', () => {
    const token = jwt.sign({ id: '123', role: 'user' }, secret);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();
    auth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.id).toBe('123');
  });

  test('returns 401 when no token provided', () => {
    const req = { headers: {} };
    const res = mockRes();
    auth(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns 401 for invalid token', () => {
    const req = { headers: { authorization: 'Bearer badtoken' } };
    const res = mockRes();
    auth(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('adminOnly middleware', () => {
  test('calls next() for admin role', () => {
    const req = { user: { role: 'admin' } };
    const next = jest.fn();
    adminOnly(req, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  test('returns 403 for non-admin user', () => {
    const req = { user: { role: 'user' } };
    const res = mockRes();
    adminOnly(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
