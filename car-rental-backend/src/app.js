// src/app.js (UPDATED WITH ALL NEW ROUTES)
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
const employeeRoutes = require('./routes/employee.routes');
const reportsRoutes = require('./routes/reports.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const payrollRoutes = require('./routes/payroll.routes');

const app = express();

// 1. Security headers (Helmet)
app.use(helmet());

// 2. CORS (Cross-Origin Resource Sharing)
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

// ============================================
// HEALTH CHECK ROUTES
// ============================================
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Car Rental API Server',
    version: '2.0.0',
    features: [
      'Vehicle Limit Monitoring',
      'Maintenance Alerts',
      'KM Limit Tracking',
      'Loyalty Tier System',
      'Overage Charges',
    ],
  });
});

app.get('/api/ping', (req, res) => {
  res.json({ pong: true, timestamp: new Date().toISOString() });
});

// ============================================
// API ROUTES
// ============================================


console.log({
  authRoutes: typeof authRoutes,
  companyRoutes: typeof companyRoutes,
  protectedCompanyRoutes: typeof protectedCompanyRoutes,
  vehicleRoutes: typeof vehicleRoutes,
  customerRoutes: typeof customerRoutes,
  contractRoutes: typeof contractRoutes,
  paymentRoutes: typeof paymentRoutes,
  analyticsRoutes: typeof analyticsRoutes,
  employeeRoutes: typeof employeeRoutes,
  reportsRoutes: typeof reportsRoutes,
});


app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/company', protectedCompanyRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payroll', payrollRoutes);

// ============================================
// ERROR HANDLERS
// ============================================

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ 
    success: false,
    error: 'Not Found', 
    path: req.originalUrl,
    message: 'The requested resource does not exist',
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  const isDev = NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(isDev && { stack: err.stack }),
  });
});

module.exports = app;