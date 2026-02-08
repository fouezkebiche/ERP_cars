// src/controllers/payroll.controller.js
const { Payroll, Employee, Attendance, User, sequelize } = require('../models');
const { sendSuccess, sendError } = require('../utils/response.util');
const { body, query, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { applyTenantFilter, applyTenantData } = require('../middleware/tenantIsolation.middleware');

// ============================================
// POST /api/payroll/calculate
// Calculate payroll for an employee for a period
// ============================================
const calculatePayroll = [
  body('employee_id').isUUID().withMessage('Valid employee ID required'),
  body('pay_period_start').isISO8601().withMessage('Valid start date required'),
  body('pay_period_end').isISO8601().withMessage('Valid end date required'),
  body('payment_date').optional().isISO8601(),

  async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await transaction.rollback();
        return sendError(res, {
          statusCode: 422,
          message: 'Validation failed',
          details: errors.array(),
        });
      }

      const { employee_id, pay_period_start, pay_period_end, payment_date } = req.body;

      // Get employee
      const employee = await Employee.findOne({
        where: applyTenantFilter(req, { id: employee_id }),
      });

      if (!employee) {
        await transaction.rollback();
        return sendError(res, { statusCode: 404, message: 'Employee not found' });
      }

      // Check if payroll already exists
      const existingPayroll = await Payroll.findOne({
        where: {
          employee_id,
          pay_period_start,
          pay_period_end,
        },
      });

      if (existingPayroll) {
        await transaction.rollback();
        return sendError(res, {
          statusCode: 409,
          message: 'Payroll already exists for this period',
        });
      }

      // Calculate period days
      const startDate = new Date(pay_period_start);
      const endDate = new Date(pay_period_end);
      const totalDaysInPeriod = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

      // Get attendance records
      const attendanceRecords = await Attendance.findAll({
        where: {
          employee_id,
          date: {
            [Op.between]: [pay_period_start, pay_period_end],
          },
        },
      });

      // Calculate attendance metrics
      const daysPresent = attendanceRecords.filter(a => ['present', 'late', 'half_day'].includes(a.status)).length;
      const daysAbsent = attendanceRecords.filter(a => a.status === 'absent').length;
      const daysOnLeave = attendanceRecords.filter(a => a.status === 'leave').length;
      const totalHoursWorked = attendanceRecords.reduce((sum, a) => sum + parseFloat(a.total_hours || 0), 0);
      const overtimeHours = attendanceRecords.reduce((sum, a) => sum + parseFloat(a.overtime_hours || 0), 0);

      // Calculate salary
      const baseSalary = parseFloat(employee.salary || 0);
      let calculatedSalary = baseSalary;

      // Adjust for attendance if monthly salary
      if (employee.salary_type === 'monthly' && daysAbsent > 0) {
        const perDayRate = baseSalary / totalDaysInPeriod;
        calculatedSalary = baseSalary - (perDayRate * daysAbsent);
      }

      // Earnings breakdown
      const earnings = {
        basic_pay: calculatedSalary,
        overtime_pay: overtimeHours * (baseSalary / (totalDaysInPeriod * 8)) * 1.5, // 1.5x for overtime
      };

      // Add commission if applicable
      if (employee.salary_type === 'commission' || employee.salary_type === 'fixed_plus_commission') {
        const commissionRate = parseFloat(employee.commission_rate || 0);
        const revenueGenerated = parseFloat(employee.total_revenue_generated || 0);
        earnings.commission = (revenueGenerated * commissionRate) / 100;
      }

      const grossSalary = Object.values(earnings).reduce((sum, val) => sum + val, 0);

      // Deductions (example: 9% social security, 20% income tax)
      const deductions = {
        social_security: grossSalary * 0.09,
        income_tax: grossSalary * 0.20,
        unpaid_leave_deduction: (baseSalary / totalDaysInPeriod) * daysAbsent,
      };

      const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + val, 0);
      const netSalary = grossSalary - totalDeductions;

      // Create payroll
      const payroll = await Payroll.create(
        applyTenantData(req, {
          employee_id,
          pay_period_start,
          pay_period_end,
          payment_date: payment_date || null,
          base_salary: baseSalary,
          gross_salary: grossSalary,
          net_salary: netSalary,
          total_days_in_period: totalDaysInPeriod,
          days_present: daysPresent,
          days_absent: daysAbsent,
          days_on_leave: daysOnLeave,
          total_hours_worked: totalHoursWorked,
          overtime_hours: overtimeHours,
          earnings,
          deductions,
          payment_status: 'pending',
          calculated_by: req.user.id,
        }),
        { transaction }
      );

      await transaction.commit();

      console.log(`💰 Payroll calculated for ${employee.full_name}: ${netSalary} DZD`);

      sendSuccess(res, {
        statusCode: 201,
        message: 'Payroll calculated successfully',
        data: { payroll },
      });
    } catch (error) {
      await transaction.rollback();
      console.error('💥 Calculate payroll error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to calculate payroll',
        details: error.message,
      });
    }
  },
];

// ============================================
// GET /api/payroll
// Get payroll records with filters
// ============================================
const getPayroll = [
  query('employee_id').optional().isUUID(),
  query('month').optional().matches(/^\d{4}-\d{2}$/),
  query('status').optional().isIn(['pending', 'approved', 'paid', 'cancelled']),
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

      const { employee_id, month, status, page = 1, limit = 20 } = req.query;

      const whereClause = applyTenantFilter(req);

      if (employee_id) whereClause.employee_id = employee_id;
      if (status) whereClause.payment_status = status;

      if (month) {
        const [year, monthNum] = month.split('-');
        whereClause.pay_period_start = {
          [Op.gte]: `${year}-${monthNum}-01`,
          [Op.lt]: `${year}-${String(parseInt(monthNum) + 1).padStart(2, '0')}-01`,
        };
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows: payroll } = await Payroll.findAndCountAll({
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
        order: [['pay_period_end', 'DESC']],
      });

      sendSuccess(res, {
        message: 'Payroll records fetched successfully',
        data: { payroll },
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
      console.error('💥 Get payroll error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to fetch payroll',
        details: error.message,
      });
    }
  },
];

// ============================================
// PUT /api/payroll/:id/approve
// Approve payroll
// ============================================
const approvePayroll = async (req, res) => {
  try {
    const { id } = req.params;

    const payroll = await Payroll.findOne({
      where: applyTenantFilter(req, { id }),
    });

    if (!payroll) {
      return sendError(res, { statusCode: 404, message: 'Payroll not found' });
    }

    if (payroll.payment_status !== 'pending') {
      return sendError(res, {
        statusCode: 409,
        message: `Cannot approve ${payroll.payment_status} payroll`,
      });
    }

    await payroll.update({
      payment_status: 'approved',
      approved_by: req.user.id,
    });

    console.log(`✅ Payroll approved: ${payroll.id}`);

    sendSuccess(res, {
      message: 'Payroll approved successfully',
      data: { payroll },
    });
  } catch (error) {
    console.error('💥 Approve payroll error:', error);
    sendError(res, {
      statusCode: 500,
      message: 'Failed to approve payroll',
      details: error.message,
    });
  }
};

// ============================================
// PUT /api/payroll/:id/pay
// Mark payroll as paid
// ============================================
const markAsPaid = [
  body('payment_date').isISO8601().withMessage('Valid payment date required'),
  body('payment_method').isIn(['bank_transfer', 'cash', 'check']),
  body('payment_reference').optional().trim(),

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

      const { id } = req.params;
      const { payment_date, payment_method, payment_reference } = req.body;

      const payroll = await Payroll.findOne({
        where: applyTenantFilter(req, { id }),
      });

      if (!payroll) {
        return sendError(res, { statusCode: 404, message: 'Payroll not found' });
      }

      if (payroll.payment_status !== 'approved') {
        return sendError(res, {
          statusCode: 409,
          message: 'Payroll must be approved before marking as paid',
        });
      }

      await payroll.update({
        payment_status: 'paid',
        payment_date,
        payment_method,
        payment_reference,
        paid_by: req.user.id,
      });

      console.log(`✅ Payroll marked as paid: ${payroll.id}`);

      sendSuccess(res, {
        message: 'Payroll marked as paid successfully',
        data: { payroll },
      });
    } catch (error) {
      console.error('💥 Mark as paid error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to mark payroll as paid',
        details: error.message,
      });
    }
  },
];

// ============================================
// GET /api/payroll/stats
// Get payroll statistics
// ============================================
const getPayrollStats = [
  query('month').optional().matches(/^\d{4}-\d{2}$/),

  async (req, res) => {
    try {
      const { month } = req.query;

      const whereClause = applyTenantFilter(req);

      if (month) {
        const [year, monthNum] = month.split('-');
        whereClause.pay_period_start = {
          [Op.gte]: `${year}-${monthNum}-01`,
          [Op.lt]: `${year}-${String(parseInt(monthNum) + 1).padStart(2, '0')}-01`,
        };
      }

      const stats = await Payroll.findOne({
        where: whereClause,
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'total_payrolls'],
          [sequelize.fn('SUM', sequelize.col('gross_salary')), 'total_gross'],
          [sequelize.fn('SUM', sequelize.col('net_salary')), 'total_net'],
        ],
        raw: true,
      });

      const byStatus = await Payroll.findAll({
        where: whereClause,
        attributes: [
          'payment_status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('net_salary')), 'amount'],
        ],
        group: ['payment_status'],
        raw: true,
      });

      sendSuccess(res, {
        message: 'Payroll statistics fetched successfully',
        data: {
          stats,
          by_status: byStatus,
        },
      });
    } catch (error) {
      console.error('💥 Get payroll stats error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to fetch payroll statistics',
        details: error.message,
      });
    }
  },
];

module.exports = {
  calculatePayroll,
  getPayroll,
  approvePayroll,
  markAsPaid,
  getPayrollStats,
};