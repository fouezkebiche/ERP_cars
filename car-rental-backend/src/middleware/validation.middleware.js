// src/middleware/validation.middleware.js
const { body, param, query, validationResult } = require('express-validator');
const { sendError } = require('../utils/response.util');

/**
 * Middleware to check validation results
 * Use this after validation chains in routes
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, {
      statusCode: 422,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array(),
    });
  }
  next();
};

/**
 * Common validation chains for reuse
 */
const validations = {
  // UUID validation
  uuid: (field = 'id') => 
    param(field).isUUID().withMessage(`${field} must be a valid UUID`),

  // Pagination
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],

  // Date range
  dateRange: [
    query('start_date').optional().isISO8601().withMessage('Valid start date required (ISO 8601)'),
    query('end_date').optional().isISO8601().withMessage('Valid end date required (ISO 8601)'),
  ],

  // Vehicle fields
  vehicle: {
    brand: body('brand').notEmpty().withMessage('Brand is required').trim(),
    model: body('model').notEmpty().withMessage('Model is required').trim(),
    year: body('year')
      .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
      .withMessage('Valid year required'),
    registration: body('registration_number')
      .notEmpty()
      .withMessage('Registration number is required')
      .trim(),
    transmission: body('transmission')
      .isIn(['manual', 'automatic'])
      .withMessage('Transmission must be manual or automatic'),
    fuel_type: body('fuel_type')
      .isIn(['petrol', 'diesel', 'electric', 'hybrid'])
      .withMessage('Valid fuel type required'),
    seats: body('seats')
      .isInt({ min: 1, max: 50 })
      .withMessage('Seats must be between 1 and 50'),
    daily_rate: body('daily_rate')
      .isFloat({ min: 0 })
      .withMessage('Daily rate must be a positive number'),
    status: body('status')
      .optional()
      .isIn(['available', 'rented', 'maintenance', 'retired'])
      .withMessage('Invalid status'),
  },

  // Customer fields
  customer: {
    full_name: body('full_name').notEmpty().withMessage('Full name is required').trim(),
    email: body('email')
      .optional()
      .isEmail()
      .withMessage('Valid email required')
      .normalizeEmail(),
    phone: body('phone')
      .notEmpty()
      .withMessage('Phone is required')
      .matches(/^[+]?[0-9\s-()]+$/)
      .withMessage('Valid phone number required'),
    customer_type: body('customer_type')
      .isIn(['individual', 'corporate'])
      .withMessage('Customer type must be individual or corporate'),
    license: body('drivers_license_number')
      .optional()
      .trim()
      .isLength({ min: 5, max: 50 })
      .withMessage('License number must be 5-50 characters'),
  },

  // Contract fields
  contract: {
    customer_id: body('customer_id').isUUID().withMessage('Valid customer ID required'),
    vehicle_id: body('vehicle_id').isUUID().withMessage('Valid vehicle ID required'),
    start_date: body('start_date').isISO8601().withMessage('Valid start date required'),
    end_date: body('end_date').isISO8601().withMessage('Valid end date required'),
    daily_rate: body('daily_rate')
      .isFloat({ min: 0 })
      .withMessage('Daily rate must be positive'),
  },

  // Payment fields
  payment: {
    amount: body('amount').isFloat({ min: 0 }).withMessage('Amount must be positive'),
    payment_method: body('payment_method')
      .isIn(['cash', 'card', 'bank_transfer', 'check', 'mobile_payment'])
      .withMessage('Invalid payment method'),
    payment_date: body('payment_date')
      .optional()
      .isISO8601()
      .withMessage('Valid payment date required'),
  },
};

/**
 * Validate that end_date is after start_date
 */
const validateDateRange = (req, res, next) => {
  const { start_date, end_date } = req.body;
  
  if (start_date && end_date) {
    const start = new Date(start_date);
    const end = new Date(end_date);
    
    if (end <= start) {
      return sendError(res, {
        statusCode: 422,
        message: 'End date must be after start date',
        code: 'INVALID_DATE_RANGE',
      });
    }
  }
  
  next();
};

/**
 * Sanitize input to prevent XSS
 */
const sanitizeInput = (req, res, next) => {
  // Remove any HTML tags from string inputs
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(/<[^>]*>/g, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};

/**
 * Validate file upload
 */
const validateFileUpload = (allowedTypes = [], maxSize = 5 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.file) {
      return next(); // No file, skip validation
    }

    const file = req.file;

    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      return sendError(res, {
        statusCode: 422,
        message: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`,
        code: 'INVALID_FILE_TYPE',
      });
    }

    // Check file size
    if (file.size > maxSize) {
      return sendError(res, {
        statusCode: 422,
        message: `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`,
        code: 'FILE_TOO_LARGE',
      });
    }

    next();
  };
};

module.exports = {
  handleValidationErrors,
  validations,
  validateDateRange,
  sanitizeInput,
  validateFileUpload,
};