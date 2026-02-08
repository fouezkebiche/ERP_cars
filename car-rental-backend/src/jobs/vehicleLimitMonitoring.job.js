// src/jobs/vehicleLimitMonitoring.job.js
const cron = require('node-cron');
const { Company, Vehicle, sequelize } = require('../models');
const { Op } = require('sequelize');

// Plan limits configuration
const PLAN_LIMITS = {
  basic: {
    max_vehicles: 20,
    warning_threshold: 0.75, // Alert at 75% (15 vehicles)
    critical_threshold: 0.90, // Alert at 90% (18 vehicles)
  },
  professional: {
    max_vehicles: 150,
    warning_threshold: 0.80, // Alert at 80% (120 vehicles)
    critical_threshold: 0.95, // Alert at 95% (142 vehicles)
  },
  enterprise: {
    max_vehicles: 500,
    warning_threshold: 0.85,
    critical_threshold: 0.95,
  },
};

/**
 * Check vehicle limits for all active companies
 */
const checkVehicleLimits = async () => {
  try {
    console.log('🔍 Starting vehicle limit check...');

    // Get all active companies
    const companies = await Company.findAll({
      where: {
        subscription_status: 'active',
      },
      attributes: ['id', 'name', 'email', 'subscription_plan'],
    });

    for (const company of companies) {
      const planConfig = PLAN_LIMITS[company.subscription_plan];
      
      if (!planConfig) {
        console.warn(`⚠️ Unknown plan: ${company.subscription_plan} for company ${company.name}`);
        continue;
      }

      // Count active vehicles (exclude retired)
      const vehicleCount = await Vehicle.count({
        where: {
          company_id: company.id,
          status: { [Op.ne]: 'retired' },
        },
      });

      const maxVehicles = planConfig.max_vehicles;
      const usagePercentage = (vehicleCount / maxVehicles) * 100;
      const remainingSlots = maxVehicles - vehicleCount;

      console.log(
        `📊 ${company.name}: ${vehicleCount}/${maxVehicles} vehicles (${usagePercentage.toFixed(1)}%)`
      );

      // Check thresholds and send notifications
      if (vehicleCount >= maxVehicles) {
        // Limit reached
        await sendLimitReachedNotification(company, vehicleCount, maxVehicles);
      } else if (usagePercentage >= planConfig.critical_threshold * 100) {
        // Critical threshold (e.g., 90-95%)
        await sendCriticalWarningNotification(
          company,
          vehicleCount,
          maxVehicles,
          remainingSlots
        );
      } else if (usagePercentage >= planConfig.warning_threshold * 100) {
        // Warning threshold (e.g., 75-80%)
        await sendWarningNotification(
          company,
          vehicleCount,
          maxVehicles,
          remainingSlots
        );
      }
    }

    console.log('✅ Vehicle limit check completed');
  } catch (error) {
    console.error('❌ Vehicle limit check error:', error);
  }
};

/**
 * Send warning notification (75-80% usage)
 */
const sendWarningNotification = async (company, current, max, remaining) => {
  const message = `
    Your fleet is growing! You currently have ${current} out of ${max} vehicles on your ${company.subscription_plan} plan.
    
    You have ${remaining} vehicle slots remaining. Consider upgrading to ensure uninterrupted service.
  `;

  console.log(`⚠️ WARNING: ${company.name} - ${current}/${max} vehicles`);

  // TODO: Send email notification
  await sendEmail({
    to: company.email,
    subject: 'Fleet Capacity Notification - Action Recommended',
    message: message,
    type: 'warning',
  });

  // TODO: Create in-app notification
  await createNotification({
    company_id: company.id,
    type: 'vehicle_limit_warning',
    priority: 'medium',
    title: 'Fleet Capacity Warning',
    message: `You have ${remaining} vehicle slots remaining on your ${company.subscription_plan} plan.`,
    data: { current, max, remaining },
  });
};

/**
 * Send critical warning (90-95% usage)
 */
const sendCriticalWarningNotification = async (company, current, max, remaining) => {
  const message = `
    ⚠️ URGENT: Your fleet is almost at capacity!
    
    Current vehicles: ${current}/${max} (${remaining} slots remaining)
    Plan: ${company.subscription_plan.toUpperCase()}
    
    To avoid service disruption, please upgrade your plan immediately.
    Upgrade now to unlock more capacity and premium features.
  `;

  console.log(`🚨 CRITICAL: ${company.name} - ${current}/${max} vehicles`);

  await sendEmail({
    to: company.email,
    subject: '🚨 URGENT: Fleet Capacity Almost Reached',
    message: message,
    type: 'critical',
  });

  await createNotification({
    company_id: company.id,
    type: 'vehicle_limit_critical',
    priority: 'high',
    title: 'URGENT: Fleet Almost Full',
    message: `Only ${remaining} vehicle slots left! Upgrade to avoid disruption.`,
    data: { current, max, remaining },
  });
};

/**
 * Send limit reached notification
 */
const sendLimitReachedNotification = async (company, current, max) => {
  const message = `
    🛑 FLEET LIMIT REACHED
    
    You have reached your maximum vehicle capacity of ${max} vehicles on the ${company.subscription_plan} plan.
    
    To add more vehicles, please upgrade your subscription plan immediately.
    
    Upgrade benefits:
    - Professional Plan: Up to 150 vehicles
    - Enterprise Plan: Up to 500 vehicles + priority support
    
    Contact us or upgrade through your dashboard.
  `;

  console.log(`🛑 LIMIT REACHED: ${company.name} - ${current}/${max} vehicles`);

  await sendEmail({
    to: company.email,
    subject: '🛑 Fleet Limit Reached - Upgrade Required',
    message: message,
    type: 'limit_reached',
  });

  await createNotification({
    company_id: company.id,
    type: 'vehicle_limit_reached',
    priority: 'critical',
    title: 'Fleet Limit Reached',
    message: `You've reached the maximum of ${max} vehicles. Upgrade to add more.`,
    data: { current, max },
  });
};

/**
 * Mock email service (replace with actual implementation)
 */
const sendEmail = async ({ to, subject, message, type }) => {
  // TODO: Integrate with actual email service (Nodemailer, SendGrid, etc.)
  console.log(`📧 Email sent to ${to}: ${subject}`);
  console.log(`   Type: ${type}`);
  console.log(`   Message: ${message.trim()}`);
};

/**
 * Mock notification service (replace with actual implementation)
 */
const createNotification = async (notificationData) => {
  try {
    const { Notification } = require('../models');
    await Notification.create(notificationData);
    console.log(`🔔 Notification created:`, notificationData.title);
  } catch (error) {
    console.error('Failed to create notification:', error.message);
  }
};

/**
 * Schedule the cron job
 * Runs daily at 9 AM
 */
const scheduleVehicleLimitCheck = () => {
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', () => {
    console.log('⏰ Running scheduled vehicle limit check...');
    checkVehicleLimits();
  });

  console.log('✅ Vehicle limit monitoring cron job scheduled (daily at 9 AM)');
};

// Export for manual testing
module.exports = {
  scheduleVehicleLimitCheck,
  checkVehicleLimits, // For manual execution
  PLAN_LIMITS, // For reference
};