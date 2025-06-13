const express = require('express');
const { body, query, param } = require('express-validator');
const UserController = require('../controllers/admin/userController');
const AuthMiddleware = require('../middleware/auth');
const ValidationMiddleware = require('../middleware/validation');

const router = express.Router();

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
