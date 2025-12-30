// src/routes/analytics.routes.js
const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getRevenue,
  getVehiclePerformance,
  getVehicleUtilization,
  getVehicleProfitLoss,
  getCustomerAnalytics,
  getCustomerSegmentation,
  getCustomerRetention,
} = require('../controllers/analytics.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/permissions.middleware');
const { injectCompanyId } = require('../middleware/tenantIsolation.middleware');

// Apply authentication and tenant isolation to ALL routes
router.use(authenticateToken);
router.use(injectCompanyId);

// ============================================
// DASHBOARD & OVERVIEW
// ============================================

/**
 * GET /api/analytics/dashboard
 * Get comprehensive dashboard KPIs
 * Query params:
 *   - period: 'today' | 'week' | 'month' | 'quarter' | 'year'
 *   - start_date: ISO date string (optional)
 *   - end_date: ISO date string (optional)
 * 
 * Access: All authenticated users
 */
router.get('/dashboard', getDashboard);

// ============================================
// REVENUE ANALYTICS
// ============================================

/**
 * GET /api/analytics/revenue
 * Get detailed revenue analytics
 * Query params:
 *   - period: 'today' | 'week' | 'month' | 'quarter' | 'year'
 *   - start_date: ISO date string (optional)
 *   - end_date: ISO date string (optional)
 *   - compare: boolean (compare with previous period)
 * 
 * Access: Owner, Admin, Manager
 */
router.get(
  '/revenue',
  requireRole(['owner', 'admin', 'manager']),
  getRevenue
);

// ============================================
// VEHICLE ANALYTICS
// ============================================

/**
 * GET /api/analytics/vehicles
 * Get vehicle performance overview
 * Query params:
 *   - period: 'today' | 'week' | 'month' | 'quarter' | 'year'
 *   - start_date: ISO date string (optional)
 *   - end_date: ISO date string (optional)
 *   - metric: 'utilization' | 'revenue' | 'profit'
 *   - limit: number (default 10)
 * 
 * Access: All authenticated users
 */
router.get('/vehicles', getVehiclePerformance);

/**
 * GET /api/analytics/vehicles/utilization
 * Get detailed vehicle utilization rates
 * Query params:
 *   - period: 'today' | 'week' | 'month' | 'quarter' | 'year'
 *   - start_date: ISO date string (optional)
 *   - end_date: ISO date string (optional)
 *   - vehicle_id: UUID (filter by specific vehicle)
 * 
 * Access: All authenticated users
 */
router.get('/vehicles/utilization', getVehicleUtilization);

/**
 * GET /api/analytics/vehicles/profit-loss
 * Get vehicle profit & loss analysis
 * Query params:
 *   - period: 'month' | 'quarter' | 'year'
 *   - start_date: ISO date string (optional)
 *   - end_date: ISO date string (optional)
 * 
 * Access: Owner, Admin, Manager
 */
router.get(
  '/vehicles/profit-loss',
  requireRole(['owner', 'admin', 'manager']),
  getVehicleProfitLoss
);

// ============================================
// CUSTOMER ANALYTICS
// ============================================

/**
 * GET /api/analytics/customers
 * Get comprehensive customer analytics (segmentation + retention)
 * Query params:
 *   - period: 'week' | 'month' | 'quarter' | 'year'
 *   - start_date: ISO date string (optional)
 *   - end_date: ISO date string (optional)
 * 
 * Access: Owner, Admin, Manager
 */
router.get(
  '/customers',
  requireRole(['owner', 'admin', 'manager']),
  getCustomerAnalytics
);

/**
 * GET /api/analytics/customers/segmentation
 * Get customer segmentation by value
 * No query params (uses all-time data)
 * 
 * Access: Owner, Admin, Manager
 */
router.get(
  '/customers/segmentation',
  requireRole(['owner', 'admin', 'manager']),
  getCustomerSegmentation
);

/**
 * GET /api/analytics/customers/retention
 * Get customer retention metrics
 * Query params:
 *   - period: 'week' | 'month' | 'quarter' | 'year'
 *   - start_date: ISO date string (optional)
 *   - end_date: ISO date string (optional)
 * 
 * Access: Owner, Admin, Manager
 */
router.get(
  '/customers/retention',
  requireRole(['owner', 'admin', 'manager']),
  getCustomerRetention
);

module.exports = router;