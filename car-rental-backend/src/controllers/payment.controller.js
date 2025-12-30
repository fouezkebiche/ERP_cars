// src/controllers/payment.controller.js
const { Payment, Contract, Customer, Vehicle, User, sequelize } = require('../models');
const { sendSuccess, sendError } = require('../utils/response.util');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { applyTenantFilter, applyTenantData } = require('../middleware/tenantIsolation.middleware');

// ============================================
// GET /api/payments - List all payments
// ============================================
const getAllPayments = async (req, res) => {
  try {
    const {
      contract_id,
      customer_id,
      payment_method,
      status,
      start_date,
      end_date,
      search,
      page = 1,
      limit = 20,
      sort_by = 'payment_date',
      sort_order = 'DESC',
    } = req.query;

    // Build filter with tenant isolation
    const whereClause = applyTenantFilter(req);

    // Apply filters
    if (contract_id) whereClause.contract_id = contract_id;
    if (customer_id) whereClause.customer_id = customer_id;
    if (payment_method) whereClause.payment_method = payment_method;
    if (status) whereClause.status = status;

    // Date range filter
    if (start_date || end_date) {
      whereClause.payment_date = {};
      if (start_date) whereClause.payment_date[Op.gte] = start_date;
      if (end_date) whereClause.payment_date[Op.lte] = end_date;
    }

    // Search by reference number
    if (search) {
      whereClause.reference_number = { [Op.iLike]: `%${search}%` };
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Fetch payments with relations
    const { count, rows: payments } = await Payment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Contract,
          as: 'contract',
          attributes: ['id', 'contract_number', 'total_amount', 'status'],
          include: [
            {
              model: Vehicle,
              as: 'vehicle',
              attributes: ['id', 'brand', 'model', 'registration_number'],
            },
          ],
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'full_name', 'email', 'phone', 'customer_type'],
        },
        {
          model: User,
          as: 'processor',
          attributes: ['id', 'full_name', 'email'],
        },
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [[sort_by, sort_order.toUpperCase()]],
    });

    console.log(`💰 Fetched ${payments.length} payments for company ${req.companyId}`);

    sendSuccess(res, {
      message: 'Payments fetched successfully',
      data: { payments },
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
    console.error('💥 Get payments error:', error);
    sendError(res, {
      statusCode: 500,
      message: 'Failed to fetch payments',
      details: error.message,
    });
  }
};

// ============================================
// GET /api/payments/:id - Get single payment
// ============================================
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findOne({
      where: applyTenantFilter(req, { id }),
      include: [
        {
          model: Contract,
          as: 'contract',
          include: [
            {
              model: Vehicle,
              as: 'vehicle',
              attributes: ['id', 'brand', 'model', 'registration_number', 'year'],
            },
          ],
        },
        {
          model: Customer,
          as: 'customer',
        },
        {
          model: User,
          as: 'processor',
          attributes: ['id', 'full_name', 'email'],
        },
      ],
    });

    if (!payment) {
      return sendError(res, {
        statusCode: 404,
        message: 'Payment not found',
      });
    }

    console.log(`💳 Payment fetched: ${payment.reference_number || payment.id}`);

    sendSuccess(res, {
      message: 'Payment fetched successfully',
      data: { payment },
    });
  } catch (error) {
    console.error('💥 Get payment error:', error);
    sendError(res, {
      statusCode: 500,
      message: 'Failed to fetch payment',
      details: error.message,
    });
  }
};

// ============================================
// POST /api/payments - Record new payment
// ============================================
const createPayment = [
  // Validators
  body('contract_id').isUUID().withMessage('Valid contract ID required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount required (must be positive)'),
  body('payment_method')
    .isIn(['cash', 'card', 'bank_transfer', 'check', 'mobile_payment'])
    .withMessage('Invalid payment method'),
  body('payment_date').optional().isISO8601().withMessage('Valid payment date required'),
  body('reference_number').optional().trim(),
  body('notes').optional().trim(),
  body('status')
    .optional()
    .isIn(['pending', 'completed', 'failed', 'refunded'])
    .withMessage('Invalid status'),

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

      const { contract_id, amount, payment_method, payment_date, reference_number, notes, status = 'completed' } = req.body;

      // Check if contract exists and belongs to company
      const contract = await Contract.findOne({
        where: applyTenantFilter(req, { id: contract_id }),
        include: [
          {
            model: Customer,
            as: 'customer',
          },
        ],
      });

      if (!contract) {
        await transaction.rollback();
        return sendError(res, { statusCode: 404, message: 'Contract not found' });
      }

      // Validate payment amount doesn't exceed contract total
      const totalPaid = await Payment.sum('amount', {
        where: {
          contract_id,
          status: 'completed',
        },
      });

      const totalPaidAmount = parseFloat(totalPaid || 0);
      const contractTotal = parseFloat(contract.total_amount);
      const newPaymentAmount = parseFloat(amount);

      if (totalPaidAmount + newPaymentAmount > contractTotal) {
        await transaction.rollback();
        return sendError(res, {
          statusCode: 422,
          message: `Payment amount exceeds contract balance. Outstanding: ${(contractTotal - totalPaidAmount).toFixed(2)} DZD`,
        });
      }

      // Create payment
      const paymentData = applyTenantData(req, {
        contract_id,
        customer_id: contract.customer_id,
        amount: newPaymentAmount,
        payment_method,
        payment_date: payment_date || new Date(),
        reference_number,
        notes,
        status,
        processed_by: req.user.id,
      });

      const payment = await Payment.create(paymentData, { transaction });

      await transaction.commit();

      // Fetch payment with relations
      const fullPayment = await Payment.findByPk(payment.id, {
        include: [
          { model: Contract, as: 'contract' },
          { model: Customer, as: 'customer' },
          { model: User, as: 'processor', attributes: ['id', 'full_name'] },
        ],
      });

      console.log(`💳 New payment recorded: ${newPaymentAmount} DZD for contract ${contract.contract_number}`);

      sendSuccess(res, {
        statusCode: 201,
        message: 'Payment recorded successfully',
        data: { payment: fullPayment },
      });
    } catch (error) {
      await transaction.rollback();
      console.error('💥 Create payment error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to record payment',
        details: error.message,
      });
    }
  },
];

// ============================================
// PUT /api/payments/:id - Update payment
// ============================================
const updatePayment = [
  body('amount').optional().isFloat({ min: 0.01 }),
  body('payment_method').optional().isIn(['cash', 'card', 'bank_transfer', 'check', 'mobile_payment']),
  body('payment_date').optional().isISO8601(),
  body('reference_number').optional().trim(),
  body('status').optional().isIn(['pending', 'completed', 'failed', 'refunded']),
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

      const payment = await Payment.findOne({
        where: applyTenantFilter(req, { id }),
      });

      if (!payment) {
        return sendError(res, { statusCode: 404, message: 'Payment not found' });
      }

      // Only allow updates for pending or failed payments
      if (payment.status === 'completed' && req.body.status !== 'refunded') {
        return sendError(res, {
          statusCode: 409,
          message: 'Cannot update completed payment (use refund instead)',
        });
      }

      await payment.update(req.body);

      console.log(`🔄 Payment updated: ${payment.id}`);

      sendSuccess(res, {
        message: 'Payment updated successfully',
        data: { payment },
      });
    } catch (error) {
      console.error('💥 Update payment error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to update payment',
        details: error.message,
      });
    }
  },
];

// ============================================
// GET /api/payments/outstanding - Get outstanding payments
// ============================================
const getOutstandingPayments = async (req, res) => {
  try {
    const { customer_id, page = 1, limit = 20 } = req.query;

    // Build filter
    const contractWhere = applyTenantFilter(req, {
      status: { [Op.in]: ['active', 'completed'] },
    });

    if (customer_id) {
      contractWhere.customer_id = customer_id;
    }

    // Get all contracts with payments
    const contracts = await Contract.findAll({
      where: contractWhere,
      include: [
        {
          model: Payment,
          as: 'payments',
          where: { status: 'completed' },
          required: false,
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'full_name', 'email', 'phone', 'customer_type'],
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'brand', 'model', 'registration_number'],
        },
      ],
    });

    // Calculate outstanding balances
    const outstandingContracts = contracts
      .map((contract) => {
        const totalAmount = parseFloat(contract.total_amount);
        const totalPaid = contract.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
        const outstanding = totalAmount - totalPaid;

        return {
          contract_id: contract.id,
          contract_number: contract.contract_number,
          customer: contract.customer,
          vehicle: contract.vehicle,
          total_amount: totalAmount,
          total_paid: totalPaid,
          outstanding_amount: outstanding,
          status: contract.status,
          start_date: contract.start_date,
          end_date: contract.end_date,
        };
      })
      .filter((c) => c.outstanding_amount > 0); // Only contracts with outstanding balance

    // Sort by outstanding amount (highest first)
    outstandingContracts.sort((a, b) => b.outstanding_amount - a.outstanding_amount);

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paginatedResults = outstandingContracts.slice(offset, offset + parseInt(limit));
    const totalOutstanding = outstandingContracts.reduce((sum, c) => sum + c.outstanding_amount, 0);

    console.log(`📊 Found ${outstandingContracts.length} contracts with outstanding payments`);

    sendSuccess(res, {
      message: 'Outstanding payments fetched successfully',
      data: {
        outstanding_contracts: paginatedResults,
        summary: {
          total_contracts: outstandingContracts.length,
          total_outstanding_amount: totalOutstanding,
        },
      },
      meta: {
        pagination: {
          total: outstandingContracts.length,
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: Math.ceil(outstandingContracts.length / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('💥 Get outstanding payments error:', error);
    sendError(res, {
      statusCode: 500,
      message: 'Failed to fetch outstanding payments',
      details: error.message,
    });
  }
};

// ============================================
// GET /api/contracts/:id/payments - Get payments for contract
// ============================================
const getContractPayments = async (req, res) => {
  try {
    const { id: contract_id } = req.params;

    // Check if contract exists and belongs to company
    const contract = await Contract.findOne({
      where: applyTenantFilter(req, { id: contract_id }),
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'full_name', 'email', 'phone'],
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'brand', 'model', 'registration_number'],
        },
      ],
    });

    if (!contract) {
      return sendError(res, {
        statusCode: 404,
        message: 'Contract not found',
      });
    }

    // Get all payments for this contract
    const payments = await Payment.findAll({
      where: { contract_id },
      include: [
        {
          model: User,
          as: 'processor',
          attributes: ['id', 'full_name', 'email'],
        },
      ],
      order: [['payment_date', 'DESC']],
    });

    // Calculate payment summary
    const totalPaid = payments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const totalAmount = parseFloat(contract.total_amount);
    const outstandingAmount = totalAmount - totalPaid;
    const paymentPercentage = ((totalPaid / totalAmount) * 100).toFixed(2);

    const summary = {
      contract_number: contract.contract_number,
      customer: contract.customer,
      vehicle: contract.vehicle,
      total_amount: totalAmount,
      total_paid: totalPaid,
      outstanding_amount: outstandingAmount,
      payment_percentage: parseFloat(paymentPercentage),
      payment_count: payments.length,
      completed_payments: payments.filter((p) => p.status === 'completed').length,
    };

    console.log(`💰 Fetched ${payments.length} payments for contract ${contract.contract_number}`);

    sendSuccess(res, {
      message: 'Contract payments fetched successfully',
      data: {
        payments,
        summary,
      },
    });
  } catch (error) {
    console.error('💥 Get contract payments error:', error);
    sendError(res, {
      statusCode: 500,
      message: 'Failed to fetch contract payments',
      details: error.message,
    });
  }
};

// ============================================
// GET /api/payments/stats - Get payment statistics
// ============================================
const getPaymentStats = async (req, res) => {
  try {
    const companyFilter = { company_id: req.companyId };

    // Total payments
    const totalPayments = await Payment.count({ where: companyFilter });

    // By status
    const completed = await Payment.count({ where: { ...companyFilter, status: 'completed' } });
    const pending = await Payment.count({ where: { ...companyFilter, status: 'pending' } });
    const failed = await Payment.count({ where: { ...companyFilter, status: 'failed' } });
    const refunded = await Payment.count({ where: { ...companyFilter, status: 'refunded' } });

    // By payment method
    const byMethod = await Payment.findAll({
      where: companyFilter,
      attributes: ['payment_method', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['payment_method'],
      raw: true,
    });

    // Total revenue
    const revenueResult = await Payment.findOne({
      where: { ...companyFilter, status: 'completed' },
      attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'total_revenue']],
      raw: true,
    });

    // Recent payments (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPayments = await Payment.count({
      where: {
        ...companyFilter,
        payment_date: { [Op.gte]: thirtyDaysAgo },
        status: 'completed',
      },
    });

    const recentRevenue = await Payment.findOne({
      where: {
        ...companyFilter,
        payment_date: { [Op.gte]: thirtyDaysAgo },
        status: 'completed',
      },
      attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'revenue']],
      raw: true,
    });

    const stats = {
      total_payments: totalPayments,
      by_status: { completed, pending, failed, refunded },
      by_method: byMethod.reduce((acc, item) => {
        acc[item.payment_method] = parseInt(item.count);
        return acc;
      }, {}),
      total_revenue: parseFloat(revenueResult?.total_revenue || 0),
      recent_payments_30d: recentPayments,
      recent_revenue_30d: parseFloat(recentRevenue?.revenue || 0),
    };

    sendSuccess(res, {
      message: 'Payment statistics fetched successfully',
      data: { stats },
    });
  } catch (error) {
    console.error('💥 Get payment stats error:', error);
    sendError(res, {
      statusCode: 500,
      message: 'Failed to fetch payment statistics',
      details: error.message,
    });
  }
};

module.exports = {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  getOutstandingPayments,
  getContractPayments,
  getPaymentStats,
};