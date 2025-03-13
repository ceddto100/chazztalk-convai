const express = require('express');
const elevenLabsController = require('../controllers/elevenLabsController');
const authController = require('../controllers/authController');

const router = express.Router();

// Public endpoint to get signed URL (no authentication required)
router.get('/get-signed-url', elevenLabsController.getSignedUrl);

// Public webhook endpoint for Eleven Labs callbacks
router.post('/elevenlabs/webhook', elevenLabsController.handleWebhook);

// Protected routes
router.use(authController.protect);

// Test connection to Eleven Labs API (requires authentication)
router.get(
  '/elevenlabs/test-connection', 
  authController.restrictTo('admin'),
  elevenLabsController.testConnection
);

module.exports = router;