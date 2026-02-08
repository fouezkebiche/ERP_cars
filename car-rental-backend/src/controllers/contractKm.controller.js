// src/controllers/contractKm.controller.js
const { Contract, Customer, Vehicle, Payment, Notification, sequelize } = require('../models');
const { sendSuccess, sendError } = require('../utils/response.util');
const { body, validationResult } = require('express-validator');
const { applyTenantFilter } = require('../middleware/tenantIsolation.middleware');
const {
  calculateOverageRate,
  calculateAllowedKm,
  calculateOverageCharges,
  getCustomerTierInfo,
} = require('../services/customerTier.service');

/**
 * POST /api/contracts/:id/complete-with-mileage
 * Complete contract with mileage verification and overage calculation
 */
const completeContractWithMileage = [
  body('end_mileage').isInt({ min: 0 }).withMessage('Valid end mileage required'),
  body('actual_return_date').isISO8601().withMessage('Valid return date required'),
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
      const { end_mileage, actual_return_date, additional_charges, notes } = req.body;

      // Get contract with customer and vehicle
      const contract = await Contract.findOne({
        where: applyTenantFilter(req, { id }),
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'full_name', 'email', 'total_rentals', 'lifetime_value', 'apply_tier_discount'],
          },
          {
            model: Vehicle,
            as: 'vehicle',
            attributes: ['id', 'brand', 'model', 'registration_number', 'mileage'],
          },
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
          message: `Cannot complete ${contract.status} contract`,
        });
      }

      // Validate end mileage is greater than start mileage
      if (end_mileage < contract.start_mileage) {
        await transaction.rollback();
        return sendError(res, {
          statusCode: 422,
          message: `End mileage (${end_mileage}) cannot be less than start mileage (${contract.start_mileage})`,
        });
      }

      // Calculate km driven
      const actualKmDriven = end_mileage - contract.start_mileage;

      // Get customer tier info
      const customerTier = getCustomerTierInfo(contract.customer);

      // Calculate allowed km with tier bonus (respect customer apply_tier_discount)
      const applyTier = contract.customer.apply_tier_discount !== false;
      const allowedKmInfo = calculateAllowedKm(
        contract.daily_km_limit || 300,
        contract.total_days,
        contract.customer.total_rentals,
        { applyTierBonus: applyTier }
      );

      // Calculate overage
      const kmOverage = Math.max(0, actualKmDriven - allowedKmInfo.total_km_allowed);

      // Get overage rate for this customer
      const overageRate = calculateOverageRate(contract.customer);

      // Calculate overage charges with tier discount (respect customer apply_tier_discount)
      const overageInfo = calculateOverageCharges(
        kmOverage,
        overageRate,
        contract.customer.total_rentals,
        { applyTierDiscount: applyTier }
      );

      // Prepare update data
      const updateData = {
        status: 'completed',
        actual_return_date,
        end_mileage,
        actual_km_driven: actualKmDriven,
        km_overage: kmOverage,
        overage_rate_per_km: overageRate,
        overage_charges: overageInfo.final_overage_charges,
        deposit_returned: true,
      };

      // Add additional charges if provided
      const extraCharges = parseFloat(additional_charges || 0);
      const totalAdditionalCharges = 
        parseFloat(contract.additional_charges || 0) + 
        extraCharges + 
        overageInfo.final_overage_charges;

      updateData.additional_charges = totalAdditionalCharges;

      // Recalculate total amount
      const baseAmount = parseFloat(contract.base_amount);
      const discountAmount = parseFloat(contract.discount_amount || 0);
      const subtotal = baseAmount + totalAdditionalCharges - discountAmount;
      const taxAmount = subtotal * 0.19; // 19% tax
      const totalAmount = subtotal + taxAmount;

      updateData.tax_amount = taxAmount;
      updateData.total_amount = totalAmount;

      // Add notes about overage
      if (kmOverage > 0) {
        const overageNote = `\nKM Overage: ${kmOverage}km driven beyond ${allowedKmInfo.total_km_allowed}km limit. ` +
          `Base charge: ${overageInfo.base_overage_charges} DA, ` +
          `Tier discount (${customerTier.tier} - ${overageInfo.discount_percentage}%): -${overageInfo.discount_amount} DA, ` +
          `Final overage charge: ${overageInfo.final_overage_charges} DA.`;
        updateData.notes = (notes || contract.notes || '') + overageNote;
      } else if (notes) {
        updateData.notes = notes;
      }

      // Update contract
      await contract.update(updateData, { transaction });

      // Update vehicle mileage
      await contract.vehicle.update(
        { mileage: end_mileage, status: 'available' },
        { transaction }
      );

      // Create notification if overage occurred
      if (kmOverage > 0) {
        await Notification.create(
          {
            company_id: contract.company_id,
            type: 'contract_overage',
            priority: kmOverage > 100 ? 'high' : 'medium',
            title: `KM Overage: ${contract.contract_number}`,
            message: `Customer ${contract.customer.full_name} exceeded limit by ${kmOverage}km. Additional charge: ${overageInfo.final_overage_charges} DA (${customerTier.tier_name} tier discount applied).`,
            data: {
              contract_id: contract.id,
              contract_number: contract.contract_number,
              customer_id: contract.customer_id,
              vehicle_id: contract.vehicle_id,
              km_overage: kmOverage,
              overage_charges: overageInfo.final_overage_charges,
              customer_tier: customerTier.tier,
              ...overageInfo,
            },
            action_url: `/contracts/${contract.id}`,
          },
          { transaction }
        );
      }

      await transaction.commit();

      console.log(`✅ Contract completed: ${contract.contract_number}`);
      console.log(`   Km driven: ${actualKmDriven}km (allowed: ${allowedKmInfo.total_km_allowed}km)`);
      if (kmOverage > 0) {
        console.log(`   Overage: ${kmOverage}km × ${overageRate} DA = ${overageInfo.base_overage_charges} DA`);
        console.log(`   Tier discount: -${overageInfo.discount_amount} DA (${customerTier.tier_name})`);
        console.log(`   Final overage: ${overageInfo.final_overage_charges} DA`);
      }

      // Return detailed response
      sendSuccess(res, {
        message: 'Contract completed successfully',
        data: {
          contract,
          mileage_summary: {
            start_mileage: contract.start_mileage,
            end_mileage: end_mileage,
            km_driven: actualKmDriven,
            daily_limit: contract.daily_km_limit,
            total_days: contract.total_days,
            base_km_allowed: contract.daily_km_limit * contract.total_days,
            tier_bonus_km: allowedKmInfo.bonus_km_per_day * contract.total_days,
            total_km_allowed: allowedKmInfo.total_km_allowed,
            km_overage: kmOverage,
            within_limit: kmOverage === 0,
          },
          overage_details: kmOverage > 0 ? {
            ...overageInfo,
            customer_tier: customerTier.tier_name,
            tier_benefits_applied: true,
          } : null,
          customer_tier: {
            tier: customerTier.tier,
            tier_name: customerTier.name,
            benefits: customerTier.benefits,
            overage_rate: customerTier.overage_rate,
          },
          billing: {
            base_amount: baseAmount,
            overage_charges: overageInfo.final_overage_charges,
            other_charges: extraCharges,
            total_additional_charges: totalAdditionalCharges,
            discount: discountAmount,
            subtotal: subtotal,
            tax: taxAmount,
            total: totalAmount,
          },
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error('💥 Complete contract with mileage error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to complete contract',
        details: error.message,
      });
    }
  },
];

/**
 * GET /api/contracts/:id/mileage-estimate
 * Calculate mileage overage estimate before contract completion
 */
const estimateOverageCharges = async (req, res) => {
  try {
    const { id } = req.params;
    const { estimated_end_mileage } = req.query;

    if (!estimated_end_mileage) {
      return sendError(res, {
        statusCode: 422,
        message: 'estimated_end_mileage query parameter required',
      });
    }

    const contract = await Contract.findOne({
      where: applyTenantFilter(req, { id }),
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'full_name', 'total_rentals', 'apply_tier_discount'],
        },
      ],
    });

    if (!contract) {
      return sendError(res, { statusCode: 404, message: 'Contract not found' });
    }

    const estimatedKmDriven = parseInt(estimated_end_mileage) - contract.start_mileage;
    const applyTier = contract.customer.apply_tier_discount !== false;

    // Get allowed km with tier bonus (respect customer apply_tier_discount)
    const allowedKmInfo = calculateAllowedKm(
      contract.daily_km_limit || 300,
      contract.total_days,
      contract.customer.total_rentals,
      { applyTierBonus: applyTier }
    );

    const kmOverage = Math.max(0, estimatedKmDriven - allowedKmInfo.total_km_allowed);

    // Get customer overage rate
    const overageRate = calculateOverageRate(contract.customer);

    // Calculate overage charges (respect customer apply_tier_discount)
    const overageInfo = calculateOverageCharges(
      kmOverage,
      overageRate,
      contract.customer.total_rentals,
      { applyTierDiscount: applyTier }
    );

    sendSuccess(res, {
      message: 'Overage estimate calculated',
      data: {
        contract_id: contract.id,
        contract_number: contract.contract_number,
        start_mileage: contract.start_mileage,
        estimated_end_mileage: parseInt(estimated_end_mileage),
        estimated_km_driven: estimatedKmDriven,
        allowed_km: allowedKmInfo,
        estimated_overage: overageInfo,
        customer_tier: overageInfo.tier_name,
        warning: kmOverage > 0 ? `Customer will be charged ${overageInfo.final_overage_charges} DA for ${kmOverage}km overage` : null,
      },
    });
  } catch (error) {
    console.error('💥 Estimate overage error:', error);
    sendError(res, {
      statusCode: 500,
      message: 'Failed to estimate overage',
      details: error.message,
    });
  }
};

/**
 * GET /api/customers/:id/tier-info
 * Get customer tier information and benefits
 */
const getCustomerTierInfoEndpoint = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findOne({
      where: applyTenantFilter(req, { id }),
    });

    if (!customer) {
      return sendError(res, { statusCode: 404, message: 'Customer not found' });
    }

    const tierInfo = getCustomerTierInfo(customer);

    sendSuccess(res, {
      message: 'Customer tier information fetched',
      data: tierInfo,
    });
  } catch (error) {
    console.error('💥 Get customer tier info error:', error);
    sendError(res, {
      statusCode: 500,
      message: 'Failed to fetch tier information',
      details: error.message,
    });
  }
};

/**
 * Helper: Calculate contract with KM limits for creation
 * Use this when creating contracts to auto-set km allowances
 */
const calculateContractWithKmLimits = (contractData, customer) => {
  const { start_date, end_date, daily_km_limit = 300 } = contractData;
  
  // Calculate total days
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  
  const applyTier = customer.apply_tier_discount !== false;
  
  // Get allowed km with tier bonuses (respect customer apply_tier_discount)
  const allowedKmInfo = calculateAllowedKm(
    daily_km_limit,
    totalDays,
    customer.total_rentals || 0,
    { applyTierBonus: applyTier }
  );
  
  // Get customer overage rate (respects apply_tier_discount)
  const overageRate = calculateOverageRate(customer);
  
  return {
    daily_km_limit,
    total_days: totalDays,
    total_km_allowed: allowedKmInfo.total_km_allowed,
    overage_rate_per_km: overageRate,
    tier_info: {
      tier: allowedKmInfo.tier,
      tier_name: allowedKmInfo.tier_name,
      base_daily_limit: allowedKmInfo.base_daily_limit,
      bonus_km_per_day: allowedKmInfo.bonus_km_per_day,
      total_daily_limit: allowedKmInfo.total_daily_limit,
    },
  };
};

module.exports = {
  completeContractWithMileage,
  estimateOverageCharges,
  getCustomerTierInfoEndpoint,
  calculateContractWithKmLimits, // Export for use in contract creation
};