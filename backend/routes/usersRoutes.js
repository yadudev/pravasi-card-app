const express = require('express');
const { body, query, param } = require('express-validator');
const UserController = require('../controllers/admin/userController');
const AuthMiddleware = require('../middleware/userAuth');
const ValidationMiddleware = require('../middleware/validation');

const router = express.Router();

// signup user
router.post(
  '/signup',
  [
    body('emailOrNumber')
      .notEmpty()
      .withMessage('Email or phone is required')
      .custom((value) => {
        const isEmail = value.includes('@');
        const isPhone = /^[6-9]\d{9}$/.test(value);
        if (!isEmail && !isPhone) {
          throw new Error(
            'Please provide a valid email or Indian phone number'
          );
        }
        return true;
      }),

    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and a number'),

    ValidationMiddleware.validate,
  ],
  UserController.signup
);

// user profile creation
router.post(
  '/createProfile',
  [
    body('userId')
      .notEmpty()
      .withMessage('User ID is required')
      .isInt({ min: 1 })
      .withMessage('User ID must be a valid positive integer'),
    body('fullName')
      .notEmpty()
      .withMessage('Full name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Full name should only contain letters and spaces'),
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('phone')
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Please provide a valid Indian phone number'),
    body('location')
      .notEmpty()
      .withMessage('Location is required')
      .isLength({ min: 2, max: 200 })
      .withMessage('Location must be between 2 and 200 characters')
      .trim(),

    ValidationMiddleware.validate,
  ],
  UserController.createProfile
);

// Get profile status of the logged-in user
router.get(
  '/profile-status',
  [AuthMiddleware.authenticate],
  UserController.getProfileStatus
);

// ========================================
// ✅ NEW: CARD MANAGEMENT ENDPOINTS
// ========================================

// Get user card details with full information
router.get(
  '/card/details',
  [AuthMiddleware.authenticate],
  UserController.getCardDetails
);

// Activate user card
router.post(
  '/card/activate',
  [AuthMiddleware.authenticate, ValidationMiddleware.validate],
  UserController.activateCard
);

// Renew user card
router.post(
  '/card/renew',
  [
    AuthMiddleware.authenticate,
    body('months')
      .optional()
      .isInt({ min: 1, max: 60 })
      .withMessage('Months must be between 1 and 60'),
    ValidationMiddleware.validate,
  ],
  UserController.renewCard
);

// ========================================
// ✅ NEW: OTP HISTORY ENDPOINT
// ========================================

// Get user OTP send history
router.get(
  '/otp/history',
  [
    AuthMiddleware.authenticate,
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('purpose')
      .optional()
      .isIn([
        'card_activation',
        'email_verification',
        'phone_verification',
        'password_reset',
        'account_verification',
        'transaction_verification',
        'login_verification',
      ])
      .withMessage('Invalid OTP purpose filter'),
    ValidationMiddleware.validate,
  ],
  UserController.getOtpHistory
);

// ========================================
// EXISTING OTP FUNCTIONALITY
// ========================================

// Send Email OTP
router.post(
  '/otp/send-email',
  [
    AuthMiddleware.authenticate,
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('phone')
      .optional()
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Please provide a valid Indian phone number'),
    body('type')
      .notEmpty()
      .withMessage('OTP type is required')
      .isIn([
        'card_activation',
        'email_verification',
        'password_reset',
        'account_verification',
      ])
      .withMessage('Invalid OTP type'),
    body('fullName')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters')
      .trim(),
    ValidationMiddleware.validate,
  ],
  UserController.sendEmailOTP
);

// Verify Email OTP
router.post(
  '/otp/verify-email',
  [
    AuthMiddleware.authenticate,
    body('otp')
      .notEmpty()
      .withMessage('OTP is required')
      .isLength({ min: 4, max: 6 })
      .withMessage('OTP must be 4 to 6 digits length')
      .isNumeric()
      .withMessage('OTP must contain only numbers'),
    body('sessionId')
      .notEmpty()
      .withMessage('Session ID is required')
      .isUUID()
      .withMessage('Invalid session ID format'),
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    ValidationMiddleware.validate,
  ],
  UserController.verifyEmailOTP
);

// Resend Email OTP
router.post(
  '/otp/resend-email',
  [
    AuthMiddleware.authenticate,
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('sessionId')
      .notEmpty()
      .withMessage('Session ID is required')
      .isUUID()
      .withMessage('Invalid session ID format'),
    ValidationMiddleware.validate,
  ],
  UserController.resendEmailOTP
);

// Send SMS OTP
router.post(
  '/otp/send-sms',
  [
    AuthMiddleware.authenticate,
    body('phone')
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Please provide a valid Indian phone number'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('type')
      .notEmpty()
      .withMessage('OTP type is required')
      .isIn([
        'card_activation',
        'phone_verification',
        'password_reset',
        'account_verification',
      ])
      .withMessage('Invalid OTP type'),
    body('name')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters')
      .trim(),
    ValidationMiddleware.validate,
  ],
  UserController.sendSMSOTP
);

// Verify SMS OTP
router.post(
  '/otp/verify-sms',
  [
    AuthMiddleware.authenticate,
    body('otp')
      .notEmpty()
      .withMessage('OTP is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits')
      .isNumeric()
      .withMessage('OTP must contain only numbers'),
    body('sessionId')
      .notEmpty()
      .withMessage('Session ID is required')
      .isUUID()
      .withMessage('Invalid session ID format'),
    body('phone')
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Please provide a valid Indian phone number'),
    ValidationMiddleware.validate,
  ],
  UserController.verifySMSOTP
);

// Resend SMS OTP
router.post(
  '/otp/resend-sms',
  [
    AuthMiddleware.authenticate,
    body('phone')
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Please provide a valid Indian phone number'),
    body('sessionId')
      .notEmpty()
      .withMessage('Session ID is required')
      .isUUID()
      .withMessage('Invalid session ID format'),
    ValidationMiddleware.validate,
  ],
  UserController.resendSMSOTP
);

// ========================================
// SHOP SEARCH ENDPOINT
// ========================================

// Shop Search Endpoint for Users
router.get(
  '/shops/search',
  [
    AuthMiddleware.authenticate,
    query('search')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Search query must be between 1 and 200 characters'),
    query('category')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Category must be between 1 and 50 characters'),
    query('location')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Location must be between 1 and 200 characters'),
    query('latitude')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be a valid coordinate between -90 and 90'),
    query('longitude')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be a valid coordinate between -180 and 180'),
    query('maxDistance')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Max distance must be between 1 and 100 kilometers'),
    query('sortBy')
      .optional()
      .isIn(['distance', 'name', 'discount', 'rating', 'createdAt'])
      .withMessage(
        'Sort by must be one of: distance, name, discount, rating, createdAt'
      ),
    query('sortOrder')
      .optional()
      .isIn(['ASC', 'DESC', 'asc', 'desc'])
      .withMessage('Sort order must be ASC or DESC'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    ValidationMiddleware.validate,
  ],
  UserController.searchShops
);

// ========================================
// ADMIN/USER MANAGEMENT ENDPOINTS
// ========================================

// Bulk operations
router.post(
  '/bulk-update',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    body('userIds')
      .isArray({ min: 1 })
      .withMessage('User IDs must be a non-empty array'),
    body('userIds.*')
      .isInt({ min: 1 })
      .withMessage('Each user ID must be a positive integer'),
    body('action')
      .isIn(['activate', 'deactivate', 'delete', 'update_tier'])
      .withMessage('Invalid bulk action'),
    body('data').optional().isObject().withMessage('Data must be an object'),
    ValidationMiddleware.validate,
  ],
  UserController.bulkUpdateUsers
);

// Get user by ID with detailed information
router.get(
  '/:id',
  [
    AuthMiddleware.authenticate,
    param('id')
      .isInt({ min: 1 })
      .withMessage('User ID must be a positive integer'),
    ValidationMiddleware.validate,
  ],
  UserController.getUserById
);

// Update user information
router.put(
  '/:id',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('user'),
    param('id')
      .isInt({ min: 1 })
      .withMessage('User ID must be a positive integer'),
    body('fullName')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('phone')
      .optional()
      .isMobilePhone('en-IN')
      .withMessage('Please provide a valid Indian mobile number'),
    body('address')
      .optional()
      .isString()
      .withMessage('Address must be a string'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean value'),
    body('currentDiscountTier')
      .optional()
      .isIn(['Bronze', 'Silver', 'Gold', 'Platinum'])
      .withMessage('Invalid discount tier'),
    body('totalSpent')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Total spent must be a positive number'),
    ValidationMiddleware.validate,
  ],
  UserController.updateUser
);

// Reset user password
router.put(
  '/:id/reset-password',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('user'),
    param('id')
      .isInt({ min: 1 })
      .withMessage('User ID must be a positive integer'),
    body('newPassword')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        'Password must be at least 8 characters with uppercase, lowercase, and number'
      ),
    ValidationMiddleware.validate,
  ],
  UserController.resetUserPassword
);

// Update user discount card details
router.put(
  '/:id/card',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('user'),
    param('id')
      .isInt({ min: 1 })
      .withMessage('User ID must be a positive integer'),
    body('expiryDate')
      .optional()
      .isISO8601()
      .withMessage('Please provide a valid expiry date in ISO format'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean value'),
    ValidationMiddleware.validate,
  ],
  UserController.updateUserCard
);

// Generate new discount card for user
router.post(
  '/:id/generate-card',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    param('id')
      .isInt({ min: 1 })
      .withMessage('User ID must be a positive integer'),
    body('expiryDate')
      .isISO8601()
      .withMessage('Please provide a valid expiry date'),
    ValidationMiddleware.validate,
  ],
  UserController.generateUserCard
);

// Send email to user
router.post(
  '/:id/send-email',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('user'),
    param('id')
      .isInt({ min: 1 })
      .withMessage('User ID must be a positive integer'),
    body('subject')
      .isLength({ min: 1, max: 200 })
      .withMessage('Subject must be between 1 and 200 characters'),
    body('message')
      .isLength({ min: 1, max: 5000 })
      .withMessage('Message must be between 1 and 5000 characters'),
    ValidationMiddleware.validate,
  ],
  UserController.sendEmailToUser
);

// Delete user (super admin only)
router.delete(
  '/:id',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('super_admin'),
    param('id')
      .isInt({ min: 1 })
      .withMessage('User ID must be a positive integer'),
    ValidationMiddleware.validate,
  ],
  UserController.deleteUser
);

/**
 * Newsletter subscription (public route)
 * POST /api/users/newsletter/subscribe
 */
router.post(
  '/newsletter/subscribe',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    ValidationMiddleware.validate,
  ],
  UserController.subscribeToNewsletter
);

module.exports = router;
