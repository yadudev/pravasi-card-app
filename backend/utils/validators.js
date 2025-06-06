const CONSTANTS = require('./constants');

class Validators {
  /**
   * Validate email format
   */
  static isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    return CONSTANTS.PATTERNS.EMAIL.test(email.trim());
  }

  /**
   * Validate Indian mobile number
   */
  static isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') return false;
    const cleanPhone = phone.replace(/\D/g, '');
    return CONSTANTS.PATTERNS.PHONE.test(cleanPhone);
  }

  /**
   * Validate GST number
   */
  static isValidGST(gst) {
    if (!gst || typeof gst !== 'string') return true; // GST is optional
    return CONSTANTS.PATTERNS.GST.test(gst.toUpperCase());
  }

  /**
   * Validate Indian PIN code
   */
  static isValidPincode(pincode) {
    if (!pincode || typeof pincode !== 'string') return false;
    return CONSTANTS.PATTERNS.PINCODE.test(pincode);
  }

  /**
   * Validate password strength
   */
  static isValidPassword(password) {
    if (!password || typeof password !== 'string') return false;
    return password.length >= 8 && CONSTANTS.PATTERNS.PASSWORD.test(password);
  }

  /**
   * Validate discount percentage
   */
  static isValidDiscountPercentage(percentage) {
    const num = parseFloat(percentage);
    return (
      !isNaN(num) &&
      num >= 0 &&
      num <= CONSTANTS.BUSINESS_RULES.MAX_DISCOUNT_PERCENTAGE
    );
  }

  /**
   * Validate amount
   */
  static isValidAmount(amount) {
    const num = parseFloat(amount);
    return !isNaN(num) && num >= 0;
  }

  /**
   * Validate date
   */
  static isValidDate(date) {
    if (!date) return false;
    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate);
  }

  /**
   * Validate future date
   */
  static isFutureDate(date) {
    if (!this.isValidDate(date)) return false;
    return new Date(date) > new Date();
  }

  /**
   * Validate file extension
   */
  static isValidFileType(filename, allowedTypes) {
    if (!filename || !allowedTypes) return false;
    const extension = filename.split('.').pop().toLowerCase();
    return allowedTypes.includes(extension);
  }

  /**
   * Validate file size
   */
  static isValidFileSize(size, maxSize) {
    return size && maxSize && size <= maxSize;
  }

  /**
   * Validate URL
   */
  static isValidURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate tier
   */
  static isValidTier(tier) {
    return Object.values(CONSTANTS.DISCOUNT_TIERS).includes(tier);
  }

  /**
   * Validate role
   */
  static isValidRole(role) {
    return Object.values(CONSTANTS.USER_ROLES).includes(role);
  }

  /**
   * Validate pagination parameters
   */
  static validatePagination(page, limit) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || CONSTANTS.DEFAULT_PAGE_SIZE;

    return {
      page: Math.max(1, pageNum),
      limit: Math.min(CONSTANTS.MAX_PAGE_SIZE, Math.max(1, limitNum)),
    };
  }

  /**
   * Validate sort parameters
   */
  static validateSort(sortBy, sortOrder, allowedFields) {
    const validSortBy = allowedFields.includes(sortBy)
      ? sortBy
      : allowedFields[0];
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder?.toUpperCase())
      ? sortOrder.toUpperCase()
      : 'DESC';

    return {
      sortBy: validSortBy,
      sortOrder: validSortOrder,
    };
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(str, maxLength = null) {
    if (!str || typeof str !== 'string') return '';

    let sanitized = str.trim().replace(/\s+/g, ' ');

    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  /**
   * Validate and sanitize search query
   */
  static sanitizeSearchQuery(query) {
    if (!query || typeof query !== 'string') return '';

    return query
      .trim()
      .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
      .substring(0, 100); // Limit length
  }
}

module.exports = Validators;
