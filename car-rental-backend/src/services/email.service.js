// src/services/email.service.js
const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter (configure based on your email provider)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Email templates
 */
const EMAIL_TEMPLATES = {
  warning: {
    subject: '⚠️ Fleet Capacity Notification',
    getHtml: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">⚠️ Fleet Capacity Alert</h2>
        <p>Dear ${data.companyName},</p>
        <p>Your fleet is approaching its capacity limit.</p>
        
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Current Status:</h3>
          <p style="font-size: 18px; margin: 10px 0;">
            <strong>${data.current} / ${data.max}</strong> vehicles
          </p>
          <p style="color: #92400e;">
            ⏰ Only <strong>${data.remaining} slots</strong> remaining on your ${data.plan} plan
          </p>
        </div>

        <p>To ensure uninterrupted service and accommodate your growing fleet, we recommend upgrading your subscription.</p>

        <a href="${data.upgradeUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Upgrade Now
        </a>

        <p style="color: #6b7280; font-size: 14px;">
          If you have any questions, please contact our support team.
        </p>
      </div>
    `,
  },

  critical: {
    subject: '🚨 URGENT: Fleet Capacity Almost Reached',
    getHtml: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">🚨 URGENT: Action Required</h2>
        <p>Dear ${data.companyName},</p>
        
        <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0;">
          <h3 style="color: #dc2626; margin-top: 0;">Critical Fleet Capacity Warning</h3>
          <p style="font-size: 18px; margin: 10px 0;">
            <strong>${data.current} / ${data.max}</strong> vehicles
          </p>
          <p style="color: #991b1b;">
            🚨 Only <strong>${data.remaining} slots</strong> remaining!
          </p>
        </div>

        <p><strong>Immediate action required:</strong> Your fleet is at ${data.percentage}% capacity. To avoid service disruption and continue adding vehicles, please upgrade your plan.</p>

        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0;">Upgrade Benefits:</h4>
          <ul>
            <li><strong>Professional Plan:</strong> Up to 150 vehicles</li>
            <li><strong>Enterprise Plan:</strong> Up to 500 vehicles + priority support</li>
            <li>Advanced analytics and reporting</li>
            <li>Dedicated account manager (Enterprise)</li>
          </ul>
        </div>

        <a href="${data.upgradeUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold;">
          Upgrade Now to Avoid Disruption
        </a>

        <p style="color: #6b7280; font-size: 14px;">
          Need help? Contact us at support@carrentalsystem.com
        </p>
      </div>
    `,
  },

  limit_reached: {
    subject: '🛑 Fleet Limit Reached - Upgrade Required',
    getHtml: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">🛑 Fleet Limit Reached</h2>
        <p>Dear ${data.companyName},</p>
        
        <div style="background: #fecaca; border: 2px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #dc2626; margin-top: 0;">Maximum Capacity Reached</h3>
          <p style="font-size: 20px; font-weight: bold; margin: 10px 0;">
            ${data.current} / ${data.max} vehicles
          </p>
          <p style="color: #991b1b;">
            You cannot add more vehicles without upgrading your plan.
          </p>
        </div>

        <p><strong>What this means:</strong> You've reached the maximum ${data.max} vehicles allowed on your ${data.plan} plan. To continue growing your fleet, an upgrade is required.</p>

        <a href="${data.upgradeUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; font-size: 16px;">
          Upgrade Your Plan Now
        </a>

        <p>Our team is here to help you select the best plan for your business needs.</p>

        <p style="color: #6b7280; font-size: 14px;">
          Questions? Call us at +213-XXX-XXXX or reply to this email.
        </p>
      </div>
    `,
  },

  trial_welcome: {
    subject: '🎉 Welcome to CarManager — Your 30-Day Free Trial Has Started',
    getHtml: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Welcome to CarManager!</h2>
        <p>Dear ${data.companyName},</p>
        <p>Your account has been created successfully. You now have <strong>${data.trialDays} days</strong> of free access to explore everything CarManager has to offer.</p>

        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="margin-top: 0; color: #15803d;">Your Trial Details</h3>
          <p style="margin: 8px 0;"><strong>Plan:</strong> ${data.plan}</p>
          <p style="margin: 8px 0;"><strong>Trial ends:</strong> ${data.trialEndsAt}</p>
          <p style="margin: 8px 0;"><strong>No credit card required</strong> during your trial.</p>
        </div>

        <p>Get started by adding your vehicles, registering customers, and creating your first rental contract.</p>

        <a href="${data.dashboardUrl}" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold;">
          Go to Dashboard
        </a>

        <p style="color: #6b7280; font-size: 14px;">
          Questions? Reply to this email or contact us at ${data.supportEmail || 'support@carmanager.com'}.
        </p>
      </div>
    `,
  },

  trial_expiring: {
    subject: (data) => `⏰ Your CarManager trial ends in ${data.daysLeft} day${data.daysLeft === 1 ? '' : 's'}`,
    getHtml: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">⏰ Trial Ending Soon</h2>
        <p>Dear ${data.companyName},</p>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <p style="font-size: 18px; margin: 0;">
            Your free trial ends in <strong>${data.daysLeft} day${data.daysLeft === 1 ? '' : 's'}</strong>
          </p>
          <p style="margin: 10px 0 0; color: #92400e;">Trial end date: <strong>${data.trialEndsAt}</strong></p>
        </div>

        <p>To keep using CarManager without interruption, subscribe to your plan before the trial ends.</p>

        <a href="${data.billingUrl}" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold;">
          Subscribe Now
        </a>

        <p style="color: #6b7280; font-size: 14px;">
          After your trial ends, access to the platform will be paused until you subscribe.
        </p>
      </div>
    `,
  },

  trial_expired: {
    subject: '🔒 Your CarManager Free Trial Has Ended',
    getHtml: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Your Free Trial Has Ended</h2>
        <p>Dear ${data.companyName},</p>

        <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <p style="margin: 0; font-size: 16px;">
            Your 30-day free trial on the <strong>${data.plan}</strong> plan has ended.
            Your account is now paused until you subscribe.
          </p>
        </div>

        <p>We hope CarManager helped streamline your rental operations. Subscribe now to restore full access to your fleet, customers, and contracts.</p>

        <a href="${data.billingUrl}" style="display: inline-block; background: #22c55e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; font-size: 16px;">
          Subscribe &amp; Restore Access
        </a>

        <p>Need help choosing a plan? Contact us at <a href="mailto:${data.supportEmail}">${data.supportEmail}</a>.</p>
      </div>
    `,
  },

  upgrade_request_received: {
    subject: '✅ We received your subscription request',
    getHtml: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Subscription Request Received</h2>
        <p>Dear ${data.companyName},</p>
        <p>Thank you for your interest in subscribing to the <strong>${data.plan}</strong> plan.</p>
        <p>Our team has received your request and will contact you within 1–2 business days to complete your subscription.</p>
        <p style="color: #6b7280; font-size: 14px;">
          Questions in the meantime? Email us at <a href="mailto:${data.supportEmail}">${data.supportEmail}</a>.
        </p>
      </div>
    `,
  },

  maintenance_due: {
    subject: '⚠️ Vehicle Maintenance Required',
    getHtml: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ea580c;">🔧 Vehicle Maintenance Alert</h2>
        <p>Dear ${data.companyName},</p>
        
        <div style="background: #fed7aa; border-left: 4px solid #ea580c; padding: 20px; margin: 20px 0;">
          <h3 style="color: #9a3412; margin-top: 0;">Maintenance Service Required</h3>
          <p style="font-size: 16px; margin: 10px 0;">
            <strong>Vehicle:</strong> ${data.vehicleBrand} ${data.vehicleModel}<br>
            <strong>Registration:</strong> ${data.registration}
          </p>
          <p style="font-size: 18px; color: #c2410c; margin: 15px 0;">
            <strong>Current Mileage:</strong> ${data.currentMileage.toLocaleString()} km<br>
            <strong>Overdue by:</strong> ${data.kmOverdue} km
          </p>
        </div>

        <p><strong>Action Required:</strong> This vehicle has exceeded its maintenance interval and requires immediate service to ensure safety and optimal performance.</p>

        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0;">Recommended Maintenance:</h4>
          <ul style="margin: 10px 0;">
            <li>🔧 Oil and filter change</li>
            <li>🔍 Brake system inspection</li>
            <li>🛞 Tire pressure and tread check</li>
            <li>⚙️ General mechanical inspection</li>
            <li>💧 Fluid level checks</li>
          </ul>
        </div>

        <a href="${data.vehicleUrl}" style="display: inline-block; background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Schedule Maintenance Now
        </a>

        <p style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <strong>⚠️ Important:</strong> Regular maintenance prevents costly repairs and ensures vehicle safety. Please schedule service as soon as possible.
        </p>

        <p style="color: #6b7280; font-size: 14px;">
          Questions? Contact our support team or your maintenance provider.
        </p>
      </div>
    `,
  },
};

/**
 * Send email using template
 * @param {Object} options - Email options
 */
const sendEmail = async ({ to, templateType, data, cc, bcc }) => {
  try {
    const template = EMAIL_TEMPLATES[templateType];
    
    if (!template) {
      throw new Error(`Unknown email template: ${templateType}`);
    }

    const subject = typeof template.subject === 'function'
      ? template.subject(data)
      : template.subject;

    const mailOptions = {
      from: `"Car Rental System" <${process.env.EMAIL_USER}>`,
      to,
      cc,
      bcc,
      subject,
      html: template.getHtml(data),
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`📧 Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ Email sending error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send simple text email (for quick notifications)
 */
const sendSimpleEmail = async ({ to, subject, text, html }) => {
  try {
    const mailOptions = {
      from: `"Car Rental System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || `<p>${text}</p>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Simple email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ Email sending error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verify email configuration
 */
const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email service is ready');
    return true;
  } catch (error) {
    console.error('❌ Email service error:', error);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendSimpleEmail,
  verifyEmailConfig,
};