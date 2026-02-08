// src/models/Contract.js (UPDATED WITH KM LIMITS & OVERAGE)
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
  
  // ============================================
  // MILEAGE TRACKING & LIMITS
  // ============================================
  start_mileage: {
    type: DataTypes.INTEGER,
    comment: 'Vehicle mileage at pickup',
  },
  end_mileage: {
    type: DataTypes.INTEGER,
    comment: 'Vehicle mileage at return',
  },
  actual_km_driven: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Calculated: end_mileage - start_mileage',
  },
  
  // Daily KM limits
  daily_km_limit: {
    type: DataTypes.INTEGER,
    defaultValue: 300,
    comment: 'Maximum km allowed per day (default: 300km/day)',
  },
  total_km_allowed: {
    type: DataTypes.INTEGER,
    comment: 'Total km allowed: daily_km_limit * total_days',
  },
  
  // Overage tracking
  km_overage: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Km driven beyond allowed limit',
  },
  overage_rate_per_km: {
    type: DataTypes.DECIMAL(5, 2),
    comment: 'Rate per km for overage (DZD)',
  },
  overage_charges: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Total charges for km overage',
  },
  
  // Legacy fields (kept for backward compatibility)
  mileage_limit: {
    type: DataTypes.INTEGER,
    comment: 'DEPRECATED: Use daily_km_limit instead',
  },
  mileage_charge_per_km: {
    type: DataTypes.DECIMAL(5, 2),
    comment: 'DEPRECATED: Use overage_rate_per_km instead',
  },
  
  // ============================================
  // EXISTING FIELDS
  // ============================================
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
  hooks: {
    beforeCreate: (contract) => {
      // Auto-calculate total km allowed
      if (contract.daily_km_limit && contract.total_days) {
        contract.total_km_allowed = contract.daily_km_limit * contract.total_days;
      }
    },
    beforeUpdate: (contract) => {
      // Recalculate if days or daily limit changed
      if (contract.changed('daily_km_limit') || contract.changed('total_days')) {
        contract.total_km_allowed = contract.daily_km_limit * contract.total_days;
      }
      
      // Calculate actual km driven and overage when mileages are set
      if (contract.end_mileage && contract.start_mileage) {
        contract.actual_km_driven = contract.end_mileage - contract.start_mileage;
        
        // Calculate overage
        if (contract.total_km_allowed) {
          contract.km_overage = Math.max(0, contract.actual_km_driven - contract.total_km_allowed);
        }
        
        // Calculate overage charges if rate is set
        if (contract.km_overage > 0 && contract.overage_rate_per_km) {
          contract.overage_charges = contract.km_overage * parseFloat(contract.overage_rate_per_km);
        }
      }
    },
  },
});

module.exports = Contract;