const { Company, PlatformSettings } = require('../models');
const { sendSuccess, sendError } = require('../utils/response.util');
const { sendEmail, sendSimpleEmail } = require('../services/email.service');
const { buildSubscriptionPayload, resolveSubscriptionPlan, planNameToEnum } = require('../utils/subscription.util');
const { VALID_PLANS } = require('../constants/subscription.constants');
const { TRIAL_DURATION_DAYS } = require('../constants/subscription.constants');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;

async function getPlanPrice(planName) {
  try {
    const settings = await PlatformSettings.findByPk(1);
    const plans = settings?.settings?.plans || [];
    const plan = plans.find(
      (p) => p.name?.toLowerCase() === planName?.toLowerCase()
        || p.id?.replace('plan_', '') === planName?.toLowerCase()
    );
    return plan?.priceMonthly ?? null;
  } catch {
    return null;
  }
}

async function getAvailablePlans() {
  const settings = await PlatformSettings.findByPk(1);
  const plans = settings?.settings?.plans || [];
  return plans.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    priceMonthly: p.priceMonthly,
    maxVehicles: p.maxVehicles,
    maxUsers: p.maxUsers,
    features: p.features || [],
    tier: planNameToEnum(p.name) || 'basic',
  }));
}

// GET /api/company/subscription/plans
const listPlans = async (req, res) => {
  try {
    const plans = await getAvailablePlans();
    sendSuccess(res, { message: 'Plans fetched', data: { plans } });
  } catch (error) {
    console.error('List plans error:', error);
    sendError(res, { statusCode: 500, message: 'Failed to fetch plans' });
  }
};

// PUT /api/company/subscription/plan — change plan during trial
const changePlan = async (req, res) => {
  try {
    const company = await Company.findByPk(req.user.company_id);
    if (!company) {
      return sendError(res, { statusCode: 404, message: 'Company not found' });
    }

    if (company.subscription_status === 'active') {
      return sendError(res, {
        statusCode: 403,
        message: 'Contact support to change your plan on an active subscription.',
      });
    }

    const { plan, planId } = req.body || {};
    const raw = planId || plan;
    if (!raw) {
      return sendError(res, { statusCode: 422, message: 'Plan is required' });
    }

    const subscription_plan = await resolveSubscriptionPlan(raw);
    if (!VALID_PLANS.includes(subscription_plan)) {
      return sendError(res, { statusCode: 422, message: 'Invalid plan selected' });
    }

    await company.update({ subscription_plan });
    await company.reload();

    const planPrice = await getPlanPrice(subscription_plan);

    sendSuccess(res, {
      message: 'Plan updated successfully',
      data: { subscription: buildSubscriptionPayload(company, planPrice) },
    });
  } catch (error) {
    console.error('Change plan error:', error);
    sendError(res, { statusCode: 500, message: 'Failed to change plan' });
  }
};

// GET /api/company/subscription
const getSubscriptionStatus = async (req, res) => {
  try {
    const company = await Company.findByPk(req.user.company_id);
    if (!company) {
      return sendError(res, { statusCode: 404, message: 'Company not found' });
    }

    const planPrice = await getPlanPrice(company.subscription_plan);

    sendSuccess(res, {
      message: 'Subscription status fetched',
      data: { subscription: buildSubscriptionPayload(company, planPrice) },
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    sendError(res, { statusCode: 500, message: 'Failed to fetch subscription status' });
  }
};

// POST /api/company/subscription/request-upgrade
const requestUpgrade = async (req, res) => {
  try {
    const company = await Company.findByPk(req.user.company_id);
    if (!company) {
      return sendError(res, { statusCode: 404, message: 'Company not found' });
    }

    const { message: userMessage } = req.body || {};
    const billingUrl = `${FRONTEND_URL}/en/dashboard/settings?tab=billing`;

    // Flag for super admin dashboard
    await company.update({
      settings: {
        ...(company.settings || {}),
        subscription_request: {
          pending: true,
          requested_at: new Date().toISOString(),
          requested_by: req.user.email,
          requested_by_name: req.user.full_name || req.user.email,
          requested_by_role: req.user.role,
          plan: company.subscription_plan,
          message: userMessage || null,
        },
      },
    });

    // Notify support team
    if (SUPPORT_EMAIL) {
      await sendSimpleEmail({
        to: SUPPORT_EMAIL,
        subject: `💳 Subscription request — ${company.name}`,
        html: `
          <h2>New subscription request</h2>
          <p><strong>Company:</strong> ${company.name}</p>
          <p><strong>Email:</strong> ${company.email}</p>
          <p><strong>Phone:</strong> ${company.phone || 'N/A'}</p>
          <p><strong>Plan:</strong> ${company.subscription_plan}</p>
          <p><strong>Status:</strong> ${company.subscription_status}</p>
          <p><strong>Trial ends:</strong> ${company.trial_ends_at ? new Date(company.trial_ends_at).toLocaleDateString() : 'N/A'}</p>
          <p><strong>Requested by:</strong> ${req.user.email} (${req.user.role})</p>
          ${userMessage ? `<p><strong>Message:</strong> ${userMessage}</p>` : ''}
        `,
      });
    }

    // Confirm to company
    await sendEmail({
      to: company.email,
      templateType: 'upgrade_request_received',
      data: {
        companyName: company.name,
        plan: company.subscription_plan,
        supportEmail: SUPPORT_EMAIL,
        billingUrl,
      },
    });

    sendSuccess(res, {
      message: 'Your subscription request has been received. Our team will contact you shortly.',
    });
  } catch (error) {
    console.error('Request upgrade error:', error);
    sendError(res, { statusCode: 500, message: 'Failed to submit subscription request' });
  }
};

module.exports = {
  listPlans,
  changePlan,
  getSubscriptionStatus,
  requestUpgrade,
  TRIAL_DURATION_DAYS,
};
