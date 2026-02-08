// src/jobs/vehicleMaintenanceMonitoring.job.js
const cron = require('node-cron');
const { Vehicle, Company, Notification, sequelize } = require('../models'); // FIXED: Import Company from models (not './Company')
const { Op } = require('sequelize');
const { sendEmail } = require('../services/email.service');

/**
 * Check all vehicles for maintenance alerts based on mileage
 */
const checkMaintenanceAlerts = async () => {
  try {
    console.log('🔧 Starting vehicle maintenance check...');
    // Get all active vehicles that need checking
    const vehicles = await Vehicle.findAll({
      where: {
        status: { [Op.in]: ['available', 'rented'] },
      },
      include: [
        {
          model: Company, // FIXED: Use imported Company (no require('./Company'))
          as: 'company',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
    let alertsCreated = 0;
    for (const vehicle of vehicles) {
      const currentMileage = vehicle.mileage;
      const lastAlertMileage = vehicle.last_maintenance_alert_mileage || 0;
      const alertThreshold = vehicle.maintenance_alert_threshold || 100;
     
      // Calculate km since last alert
      const kmSinceLastAlert = currentMileage - lastAlertMileage;
      // Check if we've passed the alert threshold (e.g., every 100km)
      if (kmSinceLastAlert >= alertThreshold) {
        console.log(
          `🔔 Alert: ${vehicle.brand} ${vehicle.model} (${vehicle.registration_number}) - ${kmSinceLastAlert}km since last alert`
        );
        await sendMileageAlert(vehicle, kmSinceLastAlert);
       
        // Update last alert mileage
        await vehicle.update({
          last_maintenance_alert_mileage: currentMileage,
        });
        alertsCreated++;
      }
      // Check if maintenance is due (every 5000km by default)
      const kmSinceLastMaintenance = currentMileage - vehicle.last_maintenance_mileage;
      const maintenanceInterval = vehicle.maintenance_interval_km || 5000;
     
      if (kmSinceLastMaintenance >= maintenanceInterval) {
        console.log(
          `⚠️ MAINTENANCE DUE: ${vehicle.brand} ${vehicle.model} - ${kmSinceLastMaintenance}km since last service`
        );
        await sendMaintenanceDueAlert(vehicle, kmSinceLastMaintenance);
        alertsCreated++;
      }
      // Check if approaching maintenance (within 500km)
      const kmUntilMaintenance = maintenanceInterval - kmSinceLastMaintenance;
      if (kmUntilMaintenance > 0 && kmUntilMaintenance <= 500) {
        console.log(
          `📋 Maintenance approaching: ${vehicle.brand} ${vehicle.model} - ${kmUntilMaintenance}km remaining`
        );
        await sendMaintenanceApproachingAlert(vehicle, kmUntilMaintenance);
      }
    }
    console.log(`✅ Maintenance check completed - ${alertsCreated} alerts created`);
   
  } catch (error) {
    console.error('❌ Maintenance check error:', error);
  }
};

/**
 * Send mileage milestone alert (every 100km)
 */
const sendMileageAlert = async (vehicle, kmTraveled) => {
  const message = `
    Vehicle ${vehicle.brand} ${vehicle.model} (${vehicle.registration_number}) has traveled ${kmTraveled}km since last check.
   
    Current mileage: ${vehicle.mileage}km
    Last maintenance: ${vehicle.last_maintenance_mileage}km
    Next maintenance due at: ${vehicle.next_maintenance_mileage}km
   
    Please review the vehicle condition and schedule maintenance if needed.
  `;
  // Create in-app notification
  await Notification.create({
    company_id: vehicle.company_id,
    type: 'vehicle_maintenance',
    priority: 'low',
    title: `Mileage Update: ${vehicle.brand} ${vehicle.model}`,
    message: `${kmTraveled}km traveled. Current: ${vehicle.mileage}km`,
    data: {
      vehicle_id: vehicle.id,
      registration: vehicle.registration_number,
      current_mileage: vehicle.mileage,
      km_traveled: kmTraveled,
    },
    action_url: `/vehicles/${vehicle.id}`,
  });
  console.log(`📧 Mileage alert created for ${vehicle.registration_number}`);
};

/**
 * Send maintenance due alert (every 5000km or configured interval)
 */
const sendMaintenanceDueAlert = async (vehicle, kmOverdue) => {
  const message = `
    ⚠️ MAINTENANCE DUE
   
    Vehicle: ${vehicle.brand} ${vehicle.model} (${vehicle.registration_number})
    Current mileage: ${vehicle.mileage}km
    Last maintenance: ${vehicle.last_maintenance_mileage}km
    Km since last maintenance: ${kmOverdue}km
   
    IMMEDIATE ACTION REQUIRED:
    This vehicle is due for maintenance service. Please schedule service as soon as possible to:
    - Perform oil change
    - Check filters
    - Inspect brakes and tires
    - General vehicle inspection
   
    Delaying maintenance may result in:
    - Increased repair costs
    - Vehicle breakdown
    - Safety issues
    - Reduced vehicle lifespan
  `;
  // Create high-priority notification
  await Notification.create({
    company_id: vehicle.company_id,
    type: 'vehicle_maintenance',
    priority: 'high',
    title: `⚠️ Maintenance Due: ${vehicle.brand} ${vehicle.model}`,
    message: `${kmOverdue}km since last service. Immediate maintenance required.`,
    data: {
      vehicle_id: vehicle.id,
      registration: vehicle.registration_number,
      current_mileage: vehicle.mileage,
      last_maintenance: vehicle.last_maintenance_mileage,
      km_overdue: kmOverdue,
      maintenance_type: 'regular_service',
    },
    action_url: `/vehicles/${vehicle.id}/maintenance`,
  });
  // Send email to company
  if (vehicle.company && vehicle.company.email) {
    await sendEmail({
      templateType: 'maintenance_due',
      to: vehicle.company.email,
      data: {
        companyName: vehicle.company.name,
        vehicleBrand: vehicle.brand,
        vehicleModel: vehicle.model,
        registration: vehicle.registration_number,
        currentMileage: vehicle.mileage,
        kmOverdue: kmOverdue,
        vehicleUrl: `${process.env.FRONTEND_URL}/vehicles/${vehicle.id}`,
      },
    });
  }
  console.log(`🚨 Maintenance due alert sent for ${vehicle.registration_number}`);
};

/**
 * Send maintenance approaching alert (within 500km)
 */
const sendMaintenanceApproachingAlert = async (vehicle, kmRemaining) => {
  const nextMaintenanceMileage = vehicle.next_maintenance_mileage ||
    (vehicle.last_maintenance_mileage + vehicle.maintenance_interval_km);
  // Only send if we haven't sent this alert recently
  const recentAlert = await Notification.findOne({
    where: {
      company_id: vehicle.company_id,
      type: 'vehicle_maintenance',
      'data.vehicle_id': vehicle.id,
      'data.alert_type': 'approaching',
      created_at: {
        [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
    },
  });
  if (recentAlert) {
    return; // Don't spam with approaching alerts
  }
  await Notification.create({
    company_id: vehicle.company_id,
    type: 'vehicle_maintenance',
    priority: 'medium',
    title: `📋 Maintenance Approaching: ${vehicle.brand} ${vehicle.model}`,
    message: `${kmRemaining}km until maintenance is due. Schedule service soon.`,
    data: {
      vehicle_id: vehicle.id,
      registration: vehicle.registration_number,
      current_mileage: vehicle.mileage,
      next_maintenance: nextMaintenanceMileage,
      km_remaining: kmRemaining,
      alert_type: 'approaching',
    },
    action_url: `/vehicles/${vehicle.id}/maintenance`,
  });
  console.log(`📋 Maintenance approaching alert for ${vehicle.registration_number}`);
};

/**
 * Check for overdue maintenance (vehicles that should be in maintenance status)
 */
const checkOverdueMaintenance = async () => {
  try {
    console.log('🔍 Checking for overdue maintenance...');
    // Find vehicles that are overdue but not in maintenance status
    const overdueVehicles = await Vehicle.findAll({
      where: {
        status: { [Op.in]: ['available', 'rented'] },
        [Op.or]: [
          // Mileage-based overdue (more than 1000km overdue)
          sequelize.literal(`mileage - last_maintenance_mileage > maintenance_interval_km + 1000`),
          // Date-based overdue (next maintenance date passed by more than 30 days)
          {
            next_maintenance_date: {
              [Op.lt]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        ],
      },
      include: [
        {
          model: Company, // FIXED: Use imported Company
          as: 'company',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
    for (const vehicle of overdueVehicles) {
      const kmOverdue = vehicle.mileage - vehicle.last_maintenance_mileage - vehicle.maintenance_interval_km;
     
      console.log(
        `🚨 CRITICAL: ${vehicle.registration_number} is ${kmOverdue}km overdue for maintenance!`
      );
      await Notification.create({
        company_id: vehicle.company_id,
        type: 'vehicle_maintenance',
        priority: 'critical',
        title: `🚨 CRITICAL: Maintenance Overdue`,
        message: `${vehicle.brand} ${vehicle.model} is ${kmOverdue}km overdue. Take vehicle off service immediately.`,
        data: {
          vehicle_id: vehicle.id,
          registration: vehicle.registration_number,
          km_overdue: kmOverdue,
          alert_type: 'critical_overdue',
        },
        action_url: `/vehicles/${vehicle.id}`,
      });
    }
    console.log(`✅ Found ${overdueVehicles.length} critically overdue vehicles`);
   
  } catch (error) {
    console.error('❌ Overdue maintenance check error:', error);
  }
};

/**
 * Schedule maintenance monitoring jobs
 */
const scheduleMaintenanceMonitoring = () => {
  // Run mileage checks every 6 hours
  cron.schedule('0 */6 * * *', () => {
    console.log('⏰ Running maintenance alert check...');
    checkMaintenanceAlerts();
  });
  // Run overdue check daily at 8 AM
  cron.schedule('0 8 * * *', () => {
    console.log('⏰ Running overdue maintenance check...');
    checkOverdueMaintenance();
  });
  console.log('✅ Maintenance monitoring cron jobs scheduled');
  console.log(' - Maintenance alerts: Every 6 hours');
  console.log(' - Overdue check: Daily at 8 AM');
};

module.exports = {
  scheduleMaintenanceMonitoring,
  checkMaintenanceAlerts,
  checkOverdueMaintenance,
};