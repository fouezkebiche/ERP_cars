const { Company } = require('../models');
const { sendSuccess, sendError } = require('../utils/response.util');
const { body, validationResult } = require('express-validator');

// POST /api/companies - Create new company (public for signup)
const createCompany = [
  // Validators
  body('name').notEmpty().withMessage('Company name required'),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('phone').optional().isMobilePhone('ar-DZ'), // Algerian format
  body('subscription_plan').optional().isIn(['basic', 'professional', 'enterprise']),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, { statusCode: 422, message: 'Validation failed', details: errors.array() });
      }

      const { name, email, phone, subscription_plan = 'basic', subscription_status = 'trial' } = req.body;

      // Check if company with email exists
      const existing = await Company.findOne({ where: { email } });
      if (existing) {
        return sendError(res, { statusCode: 409, message: 'Company with this email already exists' });
      }

      const company = await Company.create({
        name,
        email,
        phone,
        subscription_plan,
        subscription_status,
        subscription_start_date: new Date(),
        trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
      });

      // Convert to plain object
      const companyJson = company.toJSON();
      
      // DEBUG: Log everything
      console.log('🏢 DEBUG - Raw company.toJSON():', companyJson);
      console.log('🏢 DEBUG - company.id:', company.id);
      console.log('🏢 DEBUG - companyJson.id:', companyJson.id);

      // Remove sensitive fields but keep ID intact
      const { settings, ...safeCompany } = companyJson;

      console.log('🏢 DEBUG - safeCompany.id:', safeCompany.id);
      console.log('🏢 DEBUG - About to send response with company:', safeCompany);

      console.log('🏢 New company created:', name, 'with ID:', company.id);
      
      sendSuccess(res, {
        statusCode: 201,
        message: 'Company created successfully',
        data: { company: safeCompany },
      });
    } catch (error) {
      console.error('💥 Company creation error:', error);
      sendError(res, { statusCode: 500, message: 'Failed to create company', details: error.message });
    }
  },
];

// GET /api/company/profile - Get company details (protected)
const getProfile = async (req, res) => {
  try {
    const { company_id } = req.user; // From authenticated user
    console.log('🏢 Fetching profile for company_id:', company_id);

    const company = await Company.findByPk(company_id);

    if (!company) {
      console.log('🚫 Company not found:', company_id);
      return sendError(res, { statusCode: 404, message: 'Company not found' });
    }

    // Return full company including settings so the settings page can load/save defaultDailyKmLimit etc.
    const companyJson = company.toJSON();
    console.log('🏢 Profile fetched for:', companyJson.name);

    sendSuccess(res, {
      message: 'Company profile fetched successfully',
      data: { company: companyJson },
    });
  } catch (error) {
    console.error('💥 Get company profile error:', error);
    sendError(res, { statusCode: 500, message: 'Failed to fetch company profile', details: error.message });
  }
};

// PUT /api/company/profile - Update company info (protected)
const updateProfile = [
  // Validators for updatable fields
  body('name').optional().notEmpty().withMessage('Company name required'),
  body('email').optional().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('phone').optional().isLength({ min: 10, max: 15 }).withMessage('Phone must be 10-15 digits'),
  body('address').optional().isLength({ max: 500 }).withMessage('Address too long'),
  body('tax_id').optional().isLength({ max: 100 }).withMessage('Tax ID too long'),
  // Fix: Allow falsy (empty) values for optional URL
  body('logo_url').optional({ checkFalsy: true }).isURL().withMessage('Valid URL required'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, { statusCode: 422, message: 'Validation failed', details: errors.array() });
      }

      const { company_id } = req.user;
      const updateData = req.body; // Only validated fields will be present
      console.log('🏢 Updating profile for company_id:', company_id, 'with:', updateData);

      // If email is provided and changed, check uniqueness
      if (updateData.email) {
        const existingCompany = await Company.findOne({ where: { email: updateData.email } });
        if (existingCompany && existingCompany.id !== company_id) {
          return sendError(res, { statusCode: 409, message: 'Email already in use by another company' });
        }
      }

      // Update company
      const [updatedRows, [company]] = await Company.update(updateData, {
        where: { id: company_id },
        returning: true, // Sequelize option to return updated record
      });

      if (updatedRows === 0) {
        return sendError(res, { statusCode: 404, message: 'Company not found' });
      }

      // Exclude settings from response
      const { settings, ...safeCompany } = company.toJSON();
      console.log('🏢 Profile updated for:', safeCompany.name);

      sendSuccess(res, {
        message: 'Company profile updated successfully',
        data: { company: safeCompany },
      });
    } catch (error) {
      console.error('💥 Update company profile error:', error);
      sendError(res, { statusCode: 500, message: 'Failed to update company profile', details: error.message });
    }
  },
];

// PUT /api/company/settings - Update company settings (protected)
const updateSettings = [
  // Validator for settings (must be object)
  body('settings').optional().isObject().withMessage('Settings must be a valid JSON object'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, { statusCode: 422, message: 'Validation failed', details: errors.array() });
      }

      const { company_id } = req.user;
      const { settings } = req.body;
      console.log('🏢 Updating settings for company_id:', company_id, 'with:', settings);

      // Fetch existing company to merge settings (or overwrite if preferred)
      const company = await Company.findByPk(company_id);
      if (!company) {
        return sendError(res, { statusCode: 404, message: 'Company not found' });
      }

      // Merge with existing (add this if you want to preserve unset fields; else just set new)
      const newSettings = { ...company.settings, ...settings };

      // Update only settings
      await company.update({ settings: newSettings });
      // Reload to get fresh instance
      await company.reload();

      // Return updated company without full settings in response (or include if needed)
      const { settings: _, ...safeCompany } = company.toJSON(); // Hide settings
      console.log('🔧 Settings updated for:', safeCompany.name);

      sendSuccess(res, {
        message: 'Company settings updated successfully',
        data: { company: safeCompany },
      });
    } catch (error) {
      console.error('💥 Update company settings error:', error);
      sendError(res, { statusCode: 500, message: 'Failed to update company settings', details: error.message });
    }
  },
];

module.exports = {
  createCompany,
  getProfile,
  updateProfile,
  updateSettings,
};