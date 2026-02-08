// src/controllers/vehicleMaintenance.controller.js
const { Vehicle, VehicleCost, Notification, sequelize } = require('../models');
const { sendSuccess, sendError } = require('../utils/response.util');
const { body, validationResult } = require('express-validator');
const { applyTenantFilter } = require('../middleware/tenantIsolation.middleware');

/**
 * POST /api/vehicles/:id/maintenance/complete
 * Record maintenance completion and update vehicle
 */
const completeMaintenanceService = [
  body('mileage').isInt({ min: 0 }).withMessage('Valid mileage required'),
  body('service_type')
    .isIn(['oil_change', 'full_service', 'tire_change', 'brake_service', 'general_inspection', 'other'])
    .withMessage('Valid service type required'),
  body('cost').isFloat({ min: 0 }).withMessage('Valid cost required'),
  body('description').optional().trim(),
  body('next_service_km').optional().isInt({ min: 0 }),
  body('performed_date').isISO8601().withMessage('Valid date required'),

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

      const { id: vehicle_id } = req.params;
      const {
        mileage,
        service_type,
        cost,
        description,
        next_service_km,
        performed_date,
        parts_replaced,
        technician_name,
        service_center,
      } = req.body;

      // Get vehicle
      const vehicle = await Vehicle.findOne({
        where: applyTenantFilter(req, { id: vehicle_id }),
      });

      if (!vehicle) {
        await transaction.rollback();
        return sendError(res, { statusCode: 404, message: 'Vehicle not found' });
      }

      // Record maintenance cost
      const maintenanceCost = await VehicleCost.create(
        {
          vehicle_id: vehicle.id,
          cost_type: 'maintenance',
          amount: cost,
          incurred_date: performed_date,
          description: `${service_type.replace('_', ' ').toUpperCase()}: ${description || 'Maintenance service'}`,
          created_by: req.user.id,
          metadata: {
            service_type,
            parts_replaced,
            technician_name,
            service_center,
            mileage_at_service: mileage,
          },
        },
        { transaction }
      );

      // Update vehicle maintenance tracking
      const updateData = {
        mileage: Math.max(mileage, vehicle.mileage), // Use higher value
        last_maintenance_mileage: mileage,
        last_maintenance_date: performed_date,
        maintenance_count: vehicle.maintenance_count + 1,
        total_maintenance_costs: parseFloat(vehicle.total_maintenance_costs || 0) + parseFloat(cost),
        last_maintenance_alert_mileage: mileage, // Reset alert counter
      };

      // Calculate next maintenance mileage
      if (next_service_km) {
        updateData.next_maintenance_mileage = mileage + next_service_km;
      } else {
        updateData.next_maintenance_mileage = mileage + vehicle.maintenance_interval_km;
      }

      // Update specific service dates
      if (service_type === 'oil_change') {
        updateData.last_oil_change_mileage = mileage;
        updateData.last_oil_change_date = performed_date;
      }

      // If vehicle was in maintenance, return to available
      if (vehicle.status === 'maintenance') {
        updateData.status = 'available';
      }

      await vehicle.update(updateData, { transaction });

      // Create notification
      await Notification.create(
        {
          company_id: vehicle.company_id,
          type: 'vehicle_maintenance',
          priority: 'low',
          title: `Maintenance Completed: ${vehicle.brand} ${vehicle.model}`,
          message: `${service_type.replace('_', ' ')} completed at ${mileage}km. Next service due at ${updateData.next_maintenance_mileage}km.`,
          data: {
            vehicle_id: vehicle.id,
            registration: vehicle.registration_number,
            service_type,
            cost,
            mileage,
            next_maintenance: updateData.next_maintenance_mileage,
          },
          action_url: `/vehicles/${vehicle.id}`,
        },
        { transaction }
      );

      await transaction.commit();

      console.log(`🔧 Maintenance completed for ${vehicle.registration_number}`);

      sendSuccess(res, {
        message: 'Maintenance service recorded successfully',
        data: {
          vehicle,
          maintenance_cost: maintenanceCost,
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error('💥 Complete maintenance error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to record maintenance',
        details: error.message,
      });
    }
  },
];

/**
 * GET /api/vehicles/:id/maintenance/history
 * Get maintenance history for a vehicle
 */
const getMaintenanceHistory = async (req, res) => {
  try {
    const { id: vehicle_id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const vehicle = await Vehicle.findOne({
      where: applyTenantFilter(req, { id: vehicle_id }),
    });

    if (!vehicle) {
      return sendError(res, { statusCode: 404, message: 'Vehicle not found' });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: maintenanceRecords } = await VehicleCost.findAndCountAll({
      where: {
        vehicle_id,
        cost_type: 'maintenance',
      },
      limit: parseInt(limit),
      offset,
      order: [['incurred_date', 'DESC']],
    });

    // Calculate maintenance statistics
    const stats = {
      total_maintenance_count: vehicle.maintenance_count,
      total_maintenance_costs: parseFloat(vehicle.total_maintenance_costs || 0),
      average_cost_per_service:
        vehicle.maintenance_count > 0
          ? parseFloat(vehicle.total_maintenance_costs) / vehicle.maintenance_count
          : 0,
      last_maintenance_date: vehicle.last_maintenance_date,
      last_maintenance_mileage: vehicle.last_maintenance_mileage,
      next_maintenance_mileage: vehicle.next_maintenance_mileage,
      km_until_next_maintenance: vehicle.next_maintenance_mileage - vehicle.mileage,
      maintenance_interval_km: vehicle.maintenance_interval_km,
    };

    sendSuccess(res, {
      message: 'Maintenance history fetched successfully',
      data: {
        vehicle: {
          id: vehicle.id,
          brand: vehicle.brand,
          model: vehicle.model,
          registration: vehicle.registration_number,
          current_mileage: vehicle.mileage,
        },
        maintenance_records: maintenanceRecords,
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
    console.error('💥 Get maintenance history error:', error);
    sendError(res, {
      statusCode: 500,
      message: 'Failed to fetch maintenance history',
      details: error.message,
    });
  }
};

/**
 * GET /api/vehicles/maintenance/due
 * Get all vehicles that need maintenance
 */
const getVehiclesDueMaintenance = async (req, res) => {
  try {
    const companyFilter = applyTenantFilter(req);
    const { status = 'all' } = req.query;

    // Build query based on status
    let whereClause = { ...companyFilter };

    if (status === 'overdue') {
      // Vehicles overdue for maintenance
      whereClause = {
        ...whereClause,
        [sequelize.Op.or]: [
          sequelize.literal('mileage >= next_maintenance_mileage'),
          sequelize.literal('mileage - last_maintenance_mileage >= maintenance_interval_km'),
        ],
      };
    } else if (status === 'upcoming') {
      // Vehicles approaching maintenance (within 500km)
      whereClause = {
        ...whereClause,
        [sequelize.Op.and]: [
          sequelize.literal('mileage < next_maintenance_mileage'),
          sequelize.literal('next_maintenance_mileage - mileage <= 500'),
        ],
      };
    }

    const vehicles = await Vehicle.findAll({
      where: whereClause,
      attributes: [
        'id',
        'brand',
        'model',
        'registration_number',
        'mileage',
        'last_maintenance_mileage',
        'next_maintenance_mileage',
        'last_maintenance_date',
        'maintenance_interval_km',
        'status',
        [
          sequelize.literal('mileage - last_maintenance_mileage'),
          'km_since_last_maintenance',
        ],
        [
          sequelize.literal('next_maintenance_mileage - mileage'),
          'km_until_maintenance',
        ],
      ],
      order: [
        [sequelize.literal('next_maintenance_mileage - mileage'), 'ASC'],
      ],
    });

    // Categorize vehicles
    const categorized = {
      critical_overdue: vehicles.filter(
        (v) => v.mileage - v.last_maintenance_mileage > v.maintenance_interval_km + 1000
      ),
      overdue: vehicles.filter(
        (v) =>
          v.mileage >= v.next_maintenance_mileage &&
          v.mileage - v.last_maintenance_mileage <= v.maintenance_interval_km + 1000
      ),
      upcoming: vehicles.filter(
        (v) => v.mileage < v.next_maintenance_mileage && v.next_maintenance_mileage - v.mileage <= 500
      ),
    };

    sendSuccess(res, {
      message: 'Vehicles maintenance status fetched successfully',
      data: {
        summary: {
          total: vehicles.length,
          critical_overdue: categorized.critical_overdue.length,
          overdue: categorized.overdue.length,
          upcoming: categorized.upcoming.length,
        },
        vehicles: categorized,
      },
    });
  } catch (error) {
    console.error('💥 Get vehicles due maintenance error:', error);
    sendError(res, {
      statusCode: 500,
      message: 'Failed to fetch vehicles due maintenance',
      details: error.message,
    });
  }
};

module.exports = {
  completeMaintenanceService,
  getMaintenanceHistory,
  getVehiclesDueMaintenance,
};