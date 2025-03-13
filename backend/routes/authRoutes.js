const express = require('express');
const authController = require('../controllers/authController');
const { validateSignup, validateLogin, validateUpdatePassword } = require('../middleware/validator');

const router = express.Router();

// Public routes
router.post('/signup', validateSignup, authController.signup);
router.post('/login', validateLogin, authController.login);
router.get('/logout', authController.logout);

// Protected routes
router.use(authController.protect);

router.patch(
  '/update-password',
  validateUpdatePassword,
  authController.updatePassword
);

module.exports = router;