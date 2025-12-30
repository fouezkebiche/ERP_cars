// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const companyRoutes = require('./routes/company.routes');
const protectedCompanyRoutes = require('./routes/companyProfile.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const customerRoutes = require('./routes/customer.routes');
const contractRoutes = require('./routes/contract.routes');
const paymentRoutes = require('./routes/payment.routes');
const analyticsRoutes = require('./routes/analytics.routes');

const app = express();

// 1. Security headers (Helmet)
app.use(helmet());

// 2. CORS (Cross-Origin Resource Sharing) - Configure for your frontend
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({
  origin: FRONTEND_URL,
  optionsSuccessStatus: 200,
}));

// 3. Logging (Morgan)
const NODE_ENV = process.env.NODE_ENV || 'development';
app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));

// 4. Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check routes
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.get('/api/ping', (req, res) => {
  res.json({ pong: true });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/company', protectedCompanyRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  const isDev = NODE_ENV === 'development';
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(isDev && { stack: err.stack }),
  });
});

module.exports = app;