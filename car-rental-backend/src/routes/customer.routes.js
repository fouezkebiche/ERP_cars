// src/routes/customer.routes.js
const express = require('express');
const router = express.Router();
const {
  getAllCustomers,
  getCustomerById,
  getCustomerHistory,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats,
} = require('../controllers/customer.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/permissions.middleware');
const { injectCompanyId } = require('../middleware/tenantIsolation.middleware');

// Apply authentication and tenant isolation to ALL routes
router.use(authenticateToken);
router.use(injectCompanyId);

// ============================================
// CUSTOMER ROUTES
// ============================================

// GET /api/customers/stats - Get customer statistics
// Must be BEFORE /:id route to avoid matching 'stats' as an ID
router.get('/stats', getCustomerStats);

// GET /api/customers - List all customers (with filters & search)
// All authenticated users can view customers
router.get('/', getAllCustomers);

// GET /api/customers/:id - Get single customer
router.get('/:id', getCustomerById);

// GET /api/customers/:id/history - Get customer rental history
router.get('/:id/history', getCustomerHistory);

// POST /api/customers - Create customer
// All users can create customers (staff need to register walk-ins)
router.post('/', createCustomer);

// PUT /api/customers/:id - Update customer
// Only owners, admins, managers, and staff can update
router.put('/:id', requireRole(['owner', 'admin', 'manager', 'staff']), updateCustomer);

// DELETE /api/customers/:id - Delete customer
// Only owners and admins can delete customers
router.delete('/:id', requireRole(['owner', 'admin']), deleteCustomer);

module.exports = router;