// src/routes/reports.routes.js
const express = require('express');
const router = express.Router();
const {
  generateReport,
  generateReportPDF,
  generateReportExcel,
} = require('../controllers/reports.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/permissions.middleware');
const { injectCompanyId } = require('../middleware/tenantIsolation.middleware');

// Apply authentication and tenant isolation to ALL routes
router.use(authenticateToken);
router.use(injectCompanyId);

// ============================================
// REPORT GENERATION ROUTES
// ============================================

/**
 * GET /api/reports/:type
 * Generate report in JSON format
 * 
 * Params:
 *   - type: 'executive' | 'vehicle' | 'customer'
 * 
 * Query params:
 *   - startDate: ISO date string (optional)
 *   - endDate: ISO date string (optional)
 *   - vehicleIds: Array of vehicle IDs (optional)
 *   - customerIds: Array of customer IDs (optional)
 *   - minRevenue: Minimum revenue filter (optional)
 *   - maxRevenue: Maximum revenue filter (optional)
 *   - minUtilization: Minimum utilization % (optional)
 *   - maxUtilization: Maximum utilization % (optional)
 *   - vehicleBrand: Filter by brand (optional)
 *   - customerType: 'individual' | 'corporate' (optional)
 *   - sortBy: 'profit' | 'revenue' | 'utilization' (optional)
 * 
 * Access: Owner, Admin, Manager
 */
router.get(
  '/:type',
  requireRole(['owner', 'admin', 'manager']),
  generateReport
);

/**
 * GET /api/reports/:type/pdf
 * Generate report as PDF file
 * 
 * Params:
 *   - type: 'executive' | 'vehicle' | 'customer'
 * 
 * Query params: Same as JSON endpoint
 * 
 * Access: Owner, Admin, Manager
 */
router.get(
  '/:type/pdf',
  requireRole(['owner', 'admin', 'manager']),
  generateReportPDF
);

/**
 * GET /api/reports/:type/excel
 * Generate report as Excel file
 * 
 * Params:
 *   - type: 'executive' | 'vehicle' | 'customer'
 * 
 * Query params: Same as JSON endpoint
 * 
 * Access: Owner, Admin, Manager
 */
router.get(
  '/:type/excel',
  requireRole(['owner', 'admin', 'manager']),
  generateReportExcel
);

module.exports = router;