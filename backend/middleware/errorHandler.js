const ApiError = require('../utils/apiError');
const logger = require('../config/logger');

/**
 * Handle MongoDB duplicate key errors
 */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate field value: ${value}. Please use another value for ${field}.`;
  return new ApiError(message, 400);
};

/**
 * Handle MongoDB validation errors
 */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new ApiError(message, 400);
};

/**
 * Handle MongoDB cast errors (invalid ID)
 */
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new ApiError(message, 400);
};

/**
 * Handle JWT errors
 */
const handleJWTError = () => {
  return new ApiError('Invalid token. Please log in again.', 401);
};

/**
 * Handle JWT expired error
 */
const handleJWTExpiredError = () => {
  return new ApiError('Your token has expired. Please log in again.', 401);
};

/**
 * Send error response in development environment
 */
const sendErrorDev = (err, req, res) => {
  // Log error
  logger.error('ERROR 💥', {
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err
  });

  // API error response
  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

/**
 * Send error response in production environment
 */
const sendErrorProd = (err, req, res) => {
  // Log error
  logger.error('ERROR 💥', {
    status: err.status,
    message: err.message,
    isOperational: err.isOperational,
    stack: err.stack
  });

  // Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }

  // Programming or other unknown error: don't leak error details
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong'
  });
};

/**
 * Global error handling middleware
 */
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    // Handle specific errors in production
    let error = { ...err };
    error.message = err.message;
    error.name = err.name;

    // MongoDB errors
    if (error.code === 11000) error = handleDuplicateKeyError(error);
    if (error.name === 'ValidationError') error = handleValidationError(error);
    if (error.name === 'CastError') error = handleCastError(error);

    // JWT errors
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};