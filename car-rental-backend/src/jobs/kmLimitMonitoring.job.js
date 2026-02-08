// src/jobs/kmLimitMonitoring.job.js
const cron = require('node-cron');
const { Contract, Customer, Vehicle, Notification, sequelize } = require('../models');
const { Op } = require('sequelize');
const { sendEmail } = require('../services/email.service');
const { calculateAllowedKm } = require('../services/customerTier.service');

/**
 * Check active contracts for km limit warnings
 */
const checkKmLimitAlerts = async () => {
  try {
    console.log('📏 Starting KM limit check for active contracts...');

    // Get all active contracts with vehicle and customer
    const activeContracts = await Contract.findAll({
      where: {
        status: 'active',
        start_mileage: { [Op.ne]: null },
      },
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'brand', 'model', 'registration_number', 'mileage'],
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'full_name', 'email', 'phone', 'total_rentals', 'apply_tier_discount'],
        },
      ],
    });

    console.log(`📋 Checking ${activeContracts.length} active contracts...`);

    let alertsCreated = 0;

    for (const contract of activeContracts) {
      // Calculate current km driven
      const currentVehicleMileage = contract.vehicle.mileage;
      const kmDriven = currentVehicleMileage - contract.start_mileage;

      // Get allowed km with tier bonuses (respect customer apply_tier_discount)
      const applyTier = contract.customer.apply_tier_discount !== false;
      const allowedKmInfo = calculateAllowedKm(
        contract.daily_km_limit || 300,
        contract.total_days,
        contract.customer.total_rentals,
        { applyTierBonus: applyTier }
      );

      const totalAllowed = allowedKmInfo.total_km_allowed;
      const kmRemaining = totalAllowed - kmDriven;
      const percentageUsed = (kmDriven / totalAllowed) * 100;

      // Check thresholds
      if (kmDriven >= totalAllowed) {
        // Already exceeded limit
        await sendLimitExceededAlert(contract, kmDriven - totalAllowed, allowedKmInfo);
        alertsCreated++;
      } else if (percentageUsed >= 90) {
        // 90% of limit used (critical warning)
        await sendCriticalKmWarning(contract, kmRemaining, percentageUsed, allowedKmInfo);
        alertsCreated++;
      } else if (percentageUsed >= 75) {
        // 75% of limit used (warning)
        await sendKmWarning(contract, kmRemaining, percentageUsed, allowedKmInfo);
        alertsCreated++;
      }
    }

    console.log(`✅ KM limit check completed - ${alertsCreated} alerts created`);
  } catch (error) {
    console.error('❌ KM limit check error:', error);
  }
};

/**
 * Send warning when 75% of km limit is used
 */
const sendKmWarning = async (contract, kmRemaining, percentageUsed, allowedKmInfo) => {
  // Check if we already sent this alert recently (within 24 hours)
  const recentAlert = await Notification.findOne({
    where: {
      company_id: contract.company_id,
      type: 'km_limit_warning',
      'data.contract_id': contract.id,
      created_at: {
        [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });

  if (recentAlert) return; // Don't spam

  await Notification.create({
    company_id: contract.company_id,
    type: 'km_limit_warning',
    priority: 'medium',
    title: `⚠️ KM Limit Warning: ${contract.contract_number}`,
    message: `Vehicle ${contract.vehicle.brand} ${contract.vehicle.model} has ${kmRemaining}km remaining (${percentageUsed.toFixed(0)}% used). Customer: ${contract.customer.full_name}`,
    data: {
      contract_id: contract.id,
      contract_number: contract.contract_number,
      customer_id: contract.customer_id,
      vehicle_id: contract.vehicle_id,
      km_remaining: kmRemaining,
      percentage_used: percentageUsed,
      total_allowed: allowedKmInfo.total_km_allowed,
      tier: allowedKmInfo.tier_name,
    },
    action_url: `/contracts/${contract.id}`,
  });

  console.log(`⚠️ KM warning: ${contract.contract_number} - ${kmRemaining}km remaining`);
};

/**
 * Send critical warning when 90% of km limit is used
 */
const sendCriticalKmWarning = async (contract, kmRemaining, percentageUsed, allowedKmInfo) => {
  const recentAlert = await Notification.findOne({
    where: {
      company_id: contract.company_id,
      type: 'km_limit_critical',
      'data.contract_id': contract.id,
      created_at: {
        [Op.gte]: new Date(Date.now() - 12 * 60 * 60 * 1000), // Last 12 hours
      },
    },
  });

  if (recentAlert) return;

  await Notification.create({
    company_id: contract.company_id,
    type: 'km_limit_critical',
    priority: 'high',
    title: `🚨 URGENT: KM Limit Almost Reached`,
    message: `Contract ${contract.contract_number}: Only ${kmRemaining}km remaining! Customer ${contract.customer.full_name} should be notified immediately.`,
    data: {
      contract_id: contract.id,
      contract_number: contract.contract_number,
      customer_name: contract.customer.full_name,
      customer_phone: contract.customer.phone,
      vehicle: `${contract.vehicle.brand} ${contract.vehicle.model}`,
      registration: contract.vehicle.registration_number,
      km_remaining: kmRemaining,
      percentage_used: percentageUsed,
      total_allowed: allowedKmInfo.total_km_allowed,
      alert_type: 'critical',
    },
    action_url: `/contracts/${contract.id}`,
  });

  // TODO: Send SMS to customer
  console.log(`🚨 CRITICAL: ${contract.contract_number} - Only ${kmRemaining}km left!`);
  console.log(`   Contact customer: ${contract.customer.full_name} (${contract.customer.phone})`);
};

/**
 * Send alert when km limit is exceeded
 */
const sendLimitExceededAlert = async (contract, kmOver, allowedKmInfo) => {
  const recentAlert = await Notification.findOne({
    where: {
      company_id: contract.company_id,
      type: 'km_limit_exceeded',
      'data.contract_id': contract.id,
      created_at: {
        [Op.gte]: new Date(Date.now() - 6 * 60 * 60 * 1000), // Last 6 hours
      },
    },
  });

  if (recentAlert) return;

  const currentMileage = contract.vehicle.mileage;
  const kmDriven = currentMileage - contract.start_mileage;

  await Notification.create({
    company_id: contract.company_id,
    type: 'km_limit_exceeded',
    priority: 'critical',
    title: `🛑 KM Limit EXCEEDED: ${contract.contract_number}`,
    message: `Customer ${contract.customer.full_name} has exceeded km limit by ${kmOver}km! Current overage charges will apply. Contact customer immediately.`,
    data: {
      contract_id: contract.id,
      contract_number: contract.contract_number,
      customer_name: contract.customer.full_name,
      customer_phone: contract.customer.phone,
      customer_email: contract.customer.email,
      vehicle: `${contract.vehicle.brand} ${contract.vehicle.model}`,
      registration: contract.vehicle.registration_number,
      km_driven: kmDriven,
      km_allowed: allowedKmInfo.total_km_allowed,
      km_exceeded: kmOver,
      overage_rate: contract.overage_rate_per_km,
      estimated_charges: kmOver * parseFloat(contract.overage_rate_per_km || 0),
      alert_type: 'exceeded',
    },
    action_url: `/contracts/${contract.id}`,
  });

  console.log(`🛑 LIMIT EXCEEDED: ${contract.contract_number}`);
  console.log(`   Customer: ${contract.customer.full_name}`);
  console.log(`   Over limit by: ${kmOver}km`);
  console.log(`   Estimated overage: ${kmOver * parseFloat(contract.overage_rate_per_km || 0)} DA`);
};

/**
 * Schedule KM limit monitoring
 */
const scheduleKmLimitMonitoring = () => {
  // Run every 4 hours
  cron.schedule('0 */4 * * *', () => {
    console.log('⏰ Running KM limit check...');
    checkKmLimitAlerts();
  });

  console.log('✅ KM limit monitoring scheduled (every 4 hours)');
};

module.exports = {
  scheduleKmLimitMonitoring,
  checkKmLimitAlerts, // For manual execution
};