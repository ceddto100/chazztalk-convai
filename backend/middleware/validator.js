const Joi = require('joi');
const ApiError = require('../utils/apiError');

/**
 * Middleware to validate request data using Joi schemas
 * @param {Object} schema - Joi validation schema
 * @param {String} source - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false, // Return all errors
      stripUnknown: true, // Remove unknown fields
      errors: {
        wrap: {
          label: false // Don't wrap error labels
        }
      }
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join('; ');
      
      return next(new ApiError(errorMessage, 400));
    }

    // Replace with validated data
    req[source] = value;
    next();
  };
};

// Call validation schemas
const callSchemas = {
  // Schema for creating a new call
  create: Joi.object({
    customerId: Joi.string().required().trim(),
    callDetails: Joi.object().default({}),
    status: Joi.string().valid('initiated', 'answered', 'completed', 'missed').default('initiated'),
    startTime: Joi.date().default(Date.now),
    metadata: Joi.object({
      elevenlabsSessionId: Joi.string(),
      elevenlabsSignedUrl: Joi.string(),
      elevenlabsAgentId: Joi.string(),
      initiatedBy: Joi.string().valid('ai', 'customer', 'system'),
      tags: Joi.array().items(Joi.string())
    }).default({}),
    transcript: Joi.array().items(
      Joi.object({
        speaker: Joi.string().required(),
        text: Joi.string().required(),
        timestamp: Joi.date().default(Date.now)
      })
    ).default([])
  }),

  // Schema for updating an existing call
  update: Joi.object({
    status: Joi.string().valid('initiated', 'answered', 'completed', 'missed'),
    endTime: Joi.date(),
    metadata: Joi.object(),
    transcript: Joi.array().items(
      Joi.object({
        speaker: Joi.string().required(),
        text: Joi.string().required(),
        timestamp: Joi.date().default(Date.now)
      })
    )
  }).min(1) // At least one field must be present
};

// User validation schemas
const userSchemas = {
  // Schema for user signup
  signup: Joi.object({
    name: Joi.string().required().trim(),
    email: Joi.string().email().required().lowercase().trim(),
    password: Joi.string().min(8).required()
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
      .message('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    passwordConfirm: Joi.string().required().valid(Joi.ref('password'))
      .messages({'any.only': 'Passwords do not match'}),
    role: Joi.string().valid('user', 'admin').default('user')
  }),

  // Schema for user login
  login: Joi.object({
    email: Joi.string().email().required().lowercase().trim(),
    password: Joi.string().required()
  }),

  // Schema for password update
  updatePassword: Joi.object({
    passwordCurrent: Joi.string().required(),
    password: Joi.string().min(8).required()
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
      .message('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    passwordConfirm: Joi.string().required().valid(Joi.ref('password'))
      .messages({'any.only': 'Passwords do not match'})
  })
};

// Export validation middleware for specific operations
module.exports = {
  // Call validations
  validateCreateCall: validate(callSchemas.create),
  validateUpdateCall: validate(callSchemas.update),
  
  // User validations
  validateSignup: validate(userSchemas.signup),
  validateLogin: validate(userSchemas.login),
  validateUpdatePassword: validate(userSchemas.updatePassword)
};