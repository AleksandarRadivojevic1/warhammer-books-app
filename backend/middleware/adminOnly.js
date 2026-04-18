// Must be used after the auth middleware — relies on req.user being set.
// Blocks the request if the authenticated user is not an admin.
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = adminOnly;
