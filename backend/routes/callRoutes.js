const express = require('express');
const callController = require('../controllers/callController');
const authController = require('../controllers/authController');
const { validateCreateCall, validateUpdateCall } = require('../middleware/validator');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// Routes that don't need specific ID
router
  .route('/')
  .get(callController.getCalls)
  .post(validateCreateCall, callController.createCall);

// Get active calls
router.get('/active', callController.getActiveCalls);

// Get calls by customer ID
router.get('/customer/:customerId', callController.getCustomerCalls);

// Routes that need specific ID
router
  .route('/:id')
  .get(callController.getCall)
  .patch(validateUpdateCall, callController.updateCall)
  .delete(
    authController.restrictTo('admin'), // Only admin can delete calls
    callController.deleteCall
  );

module.exports = router;