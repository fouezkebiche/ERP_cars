// src/models/PlatformSettings.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Single-row table to store platform-wide (superadmin) settings
// Shape: { id: 1, settings: { ...arbitrary JSON... } }

const PlatformSettings = sequelize.define(
  'PlatformSettings',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    settings: {
      type: DataTypes.JSONB, // Postgres JSONB; falls back to JSON on other dialects
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    tableName: 'platform_settings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = PlatformSettings;

