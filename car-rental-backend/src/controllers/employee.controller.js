// src/controllers/employee.controller.js
const { Employee, User, Contract, sequelize } = require('../models');
const { sendSuccess, sendError } = require('../utils/response.util');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { applyTenantFilter, applyTenantData } = require('../middleware/tenantIsolation.middleware');
const { hashPassword } = require('../utils/bcrypt.util');

// RBAC: Role definitions with permissions
const ROLES = {
  owner: {
    label: 'Owner',
    description: 'Full system access including billing',
    permissions: ['*'], // All permissions
  },
  admin: {
    label: 'Administrator',
    description: 'Nearly full access, manages employees and settings',
    permissions: [
      'view_dashboard',
      'view_analytics',
      'create_employees',
      'update_employees',
      'delete_employees',
      'view_employees',
      'create_vehicles',
      'update_vehicles',
      'delete_vehicles',
      'view_vehicles',
      'create_customers',
      'update_customers',
      'delete_customers',
      'view_customers',
      'create_contracts',
      'update_contracts',
      'cancel_contracts',
      'view_contracts',
      'create_payments',
      'update_payments',
      'view_payments',
      'manage_settings',
    ],
  },
  manager: {
    label: 'Manager',
    description: 'Operational control, views analytics',
    permissions: [
      'view_dashboard',
      'view_analytics',
      'view_employees',
      'create_vehicles',
      'update_vehicles',
      'view_vehicles',
      'create_customers',
      'update_customers',
      'view_customers',
      'create_contracts',
      'update_contracts',
      'complete_contracts',
      'view_contracts',
      'create_payments',
      'view_payments',
    ],
  },
  sales_agent: {
    label: 'Sales Agent',
    description: 'Creates contracts, manages customers, processes payments',
    permissions: [
      'view_dashboard',
      'create_customers',
      'update_customers',
      'view_customers',
      'create_contracts',
      'update_contracts',
      'view_contracts',
      'create_payments',
      'view_payments',
      'view_vehicles', // Read-only for booking
    ],
  },
  fleet_coordinator: {
    label: 'Fleet Coordinator',
    description: 'Manages vehicles and maintenance',
    permissions: [
      'view_dashboard',
      'create_vehicles',
      'update_vehicles',
      'view_vehicles',
      'add_vehicle_costs',
      'view_vehicle_costs',
      'view_contracts', // Read-only for scheduling
    ],
  },
  accountant: {
    label: 'Accountant',
    description: 'Financial operations and analytics',
    permissions: [
      'view_dashboard',
      'view_analytics',
      'view_payments',
      'create_payments',
      'update_payments',
      'view_contracts', // Read-only
      'view_customers', // Read-only
      'view_attendance',
      'manage_payroll',
      'view_payroll',
      'approve_payroll',
    ],
  },
  receptionist: {
    label: 'Receptionist',
    description: 'Basic operations: check-in/out, contracts, payments',
    permissions: [
      'view_dashboard',
      'view_customers',
      'create_customers',
      'create_contracts',
      'view_contracts',
      'create_payments',
      'view_payments',
      'view_vehicles', // Read-only
      'create_attendance',
      'view_attendance',
    ],
  },
  staff: {  // Legacy
    label: 'Staff',
    description: 'General staff access',
    permissions: ['view_dashboard', 'view_customers', 'view_vehicles'],
  },
  viewer: {  // Legacy
    label: 'Viewer',
    description: 'Read-only access',
    permissions: ['view_dashboard'],
  },
};

// ============================================
// HELPER: Check if user has permission
// ============================================
const hasPermission = (employee, requiredPermission) => {
  // Get role permissions
  const rolePermissions = ROLES[employee.role]?.permissions || [];
  
  // Owner has all permissions
  if (rolePermissions.includes('*')) return true;
  
  // Check role permissions
  if (rolePermissions.includes(requiredPermission)) return true;
  
  // Check custom permissions
  if (employee.custom_permissions?.[requiredPermission] === true) return true;
  
  return false;
};

// ============================================
// GET /api/employees/roles - Get available roles
// ============================================
const getAvailableRoles = async (req, res) => {
  try {
    const roles = Object.entries(ROLES).map(([value, config]) => ({
      value,
      label: config.label,
      description: config.description,
      permissions: config.permissions,
    }));

    sendSuccess(res, {
      message: 'Available roles fetched successfully',
      data: { roles },
    });
  } catch (error) {
    console.error('💥 Get roles error:', error);
    sendError(res, {
      statusCode: 500,
      message: 'Failed to fetch roles',
      details: error.message,
    });
  }
};

// ============================================
// GET /api/employees - List all employees
// ============================================
const getAllEmployees = async (req, res) => {
  try {
    const {
      status,
      role,
      department,
      search,
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = req.query;

    const whereClause = applyTenantFilter(req);

    if (status) whereClause.status = status;
    if (role) whereClause.role = role;
    if (department) whereClause.department = department;

    // Search by name, email, phone, position
    if (search) {
      whereClause[Op.or] = [
        { full_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { position: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: employees } = await Employee.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'is_active', 'last_login_at'],
        },
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [[sort_by, sort_order.toUpperCase()]],
    });

    console.log(`👥 Fetched ${employees.length} employees for company ${req.companyId}`);

    sendSuccess(res, {
      message: 'Employees fetched successfully',
      data: { employees },
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
    console.error('💥 Get employees error:', error);
    sendError(res, {
      statusCode: 500,
      message: 'Failed to fetch employees',
      details: error.message,
    });
  }
};

// ============================================
// GET /api/employees/:id - Get single employee
// ============================================
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findOne({
      where: applyTenantFilter(req, { id }),
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'role', 'is_active', 'last_login_at'],
        },
        {
          model: Contract,
          as: 'created_contracts',
          attributes: ['id', 'contract_number', 'total_amount', 'status'],
          limit: 10,
          order: [['created_at', 'DESC']],
        },
      ],
    });

    if (!employee) {
      return sendError(res, {
        statusCode: 404,
        message: 'Employee not found',
      });
    }

    console.log(`👤 Employee fetched: ${employee.full_name}`);

    sendSuccess(res, {
      message: 'Employee fetched successfully',
      data: { employee },
    });
  } catch (error) {
    console.error('💥 Get employee error:', error);
    sendError(res, {
      statusCode: 500,
      message: 'Failed to fetch employee',
      details: error.message,
    });
  }
};

// ============================================
// POST /api/employees - Create employee
// ============================================
const createEmployee = [
  // Validators
  body('full_name').notEmpty().withMessage('Full name is required').trim(),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('phone').notEmpty().withMessage('Phone is required').trim(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('role')
    .isIn(Object.keys(ROLES))
    .withMessage(`Role must be one of: ${Object.keys(ROLES).join(', ')}`),
  body('department')
    .optional()
    .isIn(['management', 'sales', 'fleet', 'finance', 'customer_service', 'operations']),
  body('position').optional().trim(),
  body('salary_type')
    .optional()
    .isIn(['hourly', 'monthly', 'commission', 'fixed_plus_commission']),
  body('salary').optional().isFloat({ min: 0 }),
  body('commission_rate').optional().isFloat({ min: 0, max: 100 }),
  body('hire_date').isISO8601().withMessage('Valid hire date required'),
  body('work_schedule').optional().isObject(),
  body('custom_permissions').optional().isObject(),

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
      console.log('📝 Create request body:', req.body);
      console.log('👤 Requester role:', req.user.role);
      console.log('🏢 Company ID:', req.companyId);

      const { email, password, role, ...employeeData } = req.body;

      // Check if email already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        await transaction.rollback();
        return sendError(res, {
          statusCode: 409,
          message: 'Email already in use',
        });
      }

      // Only owner/admin can create employees
      if (!['owner', 'admin'].includes(req.user.role)) {
        await transaction.rollback();
        return sendError(res, {
          statusCode: 403,
          message: 'Only owners and admins can create employees',
        });
      }

      // Create User account first
      const user = await User.create(
        {
          company_id: req.companyId,
          full_name: employeeData.full_name,
          email,
          password, // Model hook will hash this
          role, // User role matches employee role
          is_active: true,
        },
        { transaction }
      );

      // Create Employee profile
      const employee = await Employee.create(
        applyTenantData(req, {
          ...employeeData,
          email,
          role,
          user_id: user.id,
          status: 'active',
          custom_permissions: employeeData.custom_permissions || {},
          work_schedule: employeeData.work_schedule || {
            monday: { start: '09:00', end: '17:00' },
            tuesday: { start: '09:00', end: '17:00' },
            wednesday: { start: '09:00', end: '17:00' },
            thursday: { start: '09:00', end: '17:00' },
            friday: { start: '09:00', end: '17:00' },
          },
        }),
        { transaction }
      );

      await transaction.commit();

      // Fetch with relations
      const fullEmployee = await Employee.findByPk(employee.id, {
        include: [{ model: User, as: 'user', attributes: ['id', 'email', 'role'] }],
      });

      console.log(`👤 New employee created: ${employee.full_name} (${role})`);

      sendSuccess(res, {
        statusCode: 201,
        message: 'Employee created successfully',
        data: {
          employee: fullEmployee,
          login_credentials: {
            email,
            temporary_password: '(sent to employee email)', // In production, send via email
          },
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error('💥 Create employee error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to create employee',
        details: error.message,
      });
    }
  },
];

// ============================================
// PUT /api/employees/:id - Update employee
// ============================================
const updateEmployee = [
  body('full_name').optional().notEmpty().trim(),
  body('phone').optional().notEmpty().trim(),
  body('position').optional().trim(),
  body('department').optional().isIn(['management', 'sales', 'fleet', 'finance', 'customer_service', 'operations']),
  body('salary').optional().isFloat({ min: 0 }),
  body('commission_rate').optional().isFloat({ min: 0, max: 100 }),
  body('status').optional().isIn(['active', 'on_leave', 'suspended', 'terminated']),
  body('custom_permissions').optional().isObject(),
  body('work_schedule').optional().isObject(),

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

      const employee = await Employee.findOne({
        where: applyTenantFilter(req, { id }),
      });

      if (!employee) {
        return sendError(res, { statusCode: 404, message: 'Employee not found' });
      }

      // Only owner/admin can update employees
      if (!['owner', 'admin'].includes(req.user.role)) {
        return sendError(res, {
          statusCode: 403,
          message: 'Only owners and admins can update employees',
        });
      }

      await employee.update(req.body);

      console.log(`🔄 Employee updated: ${employee.full_name}`);

      sendSuccess(res, {
        message: 'Employee updated successfully',
        data: { employee },
      });
    } catch (error) {
      console.error('💥 Update employee error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to update employee',
        details: error.message,
      });
    }
  },
];

// ============================================
// DELETE /api/employees/:id - Terminate employee
// ============================================
const terminateEmployee = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    const employee = await Employee.findOne({
      where: applyTenantFilter(req, { id }),
      include: [{ model: User, as: 'user' }],
    });

    if (!employee) {
      await transaction.rollback();
      return sendError(res, { statusCode: 404, message: 'Employee not found' });
    }

    // Only owner can terminate
    if (req.user.role !== 'owner') {
      await transaction.rollback();
      return sendError(res, {
        statusCode: 403,
        message: 'Only owners can terminate employees',
      });
    }

    // Cannot terminate owner
    if (employee.role === 'owner') {
      await transaction.rollback();
      return sendError(res, {
        statusCode: 403,
        message: 'Cannot terminate owner account',
      });
    }

    // Soft delete: Update status
    await employee.update(
      {
        status: 'terminated',
        termination_date: new Date(),
      },
      { transaction }
    );

    // Deactivate user account
    if (employee.user) {
      await employee.user.update({ is_active: false }, { transaction });
    }

    await transaction.commit();

    console.log(`🗑️ Employee terminated: ${employee.full_name}`);

    sendSuccess(res, {
      message: 'Employee terminated successfully',
      data: { employee },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('💥 Terminate employee error:', error);
    sendError(res, {
      statusCode: 500,
      message: 'Failed to terminate employee',
      details: error.message,
    });
  }
};

// ============================================
// POST /api/employees/:id/reset-password
// ============================================
const resetEmployeePassword = [
  body('new_password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),

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
      const { new_password } = req.body;

      const employee = await Employee.findOne({
        where: applyTenantFilter(req, { id }),
        include: [{ model: User, as: 'user' }],
      });

      if (!employee || !employee.user) {
        return sendError(res, { statusCode: 404, message: 'Employee not found' });
      }

      // Only owner/admin can reset passwords
      if (!['owner', 'admin'].includes(req.user.role)) {
        return sendError(res, {
          statusCode: 403,
          message: 'Only owners and admins can reset passwords',
        });
      }

      // Hash and update password
      const passwordHash = await hashPassword(new_password);
      await employee.user.update({ password_hash: passwordHash });

      console.log(`🔑 Password reset for employee: ${employee.full_name}`);

      sendSuccess(res, {
        message: 'Password reset successfully',
      });
    } catch (error) {
      console.error('💥 Reset password error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to reset password',
        details: error.message,
      });
    }
  },
];

// ============================================
// GET /api/employees/stats - Get statistics
// ============================================
const getEmployeeStats = async (req, res) => {
  try {
    const companyFilter = { company_id: req.companyId };

    const totalEmployees = await Employee.count({ where: companyFilter });

    // By status
    const active = await Employee.count({ where: { ...companyFilter, status: 'active' } });
    const on_leave = await Employee.count({ where: { ...companyFilter, status: 'on_leave' } });
    const terminated = await Employee.count({ where: { ...companyFilter, status: 'terminated' } });

    // By role
    const byRole = await Employee.findAll({
      where: companyFilter,
      attributes: ['role', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['role'],
      raw: true,
    });

    // Top performers
    const topPerformers = await Employee.findAll({
      where: { ...companyFilter, status: 'active' },
      order: [['total_revenue_generated', 'DESC']],
      limit: 5,
      attributes: ['id', 'full_name', 'role', 'total_contracts_created', 'total_revenue_generated'],
    });

    const stats = {
      total_employees: totalEmployees,
      by_status: { active, on_leave, terminated },
      by_role: byRole.reduce((acc, item) => {
        acc[item.role] = parseInt(item.count);
        return acc;
      }, {}),
      top_performers: topPerformers,
    };

    sendSuccess(res, {
      message: 'Employee statistics fetched successfully',
      data: { stats },
    });
  } catch (error) {
    console.error('💥 Get employee stats error:', error);
    sendError(res, {
      statusCode: 500,
      message: 'Failed to fetch employee statistics',
      details: error.message,
    });
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  terminateEmployee,
  resetEmployeePassword,
  getEmployeeStats,
  getAvailableRoles,
  hasPermission, // Export for use in permission middleware
  ROLES, // Export for reference
};