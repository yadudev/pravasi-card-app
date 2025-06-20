const express = require('express');
const { body, param } = require('express-validator');
const AuthController = require('../../controllers/admin/authController'); // Updated path
const UserAuthMiddleware = require('../../middleware/userAuth'); // User-specific middleware
const ValidationMiddleware = require('../../middleware/validation');
const UploadMiddleware = require('../../middleware/upload'); // Your existing upload middleware

const userRouter = express.Router();

// User registration
userRouter.post(
  '/register',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        'Password must be at least 8 characters with uppercase, lowercase, and number'
      ),
    body('fullName')
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),
    body('username')
      .optional()
      .isLength({ min: 3, max: 50 })
      .isAlphanumeric()
      .withMessage('Username must be 3-50 characters and alphanumeric only'),
    ValidationMiddleware.validate,
  ],
  AuthController.register
);

// User login with rate limiting
userRouter.post(
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
  AuthController.userLogin // Updated method name
);

// Get user profile
userRouter.get('/profile', UserAuthMiddleware.authenticate, AuthController.getProfile);

// Update user profile
userRouter.put(
  '/profile',
  [
    UserAuthMiddleware.authenticate,
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
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Please provide a valid phone number'),
    body('dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Please provide a valid date of birth'),
    ValidationMiddleware.validate,
  ],
  AuthController.updateProfile
);

// Change password
userRouter.put(
  '/change-password',
  [
    UserAuthMiddleware.authenticate,
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

// User logout
userRouter.post('/logout', UserAuthMiddleware.authenticate, AuthController.logout);

// Refresh token
userRouter.post(
  '/refresh-token',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
    ValidationMiddleware.validate,
  ],
  AuthController.refreshToken
);

// Forgot password with rate limiting
userRouter.post(
  '/forgot-password',
  AuthController.getResetPasswordLimiter(), // Rate limiting middleware
  [
    body('emailOrNumber')
      .notEmpty()
      .withMessage('Email or phone number is required'),
    body('userType')
      .optional()
      .isIn(['user', 'admin'])
      .withMessage('User type must be either user or admin'),
    ValidationMiddleware.validate,
  ],
  AuthController.forgotPassword
);

// Reset password
userRouter.post(
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
      .equals('user')
      .withMessage('User type must be user for user routes'),
    ValidationMiddleware.validate,
  ],
  AuthController.resetPassword
);

// Upload avatar
userRouter.post(
  '/upload-avatar',
  UserAuthMiddleware.authenticate,
  UploadMiddleware.imageUpload({
    destination: 'uploads/avatars',
    maxSize: 2 * 1024 * 1024, // 2MB for avatars
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
  }).single('avatar'),
  AuthController.uploadAvatar
);

module.exports = userRouter;