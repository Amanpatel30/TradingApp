const Logger = require('../utils/logger');
const { sanitizeObject } = require('../utils/sanitizer');

const logger = new Logger('ErrorHandler');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode;

  logger.error(err.message, {
    statusCode: err.statusCode || 500,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: sanitizeObject(req.body),
    params: sanitizeObject(req.params),
    query: sanitizeObject(req.query),
  });

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    error.message = 'Validation Error';
    error.statusCode = 422;
    error.errors = errors;
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.message = `${field} already exists`;
    error.statusCode = 409;
  }

  if (err.name === 'CastError') {
    error.message = 'Resource not found';
    error.statusCode = 404;
  }

  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.statusCode = 401;
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  const response = {
    success: false,
    message,
    ...(error.errors && { errors: error.errors }),
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! Shutting down...', {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  });
};

const handleUncaughtException = () => {
  process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! Shutting down...', {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  });
};

module.exports = {
  errorHandler,
  handleUnhandledRejection,
  handleUncaughtException,
};
