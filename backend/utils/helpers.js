const crypto = require('crypto');
const moment = require('moment');
const { Op } = require('sequelize');

class Helpers {
  /**
   * Generate unique ID with optional prefix
   */
  static generateUniqueId(prefix = '') {
    // Generate a random 12-digit number
    const randomPart = crypto
      .randomInt(1e11, 1e12)
      .toString()
      .padStart(12, '0');

    // Use the last 4 digits of the current timestamp (for additional uniqueness)
    const timePart = Date.now().toString().slice(-4);

    // Combine to make a 16-digit ID
    const uniqueId = `${randomPart}${timePart}`;

    return `${prefix}${uniqueId}`;
  }

  /**
   * Generate discount card number
   */
  static generateCardNumber() {
    return this.generateUniqueId();
  }

  /**
   * Generate transaction ID
   */
  static generateTransactionId() {
    return this.generateUniqueId('TXN');
  }

  /**
   * Calculate discount tier based on total spent
   */
  static calculateDiscountTier(totalSpent) {
    const amount = parseFloat(totalSpent) || 0;

    if (amount >= 100000) return 'Platinum';
    if (amount >= 50000) return 'Gold';
    if (amount >= 25000) return 'Silver';
    return 'Bronze';
  }

  /**
   * Get tier requirements
   */
  static getTierRequirements() {
    return {
      Bronze: { min: 0, max: 24999, benefits: 'Basic discounts up to 5%' },
      Silver: {
        min: 25000,
        max: 49999,
        benefits: 'Enhanced discounts up to 10%',
      },
      Gold: { min: 50000, max: 99999, benefits: 'Premium discounts up to 15%' },
      Platinum: {
        min: 100000,
        max: Infinity,
        benefits: 'Exclusive discounts up to 20%',
      },
    };
  }

  /**
   * Format currency amount
   */
  static formatCurrency(amount, currency = 'INR', locale = 'en-IN') {
    const numAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);
  }

  /**
   * Format number with commas
   */
  static formatNumber(number, decimals = 0) {
    const num = parseFloat(number) || 0;
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  }

  /**
   * Validate email format
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate Indian phone number
   */
  static validatePhone(phone) {
    // Remove all non-digits
    const cleanPhone = phone.replace(/\D/g, '');

    // Check for Indian mobile number patterns
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(cleanPhone);
  }

  /**
   * Validate Indian GST number
   */
  static validateGSTNumber(gst) {
    if (!gst) return true; // GST is optional
    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gst.toUpperCase());
  }

  /**
   * Validate Indian PIN code
   */
  static validatePincode(pincode) {
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode);
  }

  /**
   * Create URL-friendly slug
   */
  static slugify(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Sanitize filename for safe storage
   */
  static sanitizeFilename(filename) {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  }

  /**
   * Format date range
   */
  static formatDateRange(startDate, endDate, format = 'YYYY-MM-DD') {
    return {
      start: moment(startDate).format(format),
      end: moment(endDate).format(format),
    };
  }

  /**
   * Get date range for common periods
   */
  static getDateRange(period) {
    const now = moment();
    let start, end;

    switch (period) {
      case 'today':
        start = now.clone().startOf('day');
        end = now.clone().endOf('day');
        break;
      case 'yesterday':
        start = now.clone().subtract(1, 'day').startOf('day');
        end = now.clone().subtract(1, 'day').endOf('day');
        break;
      case 'week':
        start = now.clone().startOf('week');
        end = now.clone().endOf('week');
        break;
      case 'month':
        start = now.clone().startOf('month');
        end = now.clone().endOf('month');
        break;
      case 'quarter':
        start = now.clone().startOf('quarter');
        end = now.clone().endOf('quarter');
        break;
      case 'year':
        start = now.clone().startOf('year');
        end = now.clone().endOf('year');
        break;
      case 'last30days':
        start = now.clone().subtract(30, 'days').startOf('day');
        end = now.clone().endOf('day');
        break;
      case 'last7days':
        start = now.clone().subtract(7, 'days').startOf('day');
        end = now.clone().endOf('day');
        break;
      default:
        start = now.clone().startOf('month');
        end = now.clone().endOf('month');
    }

    return {
      start: start.toDate(),
      end: end.toDate(),
      startFormatted: start.format('YYYY-MM-DD'),
      endFormatted: end.format('YYYY-MM-DD'),
    };
  }

  /**
   * Get pagination data
   */
  static getPaginationData(page, limit, total) {
    const currentPage = parseInt(page) || 1;
    const itemsPerPage = parseInt(limit) || 10;
    const totalPages = Math.ceil(total / itemsPerPage);

    return {
      currentPage,
      totalPages,
      totalItems: total,
      itemsPerPage,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1,
      startItem: (currentPage - 1) * itemsPerPage + 1,
      endItem: Math.min(currentPage * itemsPerPage, total),
    };
  }

  /**
   * Async wrapper for route handlers
   */
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Calculate percentage change
   */
  static calculatePercentageChange(current, previous) {
    if (!previous || previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  }

  /**
   * Calculate discount amount
   */
  static calculateDiscount(amount, percentage) {
    const discountAmount = (parseFloat(amount) * parseFloat(percentage)) / 100;
    return {
      originalAmount: parseFloat(amount),
      discountPercentage: parseFloat(percentage),
      discountAmount: Math.round(discountAmount * 100) / 100,
      finalAmount:
        Math.round((parseFloat(amount) - discountAmount) * 100) / 100,
    };
  }

  /**
   * Generate random password
   */
  static generateRandomPassword(length = 12) {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const allChars = uppercase + lowercase + numbers + symbols;
    let password = '';

    // Ensure at least one character from each category
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password) {
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
      password
    );

    const score = [
      password.length >= minLength,
      hasUppercase,
      hasLowercase,
      hasNumbers,
      hasSpecialChar,
    ].filter(Boolean).length;

    let strength = 'Very Weak';
    if (score >= 5) strength = 'Very Strong';
    else if (score >= 4) strength = 'Strong';
    else if (score >= 3) strength = 'Medium';
    else if (score >= 2) strength = 'Weak';

    return {
      score,
      strength,
      isValid: score >= 4,
      requirements: {
        minLength: password.length >= minLength,
        hasUppercase,
        hasLowercase,
        hasNumbers,
        hasSpecialChar,
      },
    };
  }

  /**
   * Convert bytes to human readable format
   */
  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Deep clone object
   */
  static deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Remove empty properties from object
   */
  static removeEmptyProperties(obj) {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined && value !== '') {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  /**
   * Build Sequelize where clause from filters
   */
  static buildWhereClause(filters) {
    const whereClause = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          whereClause[key] = { [Op.in]: value };
        } else if (typeof value === 'string' && value.includes('%')) {
          whereClause[key] = { [Op.like]: value };
        } else {
          whereClause[key] = value;
        }
      }
    });

    return whereClause;
  }

  /**
   * Generate QR code data for discount card
   */
  static generateQRCodeData(cardNumber, userId) {
    return JSON.stringify({
      type: 'discount_card',
      cardNumber,
      userId,
      issuedAt: new Date().toISOString(),
      version: '1.0',
    });
  }

  /**
   * Mask sensitive information
   */
  static maskEmail(email) {
    const [localPart, domain] = email.split('@');
    const maskedLocal =
      localPart.substring(0, 2) + '*'.repeat(localPart.length - 2);
    return `${maskedLocal}@${domain}`;
  }

  static maskPhone(phone) {
    if (phone.length <= 4) return phone;
    return (
      phone.substring(0, 2) +
      '*'.repeat(phone.length - 4) +
      phone.substring(phone.length - 2)
    );
  }

  /**
   * Generate file hash
   */
  static generateFileHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Validate file type
   */
  static validateFileType(filename, allowedTypes) {
    const extension = filename.split('.').pop().toLowerCase();
    return allowedTypes.includes(extension);
  }

  /**
   * Convert string to title case
   */
  static toTitleCase(str) {
    return str.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  /**
   * Check if date is within range
   */
  static isDateInRange(date, startDate, endDate) {
    const checkDate = moment(date);
    const start = moment(startDate);
    const end = moment(endDate);
    return checkDate.isBetween(start, end, null, '[]');
  }

  /**
   * Generate random verification code
   */
  static generateVerificationCode(length = 6) {
    const numbers = '0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += numbers[Math.floor(Math.random() * numbers.length)];
    }
    return code;
  }

  /**
   * Validate age from date of birth
   */
  static calculateAge(dateOfBirth) {
    return moment().diff(moment(dateOfBirth), 'years');
  }

  /**
   * Check if user is adult (18+)
   */
  static isAdult(dateOfBirth) {
    return this.calculateAge(dateOfBirth) >= 18;
  }

  /**
   * Generate referral code
   */
  static generateReferralCode(name, length = 8) {
    const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
    const namePrefix = cleanName.substring(0, 3);
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    return (namePrefix + randomSuffix).substring(0, length);
  }

  /**
   * Calculate time difference
   */
  static getTimeDifference(date1, date2 = new Date()) {
    const diff = moment(date2).diff(moment(date1));
    const duration = moment.duration(diff);

    return {
      years: duration.years(),
      months: duration.months(),
      days: duration.days(),
      hours: duration.hours(),
      minutes: duration.minutes(),
      seconds: duration.seconds(),
      humanReadable: moment(date1).fromNow(),
    };
  }

  /**
   * Generate CSV data from array of objects
   */
  static generateCSV(data, headers = null) {
    if (!data || data.length === 0) return '';

    const csvHeaders = headers || Object.keys(data[0]);
    const csvRows = data.map((row) =>
      csvHeaders
        .map((header) => {
          const value = row[header] || '';
          // Escape commas and quotes
          return typeof value === 'string' &&
            (value.includes(',') || value.includes('"'))
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        })
        .join(',')
    );

    return [csvHeaders.join(','), ...csvRows].join('\n');
  }

  /**
   * Parse CSV string to array of objects
   */
  static parseCSV(csvString, hasHeaders = true) {
    const lines = csvString.trim().split('\n');
    if (lines.length === 0) return [];

    const headers = hasHeaders ? lines[0].split(',') : null;
    const dataLines = hasHeaders ? lines.slice(1) : lines;

    return dataLines.map((line, index) => {
      const values = line.split(',');
      if (headers) {
        const obj = {};
        headers.forEach((header, i) => {
          obj[header.trim()] = values[i] ? values[i].trim() : '';
        });
        return obj;
      } else {
        return values.map((val) => val.trim());
      }
    });
  }
}

module.exports = Helpers;
