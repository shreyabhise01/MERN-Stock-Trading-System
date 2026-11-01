const { validationResult } = require('express-validator');

// Place after express-validator rules; returns 400 with readable messages
module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
};
