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

// Public routes (no auth)
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);

// Protected routes: Auth only (NO RBAC/requireRole—skip employee fetch)
router.get('/me', authenticateToken, getMe); // Token verify only—no role/permission check
router.post('/logout', authenticateToken, logout); // Logout after auth

module.exports = router;