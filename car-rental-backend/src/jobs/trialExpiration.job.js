const cron = require('node-cron');
const { Op } = require('sequelize');
const { Company } = require('../models');
const { sendEmail } = require('../services/email.service');
const { getDaysRemaining } = require('../utils/subscription.util');
const { TRIAL_REMINDER_DAYS } = require('../constants/subscription.constants');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;

function getBillingUrl() {
  return `${FRONTEND_URL}/en/dashboard/settings?tab=billing`;
}

function getTrialEmailsSent(company) {
  return company.settings?.trial_emails_sent || [];
}

async function markTrialEmailSent(company, emailKey) {
  const sent = getTrialEmailsSent(company);
  if (sent.includes(emailKey)) return;
  const settings = { ...(company.settings || {}), trial_emails_sent: [...sent, emailKey] };
  await company.update({ settings });
}

/**
 * Process trial reminders and expirations for all trial companies.
 */
const processTrialSubscriptions = async () => {
  try {
    console.log('🔍 Starting trial subscription check...');

    const trialCompanies = await Company.findAll({
      where: { subscription_status: 'trial' },
    });

    for (const company of trialCompanies) {
      if (!company.trial_ends_at) continue;

      const daysRemaining = getDaysRemaining(company.trial_ends_at);
      const sent = getTrialEmailsSent(company);
      const billingUrl = getBillingUrl();

      // Reminder emails
      for (const days of TRIAL_REMINDER_DAYS) {
        const key = `reminder_${days}d`;
        if (daysRemaining === days && !sent.includes(key)) {
          await sendEmail({
            to: company.email,
            templateType: 'trial_expiring',
            data: {
              companyName: company.name,
              daysLeft: days,
              trialEndsAt: new Date(company.trial_ends_at).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric',
              }),
              billingUrl,
            },
          });
          await markTrialEmailSent(company, key);
          console.log(`📧 Trial reminder (${days}d) sent to ${company.name}`);
        }
      }

      // Expire trial
      if (daysRemaining <= 0) {
        await company.update({ subscription_status: 'suspended' });

        if (!sent.includes('expired')) {
          await sendEmail({
            to: company.email,
            templateType: 'trial_expired',
            data: {
              companyName: company.name,
              plan: company.subscription_plan,
              billingUrl,
              supportEmail: SUPPORT_EMAIL,
            },
          });
          await markTrialEmailSent(company, 'expired');
          console.log(`⛔ Trial expired for ${company.name}`);
        }
      }
    }

    // Catch suspended companies that were manually set but trial date passed
    const overdueTrials = await Company.findAll({
      where: {
        subscription_status: 'trial',
        trial_ends_at: { [Op.lt]: new Date() },
      },
    });

    for (const company of overdueTrials) {
      await company.update({ subscription_status: 'suspended' });
      console.log(`⛔ Auto-suspended overdue trial: ${company.name}`);
    }

    console.log('✅ Trial subscription check complete');
  } catch (error) {
    console.error('❌ Trial subscription check failed:', error);
  }
};

const scheduleTrialExpiration = () => {
  // Daily at 8:00 AM
  cron.schedule('0 8 * * *', () => {
    console.log('⏰ Running scheduled trial expiration check...');
    processTrialSubscriptions();
  });

  console.log('✅ Trial expiration cron job scheduled (daily at 8 AM)');
};

module.exports = {
  scheduleTrialExpiration,
  processTrialSubscriptions,
};
