// src/utils/bcrypt.util.js
const bcrypt = require('bcryptjs');

// Salt rounds (higher = more secure, but slower; 10-12 is standard)
const SALT_ROUNDS = 12;

/**
 * Hash a plain password
 * @param {string} password - Plain text password
 * @returns {string} Hashed password
 */
const hashPassword = async (password) => {
  if (!password || typeof password !== 'string') {
    throw new Error('Invalid password provided');
  }
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare plain password with hashed one
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password from DB
 * @returns {boolean} True if match
 */
const comparePassword = async (password, hash) => {
  if (!password || !hash) {
    throw new Error('Password or hash missing');
  }
  return await bcrypt.compare(password, hash);
};

module.exports = {
  hashPassword,
  comparePassword,
};