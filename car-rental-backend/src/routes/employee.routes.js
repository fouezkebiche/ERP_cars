// src/routes/employee.routes.js
const express = require('express');
const router = express.Router();
const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  terminateEmployee,
  resetEmployeePassword,
  getEmployeeStats,
  getAvailableRoles,
} = require('../controllers/employee.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/permissions.middleware');
const { injectCompanyId } = require('../middleware/tenantIsolation.middleware');

// Apply authentication and tenant isolation to ALL routes
router.use(authenticateToken);
router.use(injectCompanyId);

// ============================================
// EMPLOYEE ROUTES
// ============================================

/**
 * GET /api/employees/roles
 * Get available roles with their permissions
 * Access: All authenticated users
 */
router.get('/roles', getAvailableRoles);

/**
 * GET /api/employees/stats
 * Get employee statistics
 * Access: Owner, Admin, Manager
 */
router.get('/stats', requireRole(['owner', 'admin', 'manager']), getEmployeeStats);

/**
 * GET /api/employees
 * List all employees with filters
 * Query params:
 *   - status: 'active' | 'on_leave' | 'suspended' | 'terminated'
 *   - role: Employee role
 *   - department: Department name
 *   - search: Search by name, email, phone, position
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 20)
 *   - sort_by: Sort field (default: created_at)
 *   - sort_order: 'ASC' | 'DESC' (default: DESC)
 * 
 * Access: Owner, Admin, Manager, Receptionist
 */
router.get('/', requireRole(['owner', 'admin', 'manager', 'receptionist']), getAllEmployees);

/**
 * GET /api/employees/:id
 * Get single employee with full details
 * Access: Owner, Admin, Manager, Receptionist
 */
router.get('/:id', requireRole(['owner', 'admin', 'manager', 'receptionist']), getEmployeeById);

/**
 * POST /api/employees
 * Create new employee (also creates user account)
 * Required fields:
 *   - full_name: string
 *   - email: string (unique)
 *   - phone: string
 *   - password: string (min 8 chars)
 *   - role: Role enum
 *   - hire_date: ISO date
 * Optional fields:
 *   - department: Department enum
 *   - position: string
 *   - salary_type: Salary type enum
 *   - salary: number
 *   - commission_rate: number (0-100)
 *   - work_schedule: object
 *   - custom_permissions: object
 *   - address, emergency_contact_name, emergency_contact_phone, notes
 * 
 * Access: Owner, Admin
 */
router.post('/', requireRole(['owner', 'admin']), createEmployee);

/**
 * PUT /api/employees/:id
 * Update employee details
 * All fields are optional
 * Access: Owner, Admin
 */
router.put('/:id', requireRole(['owner', 'admin']), updateEmployee);

/**
 * DELETE /api/employees/:id
 * Terminate employee (soft delete - sets status to 'terminated')
 * Also deactivates the associated user account
 * Note: Cannot terminate owner accounts
 * Access: Owner only
 */
router.delete('/:id', requireRole(['owner']), terminateEmployee);

/**
 * POST /api/employees/:id/reset-password
 * Reset employee's password
 * Required fields:
 *   - new_password: string (min 8 chars)
 * 
 * Access: Owner, Admin
 */
router.post('/:id/reset-password', requireRole(['owner', 'admin']), resetEmployeePassword);

module.exports = router;