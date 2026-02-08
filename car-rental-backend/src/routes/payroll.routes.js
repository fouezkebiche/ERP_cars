// src/routes/payroll.routes.js
const express = require('express');
const router = express.Router();
const {
  calculatePayroll,
  getPayroll,
  approvePayroll,
  markAsPaid,
  getPayrollStats,
} = require('../controllers/payroll.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/permissions.middleware');
const { injectCompanyId } = require('../middleware/tenantIsolation.middleware');

// Apply authentication and tenant isolation to ALL routes
router.use(authenticateToken);
router.use(injectCompanyId);

// ============================================
// PAYROLL ROUTES
// ============================================

/**
 * GET /api/payroll/stats
 * Get payroll statistics
 * Query params:
 *   - month: YYYY-MM (optional)
 * Access: Owner, Admin, Accountant
 */
router.get('/stats', requireRole(['owner', 'admin', 'accountant']), getPayrollStats);

/**
 * GET /api/payroll
 * Get payroll records with filters
 * Query params:
 *   - employee_id: UUID (optional)
 *   - month: YYYY-MM (optional)
 *   - status: Payment status (optional)
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 20)
 * Access: Owner, Admin, Accountant
 */
router.get('/', requireRole(['owner', 'admin', 'accountant']), getPayroll);

/**
 * POST /api/payroll/calculate
 * Calculate payroll for an employee for a period
 * Body:
 *   - employee_id: UUID
 *   - pay_period_start: ISO date
 *   - pay_period_end: ISO date
 *   - payment_date: ISO date (optional)
 * Access: Owner, Admin, Accountant
 */
router.post('/calculate', requireRole(['owner', 'admin', 'accountant']), calculatePayroll);

/**
 * PUT /api/payroll/:id/approve
 * Approve payroll
 * Access: Owner, Admin
 */
router.put('/:id/approve', requireRole(['owner', 'admin']), approvePayroll);

/**
 * PUT /api/payroll/:id/pay
 * Mark payroll as paid
 * Body:
 *   - payment_date: ISO date
 *   - payment_method: 'bank_transfer' | 'cash' | 'check'
 *   - payment_reference: String (optional)
 * Access: Owner, Admin, Accountant
 */
router.put('/:id/pay', requireRole(['owner', 'admin', 'accountant']), markAsPaid);

module.exports = router;