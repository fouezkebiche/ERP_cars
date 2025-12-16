const { sequelize } = require('../config/database');

// Import all models
const Company = require('./Company');
const User = require('./User');
const Vehicle = require('./Vehicle');
const Customer = require('./Customer');
const Contract = require('./Contract');
const Payment = require('./Payment');
const VehicleCost = require('./VehicleCost');
const Employee = require('./Employee');

// ============================================
// COMPANY RELATIONSHIPS
// ============================================
Company.hasMany(User, { foreignKey: 'company_id', as: 'users' });
User.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

Company.hasMany(Vehicle, { foreignKey: 'company_id', as: 'vehicles' });
Vehicle.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

Company.hasMany(Customer, { foreignKey: 'company_id', as: 'customers' });
Customer.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

Company.hasMany(Contract, { foreignKey: 'company_id', as: 'contracts' });
Contract.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

Company.hasMany(Employee, { foreignKey: 'company_id', as: 'employees' });
Employee.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

Company.hasMany(Payment, { foreignKey: 'company_id', as: 'payments' });
Payment.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

// ============================================
// CONTRACT RELATIONSHIPS
// ============================================
Customer.hasMany(Contract, { foreignKey: 'customer_id', as: 'contracts' });
Contract.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

Vehicle.hasMany(Contract, { foreignKey: 'vehicle_id', as: 'contracts' });
Contract.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });

User.hasMany(Contract, { foreignKey: 'created_by', as: 'created_contracts' });
Contract.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// ============================================
// PAYMENT RELATIONSHIPS
// ============================================
Contract.hasMany(Payment, { foreignKey: 'contract_id', as: 'payments' });
Payment.belongsTo(Contract, { foreignKey: 'contract_id', as: 'contract' });

Customer.hasMany(Payment, { foreignKey: 'customer_id', as: 'payments' });
Payment.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

User.hasMany(Payment, { foreignKey: 'processed_by', as: 'processed_payments' });
Payment.belongsTo(User, { foreignKey: 'processed_by', as: 'processor' });

// ============================================
// VEHICLE COST RELATIONSHIPS
// ============================================
Vehicle.hasMany(VehicleCost, { foreignKey: 'vehicle_id', as: 'costs' });
VehicleCost.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });

User.hasMany(VehicleCost, { foreignKey: 'created_by', as: 'vehicle_costs' });
VehicleCost.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// ============================================
// EMPLOYEE RELATIONSHIPS
// ============================================
User.hasOne(Employee, { foreignKey: 'user_id', as: 'employee_profile' });
Employee.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  Company,
  User,
  Vehicle,
  Customer,
  Contract,
  Payment,
  VehicleCost,
  Employee,
};


