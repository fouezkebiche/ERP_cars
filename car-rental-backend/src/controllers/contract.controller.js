// src/controllers/contract.controller.js
const { Contract, Customer, Vehicle, User, Payment, sequelize } = require('../models');
const { sendSuccess, sendError } = require('../utils/response.util');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { applyTenantFilter, applyTenantData } = require('../middleware/tenantIsolation.middleware');

// ============================================
// HELPER: Generate contract number (atomic with uniqueness check)
// ============================================
const generateContractNumber = async (companyId, transaction) => {
  const year = new Date().getFullYear();
  const yearPrefix = `RENT-${year}-`;

  // Find the highest existing number for this year/company
  const maxContract = await Contract.findOne({
    where: {
      company_id: companyId,
      contract_number: { [Op.like]: `${yearPrefix}%` },
    },
    order: [['contract_number', 'DESC']], // Sort by contract_number DESC for max
    transaction, // Use transaction for isolation
  });

  let nextNumber = 1;
  if (maxContract) {
    nextNumber = parseInt(maxContract.contract_number.split('-')[2]) + 1;
  }

  // Loop to ensure uniqueness (handles races/stale data)
  let contractNumber;
  do {
    contractNumber = `${yearPrefix}${String(nextNumber).padStart(4, '0')}`;
    const exists = await Contract.findOne({
      where: {
        company_id: companyId,
        contract_number: contractNumber,
      },
      transaction, // Use transaction
    });
    if (!exists) break;
    nextNumber++;
  } while (true);

  return contractNumber;
};

// ============================================
// HELPER: Calculate contract totals
// ============================================
const calculateContractTotals = (data) => {
  // Parse strings to numbers safely (fixes the concat bug)
  const dailyRate = parseFloat(data.daily_rate) || 0;
  const additionalCharges = parseFloat(data.additional_charges || 0);
  const discountAmount = parseFloat(data.discount_amount || 0);

  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  if (totalDays <= 0) {
    throw new Error('Invalid date range: end date must be after start date');
  }

  const baseAmount = dailyRate * totalDays;
  const subtotal = baseAmount + additionalCharges - discountAmount;
  const taxAmount = subtotal * 0.19; // 19% tax
  const totalAmount = subtotal + taxAmount;

  return {
    total_days: totalDays,
    base_amount: baseAmount,
    tax_amount: taxAmount,
    total_amount: totalAmount,
  };
};

// ============================================
// GET /api/contracts - List all contracts
// ============================================
const getAllContracts = async (req, res) => {
  try {
    const {
      status,
      customer_id,
      vehicle_id,
      start_date,
      end_date,
      search,
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = req.query;

    // Build filter with tenant isolation
    const whereClause = applyTenantFilter(req);

    // Apply filters
    if (status) whereClause.status = status;
    if (customer_id) whereClause.customer_id = customer_id;
    if (vehicle_id) whereClause.vehicle_id = vehicle_id;

    // Date range filter
    if (start_date || end_date) {
      whereClause.start_date = {};
      if (start_date) whereClause.start_date[Op.gte] = start_date;
      if (end_date) whereClause.start_date[Op.lte] = end_date;
    }

    // Search by contract number
    if (search) {
      whereClause.contract_number = { [Op.iLike]: `%${search}%` };
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Fetch contracts with relations
    const { count, rows: contracts } = await Contract.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'full_name', 'email', 'phone', 'customer_type'],
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'brand', 'model', 'year', 'registration_number', 'status'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'full_name', 'email'],
        },
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [[sort_by, sort_order.toUpperCase()]],
    });

    console.log(`📋 Fetched ${contracts.length} contracts for company ${req.companyId}`);

    sendSuccess(res, {
      message: 'Contracts fetched successfully',
      data: { contracts },
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
    console.error('💥 Get contracts error:', error);
    sendError(res, {
      statusCode: 500,
      message: 'Failed to fetch contracts',
      details: error.message,
    });
  }
};

// ============================================
// GET /api/contracts/:id - Get single contract
// ============================================
const getContractById = async (req, res) => {
  try {
    const { id } = req.params;

    const contract = await Contract.findOne({
      where: applyTenantFilter(req, { id }),
      include: [
        {
          model: Customer,
          as: 'customer',
        },
        {
          model: Vehicle,
          as: 'vehicle',
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'full_name', 'email'],
        },
        {
          model: Payment,
          as: 'payments',
        },
      ],
    });

    if (!contract) {
      return sendError(res, {
        statusCode: 404,
        message: 'Contract not found',
      });
    }

    console.log(`📄 Contract fetched: ${contract.contract_number}`);

    sendSuccess(res, {
      message: 'Contract fetched successfully',
      data: { contract },
    });
  } catch (error) {
    console.error('💥 Get contract error:', error);
    sendError(res, {
      statusCode: 500,
      message: 'Failed to fetch contract',
      details: error.message,
    });
  }
};

// ============================================
// POST /api/contracts - Create new contract
// ============================================
const createContract = [
  // Validators
  body('customer_id').isUUID().withMessage('Valid customer ID required'),
  body('vehicle_id').isUUID().withMessage('Valid vehicle ID required'),
  body('start_date').isISO8601().withMessage('Valid start date required'),
  body('end_date').isISO8601().withMessage('Valid end date required'),
  body('daily_rate').isFloat({ min: 0 }).withMessage('Valid daily rate required'),
  body('deposit_amount').optional().isFloat({ min: 0 }),
  body('additional_charges').optional().isFloat({ min: 0 }),
  body('discount_amount').optional().isFloat({ min: 0 }),
  body('mileage_limit').optional().isInt({ min: 0 }),
  body('extras').optional().isObject(),
  body('notes').optional().trim(),

  async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await transaction.rollback();
        return sendError(res, {
          statusCode: 422,
          message: 'Validation failed',
          details: errors.array(),
        });
      }

      const { customer_id, vehicle_id, start_date, end_date } = req.body;

      // Validate dates
      if (new Date(end_date) <= new Date(start_date)) {
        await transaction.rollback();
        return sendError(res, {
          statusCode: 422,
          message: 'End date must be after start date',
        });
      }

      // Check customer exists and is not blacklisted
      const customer = await Customer.findOne({
        where: applyTenantFilter(req, { id: customer_id }),
      });

      if (!customer) {
        await transaction.rollback();
        return sendError(res, { statusCode: 404, message: 'Customer not found' });
      }

      if (customer.is_blacklisted) {
        await transaction.rollback();
        return sendError(res, {
          statusCode: 403,
          message: 'Cannot create contract for blacklisted customer',
        });
      }

      // Check vehicle exists and is available
      const vehicle = await Vehicle.findOne({
        where: applyTenantFilter(req, { id: vehicle_id }),
      });

      if (!vehicle) {
        await transaction.rollback();
        return sendError(res, { statusCode: 404, message: 'Vehicle not found' });
      }

      if (vehicle.status !== 'available') {
        await transaction.rollback();
        return sendError(res, {
          statusCode: 409,
          message: `Vehicle is not available (current status: ${vehicle.status})`,
        });
      }

      // Check for conflicting contracts
      const conflictingContract = await Contract.findOne({
        where: {
          vehicle_id,
          status: 'active',
          [Op.or]: [
            { start_date: { [Op.between]: [start_date, end_date] } },
            { end_date: { [Op.between]: [start_date, end_date] } },
            {
              [Op.and]: [
                { start_date: { [Op.lte]: start_date } },
                { end_date: { [Op.gte]: end_date } },
              ],
            },
          ],
        },
      });

      if (conflictingContract) {
        await transaction.rollback();
        return sendError(res, {
          statusCode: 409,
          message: 'Vehicle already has an active contract in this date range',
        });
      }

      // Generate contract number (pass transaction)
      const contractNumber = await generateContractNumber(req.companyId, transaction);

      // Calculate totals
      const totals = calculateContractTotals(req.body);

      // Create contract
      const contractData = applyTenantData(req, {
        ...req.body,
        contract_number: contractNumber,
        created_by: req.user.id,
        status: 'active',
        start_mileage: vehicle.mileage,
        ...totals,
      });

      const contract = await Contract.create(contractData, { transaction });

      // Update vehicle status
      await vehicle.update({ status: 'rented' }, { transaction });

      // Update customer stats
      await customer.update(
        {
          total_rentals: customer.total_rentals + 1,
          lifetime_value: parseFloat(customer.lifetime_value) + totals.total_amount,
        },
        { transaction }
      );

      await transaction.commit();

      // Fetch contract with relations
      const fullContract = await Contract.findByPk(contract.id, {
        include: [
          { model: Customer, as: 'customer' },
          { model: Vehicle, as: 'vehicle' },
          { model: User, as: 'creator', attributes: ['id', 'full_name'] },
        ],
      });

      console.log(`📄 New contract created: ${contractNumber}`);

      sendSuccess(res, {
        statusCode: 201,
        message: 'Contract created successfully',
        data: { contract: fullContract },
      });
    } catch (error) {
      await transaction.rollback();
      console.error('💥 Create contract error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to create contract',
        details: error.message,
      });
    }
  },
];

// ============================================
// PUT /api/contracts/:id - Update contract
// ============================================
const updateContract = [
  body('end_date').optional().isISO8601(),
  body('additional_charges').optional().isFloat({ min: 0 }),
  body('discount_amount').optional().isFloat({ min: 0 }),
  body('notes').optional().trim(),
  body('extras').optional().isObject(),

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

      const contract = await Contract.findOne({
        where: applyTenantFilter(req, { id }),
      });

      if (!contract) {
        return sendError(res, { statusCode: 404, message: 'Contract not found' });
      }

      // Only allow updates for active or draft contracts
      if (!['active', 'draft'].includes(contract.status)) {
        return sendError(res, {
          statusCode: 409,
          message: `Cannot update ${contract.status} contract`,
        });
      }

      // If updating end_date or charges, recalculate totals
      if (req.body.end_date || req.body.additional_charges !== undefined || req.body.discount_amount !== undefined) {
        const updateData = {
          start_date: contract.start_date,
          end_date: req.body.end_date || contract.end_date,
          daily_rate: contract.daily_rate,
          additional_charges: req.body.additional_charges ?? contract.additional_charges,
          discount_amount: req.body.discount_amount ?? contract.discount_amount,
        };

        const totals = calculateContractTotals(updateData);
        Object.assign(req.body, totals);
      }

      await contract.update(req.body);

      console.log(`🔄 Contract updated: ${contract.contract_number}`);

      sendSuccess(res, {
        message: 'Contract updated successfully',
        data: { contract },
      });
    } catch (error) {
      console.error('💥 Update contract error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to update contract',
        details: error.message,
      });
    }
  },
];

// ============================================
// POST /api/contracts/:id/complete - Complete rental
// ============================================
const completeContract = [
  body('actual_return_date').isISO8601().withMessage('Valid return date required'),
  body('end_mileage').isInt({ min: 0 }).withMessage('Valid end mileage required'),
  body('additional_charges').optional().isFloat({ min: 0 }),
  body('notes').optional().trim(),

  async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await transaction.rollback();
        return sendError(res, {
          statusCode: 422,
          message: 'Validation failed',
          details: errors.array(),
        });
      }

      const { id } = req.params;
      const { actual_return_date, end_mileage, additional_charges, notes } = req.body;

      const contract = await Contract.findOne({
        where: applyTenantFilter(req, { id }),
        include: [{ model: Vehicle, as: 'vehicle' }],
      });

      if (!contract) {
        await transaction.rollback();
        return sendError(res, { statusCode: 404, message: 'Contract not found' });
      }

      if (contract.status !== 'active') {
        await transaction.rollback();
        return sendError(res, {
          statusCode: 409,
          message: `Cannot complete ${contract.status} contract`,
        });
      }

      // Calculate mileage charges if exceeded
      const mileageDriven = end_mileage - contract.start_mileage;
      let mileageCharges = 0;

      if (contract.mileage_limit && mileageDriven > contract.mileage_limit) {
        const excessMileage = mileageDriven - contract.mileage_limit;
        const chargePerKm = contract.mileage_charge_per_km || 5; // Default 5 DZD per km
        mileageCharges = excessMileage * chargePerKm;
      }

      const totalAdditionalCharges = (additional_charges || 0) + mileageCharges;

      // Recalculate total if additional charges
      let updateData = {
        status: 'completed',
        actual_return_date,
        end_mileage,
        deposit_returned: true,
      };

      if (totalAdditionalCharges > 0) {
        updateData.additional_charges = parseFloat(contract.additional_charges) + totalAdditionalCharges;
        
        const totals = calculateContractTotals({
          start_date: contract.start_date,
          end_date: contract.end_date,
          daily_rate: contract.daily_rate,
          additional_charges: updateData.additional_charges,
          discount_amount: contract.discount_amount,
        });

        updateData = { ...updateData, ...totals };
      }

      if (notes) updateData.notes = notes;

      await contract.update(updateData, { transaction });

      // Update vehicle status and mileage
      await contract.vehicle.update(
        {
          status: 'available',
          mileage: end_mileage,
        },
        { transaction }
      );

      await transaction.commit();

      console.log(`✅ Contract completed: ${contract.contract_number}`);

      sendSuccess(res, {
        message: 'Contract completed successfully',
        data: { contract },
      });
    } catch (error) {
      await transaction.rollback();
      console.error('💥 Complete contract error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to complete contract',
        details: error.message,
      });
    }
  },
];

// ============================================
// POST /api/contracts/:id/cancel - Cancel contract
// ============================================
const cancelContract = [
  body('reason').optional().trim(),

  async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { reason } = req.body;

      const contract = await Contract.findOne({
        where: applyTenantFilter(req, { id }),
        include: [
          { model: Vehicle, as: 'vehicle' },
          { model: Customer, as: 'customer' },
        ],
      });

      if (!contract) {
        await transaction.rollback();
        return sendError(res, { statusCode: 404, message: 'Contract not found' });
      }

      if (contract.status !== 'active') {
        await transaction.rollback();
        return sendError(res, {
          statusCode: 409,
          message: `Cannot cancel ${contract.status} contract`,
        });
      }

      // Update contract
      await contract.update(
        {
          status: 'cancelled',
          notes: reason ? `${contract.notes || ''}\nCancellation reason: ${reason}` : contract.notes,
        },
        { transaction }
      );

      // Return vehicle to available
      await contract.vehicle.update({ status: 'available' }, { transaction });

      // Update customer stats (decrement)
      await contract.customer.update(
        {
          total_rentals: Math.max(0, contract.customer.total_rentals - 1),
          lifetime_value: Math.max(0, parseFloat(contract.customer.lifetime_value) - parseFloat(contract.total_amount)),
        },
        { transaction }
      );

      await transaction.commit();

      console.log(`❌ Contract cancelled: ${contract.contract_number}`);

      sendSuccess(res, {
        message: 'Contract cancelled successfully',
        data: { contract },
      });
    } catch (error) {
      await transaction.rollback();
      console.error('💥 Cancel contract error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to cancel contract',
        details: error.message,
      });
    }
  },
];

// ============================================
// POST /api/contracts/:id/extend - Extend rental
// ============================================
const extendContract = [
  body('new_end_date').isISO8601().withMessage('Valid new end date required'),
  body('notes').optional().trim(),
  async (req, res) => {
    const transaction = await sequelize.transaction(); // Add for safety
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await transaction.rollback();
        return sendError(res, {
          statusCode: 422,
          message: 'Validation failed',
          details: errors.array(),
        });
      }
      const { id } = req.params;
      const { new_end_date, notes } = req.body;
      const contract = await Contract.findOne({
        where: applyTenantFilter(req, { id }),
        include: [{ model: Vehicle, as: 'vehicle' }], // Load vehicle for ID
      });
      if (!contract) {
        await transaction.rollback();
        return sendError(res, { statusCode: 404, message: 'Contract not found' });
      }
      if (contract.status !== 'active') {
        await transaction.rollback();
        return sendError(res, {
          statusCode: 409,
          message: `Cannot extend ${contract.status} contract`,
        });
      }
      // Validate new end date is after current end date
      if (new Date(new_end_date) <= new Date(contract.end_date)) {
        await transaction.rollback();
        return sendError(res, {
          statusCode: 422,
          message: 'New end date must be after current end date',
        });
      }
      // Check for conflicts (inside transaction)
      const conflictingContract = await Contract.findOne({
        where: {
          vehicle_id: contract.vehicle_id,
          status: 'active',
          id: { [Op.ne]: contract.id },
          start_date: { [Op.lte]: new_end_date },
          end_date: { [Op.gte]: new Date(contract.end_date) },
        },
        transaction,
      });
      if (conflictingContract) {
        await transaction.rollback();
        return sendError(res, {
          statusCode: 409,
          message: 'Cannot extend: vehicle has another booking during the extended period',
        });
      }
      // Recalculate totals (now safe with parsing)
      const totals = calculateContractTotals({
        start_date: contract.start_date,
        end_date: new_end_date,
        daily_rate: contract.daily_rate,
        additional_charges: contract.additional_charges,
        discount_amount: contract.discount_amount,
      });
      await contract.update({
        end_date: new_end_date,
        // status: 'extended',  // Removed: Keep as 'active'
        ...totals,
        notes: notes ? `${contract.notes || ''}\nExtended to ${new_end_date}: ${notes}` : contract.notes, // Clearer note
      }, { transaction });
      await transaction.commit();
      console.log(`📅 Contract extended: ${contract.contract_number}`);
      sendSuccess(res, {
        message: 'Contract extended successfully',
        data: { contract },
      });
    } catch (error) {
      await transaction.rollback();
      console.error('💥 Extend contract error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to extend contract',
        details: error.message,
      });
    }
  },
];
// ============================================
// GET /api/contracts/stats - Get contract statistics
// ============================================
const getContractStats = async (req, res) => {
  try {
    const companyFilter = { company_id: req.companyId };
    // Total contracts
    const totalContracts = await Contract.count({ where: companyFilter });
    // By status
    const active = await Contract.count({ where: { ...companyFilter, status: 'active' } });
    const completed = await Contract.count({ where: { ...companyFilter, status: 'completed' } });
    const cancelled = await Contract.count({ where: { ...companyFilter, status: 'cancelled' } });
    // Revenue
    const revenueResult = await Contract.findOne({
      where: companyFilter,
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_revenue'],
      ],
      raw: true,
    });
    // Recent contracts (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentContracts = await Contract.count({
      where: {
        ...companyFilter,
        created_at: { [Op.gte]: thirtyDaysAgo },
      },
    });
    const stats = {
      total_contracts: totalContracts,
      by_status: { active, completed, cancelled }, // Removed extended
      total_revenue: parseFloat(revenueResult?.total_revenue || 0),
      recent_contracts_30d: recentContracts,
    };
    sendSuccess(res, {
      message: 'Contract statistics fetched successfully',
      data: { stats },
    });
  } catch (error) {
    console.error('💥 Get contract stats error:', error);
    sendError(res, {
      statusCode: 500,
      message: 'Failed to fetch contract statistics',
      details: error.message,
    });
  }
};

module.exports = {
  getAllContracts,
  getContractById,
  createContract,
  updateContract,
  completeContract,
  cancelContract,
  extendContract,
  getContractStats,
};