// src/services/analytics.service.js
const { Contract, Payment, Vehicle, Customer, VehicleCost, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Analytics Service
 * Provides business intelligence calculations for the car rental system
 */

// ============================================
// REVENUE ANALYTICS
// ============================================

/**
 * Calculate revenue for a given period
 * @param {string} companyId - Company UUID
 * @param {Date} startDate - Start of period
 * @param {Date} endDate - End of period
 * @returns {Object} Revenue breakdown
 */
const calculateRevenue = async (companyId, startDate, endDate) => {
  try {
    // Total revenue from completed payments
    const revenueResult = await Payment.findOne({
      where: {
        company_id: companyId,
        status: 'completed',
        payment_date: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'total_revenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'payment_count'],
      ],
      raw: true,
    });

    // Revenue by payment method
    const revenueByMethod = await Payment.findAll({
      where: {
        company_id: companyId,
        status: 'completed',
        payment_date: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        'payment_method',
        [sequelize.fn('SUM', sequelize.col('amount')), 'amount'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['payment_method'],
      raw: true,
    });

    // Revenue by day (for trend analysis)
    const revenueByDay = await Payment.findAll({
      where: {
        company_id: companyId,
        status: 'completed',
        payment_date: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('payment_date')), 'date'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'transactions'],
      ],
      group: [sequelize.fn('DATE', sequelize.col('payment_date'))],
      order: [[sequelize.fn('DATE', sequelize.col('payment_date')), 'ASC']],
      raw: true,
    });

    // Average transaction value
    const avgTransactionValue = revenueResult?.total_revenue && revenueResult?.payment_count
      ? parseFloat(revenueResult.total_revenue) / parseInt(revenueResult.payment_count)
      : 0;

    return {
      total_revenue: parseFloat(revenueResult?.total_revenue || 0),
      payment_count: parseInt(revenueResult?.payment_count || 0),
      average_transaction_value: avgTransactionValue,
      revenue_by_method: revenueByMethod.map(r => ({
        method: r.payment_method,
        amount: parseFloat(r.amount),
        count: parseInt(r.count),
      })),
      revenue_by_day: revenueByDay.map(r => ({
        date: r.date,
        revenue: parseFloat(r.revenue),
        transactions: parseInt(r.transactions),
      })),
    };
  } catch (error) {
    console.error('💥 Calculate revenue error:', error);
    throw error;
  }
};

/**
 * Get revenue comparison with previous period
 * @param {string} companyId 
 * @param {Date} currentStart 
 * @param {Date} currentEnd 
 * @returns {Object} Revenue comparison
 */
const getRevenueComparison = async (companyId, currentStart, currentEnd) => {
  try {
    const periodLength = currentEnd - currentStart;
    const previousStart = new Date(currentStart.getTime() - periodLength);
    const previousEnd = new Date(currentStart.getTime());

    const currentRevenue = await calculateRevenue(companyId, currentStart, currentEnd);
    const previousRevenue = await calculateRevenue(companyId, previousStart, previousEnd);

    const growth = previousRevenue.total_revenue > 0
      ? ((currentRevenue.total_revenue - previousRevenue.total_revenue) / previousRevenue.total_revenue) * 100
      : 0;

    return {
      current_period: currentRevenue,
      previous_period: previousRevenue,
      growth_percentage: growth,
    };
  } catch (error) {
    console.error('💥 Revenue comparison error:', error);
    throw error;
  }
};

// ============================================
// VEHICLE ANALYTICS
// ============================================

/**
 * Calculate vehicle utilization rates
 * @param {string} companyId 
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {Array} Vehicle utilization data
 */
const calculateVehicleUtilization = async (companyId, startDate, endDate) => {
  try {
    const vehicles = await Vehicle.findAll({
      where: { company_id: companyId },
      attributes: ['id', 'brand', 'model', 'registration_number', 'daily_rate', 'status'],
    });

    const periodDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    const utilizationData = await Promise.all(
      vehicles.map(async (vehicle) => {
        // Count days rented
        const contracts = await Contract.findAll({
          where: {
            vehicle_id: vehicle.id,
            status: { [Op.in]: ['active', 'completed'] },
            [Op.or]: [
              {
                start_date: { [Op.between]: [startDate, endDate] },
              },
              {
                end_date: { [Op.between]: [startDate, endDate] },
              },
              {
                [Op.and]: [
                  { start_date: { [Op.lte]: startDate } },
                  { end_date: { [Op.gte]: endDate } },
                ],
              },
            ],
          },
          attributes: ['start_date', 'end_date', 'total_amount'],
        });

        let totalDaysRented = 0;
        let totalRevenue = 0;

        contracts.forEach(contract => {
          const contractStart = new Date(Math.max(contract.start_date, startDate));
          const contractEnd = new Date(Math.min(contract.end_date, endDate));
          const daysRented = Math.ceil((contractEnd - contractStart) / (1000 * 60 * 60 * 24)) + 1;
          totalDaysRented += daysRented;
          totalRevenue += parseFloat(contract.total_amount);
        });

        const utilizationRate = (totalDaysRented / periodDays) * 100;
        const revenuePerDay = totalDaysRented > 0 ? totalRevenue / totalDaysRented : 0;

        return {
          vehicle_id: vehicle.id,
          brand: vehicle.brand,
          model: vehicle.model,
          registration_number: vehicle.registration_number,
          daily_rate: parseFloat(vehicle.daily_rate),
          current_status: vehicle.status,
          total_days_rented: totalDaysRented,
          available_days: periodDays - totalDaysRented,
          utilization_rate: utilizationRate,
          total_revenue: totalRevenue,
          revenue_per_day: revenuePerDay,
          rental_count: contracts.length,
        };
      })
    );

    // Sort by utilization rate
    utilizationData.sort((a, b) => b.utilization_rate - a.utilization_rate);

    return utilizationData;
  } catch (error) {
    console.error('💥 Calculate vehicle utilization error:', error);
    throw error;
  }
};

/**
 * Get top performing vehicles
 * @param {string} companyId 
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @param {number} limit 
 * @returns {Array} Top vehicles
 */
const getTopPerformingVehicles = async (companyId, startDate, endDate, limit = 10) => {
  try {
    const vehicles = await calculateVehicleUtilization(companyId, startDate, endDate);
    return vehicles.slice(0, limit);
  } catch (error) {
    console.error('💥 Get top vehicles error:', error);
    throw error;
  }
};

/**
 * Calculate profit/loss for vehicles
 * @param {string} companyId 
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {Array} Vehicle P&L
 */
const calculateVehicleProfitLoss = async (companyId, startDate, endDate) => {
  try {
    const utilization = await calculateVehicleUtilization(companyId, startDate, endDate);

    const profitLossData = await Promise.all(
      utilization.map(async (vehicle) => {
        // Get costs for this vehicle
        const costs = await VehicleCost.findAll({
          where: {
            vehicle_id: vehicle.vehicle_id,
            incurred_date: {
              [Op.between]: [startDate, endDate],
            },
          },
          attributes: [
            'cost_type',
            [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
          ],
          group: ['cost_type'],
          raw: true,
        });

        const totalCosts = costs.reduce((sum, cost) => sum + parseFloat(cost.total), 0);
        const profit = vehicle.total_revenue - totalCosts;
        const profitMargin = vehicle.total_revenue > 0 ? (profit / vehicle.total_revenue) * 100 : 0;

        return {
          ...vehicle,
          total_costs: totalCosts,
          costs_by_type: costs.map(c => ({
            type: c.cost_type,
            amount: parseFloat(c.total),
          })),
          profit: profit,
          profit_margin: profitMargin,
        };
      })
    );

    // Sort by profit
    profitLossData.sort((a, b) => b.profit - a.profit);

    return profitLossData;
  } catch (error) {
    console.error('💥 Calculate vehicle P&L error:', error);
    throw error;
  }
};

// ============================================
// CUSTOMER ANALYTICS
// ============================================

/**
 * Segment customers by value
 * @param {string} companyId 
 * @returns {Object} Customer segmentation
 */
const segmentCustomers = async (companyId) => {
  try {
    const customers = await Customer.findAll({
      where: { company_id: companyId },
      attributes: [
        'id',
        'full_name',
        'email',
        'customer_type',
        'total_rentals',
        'lifetime_value',
        'created_at',
      ],
      order: [['lifetime_value', 'DESC']],
    });

    // Calculate quartiles
    const sortedByValue = customers.map(c => parseFloat(c.lifetime_value)).sort((a, b) => a - b);
    const q1 = sortedByValue[Math.floor(sortedByValue.length * 0.25)];
    const q2 = sortedByValue[Math.floor(sortedByValue.length * 0.5)];
    const q3 = sortedByValue[Math.floor(sortedByValue.length * 0.75)];

    const segmented = {
      vip: customers.filter(c => parseFloat(c.lifetime_value) >= q3),
      high_value: customers.filter(c => parseFloat(c.lifetime_value) >= q2 && parseFloat(c.lifetime_value) < q3),
      medium_value: customers.filter(c => parseFloat(c.lifetime_value) >= q1 && parseFloat(c.lifetime_value) < q2),
      low_value: customers.filter(c => parseFloat(c.lifetime_value) < q1),
    };

    return {
      total_customers: customers.length,
      segments: {
        vip: {
          count: segmented.vip.length,
          total_value: segmented.vip.reduce((sum, c) => sum + parseFloat(c.lifetime_value), 0),
          customers: segmented.vip.slice(0, 10), // Top 10 VIPs
        },
        high_value: {
          count: segmented.high_value.length,
          total_value: segmented.high_value.reduce((sum, c) => sum + parseFloat(c.lifetime_value), 0),
        },
        medium_value: {
          count: segmented.medium_value.length,
          total_value: segmented.medium_value.reduce((sum, c) => sum + parseFloat(c.lifetime_value), 0),
        },
        low_value: {
          count: segmented.low_value.length,
          total_value: segmented.low_value.reduce((sum, c) => sum + parseFloat(c.lifetime_value), 0),
        },
      },
    };
  } catch (error) {
    console.error('💥 Segment customers error:', error);
    throw error;
  }
};

/**
 * Get customer retention metrics
 * @param {string} companyId 
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {Object} Retention metrics
 */
const getCustomerRetention = async (companyId, startDate, endDate) => {
  try {
    // New customers in period
    const newCustomers = await Customer.count({
      where: {
        company_id: companyId,
        created_at: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    // Repeat customers (had rentals before and during period)
    const repeatCustomers = await Customer.count({
      where: {
        company_id: companyId,
        created_at: { [Op.lt]: startDate },
        total_rentals: { [Op.gt]: 1 },
      },
      include: [
        {
          model: Contract,
          as: 'contracts',
          where: {
            start_date: {
              [Op.between]: [startDate, endDate],
            },
          },
          required: true,
        },
      ],
      distinct: true,
    });

    // Total active customers
    const totalActiveCustomers = await Customer.count({
      where: { company_id: companyId },
      include: [
        {
          model: Contract,
          as: 'contracts',
          where: {
            start_date: {
              [Op.between]: [startDate, endDate],
            },
          },
          required: true,
        },
      ],
      distinct: true,
    });

    const retentionRate = totalActiveCustomers > 0
      ? (repeatCustomers / totalActiveCustomers) * 100
      : 0;

    return {
      new_customers: newCustomers,
      repeat_customers: repeatCustomers,
      total_active_customers: totalActiveCustomers,
      retention_rate: retentionRate,
    };
  } catch (error) {
    console.error('💥 Get customer retention error:', error);
    throw error;
  }
};

// ============================================
// DASHBOARD KPIs
// ============================================

/**
 * Get comprehensive dashboard KPIs
 * @param {string} companyId 
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {Object} Dashboard data
 */
const getDashboardKPIs = async (companyId, startDate, endDate) => {
  try {
    // Run all analytics in parallel
    const [
      revenue,
      vehicleUtilization,
      customerSegmentation,
      customerRetention,
      activeContracts,
      totalVehicles,
      maintenanceVehicles,
    ] = await Promise.all([
      calculateRevenue(companyId, startDate, endDate),
      calculateVehicleUtilization(companyId, startDate, endDate),
      segmentCustomers(companyId),
      getCustomerRetention(companyId, startDate, endDate),
      Contract.count({
        where: {
          company_id: companyId,
          status: 'active',
        },
      }),
      Vehicle.count({
        where: { company_id: companyId },
      }),
      Vehicle.count({
        where: {
          company_id: companyId,
          status: 'maintenance',
        },
      }),
    ]);

    // Calculate fleet-wide utilization
    const avgUtilization = vehicleUtilization.length > 0
      ? vehicleUtilization.reduce((sum, v) => sum + v.utilization_rate, 0) / vehicleUtilization.length
      : 0;

    const availableVehicles = totalVehicles - activeContracts - maintenanceVehicles;

    return {
      period: {
        start: startDate,
        end: endDate,
      },
      revenue: {
        total: revenue.total_revenue,
        average_transaction: revenue.average_transaction_value,
        payment_count: revenue.payment_count,
      },
      fleet: {
        total_vehicles: totalVehicles,
        active_rentals: activeContracts,
        available_vehicles: availableVehicles,
        maintenance_vehicles: maintenanceVehicles,
        average_utilization: avgUtilization,
      },
      customers: {
        total: customerSegmentation.total_customers,
        new: customerRetention.new_customers,
        repeat: customerRetention.repeat_customers,
        retention_rate: customerRetention.retention_rate,
      },
      top_vehicles: vehicleUtilization.slice(0, 5),
    };
  } catch (error) {
    console.error('💥 Get dashboard KPIs error:', error);
    throw error;
  }
};

module.exports = {
  // Revenue
  calculateRevenue,
  getRevenueComparison,
  
  // Vehicles
  calculateVehicleUtilization,
  getTopPerformingVehicles,
  calculateVehicleProfitLoss,
  
  // Customers
  segmentCustomers,
  getCustomerRetention,
  
  // Dashboard
  getDashboardKPIs,
};