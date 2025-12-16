// src/middleware/auth.middleware.js
const { verifyAccessToken } = require('../utils/jwt.util');
const { sendError } = require('../utils/response.util');

/**
 * Middleware to authenticate JWT access token
 * Expects: Authorization header as 'Bearer <token>'
 * Sets: req.user = { id, email, role, company_id }
 * Throws: 401 error if invalid/missing
 */
const authenticateToken = (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return sendError(res, {
        statusCode: 401,
        message: 'Access token required',
        code: 'NO_TOKEN',
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    req.user = decoded; // Attach to req for downstream use
    next();
  } catch (error) {
    return sendError(res, {
      statusCode: 401,
      message: error.message || 'Invalid token',
      code: 'INVALID_TOKEN',
    });
  }
};

/**
 * Optional: Middleware for optional auth (e.g., public routes with user info if logged in)
 */
const authenticateTokenOptional = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
    }
    // If no token, req.user remains undefined
    next();
  } catch (error) {
    // Silently ignore invalid tokens; treat as unauthenticated
    next();
  }
};

module.exports = {
  authenticateToken,
  authenticateTokenOptional,
};