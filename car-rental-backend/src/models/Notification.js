const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Notification = sequelize.define('Notification', {
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
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'SET NULL',
    comment: 'Specific user recipient (null = all company users)',
  },
  type: {
    type: DataTypes.ENUM(
      'vehicle_limit_warning',
      'vehicle_limit_critical',
      'vehicle_limit_reached',
      'vehicle_maintenance',
      'km_limit_warning',
      'km_limit_critical',
      'km_limit_exceeded',
      'contract_overage',
      'contract_expiring',
      'payment_due',
      'system_alert',
      'general'
    ),
    allowNull: false,
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium',
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  data: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional structured data',
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  read_at: {
    type: DataTypes.DATE,
  },
  // UPDATED: New fields for reversible dismissal
  dismissed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  dismissed_at: {
    type: DataTypes.DATE,
  },
  action_url: {
    type: DataTypes.TEXT,
    comment: 'Optional URL for "Take Action" button',
  },
}, {
  tableName: 'notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['company_id'] },
    { fields: ['user_id'] },
    { fields: ['is_read'] },
    { fields: ['type'] },
    { fields: ['priority'] },
    { fields: ['created_at'] },
    // UPDATED: Index for dismissed filtering
    { fields: ['dismissed'] },
  ],
});
module.exports = Notification;