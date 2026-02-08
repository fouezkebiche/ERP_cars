// src/services/reportGeneration.service.js
const { Contract, Payment, Vehicle, Customer, VehicleCost, sequelize } = require('../models');
const { Op } = require('sequelize');
const analyticsService = require('./analytics.service');

/**
 * Report Generation Service
 * Generates comprehensive reports with dynamic filtering
 */

// ============================================
// HELPER: Build Dynamic WHERE Clause
// ============================================
const buildWhereClause = (companyId, filters) => {
  const where = { company_id: companyId };

  // Date range
  if (filters.startDate && filters.endDate) {
    where.created_at = {
      [Op.between]: [new Date(filters.startDate), new Date(filters.endDate)],
    };
  }

  // Vehicle filters
  if (filters.vehicleIds?.length > 0) {
    where.vehicle_id = { [Op.in]: filters.vehicleIds };
  }
  if (filters.vehicleBrand) {
    where['$vehicle.brand$'] = filters.vehicleBrand;
  }
  if (filters.vehicleStatus) {
    where['$vehicle.status$'] = filters.vehicleStatus;
  }

  // Customer filters
  if (filters.customerIds?.length > 0) {
    where.customer_id = { [Op.in]: filters.customerIds };
  }
  if (filters.customerType) {
    where['$customer.customer_type$'] = filters.customerType;
  }

  // Contract filters
  if (filters.contractStatus) {
    where.status = filters.contractStatus;
  }

  // Revenue range
  if (filters.minRevenue || filters.maxRevenue) {
    where.total_amount = {};
    if (filters.minRevenue) where.total_amount[Op.gte] = filters.minRevenue;
    if (filters.maxRevenue) where.total_amount[Op.lte] = filters.maxRevenue;
  }

  return where;
};

// ============================================
// REPORT 1: Executive Summary
// ============================================
const generateExecutiveSummary = async (companyId, filters = {}) => {
  try {
    const startDate = new Date(filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const endDate = new Date(filters.endDate || new Date());

    // Get dashboard KPIs
    const dashboardData = await analyticsService.getDashboardKPIs(companyId, startDate, endDate);

    // Get revenue breakdown
    const revenue = await analyticsService.calculateRevenue(companyId, startDate, endDate);

    // Get vehicle utilization
    const utilization = await analyticsService.calculateVehicleUtilization(companyId, startDate, endDate);
    const avgUtilization = utilization.reduce((sum, v) => sum + v.utilization_rate, 0) / utilization.length;

    // Get top customers
    const topCustomers = await Customer.findAll({
      where: { company_id: companyId },
      order: [['lifetime_value', 'DESC']],
      limit: 5,
      attributes: ['id', 'full_name', 'total_rentals', 'lifetime_value', 'customer_type'],
    });

    // Get alerts (vehicles needing maintenance)
    const maintenanceAlerts = await Vehicle.count({
      where: {
        company_id: companyId,
        [Op.or]: [
          sequelize.literal('mileage >= next_maintenance_mileage'),
          { status: 'maintenance' },
        ],
      },
    });

    // Compare with previous period
    const periodLength = endDate - startDate;
    const prevStartDate = new Date(startDate.getTime() - periodLength);
    const prevRevenue = await analyticsService.calculateRevenue(companyId, prevStartDate, startDate);
    
    const revenueGrowth = prevRevenue.total_revenue > 0
      ? ((revenue.total_revenue - prevRevenue.total_revenue) / prevRevenue.total_revenue) * 100
      : 0;

    return {
      report_type: 'executive_summary',
      generated_at: new Date(),
      period: {
        start: startDate,
        end: endDate,
        days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
      },
      summary: {
        total_revenue: revenue.total_revenue,
        revenue_growth: revenueGrowth,
        total_contracts: dashboardData.fleet.active_rentals,
        fleet_utilization: avgUtilization,
        active_customers: dashboardData.customers.total,
        new_customers: dashboardData.customers.new,
        maintenance_alerts: maintenanceAlerts,
      },
      revenue_breakdown: {
        total: revenue.total_revenue,
        average_transaction: revenue.average_transaction_value,
        payment_count: revenue.payment_count,
        by_method: revenue.revenue_by_method,
      },
      fleet_overview: {
        total_vehicles: dashboardData.fleet.total_vehicles,
        active_rentals: dashboardData.fleet.active_rentals,
        available: dashboardData.fleet.available_vehicles,
        maintenance: dashboardData.fleet.maintenance_vehicles,
        average_utilization: avgUtilization,
      },
      top_customers: topCustomers.map(c => ({
        name: c.full_name,
        type: c.customer_type,
        total_rentals: c.total_rentals,
        lifetime_value: parseFloat(c.lifetime_value),
      })),
      top_vehicles: dashboardData.top_vehicles.slice(0, 5),
      trends: revenue.revenue_by_day,
    };
  } catch (error) {
    console.error('💥 Generate executive summary error:', error);
    throw error;
  }
};

// ============================================
// REPORT 2: Vehicle Performance Report
// ============================================
const generateVehicleReport = async (companyId, filters = {}) => {
  try {
    const startDate = new Date(filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const endDate = new Date(filters.endDate || new Date());

    // Get vehicle utilization
    const utilization = await analyticsService.calculateVehicleUtilization(companyId, startDate, endDate);

    // Get vehicle P&L
    const profitLoss = await analyticsService.calculateVehicleProfitLoss(companyId, startDate, endDate);

    // Apply filters
    let filteredVehicles = profitLoss;

    if (filters.minUtilization) {
      filteredVehicles = filteredVehicles.filter(v => v.utilization_rate >= filters.minUtilization);
    }
    if (filters.maxUtilization) {
      filteredVehicles = filteredVehicles.filter(v => v.utilization_rate <= filters.maxUtilization);
    }
    if (filters.vehicleBrand) {
      filteredVehicles = filteredVehicles.filter(v => v.brand === filters.vehicleBrand);
    }

    // Sort by selected metric
    const sortBy = filters.sortBy || 'profit';
    filteredVehicles.sort((a, b) => b[sortBy] - a[sortBy]);

    // Get top performers and bottom performers
    const topPerformers = filteredVehicles.slice(0, 5);
    const bottomPerformers = filteredVehicles.slice(-5).reverse();

    // Get maintenance alerts
    const maintenanceNeeded = await Vehicle.findAll({
      where: {
        company_id: companyId,
        [Op.or]: [
          sequelize.literal('mileage >= next_maintenance_mileage'),
          sequelize.literal('mileage - last_maintenance_mileage >= maintenance_interval_km'),
        ],
      },
      attributes: ['id', 'brand', 'model', 'registration_number', 'mileage', 'next_maintenance_mileage'],
    });

    // Calculate fleet totals
    const fleetTotals = {
      total_revenue: filteredVehicles.reduce((sum, v) => sum + v.total_revenue, 0),
      total_costs: filteredVehicles.reduce((sum, v) => sum + v.total_costs, 0),
      total_profit: filteredVehicles.reduce((sum, v) => sum + v.profit, 0),
      average_utilization: filteredVehicles.reduce((sum, v) => sum + v.utilization_rate, 0) / filteredVehicles.length,
    };

    return {
      report_type: 'vehicle_performance',
      generated_at: new Date(),
      period: {
        start: startDate,
        end: endDate,
        days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
      },
      fleet_summary: {
        total_vehicles: filteredVehicles.length,
        ...fleetTotals,
        profit_margin: fleetTotals.total_revenue > 0
          ? (fleetTotals.total_profit / fleetTotals.total_revenue) * 100
          : 0,
      },
      top_performers: topPerformers,
      bottom_performers: bottomPerformers,
      maintenance_alerts: maintenanceNeeded.map(v => ({
        registration: v.registration_number,
        vehicle: `${v.brand} ${v.model}`,
        current_mileage: v.mileage,
        next_maintenance: v.next_maintenance_mileage,
        km_overdue: Math.max(0, v.mileage - v.next_maintenance_mileage),
      })),
      all_vehicles: filteredVehicles,
    };
  } catch (error) {
    console.error('💥 Generate vehicle report error:', error);
    throw error;
  }
};

// ============================================
// REPORT 3: Customer Insights Report
// ============================================
const generateCustomerReport = async (companyId, filters = {}) => {
  try {
    const startDate = new Date(filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const endDate = new Date(filters.endDate || new Date());

    // Get customer segmentation
    const segmentation = await analyticsService.segmentCustomers(companyId);

    // Get retention metrics
    const retention = await analyticsService.getCustomerRetention(companyId, startDate, endDate);

    // Get customer trends
    const customerTrends = await Contract.findAll({
      where: {
        company_id: companyId,
        start_date: { [Op.between]: [startDate, endDate] },
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('start_date')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'bookings'],
        [sequelize.fn('AVG', sequelize.col('total_days')), 'avg_duration'],
      ],
      group: [sequelize.fn('DATE', sequelize.col('start_date'))],
      order: [[sequelize.fn('DATE', sequelize.col('start_date')), 'ASC']],
      raw: true,
    });

    // Get booking patterns (weekday vs weekend)
    const bookingPatterns = await Contract.findAll({
      where: {
        company_id: companyId,
        start_date: { [Op.between]: [startDate, endDate] },
      },
      attributes: [
        [sequelize.fn('EXTRACT', sequelize.literal("DOW FROM start_date")), 'day_of_week'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: [sequelize.fn('EXTRACT', sequelize.literal("DOW FROM start_date"))],
      raw: true,
    });

    // Get corporate vs individual breakdown
    const typeBreakdown = await Contract.findAll({
      where: {
        company_id: companyId,
        start_date: { [Op.between]: [startDate, endDate] },
      },
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['customer_type'],
        },
      ],
      attributes: [
        [sequelize.col('customer.customer_type'), 'type'],
        [sequelize.fn('COUNT', sequelize.col('Contract.id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'revenue'],
      ],
      group: [sequelize.col('customer.customer_type')],
      raw: true,
    });

    return {
      report_type: 'customer_insights',
      generated_at: new Date(),
      period: {
        start: startDate,
        end: endDate,
        days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
      },
      customer_segmentation: segmentation,
      retention_metrics: retention,
      booking_trends: customerTrends.map(t => ({
        date: t.date,
        bookings: parseInt(t.bookings),
        avg_duration: parseFloat(t.avg_duration).toFixed(1),
      })),
      booking_patterns: {
        by_weekday: bookingPatterns.map(p => ({
          day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][p.day_of_week],
          count: parseInt(p.count),
        })),
        by_customer_type: typeBreakdown.map(t => ({
          type: t.type,
          bookings: parseInt(t.count),
          revenue: parseFloat(t.revenue),
        })),
      },
    };
  } catch (error) {
    console.error('💥 Generate customer report error:', error);
    throw error;
  }
};

// ============================================
// MAIN: Generate Report
// ============================================
const generateReport = async (companyId, reportType, filters = {}) => {
  try {
    console.log(`📊 Generating ${reportType} report for company ${companyId}`);

    let report;

    switch (reportType) {
      case 'executive':
        report = await generateExecutiveSummary(companyId, filters);
        break;
      case 'vehicle':
        report = await generateVehicleReport(companyId, filters);
        break;
      case 'customer':
        report = await generateCustomerReport(companyId, filters);
        break;
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }

    return report;
  } catch (error) {
    console.error('💥 Generate report error:', error);
    throw error;
  }
};

module.exports = {
  generateReport,
  generateExecutiveSummary,
  generateVehicleReport,
  generateCustomerReport,
};