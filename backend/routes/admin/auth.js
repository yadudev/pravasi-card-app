const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../../controllers/admin/authController');
const AuthMiddleware = require('../../middleware/auth');
const ValidationMiddleware = require('../../middleware/validation');

const router = express.Router();

// Admin login
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    ValidationMiddleware.validate,
  ],
  AuthController.login
);

// Get admin profile
router.get('/profile', AuthMiddleware.authenticate, AuthController.getProfile);

// Update admin profile
router.put(
  '/profile',
  [
    AuthMiddleware.authenticate,
    body('fullName')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),
    body('username')
      .optional()
      .isLength({ min: 3, max: 50 })
      .isAlphanumeric()
      .withMessage('Username must be 3-50 characters and alphanumeric only'),
    ValidationMiddleware.validate,
  ],
  AuthController.updateProfile
);

// Change password
router.put(
  '/change-password',
  [
    AuthMiddleware.authenticate,
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        'New password must be at least 8 characters with uppercase, lowercase, and number'
      ),
    ValidationMiddleware.validate,
  ],
  AuthController.changePassword
);

// Admin logout
router.post('/logout', AuthMiddleware.authenticate, AuthController.logout);

// Refresh token
router.post(
  '/refresh-token',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
    ValidationMiddleware.validate,
  ],
  AuthController.refreshToken
);

// Get admin permissions
router.get(
  '/permissions',
  AuthMiddleware.authenticate,
  AuthController.getPermissions
);

module.exports = router;
