class ApiResponse {
  static success(data = null, message = 'Success', statusCode = 200) {
    return {
      success: true,
      message,
      data,
      status: statusCode,
      timestamp: new Date().toISOString(),
    };
  }

  static error(
    message = 'Internal Server Error',
    statusCode = 500,
    errors = null
  ) {
    return {
      success: false,
      message,
      errors,
      status: statusCode,
      timestamp: new Date().toISOString(),
    };
  }

  static paginated(data, pagination, message = 'Success') {
    return {
      success: true,
      message,
      data,
      pagination,
      timestamp: new Date().toISOString(),
    };
  }

  static validation(errors) {
    return {
      success: false,
      message: 'Validation failed',
      errors,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = ApiResponse;
