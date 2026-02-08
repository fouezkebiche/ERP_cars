const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Customer = sequelize.define('Customer', {
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
  customer_type: {
    type: DataTypes.ENUM('individual', 'corporate'),
    defaultValue: 'individual',
  },
  full_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  company_name: {
    type: DataTypes.STRING(255),
  },
  email: {
    type: DataTypes.STRING(255),
    validate: {
      isEmail: true,
    },
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
  },
  city: {
    type: DataTypes.STRING(100),
  },
  date_of_birth: {
    type: DataTypes.DATEONLY,
  },
  id_card_number: {
    type: DataTypes.STRING(50),
  },
  drivers_license_number: {
    type: DataTypes.STRING(50),
    unique: true,
  },
  license_expiry_date: {
    type: DataTypes.DATEONLY,
  },
  id_card_photo_url: {
    type: DataTypes.TEXT,
  },
  license_photo_url: {
    type: DataTypes.TEXT,
  },
  emergency_contact_name: {
    type: DataTypes.STRING(255),
  },
  emergency_contact_phone: {
    type: DataTypes.STRING(50),
  },
  notes: {
    type: DataTypes.TEXT,
  },
  is_blacklisted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  total_rentals: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  lifetime_value: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  apply_tier_discount: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
}, {
  tableName: 'customers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['company_id'],
    },
    {
      fields: ['phone'],
    },
    {
      fields: ['drivers_license_number'],
    },
  ],
});

module.exports = Customer;