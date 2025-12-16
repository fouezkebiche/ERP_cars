// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getMe,
  logout,
  refresh,
} = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/permissions.middleware');

// Public routes (no auth)
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', refresh_token => { // Wait, no—logout needs refresh token, but can be after auth
  // Actually, logout can be public if providing refresh_token in body
  router.post('/logout', logout);
});

// Protected routes
router.get('/me', authenticateToken, requireRole(['owner', 'staff']), getMe); // Example: owner/staff only

module.exports = router;