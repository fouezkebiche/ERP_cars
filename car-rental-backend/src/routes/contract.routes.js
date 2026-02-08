// src/routes/contract.routes.js - UNIFIED VERSION
const express = require('express');
const router = express.Router();

// Import contract controllers
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

// Import KM & overage controllers
const {
  completeContractWithMileage,
  estimateOverageCharges,
  getCustomerTierInfoEndpoint,
} = require('../controllers/contractKm.controller');

// Import payment controller
const { getContractPayments } = require('../controllers/payment.controller');

// Import middleware
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/permissions.middleware');
const { injectCompanyId } = require('../middleware/tenantIsolation.middleware');

// ============================================
// APPLY MIDDLEWARE TO ALL ROUTES
// ============================================
router.use(authenticateToken);
router.use(injectCompanyId);

// ============================================
// GLOBAL CONTRACT ROUTES (MUST BE FIRST)
// ============================================

/**
 * GET /api/contracts/stats
 * Get contract statistics
 * MUST be before /:id to avoid matching 'stats' as an ID
 */
router.get('/stats', getContractStats);

/**
 * GET /api/contracts
 * List all contracts with filters
 */
router.get('/', getAllContracts);

/**
 * POST /api/contracts
 * Create new contract
 */
router.post('/', createContract);

// ============================================
// SPECIFIC CONTRACT ROUTES (/:id ROUTES)
// Order matters! More specific routes BEFORE generic /:id
// ============================================

/**
 * GET /api/contracts/:id/mileage-estimate
 * Estimate overage charges before completing contract
 * Query params: estimated_end_mileage (integer)
 */
router.get('/:id/mileage-estimate', estimateOverageCharges);

/**
 * GET /api/contracts/:id/payments
 * Get all payments for a contract
 */
router.get('/:id/payments', getContractPayments);

/**
 * GET /api/contracts/:id
 * Get single contract details
 */
router.get('/:id', getContractById);

/**
 * PUT /api/contracts/:id
 * Update contract
 */
router.put(
  '/:id',
  requireRole(['owner', 'admin', 'manager', 'staff']),
  updateContract
);

/**
 * POST /api/contracts/:id/complete-with-mileage
 * Complete contract with automatic overage calculation (NEW - with tier pricing)
 * 
 * Body:
 *   - end_mileage: Final vehicle mileage (required)
 *   - actual_return_date: Return date (required)
 *   - additional_charges: Other charges (optional)
 *   - notes: Additional notes (optional)
 * 
 * Features:
 *   - Calculates km driven
 *   - Applies tier-based km bonuses
 *   - Calculates overage charges with tier discounts
 *   - Updates contract total
 *   - Returns vehicle to available
 *   - Creates overage notification
 */
router.post(
  '/:id/complete-with-mileage',
  requireRole(['owner', 'admin', 'manager', 'staff']),
  completeContractWithMileage
);

/**
 * POST /api/contracts/:id/complete
 * Complete contract (LEGACY - basic completion without tier pricing)
 * Use /complete-with-mileage for new implementations
 */
router.post(
  '/:id/complete',
  requireRole(['owner', 'admin', 'manager', 'staff']),
  completeContract
);

/**
 * POST /api/contracts/:id/cancel
 * Cancel contract
 */
router.post(
  '/:id/cancel',
  requireRole(['owner', 'admin', 'manager']),
  cancelContract
);

/**
 * POST /api/contracts/:id/extend
 * Extend rental period
 */
router.post(
  '/:id/extend',
  requireRole(['owner', 'admin', 'manager', 'staff']),
  extendContract
);

module.exports = router;