const TRIAL_DURATION_DAYS = 30;

const TRIAL_REMINDER_DAYS = [7, 3, 1];

const VALID_PLANS = ['basic', 'professional', 'enterprise'];

const PLAN_ID_MAP = {
  plan_basic: 'basic',
  plan_professional: 'professional',
  plan_enterprise: 'enterprise',
  basic: 'basic',
  professional: 'professional',
  enterprise: 'enterprise',
};

module.exports = {
  TRIAL_DURATION_DAYS,
  TRIAL_REMINDER_DAYS,
  VALID_PLANS,
  PLAN_ID_MAP,
};
