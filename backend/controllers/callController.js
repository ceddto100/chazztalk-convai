const Call = require('../models/Call');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../config/logger');

/**
 * Get all calls with filtering, sorting, and pagination
 * GET /api/calls
 */
exports.getCalls = asyncHandler(async (req, res, next) => {
  // Build query
  const queryObj = { ...req.query };
  
  // Fields to exclude from filtering
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(field => delete queryObj[field]);
  
  // Advanced filtering (e.g. gte, gt, lte, lt)
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
  
  // Build query
  let query = Call.find(JSON.parse(queryStr));
  
  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt'); // Default sort by newest first
  }
  
  // Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields);
  } else {
    query = query.select('-__v'); // Exclude '__v' field by default
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 100;
  const skip = (page - 1) * limit;
  
  query = query.skip(skip).limit(limit);
  
  // Execute query
  const calls = await query;
  
  // Get total count for pagination
  const totalCalls = await Call.countDocuments(JSON.parse(queryStr));
  
  logger.info(`Retrieved ${calls.length} calls`);
  
  // Send response
  res.status(200).json({
    status: 'success',
    results: calls.length,
    total: totalCalls,
    page,
    limit,
    totalPages: Math.ceil(totalCalls / limit),
    data: {
      calls
    }
  });
});

/**
 * Get a single call by ID
 * GET /api/calls/:id
 */
exports.getCall = asyncHandler(async (req, res, next) => {
  const call = await Call.findById(req.params.id);
  
  if (!call) {
    return next(new ApiError(`No call found with ID: ${req.params.id}`, 404));
  }
  
  logger.info(`Retrieved call: ${req.params.id}`);
  
  res.status(200).json({
    status: 'success',
    data: {
      call
    }
  });
});

/**
 * Create a new call
 * POST /api/calls
 */
exports.createCall = asyncHandler(async (req, res, next) => {
  // Add user ID from authenticated user
  if (req.user) {
    req.body.createdBy = req.user.id;
  }
  
  const newCall = await Call.create(req.body);
  
  logger.info(`New call created with ID: ${newCall.id}`);
  
  res.status(201).json({
    status: 'success',
    data: {
      call: newCall
    }
  });
});

/**
 * Update a call
 * PATCH /api/calls/:id
 */
exports.updateCall = asyncHandler(async (req, res, next) => {
  // Find and update call
  const call = await Call.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true, // Return updated call
      runValidators: true // Run mongoose validators
    }
  );
  
  if (!call) {
    return next(new ApiError(`No call found with ID: ${req.params.id}`, 404));
  }
  
  // If status is changing to completed or missed, set endTime
  if (req.body.status && ['completed', 'missed'].includes(req.body.status)) {
    call.endTime = new Date();
    await call.save();
  }
  
  logger.info(`Updated call: ${req.params.id}`);
  
  res.status(200).json({
    status: 'success',
    data: {
      call
    }
  });
});

/**
 * Delete a call
 * DELETE /api/calls/:id
 */
exports.deleteCall = asyncHandler(async (req, res, next) => {
  const call = await Call.findByIdAndDelete(req.params.id);
  
  if (!call) {
    return next(new ApiError(`No call found with ID: ${req.params.id}`, 404));
  }
  
  logger.info(`Deleted call: ${req.params.id}`);
  
  res.status(200).json({
    status: 'success',
    message: 'Call successfully deleted'
  });
});

/**
 * Get active calls
 * GET /api/calls/active
 */
exports.getActiveCalls = asyncHandler(async (req, res, next) => {
  const activeCalls = await Call.getActiveCalls();
  
  logger.info(`Retrieved ${activeCalls.length} active calls`);
  
  res.status(200).json({
    status: 'success',
    results: activeCalls.length,
    data: {
      calls: activeCalls
    }
  });
});

/**
 * Get calls by customer ID
 * GET /api/calls/customer/:customerId
 */
exports.getCustomerCalls = asyncHandler(async (req, res, next) => {
  const { customerId } = req.params;
  
  const calls = await Call.find({ customerId }).sort('-createdAt');
  
  logger.info(`Retrieved ${calls.length} calls for customer: ${customerId}`);
  
  res.status(200).json({
    status: 'success',
    results: calls.length,
    data: {
      calls
    }
  });
});