const express = require('express');
const { body, query, param } = require('express-validator');
const DiscountController = require('../../controllers/admin/discountController');
const AuthMiddleware = require('../../middleware/auth');
const ValidationMiddleware = require('../../middleware/validation');

const router = express.Router();

// Get all discount rules with pagination and filters
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
    query('shopId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Shop ID must be a positive integer'),
    query('tier')
      .optional()
      .isIn(['Bronze', 'Silver', 'Gold', 'Platinum'])
      .withMessage('Invalid tier'),
    query('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Status must be active or inactive'),
    query('type')
      .optional()
      .isIn(['global', 'shop_specific'])
      .withMessage('Type must be global or shop_specific'),
    ValidationMiddleware.validate,
  ],
  DiscountController.getAllDiscountRules
);

// Get discount rule statistics
router.get(
  '/stats',
  AuthMiddleware.authenticate,
  DiscountController.getDiscountStats
);

// Get discount rule by ID
router.get(
  '/:id',
  [
    AuthMiddleware.authenticate,
    param('id')
      .isInt({ min: 1 })
      .withMessage('Discount rule ID must be a positive integer'),
    ValidationMiddleware.validate,
  ],
  DiscountController.getDiscountRuleById
);

// Create new discount rule
router.post(
  '/',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    body('ruleName')
      .isLength({ min: 3, max: 100 })
      .withMessage('Rule name must be between 3 and 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters'),
    body('minAmount')
      .isFloat({ min: 0 })
      .withMessage('Minimum amount must be a positive number'),
    body('maxAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum amount must be a positive number')
      .custom((value, { req }) => {
        if (value && value <= req.body.minAmount) {
          throw new Error('Maximum amount must be greater than minimum amount');
        }
        return true;
      }),
    body('discountPercentage')
      .isFloat({ min: 0, max: 100 })
      .withMessage('Discount percentage must be between 0 and 100'),
    body('tier')
      .isIn(['Bronze', 'Silver', 'Gold', 'Platinum'])
      .withMessage('Invalid tier selection'),
    body('shopId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Shop ID must be a positive integer'),
    body('validFrom')
      .optional()
      .isISO8601()
      .withMessage('Valid from date must be in ISO format'),
    body('validTo')
      .optional()
      .isISO8601()
      .withMessage('Valid to date must be in ISO format')
      .custom((value, { req }) => {
        if (
          value &&
          req.body.validFrom &&
          new Date(value) <= new Date(req.body.validFrom)
        ) {
          throw new Error('Valid to date must be after valid from date');
        }
        return true;
      }),
    body('maxUsage')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Max usage must be a positive integer'),
    body('isStackable')
      .optional()
      .isBoolean()
      .withMessage('isStackable must be a boolean'),
    ValidationMiddleware.validate,
  ],
  DiscountController.createDiscountRule
);

// Update discount rule
router.put(
  '/:id',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    param('id')
      .isInt({ min: 1 })
      .withMessage('Discount rule ID must be a positive integer'),
    body('ruleName')
      .optional()
      .isLength({ min: 3, max: 100 })
      .withMessage('Rule name must be between 3 and 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters'),
    body('minAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum amount must be a positive number'),
    body('maxAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum amount must be a positive number'),
    body('discountPercentage')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Discount percentage must be between 0 and 100'),
    body('tier')
      .optional()
      .isIn(['Bronze', 'Silver', 'Gold', 'Platinum'])
      .withMessage('Invalid tier selection'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    ValidationMiddleware.validate,
  ],
  DiscountController.updateDiscountRule
);

// Toggle discount rule status (activate/deactivate)
router.put(
  '/:id/toggle',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    param('id')
      .isInt({ min: 1 })
      .withMessage('Discount rule ID must be a positive integer'),
    ValidationMiddleware.validate,
  ],
  DiscountController.toggleDiscountRule
);

// Duplicate discount rule
router.post(
  '/:id/duplicate',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    param('id')
      .isInt({ min: 1 })
      .withMessage('Discount rule ID must be a positive integer'),
    body('ruleName')
      .isLength({ min: 3, max: 100 })
      .withMessage('New rule name must be between 3 and 100 characters'),
    ValidationMiddleware.validate,
  ],
  DiscountController.duplicateDiscountRule
);

// Delete discount rule
router.delete(
  '/:id',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    param('id')
      .isInt({ min: 1 })
      .withMessage('Discount rule ID must be a positive integer'),
    ValidationMiddleware.validate,
  ],
  DiscountController.deleteDiscountRule
);

// Bulk operations for discount rules
router.post(
  '/bulk-update',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    body('ruleIds')
      .isArray({ min: 1 })
      .withMessage('Rule IDs must be a non-empty array'),
    body('ruleIds.*')
      .isInt({ min: 1 })
      .withMessage('Each rule ID must be a positive integer'),
    body('action')
      .isIn(['activate', 'deactivate', 'delete'])
      .withMessage('Invalid bulk action'),
    ValidationMiddleware.validate,
  ],
  DiscountController.bulkUpdateDiscountRules
);

// Test discount calculation
router.post(
  '/test-calculation',
  [
    AuthMiddleware.authenticate,
    body('amount')
      .isFloat({ min: 0 })
      .withMessage('Amount must be a positive number'),
    body('tier')
      .isIn(['Bronze', 'Silver', 'Gold', 'Platinum'])
      .withMessage('Invalid tier'),
    body('shopId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Shop ID must be a positive integer'),
    ValidationMiddleware.validate,
  ],
  DiscountController.testDiscountCalculation
);

module.exports = router;
