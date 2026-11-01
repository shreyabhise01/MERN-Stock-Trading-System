class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const notFound = (req, res, next) => next(new ApiError(404, `Route not found: ${req.originalUrl}`));

// Centralized error handler: every error in the app ends up here
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  let status = err.status || 500;
  let message = err.message;
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid id format';
  } else if (err.code === 11000) {
    status = 409;
    message = `${Object.keys(err.keyValue || {}).join(', ')} already exists`;
  }
  if (status === 500) {
    console.error(err);
    if (process.env.NODE_ENV === 'production') message = 'Server error';
  }
  res.status(status).json({ message });
};

module.exports = { ApiError, asyncHandler, notFound, errorHandler };
