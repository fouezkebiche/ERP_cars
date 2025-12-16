// src/utils/response.util.js

/**
 * Send success response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status (default 200)
 * @param {string} message - Success message
 * @param {any} data - Optional data payload
 * @param {object} meta - Optional metadata (e.g., { pagination: { page, limit } })
 */
const sendSuccess = (res, { statusCode = 200, message = 'Success', data = null, meta = null }) => {
  const response = {
    success: true,
    message,
    ...(data && { data }),
    ...(meta && { meta }),
  };
  res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status (default 400)
 * @param {string} message - Error message
 * @param {string} [code] - Optional error code (e.g., 'VALIDATION_ERROR')
 * @param {any} [details] - Optional error details
 */
const sendError = (res, { statusCode = 400, message = 'Bad Request', code = null, details = null }) => {
  const response = {
    success: false,
    message,
    ...(code && { code }),
    ...(details && { details }),
  };
  res.status(statusCode).json(response);
};

/**
 * Send validation error (for express-validator)
 * @param {object} res - Express response object
 * @param {array} errors - Array of validation errors
 */
const sendValidationError = (res, errors) => {
  sendError(res, {
    statusCode: 422,
    message: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: errors,
  });
};

module.exports = {
  sendSuccess,
  sendError,
  sendValidationError,
};