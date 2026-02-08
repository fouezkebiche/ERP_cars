// src/controllers/attendance.controller.js - UPDATED VERSION
const { Attendance, Employee, User, sequelize } = require('../models');
const { sendSuccess, sendError } = require('../utils/response.util');
const { body, query, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { applyTenantFilter, applyTenantData } = require('../middleware/tenantIsolation.middleware');

// ============================================
// POST /api/attendance/check-in
// Mark employee check-in
// ============================================
const checkIn = [
  body('employee_id').isUUID().withMessage('Valid employee ID required'),
  body('check_in_time').optional().isISO8601(),
  body('location').optional().isObject(),
  body('notes').optional().trim(),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, {
          statusCode: 422,
          message: 'Validation failed',
          details: errors.array(),
        });
      }

      const { employee_id, check_in_time, location, notes } = req.body;
      const today = new Date().toISOString().split('T')[0];

      // Check if already checked in today
      const existingAttendance = await Attendance.findOne({
        where: {
          employee_id,
          date: today,
        },
      });

      if (existingAttendance) {
        return sendError(res, {
          statusCode: 409,
          message: 'Already checked in for today',
        });
      }

      // Create attendance record
      const attendance = await Attendance.create(
        applyTenantData(req, {
          employee_id,
          date: today,
          check_in_time: check_in_time || new Date(),
          status: 'present',
          check_in_location: location,
          notes,
          recorded_by: req.user.id,
        })
      );

      console.log(`✅ Employee ${employee_id} checked in`);

      sendSuccess(res, {
        statusCode: 201,
        message: 'Checked in successfully',
        data: { attendance },
      });
    } catch (error) {
      console.error('💥 Check-in error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to check in',
        details: error.message,
      });
    }
  },
];

// ============================================
// POST /api/attendance/check-out
// Mark employee check-out
// ============================================
const checkOut = [
  body('employee_id').isUUID().withMessage('Valid employee ID required'),
  body('check_out_time').optional().isISO8601(),
  body('location').optional().isObject(),
  body('notes').optional().trim(),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, {
          statusCode: 422,
          message: 'Validation failed',
          details: errors.array(),
        });
      }

      const { employee_id, check_out_time, location, notes } = req.body;
      const today = new Date().toISOString().split('T')[0];

      // Find today's attendance record
      const attendance = await Attendance.findOne({
        where: {
          employee_id,
          date: today,
        },
      });

      if (!attendance) {
        return sendError(res, {
          statusCode: 404,
          message: 'No check-in record found for today',
        });
      }

      if (attendance.check_out_time) {
        return sendError(res, {
          statusCode: 409,
          message: 'Already checked out for today',
        });
      }

      // Update with check-out time
      await attendance.update({
        check_out_time: check_out_time || new Date(),
        check_out_location: location,
        notes: notes || attendance.notes,
      });

      console.log(`✅ Employee ${employee_id} checked out - ${attendance.total_hours} hours`);

      sendSuccess(res, {
        message: 'Checked out successfully',
        data: { attendance },
      });
    } catch (error) {
      console.error('💥 Check-out error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to check out',
        details: error.message,
      });
    }
  },
];

// ============================================
// POST /api/attendance/mark
// Manually mark attendance (for managers/HR)
// ============================================
const markAttendance = [
  body('employee_id').isUUID().withMessage('Valid employee ID required'),
  body('date').isISO8601().withMessage('Valid date required'),
  body('status').isIn(['present', 'absent', 'late', 'half_day', 'leave', 'holiday', 'weekend']),
  body('check_in_time').optional().isISO8601(),
  body('check_out_time').optional().isISO8601(),
  body('leave_type').optional().isIn(['sick', 'vacation', 'personal', 'unpaid', 'maternity', 'paternity']),
  body('notes').optional().trim(),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, {
          statusCode: 422,
          message: 'Validation failed',
          details: errors.array(),
        });
      }

      const { employee_id, date, status, check_in_time, check_out_time, leave_type, notes } = req.body;

      // Check if attendance already exists
      let attendance = await Attendance.findOne({
        where: {
          employee_id,
          date,
        },
      });

      if (attendance) {
        // Update existing
        await attendance.update({
          status,
          check_in_time: check_in_time || attendance.check_in_time,
          check_out_time: check_out_time || attendance.check_out_time,
          leave_type: leave_type || attendance.leave_type,
          notes: notes || attendance.notes,
          recorded_by: req.user.id,
        });
      } else {
        // Create new
        attendance = await Attendance.create(
          applyTenantData(req, {
            employee_id,
            date,
            status,
            check_in_time,
            check_out_time,
            leave_type,
            notes,
            recorded_by: req.user.id,
          })
        );
      }

      console.log(`📝 Attendance marked for ${employee_id} on ${date}: ${status}`);

      sendSuccess(res, {
        statusCode: attendance.isNewRecord ? 201 : 200,
        message: 'Attendance marked successfully',
        data: { attendance },
      });
    } catch (error) {
      console.error('💥 Mark attendance error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to mark attendance',
        details: error.message,
      });
    }
  },
];

// ============================================
// GET /api/attendance
// Get attendance records with filters
// ============================================
const getAttendance = [
  query('employee_id').optional().isUUID(),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),
  query('status').optional().isIn(['present', 'absent', 'late', 'half_day', 'leave', 'holiday', 'weekend']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, {
          statusCode: 422,
          message: 'Validation failed',
          details: errors.array(),
        });
      }

      const {
        employee_id,
        start_date,
        end_date,
        status,
        page = 1,
        limit = 20,
      } = req.query;

      const whereClause = applyTenantFilter(req);

      if (employee_id) whereClause.employee_id = employee_id;
      if (status) whereClause.status = status;

      if (start_date || end_date) {
        whereClause.date = {};
        if (start_date) whereClause.date[Op.gte] = start_date;
        if (end_date) whereClause.date[Op.lte] = end_date;
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows: attendance } = await Attendance.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['id', 'full_name', 'position', 'department'],
          },
        ],
        limit: parseInt(limit),
        offset,
        order: [['date', 'DESC']],
      });

      sendSuccess(res, {
        message: 'Attendance records fetched successfully',
        data: { attendance },
        meta: {
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            total_pages: Math.ceil(count / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      console.error('💥 Get attendance error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to fetch attendance',
        details: error.message,
      });
    }
  },
];

// ============================================
// GET /api/attendance/summary
// Get attendance summary for a period
// ============================================
const getAttendanceSummary = [
  query('employee_id').optional().isUUID(),
  query('month').optional().matches(/^\d{4}-\d{2}$/),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, {
          statusCode: 422,
          message: 'Validation failed',
          details: errors.array(),
        });
      }

      const { employee_id, month, start_date, end_date } = req.query;

      const whereClause = applyTenantFilter(req);

      if (employee_id) whereClause.employee_id = employee_id;

      // Handle month or date range
      if (month) {
        const [year, monthNum] = month.split('-');
        const startOfMonth = `${year}-${monthNum}-01`;
        const endOfMonth = new Date(year, monthNum, 0).toISOString().split('T')[0];
        whereClause.date = { [Op.between]: [startOfMonth, endOfMonth] };
      } else if (start_date || end_date) {
        whereClause.date = {};
        if (start_date) whereClause.date[Op.gte] = start_date;
        if (end_date) whereClause.date[Op.lte] = end_date;
      }

      const attendance = await Attendance.findAll({
        where: whereClause,
        attributes: [
          'employee_id',
          [sequelize.fn('COUNT', sequelize.col('id')), 'total_days'],
          [
            sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'present' OR status = 'late' THEN 1 ELSE 0 END")),
            'days_present',
          ],
          [
            sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'absent' THEN 1 ELSE 0 END")),
            'days_absent',
          ],
          [
            sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'leave' THEN 1 ELSE 0 END")),
            'days_on_leave',
          ],
          [sequelize.fn('SUM', sequelize.col('total_hours')), 'total_hours'],
          [sequelize.fn('SUM', sequelize.col('overtime_hours')), 'overtime_hours'],
        ],
        include: employee_id
          ? []
          : [
              {
                model: Employee,
                as: 'employee',
                attributes: ['id', 'full_name', 'position', 'department'],
              },
            ],
        group: ['employee_id', ...(employee_id ? [] : ['employee.id'])],
        raw: !employee_id,
      });

      sendSuccess(res, {
        message: 'Attendance summary fetched successfully',
        data: { summary: attendance },
      });
    } catch (error) {
      console.error('💥 Get attendance summary error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to fetch attendance summary',
        details: error.message,
      });
    }
  },
];

// ============================================
// GET /api/attendance/today
// Get today's attendance for all employees
// ============================================
const getTodayAttendance = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const attendance = await Attendance.findAll({
      where: {
        ...applyTenantFilter(req),
        date: today,
      },
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'full_name', 'position', 'department', 'status'],
        },
      ],
      order: [['check_in_time', 'ASC']],
    });

    // Get all active employees
    const allEmployees = await Employee.count({
      where: {
        company_id: req.companyId,
        status: 'active',
      },
    });

    const summary = {
      total_employees: allEmployees,
      checked_in: attendance.length,
      not_checked_in: allEmployees - attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      late: attendance.filter(a => a.status === 'late').length,
      on_leave: attendance.filter(a => a.status === 'leave').length,
    };

    sendSuccess(res, {
      message: "Today's attendance fetched successfully",
      data: { attendance, summary },
    });
  } catch (error) {
    console.error("💥 Get today's attendance error:", error);
    sendError(res, {
      statusCode: 500,
      message: 'Failed to fetch attendance',
      details: error.message,
    });
  }
};

module.exports = {
  checkIn,
  checkOut,
  markAttendance,
  getAttendance,
  getAttendanceSummary,
  getTodayAttendance,
};