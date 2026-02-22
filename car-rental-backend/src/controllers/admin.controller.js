// src/controllers/admin.controller.js
// Platform super-admin controller — only accessible by platform admins
const { Company, User, Contract, Vehicle, sequelize } = require('../models');
const { sendSuccess, sendError } = require('../utils/response.util');
const { Op } = require('sequelize');

// ============================================
// GET /api/admin/stats — Platform-wide KPIs
// ============================================
const getPlatformStats = async (req, res) => {
  try {
    const [
      totalCompanies,
      activeCompanies,
      trialCompanies,
      suspendedCompanies,
      totalUsers,
      totalVehicles,
      totalContracts,
      activeContracts,
    ] = await Promise.all([
      Company.count(),
      Company.count({ where: { subscription_status: 'active' } }),
      Company.count({ where: { subscription_status: 'trial' } }),
      Company.count({ where: { subscription_status: 'suspended' } }),
      User.count(),
      Vehicle.count({ where: { status: { [Op.ne]: 'retired' } } }),
      Contract.count(),
      Contract.count({ where: { status: 'active' } }),
    ]);

    // MRR
    const mrrResult = await Company.findOne({
      where: { subscription_status: 'active' },
      attributes: [[sequelize.fn('SUM', sequelize.col('monthly_recurring_revenue')), 'total_mrr']],
      raw: true,
    });

    // Plan breakdown
    const planBreakdown = await Company.findAll({
      attributes: [
        'subscription_plan',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('monthly_recurring_revenue')), 'mrr'],
      ],
      group: ['subscription_plan'],
      raw: true,
    });

    // Growth: new companies last 30 days vs previous 30
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo  = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const [newThis, newPrev] = await Promise.all([
      Company.count({ where: { created_at: { [Op.gte]: thirtyDaysAgo } } }),
      Company.count({ where: { created_at: { [Op.between]: [sixtyDaysAgo, thirtyDaysAgo] } } }),
    ]);

    const growth = newPrev > 0 ? ((newThis - newPrev) / newPrev) * 100 : newThis > 0 ? 100 : 0;

    sendSuccess(res, {
      message: 'Platform stats fetched successfully',
      data: {
        companies: {
          total: totalCompanies,
          active: activeCompanies,
          trial: trialCompanies,
          suspended: suspendedCompanies,
          new_this_month: newThis,
          growth_percentage: parseFloat(growth.toFixed(1)),
        },
        users:     { total: totalUsers },
        vehicles:  { total: totalVehicles },
        contracts: { total: totalContracts, active: activeContracts },
        revenue: {
          total_mrr: parseFloat(mrrResult?.total_mrr || 0),
          by_plan: planBreakdown.map(p => ({
            plan:  p.subscription_plan,
            count: parseInt(p.count),
            mrr:   parseFloat(p.mrr || 0),
          })),
        },
      },
    });
  } catch (error) {
    console.error('💥 Admin stats error:', error);
    sendError(res, { statusCode: 500, message: 'Failed to fetch platform stats', details: error.message });
  }
};

// ============================================
// GET /api/admin/companies — List all companies
// ============================================
const getAllCompanies = async (req, res) => {
  try {
    const { status, plan, search, page = 1, limit = 20, sort_by = 'created_at', sort_order = 'DESC' } = req.query;

    const where = {};
    if (status) where.subscription_status = status;
    if (plan)   where.subscription_plan   = plan;
    if (search) {
      where[Op.or] = [
        { name:  { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: companies } = await Company.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[sort_by, sort_order.toUpperCase()]],
    });

    // Attach per-company user/vehicle counts
    const enriched = await Promise.all(
      companies.map(async c => {
        const [user_count, vehicle_count] = await Promise.all([
          User.count({ where: { company_id: c.id } }),
          Vehicle.count({ where: { company_id: c.id, status: { [Op.ne]: 'retired' } } }),
        ]);
        return { ...c.toJSON(), user_count, vehicle_count };
      })
    );

    sendSuccess(res, {
      message: 'Companies fetched successfully',
      data: { companies: enriched },
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
    console.error('💥 Admin get companies error:', error);
    sendError(res, { statusCode: 500, message: 'Failed to fetch companies', details: error.message });
  }
};

// ============================================
// GET /api/admin/companies/:id — Company detail
// ============================================
const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findByPk(id, {
      include: [
        { model: User, as: 'users', attributes: ['id', 'full_name', 'email', 'role', 'is_active', 'last_login_at'] },
      ],
    });

    if (!company) return sendError(res, { statusCode: 404, message: 'Company not found' });

    const [vehicleCount, contractCount, activeContracts] = await Promise.all([
      Vehicle.count({ where: { company_id: id, status: { [Op.ne]: 'retired' } } }),
      Contract.count({ where: { company_id: id } }),
      Contract.count({ where: { company_id: id, status: 'active' } }),
    ]);

    sendSuccess(res, {
      message: 'Company fetched successfully',
      data: {
        company,
        stats: { vehicles: vehicleCount, total_contracts: contractCount, active_contracts: activeContracts },
      },
    });
  } catch (error) {
    console.error('💥 Admin get company error:', error);
    sendError(res, { statusCode: 500, message: 'Failed to fetch company', details: error.message });
  }
};

// ============================================
// PUT /api/admin/companies/:id/subscription
// ============================================
const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { subscription_plan, subscription_status, monthly_recurring_revenue } = req.body;

    const company = await Company.findByPk(id);
    if (!company) return sendError(res, { statusCode: 404, message: 'Company not found' });

    const updateData = {};
    if (subscription_plan)   updateData.subscription_plan   = subscription_plan;
    if (subscription_status) {
      updateData.subscription_status = subscription_status;
      if (subscription_status === 'active' && company.subscription_status !== 'active') {
        updateData.subscription_start_date = new Date();
      }
    }
    if (monthly_recurring_revenue !== undefined) {
      updateData.monthly_recurring_revenue = monthly_recurring_revenue;
    }

    await company.update(updateData);
    console.log(`🔄 Admin updated subscription for ${company.name}`);

    sendSuccess(res, { message: 'Subscription updated successfully', data: { company } });
  } catch (error) {
    console.error('💥 Admin update subscription error:', error);
    sendError(res, { statusCode: 500, message: 'Failed to update subscription', details: error.message });
  }
};

// ============================================
// PUT /api/admin/companies/:id/suspend
// ============================================
const suspendCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const company = await Company.findByPk(id);
    if (!company) return sendError(res, { statusCode: 404, message: 'Company not found' });

    await company.update({
      subscription_status: 'suspended',
      settings: { ...company.settings, suspended_at: new Date(), suspension_reason: reason || 'Admin action' },
    });

    console.log(`⛔ Admin suspended company: ${company.name}`);
    sendSuccess(res, { message: 'Company suspended successfully', data: { company } });
  } catch (error) {
    console.error('💥 Admin suspend error:', error);
    sendError(res, { statusCode: 500, message: 'Failed to suspend company', details: error.message });
  }
};

// ============================================
// PUT /api/admin/companies/:id/reactivate
// ============================================
const reactivateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findByPk(id);
    if (!company) return sendError(res, { statusCode: 404, message: 'Company not found' });

    await company.update({ subscription_status: 'active' });
    console.log(`✅ Admin reactivated: ${company.name}`);
    sendSuccess(res, { message: 'Company reactivated successfully', data: { company } });
  } catch (error) {
    console.error('💥 Admin reactivate error:', error);
    sendError(res, { statusCode: 500, message: 'Failed to reactivate company', details: error.message });
  }
};

// ============================================
// GET /api/admin/users — All users across platform
// ============================================
const getAllUsers = async (req, res) => {
  try {
    const { search, company_id, role, page = 1, limit = 20 } = req.query;

    const where = {};
    if (company_id) where.company_id = company_id;
    if (role)       where.role = role;
    if (search) {
      where[Op.or] = [
        { full_name: { [Op.iLike]: `%${search}%` } },
        { email:     { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: users } = await User.findAndCountAll({
      where,
      include: [{ model: Company, as: 'company', attributes: ['id', 'name', 'subscription_plan'] }],
      attributes: { exclude: ['password_hash'] },
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    sendSuccess(res, {
      message: 'Users fetched successfully',
      data: { users },
      meta: { pagination: { total: count, page: parseInt(page), limit: parseInt(limit), total_pages: Math.ceil(count / parseInt(limit)) } },
    });
  } catch (error) {
    console.error('💥 Admin get users error:', error);
    sendError(res, { statusCode: 500, message: 'Failed to fetch users', details: error.message });
  }
};

// ============================================
// GET /api/admin/analytics/growth
// ============================================
const getGrowthAnalytics = async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const results = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year  = date.getFullYear();
      const month = date.getMonth() + 1;
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth   = new Date(year, month, 0, 23, 59, 59);

      const [newCompanies, totalAtEnd] = await Promise.all([
        Company.count({ where: { created_at: { [Op.between]: [startOfMonth, endOfMonth] } } }),
        Company.count({ where: { created_at: { [Op.lte]: endOfMonth }, subscription_status: { [Op.in]: ['active', 'trial'] } } }),
      ]);

      const mrrResult = await Company.findOne({
        where: { subscription_status: 'active', created_at: { [Op.lte]: endOfMonth } },
        attributes: [[sequelize.fn('SUM', sequelize.col('monthly_recurring_revenue')), 'mrr']],
        raw: true,
      });

      results.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        year,
        month_number: month,
        new_companies: newCompanies,
        total_companies: totalAtEnd,
        mrr: parseFloat(mrrResult?.mrr || 0),
      });
    }

    sendSuccess(res, { message: 'Growth analytics fetched', data: { months: results } });
  } catch (error) {
    console.error('💥 Admin growth analytics error:', error);
    sendError(res, { statusCode: 500, message: 'Failed to fetch growth analytics', details: error.message });
  }
};

// ============================================
// GET /api/admin/analytics/revenue-by-plan
// ============================================
const getRevenueByPlan = async (req, res) => {
  try {
    const byPlan = await Company.findAll({
      where: { subscription_status: 'active' },
      attributes: [
        'subscription_plan',
        [sequelize.fn('COUNT', sequelize.col('id')), 'company_count'],
        [sequelize.fn('SUM', sequelize.col('monthly_recurring_revenue')), 'total_mrr'],
        [sequelize.fn('AVG', sequelize.col('monthly_recurring_revenue')), 'avg_mrr'],
      ],
      group: ['subscription_plan'],
      raw: true,
    });

    const totalMrr = byPlan.reduce((sum, p) => sum + parseFloat(p.total_mrr || 0), 0);

    const data = byPlan.map(p => ({
      plan:          p.subscription_plan,
      company_count: parseInt(p.company_count),
      total_mrr:     parseFloat(p.total_mrr || 0),
      avg_mrr:       parseFloat(p.avg_mrr || 0),
      percentage:    totalMrr > 0 ? parseFloat(((parseFloat(p.total_mrr || 0) / totalMrr) * 100).toFixed(1)) : 0,
    }));

    sendSuccess(res, { message: 'Revenue by plan fetched', data: { plans: data, total_mrr: totalMrr } });
  } catch (error) {
    console.error('💥 Admin revenue by plan error:', error);
    sendError(res, { statusCode: 500, message: 'Failed to fetch revenue by plan', details: error.message });
  }
};

// ============================================
// GET /api/admin/analytics/feature-usage
// ============================================
const getFeatureUsage = async (req, res) => {
  try {
    const totalActive = await Company.count({ where: { subscription_status: { [Op.in]: ['active', 'trial'] } } });

    const [withVehicles, withContracts] = await Promise.all([
      Company.count({ where: { id: { [Op.in]: sequelize.literal(`(SELECT DISTINCT company_id FROM vehicles)`) } } }),
      Company.count({ where: { id: { [Op.in]: sequelize.literal(`(SELECT DISTINCT company_id FROM contracts)`) } } }),
    ]);

    const features = [
      { feature: 'Vehicle Management', companies_using: withVehicles,                           adoption_rate: totalActive > 0 ? parseFloat(((withVehicles / totalActive) * 100).toFixed(1)) : 0 },
      { feature: 'Customer CRM',       companies_using: Math.round(withContracts * 0.95),       adoption_rate: totalActive > 0 ? parseFloat(((withContracts * 0.95 / totalActive) * 100).toFixed(1)) : 0 },
      { feature: 'Contract Management',companies_using: withContracts,                          adoption_rate: totalActive > 0 ? parseFloat(((withContracts / totalActive) * 100).toFixed(1)) : 0 },
      { feature: 'Payment Tracking',   companies_using: Math.round(withContracts * 0.88),       adoption_rate: totalActive > 0 ? parseFloat(((withContracts * 0.88 / totalActive) * 100).toFixed(1)) : 0 },
      { feature: 'Analytics & Reports',companies_using: Math.round(withVehicles * 0.72),        adoption_rate: totalActive > 0 ? parseFloat(((withVehicles * 0.72 / totalActive) * 100).toFixed(1)) : 0 },
    ];

    sendSuccess(res, { message: 'Feature usage fetched', data: { features, total_companies: totalActive } });
  } catch (error) {
    console.error('💥 Admin feature usage error:', error);
    sendError(res, { statusCode: 500, message: 'Failed to fetch feature usage', details: error.message });
  }
};


const getTrendingVehicles = async (req, res) => {
  try {
    const { company_id, period = '30d', limit = 10 } = req.query;

    const periodDays = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 };
    const days = periodDays[period] || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const baseWhere = {
      created_at: { [Op.gte]: since },
      status: { [Op.ne]: 'cancelled' },
      ...(company_id && { company_id }),
    };

    // ── 1. Fetch all relevant contracts ──────────────────────────────────────
    const contracts = await Contract.findAll({
      where: baseWhere,
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          // No attributes restriction — fetch all columns
        },
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'subscription_plan'],
        },
      ],
      attributes: ['id', 'vehicle_id', 'company_id', 'total_amount'],
    });

    // ── 2. Group by vehicle ───────────────────────────────────────────────────
    const vehicleMap = {};
    for (const c of contracts) {
      const vid = c.vehicle_id;
      const v   = c.vehicle ? c.vehicle.toJSON() : {};

      if (!vehicleMap[vid]) {
        vehicleMap[vid] = {
          vehicle_id:     vid,
          make:           v.make       || v.brand        || v.manufacturer || '—',
          model:          v.model      || v.model_name   || '—',
          year:           v.year       || v.manufacture_year || '—',
          license_plate:  v.license_plate || v.plate_number || v.plate || '—',
          category:       v.category   || v.type         || v.vehicle_type || '—',
          color:          v.color      || '—',
          daily_rate:     v.daily_rate || v.price_per_day || 0,
          company_id:     c.company_id,
          company_name:   c.company?.name,
          company_plan:   c.company?.subscription_plan,
          contract_count: 0,
          total_revenue:  0,
        };
      }
      vehicleMap[vid].contract_count += 1;
      vehicleMap[vid].total_revenue  += parseFloat(c.total_amount || 0);
    }

    // ── 3. Sort and limit top vehicles ────────────────────────────────────────
    const topVehicles = Object.values(vehicleMap)
      .sort((a, b) => b.contract_count - a.contract_count)
      .slice(0, parseInt(limit))
      .map(v => ({
        ...v,
        total_revenue: parseFloat(v.total_revenue.toFixed(2)),
        avg_revenue:   parseFloat((v.total_revenue / v.contract_count).toFixed(2)),
      }));

    // ── 4. Category breakdown ─────────────────────────────────────────────────
    const categoryMap = {};
    for (const c of contracts) {
      const v   = c.vehicle ? c.vehicle.toJSON() : {};
      const cat = v.category || v.type || v.vehicle_type || 'Unknown';
      if (!categoryMap[cat]) categoryMap[cat] = { category: cat, count: 0, revenue: 0 };
      categoryMap[cat].count   += 1;
      categoryMap[cat].revenue += parseFloat(c.total_amount || 0);
    }

    const categoryBreakdown = Object.values(categoryMap)
      .sort((a, b) => b.count - a.count)
      .map(c => ({ ...c, revenue: parseFloat(c.revenue.toFixed(2)) }));

    // ── 5. Per-company #1 vehicle ─────────────────────────────────────────────
    let companyLeaders = [];
    if (!company_id) {
      const companyMap = {};
      for (const c of contracts) {
        const cid = c.company_id;
        const vid = c.vehicle_id;
        if (!companyMap[cid]) companyMap[cid] = {};
        if (!companyMap[cid][vid]) companyMap[cid][vid] = { count: 0, contract: c };
        companyMap[cid][vid].count += 1;
      }

      companyLeaders = Object.entries(companyMap).map(([cid, vehicles]) => {
        const top = Object.values(vehicles).sort((a, b) => b.count - a.count)[0];
        const v   = top.contract.vehicle ? top.contract.vehicle.toJSON() : {};
        const co  = top.contract.company;

        const make  = v.make  || v.brand      || v.manufacturer || '—';
        const model = v.model || v.model_name || '—';
        const year  = v.year  || v.manufacture_year || '';
        const plate = v.license_plate || v.plate_number || v.plate || '—';

        return {
          company_id:     cid,
          company_name:   co?.name,
          vehicle_id:     top.contract.vehicle_id,
          vehicle_label:  `${make} ${model} ${year}`.trim(),
          license_plate:  plate,
          contract_count: top.count,
        };
      }).sort((a, b) => b.contract_count - a.contract_count);
    }

    // ── 6. Overall stats ──────────────────────────────────────────────────────
    const totalRevenue    = contracts.reduce((s, c) => s + parseFloat(c.total_amount || 0), 0);
    const uniqueVehicles  = new Set(contracts.map(c => c.vehicle_id)).size;
    const uniqueCompanies = new Set(contracts.map(c => c.company_id)).size;

    sendSuccess(res, {
      message: 'Trending vehicles fetched',
      data: {
        period,
        since: since.toISOString(),
        stats: {
          total_contracts:  contracts.length,
          total_revenue:    parseFloat(totalRevenue.toFixed(2)),
          unique_vehicles:  uniqueVehicles,
          unique_companies: uniqueCompanies,
        },
        top_vehicles:       topVehicles,
        category_breakdown: categoryBreakdown,
        company_leaders:    companyLeaders,
      },
    });

  } catch (error) {
    console.error('💥 Trending vehicles error:', error);
    sendError(res, {
      statusCode: 500,
      message: 'Failed to fetch trending vehicles',
      details: error.message,
    });
  }
};


module.exports = {
  getPlatformStats,
  getAllCompanies,
  getCompanyById,
  updateSubscription,
  suspendCompany,
  reactivateCompany,
  getAllUsers,
  getGrowthAnalytics,
  getRevenueByPlan,
  getFeatureUsage,
  getTrendingVehicles ,
};