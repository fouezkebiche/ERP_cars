// src/models/Payroll.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payroll = sequelize.define('Payroll', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  company_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'companies',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  employee_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'employees',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  pay_period_start: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  pay_period_end: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  payment_date: {
    type: DataTypes.DATEONLY,
  },
  base_salary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  gross_salary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  net_salary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  total_days_in_period: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  days_present: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  days_absent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  days_on_leave: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  total_hours_worked: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0,
  },
  overtime_hours: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0,
  },
  earnings: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  deductions: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  payment_method: {
    type: DataTypes.ENUM('bank_transfer', 'cash', 'check'),
  },
  payment_reference: {
    type: DataTypes.STRING(100),
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'approved', 'paid', 'cancelled'),
    defaultValue: 'pending',
  },
  calculated_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  approved_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  paid_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  notes: {
    type: DataTypes.TEXT,
  },
  payslip_url: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'payroll',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['company_id'] },
    { fields: ['employee_id'] },
    { fields: ['pay_period_start', 'pay_period_end'] },
    { fields: ['payment_status'] },
    { unique: true, fields: ['employee_id', 'pay_period_start', 'pay_period_end'] },
  ],
});

// ============================================
// Leave Request Model
// ============================================
const LeaveRequest = sequelize.define('LeaveRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  company_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'companies',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  employee_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'employees',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  leave_type: {
    type: DataTypes.ENUM(
      'sick',
      'vacation',
      'personal',
      'unpaid',
      'maternity',
      'paternity',
      'emergency'
    ),
    allowNull: false,
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  total_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
    defaultValue: 'pending',
  },
  requested_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  reviewed_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  review_notes: {
    type: DataTypes.TEXT,
  },
  review_date: {
    type: DataTypes.DATE,
  },
  attachment_urls: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
}, {
  tableName: 'leave_requests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['company_id'] },
    { fields: ['employee_id'] },
    { fields: ['status'] },
    { fields: ['start_date', 'end_date'] },
  ],
});

// ============================================
// Leave Balance Model
// ============================================
const LeaveBalance = sequelize.define('LeaveBalance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  company_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'companies',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  employee_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'employees',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  leave_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  total_allocated: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  used: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  pending: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'leave_balances',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['company_id'] },
    { fields: ['employee_id'] },
    { unique: true, fields: ['employee_id', 'leave_type', 'year'] },
  ],
});

module.exports = {
  Payroll,
  LeaveRequest,
  LeaveBalance,
};