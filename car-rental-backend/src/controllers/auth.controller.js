// src/controllers/auth.controller.js
const { User, Company } = require('../models');
const { sendSuccess, sendError } = require('../utils/response.util');
const { hashPassword, comparePassword } = require('../utils/bcrypt.util');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt.util');
const { body, validationResult } = require('express-validator'); // For input validation

// In-memory blacklist for refresh tokens (dev only; use Redis in prod)
const tokenBlacklist = new Set();

// POST /api/auth/register - Create new user
const register = [
  // Validators
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 chars'),
  body('company_id').isUUID().withMessage('Valid company ID required'),
  body('role').optional().isIn(['owner', 'admin', 'manager', 'staff', 'viewer']).withMessage('Invalid role'),

  async (req, res) => {
    try {
      // Check validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, { statusCode: 422, message: 'Validation failed', details: errors.array() });
      }

      const { full_name, email, password, company_id, role = 'staff' } = req.body;

      // Check if company exists
      const company = await Company.findByPk(company_id);
      if (!company) {
        return sendError(res, { statusCode: 404, message: 'Company not found' });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return sendError(res, { statusCode: 409, message: 'Email already registered' });
      }

      // Hash password and create user
      const passwordHash = await hashPassword(password);
      const user = await User.create({
        full_name,
        email,
        password_hash: passwordHash, // Bypasses model hook for explicit hashing
        company_id,
        role,
        is_active: true,
      });
      console.log('👤 New user registered for company:', company_id, 'as', role);

      // Don't return password in response
      const { password_hash, ...userData } = user.toJSON();

      sendSuccess(res, {
        statusCode: 201,
        message: 'User registered successfully',
        data: { user: userData },
      });
    } catch (error) {
      sendError(res, { statusCode: 500, message: 'Registration failed', details: error.message });
    }
  },
];

// POST /api/auth/login - Login & get tokens
const login = [
  // Validators (same)
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password required'),

  async (req, res) => {
    try {
      console.log('🔑 Login attempt for email:', req.body.email); // Log 1: Incoming request

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Login validation errors:', errors.array()); // Log validation fails
        return sendError(res, { statusCode: 422, message: 'Validation failed', details: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ where: { email } });
      console.log('🔍 User found?', !!user); // Log 2: User exists?
      if (!user || !user.is_active) {
        console.log('🚫 Invalid credentials for:', email);
        return sendError(res, { statusCode: 401, message: 'Invalid credentials' });
      }

      // Compare password
      const isMatch = await comparePassword(password, user.password_hash);
      console.log('🔒 Password match?', isMatch); // Log 3: Password correct?
      if (!isMatch) {
        console.log('🚫 Password mismatch for:', email);
        return sendError(res, { statusCode: 401, message: 'Invalid credentials' });
      }

      // Generate tokens
      const tokens = generateTokens(user);

      // Update last login
      await user.update({ last_login_at: new Date() });

      const { password_hash, ...userData } = user.toJSON();

      console.log('✅ Login success for:', email); // Log 4: All good
      sendSuccess(res, {
        message: 'Login successful',
        data: { user: userData, ...tokens },
      });
    } catch (error) {
      console.error('💥 Login error:', error); // Log 5: Any crash
      sendError(res, { statusCode: 500, message: 'Login failed', details: error.message });
    }
  },
];

// GET /api/auth/me - Get current user (protected)
const getMe = async (req, res) => {
  try {
    // req.user from middleware, but fetch fresh from DB for full details
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] }, // Hide sensitive fields
    });

    if (!user) {
      return sendError(res, { statusCode: 404, message: 'User not found' });
    }

    sendSuccess(res, { message: 'User profile fetched', data: { user: user.toJSON() } });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Failed to fetch profile', details: error.message });
  }
};

// POST /api/auth/logout - Blacklist refresh token
const logout = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const refreshToken = req.body.refresh_token || (authHeader && authHeader.split(' ')[1]); // Accept in body or header

    if (!refreshToken) {
      return sendError(res, { statusCode: 400, message: 'Refresh token required' });
    }

    // Blacklist it
    tokenBlacklist.add(refreshToken);

    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Logout failed', details: error.message });
  }
};

// POST /api/auth/refresh - Get new access token
const refresh = [
  body('refresh_token').notEmpty().withMessage('Refresh token required'),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, { statusCode: 422, message: 'Validation failed', details: errors.array() });
      }

      const { refresh_token } = req.body;

      // Check blacklist
      if (tokenBlacklist.has(refresh_token)) {
        return sendError(res, { statusCode: 401, message: 'Token has been revoked' });
      }

      // Verify refresh token
      const decoded = verifyRefreshToken(refresh_token);
      const user = await User.findByPk(decoded.id);

      if (!user || !user.is_active) {
        return sendError(res, { statusCode: 401, message: 'User inactive or not found' });
      }

      // Generate new access token (keep same refresh)
      const { accessToken } = generateTokens(user);

      sendSuccess(res, {
        message: 'Token refreshed',
        data: { accessToken },
      });
    } catch (error) {
      sendError(res, { statusCode: 401, message: error.message || 'Invalid refresh token' });
    }
  },
];

module.exports = {
  register,
  login,
  getMe,
  logout,
  refresh,
};