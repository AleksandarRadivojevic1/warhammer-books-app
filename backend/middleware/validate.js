const { validationResult } = require('express-validator');

// Reads the results of express-validator checks that ran before this middleware.
// If any validation failed, responds with 400 and the list of errors.
// Otherwise passes control to the route handler.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = validate;
