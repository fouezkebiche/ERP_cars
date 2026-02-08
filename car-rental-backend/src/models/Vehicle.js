// src/models/Vehicle.js - Compatible with your existing index.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vehicle = sequelize.define('Vehicle', {
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
  brand: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  model: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  registration_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  vin: {
    type: DataTypes.STRING(17),
    unique: true,
  },
  color: {
    type: DataTypes.STRING(50),
  },
  transmission: {
    type: DataTypes.ENUM('manual', 'automatic'),
    defaultValue: 'manual',
  },
  fuel_type: {
    type: DataTypes.ENUM('petrol', 'diesel', 'electric', 'hybrid'),
    defaultValue: 'petrol',
  },
  seats: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
  },
  daily_rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('available', 'rented', 'maintenance', 'retired'),
    defaultValue: 'available',
  },
  
  // ============================================
  // MILEAGE TRACKING FIELDS
  // ============================================
  mileage: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Current total mileage in kilometers',
  },
  last_maintenance_mileage: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Mileage at last maintenance',
  },
  next_maintenance_mileage: {
    type: DataTypes.INTEGER,
    comment: 'Mileage when next maintenance is due',
  },
  maintenance_interval_km: {
    type: DataTypes.INTEGER,
    defaultValue: 5000,
    comment: 'Maintenance interval in km (default: 5000km)',
  },
  
  // ============================================
  // MAINTENANCE ALERTS
  // ============================================
  maintenance_alert_threshold: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    comment: 'Send alert every X km (default: 100km)',
  },
  last_maintenance_alert_mileage: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Last mileage when alert was sent',
  },
  last_maintenance_date: {
    type: DataTypes.DATEONLY,
    comment: 'Date of last maintenance service',
  },
  next_maintenance_date: {
    type: DataTypes.DATEONLY,
    comment: 'Scheduled date for next maintenance',
  },
  
  // ============================================
  // MAINTENANCE HISTORY SUMMARY
  // ============================================
  total_maintenance_costs: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: 'Lifetime maintenance costs',
  },
  maintenance_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of maintenance services performed',
  },
  last_oil_change_mileage: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  last_oil_change_date: {
    type: DataTypes.DATEONLY,
  },
  
  // ============================================
  // EXISTING FIELDS
  // ============================================
  purchase_price: {
    type: DataTypes.DECIMAL(12, 2),
  },
  purchase_date: {
    type: DataTypes.DATEONLY,
  },
  photos: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  features: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  notes: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'vehicles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['company_id'] },
    { fields: ['status'] },
    { fields: ['mileage'] },
    { fields: ['next_maintenance_mileage'] },
  ],
  hooks: {
    // Auto-calculate next maintenance when vehicle is created/updated
    beforeSave: async (vehicle) => {
      if (vehicle.changed('mileage') || vehicle.changed('last_maintenance_mileage')) {
        if (!vehicle.next_maintenance_mileage || vehicle.mileage > vehicle.next_maintenance_mileage) {
          vehicle.next_maintenance_mileage = 
            vehicle.last_maintenance_mileage + vehicle.maintenance_interval_km;
        }
      }
    },
  },
});

module.exports = Vehicle;