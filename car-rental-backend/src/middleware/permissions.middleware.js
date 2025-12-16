// src/middleware/permissions.middleware.js
const { sendError } = require('../utils/response.util');

/**
 * Middleware factory: Check if user has required role(s)
 * Usage: permissionsMiddleware('admin') or permissionsMiddleware(['admin', 'owner'])
 * Assumes: req.user from auth.middleware.js
 * Throws: 403 if unauthorized
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, {
        statusCode: 401,
        message: 'Authentication required',
        code: 'UNAUTHENTICATED',
      });
    }

    const userRole = req.user.role;
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!rolesArray.includes(userRole)) {
      return sendError(res, {
        statusCode: 403,
        message: `Insufficient permissions. Required: ${rolesArray.join(', ')}`,
        code: 'FORBIDDEN',
      });
    }

    // Optional: Attach allowed roles to req for logging/auditing
    req.allowedRoles = rolesArray;
    next();
  };
};

/**
 * Higher-order: Combine auth + permissions (e.g., requireRole('owner'))
 * Usage: requireAuthAndRole('owner')
 */
const requireAuthAndRole = (allowedRoles) => {
  const auth = require('../middleware/auth.middleware').authenticateToken;
  const perm = requireRole(allowedRoles);
  return [auth, perm];
};

module.exports = {
  requireRole,
  requireAuthAndRole,
};