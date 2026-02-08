// src/models/VehicleCost.js - Compatible with your existing index.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const VehicleCost = sequelize.define('VehicleCost', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  vehicle_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'vehicles',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  cost_type: {
    type: DataTypes.ENUM('fuel', 'maintenance', 'insurance', 'registration', 'cleaning', 'repair', 'other'),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  incurred_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  receipt_url: {
    type: DataTypes.TEXT,
  },
  created_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional metadata like service_type, parts_replaced, technician_name, etc.',
  },
}, {
  tableName: 'vehicle_costs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      fields: ['vehicle_id', 'incurred_date'],
    },
    {
      fields: ['cost_type'],
    },
  ],
});

module.exports = VehicleCost;