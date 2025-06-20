const express = require('express');
const { body, query, param } = require('express-validator');
const UserController = require('../../controllers/admin/userController');
const OTPAdminController = require('../../controllers/admin/OTPAdminController');
const AuthMiddleware = require('../../middleware/auth');
const ValidationMiddleware = require('../../middleware/validation');

const router = express.Router();

// Get all users with pagination, search, and filters
router.get(
  '/',
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
    query('search')
      .optional()
      .isString()
      .trim()
      .withMessage('Search must be a string'),
    query('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Status must be either active or inactive'),
    query('tier')
      .optional()
      .isIn(['Bronze', 'Silver', 'Gold', 'Platinum'])
      .withMessage('Invalid tier selection'),
    query('sortBy')
      .optional()
      .isIn([
        'createdAt',
        'fullName',
        'email',
        'totalSpent',
        'currentDiscountTier',
      ])
      .withMessage('Invalid sort field'),
    query('sortOrder')
      .optional()
      .isIn(['ASC', 'DESC'])
      .withMessage('Sort order must be ASC or DESC'),
    ValidationMiddleware.validate,
  ],
  UserController.getAllUsers
);

// Get user statistics
router.get('/stats', AuthMiddleware.authenticate, UserController.getUserStats);

// ============= OTP MANAGEMENT ENDPOINTS =============

// Get all OTP sessions with pagination, search, and filters
router.get(
  '/otp-sessions',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('search')
      .optional()
      .isString()
      .trim()
      .withMessage('Search must be a string'),
    query('otpType')
      .optional()
      .isIn(['email', 'sms'])
      .withMessage('OTP type must be email or sms'),
    query('purpose')
      .optional()
      .isIn([
        'card_activation',
        'email_verification',
        'phone_verification',
        'password_reset',
        'account_verification',
      ])
      .withMessage('Invalid OTP purpose'),
    query('isVerified')
      .optional()
      .isBoolean()
      .withMessage('isVerified must be a boolean value'),
    query('userId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('User ID must be a positive integer'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO date'),
    query('sortBy')
      .optional()
      .isIn(['created_at', 'expires_at', 'verified_at'])
      .withMessage('Invalid sort field'),
    query('sortOrder')
      .optional()
      .isIn(['ASC', 'DESC'])
      .withMessage('Sort order must be ASC or DESC'),
    ValidationMiddleware.validate,
  ],
  OTPAdminController.getAllOTPSessions
);

// Get OTP statistics for dashboard
router.get(
  '/otp-sessions/stats',
  [AuthMiddleware.authenticate, AuthMiddleware.authorize('admin')],
  OTPAdminController.getOTPStatistics
);

// Get OTP analytics data
router.get(
  '/otp-sessions/analytics',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    query('period')
      .optional()
      .isIn(['24h', '7d', '30d'])
      .withMessage('Period must be 24h, 7d, or 30d'),
    ValidationMiddleware.validate,
  ],
  OTPAdminController.getOTPAnalytics
);

// Get specific OTP session by ID
router.get(
  '/otp-sessions/:sessionId',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    param('sessionId').isUUID().withMessage('Session ID must be a valid UUID'),
    ValidationMiddleware.validate,
  ],
  OTPAdminController.getOTPSessionById
);

// Manually expire OTP session (admin action)
router.post(
  '/otp-sessions/:sessionId/expire',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    param('sessionId').isUUID().withMessage('Session ID must be a valid UUID'),
    ValidationMiddleware.validate,
  ],
  OTPAdminController.expireOTPSession
);

// Export users data
router.get(
  '/export',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    query('format')
      .optional()
      .isIn(['csv', 'xlsx'])
      .withMessage('Export format must be csv or xlsx'),
    ValidationMiddleware.validate,
  ],
  UserController.exportUsers
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

// ============= USER-SPECIFIC OTP ENDPOINTS =============

// Get OTP sessions for specific user
router.get(
  '/:id/otp-sessions',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    param('id')
      .isInt({ min: 1 })
      .withMessage('User ID must be a positive integer'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    query('otpType')
      .optional()
      .isIn(['email', 'sms'])
      .withMessage('OTP type must be email or sms'),
    query('purpose')
      .optional()
      .isIn([
        'card_activation',
        'email_verification',
        'phone_verification',
        'password_reset',
        'account_verification',
      ])
      .withMessage('Invalid OTP purpose'),
    query('sortBy')
      .optional()
      .isIn(['created_at', 'expires_at', 'verified_at'])
      .withMessage('Invalid sort field'),
    query('sortOrder')
      .optional()
      .isIn(['ASC', 'DESC'])
      .withMessage('Sort order must be ASC or DESC'),
    ValidationMiddleware.validate,
  ],
  OTPAdminController.getUserOTPSessions
);

// Update user information
router.put(
  '/:id',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
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
    AuthMiddleware.authorize('admin'),
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
    AuthMiddleware.authorize('admin'),
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
    AuthMiddleware.authorize('admin'),
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

module.exports = router;
