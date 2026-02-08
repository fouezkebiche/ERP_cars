// src/middleware/rbac.middleware.js (FIXED - Stable Employee Lookup)
const { Employee } = require('../models');
const { sendError } = require('../utils/response.util');
const { ROLES, hasPermission } = require('../controllers/employee.controller');

/**
 * RBAC Middleware - Permission-based access control
 */

// Define all possible permissions
const PERMISSIONS = {
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_ANALYTICS: 'view_analytics',
  CREATE_EMPLOYEES: 'create_employees',
  UPDATE_EMPLOYEES: 'update_employees',
  DELETE_EMPLOYEES: 'delete_employees',
  VIEW_EMPLOYEES: 'view_employees',
  CREATE_VEHICLES: 'create_vehicles',
  UPDATE_VEHICLES: 'update_vehicles',
  DELETE_VEHICLES: 'delete_vehicles',
  VIEW_VEHICLES: 'view_vehicles',
  ADD_VEHICLE_COSTS: 'add_vehicle_costs',
  VIEW_VEHICLE_COSTS: 'view_vehicle_costs',
  CREATE_CUSTOMERS: 'create_customers',
  UPDATE_CUSTOMERS: 'update_customers',
  DELETE_CUSTOMERS: 'delete_customers',
  VIEW_CUSTOMERS: 'view_customers',
  CREATE_CONTRACTS: 'create_contracts',
  UPDATE_CONTRACTS: 'update_contracts',
  COMPLETE_CONTRACTS: 'complete_contracts',
  CANCEL_CONTRACTS: 'cancel_contracts',
  VIEW_CONTRACTS: 'view_contracts',
  CREATE_PAYMENTS: 'create_payments',
  UPDATE_PAYMENTS: 'update_payments',
  VIEW_PAYMENTS: 'view_payments',
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_BILLING: 'manage_billing',
  CREATE_ATTENDANCE: 'create_attendance',
  VIEW_ATTENDANCE: 'view_attendance',
  MANAGE_PAYROLL: 'manage_payroll',
  VIEW_PAYROLL: 'view_payroll',
  APPROVE_PAYROLL: 'approve_payroll',
};

/**
 * Fallback: Check permission using role only (no DB)
 */
const hasRoleOnlyPermission = (userRole, requiredPermission) => {
  const rolePerms = ROLES[userRole]?.permissions || [];
  if (rolePerms.includes('*')) return true;
  return rolePerms.includes(requiredPermission);
};

/**
 * ✅ FIXED: Middleware factory for permission checking
 */
const requirePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return sendError(res, {
          statusCode: 401,
          message: 'Authentication required',
          code: 'UNAUTHENTICATED',
        });
      }

      // Owner always passes
      if (req.user.role === 'owner') {
        console.log(`✅ Owner ${req.user.email} auto-granted ${requiredPermission}`);
        return next();
      }

      // ✅ CRITICAL FIX: Try fetching employee with EXACT user_id match
      let employee = null;
      try {
        employee = await Employee.findOne({
          where: {
            user_id: req.user.id, // ✅ Must match JWT user.id exactly
            company_id: req.companyId,
            status: 'active',
          },
        });

        console.log(
          `🔍 RBAC - User: ${req.user.email}, UserID: ${req.user.id}, CompanyID: ${req.companyId}, Found Employee: ${
            employee ? `${employee.id} (${employee.role})` : 'NULL'
          }`
        );

        if (!employee) {
          console.warn(
            `⚠️ No employee found for user_id=${req.user.id}, company_id=${req.companyId}. Using fallback role check.`
          );
        }
      } catch (fetchErr) {
        console.error(`❌ Employee fetch error for ${req.user.email}:`, fetchErr.message);
      }

      let hasPerm = false;

      if (employee) {
        // ✅ Use full permission check with custom permissions
        hasPerm = hasPermission(employee, requiredPermission);
        console.log(
          `🔍 Full Perm Check - Employee ${employee.full_name} (${employee.role}) has '${requiredPermission}': ${hasPerm}`
        );
      } else {
        // ✅ Fallback to role-only check from JWT
        hasPerm = hasRoleOnlyPermission(req.user.role, requiredPermission);
        console.log(
          `🔄 Fallback Role Check - ${req.user.role} has '${requiredPermission}': ${hasPerm}`
        );
      }

      if (hasPerm) {
        if (employee) req.employee = employee; // Attach employee if found
        return next();
      }

      console.warn(
        `🚫 Permission denied: ${req.user.email} (${req.user.role}) lacks ${requiredPermission}${
          !employee ? ' (no employee record, used fallback)' : ''
        }`
      );

      return sendError(res, {
        statusCode: 403,
        message: `Insufficient permissions. Required: ${requiredPermission}`,
        code: 'FORBIDDEN',
      });
    } catch (error) {
      console.error('💥 Permission check error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to verify permissions',
        details: error.message,
      });
    }
  };
};

/**
 * Middleware: Check if user has ANY of the given permissions
 */
const requireAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return sendError(res, {
          statusCode: 401,
          message: 'Authentication required',
          code: 'UNAUTHENTICATED',
        });
      }

      if (req.user.role === 'owner') {
        return next();
      }

      let employee = null;
      try {
        employee = await Employee.findOne({
          where: {
            user_id: req.user.id,
            company_id: req.companyId,
            status: 'active',
          },
        });

        console.log(
          `🔍 RBAC (ANY) - User: ${req.user.email}, UserID: ${req.user.id}, Found: ${
            employee ? `${employee.id} (${employee.role})` : 'NULL'
          }`
        );
      } catch (fetchErr) {
        console.warn(`⚠️ Employee fetch error:`, fetchErr.message);
      }

      let hasAny = false;

      if (employee) {
        hasAny = permissions.some((perm) => {
          const hasPerm = hasPermission(employee, perm);
          console.log(`🔍 Perm Check (ANY) - ${employee.full_name} has '${perm}': ${hasPerm}`);
          return hasPerm;
        });
      } else {
        hasAny = permissions.some((perm) => hasRoleOnlyPermission(req.user.role, perm));
        console.log(`🔄 Fallback (ANY) - ${req.user.role} => ${hasAny} for [${permissions.join(', ')}]`);
      }

      if (hasAny) {
        if (employee) req.employee = employee;
        return next();
      }

      return sendError(res, {
        statusCode: 403,
        message: `Insufficient permissions. Required one of: ${permissions.join(', ')}`,
        code: 'FORBIDDEN',
      });
    } catch (error) {
      console.error('💥 Any permission check error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to verify permissions',
        details: error.message,
      });
    }
  };
};

/**
 * Middleware: Inject employee permissions into request
 */
const injectPermissions = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    if (req.user.role === 'owner') {
      req.permissions = Object.values(PERMISSIONS);
      return next();
    }

    const employee = await Employee.findOne({
      where: {
        user_id: req.user.id,
        company_id: req.companyId,
        status: 'active',
      },
    });

    if (employee) {
      const rolePermissions = ROLES[employee.role]?.permissions || [];
      const customPermissions = Object.keys(employee.custom_permissions || {}).filter(
        (key) => employee.custom_permissions[key] === true
      );

      req.permissions = [...new Set([...rolePermissions, ...customPermissions])];
      req.employee = employee;
    }

    next();
  } catch (error) {
    console.error('💥 Inject permissions error:', error);
    next();
  }
};

module.exports = {
  requirePermission,
  requireAnyPermission,
  injectPermissions,
  PERMISSIONS,
  ROLES,
};