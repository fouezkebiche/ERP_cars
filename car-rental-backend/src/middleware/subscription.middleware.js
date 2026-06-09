const { Company } = require('../models');
const { sendError } = require('../utils/response.util');
const { getSubscriptionAccess } = require('../utils/subscription.util');

/**
 * Blocks API access when trial has expired or subscription is inactive/suspended.
 * Must run after authenticateToken + injectCompanyId.
 */
const requireActiveSubscription = async (req, res, next) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) {
      return sendError(res, { statusCode: 403, message: 'Company context required', code: 'NO_COMPANY' });
    }

    const company = await Company.findByPk(companyId, {
      attributes: [
        'id', 'name', 'email', 'subscription_status', 'subscription_plan',
        'trial_ends_at', 'subscription_start_date', 'subscription_end_date',
      ],
    });

    if (!company) {
      return sendError(res, { statusCode: 404, message: 'Company not found', code: 'COMPANY_NOT_FOUND' });
    }

    const access = getSubscriptionAccess(company);
    req.company = company;
    req.subscriptionAccess = access;

    if (!access.allowed) {
      return sendError(res, {
        statusCode: 402,
        message: access.reason === 'TRIAL_EXPIRED'
          ? 'Your free trial has ended. Please subscribe to continue using CarManager.'
          : 'Your subscription is inactive. Please contact support or subscribe to continue.',
        code: access.reason || 'SUBSCRIPTION_REQUIRED',
        details: {
          subscription_status: company.subscription_status,
          trial_ends_at: company.trial_ends_at,
          days_remaining: access.daysRemaining,
        },
      });
    }

    next();
  } catch (error) {
    console.error('Subscription middleware error:', error);
    return sendError(res, { statusCode: 500, message: 'Failed to verify subscription' });
  }
};

module.exports = { requireActiveSubscription };
