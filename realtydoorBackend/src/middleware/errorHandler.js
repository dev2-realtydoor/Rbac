const ApiError = require('../utils/ApiError');
const logger = require('../lib/logger');

function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err instanceof ApiError ? err.message : 'Internal Server Error';
  const data = err instanceof ApiError ? err.data : undefined;

  if (statusCode >= 500) {
    logger.error('Unhandled error', {
      requestId: req.requestId,
      userId: req.user?.id || null,
      method: req.method,
      url: req.originalUrl,
      statusCode,
      error: err.message,
      stack: err.stack,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(data ? { data } : {}),
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}

module.exports = { notFound, errorHandler };
