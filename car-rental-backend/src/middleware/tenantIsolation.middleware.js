// src/middleware/tenantIsolation.middleware.js
/**
 * Tenant Isolation Middleware
 * Ensures all database queries are scoped to the authenticated user's company
 * This middleware MUST be used after authenticate.middleware.js
 */

const { sendError } = require('../utils/response.util');

/**
 * Injects company_id from JWT into req for easy access
 * Usage: Apply this after authenticate middleware on all protected routes
 */
const injectCompanyId = (req, res, next) => {
  try {
    // req.user comes from authenticate.middleware.js
    if (!req.user || !req.user.company_id) {
      console.error('🚫 Tenant isolation failed: No company_id in token');
      return sendError(res, { 
        statusCode: 403, 
        message: 'Access denied: Invalid company context' 
      });
    }

    // Make company_id easily accessible throughout the request
    req.companyId = req.user.company_id;
    
    console.log(`🏢 Tenant context set: company_id=${req.companyId}, user_id=${req.user.id}`);
    next();
  } catch (error) {
    console.error('💥 Tenant injection error:', error);
    sendError(res, { 
      statusCode: 500, 
      message: 'Failed to set tenant context', 
      details: error.message 
    });
  }
};

/**
 * Validates that a resource belongs to the user's company
 * Usage: validateTenantOwnership('company_id') or validateTenantOwnership('companyId')
 * 
 * @param {string} fieldName - The field name in the resource to check (default: 'company_id')
 * @returns {Function} Express middleware
 */
const validateTenantOwnership = (fieldName = 'company_id') => {
  return (req, res, next) => {
    try {
      const resourceCompanyId = req.body[fieldName] || req.params[fieldName] || req.query[fieldName];
      
      if (!resourceCompanyId) {
        // If no company_id in request, that's OK - it will be injected
        return next();
      }

      // If company_id is provided, it MUST match the authenticated user's company
      if (resourceCompanyId !== req.user.company_id) {
        console.warn(`🚫 Tenant violation attempt: user=${req.user.id} tried to access company=${resourceCompanyId}`);
        return sendError(res, { 
          statusCode: 403, 
          message: 'Access denied: Cannot access resources from another company' 
        });
      }

      next();
    } catch (error) {
      console.error('💥 Tenant validation error:', error);
      sendError(res, { 
        statusCode: 500, 
        message: 'Failed to validate tenant ownership', 
        details: error.message 
      });
    }
  };
};

/**
 * Automatically adds company_id to query parameters for Sequelize
 * Usage: Use in controllers before database queries
 * 
 * Example:
 *   const whereClause = applyTenantFilter(req, { status: 'active' });
 *   // Returns: { company_id: 'xxx', status: 'active' }
 */
const applyTenantFilter = (req, additionalFilters = {}) => {
  if (!req.companyId) {
    throw new Error('Tenant context not set - apply injectCompanyId middleware first');
  }
  
  return {
    company_id: req.companyId,
    ...additionalFilters,
  };
};

/**
 * Helper to ensure created resources have company_id
 * Usage: Use in controllers before create operations
 * 
 * Example:
 *   const data = applyTenantData(req, req.body);
 *   await Vehicle.create(data);
 */
const applyTenantData = (req, data = {}) => {
  if (!req.companyId) {
    throw new Error('Tenant context not set - apply injectCompanyId middleware first');
  }
  
  return {
    ...data,
    company_id: req.companyId,
  };
};

/**
 * Middleware to prevent cross-tenant data leaks in bulk operations
 * Validates that all items in req.body.items have matching company_id
 */
const validateBulkTenantOwnership = (req, res, next) => {
  try {
    const items = req.body.items || req.body;
    
    if (!Array.isArray(items)) {
      return next(); // Not a bulk operation
    }

    const invalidItems = items.filter(item => 
      item.company_id && item.company_id !== req.user.company_id
    );

    if (invalidItems.length > 0) {
      console.warn(`🚫 Bulk tenant violation: ${invalidItems.length} items don't match company_id`);
      return sendError(res, { 
        statusCode: 403, 
        message: 'Access denied: Cannot perform bulk operations across companies' 
      });
    }

    next();
  } catch (error) {
    console.error('💥 Bulk tenant validation error:', error);
    sendError(res, { 
      statusCode: 500, 
      message: 'Failed to validate bulk tenant ownership', 
      details: error.message 
    });
  }
};

module.exports = {
  injectCompanyId,
  validateTenantOwnership,
  applyTenantFilter,
  applyTenantData,
  validateBulkTenantOwnership,
};