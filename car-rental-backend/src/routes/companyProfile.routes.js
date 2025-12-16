const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware'); // Your auth middleware
const { getProfile, updateProfile, updateSettings } = require('../controllers/company.controller');

const { injectCompanyId, validateTenantOwnership } = require('../middleware/tenantIsolation.middleware');



// Apply authentication + tenant isolation to ALL routes in this router
router.use(authenticateToken);
router.use(injectCompanyId);

// GET /api/company/profile
router.get('/profile', getProfile);


// PUT /api/company/profile - Update company profile
// Validates that user isn't trying to update another company's data
router.put('/profile', validateTenantOwnership('company_id'), updateProfile);

// PUT /api/company/settings
router.put('/settings', updateSettings);

module.exports = router;