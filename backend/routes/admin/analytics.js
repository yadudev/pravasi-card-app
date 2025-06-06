const express = require('express');
const { query, body } = require('express-validator');
const AnalyticsController = require('../../controllers/admin/analyticsController');
const AuthMiddleware = require('../../middleware/auth');
const ValidationMiddleware = require('../../middleware/validation');

const router = express.Router();

// Dashboard analytics overview
router.get(
  '/dashboard',
  [
    AuthMiddleware.authenticate,
    query('period')
      .optional()
      .isIn(['today', 'week', 'month', 'quarter', 'year', 'custom'])
      .withMessage(
        'Period must be today, week, month, quarter, year, or custom'
      ),
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
  AnalyticsController.getDashboardAnalytics
);

// User analytics
router.get(
  '/users',
  [
    AuthMiddleware.authenticate,
    query('period')
      .optional()
      .isIn(['today', 'week', 'month', 'quarter', 'year', 'custom'])
      .withMessage(
        'Period must be today, week, month, quarter, year, or custom'
      ),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be in ISO format'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be in ISO format'),
    query('groupBy')
      .optional()
      .isIn(['day', 'week', 'month'])
      .withMessage('Group by must be day, week, or month'),
    ValidationMiddleware.validate,
  ],
  AnalyticsController.getUserAnalytics
);

// Shop analytics
router.get(
  '/shops',
  [
    AuthMiddleware.authenticate,
    query('period')
      .optional()
      .isIn(['today', 'week', 'month', 'quarter', 'year', 'custom'])
      .withMessage(
        'Period must be today, week, month, quarter, year, or custom'
      ),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be in ISO format'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be in ISO format'),
    query('shopType')
      .optional()
      .isString()
      .withMessage('Shop type must be a string'),
    query('city').optional().isString().withMessage('City must be a string'),
    ValidationMiddleware.validate,
  ],
  AnalyticsController.getShopAnalytics
);

// Transaction analytics
router.get(
  '/transactions',
  [
    AuthMiddleware.authenticate,
    query('period')
      .optional()
      .isIn(['today', 'week', 'month', 'quarter', 'year', 'custom'])
      .withMessage(
        'Period must be today, week, month, quarter, year, or custom'
      ),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be in ISO format'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be in ISO format'),
    query('shopId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Shop ID must be a positive integer'),
    query('tier')
      .optional()
      .isIn(['Bronze', 'Silver', 'Gold', 'Platinum'])
      .withMessage('Invalid tier'),
    query('groupBy')
      .optional()
      .isIn(['day', 'week', 'month'])
      .withMessage('Group by must be day, week, or month'),
    ValidationMiddleware.validate,
  ],
  AnalyticsController.getTransactionAnalytics
);

// Revenue analytics
router.get(
  '/revenue',
  [
    AuthMiddleware.authenticate,
    query('period')
      .optional()
      .isIn(['today', 'week', 'month', 'quarter', 'year', 'custom'])
      .withMessage(
        'Period must be today, week, month, quarter, year, or custom'
      ),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be in ISO format'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be in ISO format'),
    query('comparison')
      .optional()
      .isBoolean()
      .withMessage('Comparison must be a boolean'),
    query('groupBy')
      .optional()
      .isIn(['day', 'week', 'month'])
      .withMessage('Group by must be day, week, or month'),
    ValidationMiddleware.validate,
  ],
  AnalyticsController.getRevenueAnalytics
);

// Discount usage analytics
router.get(
  '/discounts',
  [
    AuthMiddleware.authenticate,
    query('period')
      .optional()
      .isIn(['today', 'week', 'month', 'quarter', 'year', 'custom'])
      .withMessage(
        'Period must be today, week, month, quarter, year, or custom'
      ),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be in ISO format'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be in ISO format'),
    query('tier')
      .optional()
      .isIn(['Bronze', 'Silver', 'Gold', 'Platinum'])
      .withMessage('Invalid tier'),
    query('ruleId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Rule ID must be a positive integer'),
    ValidationMiddleware.validate,
  ],
  AnalyticsController.getDiscountAnalytics
);

// Geographic analytics
router.get(
  '/geographic',
  [
    AuthMiddleware.authenticate,
    query('type')
      .optional()
      .isIn(['users', 'shops', 'transactions'])
      .withMessage('Type must be users, shops, or transactions'),
    query('level')
      .optional()
      .isIn(['state', 'city'])
      .withMessage('Level must be state or city'),
    ValidationMiddleware.validate,
  ],
  AnalyticsController.getGeographicAnalytics
);

// Top performers analytics
router.get(
  '/top-performers',
  [
    AuthMiddleware.authenticate,
    query('type')
      .isIn(['users', 'shops'])
      .withMessage('Type must be users or shops'),
    query('metric')
      .isIn(['revenue', 'transactions', 'discounts'])
      .withMessage('Metric must be revenue, transactions, or discounts'),
    query('period')
      .optional()
      .isIn(['today', 'week', 'month', 'quarter', 'year', 'custom'])
      .withMessage(
        'Period must be today, week, month, quarter, year, or custom'
      ),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    ValidationMiddleware.validate,
  ],
  AnalyticsController.getTopPerformers
);

// Growth analytics
router.get(
  '/growth',
  [
    AuthMiddleware.authenticate,
    query('metric')
      .isIn(['users', 'shops', 'transactions', 'revenue'])
      .withMessage('Metric must be users, shops, transactions, or revenue'),
    query('period')
      .optional()
      .isIn(['week', 'month', 'quarter', 'year'])
      .withMessage('Period must be week, month, quarter, or year'),
    query('comparison')
      .optional()
      .isBoolean()
      .withMessage('Comparison must be a boolean'),
    ValidationMiddleware.validate,
  ],
  AnalyticsController.getGrowthAnalytics
);

// Custom analytics report
router.post(
  '/custom-report',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    body('reportName')
      .isLength({ min: 3, max: 100 })
      .withMessage('Report name must be between 3 and 100 characters'),
    body('metrics')
      .isArray({ min: 1 })
      .withMessage('Metrics must be a non-empty array'),
    body('metrics.*')
      .isIn(['users', 'shops', 'transactions', 'revenue', 'discounts'])
      .withMessage('Invalid metric'),
    body('filters')
      .optional()
      .isObject()
      .withMessage('Filters must be an object'),
    body('groupBy')
      .optional()
      .isIn(['day', 'week', 'month', 'tier', 'city', 'shopType'])
      .withMessage('Invalid groupBy option'),
    body('startDate')
      .isISO8601()
      .withMessage('Start date must be in ISO format'),
    body('endDate').isISO8601().withMessage('End date must be in ISO format'),
    ValidationMiddleware.validate,
  ],
  AnalyticsController.generateCustomReport
);

// Export analytics data
router.post(
  '/export',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    body('reportType')
      .isIn([
        'dashboard',
        'users',
        'shops',
        'transactions',
        'revenue',
        'discounts',
      ])
      .withMessage('Invalid report type'),
    body('format')
      .isIn(['csv', 'xlsx', 'pdf'])
      .withMessage('Format must be csv, xlsx, or pdf'),
    body('period')
      .optional()
      .isIn(['today', 'week', 'month', 'quarter', 'year', 'custom'])
      .withMessage(
        'Period must be today, week, month, quarter, year, or custom'
      ),
    body('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be in ISO format'),
    body('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be in ISO format'),
    body('filters')
      .optional()
      .isObject()
      .withMessage('Filters must be an object'),
    ValidationMiddleware.validate,
  ],
  AnalyticsController.exportAnalytics
);

// Real-time analytics
router.get(
  '/realtime',
  [
    AuthMiddleware.authenticate,
    query('metrics')
      .optional()
      .isString()
      .withMessage('Metrics must be a comma-separated string'),
    ValidationMiddleware.validate,
  ],
  AnalyticsController.getRealtimeAnalytics
);

// Analytics comparison
router.get(
  '/compare',
  [
    AuthMiddleware.authenticate,
    query('metric')
      .isIn(['users', 'shops', 'transactions', 'revenue'])
      .withMessage('Metric must be users, shops, transactions, or revenue'),
    query('period1')
      .isIn(['today', 'week', 'month', 'quarter', 'year'])
      .withMessage('Period1 must be today, week, month, quarter, or year'),
    query('period2')
      .isIn(['today', 'week', 'month', 'quarter', 'year'])
      .withMessage('Period2 must be today, week, month, quarter, or year'),
    query('startDate1')
      .optional()
      .isISO8601()
      .withMessage('Start date1 must be in ISO format'),
    query('endDate1')
      .optional()
      .isISO8601()
      .withMessage('End date1 must be in ISO format'),
    query('startDate2')
      .optional()
      .isISO8601()
      .withMessage('Start date2 must be in ISO format'),
    query('endDate2')
      .optional()
      .isISO8601()
      .withMessage('End date2 must be in ISO format'),
    ValidationMiddleware.validate,
  ],
  AnalyticsController.compareAnalytics
);

// Predictive analytics
router.get(
  '/predictions',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    query('metric')
      .isIn(['users', 'revenue', 'transactions'])
      .withMessage('Metric must be users, revenue, or transactions'),
    query('horizon')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Horizon must be between 1 and 365 days'),
    ValidationMiddleware.validate,
  ],
  AnalyticsController.getPredictiveAnalytics
);

module.exports = router;