// src/models/Employee.js (ENHANCED VERSION)
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Employee = sequelize.define('Employee', {
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
  user_id: {
    type: DataTypes.UUID,
    unique: true,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  full_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  position: {
    type: DataTypes.STRING(100),
  },
  department: {
    type: DataTypes.ENUM(
      'management',
      'sales',
      'fleet',
      'finance',
      'customer_service',
      'operations'
    ),
    defaultValue: 'operations',
  },
  // Role determines system permissions
  role: {
    type: DataTypes.ENUM(
      'owner',
      'admin',
      'manager',
      'sales_agent',
      'fleet_coordinator',
      'accountant',
      'receptionist'
    ),
    allowNull: false,
    defaultValue: 'receptionist',
  },
  salary_type: {
    type: DataTypes.ENUM('hourly', 'monthly', 'commission', 'fixed_plus_commission'),
    defaultValue: 'monthly',
  },
  salary: {
    type: DataTypes.DECIMAL(10, 2),
  },
  commission_rate: {
    type: DataTypes.DECIMAL(5, 2),
    comment: 'Percentage (e.g., 5.00 for 5%)',
  },
  hire_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  termination_date: {
    type: DataTypes.DATEONLY,
  },
  status: {
    type: DataTypes.ENUM('active', 'on_leave', 'suspended', 'terminated'),
    defaultValue: 'active',
  },
  id_card_number: {
    type: DataTypes.STRING(50),
  },
  address: {
    type: DataTypes.TEXT,
  },
  emergency_contact_name: {
    type: DataTypes.STRING(255),
  },
  emergency_contact_phone: {
    type: DataTypes.STRING(50),
  },
  // Permissions - custom overrides beyond role defaults
  custom_permissions: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Override specific permissions: { "can_delete_vehicles": true }',
  },
  // Work schedule
  work_schedule: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Weekly schedule: { "monday": { "start": "09:00", "end": "17:00" } }',
  },
  notes: {
    type: DataTypes.TEXT,
  },
  avatar_url: {
    type: DataTypes.TEXT,
  },
  // Performance tracking
  total_contracts_created: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  total_revenue_generated: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
}, {
  tableName: 'employees',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['company_id'] },
    { fields: ['status'] },
    { fields: ['role'] },
    { fields: ['email'] },
  ],
});

module.exports = Employee;