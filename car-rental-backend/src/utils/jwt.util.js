// src/utils/jwt.util.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT secrets (from .env: JWT_ACCESS_SECRET, JWT_REFRESH_SECRET)
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'your-access-secret-fallback';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-fallback';

// Token options
const ACCESS_TOKEN_OPTIONS = {
  expiresIn: '15m', // Short-lived for security
};
const REFRESH_TOKEN_OPTIONS = {
  expiresIn: '7d', // Longer for session persistence
};

// Generate access token
const generateAccessToken = (payload) => {
  return jwt.sign(payload, ACCESS_SECRET, ACCESS_TOKEN_OPTIONS);
};

// Generate refresh token
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, REFRESH_SECRET, REFRESH_TOKEN_OPTIONS);
};

// Verify access token
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, ACCESS_SECRET);
  } catch (error) {
    throw new Error('Invalid access token');
  }
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_SECRET);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

// Generate both tokens (for login/register)
const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    company_id: user.company_id,
  };
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokens,
};