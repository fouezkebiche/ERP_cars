const { TRIAL_DURATION_DAYS, VALID_PLANS, PLAN_ID_MAP } = require('../constants/subscription.constants');

/**
 * Map a pricing plan display name to the DB enum value.
 */
function planNameToEnum(name) {
  if (!name) return null;
  const n = String(name).toLowerCase().trim();
  if (n.includes('enterprise')) return 'enterprise';
  if (n.includes('professional') || n === 'pro') return 'professional';
  if (n.includes('basic') || n.includes('starter')) return 'basic';
  return null;
}

/**
 * Normalize known plan IDs (plan_professional → professional).
 * Returns null when the ID must be resolved via platform settings lookup.
 */
function normalizePlanId(planId) {
  if (!planId) return 'basic';
  const key = String(planId).toLowerCase().trim();

  if (VALID_PLANS.includes(key)) return key;
  if (PLAN_ID_MAP[key]) return PLAN_ID_MAP[key];

  const stripped = key.replace(/^plan_/, '');
  if (VALID_PLANS.includes(stripped)) return stripped;

  return null;
}

/**
 * Resolve any plan identifier (enum, plan_professional, plan_1234567890) to a DB enum.
 * Looks up dynamic admin-created plan IDs in PlatformSettings by matching plan name.
 */
async function resolveSubscriptionPlan(rawPlan) {
  const direct = normalizePlanId(rawPlan);
  if (direct) return direct;

  try {
    const { PlatformSettings } = require('../models');
    const settings = await PlatformSettings.findByPk(1);
    const plans = settings?.settings?.plans || [];
    const raw = String(rawPlan).toLowerCase();

    const matched = plans.find(
      (p) => String(p.id).toLowerCase() === raw
        || String(p.name).toLowerCase() === raw
    );

    if (matched) {
      const fromName = planNameToEnum(matched.name);
      if (fromName) return fromName;
    }
  } catch (error) {
    console.error('Plan lookup failed:', error.message);
  }

  return 'basic';
}

function getTrialEndDate(startDate = new Date()) {
  return new Date(startDate.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
}

function getDaysRemaining(endDate) {
  if (!endDate) return null;
  const now = new Date();
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Determine whether a company may use the platform.
 */
function getSubscriptionAccess(company) {
  const status = company.subscription_status;
  const now = new Date();

  if (status === 'active') {
    return {
      allowed: true,
      status,
      reason: null,
      daysRemaining: null,
      trialEndsAt: company.trial_ends_at,
      isTrial: false,
      isExpired: false,
    };
  }

  if (status === 'trial') {
    const trialEndsAt = company.trial_ends_at ? new Date(company.trial_ends_at) : null;
    const daysRemaining = trialEndsAt ? getDaysRemaining(trialEndsAt) : TRIAL_DURATION_DAYS;

    if (trialEndsAt && trialEndsAt <= now) {
      return {
        allowed: false,
        status,
        reason: 'TRIAL_EXPIRED',
        daysRemaining: 0,
        trialEndsAt: company.trial_ends_at,
        isTrial: true,
        isExpired: true,
      };
    }

    return {
      allowed: true,
      status,
      reason: null,
      daysRemaining: daysRemaining ?? TRIAL_DURATION_DAYS,
      trialEndsAt: company.trial_ends_at,
      isTrial: true,
      isExpired: false,
    };
  }

  if (status === 'suspended' || status === 'inactive') {
    return {
      allowed: false,
      status,
      reason: 'SUBSCRIPTION_INACTIVE',
      daysRemaining: 0,
      trialEndsAt: company.trial_ends_at,
      isTrial: false,
      isExpired: true,
    };
  }

  return {
    allowed: false,
    status,
    reason: 'UNKNOWN',
    daysRemaining: 0,
    trialEndsAt: company.trial_ends_at,
    isTrial: false,
    isExpired: true,
  };
}

function buildSubscriptionPayload(company, planPrice = null) {
  const access = getSubscriptionAccess(company);
  return {
    subscription_plan: company.subscription_plan,
    subscription_status: company.subscription_status,
    subscription_start_date: company.subscription_start_date,
    subscription_end_date: company.subscription_end_date,
    trial_ends_at: company.trial_ends_at,
    trial_duration_days: TRIAL_DURATION_DAYS,
    monthly_recurring_revenue: company.monthly_recurring_revenue,
    plan_price_monthly: planPrice,
    ...access,
  };
}

module.exports = {
  planNameToEnum,
  normalizePlanId,
  resolveSubscriptionPlan,
  getTrialEndDate,
  getDaysRemaining,
  getSubscriptionAccess,
  buildSubscriptionPayload,
};
