// src/controllers/analytics.controller.js
const analyticsService = require('../services/analytics.service');
const { sendSuccess, sendError } = require('../utils/response.util');
const { query, validationResult } = require('express-validator');

/**
 * Helper: Parse date range from query params with defaults
 */
const parseDateRange = (req) => {
  const { start_date, end_date, period = 'month' } = req.query;
  
  let startDate, endDate;
  
  if (start_date && end_date) {
    startDate = new Date(start_date);
    endDate = new Date(end_date);
  } else {
    // Default based on period
    endDate = new Date();
    startDate = new Date();
    
    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }
  }
  
  return { startDate, endDate };
};

// ============================================
// GET /api/analytics/dashboard - Dashboard KPIs
// ============================================
const getDashboard = [
  query('period').optional().isIn(['today', 'week', 'month', 'quarter', 'year']),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),
  
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

      const { startDate, endDate } = parseDateRange(req);
      const companyId = req.companyId;

      console.log(`📊 Fetching dashboard for company ${companyId} from ${startDate} to ${endDate}`);

      const dashboardData = await analyticsService.getDashboardKPIs(
        companyId,
        startDate,
        endDate
      );

      sendSuccess(res, {
        message: 'Dashboard KPIs fetched successfully',
        data: dashboardData,
      });
    } catch (error) {
      console.error('💥 Get dashboard error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to fetch dashboard data',
        details: error.message,
      });
    }
  },
];

// ============================================
// GET /api/analytics/revenue - Revenue Analytics
// ============================================
const getRevenue = [
  query('period').optional().isIn(['today', 'week', 'month', 'quarter', 'year']),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),
  query('compare').optional().isBoolean(),
  
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

      const { startDate, endDate } = parseDateRange(req);
      const { compare = 'false' } = req.query;
      const companyId = req.companyId;

      console.log(`💰 Fetching revenue for company ${companyId}`);

      let revenueData;
      
      if (compare === 'true') {
        // Get revenue with comparison to previous period
        revenueData = await analyticsService.getRevenueComparison(
          companyId,
          startDate,
          endDate
        );
      } else {
        // Get revenue for current period only
        revenueData = await analyticsService.calculateRevenue(
          companyId,
          startDate,
          endDate
        );
      }

      sendSuccess(res, {
        message: 'Revenue analytics fetched successfully',
        data: {
          period: { start: startDate, end: endDate },
          ...revenueData,
        },
      });
    } catch (error) {
      console.error('💥 Get revenue error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to fetch revenue analytics',
        details: error.message,
      });
    }
  },
];

// ============================================
// GET /api/analytics/vehicles - Vehicle Performance
// ============================================
const getVehiclePerformance = [
  query('period').optional().isIn(['today', 'week', 'month', 'quarter', 'year']),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),
  query('metric').optional().isIn(['utilization', 'revenue', 'profit']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  
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

      const { startDate, endDate } = parseDateRange(req);
      const { metric = 'utilization', limit = 10 } = req.query;
      const companyId = req.companyId;

      console.log(`🚗 Fetching vehicle performance for company ${companyId}`);

      let vehicleData;

      switch (metric) {
        case 'profit':
          // Get profit/loss analysis
          vehicleData = await analyticsService.calculateVehicleProfitLoss(
            companyId,
            startDate,
            endDate
          );
          vehicleData = vehicleData.slice(0, parseInt(limit));
          break;
          
        case 'revenue':
          // Get top revenue generators
          const utilization = await analyticsService.calculateVehicleUtilization(
            companyId,
            startDate,
            endDate
          );
          vehicleData = utilization
            .sort((a, b) => b.total_revenue - a.total_revenue)
            .slice(0, parseInt(limit));
          break;
          
        case 'utilization':
        default:
          // Get top utilized vehicles
          vehicleData = await analyticsService.getTopPerformingVehicles(
            companyId,
            startDate,
            endDate,
            parseInt(limit)
          );
          break;
      }

      // Calculate fleet summary
      const allVehicles = await analyticsService.calculateVehicleUtilization(
        companyId,
        startDate,
        endDate
      );

      const fleetSummary = {
        total_vehicles: allVehicles.length,
        average_utilization: allVehicles.reduce((sum, v) => sum + v.utilization_rate, 0) / allVehicles.length,
        total_revenue: allVehicles.reduce((sum, v) => sum + v.total_revenue, 0),
        total_rentals: allVehicles.reduce((sum, v) => sum + v.rental_count, 0),
      };

      sendSuccess(res, {
        message: 'Vehicle performance analytics fetched successfully',
        data: {
          period: { start: startDate, end: endDate },
          metric: metric,
          fleet_summary: fleetSummary,
          vehicles: vehicleData,
        },
      });
    } catch (error) {
      console.error('💥 Get vehicle performance error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to fetch vehicle performance',
        details: error.message,
      });
    }
  },
];

// ============================================
// GET /api/analytics/vehicles/utilization - Detailed Utilization
// ============================================
const getVehicleUtilization = [
  query('period').optional().isIn(['today', 'week', 'month', 'quarter', 'year']),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),
  query('vehicle_id').optional().isUUID(),
  
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

      const { startDate, endDate } = parseDateRange(req);
      const { vehicle_id } = req.query;
      const companyId = req.companyId;

      console.log(`📊 Fetching utilization for company ${companyId}`);

      const utilization = await analyticsService.calculateVehicleUtilization(
        companyId,
        startDate,
        endDate
      );

      // Filter by vehicle if specified
      const filteredData = vehicle_id
        ? utilization.filter(v => v.vehicle_id === vehicle_id)
        : utilization;

      sendSuccess(res, {
        message: 'Vehicle utilization fetched successfully',
        data: {
          period: { start: startDate, end: endDate },
          vehicles: filteredData,
        },
      });
    } catch (error) {
      console.error('💥 Get vehicle utilization error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to fetch vehicle utilization',
        details: error.message,
      });
    }
  },
];

// ============================================
// GET /api/analytics/vehicles/profit-loss - P&L Analysis
// ============================================
const getVehicleProfitLoss = [
  query('period').optional().isIn(['month', 'quarter', 'year']),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),
  
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

      const { startDate, endDate } = parseDateRange(req);
      const companyId = req.companyId;

      console.log(`💵 Fetching P&L for company ${companyId}`);

      const profitLoss = await analyticsService.calculateVehicleProfitLoss(
        companyId,
        startDate,
        endDate
      );

      // Calculate totals
      const totals = {
        total_revenue: profitLoss.reduce((sum, v) => sum + v.total_revenue, 0),
        total_costs: profitLoss.reduce((sum, v) => sum + v.total_costs, 0),
        total_profit: profitLoss.reduce((sum, v) => sum + v.profit, 0),
      };

      totals.profit_margin = totals.total_revenue > 0
        ? (totals.total_profit / totals.total_revenue) * 100
        : 0;

      sendSuccess(res, {
        message: 'Vehicle profit/loss analytics fetched successfully',
        data: {
          period: { start: startDate, end: endDate },
          totals,
          vehicles: profitLoss,
        },
      });
    } catch (error) {
      console.error('💥 Get vehicle P&L error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to fetch vehicle profit/loss',
        details: error.message,
      });
    }
  },
];

// ============================================
// GET /api/analytics/customers - Customer Analytics
// ============================================
const getCustomerAnalytics = [
  query('period').optional().isIn(['week', 'month', 'quarter', 'year']),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),
  
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

      const { startDate, endDate } = parseDateRange(req);
      const companyId = req.companyId;

      console.log(`👥 Fetching customer analytics for company ${companyId}`);

      // Get segmentation and retention in parallel
      const [segmentation, retention] = await Promise.all([
        analyticsService.segmentCustomers(companyId),
        analyticsService.getCustomerRetention(companyId, startDate, endDate),
      ]);

      sendSuccess(res, {
        message: 'Customer analytics fetched successfully',
        data: {
          period: { start: startDate, end: endDate },
          segmentation,
          retention,
        },
      });
    } catch (error) {
      console.error('💥 Get customer analytics error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to fetch customer analytics',
        details: error.message,
      });
    }
  },
];

// ============================================
// GET /api/analytics/customers/segmentation - Customer Segments
// ============================================
const getCustomerSegmentation = async (req, res) => {
  try {
    const companyId = req.companyId;

    console.log(`🎯 Fetching customer segmentation for company ${companyId}`);

    const segmentation = await analyticsService.segmentCustomers(companyId);

    sendSuccess(res, {
      message: 'Customer segmentation fetched successfully',
      data: segmentation,
    });
  } catch (error) {
    console.error('💥 Get customer segmentation error:', error);
    sendError(res, {
      statusCode: 500,
      message: 'Failed to fetch customer segmentation',
      details: error.message,
    });
  }
};

// ============================================
// GET /api/analytics/customers/retention - Retention Metrics
// ============================================
const getCustomerRetention = [
  query('period').optional().isIn(['week', 'month', 'quarter', 'year']),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),
  
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

      const { startDate, endDate } = parseDateRange(req);
      const companyId = req.companyId;

      console.log(`🔄 Fetching customer retention for company ${companyId}`);

      const retention = await analyticsService.getCustomerRetention(
        companyId,
        startDate,
        endDate
      );

      sendSuccess(res, {
        message: 'Customer retention metrics fetched successfully',
        data: {
          period: { start: startDate, end: endDate },
          ...retention,
        },
      });
    } catch (error) {
      console.error('💥 Get customer retention error:', error);
      sendError(res, {
        statusCode: 500,
        message: 'Failed to fetch customer retention',
        details: error.message,
      });
    }
  },
];

module.exports = {
  getDashboard,
  getRevenue,
  getVehiclePerformance,
  getVehicleUtilization,
  getVehicleProfitLoss,
  getCustomerAnalytics,
  getCustomerSegmentation,
  getCustomerRetention,
};