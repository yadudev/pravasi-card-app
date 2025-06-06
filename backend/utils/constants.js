const CONSTANTS = {
  // User roles
  USER_ROLES: {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    MODERATOR: 'moderator',
  },

  // User status
  USER_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
  },

  // Shop status
  SHOP_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    BLOCKED: 'blocked',
  },

  // Discount tiers
  DISCOUNT_TIERS: {
    BRONZE: 'Bronze',
    SILVER: 'Silver',
    GOLD: 'Gold',
    PLATINUM: 'Platinum',
  },

  // Transaction status
  TRANSACTION_STATUS: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
  },

  // Content status
  CONTENT_STATUS: {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived',
  },

  // File types
  ALLOWED_IMAGE_TYPES: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  ALLOWED_DOCUMENT_TYPES: ['pdf', 'doc', 'docx', 'xls', 'xlsx'],

  // File size limits (in bytes)
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB

  // Pagination defaults
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,

  // Cache durations (in seconds)
  CACHE_DURATION: {
    SHORT: 300, // 5 minutes
    MEDIUM: 1800, // 30 minutes
    LONG: 3600, // 1 hour
    VERY_LONG: 86400, // 24 hours
  },

  // Email types
  EMAIL_TYPES: {
    WELCOME: 'welcome',
    PASSWORD_RESET: 'password_reset',
    PASSWORD_CHANGE: 'password_change',
    SHOP_APPROVAL: 'shop_approval',
    SHOP_REJECTION: 'shop_rejection',
    NOTIFICATION: 'notification',
  },

  // Analytics periods
  ANALYTICS_PERIODS: {
    TODAY: 'today',
    WEEK: 'week',
    MONTH: 'month',
    QUARTER: 'quarter',
    YEAR: 'year',
    CUSTOM: 'custom',
  },

  // Export formats
  EXPORT_FORMATS: {
    CSV: 'csv',
    XLSX: 'xlsx',
    PDF: 'pdf',
  },

  // API response codes
  RESPONSE_CODES: {
    SUCCESS: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
  },

  // Validation patterns
  PATTERNS: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^[6-9]\d{9}$/,
    GST: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    PINCODE: /^[1-9][0-9]{5}$/,
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  },

  // Rate limiting
  RATE_LIMITS: {
    LOGIN: {
      WINDOW: 15 * 60 * 1000, // 15 minutes
      MAX_ATTEMPTS: 5,
    },
    API: {
      WINDOW: 15 * 60 * 1000, // 15 minutes
      MAX_REQUESTS: 100,
    },
    EMAIL: {
      WINDOW: 60 * 60 * 1000, // 1 hour
      MAX_EMAILS: 10,
    },
  },

  // Database limits
  DB_LIMITS: {
    STRING_SHORT: 50,
    STRING_MEDIUM: 100,
    STRING_LONG: 255,
    TEXT_MEDIUM: 1000,
    TEXT_LONG: 5000,
  },

  // Business rules
  BUSINESS_RULES: {
    MIN_DISCOUNT_AMOUNT: 100,
    MAX_DISCOUNT_PERCENTAGE: 50,
    CARD_VALIDITY_YEARS: 1,
    PASSWORD_RESET_EXPIRY_HOURS: 1,
    ACCOUNT_LOCKOUT_DURATION_MINUTES: 30,
    MAX_LOGIN_ATTEMPTS: 5,
  },
};

module.exports = CONSTANTS;
