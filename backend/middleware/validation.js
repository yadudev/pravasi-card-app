const { body, query, param, validationResult } = require('express-validator');
const ApiResponse = require('../utils/responses');

class ValidationMiddleware {
  static validate(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map((error) => ({
        field: error.param,
        message: error.msg,
        value: error.value,
      }));

      return res.status(400).json(ApiResponse.validation(formattedErrors));
    }
    next();
  }

  // Common validation rules
  static emailValidation() {
    return body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address');
  }

  static passwordValidation() {
    return body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      );
  }

  static phoneValidation() {
    return body('phone')
      .isMobilePhone('en-IN')
      .withMessage('Please provide a valid Indian mobile number');
  }

  static paginationValidation() {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    ];
  }

  static idValidation() {
    return param('id')
      .isInt({ min: 1 })
      .withMessage('ID must be a positive integer');
  }
}

module.exports = ValidationMiddleware;
