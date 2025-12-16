// src/controllers/vehicle.controller.js
const { Vehicle, VehicleCost, Contract } = require('../models');
const { sendSuccess, sendError } = require('../utils/response.util');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { applyTenantFilter, applyTenantData } = require('../middleware/tenantIsolation.middleware');

// ============================================
// GET /api/vehicles - List all vehicles (with filters)
// ============================================
const getAllVehicles = async (req, res) => {
  try {
    const {
      status,
      brand,
      transmission,
      fuel_type,
      min_rate,
      max_rate,
      search,
      page = 1,
      limit = 10,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = req.query;

    // Build filter object with tenant isolation
    const whereClause = applyTenantFilter(req);

    // Apply status filter
    if (status) {
      whereClause.status = status;
    }

    // Apply brand filter
    if (brand) {
      whereClause.brand = brand;
    }

    // Apply transmission filter
    if (transmission) {
      whereClause.transmission = transmission;
    }

    // Apply fuel type filter
    if (fuel_type) {
      whereClause.fuel_type = fuel_type;
    }

    // Apply rate range filter
    if (min_rate || max_rate) {
      whereClause.daily_rate = {};
      if (min_rate) whereClause.daily_rate[Op.gte] = parseFloat(min_rate);
      if (max_rate) whereClause.daily_rate[Op.lte] = parseFloat(max_rate);
    }

    // Apply search (brand, model, registration_number)
    if (search) {
      whereClause[Op.or] = [
        { brand: { [Op.iLike]: `%${search}%` } },
        { model: { [Op.iLike]: `%${search}%` } },
        { registration_number: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Fetch vehicles
    const { count, rows: vehicles } = await Vehicle.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [[sort_by, sort_order.toUpperCase()]],
    });

    console.log(`📋 Fetched ${vehicles.length} vehicles for company ${req.companyId}`);

    sendSuccess(res, {
      message: 'Vehicles fetched successfully',
      data: { vehicles },
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
    console.error('💥 Get vehicles error:', error);
    sendError(res, {
      statusCode: 500,
      message: 'Failed to fetch vehicles',
      details: error.message,
    });
  }
};

// ============================================
// GET /api/vehicles/available - Get available vehicles
// ============================================
const getAvailableVehicles = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // Build filter for available vehicles
    const whereClause = applyTenantFilter(req, { status: 'available' });

    // If dates provided, check for conflicts with existing contracts
    let vehicles;
    if (start_date && end_date) {
      // Find vehicles that don't have active contracts in the date range
      vehicles = await Vehicle.findAll({
        where: whereClause,
        include: [
          {
            model: Contract,
            as: 'contracts',
            where: {
              status: 'active',
              [Op.or]: [
                {
                  start_date: { [Op.between]: [start_date, end_date] },
                },
                {
                  end_date: { [Op.between]: [start_date, end_date] },
                },
                {
                  [Op.and]: [
                    { start_date: { [Op.lte]: start_date } },
                    { end_date: { [Op.gte]: end_date } },
                  ],
                },
              ],
            },
            required: false, // LEFT JOIN - include vehicles with no conflicts
          },
        ],
      });

      // Filter out vehicles with active contracts in date range
      vehicles = vehicles.filter(v => v.contracts.length === 0);
    } else {
      // Just return vehicles with status 'available'
      vehicles = await Vehicle.findAll({ where: whereClause });
    }

    console.log(`✅ Found ${vehicles.length} available vehicles`);

    sendSuccess(res, {
      message: 'Available vehicles fetched successfully',
      data: { vehicles },
    });
  } catch (error) {
    console.error('💥 Get available vehicles error:', error);
    sendError(res, {
      statusCode: 500,
      message: 'Failed to fetch available vehicles',
      details: error.message,
    });
  }
};

// ============================================
// GET /api/vehicles/:id - Get single vehicle
// ============================================
const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findOne({
      where: applyTenantFilter(req, { id }),
      include: [
        {
          model: VehicleCost,
          as: 'costs',
          limit: 10,
          order: [['incurred_date', 'DESC']],
        },
        {
          model: Contract,
          as: 'contracts',
          where: { status: 'active' },
          required: false,
        },
      ],
    });

    if (!vehicle) {
      return sendError(res, {
        statusCode: 404,
        message: 'Vehicle not found',
      });
    }

    console.log(`🚗 Vehicle fetched: ${vehicle.brand} ${vehicle.model}`);

    sendSuccess(res, {
      message: 'Vehicle fetched successfully',
      data: { vehicle },
    });
  } catch (error) {
    console.error('💥 Get vehicle error:', error);
    sendError(res, {
      statusCode: 500,
      message: 'Failed to fetch vehicle',
      details: error.message,
    });
  }
};

// ============================================
// POST /api/vehicles - Create vehicle
// ============================================
const createVehicle = [
  // Validators
  body('brand').notEmpty().withMessage('Brand is required'),
  body('model').notEmpty().withMessage('Model is required'),
  body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Valid year required'),
  body('registration_number').notEmpty().withMessage('Registration number is required'),
  body('color').optional().isString(),
  body('transmission').isIn(['manual', 'automatic']).withMessage('Valid transmission required'),
  body('fuel_type').isIn(['petrol', 'diesel', 'electric', 'hybrid']).withMessage('Valid fuel type required'),
  body('seats').isInt({ min: 1, max: 50 }).withMessage('Valid number of seats required'),
  body('daily_rate').isFloat({ min: 0 }).withMessage('Valid daily rate required'),
  body('status').optional().isIn(['available', 'rented', 'maintenance', 'retired']),
  body('mileage').optional().isInt({ min: 0 }),
  body('purchase_price').optional().isFloat({ min: 0 }),
  body('purchase_date').optional().isISO8601(),
  body('vin').optional().isLength({ min: 17, max: 17 }).withMessage('VIN must be 17 characters'),

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

      // Check if registration number already exists
      const existingVehicle = await Vehicle.findOne({
        where: { registration_number: req.body.registration_number },
      });

      if (existingVehicle) {
        return sendError(res, {
          statusCode: 409,
          message: 'Vehicle with this registration number already exists',
        });
      }

      // Apply tenant data (adds company_id automatically)
      const vehicleData = applyTenantData(req, req.body);

      const vehicle = await Vehicle.create(vehicleData);

      console.log(`🚗 New vehicle created: ${vehicle.brand} ${vehicle.model} (${vehicle.registration_number})`);

      sendSuccess(res, {
        statusCode: 201,
        message: 'Vehicle created successfully',
        data: { vehicle },
      });
    } catch (error) {
      console.error('💥 Create vehicle error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to create vehicle',
        details: error.message,
      });
    }
  },
];

// ============================================
// PUT /api/vehicles/:id - Update vehicle
// ============================================
const updateVehicle = [
  // Validators (all optional for update)
  body('brand').optional().notEmpty().withMessage('Brand cannot be empty'),
  body('model').optional().notEmpty().withMessage('Model cannot be empty'),
  body('year').optional().isInt({ min: 1900, max: new Date().getFullYear() + 1 }),
  body('registration_number').optional().notEmpty(),
  body('transmission').optional().isIn(['manual', 'automatic']),
  body('fuel_type').optional().isIn(['petrol', 'diesel', 'electric', 'hybrid']),
  body('seats').optional().isInt({ min: 1, max: 50 }),
  body('daily_rate').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(['available', 'rented', 'maintenance', 'retired']),
  body('mileage').optional().isInt({ min: 0 }),

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

      // Check if vehicle exists and belongs to company
      const vehicle = await Vehicle.findOne({
        where: applyTenantFilter(req, { id }),
      });

      if (!vehicle) {
        return sendError(res, {
          statusCode: 404,
          message: 'Vehicle not found',
        });
      }

      // If registration number is being updated, check uniqueness
      if (req.body.registration_number && req.body.registration_number !== vehicle.registration_number) {
        const existingVehicle = await Vehicle.findOne({
          where: { registration_number: req.body.registration_number },
        });

        if (existingVehicle) {
          return sendError(res, {
            statusCode: 409,
            message: 'Vehicle with this registration number already exists',
          });
        }
      }

      // Update vehicle
      await vehicle.update(req.body);

      console.log(`🔄 Vehicle updated: ${vehicle.brand} ${vehicle.model}`);

      sendSuccess(res, {
        message: 'Vehicle updated successfully',
        data: { vehicle },
      });
    } catch (error) {
      console.error('💥 Update vehicle error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to update vehicle',
        details: error.message,
      });
    }
  },
];

// ============================================
// DELETE /api/vehicles/:id - Delete vehicle
// ============================================
const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if vehicle exists and belongs to company
    const vehicle = await Vehicle.findOne({
      where: applyTenantFilter(req, { id }),
    });

    if (!vehicle) {
      return sendError(res, {
        statusCode: 404,
        message: 'Vehicle not found',
      });
    }

    // Check if vehicle has active contracts
    const activeContracts = await Contract.count({
      where: {
        vehicle_id: id,
        status: 'active',
      },
    });

    if (activeContracts > 0) {
      return sendError(res, {
        statusCode: 409,
        message: 'Cannot delete vehicle with active contracts',
      });
    }

    // Soft delete: update status to 'retired' instead of hard delete
    await vehicle.update({ status: 'retired' });

    console.log(`🗑️ Vehicle retired: ${vehicle.brand} ${vehicle.model}`);

    sendSuccess(res, {
      message: 'Vehicle deleted successfully',
      data: { vehicle },
    });
  } catch (error) {
    console.error('💥 Delete vehicle error:', error);
    sendError(res, {
      statusCode: 500,
      message: 'Failed to delete vehicle',
      details: error.message,
    });
  }
};

// ============================================
// POST /api/vehicles/:id/costs - Add vehicle cost
// ============================================
const addVehicleCost = [
  body('cost_type')
    .isIn(['fuel', 'maintenance', 'insurance', 'registration', 'cleaning', 'repair', 'other'])
    .withMessage('Valid cost type required'),
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount required'),
  body('incurred_date').isISO8601().withMessage('Valid date required'),
  body('description').optional().isString(),

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

      const { id: vehicle_id } = req.params;

      // Check if vehicle exists and belongs to company
      const vehicle = await Vehicle.findOne({
        where: applyTenantFilter(req, { id: vehicle_id }),
      });

      if (!vehicle) {
        return sendError(res, {
          statusCode: 404,
          message: 'Vehicle not found',
        });
      }

      // Create cost record
      const cost = await VehicleCost.create({
        vehicle_id,
        created_by: req.user.id,
        ...req.body,
      });

      console.log(`💰 Cost added to vehicle ${vehicle_id}: ${cost.cost_type} - ${cost.amount}`);

      sendSuccess(res, {
        statusCode: 201,
        message: 'Vehicle cost added successfully',
        data: { cost },
      });
    } catch (error) {
      console.error('💥 Add vehicle cost error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to add vehicle cost',
        details: error.message,
      });
    }
  },
];

// ============================================
// GET /api/vehicles/:id/costs - Get cost history
// ============================================
const getVehicleCosts = async (req, res) => {
  try {
    const { id: vehicle_id } = req.params;
    const { cost_type, start_date, end_date, page = 1, limit = 20 } = req.query;

    // Check if vehicle exists and belongs to company
    const vehicle = await Vehicle.findOne({
      where: applyTenantFilter(req, { id: vehicle_id }),
    });

    if (!vehicle) {
      return sendError(res, {
        statusCode: 404,
        message: 'Vehicle not found',
      });
    }

    // Build filter
    const whereClause = { vehicle_id };

    if (cost_type) {
      whereClause.cost_type = cost_type;
    }

    if (start_date || end_date) {
      whereClause.incurred_date = {};
      if (start_date) whereClause.incurred_date[Op.gte] = start_date;
      if (end_date) whereClause.incurred_date[Op.lte] = end_date;
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: costs } = await VehicleCost.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [['incurred_date', 'DESC']],
    });

    // Calculate total cost
    const totalCost = costs.reduce((sum, cost) => sum + parseFloat(cost.amount), 0);

    console.log(`💰 Fetched ${costs.length} costs for vehicle ${vehicle_id}`);

    sendSuccess(res, {
      message: 'Vehicle costs fetched successfully',
      data: { 
        costs,
        total_cost: totalCost,
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
    console.error('💥 Get vehicle costs error:', error);
    sendError(res, {
      statusCode: 500,
      message: 'Failed to fetch vehicle costs',
      details: error.message,
    });
  }
};

module.exports = {
  getAllVehicles,
  getAvailableVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  addVehicleCost,
  getVehicleCosts,
};