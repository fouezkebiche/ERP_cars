// src/routes/vehicle.routes.js - FIXED
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
const {
  completeMaintenanceService,
  getMaintenanceHistory,
  getVehiclesDueMaintenance,
} = require('../controllers/vehicleMaintenance.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/permissions.middleware');
const { injectCompanyId } = require('../middleware/tenantIsolation.middleware');

// Apply authentication and tenant isolation to ALL routes
router.use(authenticateToken);
router.use(injectCompanyId);

// ============================================
// MAINTENANCE ROUTES (MUST BE BEFORE /:id)
// ============================================

// GET /api/vehicles/maintenance/due
router.get('/maintenance/due', getVehiclesDueMaintenance);

// ============================================
// VEHICLE ROUTES
// ============================================

// GET /api/vehicles - List all vehicles (with filters)
router.get('/', getAllVehicles);

// GET /api/vehicles/available - Get available vehicles
// MUST be BEFORE /:id route
router.get('/available', getAvailableVehicles);

// GET /api/vehicles/:id - Get single vehicle
router.get('/:id', getVehicleById);

// POST /api/vehicles - Create vehicle
router.post('/', requireRole(['owner', 'admin', 'manager']), createVehicle);

// PUT /api/vehicles/:id - Update vehicle
router.put('/:id', requireRole(['owner', 'admin', 'manager']), updateVehicle);

// DELETE /api/vehicles/:id - Delete vehicle (soft delete)
router.delete('/:id', requireRole(['owner', 'admin']), deleteVehicle);

// ============================================
// VEHICLE-SPECIFIC MAINTENANCE ROUTES
// ============================================

// POST /api/vehicles/:id/maintenance/complete
router.post(
  '/:id/maintenance/complete',
  requireRole(['owner', 'admin', 'manager']),
  completeMaintenanceService
);

// GET /api/vehicles/:id/maintenance/history
router.get('/:id/maintenance/history', getMaintenanceHistory);

// ============================================
// VEHICLE COST ROUTES
// ============================================

// POST /api/vehicles/:id/costs - Add vehicle cost
router.post('/:id/costs', requireRole(['owner', 'admin', 'manager']), addVehicleCost);

// GET /api/vehicles/:id/costs - Get cost history
router.get('/:id/costs', getVehicleCosts);

module.exports = router;