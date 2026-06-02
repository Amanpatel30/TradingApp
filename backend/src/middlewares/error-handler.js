const Logger = require('../utils/logger');
const { CustomError } = require('../utils/custom-error');

const logger = new Logger('ErrorHandler');

/**
 * Redact sensitive information from objects before logging
 */
const redactSensitiveInfo = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  const redacted = { ...obj };
  const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken', 'secret'];

  Object.keys(redacted).forEach(key => {
    if (sensitiveFields.includes(key)) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object') {
      redacted[key] = redactSensitiveInfo(redacted[key]);
    }
  });

  return redacted;
};

/**
 * Centralized Error Handler Middleware
 * Handles all errors in the application
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode;

  // Log error details - mask sensitive fields in request data
  logger.error(err.message, { 
    statusCode: err.statusCode || 500,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: redactSensitiveInfo(req.body),
    params: redactSensitiveInfo(req.params),
    query: redactSensitiveInfo(req.query),
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    error.message = 'Validation Error';
    error.statusCode = 422;
    error.errors = errors;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.message = `${field} already exists`;
    error.statusCode = 409;
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error.message = 'Resource not found';
    error.statusCode = 404;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.statusCode = 401;
  }

  // Build response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  const response = {
    success: false,
    message,
    ...(error.errors && { errors: error.errors }),
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Handle unhandled promise rejections
 */
const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! Shutting down...', {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  });
};

/**
 * Handle uncaught exceptions
 */
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
