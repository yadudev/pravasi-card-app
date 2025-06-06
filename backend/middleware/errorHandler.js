const logger = require('../utils/logger');
const ApiResponse = require('../utils/responses');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(err);

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const message = 'Validation Error';
    const errors = err.errors.map((error) => ({
      field: error.path,
      message: error.message,
    }));
    return res.status(400).json(ApiResponse.validation(errors));
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const message = 'Duplicate field value';
    const errors = err.errors.map((error) => ({
      field: error.path,
      message: `${error.path} already exists`,
    }));
    return res.status(400).json(ApiResponse.validation(errors));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    return res.status(401).json(ApiResponse.error(message, 401));
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    return res.status(401).json(ApiResponse.error(message, 401));
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    return res.status(400).json(ApiResponse.error(message, 400));
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res
    .status(statusCode)
    .json(
      ApiResponse.error(
        message,
        statusCode,
        process.env.NODE_ENV === 'development' ? err.stack : null
      )
    );
};

module.exports = errorHandler;
