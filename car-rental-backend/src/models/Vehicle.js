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
  mileage: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
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
  ],
});

module.exports = Vehicle;