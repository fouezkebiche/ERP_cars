const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/permissions.middleware');

// All admin routes require an authenticated user with role 'admin' or 'owner'
router.use(authenticateToken);
router.use(requireRole(['admin', 'owner']));

// ============================================
// Platform Stats
// ============================================
router.get('/stats', adminController.getPlatformStats);

// ============================================
// Companies
// ============================================
router.get('/companies', adminController.getAllCompanies);
router.get('/companies/:id', adminController.getCompanyById);
router.put('/companies/:id/subscription', adminController.updateSubscription);
router.put('/companies/:id/suspend', adminController.suspendCompany);
router.put('/companies/:id/reactivate', adminController.reactivateCompany);

// ============================================
// Users
// ============================================
router.get('/users', adminController.getAllUsers);

// ============================================
// Analytics
// ============================================
router.get('/analytics/growth', adminController.getGrowthAnalytics);
router.get('/analytics/revenue-by-plan', adminController.getRevenueByPlan);
router.get('/analytics/feature-usage', adminController.getFeatureUsage);
router.get('/analytics/trending-vehicles', adminController.getTrendingVehicles);
router.get('/analytics/system-health', adminController.getSystemHealth);

// ============================================
// Platform Settings (superadmin)
// ============================================
router.get('/settings', adminController.getAdminSettings);
router.put('/settings', adminController.updateAdminSettings);

module.exports = router;