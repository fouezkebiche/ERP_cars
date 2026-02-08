// src/routes/attendance.routes.js
const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  markAttendance,
  getAttendance,
  getAttendanceSummary,
  getTodayAttendance,
} = require('../controllers/attendance.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/permissions.middleware');
const { injectCompanyId } = require('../middleware/tenantIsolation.middleware');

// Apply authentication and tenant isolation to ALL routes
router.use(authenticateToken);
router.use(injectCompanyId);

// ============================================
// ATTENDANCE ROUTES
// ============================================

/**
 * GET /api/attendance/today
 * Get today's attendance for all employees
 * Access: All authenticated users
 */
router.get('/today', getTodayAttendance);

/**
 * GET /api/attendance/summary
 * Get attendance summary for a period
 * Query params:
 *   - employee_id: UUID (optional)
 *   - month: YYYY-MM (optional)
 *   - start_date: ISO date (optional)
 *   - end_date: ISO date (optional)
 * Access: Owner, Admin, Manager, Receptionist
 */
router.get('/summary', requireRole(['owner', 'admin', 'manager', 'receptionist']), getAttendanceSummary);

/**
 * GET /api/attendance
 * Get attendance records with filters
 * Query params:
 *   - employee_id: UUID (optional)
 *   - start_date: ISO date (optional)
 *   - end_date: ISO date (optional)
 *   - status: Attendance status (optional)
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 20)
 * Access: All authenticated users
 */
router.get('/', getAttendance);

/**
 * POST /api/attendance/check-in
 * Mark employee check-in
 * Body:
 *   - employee_id: UUID
 *   - check_in_time: ISO timestamp (optional, defaults to now)
 *   - location: Object {lat, lng, address} (optional)
 *   - notes: String (optional)
 * Access: Receptionist, Manager, Admin, Owner
 */
router.post('/check-in', requireRole(['owner', 'admin', 'manager', 'receptionist']), checkIn);

/**
 * POST /api/attendance/check-out
 * Mark employee check-out
 * Body:
 *   - employee_id: UUID
 *   - check_out_time: ISO timestamp (optional, defaults to now)
 *   - location: Object {lat, lng, address} (optional)
 *   - notes: String (optional)
 * Access: Receptionist, Manager, Admin, Owner
 */
router.post('/check-out', requireRole(['owner', 'admin', 'manager', 'receptionist']), checkOut);

/**
 * POST /api/attendance/mark
 * Manually mark attendance (for historical records or corrections)
 * Body:
 *   - employee_id: UUID
 *   - date: ISO date
 *   - status: Attendance status
 *   - check_in_time: ISO timestamp (optional)
 *   - check_out_time: ISO timestamp (optional)
 *   - leave_type: String (optional, required if status is 'leave')
 *   - notes: String (optional)
 * Access: Owner, Admin, Manager, Receptionist
 */
router.post('/mark', requireRole(['owner', 'admin', 'manager', 'receptionist']), markAttendance);

module.exports = router;