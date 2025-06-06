const express = require('express');
const { body, query, param } = require('express-validator');
const ContentController = require('../../controllers/admin/contentController');
const AuthMiddleware = require('../../middleware/auth');
const ValidationMiddleware = require('../../middleware/validation');
const UploadMiddleware = require('../../middleware/upload');

const router = express.Router();

// Get all banners
router.get(
  '/banners',
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
    query('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Status must be active or inactive'),
    ValidationMiddleware.validate,
  ],
  ContentController.getAllBanners
);

// Get banner by ID
router.get(
  '/banners/:id',
  [
    AuthMiddleware.authenticate,
    param('id')
      .isInt({ min: 1 })
      .withMessage('Banner ID must be a positive integer'),
    ValidationMiddleware.validate,
  ],
  ContentController.getBannerById
);

// Create new banner
router.post(
  '/banners',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    UploadMiddleware.imageUpload({ destination: 'uploads/banners' }).single(
      'image'
    ),
    body('title')
      .isLength({ min: 3, max: 200 })
      .withMessage('Title must be between 3 and 200 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters'),
    body('link').optional().isURL().withMessage('Link must be a valid URL'),
    body('sortOrder')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Sort order must be a non-negative integer'),
    body('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be in ISO format'),
    body('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be in ISO format'),
    ValidationMiddleware.validate,
  ],
  ContentController.createBanner
);

// Update banner
router.put(
  '/banners/:id',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    UploadMiddleware.imageUpload({ destination: 'uploads/banners' }).single(
      'image'
    ),
    param('id')
      .isInt({ min: 1 })
      .withMessage('Banner ID must be a positive integer'),
    body('title')
      .optional()
      .isLength({ min: 3, max: 200 })
      .withMessage('Title must be between 3 and 200 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters'),
    body('link').optional().isURL().withMessage('Link must be a valid URL'),
    body('sortOrder')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Sort order must be a non-negative integer'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    ValidationMiddleware.validate,
  ],
  ContentController.updateBanner
);

// Delete banner
router.delete(
  '/banners/:id',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    param('id')
      .isInt({ min: 1 })
      .withMessage('Banner ID must be a positive integer'),
    ValidationMiddleware.validate,
  ],
  ContentController.deleteBanner
);

// Toggle banner status
router.put(
  '/banners/:id/toggle',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    param('id')
      .isInt({ min: 1 })
      .withMessage('Banner ID must be a positive integer'),
    ValidationMiddleware.validate,
  ],
  ContentController.toggleBannerStatus
);

// Reorder banners
router.put(
  '/banners/reorder',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    body('banners')
      .isArray({ min: 1 })
      .withMessage('Banners must be a non-empty array'),
    body('banners.*.id')
      .isInt({ min: 1 })
      .withMessage('Each banner ID must be a positive integer'),
    body('banners.*.sortOrder')
      .isInt({ min: 0 })
      .withMessage('Each sort order must be a non-negative integer'),
    ValidationMiddleware.validate,
  ],
  ContentController.reorderBanners
);

// ============ BLOG MANAGEMENT ============

// Get all blogs
router.get(
  '/blogs',
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
      .isIn(['draft', 'published', 'archived'])
      .withMessage('Status must be draft, published, or archived'),
    query('category')
      .optional()
      .isString()
      .withMessage('Category must be a string'),
    ValidationMiddleware.validate,
  ],
  ContentController.getAllBlogs
);

// Get blog by ID
router.get(
  '/blogs/:id',
  [
    AuthMiddleware.authenticate,
    param('id')
      .isInt({ min: 1 })
      .withMessage('Blog ID must be a positive integer'),
    ValidationMiddleware.validate,
  ],
  ContentController.getBlogById
);

// Create new blog
router.post(
  '/blogs',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    UploadMiddleware.imageUpload({ destination: 'uploads/blogs' }).single(
      'featuredImage'
    ),
    body('title')
      .isLength({ min: 3, max: 200 })
      .withMessage('Title must be between 3 and 200 characters'),
    body('content')
      .isLength({ min: 100 })
      .withMessage('Content must be at least 100 characters'),
    body('excerpt')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Excerpt must not exceed 500 characters'),
    body('category')
      .optional()
      .isString()
      .withMessage('Category must be a string'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('metaTitle')
      .optional()
      .isLength({ max: 60 })
      .withMessage('Meta title must not exceed 60 characters'),
    body('metaDescription')
      .optional()
      .isLength({ max: 160 })
      .withMessage('Meta description must not exceed 160 characters'),
    body('isPublished')
      .optional()
      .isBoolean()
      .withMessage('isPublished must be a boolean'),
    body('publishedAt')
      .optional()
      .isISO8601()
      .withMessage('Published date must be in ISO format'),
    ValidationMiddleware.validate,
  ],
  ContentController.createBlog
);

// Update blog
router.put(
  '/blogs/:id',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    UploadMiddleware.imageUpload({ destination: 'uploads/blogs' }).single(
      'featuredImage'
    ),
    param('id')
      .isInt({ min: 1 })
      .withMessage('Blog ID must be a positive integer'),
    body('title')
      .optional()
      .isLength({ min: 3, max: 200 })
      .withMessage('Title must be between 3 and 200 characters'),
    body('content')
      .optional()
      .isLength({ min: 100 })
      .withMessage('Content must be at least 100 characters'),
    body('isPublished')
      .optional()
      .isBoolean()
      .withMessage('isPublished must be a boolean'),
    ValidationMiddleware.validate,
  ],
  ContentController.updateBlog
);

// Delete blog
router.delete(
  '/blogs/:id',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    param('id')
      .isInt({ min: 1 })
      .withMessage('Blog ID must be a positive integer'),
    ValidationMiddleware.validate,
  ],
  ContentController.deleteBlog
);

// Publish/Unpublish blog
router.put(
  '/blogs/:id/toggle-publish',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    param('id')
      .isInt({ min: 1 })
      .withMessage('Blog ID must be a positive integer'),
    ValidationMiddleware.validate,
  ],
  ContentController.toggleBlogPublish
);

// ============ FAQ MANAGEMENT ============

// Get all FAQs
router.get(
  '/faqs',
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
    query('category')
      .optional()
      .isString()
      .withMessage('Category must be a string'),
    query('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Status must be active or inactive'),
    ValidationMiddleware.validate,
  ],
  ContentController.getAllFAQs
);

// Get FAQ by ID
router.get(
  '/faqs/:id',
  [
    AuthMiddleware.authenticate,
    param('id')
      .isInt({ min: 1 })
      .withMessage('FAQ ID must be a positive integer'),
    ValidationMiddleware.validate,
  ],
  ContentController.getFAQById
);

// Create new FAQ
router.post(
  '/faqs',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    body('question')
      .isLength({ min: 10, max: 500 })
      .withMessage('Question must be between 10 and 500 characters'),
    body('answer')
      .isLength({ min: 10, max: 2000 })
      .withMessage('Answer must be between 10 and 2000 characters'),
    body('category')
      .isLength({ min: 2, max: 50 })
      .withMessage('Category must be between 2 and 50 characters'),
    body('sortOrder')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Sort order must be a non-negative integer'),
    ValidationMiddleware.validate,
  ],
  ContentController.createFAQ
);

// Update FAQ
router.put(
  '/faqs/:id',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    param('id')
      .isInt({ min: 1 })
      .withMessage('FAQ ID must be a positive integer'),
    body('question')
      .optional()
      .isLength({ min: 10, max: 500 })
      .withMessage('Question must be between 10 and 500 characters'),
    body('answer')
      .optional()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Answer must be between 10 and 2000 characters'),
    body('category')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Category must be between 2 and 50 characters'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    ValidationMiddleware.validate,
  ],
  ContentController.updateFAQ
);

// Delete FAQ
router.delete(
  '/faqs/:id',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    param('id')
      .isInt({ min: 1 })
      .withMessage('FAQ ID must be a positive integer'),
    ValidationMiddleware.validate,
  ],
  ContentController.deleteFAQ
);

// Toggle FAQ status
router.put(
  '/faqs/:id/toggle',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    param('id')
      .isInt({ min: 1 })
      .withMessage('FAQ ID must be a positive integer'),
    ValidationMiddleware.validate,
  ],
  ContentController.toggleFAQStatus
);

// Reorder FAQs
router.put(
  '/faqs/reorder',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    body('faqs')
      .isArray({ min: 1 })
      .withMessage('FAQs must be a non-empty array'),
    body('faqs.*.id')
      .isInt({ min: 1 })
      .withMessage('Each FAQ ID must be a positive integer'),
    body('faqs.*.sortOrder')
      .isInt({ min: 0 })
      .withMessage('Each sort order must be a non-negative integer'),
    ValidationMiddleware.validate,
  ],
  ContentController.reorderFAQs
);

// ============ GENERAL CONTENT OPERATIONS ============

// Upload image for content
router.post(
  '/upload-image',
  [
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    UploadMiddleware.imageUpload({ destination: 'uploads/content' }).single(
      'image'
    ),
    body('type')
      .optional()
      .isIn(['banner', 'blog', 'general'])
      .withMessage('Type must be banner, blog, or general'),
  ],
  ContentController.uploadImage
);

// Get content statistics
router.get(
  '/stats',
  AuthMiddleware.authenticate,
  ContentController.getContentStats
);

module.exports = router;
