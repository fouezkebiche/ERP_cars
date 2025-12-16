const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contract = sequelize.define('Contract', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  contract_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
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
  customer_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'customers',
      key: 'id',
    },
    onDelete: 'RESTRICT',
  },
  vehicle_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'vehicles',
      key: 'id',
    },
    onDelete: 'RESTRICT',
  },
  created_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  actual_return_date: {
    type: DataTypes.DATE,
  },
  daily_rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  total_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  base_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  additional_charges: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  start_mileage: {
    type: DataTypes.INTEGER,
  },
  end_mileage: {
    type: DataTypes.INTEGER,
  },
  mileage_limit: {
    type: DataTypes.INTEGER,
  },
  mileage_charge_per_km: {
    type: DataTypes.DECIMAL(5, 2),
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'completed', 'cancelled', 'extended'),
    defaultValue: 'active',
  },
  extras: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  contract_pdf_url: {
    type: DataTypes.TEXT,
  },
  contract_signed_date: {
    type: DataTypes.DATE,
  },
  deposit_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  deposit_returned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  notes: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'contracts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['company_id'] },
    { fields: ['customer_id'] },
    { fields: ['vehicle_id'] },
    { fields: ['status'] },
    { fields: ['start_date', 'end_date'] },
  ],
});

module.exports = Contract;