// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const authRoutes = require('./routes/auth.routes');
const companyRoutes = require('./routes/company.routes');
const protectedCompanyRoutes = require('./routes/companyProfile.routes');
const vehicleRoutes = require('./routes/vehicle.routes');

const app = express();

// 1. Security headers (Helmet)
app.use(helmet());

// 2. CORS (Cross-Origin Resource Sharing) - Configure for your frontend
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'; // Set in .env
app.use(cors({
  origin: FRONTEND_URL,
  optionsSuccessStatus: 200, // For legacy browser support
}));

// 3. Logging (Morgan) - Use 'dev' format in development
const NODE_ENV = process.env.NODE_ENV || 'development';
app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));

// 4. Body parsing (JSON and URL-encoded)
app.use(express.json({ limit: '10mb' })); // Adjust limit as needed (e.g., for file uploads later)
app.use(express.urlencoded({ extended: true }));

// Basic health check route
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Add a ping route for API testing
app.get('/api/ping', (req, res) => {
  res.json({ pong: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/company', protectedCompanyRoutes);
app.use('/api/vehicles', vehicleRoutes);

// 404 Handler (for unmatched routes)
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// Global Error Handler
app.use((err, req, res, next) => {
  // Log the error (use your logging.middleware.js later if expanded)
  console.error('❌ Server Error:', err);

  // Don't expose stack in production
  const isDev = NODE_ENV === 'development';
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(isDev && { stack: err.stack }), // Only in dev
  });
});

module.exports = app;