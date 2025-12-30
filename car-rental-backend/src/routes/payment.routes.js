// src/routes/payment.routes.js
const express = require('express');
const router = express.Router();
const {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  getOutstandingPayments,
  getContractPayments,
  getPaymentStats,
} = require('../controllers/payment.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/permissions.middleware');
const { injectCompanyId } = require('../middleware/tenantIsolation.middleware');

// Apply authentication and tenant isolation to ALL routes
router.use(authenticateToken);
router.use(injectCompanyId);

// ============================================
// PAYMENT ROUTES
// ============================================

// GET /api/payments/stats - Get payment statistics
// Must be BEFORE /:id route to avoid matching 'stats' as an ID
router.get('/stats', getPaymentStats);

// GET /api/payments/outstanding - Get outstanding payments
// Must be BEFORE /:id route to avoid matching 'outstanding' as an ID
router.get('/outstanding', getOutstandingPayments);

// GET /api/payments - List all payments
// All authenticated users can view payments
router.get('/', getAllPayments);

// GET /api/payments/:id - Get single payment
router.get('/:id', getPaymentById);

// POST /api/payments - Record new payment
// Only owners, admins, managers, and staff can record payments
router.post('/', requireRole(['owner', 'admin', 'manager', 'staff']), createPayment);

// PUT /api/payments/:id - Update payment
// Only owners, admins, and managers can update payments
router.put('/:id', requireRole(['owner', 'admin', 'manager']), updatePayment);

module.exports = router;