const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../config/logger');

/**
 * Authentication middleware
 * Verifies JWT token and sets user on request object
 */
exports.authenticate = asyncHandler(async (req, res, next) => {
  // 1) Get token from authorization header or cookie
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new ApiError('You are not logged in. Please log in to get access.', 401));
  }

  try {
    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    
    if (!currentUser) {
      return next(new ApiError('The user belonging to this token no longer exists.', 401));
    }

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(new ApiError('User recently changed password. Please log in again.', 401));
    }

    // Grant access to protected route
    req.user = currentUser;
    res.locals.user = currentUser;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError('Invalid token. Please log in again.', 401));
    }
    
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError('Your session has expired. Please log in again.', 401));
    }
    
    logger.error('Authentication error:', error);
    return next(new ApiError('Authentication failed. Please log in again.', 401));
  }
});

/**
 * Authorization middleware
 * Restricts access based on user role
 * @param {...String} roles - Allowed roles
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError('Authentication required', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new ApiError('You do not have permission to perform this action', 403));
    }
    
    next();
  };
};