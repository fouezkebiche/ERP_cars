// src/controllers/customer.controller.js
const { Customer, Contract, Payment, Vehicle, sequelize } = require('../models');
const { sendSuccess, sendError } = require('../utils/response.util');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { applyTenantFilter, applyTenantData } = require('../middleware/tenantIsolation.middleware');

// ============================================
// GET /api/customers - List all customers (with filters & search)
// ============================================
const getAllCustomers = async (req, res) => {
  try {
    const {
      customer_type,
      is_blacklisted,
      search,
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = req.query;

    // Build filter object with tenant isolation
    const whereClause = applyTenantFilter(req);

    // Apply customer type filter
    if (customer_type) {
      whereClause.customer_type = customer_type;
    }

    // Apply blacklist filter
    if (is_blacklisted !== undefined) {
      whereClause.is_blacklisted = is_blacklisted === 'true';
    }

    // Apply search (name, email, phone, license)
    if (search) {
      whereClause[Op.or] = [
        { full_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { drivers_license_number: { [Op.iLike]: `%${search}%` } },
        { company_name: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Fetch customers
    const { count, rows: customers } = await Customer.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [[sort_by, sort_order.toUpperCase()]],
      attributes: {
        exclude: ['id_card_photo_url', 'license_photo_url'], // Don't send photo URLs in list
      },
    });

    console.log(`📋 Fetched ${customers.length} customers for company ${req.companyId}`);

    sendSuccess(res, {
      message: 'Customers fetched successfully',
      data: { customers },
      meta: {
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('💥 Get customers error:', error);
    sendError(res, {
      statusCode: 500,
      message: 'Failed to fetch customers',
      details: error.message,
    });
  }
};

// ============================================
// GET /api/customers/:id - Get single customer with full details
// ============================================
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findOne({
      where: applyTenantFilter(req, { id }),
    });

    if (!customer) {
      return sendError(res, {
        statusCode: 404,
        message: 'Customer not found',
      });
    }

    console.log(`👤 Customer fetched: ${customer.full_name}`);

    sendSuccess(res, {
      message: 'Customer fetched successfully',
      data: { customer },
    });
  } catch (error) {
    console.error('💥 Get customer error:', error);
    sendError(res, {
      statusCode: 500,
      message: 'Failed to fetch customer',
      details: error.message,
    });
  }
};

// ============================================
// GET /api/customers/:id/history - Get customer rental history
// ============================================
const getCustomerHistory = async (req, res) => {
  try {
    const { id: customer_id } = req.params;
    const { status, start_date, end_date, page = 1, limit = 10 } = req.query;

    // Check if customer exists and belongs to company
    const customer = await Customer.findOne({
      where: applyTenantFilter(req, { id: customer_id }),
    });

    if (!customer) {
      return sendError(res, {
        statusCode: 404,
        message: 'Customer not found',
      });
    }

    // Build filter for contracts
    const whereClause = {
      customer_id,
      company_id: req.companyId, // Ensure tenant isolation
    };

    if (status) {
      whereClause.status = status;
    }

    if (start_date || end_date) {
      whereClause.start_date = {};
      if (start_date) whereClause.start_date[Op.gte] = start_date;
      if (end_date) whereClause.start_date[Op.lte] = end_date;
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Fetch contracts with vehicle and payment details
    const { count, rows: contracts } = await Contract.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'brand', 'model', 'year', 'registration_number'],
        },
        {
          model: Payment,
          as: 'payments',
          attributes: ['id', 'amount', 'payment_method', 'payment_date', 'status'],
        },
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['start_date', 'DESC']],
    });

    // Calculate statistics
    const stats = {
      total_contracts: count,
      total_spent: contracts.reduce((sum, c) => sum + parseFloat(c.total_amount || 0), 0),
      completed_contracts: contracts.filter(c => c.status === 'completed').length,
      active_contracts: contracts.filter(c => c.status === 'active').length,
    };

    console.log(`📜 Fetched ${contracts.length} contracts for customer ${customer_id}`);

    sendSuccess(res, {
      message: 'Customer rental history fetched successfully',
      data: { 
        customer: {
          id: customer.id,
          full_name: customer.full_name,
          email: customer.email,
          phone: customer.phone,
        },
        contracts,
        stats,
      },
      meta: {
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('💥 Get customer history error:', error);
    sendError(res, {
      statusCode: 500,
      message: 'Failed to fetch customer history',
      details: error.message,
    });
  }
};

// ============================================
// POST /api/customers - Create new customer
// ============================================
const createCustomer = [
  // Validators
  body('customer_type').isIn(['individual', 'corporate']).withMessage('Valid customer type required'),
  body('full_name').notEmpty().withMessage('Full name is required').trim(),
  body('company_name').optional().trim(),
  body('email').optional().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('phone').notEmpty().withMessage('Phone is required').trim(),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('date_of_birth').optional().isISO8601().withMessage('Valid date required'),
  body('id_card_number').optional().trim(),
  body('drivers_license_number').optional().trim(),
  body('license_expiry_date').optional().isISO8601().withMessage('Valid date required'),
  body('emergency_contact_name').optional().trim(),
  body('emergency_contact_phone').optional().trim(),
  body('apply_tier_discount').optional().isBoolean(),
  body('notes').optional().trim(),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, {
          statusCode: 422,
          message: 'Validation failed',
          details: errors.array(),
        });
      }

      // Check if license number already exists (if provided)
      if (req.body.drivers_license_number) {
        const existingCustomer = await Customer.findOne({
          where: { drivers_license_number: req.body.drivers_license_number },
        });

        if (existingCustomer) {
          return sendError(res, {
            statusCode: 409,
            message: 'Customer with this license number already exists',
          });
        }
      }

      // Apply tenant data (adds company_id automatically)
      const customerData = applyTenantData(req, req.body);

      const customer = await Customer.create(customerData);

      console.log(`👤 New customer created: ${customer.full_name} (${customer.customer_type})`);

      sendSuccess(res, {
        statusCode: 201,
        message: 'Customer created successfully',
        data: { customer },
      });
    } catch (error) {
      console.error('💥 Create customer error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to create customer',
        details: error.message,
      });
    }
  },
];

// ============================================
// PUT /api/customers/:id - Update customer
// ============================================
const updateCustomer = [
  // Validators (all optional for update)
  body('customer_type').optional().isIn(['individual', 'corporate']),
  body('full_name').optional().notEmpty().trim(),
  body('company_name').optional().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().notEmpty().trim(),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('date_of_birth').optional().isISO8601(),
  body('drivers_license_number').optional().trim(),
  body('license_expiry_date').optional().isISO8601(),
  body('is_blacklisted').optional().isBoolean(),
  body('apply_tier_discount').optional().isBoolean(),
  body('notes').optional().trim(),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, {
          statusCode: 422,
          message: 'Validation failed',
          details: errors.array(),
        });
      }

      const { id } = req.params;

      // Check if customer exists and belongs to company
      const customer = await Customer.findOne({
        where: applyTenantFilter(req, { id }),
      });

      if (!customer) {
        return sendError(res, {
          statusCode: 404,
          message: 'Customer not found',
        });
      }

      // If license number is being updated, check uniqueness
      if (req.body.drivers_license_number && req.body.drivers_license_number !== customer.drivers_license_number) {
        const existingCustomer = await Customer.findOne({
          where: { drivers_license_number: req.body.drivers_license_number },
        });

        if (existingCustomer) {
          return sendError(res, {
            statusCode: 409,
            message: 'Customer with this license number already exists',
          });
        }
      }

      // Update customer
      await customer.update(req.body);

      console.log(`🔄 Customer updated: ${customer.full_name}`);

      sendSuccess(res, {
        message: 'Customer updated successfully',
        data: { customer },
      });
    } catch (error) {
      console.error('💥 Update customer error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to update customer',
        details: error.message,
      });
    }
  },
];

// ============================================
// DELETE /api/customers/:id - Delete customer
// ============================================
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if customer exists and belongs to company
    const customer = await Customer.findOne({
      where: applyTenantFilter(req, { id }),
    });

    if (!customer) {
      return sendError(res, {
        statusCode: 404,
        message: 'Customer not found',
      });
    }

    // Check if customer has active contracts
    const activeContracts = await Contract.count({
      where: {
        customer_id: id,
        status: 'active',
      },
    });

    if (activeContracts > 0) {
      return sendError(res, {
        statusCode: 409,
        message: 'Cannot delete customer with active contracts',
      });
    }

    // Instead of hard delete, you could soft-delete by setting a flag
    // For now, we'll do a hard delete but you can modify this
    await customer.destroy();

    console.log(`🗑️ Customer deleted: ${customer.full_name}`);

    sendSuccess(res, {
      message: 'Customer deleted successfully',
      data: { id },
    });
  } catch (error) {
    console.error('💥 Delete customer error:', error);
    sendError(res, {
      statusCode: 500,
      message: 'Failed to delete customer',
      details: error.message,
    });
  }
};

// ============================================
// GET /api/customers/stats - Get customer statistics
// ============================================
const getCustomerStats = async (req, res) => {
  try {
    const companyFilter = { company_id: req.companyId };

    // Get total customers
    const totalCustomers = await Customer.count({ where: companyFilter });

    // Get customers by type
    const individual = await Customer.count({ 
      where: { ...companyFilter, customer_type: 'individual' } 
    });
    const corporate = await Customer.count({ 
      where: { ...companyFilter, customer_type: 'corporate' } 
    });

    // Get blacklisted customers
    const blacklisted = await Customer.count({ 
      where: { ...companyFilter, is_blacklisted: true } 
    });

    // Get top customers by lifetime value
    const topCustomers = await Customer.findAll({
      where: companyFilter,
      order: [['lifetime_value', 'DESC']],
      limit: 5,
      attributes: ['id', 'full_name', 'email', 'total_rentals', 'lifetime_value'],
    });

    // Get recent customers (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentCustomers = await Customer.count({
      where: {
        ...companyFilter,
        created_at: { [Op.gte]: thirtyDaysAgo },
      },
    });

    const stats = {
      total_customers: totalCustomers,
      by_type: {
        individual,
        corporate,
      },
      blacklisted,
      recent_customers_30d: recentCustomers,
      top_customers: topCustomers,
    };

    console.log(`📊 Customer stats fetched for company ${req.companyId}`);

    sendSuccess(res, {
      message: 'Customer statistics fetched successfully',
      data: { stats },
    });
  } catch (error) {
    console.error('💥 Get customer stats error:', error);
    sendError(res, {
      statusCode: 500,
      message: 'Failed to fetch customer statistics',
      details: error.message,
    });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  getCustomerHistory,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats,
};