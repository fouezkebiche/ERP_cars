// src/models/Attendance.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Attendance model
 * NOTE: This model is aligned with the SQL migration in
 * `migrations/attendance-payroll-migration.sql`
 */
const Attendance = sequelize.define('Attendance', {
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
  // Date of attendance
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  // We store full timestamp in DB, map as DATE to keep it simple
  check_in_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Clock in time',
  },
  check_out_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Clock out time',
  },
  status: {
    type: DataTypes.STRING, // matches VARCHAR(50) in SQL
    allowNull: false,
    defaultValue: 'present',
    comment: "present, absent, late, half_day, leave, holiday, weekend",
  },
  // Leave details
  leave_type: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Type of leave if status is leave',
  },
  leave_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  leave_approved_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  // Working hours
  total_hours: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    comment: 'Total hours worked',
  },
  overtime_hours: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Overtime hours',
  },
  break_hours: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    defaultValue: 0,
  },
  // Location tracking
  check_in_location: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  check_out_location: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  // Notes and approval
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  recorded_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'User who recorded attendance',
  },
  approved_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'Manager who approved special cases',
  },
}, {
  tableName: 'attendance',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['company_id'] },
    { fields: ['employee_id'] },
    { fields: ['date'] },
    { unique: true, fields: ['employee_id', 'date'] }, // One record per employee per day
  ],
});

module.exports = Attendance;

