// src/routes/customer.routes.js - WITH TIER INFO
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

// Import tier info endpoint from contractKm controller
const { getCustomerTierInfoEndpoint } = require('../controllers/contractKm.controller');

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
router.get('/', getAllCustomers);

// GET /api/customers/:id/tier-info - Get customer loyalty tier (MUST be before /:id)
router.get('/:id/tier-info', getCustomerTierInfoEndpoint);

// GET /api/customers/:id/history - Get customer rental history
router.get('/:id/history', getCustomerHistory);

// GET /api/customers/:id - Get single customer
router.get('/:id', getCustomerById);

// POST /api/customers - Create customer
router.post('/', createCustomer);

// PUT /api/customers/:id - Update customer
router.put('/:id', requireRole(['owner', 'admin', 'manager', 'staff']), updateCustomer);

// DELETE /api/customers/:id - Delete customer
router.delete('/:id', requireRole(['owner', 'admin']), deleteCustomer);

module.exports = router;