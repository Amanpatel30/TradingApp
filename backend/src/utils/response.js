/**
 * Standard HTTP Response Helper
 * Provides consistent response structure across the API
 */

class ApiResponse {
  /**
   * Success Response
   * @param {Object} res - Express response object
   * @param {Object} data - Response data
   * @param {String} message - Success message
   * @param {Number} statusCode - HTTP status code (default: 200)
   */
  static success(res, data = null, message = 'Success', statusCode = 200) {
    const response = {
      success: true,
      message,
      data,
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Error Response
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   * @param {Number} statusCode - HTTP status code (default: 500)
   * @param {Object} errors - Additional error details
   */
  static error(res, message = 'Error', statusCode = 500, errors = null) {
    const response = {
      success: false,
      message,
      ...(errors && { errors }),
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Validation Error Response (422)
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   * @param {Object} errors - Validation details
   */
  static validationError(res, message = 'Validation failed', errors = null) {
    return this.error(res, message, 422, errors);
  }

  /**
   * Created Response (201)
   * @param {Object} res - Express response object
   * @param {Object} data - Created resource data
   * @param {String} message - Success message
   */
  static created(res, data, message = 'Resource created successfully') {
    return this.success(res, data, message, 201);
  }

  /**
   * No Content Response (204)
   * @param {Object} res - Express response object
   */
  static noContent(res) {
    return res.status(204).send();
  }

  /**
   * Paginated Response
   * @param {Object} res - Express response object
   * @param {Array} data - Array of resources
   * @param {Object} pagination - Pagination metadata
   * @param {String} message - Success message
   */
  static paginated(res, data, pagination, message = 'Success') {
    const response = {
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit),
      },
    };

    return res.status(200).json(response);
  }
}

module.exports = ApiResponse;
