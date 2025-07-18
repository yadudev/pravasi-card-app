const express = require('express');
const { body, query, param } = require('express-validator');
const ShopController = require('../../controllers/admin/shopController');
const AuthMiddleware = require('../../middleware/auth');
const ValidationMiddleware = require('../../middleware/validation');

const router = express.Router();

router.post(
  '/register',
  [
    body('shopName')
      .isLength({ min: 2, max: 100 })
      .withMessage('Shop name must be between 2 and 100 characters')
      .trim(),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('phone')
      .isMobilePhone('en-IN')
      .withMessage('Please provide a valid Indian mobile number'),
    body('storeAddress')
      .isLength({ min: 2, max: 500 })
      .withMessage('Address must be between 2 and 500 characters')
      .trim(),
    body('discountOffer')
      .isFloat({ min: 0, max: 100 })
      .withMessage('Discount offered must be between 0 and 100'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters')
      .trim(),
    ValidationMiddleware.validate,
  ],
  ShopController.registerShop
);

// Get all shops with pagination, search, and filters
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
      .isIn(['pending', 'approved', 'rejected', 'blocked'])
      .withMessage('Invalid status'),
    query('category')
      .optional()
      .isString()
      .withMessage('Category must be a string'),
    query('city').optional().isString().withMessage('City must be a string'),
    query('sortBy')
      .optional()
      .isIn(['name', 'ownerName', 'totalRevenue', 'totalPurchases'])
      .withMessage('Invalid sort field'),
    query('sortOrder')
      .optional()
      .isIn(['ASC', 'DESC'])
      .withMessage('Sort order must be ASC or DESC'),
    ValidationMiddleware.validate,
  ],
  ShopController.getAllShops
);

// Get shop statistics
router.get('/stats', AuthMiddleware.authenticate, ShopController.getShopStats);

// Export shops data
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
  ShopController.exportShops
);

// Get pending shops for approval
router.get(
  '/pending',
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
    ValidationMiddleware.validate,
  ],
  ShopController.getPendingShops
);

// Create new shop (admin registration)
router.post(
  '/',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    body('name')
      .isLength({ min: 2, max: 100 })
      .withMessage('Shop name must be between 2 and 100 characters')
      .trim(),
    body('ownerName')
      .isLength({ min: 2, max: 100 })
      .withMessage('Owner name must be between 2 and 100 characters')
      .trim(),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('phone')
      .isMobilePhone('en-IN')
      .withMessage('Please provide a valid Indian mobile number'),
    body('address')
      .isLength({ min: 10, max: 500 })
      .withMessage('Address must be between 10 and 500 characters')
      .trim(),
    body('category')
      .optional()
      .isString()
      .withMessage('Category must be a string'),
    body('discountOffered')
      .isFloat({ min: 0, max: 100 })
      .withMessage('Discount offered must be between 0 and 100'),
    ValidationMiddleware.validate,
  ],
  ShopController.createShopByAdmin
);

// Get shop by ID with detailed information
router.get(
  '/:id',
  [
    AuthMiddleware.authenticate,
    param('id')
      .isInt({ min: 1 })
      .withMessage('Shop ID must be a positive integer'),
    ValidationMiddleware.validate,
  ],
  ShopController.getShopById
);

// Update shop information
router.put(
  '/:id',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    param('id')
      .isInt({ min: 1 })
      .withMessage('Shop ID must be a positive integer'),
    body('name')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Shop name must be between 2 and 100 characters'),
    body('ownerName')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Owner name must be between 2 and 100 characters'),
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
    body('category')
      .optional()
      .isString()
      .withMessage('Category must be a string'),
    body('gstNumber')
      .optional()
      .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
      .withMessage('Please provide a valid GST number'),
    ValidationMiddleware.validate,
  ],
  ShopController.updateShop
);

router.put(
  '/:id/approve',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    param('id')
      .isInt({ min: 1 })
      .withMessage('Shop ID must be a positive integer'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
    ValidationMiddleware.validate,
  ],
  ShopController.approveShop
);

router.put(
  '/:id/reject',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    param('id')
      .isInt({ min: 1 })
      .withMessage('Shop ID must be a positive integer'),
    body('reason')
      .isLength({ min: 10, max: 500 })
      .withMessage('Rejection reason must be between 10 and 500 characters'),
    ValidationMiddleware.validate,
  ],
  ShopController.rejectShop
);

router.put(
  '/:id/toggle-block',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    param('id')
      .isInt({ min: 1 })
      .withMessage('Shop ID must be a positive integer'),
    body('reason').optional().isString().withMessage('Reason must be a string'),
    ValidationMiddleware.validate,
  ],
  ShopController.toggleBlockShop
);

// Get shop analytics
router.get(
  '/:id/analytics',
  [
    AuthMiddleware.authenticate,
    param('id')
      .isInt({ min: 1 })
      .withMessage('Shop ID must be a positive integer'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be in ISO format'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be in ISO format'),
    ValidationMiddleware.validate,
  ],
  ShopController.getShopAnalytics
);

// Send email to shop
router.post(
  '/:id/send-email',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    param('id')
      .isInt({ min: 1 })
      .withMessage('Shop ID must be a positive integer'),
    body('subject')
      .isLength({ min: 1, max: 200 })
      .withMessage('Subject must be between 1 and 200 characters'),
    body('message')
      .isLength({ min: 1, max: 5000 })
      .withMessage('Message must be between 1 and 5000 characters'),
    ValidationMiddleware.validate,
  ],
  ShopController.sendEmailToShop
);

// Delete shop (super admin only)
router.delete(
  '/:id',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('super_admin'),
    param('id')
      .isInt({ min: 1 })
      .withMessage('Shop ID must be a positive integer'),
    ValidationMiddleware.validate,
  ],
  ShopController.deleteShop
);

// Bulk operations for shops
router.post(
  '/bulk-update',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    body('shopIds')
      .isArray({ min: 1 })
      .withMessage('Shop IDs must be a non-empty array'),
    body('shopIds.*')
      .isInt({ min: 1 })
      .withMessage('Each shop ID must be a positive integer'),
    body('action')
      .isIn(['approve', 'reject', 'block', 'unblock', 'delete'])
      .withMessage('Invalid bulk action'),
    body('reason').optional().isString().withMessage('Reason must be a string'),
    ValidationMiddleware.validate,
  ],
  ShopController.bulkUpdateShops
);

module.exports = router;
