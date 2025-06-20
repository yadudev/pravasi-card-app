const express = require('express');
const { body, param } = require('express-validator');
const AuthController = require('../../controllers/admin/authController'); // Updated path
const AuthMiddleware = require('../../middleware/auth');
const ValidationMiddleware = require('../../middleware/validation');
const UploadMiddleware = require('../../middleware/upload'); // Your existing upload middleware

const router = express.Router();

// Admin login with rate limiting
router.post(
  '/login',
  AuthController.getLoginLimiter(), // Rate limiting middleware
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('rememberMe')
      .optional()
      .isBoolean()
      .withMessage('Remember me must be a boolean'),
    ValidationMiddleware.validate,
  ],
  AuthController.adminLogin // Updated method name
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
    body('avatar')
      .optional()
      .isString()
      .withMessage('Avatar must be a string'),
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

// Check specific permission
router.get(
  '/permissions/check/:permission',
  [
    AuthMiddleware.authenticate,
    param('permission')
      .notEmpty()
      .isString()
      .withMessage('Permission parameter is required'),
    ValidationMiddleware.validate,
  ],
  AuthController.checkPermission
);

// Forgot password with rate limiting
router.post(
  '/forgot-password',
  AuthController.getResetPasswordLimiter(), // Rate limiting middleware
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('userType')
      .optional()
      .equals('admin')
      .withMessage('User type must be admin for admin routes'),
    ValidationMiddleware.validate,
  ],
  AuthController.forgotPassword
);

// Reset password
router.post(
  '/reset-password',
  [
    body('token')
      .notEmpty()
      .isString()
      .withMessage('Reset token is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        'New password must be at least 8 characters with uppercase, lowercase, and number'
      ),
    body('userType')
      .optional()
      .equals('admin')
      .withMessage('User type must be admin for admin routes'),
    ValidationMiddleware.validate,
  ],
  AuthController.resetPassword
);

// Upload avatar
router.post(
  '/upload-avatar',
  AuthMiddleware.authenticate,
  UploadMiddleware.imageUpload({
    destination: 'uploads/avatars',
    maxSize: 2 * 1024 * 1024, // 2MB for avatars
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
  }).single('avatar'),
  AuthController.uploadAvatar
);

module.exports = router