// Centralized Error Handling Middleware for Express
function errorHandler(err, req, res, next) {
  console.error('Unhandled Error:', err);

  const statusCode = res.statusCode !== 200 ? res.statusCode : (err.statusCode || 500);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
}

function notFound(req, res, next) {
  const error = new Error(`Resource not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
}

module.exports = {
  errorHandler,
  notFound,
};
