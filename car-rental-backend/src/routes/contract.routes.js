// src/routes/contract.routes.js
const express = require('express');
const router = express.Router();
const {
  getAllContracts,
  getContractById,
  createContract,
  updateContract,
  completeContract,
  cancelContract,
  extendContract,
  getContractStats,
} = require('../controllers/contract.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/permissions.middleware');
const { injectCompanyId } = require('../middleware/tenantIsolation.middleware');
const { getContractPayments } = require('../controllers/payment.controller');

// Apply authentication and tenant isolation to ALL routes
router.use(authenticateToken);
router.use(injectCompanyId);

// ============================================
// CONTRACT ROUTES
// ============================================

// GET /api/contracts/stats - Get statistics
// Must be BEFORE /:id to avoid matching 'stats' as an ID
router.get('/stats', getContractStats);

// GET /api/contracts - List all contracts
// All authenticated users can view contracts
router.get('/', getAllContracts);

// GET /api/contracts/:id - Get single contract
router.get('/:id', getContractById);

// POST /api/contracts - Create new contract
// All users can create contracts
router.post('/', createContract);

// PUT /api/contracts/:id - Update contract
// Only owners, admins, managers, and staff can update
router.put('/:id', requireRole(['owner', 'admin', 'manager', 'staff']), updateContract);

// POST /api/contracts/:id/complete - Complete rental
// Only owners, admins, managers, and staff can complete
router.post('/:id/complete', requireRole(['owner', 'admin', 'manager', 'staff']), completeContract);

// POST /api/contracts/:id/cancel - Cancel contract
// Only owners, admins, and managers can cancel
router.post('/:id/cancel', requireRole(['owner', 'admin', 'manager']), cancelContract);

// POST /api/contracts/:id/extend - Extend rental period
// Only owners, admins, managers, and staff can extend
router.post('/:id/extend', requireRole(['owner', 'admin', 'manager', 'staff']), extendContract);


// GET /api/contracts/:id/payments - Get all payments for a contract
router.get('/:id/payments', getContractPayments);

module.exports = router;