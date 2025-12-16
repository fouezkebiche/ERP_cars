// src/routes/vehicle.routes.js
const express = require('express');
const router = express.Router();
const {
  getAllVehicles,
  getAvailableVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  addVehicleCost,
  getVehicleCosts,
} = require('../controllers/vehicle.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/permissions.middleware');
const { injectCompanyId } = require('../middleware/tenantIsolation.middleware');

// Apply authentication and tenant isolation to ALL routes
router.use(authenticateToken);
router.use(injectCompanyId);

// ============================================
// VEHICLE ROUTES
// ============================================

// GET /api/vehicles - List all vehicles (with filters)
// All authenticated users can view vehicles
router.get('/', getAllVehicles);

// GET /api/vehicles/available - Get available vehicles
// Must be BEFORE /:id route to avoid matching 'available' as an ID
router.get('/available', getAvailableVehicles);

// GET /api/vehicles/:id - Get single vehicle
router.get('/:id', getVehicleById);

// POST /api/vehicles - Create vehicle
// Only owners, admins, and managers can create vehicles
router.post('/', requireRole(['owner', 'admin', 'manager']), createVehicle);

// PUT /api/vehicles/:id - Update vehicle
// Only owners, admins, and managers can update vehicles
router.put('/:id', requireRole(['owner', 'admin', 'manager']), updateVehicle);

// DELETE /api/vehicles/:id - Delete vehicle (soft delete)
// Only owners and admins can delete vehicles
router.delete('/:id', requireRole(['owner', 'admin']), deleteVehicle);

// ============================================
// VEHICLE COST ROUTES
// ============================================

// POST /api/vehicles/:id/costs - Add vehicle cost
// Only owners, admins, and managers can add costs
router.post('/:id/costs', requireRole(['owner', 'admin', 'manager']), addVehicleCost);

// GET /api/vehicles/:id/costs - Get cost history
// All authenticated users can view costs
router.get('/:id/costs', getVehicleCosts);

module.exports = router;