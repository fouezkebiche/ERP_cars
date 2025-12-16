const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
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
  full_name: {
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
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  // Virtual field for setting password
  password: {
    type: DataTypes.VIRTUAL,
    set(value) {
      // Store the plain password temporarily
      this.setDataValue('password', value);
      // Hash it and set password_hash
      const hash = bcrypt.hashSync(value, 10);
      this.setDataValue('password_hash', hash);
    },
  },
  phone: {
    type: DataTypes.STRING(50),
  },
  avatar_url: {
    type: DataTypes.TEXT,
  },
  role: {
    type: DataTypes.ENUM('owner', 'admin', 'manager', 'staff', 'viewer'),
    defaultValue: 'staff',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  last_login_at: {
    type: DataTypes.DATE,
  },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['company_id'],
    },
    {
      fields: ['email'],
    },
  ],
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password_hash = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.password) {
        user.password_hash = await bcrypt.hash(user.password, 10);
      }
    },
  },
});

module.exports = User;