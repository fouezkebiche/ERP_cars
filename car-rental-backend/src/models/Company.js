const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  phone: {
    type: DataTypes.STRING(50),
  },
  address: {
    type: DataTypes.TEXT,
  },
  tax_id: {
    type: DataTypes.STRING(100),
  },
  logo_url: {
    type: DataTypes.TEXT,
  },
  subscription_plan: {
    type: DataTypes.ENUM('basic', 'professional', 'enterprise'),
    defaultValue: 'basic',
  },
  subscription_status: {
    type: DataTypes.ENUM('active', 'inactive', 'trial', 'suspended'),
    defaultValue: 'trial',
  },
  subscription_start_date: {
    type: DataTypes.DATE,
  },
  subscription_end_date: {
    type: DataTypes.DATE,
  },
  trial_ends_at: {
    type: DataTypes.DATE,
  },
  monthly_recurring_revenue: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
}, {
  tableName: 'companies',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Company;